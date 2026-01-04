/**
 * Render job queries
 */

import { and, desc, eq, or } from 'drizzle-orm';

import type { NewRenderJob, RenderJob } from '../schema';
import { renderJobs } from '../schema';

// Database type - will be inferred from connection
type Database = any;

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
