/**
 * GET /api/cache/status?url={encoded_url}
 *
 * Check if a URL is cached and where (hot/cold/none).
 * Supports dual authentication: API key OR Clerk session.
 */

import { cache, getCacheKey, normalizeUrl } from '@crawlready/cache';
import { renderedPageQueries, renderJobQueries } from '@crawlready/database';
import type { NextRequest } from 'next/server';

import { withErrorHandler } from '@/libs/api-error-handler';
import { badRequest, success, unauthorized } from '@/libs/api-response-helpers';
import { db } from '@/libs/DB';
import { authenticateRequest } from '@/libs/dual-auth';

// Force dynamic rendering - this route uses request.headers for authentication
export const dynamic = 'force-dynamic';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 1. Dual authentication
  const authContext = await authenticateRequest(request);

  if (!authContext) {
    return unauthorized('Provide API key in Authorization header OR sign in with Clerk');
  }

  // 2. Get URL from query params
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return badRequest('Missing url parameter');
  }

  // 3. Normalize URL and check cache
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = getCacheKey(normalizedUrl);

  // Check hot cache (Redis)
  const hotCached = await cache.exists(cacheKey);

  if (hotCached) {
    const metadata = await renderedPageQueries.findByUrl(db, normalizedUrl);

    return success({
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
    return success({
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
    return success({
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
  return success({
    cached: false,
    location: 'none',
    normalizedUrl,
    rendering: false,
    message: 'URL has not been rendered yet',
  });
});
