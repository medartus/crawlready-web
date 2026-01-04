/**
 * BullMQ Queue for render jobs
 */

import type { RenderJobData } from '@crawlready/types';
import type { QueueOptions } from 'bullmq';
import { Queue } from 'bullmq';

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
          delay: 5000, // 5s, 25s, 125s
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 3600, // Remove after 1 hour
        },
        removeOnFail: {
          count: 500, // Keep last 500 failed jobs for debugging
          age: 86400, // Remove after 24 hours
        },
      },
    });
  }

  return queueInstance;
}
