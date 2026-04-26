/**
 * In-memory IP-based rate limiter.
 *
 * Phase 0: simple Map-based sliding window. Good enough for Vercel
 * serverless (per-isolate scope). Replace with Redis/Upstash if
 * multiple instances are needed.
 *
 * Usage:
 *   const result = rateLimiter.check(ip);
 *   if (!result.allowed) return NextResponse.json({ … }, { status: 429 });
 */

type RateLimitEntry = {
  timestamps: number[];
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number | null;
};

export function createRateLimiter(opts: {
  windowMs: number;
  maxRequests: number;
}) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to avoid memory leaks (every 5 minutes)
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) {
      return;
    }
    lastCleanup = now;
    const cutoff = now - opts.windowMs;
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter(t => t > cutoff);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }

  return {
    check(key: string): RateLimitResult {
      cleanup();

      const now = Date.now();
      const cutoff = now - opts.windowMs;

      let entry = store.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
      }

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter(t => t > cutoff);

      if (entry.timestamps.length >= opts.maxRequests) {
        const oldestInWindow = entry.timestamps[0]!;
        const retryAfterMs = oldestInWindow + opts.windowMs - now;
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        };
      }

      entry.timestamps.push(now);
      return {
        allowed: true,
        remaining: opts.maxRequests - entry.timestamps.length,
        retryAfterSeconds: null,
      };
    },
  };
}

// Scan endpoint: 3 scans per hour per IP
export const scanRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
});

// Subscribe endpoint: 5 per hour per IP
export const subscribeRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
});
