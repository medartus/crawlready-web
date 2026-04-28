/**
 * Scan Orchestrator — coordinates the full diagnostic pipeline.
 *
 * 1. Normalize URL
 * 2. Check 24h cache (DB lookup)
 * 3. Crawl (provider + bot-fetch in parallel)
 * 4. Score (crawlability + agent readiness + agent interaction)
 * 5. Compute composite score, EU AI Act, schema preview, recommendations
 * 6. Store in DB
 * 7. Return result
 *
 * See docs/architecture/api-first.md § "What Is a Scan?"
 */

import { schema } from '@crawlready/database';
import { and, desc, eq, gte } from 'drizzle-orm';

import { botFetch } from '@/lib/crawl/bot-fetch';
import { normalizeUrl } from '@/lib/crawl/normalize-url';
import type { CrawlProvider } from '@/lib/crawl/provider';
import {
  computeCompositeScore,
  generateRecommendations,
  runStandardsProbes,
  scoreAgentInteraction,
  scoreAgentReadiness,
  scoreCrawlability,
  scoreEuAiAct,
} from '@/lib/scoring';
import type { AgentInteractionResult } from '@/lib/scoring/agent-interaction';
import type { AgentReadinessInput, AgentReadinessResult } from '@/lib/scoring/agent-readiness';
import type { CrawlabilityResult } from '@/lib/scoring/crawlability';
import { analyzeSchemaPreview } from '@/lib/scoring/schema-preview';
import type { VisualDiffResult } from '@/lib/scoring/visual-diff';
import { computeVisualDiff } from '@/lib/scoring/visual-diff';
import type { ScoreBreakdown, SubCheckScore } from '@/types/scan';

import { getDb } from './db-helper';

export type ScanWarning = {
  code: string;
  message: string;
};

export type ScanResult = {
  id: number;
  url: string;
  domain: string;
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  euAiAct: { passed: number; total: number; checks: Array<{ name: string; passed: boolean }> };
  recommendations: Array<{
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    impact: string;
  }>;
  schemaPreview: {
    detectedTypes: Array<{ type: string; properties: number }>;
    generatable: Array<{ type: string; confidence: number; reason: string }>;
  };
  visualDiff: VisualDiffResult | null;
  rawHtmlSize: number | null;
  markdownSize: number | null;
  scannedAt: string;
  cached: boolean;
  warnings: ScanWarning[];
  scoreBreakdown: ScoreBreakdown | null;
};

const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkStatus(score: number, maxScore: number): 'pass' | 'partial' | 'fail' {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) {
    return 'pass';
  }
  if (ratio >= 0.4) {
    return 'partial';
  }
  return 'fail';
}

function buildScoreBreakdown(
  crawlability: CrawlabilityResult,
  agentReadiness: AgentReadinessResult,
  agentInteraction: AgentInteractionResult,
): ScoreBreakdown {
  const c: SubCheckScore[] = [
    { id: 'c1', label: 'Content Visibility', score: crawlability.c1ContentVisibility, maxScore: 35, status: checkStatus(crawlability.c1ContentVisibility, 35) },
    { id: 'c2', label: 'Structural Clarity', score: crawlability.c2StructuralClarity, maxScore: 25, status: checkStatus(crawlability.c2StructuralClarity, 25) },
    { id: 'c3', label: 'Noise Ratio', score: crawlability.c3NoiseRatio, maxScore: 20, status: checkStatus(crawlability.c3NoiseRatio, 20) },
    { id: 'c4', label: 'Schema.org Presence', score: crawlability.c4SchemaPresence, maxScore: 20, status: checkStatus(crawlability.c4SchemaPresence, 20) },
  ];

  const a: SubCheckScore[] = [
    { id: 'a1', label: 'Structured Data', score: agentReadiness.a1StructuredData, maxScore: 25, status: checkStatus(agentReadiness.a1StructuredData, 25) },
    { id: 'a2', label: 'Content Negotiation', score: agentReadiness.a2ContentNegotiation, maxScore: 25, status: checkStatus(agentReadiness.a2ContentNegotiation, 25) },
    { id: 'a3', label: 'Machine-Actionable Data', score: agentReadiness.a3MachineActionable, maxScore: 30, status: checkStatus(agentReadiness.a3MachineActionable, 30) },
    { id: 'a4', label: 'Standards Adoption', score: agentReadiness.a4StandardsAdoption, maxScore: 20, status: checkStatus(agentReadiness.a4StandardsAdoption, 20) },
  ];

  const i: SubCheckScore[] = [
    { id: 'i1', label: 'Semantic HTML', score: agentInteraction.i1SemanticHtml, maxScore: 25, status: checkStatus(agentInteraction.i1SemanticHtml, 25) },
    { id: 'i2', label: 'Accessibility', score: agentInteraction.i2Accessibility, maxScore: 30, status: checkStatus(agentInteraction.i2Accessibility, 30) },
    { id: 'i3', label: 'Navigation & Structure', score: agentInteraction.i3Navigation, maxScore: 25, status: checkStatus(agentInteraction.i3Navigation, 25) },
    { id: 'i4', label: 'Visual-Semantic Consistency', score: agentInteraction.i4VisualSemantic, maxScore: 20, status: checkStatus(agentInteraction.i4VisualSemantic, 20) },
  ];

  return {
    crawlability: { label: 'Crawlability', score: crawlability.score, weight: '50%', checks: c },
    agentReadiness: { label: 'Agent Readiness', score: agentReadiness.score, weight: '25%', checks: a },
    agentInteraction: { label: 'Agent Interaction', score: agentInteraction.score, weight: '25%', checks: i },
  };
}

/**
 * Check the DB for a recent scan of this URL within 24h.
 */
function isDbAvailable(): boolean {
  try {
    const db = getDb();
    return db != null;
  } catch {
    return false;
  }
}

async function checkCache(url: string): Promise<ScanResult | null> {
  if (!isDbAvailable()) {
    return null;
  }

  try {
    const db = getDb();
    const cutoff = new Date(Date.now() - CACHE_WINDOW_MS);

    const rows = await db
      .select()
      .from(schema.scans)
      .where(and(eq(schema.scans.url, url), gte(schema.scans.scannedAt, cutoff)))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      url: row.url,
      domain: row.domain,
      aiReadinessScore: row.aiReadinessScore,
      crawlabilityScore: row.crawlabilityScore,
      agentReadinessScore: row.agentReadinessScore,
      agentInteractionScore: row.agentInteractionScore,
      euAiAct: (row.euAiAct ?? { passed: 0, total: 4, checks: [] }) as ScanResult['euAiAct'],
      recommendations: (row.recommendations ?? []) as ScanResult['recommendations'],
      schemaPreview: (row.schemaPreview ?? { detectedTypes: [], generatable: [] }) as ScanResult['schemaPreview'],
      visualDiff: (row.visualDiff ?? null) as VisualDiffResult | null,
      rawHtmlSize: row.rawHtmlSize,
      markdownSize: row.markdownSize,
      scannedAt: row.scannedAt.toISOString(),
      cached: true,
      warnings: (row.warnings ?? []) as ScanWarning[],
      scoreBreakdown: (row.scoreBreakdown ?? null) as ScoreBreakdown | null,
    };
  } catch (err) {
    console.warn('Cache check failed (DB unavailable), proceeding without cache:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Run a full diagnostic scan on a URL.
 */
export async function runScan(
  inputUrl: string,
  crawlProvider: CrawlProvider,
): Promise<ScanResult> {
  // 1. Normalize
  const { url, domain } = normalizeUrl(inputUrl);

  // 2. Check cache
  const cached = await checkCache(url);
  if (cached) {
    return cached;
  }

  // 3. Crawl (provider + bot-fetch + standards probes in parallel)
  const [crawlResult, botResult, standardsProbes] = await Promise.all([
    crawlProvider.scrape(url),
    botFetch(url),
    runStandardsProbes(url),
  ]);

  // 3b. Detect edge cases and collect warnings
  const warnings: ScanWarning[] = [];

  // Bot blocked (403/429)
  if (botResult.botStatusCode === 403 || botResult.botStatusCode === 429) {
    warnings.push({
      code: 'BOT_BLOCKED',
      message: `This site blocks AI crawlers (HTTP ${botResult.botStatusCode}). Bot-view scoring is limited.`,
    });
  }

  // Bot fetch timeout / network failure
  if (botResult.botStatusCode === 0) {
    warnings.push({
      code: 'BOT_TIMEOUT',
      message: 'Bot-view fetch failed or timed out. Bot-view scoring may be inaccurate.',
    });
  }

  // Empty page
  if (crawlResult.html.length < 50) {
    warnings.push({
      code: 'EMPTY_PAGE',
      message: 'This page appears to be empty — very little content was found.',
    });
  }

  // Login wall detection (common patterns)
  const htmlLower = crawlResult.html.toLowerCase();
  if (
    (htmlLower.includes('sign in') || htmlLower.includes('log in') || htmlLower.includes('login'))
    && crawlResult.html.length < 5000
  ) {
    warnings.push({
      code: 'LOGIN_WALL',
      message: 'This page may require authentication — scoring the public version.',
    });
  }

  // Redirect to different domain
  const crawledDomain = new URL(crawlResult.url).hostname.replace(/^www\./, '');
  if (crawledDomain !== domain) {
    warnings.push({
      code: 'REDIRECT_DOMAIN',
      message: `Redirected to ${crawledDomain}. Scoring the redirected content.`,
    });
  }

  // 4. Score
  const crawlabilityResult = scoreCrawlability(
    crawlResult.html,
    botResult.botHtml,
    botResult.botStatusCode,
  );

  const agentReadinessInput: AgentReadinessInput = {
    botHtml: botResult.botHtml,
    renderedHtml: crawlResult.html,
    botFetch: botResult,
    responseHeaders: botResult.responseHeaders,
  };
  const agentReadinessResult = scoreAgentReadiness(agentReadinessInput, standardsProbes);

  const agentInteractionResult = scoreAgentInteraction(crawlResult.html);

  // 5. Composite + extras
  const composite = computeCompositeScore(
    crawlabilityResult.score,
    agentReadinessResult.score,
    agentInteractionResult.score,
  );

  const euAiActResult = scoreEuAiAct(botResult.botHtml);
  const schemaPreviewResult = analyzeSchemaPreview(botResult.botHtml, crawlResult.html);
  const visualDiff = computeVisualDiff(crawlResult.html, botResult.botHtml);

  const recommendations = generateRecommendations({
    crawlability: crawlabilityResult,
    agentReadiness: agentReadinessResult,
    agentInteraction: agentInteractionResult,
  });

  // 6. Build score breakdown for progressive disclosure UI
  const scoreBreakdown = buildScoreBreakdown(
    crawlabilityResult,
    agentReadinessResult,
    agentInteractionResult,
  );

  // 6b. Store in DB (best-effort)
  let insertedId = 0;
  if (isDbAvailable()) {
    try {
      const db = getDb();
      const [inserted] = await db
        .insert(schema.scans)
        .values({
          url,
          domain,
          scoringVersion: 2,
          aiReadinessScore: composite.aiReadinessScore,
          crawlabilityScore: composite.crawlabilityScore,
          agentReadinessScore: composite.agentReadinessScore,
          agentInteractionScore: composite.agentInteractionScore,
          euAiActPassed: euAiActResult.passed,
          euAiAct: euAiActResult,
          recommendations,
          schemaPreview: schemaPreviewResult,
          rawHtmlSize: crawlResult.html.length,
          markdownSize: crawlResult.markdown.length,
          visualDiff,
          warnings,
          scoreBreakdown,
          // Raw crawl data for offline re-scoring
          crawlHtml: crawlResult.html,
          crawlMarkdown: crawlResult.markdown,
          botHtml: botResult.botHtml,
          botStatusCode: botResult.botStatusCode,
          botHeaders: botResult.responseHeaders,
          standardsProbes,
        })
        .returning({ id: schema.scans.id });
      insertedId = inserted!.id;
    } catch (err) {
      console.warn('DB write failed (DB unavailable), returning result without persistence:', err instanceof Error ? err.message : err);
    }
  }

  // 7. Return
  return {
    id: insertedId,
    url,
    domain,
    aiReadinessScore: composite.aiReadinessScore,
    crawlabilityScore: composite.crawlabilityScore,
    agentReadinessScore: composite.agentReadinessScore,
    agentInteractionScore: composite.agentInteractionScore,
    euAiAct: euAiActResult,
    recommendations,
    schemaPreview: schemaPreviewResult,
    visualDiff,
    rawHtmlSize: crawlResult.html.length,
    markdownSize: crawlResult.markdown.length,
    scannedAt: new Date().toISOString(),
    cached: false,
    warnings,
    scoreBreakdown,
  };
}
