/**
 * Redis Client for Upstash
 *
 * Provides connection and utilities for:
 * - Hot cache (rendered pages)
 * - Rate limiting (sliding window counter)
 */

import { Redis } from '@upstash/redis';

// Singleton Redis client
let redis: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Missing Redis credentials. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in environment variables.',
      );
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

/**
 * Cache operations
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get<string>(key);
  },

  /**
   * Set value in cache (no expiry - LRU eviction)
   */
  async set(key: string, value: string): Promise<void> {
    const client = getRedisClient();
    await client.set(key, value);
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },
};

/**
 * Rate limiting operations using sorted sets
 */
export const rateLimit = {
  /**
   * Check and increment rate limit
   * Returns { allowed, remaining, resetAt }
   */
  async check(
    key: string,
    limit: number,
    windowMs: number = 24 * 60 * 60 * 1000, // 24 hours default
  ): Promise<{
      allowed: boolean;
      limit: number;
      used: number;
      remaining: number;
      resetAt: Date;
    }> {
    const client = getRedisClient();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Add current request with timestamp
    await client.zadd(key, { score: now, member: `${now}:${Math.random()}` });

    // Remove old entries outside window
    await client.zremrangebyscore(key, 0, windowStart);

    // Count requests in window
    const count = await client.zcard(key);

    // Set expiry on key (cleanup)
    await client.expire(key, Math.ceil(windowMs / 1000) + 3600); // Add 1 hour buffer

    const allowed = count <= limit;
    const resetAt = new Date(windowStart + windowMs);

    return {
      allowed,
      limit,
      used: count,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  },

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    key: string,
    limit: number,
    windowMs: number = 24 * 60 * 60 * 1000,
  ): Promise<{
      limit: number;
      used: number;
      remaining: number;
      resetAt: Date;
    }> {
    const client = getRedisClient();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await client.zremrangebyscore(key, 0, windowStart);

    // Count requests
    const count = await client.zcard(key);

    const resetAt = new Date(windowStart + windowMs);

    return {
      limit,
      used: count,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  },
};
