import { cache, getCacheKey, getStorageKey } from '@crawlready/cache';
import { createConnection, renderedPageQueries, renderJobQueries } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { REDIS_CONNECTION } from '@crawlready/queue';
import { validateUrlSecurity } from '@crawlready/security';
import { isStorageConfigured, uploadRenderedPage } from '@crawlready/storage';
import type { RenderJobData } from '@crawlready/types';
import type { Job } from 'bullmq';
import { Worker } from 'bullmq';

import { optimizeHtml } from './html-optimizer';
import { renderPage } from './renderer';

const logger = createLogger({ service: 'render-worker' });

/**
 * CrawlReady Render Worker
 *
 * BullMQ worker that processes render jobs from the queue
 */

// Initialize database connection
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const db = await createConnection(dbUrl);
logger.info('Database connection initialized');

const worker = new Worker<RenderJobData>(
  'render-queue',
  async (job: Job<RenderJobData>) => {
    const { jobId, url, normalizedUrl, apiKeyId, waitForSelector, timeout } = job.data;
    const startTime = Date.now();

    logger.info({ jobId, url }, 'Processing render job');

    try {
      // 1. Update job status to processing
      await renderJobQueries.updateStatus(db, jobId, 'processing', {
        startedAt: new Date(),
      });

      // 2. Validate URL security (SSRF protection)
      try {
        validateUrlSecurity(url);
      } catch (error) {
        throw new Error(`Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 3. Render page with Puppeteer
      logger.debug({ url, timeout }, 'Starting page render');
      const { html: rawHtml } = await renderPage(url, {
        waitForSelector,
        timeout: timeout || 30000,
        blockResources: true,
        autoScroll: true,
      });

      // 4. Optimize HTML
      const rawSize = rawHtml.length;
      logger.debug({ rawSize }, 'Optimizing HTML');
      const optimizedHtml = optimizeHtml(rawHtml);
      const { Buffer: NodeBuffer } = await import('node:buffer');
      const htmlSizeBytes = NodeBuffer.byteLength(optimizedHtml, 'utf8');

      logger.info({ rawSize, optimizedSize: htmlSizeBytes }, 'HTML optimized');

      // 5. Store in Redis (hot cache)
      const cacheKey = getCacheKey(normalizedUrl);
      await cache.set(cacheKey, optimizedHtml);
      logger.debug({ cacheKey }, 'Stored in Redis cache');

      // 6. Store in Supabase Storage (cold storage)
      const storageKey = await getStorageKey(normalizedUrl);
      if (isStorageConfigured()) {
        const uploadResult = await uploadRenderedPage(storageKey, optimizedHtml);
        if (uploadResult.success) {
          logger.info({ storageKey }, 'Stored in Supabase cold storage');
        } else {
          logger.warn({ storageKey, error: uploadResult.error }, 'Failed to store in cold storage');
        }
      } else {
        logger.debug('Cold storage not configured, skipping Supabase upload');
      }

      // 7. Update or create rendered_pages metadata
      await renderedPageQueries.upsert(db, {
        normalizedUrl,
        storageKey,
        htmlSizeBytes,
        apiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true,
        accessCount: 0,
      });

      // 8. Update job status to completed
      const renderDurationMs = Date.now() - startTime;
      await renderJobQueries.updateStatus(db, jobId, 'completed', {
        completedAt: new Date(),
        renderDurationMs,
        htmlSizeBytes,
      });

      logger.info({ jobId, renderDurationMs, htmlSizeBytes }, 'Job completed successfully');

      return {
        success: true,
        htmlSizeBytes,
        renderDurationMs,
        cacheKey,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ jobId, error: errorMessage }, 'Job failed');

      await renderJobQueries.updateStatus(db, jobId, 'failed', {
        completedAt: new Date(),
        errorMessage,
      });

      throw error;
    }
  },
  {
    connection: REDIS_CONNECTION,
    concurrency: Number.parseInt(process.env.WORKER_CONCURRENCY || '5'),
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

// Worker event handlers
worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed successfully');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
});

worker.on('error', (err) => {
  logger.error({ error: err.message }, 'Worker error');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await worker.close();
  process.exit(0);
});

logger.info(
  {
    concurrency: process.env.WORKER_CONCURRENCY || '5',
  },
  'CrawlReady render worker started',
);
