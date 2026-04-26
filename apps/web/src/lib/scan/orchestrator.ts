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
import type { AgentReadinessInput } from '@/lib/scoring/agent-readiness';
import { analyzeSchemaPreview } from '@/lib/scoring/schema-preview';
import type { VisualDiffResult } from '@/lib/scoring/visual-diff';
import { computeVisualDiff } from '@/lib/scoring/visual-diff';

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
};

const CACHE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check the DB for a recent scan of this URL within 24h.
 */
async function checkCache(url: string): Promise<ScanResult | null> {
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
  };
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

  // 6. Store in DB
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
    })
    .returning({ id: schema.scans.id });

  // 7. Return
  return {
    id: inserted!.id,
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
  };
}
