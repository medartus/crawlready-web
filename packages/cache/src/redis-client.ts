/**
 * Redis Client for Upstash
 *
 * CDN-First Architecture:
 * - Redis stores metadata only (not HTML content)
 * - HTML served directly from Supabase Storage CDN
 * - Metadata includes: publicUrl, storageKey, renderedAt, sizeBytes, status
 *
 * Provides utilities for:
 * - Cache metadata operations
 * - Rate limiting (sliding window counter)
 */

import process from 'node:process';

import type { CacheMetadata, CacheStatus } from '@crawlready/types';
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
 * Cache operations (legacy - stores HTML directly)
 * @deprecated Use cacheMetadata for CDN-first architecture
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
 * Cache metadata operations for CDN-first architecture
 * Stores JSON metadata (200 bytes) instead of HTML (100KB+)
 */
export const cacheMetadata = {
  /**
   * Get cache metadata for a URL
   * @param key - Metadata cache key (use getMetadataCacheKey from url-utils)
   */
  async get(key: string): Promise<CacheMetadata | null> {
    const client = getRedisClient();
    const data = await client.get<CacheMetadata>(key);
    return data;
  },

  /**
   * Set cache metadata
   * @param key - Metadata cache key
   * @param metadata - Cache metadata object
   */
  async set(key: string, metadata: CacheMetadata): Promise<void> {
    const client = getRedisClient();
    await client.set(key, metadata);
  },

  /**
   * Update cache status (e.g., rendering → ready)
   */
  async updateStatus(
    key: string,
    status: CacheStatus,
    updates?: Partial<CacheMetadata>,
  ): Promise<boolean> {
    const client = getRedisClient();
    const existing = await client.get<CacheMetadata>(key);
    if (!existing) {
      return false;
    }
    await client.set(key, { ...existing, status, ...updates });
    return true;
  },

  /**
   * Set cache as rendering (in progress)
   */
  async setRendering(key: string, storageKey: string, publicUrl: string): Promise<void> {
    const client = getRedisClient();
    const metadata: CacheMetadata = {
      publicUrl,
      storageKey,
      renderedAt: Date.now(),
      sizeBytes: 0,
      status: 'rendering',
    };
    await client.set(key, metadata);
  },

  /**
   * Set cache as ready (render complete)
   */
  async setReady(
    key: string,
    publicUrl: string,
    storageKey: string,
    sizeBytes: number,
  ): Promise<void> {
    const client = getRedisClient();
    const metadata: CacheMetadata = {
      publicUrl,
      storageKey,
      renderedAt: Date.now(),
      sizeBytes,
      status: 'ready',
    };
    await client.set(key, metadata);
  },

  /**
   * Set cache as failed
   */
  async setFailed(key: string, errorMessage: string): Promise<void> {
    const client = getRedisClient();
    const existing = await client.get<CacheMetadata>(key);
    if (existing) {
      await client.set(key, { ...existing, status: 'failed', errorMessage });
    }
  },

  /**
   * Delete cache metadata
   */
  async del(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.del(key);
  },

  /**
   * Check if metadata exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },
};

/**
 * Distributed lock operations for concurrency control
 * Uses Redis SET NX EX pattern for atomic lock acquisition
 */
export const lock = {
  /**
   * Try to acquire a lock
   * @param key - Lock identifier (will be prefixed with 'lock:')
   * @param ttlSeconds - Lock TTL in seconds (default 60s, prevents deadlocks)
   * @returns true if lock acquired, false if already locked
   */
  async acquire(key: string, ttlSeconds: number = 60): Promise<boolean> {
    const client = getRedisClient();
    const lockKey = `lock:${key}`;
    // SET NX (only if not exists) + EX (with expiry)
    const result = await client.set(lockKey, Date.now().toString(), { nx: true, ex: ttlSeconds });
    return result === 'OK';
  },

  /**
   * Release a lock
   * @param key - Lock identifier (will be prefixed with 'lock:')
   */
  async release(key: string): Promise<void> {
    const client = getRedisClient();
    const lockKey = `lock:${key}`;
    await client.del(lockKey);
  },

  /**
   * Check if a lock is currently held
   * @param key - Lock identifier (will be prefixed with 'lock:')
   * @returns true if locked, false otherwise
   */
  async isLocked(key: string): Promise<boolean> {
    const client = getRedisClient();
    const lockKey = `lock:${key}`;
    return (await client.exists(lockKey)) === 1;
  },

  /**
   * Extend a lock's TTL (if you need more time)
   * @param key - Lock identifier
   * @param ttlSeconds - New TTL in seconds
   * @returns true if extended, false if lock doesn't exist
   */
  async extend(key: string, ttlSeconds: number): Promise<boolean> {
    const client = getRedisClient();
    const lockKey = `lock:${key}`;
    const result = await client.expire(lockKey, ttlSeconds);
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
