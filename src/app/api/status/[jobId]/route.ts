/**
 * GET /api/status/:jobId
 *
 * Check status of a render job.
 */

import { type NextRequest, NextResponse } from 'next/server';

import { extractApiKey } from '@/libs/api-key-utils';
import { db } from '@/libs/DB';
import { apiKeyQueries, renderJobQueries } from '@/libs/db-queries';

type RouteContext = {
  params: {
    jobId: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
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

    // 2. Get job ID from params
    const { jobId } = context.params;

    if (!jobId) {
      return NextResponse.json(
        {
          error: 'Bad request',
          message: 'Missing jobId parameter',
        },
        { status: 400 },
      );
    }

    // Query job from database
    const job = await renderJobQueries.findById(db, jobId);

    if (!job) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: 'Job not found',
        },
        { status: 404 },
      );
    }

    // Return status based on job state
    if (job.status === 'queued') {
      return NextResponse.json({
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

      return NextResponse.json({
        status: 'processing',
        jobId: job.id,
        progress,
        message: 'Worker is rendering the page...',
        startedAt: job.startedAt?.toISOString(),
        estimatedCompletion: new Date(Date.now() + 5000).toISOString(),
      });
    }

    if (job.status === 'completed') {
      return NextResponse.json({
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
      return NextResponse.json({
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
    return NextResponse.json({
      status: job.status,
      jobId: job.id,
      message: 'Job status unknown',
    });
  } catch (error) {
    console.error('[/api/status/:jobId] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
