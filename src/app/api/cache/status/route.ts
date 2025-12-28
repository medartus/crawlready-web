/**
 * GET /api/cache/status?url={encoded_url}
 *
 * Check if a URL is cached and where (hot/cold/none).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { extractApiKey } from '@/libs/api-key-utils';
import { db } from '@/libs/DB';
import { apiKeyQueries, renderedPageQueries, renderJobQueries } from '@/libs/db-queries';
import { cache } from '@/libs/redis-client';
import { getCacheKey, normalizeUrl } from '@/libs/url-utils';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    const apiKey = extractApiKey(authHeader);

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or missing API key',
        },
        { status: 401 },
      );
    }

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

    // 2. Get URL from query params
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        {
          error: 'Bad request',
          message: 'Missing url parameter',
        },
        { status: 400 },
      );
    }

    // 3. Normalize URL and check cache
    const normalizedUrl = normalizeUrl(url);
    const cacheKey = getCacheKey(normalizedUrl);

    // Check hot cache (Redis)
    const hotCached = await cache.exists(cacheKey);

    if (hotCached) {
      const metadata = await renderedPageQueries.findByUrl(db, normalizedUrl);

      return NextResponse.json({
        cached: true,
        location: 'hot',
        normalizedUrl,
        lastRendered: metadata?.firstRenderedAt.toISOString(),
        age: metadata ? Math.floor((Date.now() - metadata.firstRenderedAt.getTime()) / 1000) : 0,
        size: metadata?.htmlSizeBytes,
        accessCount: metadata?.accessCount,
        rendering: false,
      });
    }

    // Check cold storage metadata
    const metadata = await renderedPageQueries.findByUrl(db, normalizedUrl);

    if (metadata) {
      // TODO: Verify file exists in Supabase Storage when cold storage is implemented
      return NextResponse.json({
        cached: true,
        location: 'cold',
        normalizedUrl,
        lastRendered: metadata.firstRenderedAt.toISOString(),
        age: Math.floor((Date.now() - metadata.firstRenderedAt.getTime()) / 1000),
        size: metadata.htmlSizeBytes,
        accessCount: metadata.accessCount,
        rendering: false,
      });
    }

    // Check if currently rendering
    const job = await renderJobQueries.findInProgressByUrl(db, normalizedUrl);

    if (job) {
      return NextResponse.json({
        cached: false,
        location: 'none',
        normalizedUrl,
        rendering: true,
        jobId: job.id,
        statusUrl: `/api/status/${job.id}`,
        message: 'Render job in progress',
      });
    }

    // Not cached
    return NextResponse.json({
      cached: false,
      location: 'none',
      normalizedUrl,
      rendering: false,
      message: 'URL has not been rendered yet',
    });
  } catch (error) {
    console.error('[/api/cache/status] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
