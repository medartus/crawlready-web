/**
 * HTTP Server for Synchronous Rendering
 *
 * Provides an HTTP API endpoint for on-the-fly rendering.
 * Called by Vercel /api/render when a page is not in cache.
 *
 * Endpoint: POST /render
 * - Validates internal auth token
 * - Renders page with Puppeteer
 * - Returns optimized HTML
 *
 * This runs alongside the BullMQ worker on Fly.io.
 */

import { Buffer } from 'node:buffer';

import { createLogger } from '@crawlready/logger';
import { validateUrlSecurity } from '@crawlready/security';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timeout } from 'hono/timeout';

import { optimizeHtml } from './html-optimizer';
import { renderPage } from './renderer';

const logger = createLogger({ service: 'render-http' });

// Semaphore for limiting concurrent renders
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  get available(): number {
    return this.permits;
  }

  get waiting(): number {
    return this.queue.length;
  }
}

// Limit concurrent renders to prevent memory exhaustion
const MAX_CONCURRENT_RENDERS = Number.parseInt(process.env.MAX_CONCURRENT_RENDERS || '10');
const semaphore = new Semaphore(MAX_CONCURRENT_RENDERS);

// Internal auth secret (shared between Vercel and Fly.io)
const RENDER_WORKER_SECRET = process.env.RENDER_WORKER_SECRET;

const app = new Hono();

// Middleware
app.use('*', cors());

// Health check (no auth required)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    concurrency: {
      max: MAX_CONCURRENT_RENDERS,
      available: semaphore.available,
      waiting: semaphore.waiting,
    },
  });
});

// Internal auth middleware for render endpoint
app.use('/render', async (c, next) => {
  // Skip auth if no secret configured (development mode)
  if (!RENDER_WORKER_SECRET) {
    logger.warn('RENDER_WORKER_SECRET not set - running in development mode without auth');
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  if (token !== RENDER_WORKER_SECRET) {
    return c.json({ error: 'Invalid authorization token' }, 403);
  }

  return next();
});

// Request body type
type RenderRequest = {
  url: string;
  waitForSelector?: string;
  timeout?: number;
};

// Synchronous render endpoint
app.post('/render', timeout(65000), async (c) => {
  const startTime = Date.now();
  let acquired = false;

  try {
    const body = await c.req.json<RenderRequest>();
    const { url, waitForSelector, timeout: renderTimeout = 30000 } = body;

    if (!url) {
      return c.json({ error: 'Missing required field: url' }, 400);
    }

    // Validate timeout bounds
    const effectiveTimeout = Math.min(Math.max(renderTimeout, 5000), 60000);

    // SSRF protection
    try {
      validateUrlSecurity(url);
    } catch (error) {
      return c.json(
        {
          error: 'URL validation failed',
          message: error instanceof Error ? error.message : 'Invalid URL',
        },
        400,
      );
    }

    logger.info({ url, waitForSelector, timeout: effectiveTimeout }, 'HTTP render request received');

    // Acquire semaphore (limit concurrent renders)
    const acquireTimeout = 10000; // 10s max wait for semaphore
    const acquirePromise = semaphore.acquire();
    const timeoutPromise = new Promise<'timeout'>(resolve =>
      setTimeout(() => resolve('timeout'), acquireTimeout),
    );

    const acquireResult = await Promise.race([acquirePromise, timeoutPromise]);
    if (acquireResult === 'timeout') {
      logger.warn({ url }, 'Semaphore acquire timeout - too many concurrent renders');
      return c.json(
        {
          error: 'Server busy',
          message: 'Too many concurrent render requests. Please retry.',
          retryAfter: 5,
        },
        503,
      );
    }

    acquired = true;
    logger.debug({ url, available: semaphore.available }, 'Semaphore acquired');

    // Render with Puppeteer
    const { html: rawHtml, metrics } = await renderPage(url, {
      waitForSelector,
      timeout: effectiveTimeout,
      blockResources: true,
      autoScroll: true,
    });

    // Optimize HTML
    const optimizedHtml = optimizeHtml(rawHtml);
    const sizeBytes = Buffer.byteLength(optimizedHtml, 'utf8');
    const renderDurationMs = Date.now() - startTime;

    logger.info(
      {
        url,
        renderDurationMs,
        sizeBytes,
        rawSize: rawHtml.length,
        metrics,
      },
      'HTTP render completed',
    );

    return c.json({
      html: optimizedHtml,
      renderDurationMs,
      sizeBytes,
      metrics,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ error: errorMessage }, 'HTTP render failed');

    // Determine if it's a timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return c.json(
        {
          error: 'Render timeout',
          message: 'Page took too long to render. Pass through to origin.',
        },
        504,
      );
    }

    return c.json(
      {
        error: 'Render failed',
        message: errorMessage,
      },
      500,
    );
  } finally {
    if (acquired) {
      semaphore.release();
      logger.debug({ available: semaphore.available }, 'Semaphore released');
    }
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error({ error: err.message }, 'Unhandled error');
  return c.json({ error: 'Internal server error' }, 500);
});

/**
 * Start the HTTP server
 */
export function startHttpServer(port: number = 3001): void {
  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      logger.info(
        {
          port: info.port,
          maxConcurrent: MAX_CONCURRENT_RENDERS,
        },
        'HTTP render server started',
      );
    },
  );
}

export { app };
