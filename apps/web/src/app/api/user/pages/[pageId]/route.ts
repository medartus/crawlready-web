/**
 * User Rendered Page - Individual Page Operations
 *
 * GET /api/user/pages/:pageId - Get rendered HTML
 * DELETE /api/user/pages/:pageId - Invalidate cache for page
 */

import { cache, getCacheKey } from '@crawlready/cache';
import { apiKeys, renderedPageQueries, renderedPages } from '@crawlready/database';
import { logger } from '@crawlready/logger';
import { deleteRenderedPage, isStorageConfigured } from '@crawlready/storage';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/libs/api-error-handler';
import { noContent, notFound, success } from '@/libs/api-response-helpers';
import { requireAuth } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';

type RouteContext = {
  params: {
    pageId: string;
  };
};

/**
 * GET /api/user/pages/:pageId
 * Get rendered HTML for a specific page
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    // Require authentication
    const { userId } = await requireAuth();

    const { pageId } = context.params;

    // Get user's API keys
    const userApiKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(sql`${apiKeys.userId} = ${userId}`);

    const apiKeyIds = userApiKeys.map(k => k.id);

    if (apiKeyIds.length === 0) {
      return notFound(
        'Page not found or you do not have permission to access it',
      );
    }

    // Find page and verify ownership
    const page = await db.query.renderedPages.findFirst({
      where: and(
        eq(renderedPages.id, pageId),
        inArray(renderedPages.apiKeyId, apiKeyIds),
      ),
    });

    if (!page) {
      return notFound(
        'Page not found or you do not have permission to access it',
      );
    }

    // Try to get HTML from hot cache
    const cacheKey = getCacheKey(page.normalizedUrl);
    const cachedHtml = await cache.get(cacheKey);

    if (cachedHtml) {
      return new NextResponse(cachedHtml, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Cache': 'HIT',
          'X-Cache-Location': 'hot',
        },
      });
    }

    // TODO: Get from Supabase Storage when implemented
    // For now, return metadata only
    return success({
      id: page.id,
      url: page.normalizedUrl,
      size: page.htmlSizeBytes,
      firstRendered: page.firstRenderedAt.toISOString(),
      lastAccessed: page.lastAccessedAt.toISOString(),
      accessCount: page.accessCount,
      storageLocation: page.storageLocation,
      message:
        'HTML not available in hot cache. Cold storage retrieval not yet implemented.',
    });
  },
);

/**
 * DELETE /api/user/pages/:pageId
 * Invalidate cache for a specific page
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    // Require authentication
    const { userId } = await requireAuth();

    const { pageId } = context.params;

    // Get user's API keys
    const userApiKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(sql`${apiKeys.userId} = ${userId}`);

    const apiKeyIds = userApiKeys.map(k => k.id);

    if (apiKeyIds.length === 0) {
      return notFound(
        'Page not found or you do not have permission to access it',
      );
    }

    // Find page and verify ownership
    const page = await db.query.renderedPages.findFirst({
      where: and(
        eq(renderedPages.id, pageId),
        inArray(renderedPages.apiKeyId, apiKeyIds),
      ),
    });

    if (!page) {
      return notFound(
        'Page not found or you do not have permission to access it',
      );
    }

    // Remove from hot cache
    const cacheKey = getCacheKey(page.normalizedUrl);
    await cache.del(cacheKey);

    // Remove from Supabase cold storage
    if (isStorageConfigured() && page.storageKey) {
      const deleteResult = await deleteRenderedPage(page.storageKey);

      if (!deleteResult.success) {
        // Log warning but don't fail the request
        logger.warn({
          storageKey: page.storageKey,
          pageId,
          error: deleteResult.error,
        }, 'Failed to delete from cold storage');
      }
    }

    // Remove metadata from database
    await renderedPageQueries.delete(db, page.normalizedUrl);

    logger.info({ pageId, url: page.normalizedUrl }, 'Page deleted successfully');

    return noContent();
  },
);
