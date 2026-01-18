/**
 * GET /api/onboarding/crawl-status
 *
 * Returns the status of render jobs for onboarding pre-caching.
 * Used by the crawl page to poll for progress.
 */

import { auth } from '@clerk/nextjs/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db, schema } from '@/libs/DB';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const jobIds = searchParams.get('jobIds'); // Comma-separated list

    if (!siteId && !jobIds) {
      return NextResponse.json({
        error: 'Either siteId or jobIds parameter is required',
      }, { status: 400 });
    }

    // If siteId provided, verify ownership
    if (siteId) {
      const site = await db.query.sites.findFirst({
        where: and(
          eq(schema.sites.id, siteId),
          eq(schema.sites.orgId, orgId ?? userId),
          isNull(schema.sites.deletedAt),
        ),
      });

      if (!site) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }
    }

    // Get render jobs
    let jobs;
    if (jobIds) {
      const jobIdArray = jobIds.split(',').map(id => id.trim());
      jobs = await db
        .select()
        .from(schema.renderJobs)
        .where(inArray(schema.renderJobs.id, jobIdArray));
    } else {
      // Get all recent render jobs for the user's API keys
      const userApiKeys = await db.query.apiKeys.findMany({
        where: and(
          eq(schema.apiKeys.userId, userId),
          eq(schema.apiKeys.isActive, true),
        ),
        columns: { id: true },
      });

      const apiKeyIds = userApiKeys.map(k => k.id);
      if (apiKeyIds.length === 0) {
        return NextResponse.json({
          jobs: [],
          summary: { total: 0, queued: 0, processing: 0, completed: 0, failed: 0 },
        });
      }

      jobs = await db
        .select()
        .from(schema.renderJobs)
        .where(inArray(schema.renderJobs.apiKeyId, apiKeyIds))
        .orderBy(schema.renderJobs.queuedAt)
        .limit(100);
    }

    // Calculate summary
    const summary = {
      total: jobs.length,
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };

    // Format response
    const formattedJobs = jobs.map(job => ({
      id: job.id,
      url: job.url,
      normalizedUrl: job.normalizedUrl,
      status: job.status,
      queuedAt: job.queuedAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      renderDurationMs: job.renderDurationMs,
      htmlSizeBytes: job.htmlSizeBytes,
      errorMessage: job.errorMessage,
    }));

    return NextResponse.json({
      jobs: formattedJobs,
      summary,
      allCompleted: summary.queued === 0 && summary.processing === 0,
    });
  } catch (error) {
    console.error('Crawl status error:', error);
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}
