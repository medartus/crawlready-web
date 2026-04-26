import { describe, expect, it } from 'vitest';

import { scoreCrawlability } from '../crawlability';

const WELL_STRUCTURED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="description" content="A sample site for testing scoring.">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Acme","url":"https://acme.com","description":"We build widgets","contactPoint":{"@type":"ContactPoint","telephone":"+1-555-0100"}}</script>
</head>
<body>
  <h1>Welcome to Acme</h1>
  <h2>Our Products</h2>
  <p>We sell high-quality widgets that are perfect for developers who want to build great things quickly.</p>
  <p>Our products are used by thousands of companies around the world for their daily operations.</p>
  <p>Contact us today to learn more about how we can help your business grow faster.</p>
  <ul><li>Widget A</li><li>Widget B</li></ul>
  <h2>Pricing</h2>
  <table><tr><td>Starter</td><td>$29/mo</td></tr></table>
</body>
</html>`;

const EMPTY_HTML = '';

const MINIMAL_BOT_HTML = '<html><body><noscript>Enable JS</noscript></body></html>';

describe('scoreCrawlability', () => {
  it('scores a well-structured page with matching bot/rendered HTML', () => {
    const result = scoreCrawlability(WELL_STRUCTURED_HTML, WELL_STRUCTURED_HTML, 200);

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.c1ContentVisibility).toBe(35);
    expect(result.c2StructuralClarity).toBeGreaterThanOrEqual(15);
    expect(result.c4SchemaPresence).toBeGreaterThanOrEqual(10);
  });

  it('scores 0 for C1 when bot fetch returns non-200', () => {
    const result = scoreCrawlability(WELL_STRUCTURED_HTML, WELL_STRUCTURED_HTML, 403);

    expect(result.c1ContentVisibility).toBe(0);
  });

  it('scores 0 for C1 when rendered HTML is too short', () => {
    const result = scoreCrawlability('<p>Hi</p>', '<p>Hi</p>', 200);

    expect(result.c1ContentVisibility).toBe(0);
  });

  it('detects low visibility when bot sees much less than rendered', () => {
    const result = scoreCrawlability(WELL_STRUCTURED_HTML, MINIMAL_BOT_HTML, 200);

    expect(result.c1ContentVisibility).toBeLessThanOrEqual(8);
    expect(result.details.visibilityRatio).toBeLessThan(0.2);
  });

  it('scores 0 for empty HTML', () => {
    const result = scoreCrawlability(EMPTY_HTML, EMPTY_HTML, 200);

    expect(result.score).toBe(0);
  });

  it('detects JSON-LD schema presence', () => {
    const htmlWithSchema = `<html><body>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Widget","offers":{"@type":"Offer","price":"29.99"}}</script>
      <p>Content here that is long enough to be substantial for the test purposes.</p>
    </body></html>`;

    const result = scoreCrawlability(htmlWithSchema, htmlWithSchema, 200);

    expect(result.c4SchemaPresence).toBeGreaterThanOrEqual(15);
    expect(result.details.jsonLdCount).toBeGreaterThanOrEqual(1);
  });

  it('returns all sub-scores summing to total', () => {
    const result = scoreCrawlability(WELL_STRUCTURED_HTML, WELL_STRUCTURED_HTML, 200);

    expect(result.score).toBe(
      result.c1ContentVisibility
      + result.c2StructuralClarity
      + result.c3NoiseRatio
      + result.c4SchemaPresence,
    );
  });
});
