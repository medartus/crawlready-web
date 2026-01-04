/**
 * User API Keys Management
 *
 * GET /api/user/keys - List user's API keys
 * POST /api/user/keys - Generate new API key
 */

import { apiKeyQueries, apiKeys } from '@crawlready/database';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/libs/api-error-handler';
import { generateApiKey, hashApiKey } from '@/libs/api-key-utils';
import {
  conflict,
  created,
  success,
  validationError,
} from '@/libs/api-response-helpers';
import { requireAuth } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';

/**
 * GET /api/user/keys
 * List all API keys for the authenticated user
 */
export const GET = withErrorHandler(async () => {
  // Require authentication
  const { userId } = await requireAuth();

  // Get user's API keys
  const userKeys = await apiKeyQueries.findByUserId(db, userId);

  return success({
    keys: userKeys.map(key => ({
      id: key.id,
      keyPrefix: key.keyPrefix,
      tier: key.tier,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      isActive: key.isActive,
      rateLimitDaily: key.rateLimitDaily,
    })),
    total: userKeys.length,
  });
});

/**
 * POST /api/user/keys
 * Generate a new API key for the authenticated user
 */

const createKeySchema = z.object({
  tier: z.enum(['free', 'pro', 'enterprise']).optional().default('free'),
  name: z.string().min(1).max(100).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Require authentication
  const { userId, orgId } = await requireAuth();

  // Parse and validate request body
  const body = await request.json();
  const parseResult = createKeySchema.safeParse(body);

  if (!parseResult.success) {
    return validationError(parseResult.error);
  }

  const { tier, name } = parseResult.data;

  // Check if user has reached the limit (10 keys per user)
  const activeKeysCount = await apiKeyQueries.countActiveByUserId(db, userId);

  if (activeKeysCount >= 10) {
    return conflict(
      'Maximum of 10 active API keys per user. Please revoke an existing key first.',
    );
  }

  // Generate new API key
  const { key: plainKey, prefix } = generateApiKey(tier);
  const keyHash = hashApiKey(plainKey);

  // Determine rate limits based on tier
  const rateLimits = {
    free: 100,
    pro: 1000,
    enterprise: 999999,
  };

  // Insert into database
  const [newKey] = await db
    .insert(apiKeys)
    .values({
      userId,
      orgId,
      keyHash,
      keyPrefix: prefix,
      customerEmail: name || `user-${userId.substring(0, 8)}`,
      tier,
      rateLimitDaily: rateLimits[tier],
    })
    .returning();

  // Return the plain key (ONLY shown once)
  return created({
    key: plainKey,
    info: {
      id: newKey!.id,
      keyPrefix: newKey!.keyPrefix,
      tier: newKey!.tier,
      createdAt: newKey!.createdAt,
      rateLimitDaily: newKey!.rateLimitDaily,
    },
    message:
      'API key generated successfully. Save it now - you won\'t see it again!',
  });
});
