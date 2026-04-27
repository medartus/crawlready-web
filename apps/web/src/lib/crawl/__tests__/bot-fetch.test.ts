import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { botFetch } from '../bot-fetch';

/**
 * Bot-fetch tests use real HTTP requests against httpbin.org.
 * They are integration tests that validate the fetch pipeline works
 * end-to-end. Skip with `SKIP_NETWORK=1` if offline.
 */

const SKIP = !!process.env.SKIP_NETWORK;

// A public URL that returns HTML
const TEST_URL = 'https://httpbin.org/html';

// A URL that always returns 404 for llms.txt
const TEST_ORIGIN = 'https://httpbin.org';

describe.skipIf(SKIP)('botFetch', () => {
  // Allow longer timeouts for network tests
  beforeAll(() => {
    // noop — vitest timeout is set per-test
  });

  afterAll(() => {
    // noop
  });

  it('returns valid BotFetchResult shape', async () => {
    const result = await botFetch(TEST_URL);

    expect(result).toHaveProperty('botHtml');
    expect(result).toHaveProperty('botStatusCode');
    expect(result).toHaveProperty('supportsMarkdownNegotiation');
    expect(result).toHaveProperty('negotiatedMarkdown');
    expect(result).toHaveProperty('hasLlmsTxt');
    expect(result).toHaveProperty('llmsTxtContent');
    expect(result).toHaveProperty('responseHeaders');

    expect(typeof result.botHtml).toBe('string');
    expect(typeof result.botStatusCode).toBe('number');
    expect(typeof result.supportsMarkdownNegotiation).toBe('boolean');
    expect(typeof result.hasLlmsTxt).toBe('boolean');
    expect(typeof result.responseHeaders).toBe('object');
  }, 30_000);

  it('fetches HTML as GPTBot and returns a non-empty body', async () => {
    const result = await botFetch(TEST_URL);

    expect(result.botStatusCode).toBe(200);
    expect(result.botHtml.length).toBeGreaterThan(0);
    expect(result.botHtml.toLowerCase()).toContain('<html');
  }, 30_000);

  it('returns statusCode 0 for unreachable hosts', async () => {
    const result = await botFetch('https://this-domain-does-not-exist-crawlready-test.example');

    expect(result.botStatusCode).toBe(0);
    expect(result.botHtml).toBe('');
  }, 30_000);

  it('detects llms.txt absence for sites that lack it', async () => {
    const result = await botFetch(`${TEST_ORIGIN}/html`);

    // httpbin.org does not serve /llms.txt
    expect(result.hasLlmsTxt).toBe(false);
    expect(result.llmsTxtContent).toBeNull();
  }, 30_000);

  it('collects response headers from bot fetch', async () => {
    const result = await botFetch(TEST_URL);

    expect(Object.keys(result.responseHeaders).length).toBeGreaterThan(0);
    // httpbin always returns content-type
    expect(result.responseHeaders['content-type']).toBeDefined();
  }, 30_000);

  it('rejects non-http URLs (SSRF protection)', async () => {
    await expect(botFetch('file:///etc/passwd')).rejects.toThrow();
  });
});
