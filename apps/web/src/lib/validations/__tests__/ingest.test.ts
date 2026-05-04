import { describe, expect, it } from 'vitest';

import { ingestSchema } from '../ingest';

describe('ingestSchema', () => {
  const valid = {
    s: 'cr_live_abc123def456',
    p: '/about',
    b: 'GPTBot',
    t: Date.now(),
  };

  it('accepts valid payload', () => {
    const result = ingestSchema.safeParse(valid);

    expect(result.success).toBe(true);
  });

  it('accepts payload with optional src', () => {
    const result = ingestSchema.safeParse({ ...valid, src: 'middleware' });

    expect(result.success).toBe(true);
  });

  it('rejects missing site key', () => {
    const result = ingestSchema.safeParse({ ...valid, s: undefined });

    expect(result.success).toBe(false);
  });

  it('rejects site key not starting with cr_live_', () => {
    const result = ingestSchema.safeParse({ ...valid, s: 'xx_live_abc123def456' });

    expect(result.success).toBe(false);
  });

  it('rejects site key with wrong length', () => {
    const result = ingestSchema.safeParse({ ...valid, s: 'cr_live_short' });

    expect(result.success).toBe(false);
  });

  it('rejects empty path', () => {
    const result = ingestSchema.safeParse({ ...valid, p: '' });

    expect(result.success).toBe(false);
  });

  it('rejects path exceeding 2048 chars', () => {
    const result = ingestSchema.safeParse({ ...valid, p: '/'.padEnd(2049, 'x') });

    expect(result.success).toBe(false);
  });

  it('rejects empty bot name', () => {
    const result = ingestSchema.safeParse({ ...valid, b: '' });

    expect(result.success).toBe(false);
  });

  it('rejects bot name exceeding 100 chars', () => {
    const result = ingestSchema.safeParse({ ...valid, b: 'x'.repeat(101) });

    expect(result.success).toBe(false);
  });

  it('rejects non-integer timestamp', () => {
    const result = ingestSchema.safeParse({ ...valid, t: 1234.56 });

    expect(result.success).toBe(false);
  });

  it('rejects invalid src value', () => {
    const result = ingestSchema.safeParse({ ...valid, src: 'invalid' });

    expect(result.success).toBe(false);
  });
});
