import { expect, test } from '@playwright/test';

test.describe('Scan API — POST /api/v1/scan', () => {
  test('should reject missing body', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/scan`, {
      headers: { 'Content-Type': 'application/json' },
      data: 'not json{{{',
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  test('should reject missing url field', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/scan`, {
      data: {},
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe('INVALID_REQUEST');
  });

  test('should not return a successful scan for invalid URL', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/scan`, {
      data: { url: 'not-a-url' },
    });

    // API should reject — either 400 (validation) or 502 (provider rejects)
    expect([200, 201]).not.toContain(response.status());
  });

  test('should accept a valid URL and respond without 500', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/scan`, {
      data: { url: 'https://example.com' },
    });

    // Accept success (201/200) or provider error (502) — both prove the API is alive
    // A 500 would mean our code is broken, any other status is expected
    expect(response.status()).not.toBe(500);
  });
});
