import { cacheMetadata, getMetadataCacheKey, getStorageKey } from '@crawlready/cache';
import { cacheAccessQueries, createConnection, renderedPageQueries, renderJobQueries } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { REDIS_CONNECTION } from '@crawlready/queue';
import { validateUrlSecurity } from '@crawlready/security';
import { getPublicUrlFromNormalizedUrl, isStorageConfigured, uploadRenderedPage } from '@crawlready/storage';
import type { RenderJobData } from '@crawlready/types';
import { detectCrawler } from '@crawlready/types';
import type { Job } from 'bullmq';
import { Worker } from 'bullmq';

import { optimizeHtml } from './html-optimizer';
import { startHttpServer } from './http-server';
import { renderPage } from './renderer';

const logger = createLogger({ service: 'render-worker' });

// Start HTTP server for synchronous renders (on-the-fly rendering)
const HTTP_PORT = Number.parseInt(process.env.HTTP_PORT || '3001');
startHttpServer(HTTP_PORT);

/**
 * CrawlReady Render Worker
 *
 * CDN-First Architecture:
 * - Renders pages with Puppeteer
 * - Uploads optimized HTML to Supabase Storage (public bucket)
 * - Updates Redis with metadata only (not HTML content)
 * - HTML served directly from CDN, not Redis
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
    const { jobId, url, normalizedUrl, apiKeyId, waitForSelector, timeout, userAgent, siteId } = job.data;
    const startTime = Date.now();

    // Detect crawler from user agent
    const crawlerInfo = detectCrawler(userAgent);
    const crawlerName = job.data.crawlerName || crawlerInfo.name;
    const crawlerType = job.data.crawlerType || crawlerInfo.type;

    logger.info({ jobId, url, crawlerName, crawlerType }, 'Processing render job');

    // Generate keys for storage and cache
    const storageKey = await getStorageKey(normalizedUrl);
    const metadataKey = getMetadataCacheKey(normalizedUrl);

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

      // 5. Store in Supabase Storage (public bucket for CDN access)
      if (!isStorageConfigured()) {
        throw new Error('Storage not configured. Set SUPABASE_URL, SUPABASE_SERVICE_KEY, and SUPABASE_STORAGE_BUCKET.');
      }

      const uploadResult = await uploadRenderedPage(storageKey, optimizedHtml);
      if (!uploadResult.success) {
        throw new Error(`Failed to upload to storage: ${uploadResult.error}`);
      }
      logger.info({ storageKey }, 'Stored in Supabase CDN storage');

      // 6. Generate public CDN URL
      const publicUrl = getPublicUrlFromNormalizedUrl(normalizedUrl);

      // 7. Update Redis with metadata only (not HTML)
      await cacheMetadata.setReady(metadataKey, publicUrl, storageKey, htmlSizeBytes);
      logger.debug({ metadataKey, publicUrl }, 'Updated cache metadata');

      // 8. Update or create rendered_pages metadata in database
      await renderedPageQueries.upsert(db, {
        normalizedUrl,
        storageKey,
        htmlSizeBytes,
        apiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true, // Metadata is in Redis
        accessCount: 0,
      });

      // 9. Update job status to completed
      const renderDurationMs = Date.now() - startTime;
      await renderJobQueries.updateStatus(db, jobId, 'completed', {
        completedAt: new Date(),
        renderDurationMs,
        htmlSizeBytes,
      });

      // 10. Log cache access with crawler attribution
      try {
        await cacheAccessQueries.create(db, {
          apiKeyId,
          normalizedUrl,
          cacheLocation: 'none', // Fresh render = cache miss
          responseTimeMs: renderDurationMs,
          siteId: siteId || null,
          crawlerName: crawlerName || null,
          crawlerType: crawlerType || null,
          userAgent: userAgent || null,
        });
        logger.debug({ crawlerName, crawlerType }, 'Logged cache access with crawler info');
      } catch (logError) {
        // Don't fail the job if logging fails
        logger.warn({ error: logError instanceof Error ? logError.message : 'Unknown' }, 'Failed to log cache access');
      }

      logger.info({ jobId, renderDurationMs, htmlSizeBytes, crawlerName, publicUrl }, 'Job completed successfully');

      return {
        success: true,
        htmlSizeBytes,
        renderDurationMs,
        publicUrl,
        crawlerName,
        crawlerType,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ jobId, error: errorMessage }, 'Job failed');

      // Update cache metadata to failed state
      await cacheMetadata.setFailed(metadataKey, errorMessage);

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
    httpPort: HTTP_PORT,
  },
  'CrawlReady render worker started (BullMQ + HTTP server)',
);
