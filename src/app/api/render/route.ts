/**
 * POST /api/render
 *
 * Core endpoint for pre-rendering pages.
 * Returns cached HTML (200) or queues job (202).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { extractApiKey } from '@/libs/api-key-utils';
import { db } from '@/libs/DB';
import { apiKeyQueries, cacheAccessQueries, renderJobQueries } from '@/libs/db-queries';
import { cache, getRenderQueue, rateLimit } from '@/libs/redis-client';
import { SSRFError, validateUrlSecurity } from '@/libs/ssrf-protection';
import { getCacheKey, normalizeUrl } from '@/libs/url-utils';

// Request body schema
const renderRequestSchema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  timeout: z.number().int().min(1000).max(60000).optional().default(30000),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate API key
    const authHeader = request.headers.get('authorization');
    const apiKey = extractApiKey(authHeader);

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or missing API key',
          hint: 'Provide API key in Authorization header: Bearer sk_live_...',
        },
        { status: 401 },
      );
    }

    // Verify API key against database
    const customer = await apiKeyQueries.findByKey(db, apiKey);

    if (!customer) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid API key',
        },
        { status: 401 },
      );
    }

    // Update last used timestamp (async, don't block)
    apiKeyQueries.updateLastUsed(db, customer.id).catch(console.error);

    // Check rate limit
    const rateLimitKey = `ratelimit:${customer.id}`;
    const rateLimitResult = await rateLimit.check(rateLimitKey, customer.rateLimitDaily);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Daily render limit reached',
          limit: rateLimitResult.limit,
          used: rateLimitResult.used,
          remaining: 0,
          resetAt: rateLimitResult.resetAt.toISOString(),
          upgradeUrl: 'https://crawlready.com/pricing',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)),
          },
        },
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const parseResult = renderRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request validation failed',
          details: parseResult.error.format(),
        },
        { status: 400 },
      );
    }

    const { url } = parseResult.data;
    // TODO: Use these when implementing render worker
    // const { waitForSelector, timeout } = parseResult.data;

    // 3. SSRF protection
    try {
      validateUrlSecurity(url);
    } catch (error) {
      if (error instanceof SSRFError) {
        return NextResponse.json(
          {
            error: 'Invalid URL',
            message: error.message,
            details: {
              url,
              reason: 'hostname_blocked',
            },
          },
          { status: 400 },
        );
      }
      throw error;
    }

    // 4. Normalize URL and check cache
    const startTime = Date.now();
    const normalizedUrl = normalizeUrl(url);
    const cacheKey = getCacheKey(normalizedUrl);

    // Check hot cache (Redis)
    const cachedHtml = await cache.get(cacheKey);

    if (cachedHtml) {
      const responseTime = Date.now() - startTime;

      // Log cache access (async)
      cacheAccessQueries.log(db, {
        apiKeyId: customer.id,
        normalizedUrl,
        cacheLocation: 'hot',
        responseTimeMs: responseTime,
      }).catch(console.error);

      return new Response(cachedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Cache': 'HIT',
          'X-Cache-Location': 'hot',
          'X-Served-By': 'CrawlReady',
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
    //   cacheAccessQueries.log(db, {
    //     apiKeyId: customer.id,
    //     normalizedUrl,
    //     cacheLocation: 'cold',
    //     responseTimeMs: Date.now() - startTime,
    //   }).catch(console.error);
    //
    //   return new Response(html, {
    //     headers: {
    //       'Content-Type': 'text/html',
    //       'X-Cache': 'COLD',
    //       'X-Cache-Location': 'cold',
    //     },
    //   });
    // }

    // 5. Check if job already in progress for this URL
    const existingJob = await renderJobQueries.findInProgressByUrl(db, normalizedUrl);

    if (existingJob) {
      // Job already queued or processing, return existing job ID
      return NextResponse.json(
        {
          status: existingJob.status,
          jobId: existingJob.id,
          statusUrl: `/api/status/${existingJob.id}`,
          estimatedTime: 5000,
          message: 'Render job already in progress for this URL.',
        },
        { status: 202 },
      );
    }

    // 6. Create new render job
    const job = await renderJobQueries.create(db, {
      apiKeyId: customer.id,
      url,
      normalizedUrl,
      status: 'queued',
    });

    // Add to BullMQ queue
    const renderQueue = getRenderQueue();
    await renderQueue.add('render', {
      jobId: job.id,
      url,
      normalizedUrl,
      waitForSelector: parseResult.data.waitForSelector,
      timeout: parseResult.data.timeout,
    });

    // Log cache miss
    cacheAccessQueries.log(db, {
      apiKeyId: customer.id,
      normalizedUrl,
      cacheLocation: 'none',
      responseTimeMs: Date.now() - startTime,
    }).catch(console.error);

    return NextResponse.json(
      {
        status: 'queued',
        jobId: job.id,
        statusUrl: `/api/status/${job.id}`,
        estimatedTime: 5000,
        message: 'Page is being rendered. Poll statusUrl for completion.',
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('[/api/render] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
