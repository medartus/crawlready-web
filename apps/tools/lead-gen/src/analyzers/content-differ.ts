/**
 * Content Difference Analyzer
 * Compares specific content elements between raw and rendered HTML
 */

import { load, type CheerioAPI } from 'cheerio';
import type { ContentDiffResult } from '../types.js';
import { logger } from '../utils/logger.js';

interface ContentData {
  headings: string[];
  paragraphCount: number;
  linkCount: number;
  imageCount: number;
  textLength: number;
}

/**
 * Extract content metrics from HTML
 */
function extractContentData($: CheerioAPI): ContentData {
  // Remove script and style tags for accurate text measurement
  $('script, style, noscript').remove();

  // Extract headings (H1-H6)
  const headings: string[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 0 && text.length < 200) {
      headings.push(text);
    }
  });

  // Count paragraphs with actual content
  let paragraphCount = 0;
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) {
      // Only count substantial paragraphs
      paragraphCount++;
    }
  });

  // Count links (excluding navigation/footer common patterns)
  let linkCount = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    // Exclude anchors and javascript links
    if (!href.startsWith('#') && !href.startsWith('javascript:')) {
      linkCount++;
    }
  });

  // Count images with src
  const imageCount = $('img[src]').length;

  // Calculate total visible text length
  const textLength = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .trim().length;

  return {
    headings,
    paragraphCount,
    linkCount,
    imageCount,
    textLength,
  };
}

/**
 * Calculate percentage of content lost
 */
function calculatePercentageLost(raw: number, rendered: number): number {
  if (rendered === 0) return 0;
  const diff = rendered - raw;
  return Math.max(0, Math.round((diff / rendered) * 100));
}

/**
 * Analyze content differences between raw and rendered HTML
 */
export function analyzeContentDiff(rawHtml: string, renderedHtml: string): ContentDiffResult {
  const log = logger.child('content-differ');

  const $raw = load(rawHtml);
  const $rendered = load(renderedHtml);

  const rawContent = extractContentData($raw);
  const renderedContent = extractContentData($rendered);

  // Find headings that are missing in raw
  const headingsMissing = renderedContent.headings.filter(
    (h) => !rawContent.headings.some((rh) => rh.toLowerCase() === h.toLowerCase())
  );

  const diff = {
    headingsMissing,
    paragraphsDiff: renderedContent.paragraphCount - rawContent.paragraphCount,
    linksDiff: renderedContent.linkCount - rawContent.linkCount,
    imagesDiff: renderedContent.imageCount - rawContent.imageCount,
    textDiff: renderedContent.textLength - rawContent.textLength,
    percentageLost: calculatePercentageLost(
      rawContent.textLength,
      renderedContent.textLength
    ),
  };

  log.debug('Content diff analysis', {
    rawTextLength: rawContent.textLength,
    renderedTextLength: renderedContent.textLength,
    percentageLost: diff.percentageLost,
  });

  return {
    url: '', // Will be set by caller
    raw: rawContent,
    rendered: renderedContent,
    diff,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Get human-readable interpretation of content differences
 */
export function interpretContentDiff(result: ContentDiffResult): string[] {
  const insights: string[] = [];
  const { raw, rendered, diff } = result;

  // Overall content loss
  if (diff.percentageLost > 70) {
    insights.push(
      `CRITICAL: ${diff.percentageLost}% of content is JS-rendered. AI bots will miss most of the page content.`
    );
  } else if (diff.percentageLost > 40) {
    insights.push(
      `WARNING: ${diff.percentageLost}% of content requires JavaScript to render.`
    );
  } else if (diff.percentageLost > 0) {
    insights.push(`${diff.percentageLost}% of content is JS-rendered.`);
  }

  // Heading analysis
  if (diff.headingsMissing.length > 0) {
    insights.push(
      `JS-rendered headings (${diff.headingsMissing.length}): "${diff.headingsMissing.slice(0, 3).join('", "')}"`
    );
  }

  // Content statistics
  if (diff.paragraphsDiff > 5) {
    insights.push(
      `${diff.paragraphsDiff} paragraphs are JS-rendered (${raw.paragraphCount} → ${rendered.paragraphCount})`
    );
  }

  if (diff.linksDiff > 10) {
    insights.push(
      `${diff.linksDiff} links are JS-rendered (${raw.linkCount} → ${rendered.linkCount})`
    );
  }

  if (diff.imagesDiff > 3) {
    insights.push(
      `${diff.imagesDiff} images are lazy-loaded/JS-rendered (${raw.imageCount} → ${rendered.imageCount})`
    );
  }

  // Text length comparison
  const textRatio = raw.textLength / (rendered.textLength || 1);
  if (textRatio < 0.3) {
    insights.push(
      `Raw HTML contains only ${Math.round(textRatio * 100)}% of rendered text content.`
    );
  }

  return insights;
}

/**
 * Summarize content diff for quick assessment
 */
export function summarizeContentDiff(result: ContentDiffResult): {
  severity: 'critical' | 'warning' | 'ok';
  summary: string;
} {
  const { diff } = result;

  if (diff.percentageLost >= 70) {
    return {
      severity: 'critical',
      summary: `${diff.percentageLost}% content loss - heavy SPA`,
    };
  }

  if (diff.percentageLost >= 40) {
    return {
      severity: 'warning',
      summary: `${diff.percentageLost}% content loss - moderate JS dependency`,
    };
  }

  if (diff.percentageLost >= 20) {
    return {
      severity: 'ok',
      summary: `${diff.percentageLost}% content loss - light JS dependency`,
    };
  }

  return {
    severity: 'ok',
    summary: 'Mostly static content',
  };
}
