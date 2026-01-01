// NOTE: This is a temporary copy from src/libs/db-queries.ts
// TODO: Move to shared package when implementing monorepo (see documentation/architecture/monorepo-refactor-plan.md)

/**
 * Database Query Utilities for CrawlReady Worker
 * Only includes queries needed by the render worker
 */

import { and, desc, eq, or } from 'drizzle-orm';

import type { db } from '../../db-connection';
import type {
  NewRenderedPage,
  NewRenderJob,
  RenderedPage,
  RenderJob,
} from '../models/schema';
import { renderedPages, renderJobs } from '../models/schema';

// Database type
type Database = typeof db;

/**
 * Render job queries
 */
export const renderJobQueries = {
  /**
   * Create a new render job
   */
  async create(db: Database, job: NewRenderJob): Promise<RenderJob> {
    const [created] = await db
      .insert(renderJobs)
      .values(job)
      .returning();

    return created!;
  },

  /**
   * Find job by ID
   */
  async findById(db: Database, jobId: string): Promise<RenderJob | undefined> {
    return await db.query.renderJobs.findFirst({
      where: eq(renderJobs.id, jobId),
    });
  },

  /**
   * Find in-progress job for URL
   */
  async findInProgressByUrl(
    db: Database,
    normalizedUrl: string,
  ): Promise<RenderJob | undefined> {
    return await db.query.renderJobs.findFirst({
      where: and(
        eq(renderJobs.normalizedUrl, normalizedUrl),
        or(
          eq(renderJobs.status, 'queued'),
          eq(renderJobs.status, 'processing'),
        ),
      ),
      orderBy: [desc(renderJobs.queuedAt)],
    });
  },

  /**
   * Update job status
   */
  async updateStatus(
    db: Database,
    jobId: string,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    updates?: Partial<RenderJob>,
  ): Promise<void> {
    await db
      .update(renderJobs)
      .set({
        status,
        ...updates,
      })
      .where(eq(renderJobs.id, jobId));
  },
};

/**
 * Rendered pages metadata
 */
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
