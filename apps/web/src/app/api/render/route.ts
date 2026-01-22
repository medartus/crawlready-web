/**
 * POST /api/render
 *
 * On-the-Fly Rendering Endpoint
 *
 * Simplified API that ALWAYS returns HTML for AI bots:
 * - 200: Returns HTML (from cache or freshly rendered)
 * - 202: Page is being rendered by another request (retry)
 * - 504: Render timeout
 *
 * Customer middleware is now trivial:
 *   1. Detect AI bot
 *   2. POST /api/render { url }
 *   3. Return HTML from response
 *
 * CrawlReady handles:
 *   - Cache checking (Redis metadata + CDN storage)
 *   - On-the-fly rendering if not cached
 *   - Storing rendered HTML in CDN
 *   - Returning HTML directly
 *
 * Supports dual authentication: API key OR Clerk session.
 */

import { cacheMetadata, getMetadataCacheKey, lock, normalizeUrl } from '@crawlready/cache';
import { apiKeyQueries, cacheAccessQueries, renderedPageQueries } from '@crawlready/database';
import { SSRFError, validateUrlSecurity } from '@crawlready/security';
import {
  downloadRenderedPage,
  getPublicUrlFromNormalizedUrl,
  getStorageKey,
  isStorageConfigured,
  uploadRenderedPage,
} from '@crawlready/storage';
import type { OnTheFlyRenderResponse, RenderingInProgressResponse, RenderTimeoutResponse } from '@crawlready/types';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/libs/api-error-handler';
import { badRequest, rateLimitExceeded, unauthorized, validationError } from '@/libs/api-response-helpers';
import { db } from '@/libs/DB';
import { authenticateRequest } from '@/libs/dual-auth';
import { checkRateLimit } from '@/libs/rate-limit-helper';
import {
  isRenderServiceConfigured,
  RenderServiceError,
  renderViaWorker,
} from '@/libs/render-service';

// Force dynamic rendering - this route uses request.headers for authentication
export const dynamic = 'force-dynamic';

// Request body schema
const renderRequestSchema = z.object({
  url: z.string().url(),
  timeout: z.number().min(5000).max(60000).optional(),
  waitForSelector: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
  // 1. Dual authentication (API key OR Clerk session)
  const authContext = await authenticateRequest(request);

  if (!authContext) {
    return unauthorized('Provide API key in Authorization header OR sign in with Clerk');
  }

  // Update last used timestamp for API keys (async, don't block)
  if (authContext.authMethod === 'api_key' && authContext.apiKeyId) {
    apiKeyQueries.updateLastUsed(db, authContext.apiKeyId).catch(console.error);
  }

  // 2. Check rate limit
  const rateLimitResult = await checkRateLimit(authContext, 'render');

  if (!rateLimitResult.allowed) {
    return rateLimitExceeded(
      'Daily render limit reached. Consider upgrading your plan.',
      Math.ceil((Date.now() - rateLimitResult.resetAt.getTime()) / 1000),
    );
  }

  // 3. Parse and validate request body
  const body = await request.json();
  const parseResult = renderRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return validationError(parseResult.error);
  }

  const { url, timeout: requestTimeout, waitForSelector } = parseResult.data;
  const renderTimeout = requestTimeout || 30000;

  // 4. SSRF protection
  try {
    validateUrlSecurity(url);
  } catch (error) {
    if (error instanceof SSRFError) {
      return badRequest(error.message, {
        url,
        reason: 'hostname_blocked',
      });
    }
    throw error;
  }

  // 5. Normalize URL and generate keys
  const normalizedUrl = normalizeUrl(url);
  const metadataKey = getMetadataCacheKey(normalizedUrl);
  const storageKey = getStorageKey(normalizedUrl);
  const publicUrl = getPublicUrlFromNormalizedUrl(normalizedUrl);
  const lockKey = `render:${normalizedUrl}`;

  // 6. Check cache metadata (fast path)
  const metadata = await cacheMetadata.get(metadataKey);

  if (metadata?.status === 'ready') {
    // Cache HIT - fetch HTML from CDN and return it
    const { html, error } = await downloadRenderedPage(storageKey);

    if (html) {
      // Log cache access (async)
      logCacheAccess(authContext.apiKeyId ?? null, normalizedUrl, 'cold').catch(console.error);

      const response: OnTheFlyRenderResponse = {
        html,
        source: 'cdn',
        publicUrl: metadata.publicUrl,
        renderDurationMs: 0,
        sizeBytes: metadata.sizeBytes,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Source': 'cdn',
          'X-Auth-Method': authContext.authMethod,
        },
      });
    }

    // CDN download failed - cache metadata out of sync, continue to render
    console.error('CDN download failed despite ready metadata:', error);
    await cacheMetadata.del(metadataKey);
  }

  // 7. Check if another request is already rendering
  if (metadata?.status === 'rendering' || (await lock.isLocked(lockKey))) {
    const response: RenderingInProgressResponse = {
      status: 'rendering',
      message: 'Page is being rendered. Retry in a few seconds.',
      retryAfter: 5,
    };

    return NextResponse.json(response, {
      status: 202,
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Status': 'rendering',
        'Retry-After': '5',
      },
    });
  }

  // 8. Check prerequisites
  if (!isStorageConfigured()) {
    return badRequest('Storage not configured on server');
  }

  if (!isRenderServiceConfigured()) {
    return badRequest('Render service not configured on server');
  }

  // 9. Acquire lock and render on-the-fly
  const lockTtl = Math.ceil(renderTimeout / 1000) + 30; // Render timeout + 30s buffer
  const acquired = await lock.acquire(lockKey, lockTtl);

  if (!acquired) {
    // Race condition - another request got the lock
    const response: RenderingInProgressResponse = {
      status: 'rendering',
      message: 'Page is being rendered. Retry in a few seconds.',
      retryAfter: 5,
    };

    return NextResponse.json(response, {
      status: 202,
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Status': 'rendering',
        'Retry-After': '5',
      },
    });
  }

  try {
    // Set metadata to rendering state
    await cacheMetadata.setRendering(metadataKey, storageKey, publicUrl);

    // 10. Call Fly.io worker to render
    const renderResult = await renderViaWorker(url, {
      waitForSelector,
      timeout: renderTimeout,
    });

    // 11. Upload to Supabase Storage (CDN)
    const uploadResult = await uploadRenderedPage(storageKey, renderResult.html);

    if (!uploadResult.success) {
      console.error('Failed to upload to CDN:', uploadResult.error);
      // Continue anyway - we have the HTML, we can return it
    }

    // 12. Update cache metadata to ready
    await cacheMetadata.setReady(metadataKey, publicUrl, storageKey, renderResult.sizeBytes);

    // 13. Update database (async)
    updateDatabase(
      authContext.apiKeyId ?? null,
      normalizedUrl,
      storageKey,
      renderResult.sizeBytes,
    ).catch(console.error);

    // Log cache access (async)
    logCacheAccess(authContext.apiKeyId ?? null, normalizedUrl, 'none').catch(console.error);

    // 14. Return rendered HTML
    const response: OnTheFlyRenderResponse = {
      html: renderResult.html,
      source: 'rendered',
      publicUrl,
      renderDurationMs: renderResult.renderDurationMs,
      sizeBytes: renderResult.sizeBytes,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Source': 'rendered',
        'X-Render-Duration': renderResult.renderDurationMs.toString(),
        'X-Auth-Method': authContext.authMethod,
      },
    });
  } catch (error) {
    // Handle render errors
    if (error instanceof RenderServiceError) {
      // Update metadata to failed
      await cacheMetadata.setFailed(metadataKey, error.message);

      if (error.type === 'timeout') {
        const response: RenderTimeoutResponse = {
          error: 'Render timeout',
          message: 'Page took too long to render. Pass through to origin.',
        };

        return NextResponse.json(response, {
          status: 504,
          headers: { 'X-Cache': 'MISS', 'X-Error': 'timeout' },
        });
      }

      if (error.type === 'busy') {
        const response: RenderingInProgressResponse = {
          status: 'rendering',
          message: error.message,
          retryAfter: error.retryAfter || 5,
        };

        return NextResponse.json(response, {
          status: 202,
          headers: {
            'X-Cache': 'MISS',
            'Retry-After': (error.retryAfter || 5).toString(),
          },
        });
      }

      return badRequest(error.message);
    }

    // Update metadata to failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await cacheMetadata.setFailed(metadataKey, errorMessage);

    throw error;
  } finally {
    // Always release lock
    await lock.release(lockKey);
  }
});

/**
 * Log cache access for analytics
 */
async function logCacheAccess(
  apiKeyId: string | null,
  normalizedUrl: string,
  cacheLocation: 'cold' | 'none',
): Promise<void> {
  if (!apiKeyId) {
    return;
  }

  await cacheAccessQueries.create(db, {
    apiKeyId,
    normalizedUrl,
    cacheLocation,
    responseTimeMs: 0, // We don't track this in the API route
    siteId: null,
    crawlerName: null,
    crawlerType: null,
    userAgent: null,
  });
}

/**
 * Update database with rendered page metadata
 */
async function updateDatabase(
  apiKeyId: string | null,
  normalizedUrl: string,
  storageKey: string,
  htmlSizeBytes: number,
): Promise<void> {
  await renderedPageQueries.upsert(db, {
    normalizedUrl,
    storageKey,
    htmlSizeBytes,
    apiKeyId,
    firstRenderedAt: new Date(),
    inRedis: true,
    accessCount: 0,
  });
}
