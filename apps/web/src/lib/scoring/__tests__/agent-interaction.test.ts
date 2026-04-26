import { describe, expect, it } from 'vitest';

import { scoreAgentInteraction } from '../agent-interaction';

const SEMANTIC_HTML = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>
  <header><nav><a href="/">Home</a><a href="/about">About</a><a href="/pricing">Pricing</a><a href="/docs">Docs</a></nav></header>
  <main id="main-content">
    <h1>Product</h1>
    <p>Description of the product that is long enough for testing.</p>
    <form>
      <label for="email">Email</label>
      <input id="email" type="email" />
      <button type="submit">Get Started</button>
    </form>
    <img src="/hero.png" alt="Product screenshot" />
  </main>
  <footer><p>Copyright 2024</p></footer>
</body>
</html>`;

const DIV_SOUP = `<!DOCTYPE html>
<html>
<body>
  <div class="header"><div onclick="menu()">Menu</div></div>
  <div class="main">
    <div class="title">Product</div>
    <div class="text">Some content here for testing.</div>
    <div role="button" onclick="signup()"><svg><path d="M1 1"/></svg></div>
  </div>
</body>
</html>`;

describe('scoreAgentInteraction', () => {
  it('scores semantic HTML highly', () => {
    const result = scoreAgentInteraction(SEMANTIC_HTML);

    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.i1SemanticHtml).toBeGreaterThanOrEqual(15);
    expect(result.i2Accessibility).toBeGreaterThanOrEqual(18);
  });

  it('scores div-soup lower for semantic HTML quality', () => {
    const result = scoreAgentInteraction(DIV_SOUP);

    expect(result.i1SemanticHtml).toBeLessThan(15);
  });

  it('returns all sub-scores summing to total', () => {
    const result = scoreAgentInteraction(SEMANTIC_HTML);

    expect(result.score).toBe(
      result.i1SemanticHtml
      + result.i2Accessibility
      + result.i3Navigation
      + result.i4VisualSemantic,
    );
  });

  it('detects navigation with internal links', () => {
    const result = scoreAgentInteraction(SEMANTIC_HTML);

    expect(result.i3Navigation).toBeGreaterThanOrEqual(15);
  });

  it('handles empty HTML gracefully', () => {
    const result = scoreAgentInteraction('');

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
