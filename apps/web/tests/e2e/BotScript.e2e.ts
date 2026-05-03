import { expect, test } from '@playwright/test';

test.describe('Bot Detection Script — GET /c.js', () => {
  test('should return JavaScript content', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/c.js`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/javascript');
  });

  test('should have cache headers for CDN', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/c.js`);

    expect(response.headers()['cache-control']).toContain('max-age=3600');
  });

  test('should contain bot detection regex', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/c.js`);
    const body = await response.text();

    expect(body).toContain('GPTBot');
    expect(body).toContain('ClaudeBot');
    expect(body).toContain('PerplexityBot');
  });

  test('should post beacons to ingest endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/c.js`);
    const body = await response.text();

    expect(body).toContain('/api/v1/ingest');
    expect(body).toContain('sendBeacon');
  });
});
