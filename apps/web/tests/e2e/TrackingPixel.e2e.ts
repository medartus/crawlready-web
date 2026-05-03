import { expect, test } from '@playwright/test';

test.describe('Tracking Pixel — GET /api/v1/t/[key]', () => {
  test('should return a 1×1 transparent GIF for non-bot request', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/v1/t/cr_live_test123`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/gif');
    expect(response.headers()['cache-control']).toContain('no-store');
  });

  test('should return a GIF even with AI bot user-agent', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/v1/t/cr_live_test123`, {
      headers: { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)' },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/gif');
  });
});
