import { describe, expect, it } from 'vitest';

import { CORRELATION_HEADER, getCorrelationId } from '../correlation';

describe('getCorrelationId', () => {
  it('generates a new UUID when no header present', () => {
    const request = new Request('https://example.com', { headers: {} });
    const id = getCorrelationId(request);

    expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  });

  it('reuses client-provided correlation ID', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-correlation-id': 'client-provided-id-123' },
    });
    const id = getCorrelationId(request);

    expect(id).toBe('client-provided-id-123');
  });

  it('ignores empty correlation ID header', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-correlation-id': '' },
    });
    const id = getCorrelationId(request);

    expect(id).toMatch(/^[\da-f]{8}-/);
  });

  it('rejects overly long correlation IDs', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-correlation-id': 'x'.repeat(200) },
    });
    const id = getCorrelationId(request);

    expect(id).not.toBe('x'.repeat(200));
    expect(id).toMatch(/^[\da-f]{8}-/);
  });

  it('generates unique IDs per call', () => {
    const r1 = new Request('https://example.com');
    const r2 = new Request('https://example.com');

    expect(getCorrelationId(r1)).not.toBe(getCorrelationId(r2));
  });

  it('exports the correct header name', () => {
    expect(CORRELATION_HEADER).toBe('x-correlation-id');
  });
});
