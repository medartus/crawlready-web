import { describe, expect, it } from 'vitest';

import { computeVisualDiff } from '../visual-diff';

const RENDERED_HTML = `<html><body>
  <h1>Welcome to Acme</h1>
  <p>We build high-quality widgets for developers around the world today.</p>
  <p>Our products are used by thousands of companies for their daily work.</p>
  <div id="js-content">
    <p>This section is loaded dynamically via JavaScript on the client side.</p>
  </div>
</body></html>`;

const BOT_HTML = `<html><body>
  <h1>Welcome to Acme</h1>
  <p>We build high-quality widgets for developers around the world today.</p>
  <p>Our products are used by thousands of companies for their daily work.</p>
  <p>This is extra content that the server-rendered bot HTML includes from the fallback template.</p>
</body></html>`;

const IDENTICAL_HTML = `<html><body>
  <h1>Hello World</h1>
  <p>This is a paragraph with enough text to form a meaningful block.</p>
  <p>Another paragraph that appears in both rendered and bot views equally.</p>
</body></html>`;

const EMPTY_HTML = '';

describe('computeVisualDiff', () => {
  it('identifies all blocks as visible when rendered and bot HTML are identical', () => {
    const result = computeVisualDiff(IDENTICAL_HTML, IDENTICAL_HTML);

    expect(result.stats.jsInvisibleCount).toBe(0);
    expect(result.stats.botOnlyCount).toBe(0);
    expect(result.stats.visibilityRatio).toBe(100);
    expect(result.blocks.every(b => b.status === 'visible')).toBe(true);
  });

  it('detects JS-invisible blocks when rendered has more content than bot', () => {
    const result = computeVisualDiff(RENDERED_HTML, BOT_HTML);

    expect(result.stats.jsInvisibleCount).toBeGreaterThanOrEqual(1);
    expect(result.stats.visibilityRatio).toBeLessThan(100);

    const jsInvisible = result.blocks.filter(b => b.status === 'js-invisible');

    expect(jsInvisible.length).toBeGreaterThanOrEqual(1);
    expect(jsInvisible.some(b => b.text.toLowerCase().includes('dynamically'))).toBe(true);
  });

  it('detects bot-only blocks (e.g. noscript content)', () => {
    const result = computeVisualDiff(RENDERED_HTML, BOT_HTML);

    const botOnly = result.blocks.filter(b => b.status === 'bot-only');

    expect(botOnly.length).toBeGreaterThanOrEqual(1);
    expect(botOnly.some(b => b.text.toLowerCase().includes('fallback'))).toBe(true);
    expect(result.stats.botOnlyCount).toBeGreaterThanOrEqual(1);
  });

  it('handles empty HTML gracefully', () => {
    const result = computeVisualDiff(EMPTY_HTML, EMPTY_HTML);

    expect(result.blocks).toHaveLength(0);
    expect(result.stats.renderedBlockCount).toBe(0);
    expect(result.stats.botBlockCount).toBe(0);
    expect(result.stats.visibilityRatio).toBe(100);
  });

  it('handles empty bot HTML (full CSR page)', () => {
    const result = computeVisualDiff(RENDERED_HTML, EMPTY_HTML);

    expect(result.stats.jsInvisibleCount).toBe(result.stats.renderedBlockCount);
    expect(result.stats.visibilityRatio).toBe(0);
    expect(result.blocks.filter(b => b.status === 'js-invisible').length).toBe(result.stats.renderedBlockCount);
  });

  it('returns correct text lengths in stats', () => {
    const result = computeVisualDiff(RENDERED_HTML, BOT_HTML);

    expect(result.stats.renderedTextLength).toBeGreaterThan(0);
    expect(result.stats.botTextLength).toBeGreaterThan(0);
    // Bot HTML has extra fallback content, so bot text may be longer
    expect(result.stats.renderedTextLength).not.toBe(result.stats.botTextLength);
  });

  it('produces blocks with correct boolean flags', () => {
    const result = computeVisualDiff(RENDERED_HTML, BOT_HTML);

    for (const block of result.blocks) {
      if (block.status === 'visible') {
        expect(block.inBotView).toBe(true);
        expect(block.inRenderedView).toBe(true);
      } else if (block.status === 'js-invisible') {
        expect(block.inBotView).toBe(false);
        expect(block.inRenderedView).toBe(true);
      } else if (block.status === 'bot-only') {
        expect(block.inBotView).toBe(true);
        expect(block.inRenderedView).toBe(false);
      }
    }
  });
});
