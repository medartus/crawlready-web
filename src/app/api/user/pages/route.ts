/**
 * User Rendered Pages Management
 *
 * GET /api/user/pages - List user's rendered pages
 */

import { desc, inArray, sql } from 'drizzle-orm';

import { withErrorHandler } from '@/libs/api-error-handler';
import { success } from '@/libs/api-response-helpers';
import { requireAuth } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';
import { apiKeys, renderedPages } from '@/models/Schema';

/**
 * GET /api/user/pages
 * List all rendered pages for the authenticated user
 */
export const GET = withErrorHandler(async () => {
  // Require authentication
  const { userId } = await requireAuth();

  // Get user's API keys
  const userApiKeys = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(sql`${apiKeys.userId} = ${userId}`);

  const apiKeyIds = userApiKeys.map(k => k.id);

  if (apiKeyIds.length === 0) {
    // User has no API keys yet
    return success({
      pages: [],
      total: 0,
    });
  }

  // Get rendered pages for user's API keys
  const pages = await db
    .select({
      id: renderedPages.id,
      normalizedUrl: renderedPages.normalizedUrl,
      htmlSizeBytes: renderedPages.htmlSizeBytes,
      firstRenderedAt: renderedPages.firstRenderedAt,
      lastAccessedAt: renderedPages.lastAccessedAt,
      accessCount: renderedPages.accessCount,
      storageLocation: renderedPages.storageLocation,
    })
    .from(renderedPages)
    .where(inArray(renderedPages.apiKeyId, apiKeyIds))
    .orderBy(desc(renderedPages.lastAccessedAt))
    .limit(100); // Limit to 100 most recent pages

  return success({
    pages: pages.map(page => ({
      id: page.id,
      url: page.normalizedUrl,
      size: page.htmlSizeBytes,
      firstRendered: page.firstRenderedAt.toISOString(),
      lastAccessed: page.lastAccessedAt.toISOString(),
      accessCount: page.accessCount,
      storageLocation: page.storageLocation,
    })),
    total: pages.length,
  });
});
