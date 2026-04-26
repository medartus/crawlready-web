/**
 * Agent Readiness Score (0-100)
 *
 * Measures: Can AI agents act on your content?
 * Four checks: A1 Structured Data Completeness (25),
 * A2 Content Negotiation Readiness (25), A3 Machine-Actionable Data (30),
 * A4 Standards Adoption (20).
 *
 * See docs/architecture/scoring-detail.md § Sub-Score 2.
 */

import type { BotFetchResult } from '@/lib/crawl/bot-fetch';

import {
  extractElements,
  extractJsonLd,
  extractMetaTags,
  extractVisibleText,
  getAttr,
  innerText,
} from './html-utils';

export type AgentReadinessInput = {
  botHtml: string;
  renderedHtml: string;
  botFetch: BotFetchResult;
  responseHeaders?: Record<string, string>;
};

export type StandardsProbeResult = {
  robotsTxtBody: string | null;
  sitemapStatus: number;
  sitemapContentType: string | null;
  mcpCardStatus: number;
  apiCatalogStatus: number;
};

export type AgentReadinessResult = {
  score: number;
  a1StructuredData: number;
  a2ContentNegotiation: number;
  a3MachineActionable: number;
  a4StandardsAdoption: number;
};

// ── A1: Structured Data Completeness (0-25) ──────────────────────

function scoreStructuredData(botHtml: string): number {
  const metas = extractMetaTags(botHtml);
  let score = 0;

  // OpenGraph basics (4)
  if (metas.get('og:title') && metas.get('og:description') && metas.get('og:image')) {
    score += 4;
  }

  // OpenGraph type (2)
  if (metas.get('og:type')) {
    score += 2;
  }

  // Schema.org with key properties (6)
  const jsonLds = extractJsonLd(botHtml);
  const hasRichSchema = jsonLds.some((ld) => {
    if (typeof ld !== 'object' || ld === null || !('@type' in ld)) {
      return false;
    }
    const props = Object.keys(ld).filter(k => k !== '@type' && k !== '@context' && k !== 'name');
    return props.length >= 3;
  });
  if (hasRichSchema) {
    score += 6;
  }

  // Product/pricing data structured (7)
  const hasProductSchema = jsonLds.some((ld) => {
    if (typeof ld !== 'object' || ld === null) {
      return false;
    }
    const rec = ld as Record<string, unknown>;
    const typeVal = String(rec['@type'] ?? '').toLowerCase();
    const isProduct = typeVal === 'product' || typeVal === 'softwareapplication';
    return isProduct && 'offers' in rec;
  });
  // Also check for pricing in HTML tables
  const lowerHtml = botHtml.toLowerCase();
  const hasPricingTable = lowerHtml.includes('<table') && /[€$£]|price|pricing/i.test(lowerHtml);
  if (hasProductSchema || hasPricingTable) {
    score += 7;
  }

  // Twitter Card (2)
  if (metas.get('twitter:card') && metas.get('twitter:title')) {
    score += 2;
  }

  // Canonical URL (4)
  if (botHtml.match(/<link[^>]+rel\s*=\s*["']canonical["'][^>]+href\s*=\s*["'][^"']+["']/i)) {
    score += 4;
  }

  return score;
}

// ── A2: Content Negotiation Readiness (0-25) ─────────────────────

function scoreContentNegotiation(botFetch: BotFetchResult): number {
  let score = 0;

  // Accept: text/markdown returns Markdown (12)
  if (botFetch.supportsMarkdownNegotiation) {
    score += 12;
  }

  // llms.txt present (7)
  if (botFetch.hasLlmsTxt) {
    score += 7;
  }

  return score;
}

function scoreContentNegotiationLinkCheck(botHtml: string, baseScore: number): number {
  let score = baseScore;

  // JSON feed or API docs link (6)
  const hasApiLink = botHtml.match(/<a[^>]+href\s*=\s*["'][^"']*(\/api|\/docs)["']/i);
  const hasJsonAlternate = botHtml.match(/<link[^>]+rel\s*=\s*["']alternate["'][^>]+type\s*=\s*["']application\/json["']/i);
  if (hasApiLink || hasJsonAlternate) {
    score += 6;
  }

  return score;
}

// ── A3: Machine-Actionable Data Availability (0-30) ──────────────

function scoreMachineActionable(botHtml: string, renderedHtml: string): number {
  let score = 0;

  // Key facts in structured HTML (9)
  const lowerBot = botHtml.toLowerCase();
  const hasPricingTable = lowerBot.includes('<table') && /[$€£]|price|pricing|feature|contact/i.test(lowerBot);
  const hasSchemaFacts = extractJsonLd(botHtml).some((ld) => {
    if (typeof ld !== 'object' || ld === null) {
      return false;
    }
    const rec = ld as Record<string, unknown>;
    return 'offers' in rec || 'price' in rec || 'telephone' in rec || 'email' in rec;
  });
  if (hasPricingTable || hasSchemaFacts) {
    score += 9;
  }

  // Clear heading hierarchy (6)
  const h1Count = (botHtml.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (botHtml.match(/<h2[\s>]/gi) || []).length;
  if (h1Count >= 1 && h2Count >= 1) {
    score += 6;
  }

  // Actionable CTAs discoverable (8)
  const ctaPatterns = /sign\s*up|get\s*started|pricing|docs|api|contact|free\s*trial|demo/i;
  const anchors = extractElements(botHtml, 'a');
  const hasCtas = anchors.some(a => ctaPatterns.test(innerText(a)) || ctaPatterns.test(getAttr(a, 'href') || ''));
  if (hasCtas) {
    score += 8;
  }

  // No critical data behind JS only (7)
  const renderedText = extractVisibleText(renderedHtml);
  const botText = extractVisibleText(botHtml);
  if (renderedText.length > 0) {
    const ratio = botText.length / renderedText.length;
    if (ratio >= 0.5) {
      score += 7;
    }
  }

  return score;
}

// ── A4: Standards Adoption (0-20) ────────────────────────────────

const AI_BOT_NAMES = [
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'claudebot',
  'perplexitybot',
  'google-extended',
  'applebot-extended',
  'meta-externalagent',
  'bytespider',
];

function scoreStandardsAdoption(
  probes: StandardsProbeResult,
  responseHeaders?: Record<string, string>,
): number {
  let score = 0;

  // robots.txt AI bot rules (0/3/5)
  if (probes.robotsTxtBody) {
    const lower = probes.robotsTxtBody.toLowerCase();
    const hasAiBotRule = AI_BOT_NAMES.some(bot => lower.includes(`user-agent: ${bot}`));
    if (hasAiBotRule) {
      score += 5;
    } else if (lower.includes('user-agent: *')) {
      score += 3;
    }
  }

  // Content-Signal directive (3)
  if (probes.robotsTxtBody) {
    const hasContentSignal = /content-signal:/i.test(probes.robotsTxtBody);
    if (hasContentSignal) {
      score += 3;
    }
  }

  // Sitemap.xml presence (0/2/4)
  if (probes.sitemapStatus === 200) {
    if (probes.sitemapContentType && probes.sitemapContentType.includes('xml')) {
      score += 4;
    } else {
      score += 2;
    }
  }

  // Link Headers (3)
  if (responseHeaders) {
    const linkHeader = responseHeaders.link || responseHeaders.Link || '';
    const discoveryRels = [
      'api-catalog',
      'describedby',
      'service-doc',
      'alternate',
      'canonical',
    ];
    const hasDiscoveryLink = discoveryRels.some(rel => linkHeader.includes(rel));
    if (hasDiscoveryLink) {
      score += 3;
    }
  }

  // MCP Server Card (3)
  if (probes.mcpCardStatus === 200) {
    score += 3;
  }

  // API Catalog (2)
  if (probes.apiCatalogStatus === 200) {
    score += 2;
  }

  return score;
}

// ── Standards probes (HEAD requests) ─────────────────────────────

const PROBE_TIMEOUT_MS = 10_000;

async function headRequest(url: string): Promise<{ status: number; contentType: string | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    return { status: res.status, contentType: res.headers.get('content-type') };
  } catch {
    return { status: 0, contentType: null };
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (res.ok) {
      return await res.text();
    }
    return null;
  } catch {
    return null;
  }
}

export async function runStandardsProbes(url: string): Promise<StandardsProbeResult> {
  const origin = new URL(url).origin;

  const [robotsTxt, sitemap, mcpCard, apiCatalog] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    headRequest(`${origin}/sitemap.xml`),
    headRequest(`${origin}/.well-known/mcp/server-card.json`),
    headRequest(`${origin}/.well-known/api-catalog`),
  ]);

  return {
    robotsTxtBody: robotsTxt,
    sitemapStatus: sitemap.status,
    sitemapContentType: sitemap.contentType,
    mcpCardStatus: mcpCard.status,
    apiCatalogStatus: apiCatalog.status,
  };
}

// ── Public API ───────────────────────────────────────────────────

export function scoreAgentReadiness(
  input: AgentReadinessInput,
  probes: StandardsProbeResult,
): AgentReadinessResult {
  const a1 = scoreStructuredData(input.botHtml);
  const a2base = scoreContentNegotiation(input.botFetch);
  const a2 = scoreContentNegotiationLinkCheck(input.botHtml, a2base);
  const a3 = scoreMachineActionable(input.botHtml, input.renderedHtml);
  const a4 = scoreStandardsAdoption(probes, input.responseHeaders);

  return {
    score: a1 + a2 + a3 + a4,
    a1StructuredData: a1,
    a2ContentNegotiation: a2,
    a3MachineActionable: a3,
    a4StandardsAdoption: a4,
  };
}
