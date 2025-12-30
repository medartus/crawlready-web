/**
 * POST /api/render
 *
 * Core endpoint for pre-rendering pages.
 * Returns cached HTML (200) or queues job (202).
 * Supports dual authentication: API key OR Clerk session.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/libs/api-error-handler';
import { badRequest, rateLimitExceeded, success, unauthorized, validationError } from '@/libs/api-response-helpers';
import { db } from '@/libs/DB';
import { apiKeyQueries, cacheAccessQueries, renderJobQueries } from '@/libs/db-queries';
import { authenticateRequest } from '@/libs/dual-auth';
import { checkRateLimit } from '@/libs/rate-limit-helper';
import { cache, getRenderQueue } from '@/libs/redis-client';
import { SSRFError, validateUrlSecurity } from '@/libs/ssrf-protection';
import { getCacheKey, normalizeUrl } from '@/libs/url-utils';

// Request body schema
const renderRequestSchema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  timeout: z.number().int().min(1000).max(60000).optional().default(30000),
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

  const { url } = parseResult.data;
  // TODO: Use these when implementing render worker
  // const { waitForSelector, timeout } = parseResult.data;

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

  // 5. Normalize URL and check cache
  const startTime = Date.now();
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = getCacheKey(normalizedUrl);

  // Check hot cache (Redis)
  const cachedHtml = await cache.get(cacheKey);

  if (cachedHtml) {
    const responseTime = Date.now() - startTime;

    // Log cache access (async) - use apiKeyId if available
    if (authContext.apiKeyId) {
      cacheAccessQueries.log(db, {
        apiKeyId: authContext.apiKeyId,
        normalizedUrl,
        cacheLocation: 'hot',
        responseTimeMs: responseTime,
      }).catch(console.error);
    }

    return new NextResponse(cachedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Cache': 'HIT',
        'X-Cache-Location': 'hot',
        'X-Served-By': 'CrawlReady',
        'X-Auth-Method': authContext.authMethod,
      },
    });
  }

  // TODO: Check cold storage (Supabase) - will implement after Supabase setup
  // const { data } = await supabase.storage
  //   .from('rendered-pages')
  //   .download(`rendered/${hashUrl(normalizedUrl)}.html`);
  //
  // if (data) {
  //   const html = await data.text();
  //   // Promote to hot cache (async)
  //   cache.set(cacheKey, html).catch(console.error);
  //
  //   if (authContext.apiKeyId) {
  //     cacheAccessQueries.log(db, {
  //       apiKeyId: authContext.apiKeyId,
  //       normalizedUrl,
  //       cacheLocation: 'cold',
  //       responseTimeMs: Date.now() - startTime,
  //     }).catch(console.error);
  //   }
  //
  //   return new Response(html, {
  //     headers: {
  //       'Content-Type': 'text/html',
  //       'X-Cache': 'COLD',
  //       'X-Cache-Location': 'cold',
  //     },
  //   });
  // }

  // 6. Check if job already in progress for this URL
  const existingJob = await renderJobQueries.findInProgressByUrl(db, normalizedUrl);

  if (existingJob) {
    // Job already queued or processing, return existing job ID
    return success(
      {
        status: existingJob.status,
        jobId: existingJob.id,
        statusUrl: `/api/status/${existingJob.id}`,
        estimatedTime: 5000,
        message: 'Render job already in progress for this URL.',
      },
      202,
    );
  }

  // 7. Create new render job
  // For Clerk users, we need to get or create an API key association
  // For MVP, we'll require an API key ID
  if (!authContext.apiKeyId) {
    return badRequest('API key required for render jobs. Clerk-only users should generate an API key first.');
  }

  const job = await renderJobQueries.create(db, {
    apiKeyId: authContext.apiKeyId,
    url,
    normalizedUrl,
    status: 'queued',
  });

  // 8. Add to BullMQ queue
  const renderQueue = getRenderQueue();
  await renderQueue.add('render', {
    jobId: job.id,
    url,
    normalizedUrl,
    waitForSelector: parseResult.data.waitForSelector,
    timeout: parseResult.data.timeout,
  });

  // Log cache miss (async)
  cacheAccessQueries.log(db, {
    apiKeyId: authContext.apiKeyId,
    normalizedUrl,
    cacheLocation: 'none',
    responseTimeMs: Date.now() - startTime,
  }).catch(console.error);

  // Return job details with 202 Accepted
  return success(
    {
      status: 'queued',
      jobId: job.id,
      statusUrl: `/api/status/${job.id}`,
      estimatedTime: 5000,
      message: 'Page is being rendered. Poll statusUrl for completion.',
    },
    202,
  );
});
