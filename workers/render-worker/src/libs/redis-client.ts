// NOTE: This is a temporary copy from src/libs/redis-client.ts
// TODO: Move to shared package when implementing monorepo (see documentation/architecture/monorepo-refactor-plan.md)

/**
 * Redis Client for Upstash (Worker Version)
 *
 * Provides connection and utilities for:
 * - Hot cache (rendered pages)
 * - BullMQ job queue
 */

import { Redis } from '@upstash/redis';
import type { QueueOptions } from 'bullmq';
import { Queue } from 'bullmq';

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
 * BullMQ Queue for render jobs
 */

export type RenderJobData = {
  jobId: string;
  url: string;
  normalizedUrl: string;
  waitForSelector?: string;
  timeout?: number;
};

// BullMQ connection config (uses standard Redis, not REST API)
export const REDIS_CONNECTION: QueueOptions['connection'] = {
  host: (process.env.UPSTASH_REDIS_HOST || 'localhost').replace(/^https?:\/\//, ''),
  port: Number.parseInt(process.env.UPSTASH_REDIS_PORT || '6379'),
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: process.env.UPSTASH_REDIS_TLS === 'true' ? {} : undefined,
};

let queueInstance: Queue<RenderJobData> | null = null;

/**
 * Get BullMQ render queue instance (singleton)
 */
export function getRenderQueue(): Queue<RenderJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<RenderJobData>('render-queue', {
      connection: REDIS_CONNECTION,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          count: 100,
          age: 3600,
        },
        removeOnFail: {
          count: 500,
          age: 86400,
        },
      },
    });
  }

  return queueInstance;
}
