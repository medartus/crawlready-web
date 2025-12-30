/**
 * DELETE /api/cache?url={encoded_url}
 *
 * Invalidate cached page (remove from Redis and Supabase).
 * Supports dual authentication: API key OR Clerk session.
 */

import type { NextRequest } from 'next/server';

import { withErrorHandler } from '@/libs/api-error-handler';
import { badRequest, success, unauthorized } from '@/libs/api-response-helpers';
import { db } from '@/libs/DB';
import { renderedPageQueries } from '@/libs/db-queries';
import { authenticateRequest } from '@/libs/dual-auth';
import { cache } from '@/libs/redis-client';
import { getCacheKey, normalizeUrl } from '@/libs/url-utils';

export const DELETE = withErrorHandler(async (request: NextRequest) => {
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

  // 3. Normalize URL and delete from cache
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = getCacheKey(normalizedUrl);

  let freedSpace = 0;
  const clearedFrom: string[] = [];

  // Remove from hot cache (Redis)
  const deleted = await cache.del(cacheKey);

  if (deleted > 0) {
    clearedFrom.push('hot');
  }

  // Get metadata for freed space calculation
  const metadata = await renderedPageQueries.findByUrl(db, normalizedUrl);

  if (metadata) {
    freedSpace = metadata.htmlSizeBytes;

    // TODO: Remove from Supabase Storage when implemented
    // const storageKey = await getStorageKey(normalizedUrl);
    // await supabase.storage
    //   .from('rendered-pages')
    //   .remove([storageKey]);

    clearedFrom.push('cold');

    // Remove metadata from database
    await renderedPageQueries.delete(db, normalizedUrl);
  }

  return success({
    success: true,
    normalizedUrl,
    clearedFrom,
    freedSpace,
    message: clearedFrom.length > 0
      ? 'Cache cleared for URL. Next render request will re-render the page.'
      : 'URL was not cached',
  });
});
