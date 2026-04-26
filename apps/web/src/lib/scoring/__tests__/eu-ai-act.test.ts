import { describe, expect, it } from 'vitest';

import { scoreEuAiAct } from '../eu-ai-act';

describe('scoreEuAiAct', () => {
  it('passes all 4 checks for a fully compliant page', () => {
    const html = `<html>
      <head>
        <meta name="author" content="John Doe">
        <meta name="generator" content="Next.js 14">
      </head>
      <body>
        <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","publisher":{"@type":"Organization","name":"Acme"},"creator":"John Doe"}</script>
      </body>
    </html>`;
    const result = scoreEuAiAct(html);

    expect(result.passed).toBe(4);
    expect(result.total).toBe(4);
    expect(result.checks).toHaveLength(4);
    expect(result.checks.every(c => c.passed)).toBe(true);
  });

  it('fails all checks for bare HTML', () => {
    const result = scoreEuAiAct('<html><body><p>Hello</p></body></html>');

    expect(result.passed).toBe(0);
    expect(result.total).toBe(4);
  });

  it('detects content provenance via meta author', () => {
    const html = '<html><head><meta name="author" content="Jane"></head><body></body></html>';
    const result = scoreEuAiAct(html);
    const check = result.checks.find(c => c.name === 'content_provenance');

    expect(check?.passed).toBe(true);
  });

  it('detects content transparency via about link', () => {
    const html = '<html><body><a href="/about">About Us</a></body></html>';
    const result = scoreEuAiAct(html);
    const check = result.checks.find(c => c.name === 'content_transparency');

    expect(check?.passed).toBe(true);
  });

  it('detects machine-readable marking via JSON-LD @type', () => {
    const html = `<html><body>
      <script type="application/ld+json">{"@type":"WebSite","name":"Test"}</script>
    </body></html>`;
    const result = scoreEuAiAct(html);
    const check = result.checks.find(c => c.name === 'machine_readable_marking');

    expect(check?.passed).toBe(true);
  });

  it('detects structured data provenance via publisher', () => {
    const html = `<html><body>
      <script type="application/ld+json">{"@type":"Article","publisher":{"@type":"Organization","name":"Acme"}}</script>
    </body></html>`;
    const result = scoreEuAiAct(html);
    const check = result.checks.find(c => c.name === 'structured_data_provenance');

    expect(check?.passed).toBe(true);
  });
});
