/**
 * POST /api/render-async
 *
 * Fire-and-Forget Render Endpoint
 *
 * Queues a render job and returns immediately (202).
 * Customer middleware calls this when detecting a cache miss.
 *
 * Flow:
 * 1. Customer middleware checks CDN URL directly
 * 2. If miss, pass through to origin immediately (don't wait)
 * 3. Fire-and-forget: POST /api/render-async
 * 4. Next request will be cached
 *
 * Response: Always 202 (queued) unless error
 */

import { cacheMetadata, getMetadataCacheKey, normalizeUrl } from '@crawlready/cache';
import { apiKeyQueries, renderJobQueries } from '@crawlready/database';
import { getRenderQueue } from '@crawlready/queue';
import { SSRFError, validateUrlSecurity } from '@crawlready/security';
import { getPublicUrlFromNormalizedUrl, getStorageKey, isStorageConfigured } from '@crawlready/storage';
import type { RenderAsyncApiResponse } from '@crawlready/types';
import type { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/libs/api-error-handler';
import { badRequest, rateLimitExceeded, success, unauthorized, validationError } from '@/libs/api-response-helpers';
import { db } from '@/libs/DB';
import { authenticateRequest } from '@/libs/dual-auth';
import { checkRateLimit } from '@/libs/rate-limit-helper';

// Force dynamic rendering - this route uses request.headers for authentication
export const dynamic = 'force-dynamic';

// Request body schema
const renderAsyncRequestSchema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  timeout: z.number().int().min(1000).max(60000).optional().default(30000),
  // Crawler attribution (optional)
  userAgent: z.string().optional(),
  crawlerName: z.string().optional(),
  crawlerType: z.enum(['search', 'ai', 'social', 'monitoring', 'unknown', 'direct']).optional(),
  siteId: z.string().optional(),
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
  const parseResult = renderAsyncRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return validationError(parseResult.error);
  }

  const { url, waitForSelector, timeout, userAgent, crawlerName, crawlerType, siteId } = parseResult.data;

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

  // 5. Require API key for render jobs
  if (!authContext.apiKeyId) {
    return badRequest('API key required for render jobs. Clerk-only users should generate an API key first.');
  }

  // 6. Normalize URL
  const normalizedUrl = normalizeUrl(url);
  const metadataKey = getMetadataCacheKey(normalizedUrl);

  // 7. Check if already cached or rendering
  const existingMetadata = await cacheMetadata.get(metadataKey);
  if (existingMetadata?.status === 'ready') {
    // Already cached - no need to render again
    const response: RenderAsyncApiResponse = {
      queued: false,
      message: 'Page is already cached.',
    };
    return success(response, 200);
  }

  if (existingMetadata?.status === 'rendering') {
    // Already rendering
    const response: RenderAsyncApiResponse = {
      queued: false,
      message: 'Page is already being rendered.',
    };
    return success(response, 200);
  }

  // 8. Check if job already in progress for this URL
  const existingJob = await renderJobQueries.findInProgressByUrl(db, normalizedUrl);

  if (existingJob) {
    // Job already queued or processing
    const response: RenderAsyncApiResponse = {
      queued: false,
      message: 'Render job already in progress for this URL.',
    };
    return success(response, 200);
  }

  // 9. Check storage configuration
  if (!isStorageConfigured()) {
    return badRequest('Storage not configured. Contact support.');
  }

  // 10. Generate storage key and public URL
  const storageKey = getStorageKey(normalizedUrl);
  const publicUrl = getPublicUrlFromNormalizedUrl(normalizedUrl);

  // 11. Set cache metadata as 'rendering'
  await cacheMetadata.setRendering(metadataKey, storageKey, publicUrl);

  // 12. Create new render job
  const job = await renderJobQueries.create(db, {
    apiKeyId: authContext.apiKeyId,
    url,
    normalizedUrl,
    status: 'queued',
  });

  // 13. Add to BullMQ queue
  const renderQueue = getRenderQueue();
  await renderQueue.add('render', {
    jobId: job.id,
    url,
    normalizedUrl,
    apiKeyId: authContext.apiKeyId,
    waitForSelector,
    timeout,
    userAgent,
    crawlerName,
    crawlerType,
    siteId,
  });

  // Return immediately (fire-and-forget)
  const response: RenderAsyncApiResponse = {
    queued: true,
    message: 'Render job queued. Page will be available at CDN URL when ready.',
  };

  return success(response, 202, {
    'X-Cache-Status': 'queued',
    'X-Public-Url': publicUrl,
  });
});
