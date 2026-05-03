import { describe, expect, it } from 'vitest';

import { createRateLimiter } from '../rate-limit';

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });
    const r1 = limiter.check('ip1');

    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    limiter.check('ip2');
    limiter.check('ip2');
    const r3 = limiter.check('ip2');

    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('isolates keys from each other', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.check('a');
    const rb = limiter.check('b');

    expect(rb.allowed).toBe(true);
  });
});
