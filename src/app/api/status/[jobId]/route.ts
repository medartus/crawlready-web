/**
 * GET /api/status/:jobId
 *
 * Check status of a render job.
 * Supports dual authentication: API key OR Clerk session.
 */

import type { NextRequest } from 'next/server';

import { withErrorHandler } from '@/libs/api-error-handler';
import { badRequest, notFound, success, unauthorized } from '@/libs/api-response-helpers';
import { db } from '@/libs/DB';
import { renderJobQueries } from '@/libs/db-queries';
import { authenticateRequest } from '@/libs/dual-auth';

type RouteContext = {
  params: {
    jobId: string;
  };
};

export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteContext,
) => {
  // 1. Dual authentication
  const authContext = await authenticateRequest(request);

  if (!authContext) {
    return unauthorized('Provide API key in Authorization header OR sign in with Clerk');
  }

  // 2. Get job ID from params
  const { jobId } = context.params;

  if (!jobId) {
    return badRequest('Missing jobId parameter');
  }

  // 3. Query job from database
  const job = await renderJobQueries.findById(db, jobId);

  if (!job) {
    return notFound('Job not found');
  }

  // 4. Return status based on job state
  if (job.status === 'queued') {
    return success({
      status: 'queued',
      jobId: job.id,
      message: 'Job is in queue, waiting for worker',
      queuedAt: job.queuedAt.toISOString(),
    });
  }

  if (job.status === 'processing') {
    const progress = job.startedAt
      ? Math.min(90, Math.floor((Date.now() - job.startedAt.getTime()) / 50))
      : 10;

    return success({
      status: 'processing',
      jobId: job.id,
      progress,
      message: 'Worker is rendering the page...',
      startedAt: job.startedAt?.toISOString(),
      estimatedCompletion: new Date(Date.now() + 5000).toISOString(),
    });
  }

  if (job.status === 'completed') {
    return success({
      status: 'completed',
      jobId: job.id,
      url: job.url,
      cachedUrl: '/api/render',
      size: job.htmlSizeBytes,
      renderTime: job.renderDurationMs,
      completedAt: job.completedAt?.toISOString(),
      message: 'Page rendered successfully. Subsequent requests will be served from cache.',
    });
  }

  if (job.status === 'failed') {
    return success({
      status: 'failed',
      jobId: job.id,
      error: job.errorMessage || 'Unknown error',
      errorCode: 'render_failed',
      retriesLeft: Math.max(0, 3 - job.retryCount),
      failedAt: job.completedAt?.toISOString(),
      suggestion: 'Check if site is accessible and try again',
    });
  }

  // Fallback (shouldn't reach here)
  return success({
    status: job.status,
    jobId: job.id,
    message: 'Job status unknown',
  });
});
