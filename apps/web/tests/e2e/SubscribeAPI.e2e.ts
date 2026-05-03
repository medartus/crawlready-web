import { expect, test } from '@playwright/test';

test.describe('Subscribe API — POST /api/v1/subscribe', () => {
  test('should reject missing email', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/subscribe`, {
      data: {},
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe('INVALID_EMAIL');
  });

  test('should reject invalid email format', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/subscribe`, {
      data: { email: 'not-an-email' },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe('INVALID_EMAIL');
  });

  test('should reject disposable email addresses', async ({ request, baseURL }) => {
    const response = await request.post(`${baseURL}/api/v1/subscribe`, {
      data: { email: 'test@mailinator.com' },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.error.code).toBe('DISPOSABLE_EMAIL');
  });
});
