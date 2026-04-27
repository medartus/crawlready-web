import { describe, expect, it } from 'vitest';

import type { AgentReadinessInput, StandardsProbeResult } from '../agent-readiness';
import { scoreAgentReadiness } from '../agent-readiness';

const RICH_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta property="og:title" content="Acme Inc">
  <meta property="og:description" content="We build widgets">
  <meta property="og:image" content="https://acme.com/og.png">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Acme Inc">
  <link rel="canonical" href="https://acme.com">
  <script type="application/ld+json">{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Acme",
    "url": "https://acme.com",
    "description": "We build widgets",
    "contactPoint": { "@type": "ContactPoint", "telephone": "+1-555-0100" }
  }</script>
</head>
<body>
  <h1>Welcome to Acme</h1>
  <h2>Pricing</h2>
  <table><tr><td>Starter</td><td>$29/mo</td></tr></table>
  <p>Contact us for more information about our services and products.</p>
  <a href="/docs">Documentation</a>
  <a href="/pricing">Pricing</a>
  <a href="/contact">Contact</a>
  <a href="/api">API</a>
</body>
</html>`;

const MINIMAL_HTML = `<html><body><p>Hello world</p></body></html>`;

const FULL_STANDARDS: StandardsProbeResult = {
  robotsTxtBody: 'User-agent: GPTBot\nAllow: /\nContent-Signal: ai-input',
  sitemapStatus: 200,
  sitemapContentType: 'application/xml',
  mcpCardStatus: 200,
  apiCatalogStatus: 200,
};

const NO_STANDARDS: StandardsProbeResult = {
  robotsTxtBody: null,
  sitemapStatus: 404,
  sitemapContentType: null,
  mcpCardStatus: 404,
  apiCatalogStatus: 404,
};

function makeInput(
  overrides: Partial<AgentReadinessInput> = {},
): AgentReadinessInput {
  return {
    botHtml: RICH_HTML,
    renderedHtml: RICH_HTML,
    botFetch: {
      botHtml: RICH_HTML,
      botStatusCode: 200,
      supportsMarkdownNegotiation: false,
      negotiatedMarkdown: null,
      hasLlmsTxt: false,
      llmsTxtContent: null,
      responseHeaders: {},
    },
    responseHeaders: {},
    ...overrides,
  };
}

describe('scoreAgentReadiness', () => {
  it('scores a rich page higher than a minimal page', () => {
    const richResult = scoreAgentReadiness(makeInput(), NO_STANDARDS);
    const minimalResult = scoreAgentReadiness(
      makeInput({ botHtml: MINIMAL_HTML, renderedHtml: MINIMAL_HTML }),
      NO_STANDARDS,
    );

    expect(richResult.score).toBeGreaterThan(minimalResult.score);
  });

  it('returns a score in the 0-100 range', () => {
    const result = scoreAgentReadiness(makeInput(), FULL_STANDARDS);

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('sub-scores sum to the total', () => {
    const result = scoreAgentReadiness(makeInput(), FULL_STANDARDS);

    expect(result.score).toBe(
      result.a1StructuredData
      + result.a2ContentNegotiation
      + result.a3MachineActionable
      + result.a4StandardsAdoption,
    );
  });

  it('awards A2 points for markdown negotiation support', () => {
    const withMd = scoreAgentReadiness(
      makeInput({
        botFetch: {
          botHtml: RICH_HTML,
          botStatusCode: 200,
          supportsMarkdownNegotiation: true,
          negotiatedMarkdown: '# Hello\nContent here',
          hasLlmsTxt: false,
          llmsTxtContent: null,
          responseHeaders: {},
        },
      }),
      NO_STANDARDS,
    );
    const withoutMd = scoreAgentReadiness(makeInput(), NO_STANDARDS);

    expect(withMd.a2ContentNegotiation).toBeGreaterThan(withoutMd.a2ContentNegotiation);
  });

  it('awards A2 points for llms.txt presence', () => {
    const withLlms = scoreAgentReadiness(
      makeInput({
        botFetch: {
          botHtml: RICH_HTML,
          botStatusCode: 200,
          supportsMarkdownNegotiation: false,
          negotiatedMarkdown: null,
          hasLlmsTxt: true,
          llmsTxtContent: '# Acme\n> Description',
          responseHeaders: {},
        },
      }),
      NO_STANDARDS,
    );
    const withoutLlms = scoreAgentReadiness(makeInput(), NO_STANDARDS);

    expect(withLlms.a2ContentNegotiation).toBeGreaterThan(withoutLlms.a2ContentNegotiation);
  });

  it('awards A4 points for standards adoption', () => {
    const withStandards = scoreAgentReadiness(makeInput(), FULL_STANDARDS);
    const withoutStandards = scoreAgentReadiness(makeInput(), NO_STANDARDS);

    expect(withStandards.a4StandardsAdoption).toBeGreaterThan(withoutStandards.a4StandardsAdoption);
  });

  it('awards A1 points for structured data (OG tags, JSON-LD, canonical)', () => {
    const result = scoreAgentReadiness(makeInput(), NO_STANDARDS);

    // RICH_HTML has OG tags, JSON-LD, canonical, twitter card
    expect(result.a1StructuredData).toBeGreaterThanOrEqual(10);
  });

  it('scores 0 on A1 for minimal HTML without any structured data', () => {
    const result = scoreAgentReadiness(
      makeInput({ botHtml: MINIMAL_HTML, renderedHtml: MINIMAL_HTML }),
      NO_STANDARDS,
    );

    expect(result.a1StructuredData).toBe(0);
  });
});
