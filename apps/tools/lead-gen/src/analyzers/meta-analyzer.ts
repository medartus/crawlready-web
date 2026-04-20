/**
 * Meta Tags Analyzer
 * Checks SEO meta tags in raw vs rendered HTML to detect JS-injected metadata
 */

import { load, type CheerioAPI } from 'cheerio';
import type { MetaTagsResult } from '../types.js';
import { logger } from '../utils/logger.js';

interface MetaTagData {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  schemaOrg: object[] | null;
}

/**
 * Extract meta tags from HTML
 */
function extractMetaTags($: CheerioAPI): MetaTagData {
  // Title
  const title = $('title').first().text().trim() || null;

  // Meta description
  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="description"]').attr('content')?.trim() ||
    null;

  // Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim() || null;
  const ogDescription =
    $('meta[property="og:description"]').attr('content')?.trim() || null;
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || null;

  // Schema.org JSON-LD
  const schemaOrg: object[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      schemaOrg.push(json);
    } catch {
      // Ignore JSON parse errors
    }
  });

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    schemaOrg: schemaOrg.length > 0 ? schemaOrg : null,
  };
}

/**
 * Analyze meta tags comparing raw vs rendered HTML
 */
export function analyzeMetaTags(rawHtml: string, renderedHtml: string): MetaTagsResult {
  const log = logger.child('meta-analyzer');

  const $raw = load(rawHtml);
  const $rendered = load(renderedHtml);

  const rawMeta = extractMetaTags($raw);
  const renderedMeta = extractMetaTags($rendered);

  // Detect issues
  const issues = {
    titleMissing: !rawMeta.title && !renderedMeta.title,
    descriptionMissing: !rawMeta.description && !renderedMeta.description,
    ogTagsMissing:
      !rawMeta.ogTitle &&
      !rawMeta.ogDescription &&
      !renderedMeta.ogTitle &&
      !renderedMeta.ogDescription,
    schemaOrgMissing: !rawMeta.schemaOrg && !renderedMeta.schemaOrg,
    // Key check: meta tags present in rendered but not in raw = JS-injected
    metaTagsJsInjected:
      (!rawMeta.title && !!renderedMeta.title) ||
      (!rawMeta.description && !!renderedMeta.description) ||
      (!rawMeta.ogTitle && !!renderedMeta.ogTitle) ||
      (!rawMeta.schemaOrg && !!renderedMeta.schemaOrg),
  };

  if (issues.metaTagsJsInjected) {
    log.info('Detected JS-injected meta tags');
  }

  return {
    url: '', // Will be set by caller
    raw: rawMeta,
    rendered: renderedMeta,
    issues,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Get human-readable interpretation of meta tag issues
 */
export function interpretMetaTagIssues(result: MetaTagsResult): string[] {
  const insights: string[] = [];
  const { issues, raw, rendered } = result;

  // Critical: JS-injected meta tags
  if (issues.metaTagsJsInjected) {
    insights.push(
      'CRITICAL: Meta tags are JS-injected. AI bots that cannot render JavaScript will miss SEO metadata entirely.'
    );

    if (!raw.title && rendered.title) {
      insights.push(`  - Title tag is JS-injected: "${rendered.title}"`);
    }
    if (!raw.description && rendered.description) {
      insights.push(`  - Meta description is JS-injected`);
    }
    if (!raw.ogTitle && rendered.ogTitle) {
      insights.push(`  - OG tags are JS-injected`);
    }
    if (!raw.schemaOrg && rendered.schemaOrg) {
      insights.push(`  - Schema.org data is JS-injected`);
    }
  }

  // Missing meta tags entirely
  if (issues.titleMissing) {
    insights.push('Missing: No title tag found in raw or rendered HTML');
  }
  if (issues.descriptionMissing) {
    insights.push('Missing: No meta description found');
  }
  if (issues.ogTagsMissing) {
    insights.push('Missing: No Open Graph tags (og:title, og:description)');
  }
  if (issues.schemaOrgMissing) {
    insights.push('Missing: No Schema.org structured data');
  }

  // Positive findings
  if (!issues.metaTagsJsInjected && raw.title && raw.description) {
    insights.push('Good: Meta tags are present in raw HTML (no JS required)');
  }
  if (raw.schemaOrg && raw.schemaOrg.length > 0) {
    const types = raw.schemaOrg
      .map((s: object) => (s as { '@type'?: string })['@type'])
      .filter(Boolean);
    insights.push(`Good: Schema.org data found: ${types.join(', ')}`);
  }

  return insights;
}

/**
 * Calculate meta tags score for prioritization
 */
export function calculateMetaTagsScore(result: MetaTagsResult): number {
  let score = 0;

  // Major penalty for JS-injected meta tags
  if (result.issues.metaTagsJsInjected) {
    score += 50; // Very important issue
  }

  // Minor penalties for missing tags
  if (result.issues.titleMissing) score += 10;
  if (result.issues.descriptionMissing) score += 10;
  if (result.issues.ogTagsMissing) score += 5;
  if (result.issues.schemaOrgMissing) score += 5;

  return Math.min(score, 100);
}
