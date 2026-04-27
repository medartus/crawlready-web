import { describe, expect, it } from 'vitest';

import { normalizeUrl } from '../../crawl/normalize-url';
import { computeCompositeScore } from '../../scoring/composite';
import { scoreCrawlability } from '../../scoring/crawlability';
import { computeVisualDiff } from '../../scoring/visual-diff';

/**
 * Orchestrator integration test.
 *
 * Instead of importing the orchestrator (which requires mocking many
 * alias-path imports), we test the orchestrator's component functions
 * directly to verify the pipeline logic is correct.
 *
 * Full end-to-end integration is covered by the pre-seed-sites script
 * and by manual testing against the running dev server.
 */

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="description" content="Test site">
</head>
<body>
  <nav><a href="/">Home</a><a href="/about">About</a><a href="/docs">Docs</a></nav>
  <main>
    <h1>Test Site</h1>
    <h2>Features</h2>
    <p>A paragraph with enough content to pass the minimum threshold for scoring checks.</p>
    <p>Another paragraph with enough content for the structural clarity scoring check.</p>
    <p>A third paragraph to meet the requirement of at least three substantial paragraphs.</p>
  </main>
</body>
</html>`;

const BOT_HTML = `<html><body>
  <h1>Test Site</h1>
  <p>A paragraph with enough content to pass the minimum threshold for scoring checks.</p>
</body></html>`;

describe('orchestrator pipeline components', () => {
  it('normalizes URL and extracts domain', () => {
    const result = normalizeUrl('https://www.example.com/pricing/');

    expect(result.domain).toBe('example.com');
    expect(result.url).toBe('https://example.com/pricing/');
  });

  it('crawlability scorer produces valid sub-scores from pipeline HTML', () => {
    const result = scoreCrawlability(SAMPLE_HTML, BOT_HTML, 200);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBe(
      result.c1ContentVisibility
      + result.c2StructuralClarity
      + result.c3NoiseRatio
      + result.c4SchemaPresence,
    );
  });

  it('composite score enforces floor rule when any sub-score is below 20', () => {
    const result = computeCompositeScore(80, 10, 80);

    // Sub-score 10 < 20 triggers floor cap at 60
    expect(result.aiReadinessScore).toBeLessThanOrEqual(60);
  });

  it('composite score produces weighted average', () => {
    const result = computeCompositeScore(100, 100, 100);

    expect(result.aiReadinessScore).toBe(100);
  });

  it('visual diff detects JS-invisible content in pipeline context', () => {
    const diff = computeVisualDiff(SAMPLE_HTML, BOT_HTML);

    expect(diff.stats.jsInvisibleCount).toBeGreaterThan(0);
    expect(diff.stats.visibilityRatio).toBeLessThan(100);
    expect(diff.blocks.length).toBeGreaterThan(0);
  });

  it('produces a visual diff with valid stats shape', () => {
    const diff = computeVisualDiff(SAMPLE_HTML, BOT_HTML);

    expect(diff.stats).toHaveProperty('renderedBlockCount');
    expect(diff.stats).toHaveProperty('botBlockCount');
    expect(diff.stats).toHaveProperty('jsInvisibleCount');
    expect(diff.stats).toHaveProperty('botOnlyCount');
    expect(diff.stats).toHaveProperty('visibilityRatio');
    expect(diff.stats).toHaveProperty('renderedTextLength');
    expect(diff.stats).toHaveProperty('botTextLength');
  });
});
