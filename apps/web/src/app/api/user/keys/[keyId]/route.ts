/**
 * User API Key Management - Individual Key Operations
 *
 * GET /api/user/keys/:keyId - Get key usage stats
 * DELETE /api/user/keys/:keyId - Revoke API key
 */

import { apiKeyQueries } from '@crawlready/database';
import type { NextRequest } from 'next/server';

import { withErrorHandler } from '@/libs/api-error-handler';
import {
  forbidden,
  noContent,
  notFound,
  success,
} from '@/libs/api-response-helpers';
import { requireAuth } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';

// Force dynamic rendering - this route uses headers for authentication
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    keyId: string;
  };
};

/**
 * GET /api/user/keys/:keyId
 * Get usage statistics for a specific API key
 */
export const GET = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    // Require authentication
    const { userId } = await requireAuth();

    const { keyId } = context.params;

    // Find key and verify ownership
    const key = await apiKeyQueries.findByIdAndUserId(db, keyId, userId);

    if (!key) {
      return notFound(
        'API key not found or you do not have permission to access it',
      );
    }

    // TODO: Get usage statistics from usage_daily table
    // For now, return basic key info
    return success({
      id: key.id,
      keyPrefix: key.keyPrefix,
      tier: key.tier,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
      rateLimitDaily: key.rateLimitDaily,
      // TODO: Add usage stats when usage tracking is implemented
      usage: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
    });
  },
);

/**
 * DELETE /api/user/keys/:keyId
 * Revoke (soft delete) an API key
 */
export const DELETE = withErrorHandler(
  async (_request: NextRequest, context: RouteContext) => {
    // Require authentication
    const { userId } = await requireAuth();

    const { keyId } = context.params;

    // Find key and verify ownership
    const key = await apiKeyQueries.findByIdAndUserId(db, keyId, userId);

    if (!key) {
      return notFound(
        'API key not found or you do not have permission to access it',
      );
    }

    // Prevent revoking already inactive keys
    if (!key.isActive) {
      return forbidden('API key is already revoked');
    }

    // Revoke the key
    await apiKeyQueries.revoke(db, keyId, userId);

    return noContent();
  },
);
