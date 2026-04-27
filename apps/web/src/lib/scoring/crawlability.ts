/**
 * Crawlability Score (0-100)
 *
 * Measures: Can AI crawlers see your content?
 * Four checks: C1 Content Visibility (35), C2 Structural Clarity (25),
 * C3 Noise Ratio (20), C4 Schema.org Presence (20).
 *
 * See docs/architecture/scoring-detail.md § Sub-Score 1.
 */

import {
  countTag,
  extractElements,
  extractJsonLd,
  extractVisibleText,
  tokenize,
} from './html-utils';

export type CrawlabilityResult = {
  score: number;
  c1ContentVisibility: number;
  c2StructuralClarity: number;
  c3NoiseRatio: number;
  c4SchemaPresence: number;
  details: {
    visibilityRatio: number;
    renderedTextLength: number;
    botTextLength: number;
    noiseRatio: number;
    jsonLdCount: number;
  };
};

// ── C1: Content Visibility Ratio (0-35) ──────────────────────────

function scoreContentVisibility(renderedHtml: string, botHtml: string, botStatusCode: number): { score: number; ratio: number; renderedLen: number; botLen: number } {
  const renderedText = extractVisibleText(renderedHtml);
  const botText = extractVisibleText(botHtml);

  // Edge: empty page
  if (renderedText.length < 50) {
    return { score: 0, ratio: 0, renderedLen: renderedText.length, botLen: botText.length };
  }

  // Edge: bot fetch failed
  if (botStatusCode !== 200) {
    return { score: 0, ratio: 0, renderedLen: renderedText.length, botLen: botText.length };
  }

  const ratio = botText.length / renderedText.length;

  let score: number;
  if (ratio >= 0.9) {
    score = 35;
  } else if (ratio >= 0.7) {
    score = 25;
  } else if (ratio >= 0.5) {
    score = 15;
  } else if (ratio >= 0.2) {
    score = 8;
  } else {
    score = 0;
  }

  return { score, ratio, renderedLen: renderedText.length, botLen: botText.length };
}

// ── C2: Structural Clarity (0-25) ────────────────────────────────

function scoreStructuralClarity(botHtml: string): number {
  let score = 0;

  // Has exactly one <h1>
  if (countTag(botHtml, 'h1') === 1) {
    score += 5;
  }

  // Has heading hierarchy (at least one <h2>, no skipped levels)
  const hasH1 = countTag(botHtml, 'h1') >= 1;
  const hasH2 = countTag(botHtml, 'h2') >= 1;
  const hasH3 = countTag(botHtml, 'h3') >= 1;
  const hasH4 = countTag(botHtml, 'h4') >= 1;
  if (hasH1 && hasH2) {
    // No skipped levels: h3 requires h2 (guaranteed), h4 requires h3
    const noSkippedLevels = !hasH4 || hasH3;
    if (noSkippedLevels) {
      score += 5;
    }
  }

  // Has <p> content (at least 3 with > 20 chars)
  const paragraphs = extractElements(botHtml, 'p');
  const substantialP = paragraphs.filter(p => extractVisibleText(p).length > 20);
  if (substantialP.length >= 3) {
    score += 5;
  }

  // Has lists or tables
  if (countTag(botHtml, 'ul') >= 1 || countTag(botHtml, 'ol') >= 1 || countTag(botHtml, 'table') >= 1) {
    score += 5;
  }

  // Has <meta description>
  const metaDesc = botHtml.match(/<meta\s+name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']+)["']/i)
    || botHtml.match(/<meta\s+content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']description["']/i);
  if (metaDesc && metaDesc[1] && metaDesc[1].trim().length > 0) {
    score += 5;
  }

  return score;
}

// ── C3: Noise Ratio (0-20) ───────────────────────────────────────

function scoreNoiseRatio(botHtml: string): { score: number; ratio: number } {
  const contentTokens = tokenize(extractVisibleText(botHtml));
  const totalTokens = tokenize(botHtml);

  if (totalTokens.length === 0) {
    return { score: 0, ratio: 1 };
  }

  const ratio = 1 - (contentTokens.length / totalTokens.length);

  let score: number;
  if (ratio < 0.6) {
    score = 20;
  } else if (ratio < 0.75) {
    score = 14;
  } else if (ratio < 0.9) {
    score = 7;
  } else {
    score = 0;
  }

  return { score, ratio };
}

// ── C4: Schema.org Presence (0-20) ───────────────────────────────

const RICH_SCHEMA_TYPES = new Set([
  'product',
  'faqpage',
  'howto',
  'softwareapplication',
  'organization',
  'article',
  'webpage',
]);

function scoreSchemaPresence(botHtml: string): { score: number; count: number } {
  const jsonLds = extractJsonLd(botHtml);

  if (jsonLds.length === 0) {
    return { score: 0, count: 0 };
  }

  let score = 5; // Any JSON-LD present

  // Check for valid JSON-LD with @type
  const hasValidType = jsonLds.some(
    ld => typeof ld === 'object' && ld !== null && '@type' in ld,
  );
  if (hasValidType) {
    score += 5;
  }

  // Check for rich type
  const hasRichType = jsonLds.some((ld) => {
    if (typeof ld !== 'object' || ld === null || !('@type' in ld)) {
      return false;
    }
    const typeVal = (ld as Record<string, unknown>)['@type'];
    const types = Array.isArray(typeVal) ? typeVal : [typeVal];
    return types.some(t => typeof t === 'string' && RICH_SCHEMA_TYPES.has(t.toLowerCase()));
  });
  if (hasRichType) {
    score += 5;
  }

  // Check for multiple types or one with > 5 properties
  const multipleTypes = jsonLds.filter(
    ld => typeof ld === 'object' && ld !== null && '@type' in ld,
  ).length >= 2;
  const richProperties = jsonLds.some((ld) => {
    if (typeof ld !== 'object' || ld === null) {
      return false;
    }
    return Object.keys(ld).length > 5;
  });
  if (multipleTypes || richProperties) {
    score += 5;
  }

  return { score, count: jsonLds.length };
}

// ── Public API ───────────────────────────────────────────────────

export function scoreCrawlability(
  renderedHtml: string,
  botHtml: string,
  botStatusCode: number,
): CrawlabilityResult {
  const c1 = scoreContentVisibility(renderedHtml, botHtml, botStatusCode);
  const c2 = scoreStructuralClarity(botHtml);
  const c3 = scoreNoiseRatio(botHtml);
  const c4 = scoreSchemaPresence(botHtml);

  return {
    score: c1.score + c2 + c3.score + c4.score,
    c1ContentVisibility: c1.score,
    c2StructuralClarity: c2,
    c3NoiseRatio: c3.score,
    c4SchemaPresence: c4.score,
    details: {
      visibilityRatio: c1.ratio,
      renderedTextLength: c1.renderedLen,
      botTextLength: c1.botLen,
      noiseRatio: c3.ratio,
      jsonLdCount: c4.count,
    },
  };
}
