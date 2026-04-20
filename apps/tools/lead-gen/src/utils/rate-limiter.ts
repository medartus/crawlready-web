/**
 * Rate limiter to respect website rate limits and avoid being blocked
 */

interface RateLimiterOptions {
  requestsPerMinute: number;
  minDelayMs?: number;
  maxDelayMs?: number;
}

export class RateLimiter {
  private requestsPerMinute: number;
  private minDelayMs: number;
  private maxDelayMs: number;
  private requestTimes: number[] = [];

  constructor(options: RateLimiterOptions) {
    this.requestsPerMinute = options.requestsPerMinute;
    this.minDelayMs = options.minDelayMs || 500;
    this.maxDelayMs = options.maxDelayMs || 5000;
  }

  /**
   * Wait if necessary to respect rate limits
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requestTimes = this.requestTimes.filter((time) => time > oneMinuteAgo);

    // If we've hit the limit, wait until we can make another request
    if (this.requestTimes.length >= this.requestsPerMinute) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = oldestRequest + 60000 - now + this.minDelayMs;
      if (waitTime > 0) {
        await this.delay(Math.min(waitTime, this.maxDelayMs));
      }
    } else {
      // Add a small random delay to appear more human-like
      await this.delay(this.randomDelay());
    }

    this.requestTimes.push(Date.now());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomDelay(): number {
    return this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs) * 0.5;
  }
}

/**
 * Create a rate limiter for WTTJ scraping
 * Conservative: 20 requests per minute to avoid being blocked
 */
export function createWTTJRateLimiter(): RateLimiter {
  return new RateLimiter({
    requestsPerMinute: 20,
    minDelayMs: 1000,
    maxDelayMs: 3000,
  });
}

/**
 * Create a rate limiter for website analysis
 * Very conservative: 10 requests per minute (different sites)
 */
export function createAnalysisRateLimiter(): RateLimiter {
  return new RateLimiter({
    requestsPerMinute: 10,
    minDelayMs: 2000,
    maxDelayMs: 5000,
  });
}

/**
 * Execute operations with concurrency control
 */
export async function withConcurrency<T, R>(
  items: T[],
  concurrency: number,
  operation: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const promise = operation(item, i).then((result) => {
      results[i] = result;
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let j = executing.length - 1; j >= 0; j--) {
        const p = executing[j];
        // Check if promise is settled by racing with immediate resolve
        const isSettled = await Promise.race([
          p.then(() => true).catch(() => true),
          Promise.resolve(false),
        ]);
        if (isSettled) {
          executing.splice(j, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
