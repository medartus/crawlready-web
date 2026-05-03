import { expect, test } from '@playwright/test';

test.describe('Ingest API — POST /api/v1/ingest', () => {
  // Per spec, ingest always returns 204 (silent reject on invalid inputs)

  test('should return 204 for malformed JSON', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/ingest`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json',
    });

    expect(response.status()).toBe(204);
  });

  test('should return 204 for missing required fields', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/ingest`, {
      data: { s: 'some-key' },
    });

    expect(response.status()).toBe(204);
  });

  test('should return 204 for invalid timestamp (replay protection)', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/ingest`, {
      data: {
        s: 'cr_live_test123456',
        p: '/test',
        b: 'GPTBot',
        t: 1000000, // Far in the past
      },
    });

    expect(response.status()).toBe(204);
  });

  test('should return 204 for valid-shaped payload with unknown site key', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/ingest`, {
      data: {
        s: 'cr_live_unknown_key',
        p: '/test-page',
        b: 'GPTBot',
        t: Date.now(),
        src: 'middleware',
      },
    });

    expect(response.status()).toBe(204);
  });
});
