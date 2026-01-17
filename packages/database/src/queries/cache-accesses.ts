/**
 * Cache access logging queries
 */

import type { CacheAccess, NewCacheAccess } from '../schema';
import { cacheAccesses } from '../schema';

// Database type - will be inferred from connection
type Database = any;

// Extended cache access data with crawler info
type CacheAccessWithCrawler = NewCacheAccess & {
  siteId?: string | null;
  crawlerName?: string | null;
  crawlerType?: string | null;
  userAgent?: string | null;
};

export const cacheAccessQueries = {
  /**
   * Log a cache access (legacy method, no crawler info)
   */
  async log(db: Database, access: NewCacheAccess): Promise<void> {
    await db.insert(cacheAccesses).values(access);
  },

  /**
   * Create a cache access record with crawler attribution
   */
  async create(db: Database, access: CacheAccessWithCrawler): Promise<CacheAccess | null> {
    const [result] = await db.insert(cacheAccesses).values({
      apiKeyId: access.apiKeyId,
      normalizedUrl: access.normalizedUrl,
      cacheLocation: access.cacheLocation,
      responseTimeMs: access.responseTimeMs,
      // Additional crawler fields (if columns exist)
      ...(access.siteId && { siteId: access.siteId }),
      ...(access.crawlerName && { crawlerName: access.crawlerName }),
      ...(access.crawlerType && { crawlerType: access.crawlerType }),
      ...(access.userAgent && { userAgent: access.userAgent }),
    }).returning();
    return result || null;
  },
};
