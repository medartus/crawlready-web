/**
 * Rendered pages metadata queries
 */

import { eq } from 'drizzle-orm';

import type { NewRenderedPage, RenderedPage } from '../schema';
import { renderedPages } from '../schema';

// Database type - will be inferred from connection
type Database = any;

export const renderedPageQueries = {
  /**
   * Find page metadata by URL
   */
  async findByUrl(db: Database, normalizedUrl: string): Promise<RenderedPage | undefined> {
    return await db.query.renderedPages.findFirst({
      where: eq(renderedPages.normalizedUrl, normalizedUrl),
    });
  },

  /**
   * Create or update page metadata
   */
  async upsert(db: Database, page: NewRenderedPage): Promise<void> {
    await db
      .insert(renderedPages)
      .values(page)
      .onConflictDoUpdate({
        target: renderedPages.normalizedUrl,
        set: {
          storageKey: page.storageKey,
          htmlSizeBytes: page.htmlSizeBytes,
          lastAccessedAt: new Date(),
          inRedis: page.inRedis ?? true,
        },
      });
  },

  /**
   * Update access count and timestamp
   */
  async incrementAccess(db: Database, normalizedUrl: string): Promise<void> {
    const page = await db.query.renderedPages.findFirst({
      where: eq(renderedPages.normalizedUrl, normalizedUrl),
    });

    if (page) {
      await db
        .update(renderedPages)
        .set({
          accessCount: page.accessCount + 1,
          lastAccessedAt: new Date(),
        })
        .where(eq(renderedPages.normalizedUrl, normalizedUrl));
    }
  },

  /**
   * Delete page metadata
   */
  async delete(db: Database, normalizedUrl: string): Promise<void> {
    await db
      .delete(renderedPages)
      .where(eq(renderedPages.normalizedUrl, normalizedUrl));
  },
};
