/**
 * DELETE /api/cache?url={encoded_url}
 *
 * Invalidate cached page (remove from Redis and Supabase).
 */

import { type NextRequest, NextResponse } from 'next/server';

import { extractApiKey } from '@/libs/api-key-utils';
import { db } from '@/libs/DB';
import { apiKeyQueries, renderedPageQueries } from '@/libs/db-queries';
import { cache } from '@/libs/redis-client';
import { getCacheKey, normalizeUrl } from '@/libs/url-utils';

export async function DELETE(request: NextRequest) {
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

    return NextResponse.json({
      success: true,
      normalizedUrl,
      clearedFrom,
      freedSpace,
      message: clearedFrom.length > 0
        ? 'Cache cleared for URL. Next render request will re-render the page.'
        : 'URL was not cached',
    });
  } catch (error) {
    console.error('[/api/cache DELETE] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
