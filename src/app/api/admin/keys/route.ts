import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/libs/api-error-handler';
import { generateApiKey, hashApiKey } from '@/libs/api-key-utils';
import { created, validationError } from '@/libs/api-response-helpers';
import { requireAdminRole } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';
import { apiKeys } from '@/models/Schema';

/**
 * POST /api/admin/keys
 *
 * Generate a new API key (Admin only)
 */

const createKeySchema = z.object({
  customerEmail: z.string().email('Valid email required'),
  tier: z.enum(['free', 'pro', 'enterprise']),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify admin role
  const { userId, orgId } = await requireAdminRole();

  // Parse and validate request body
  const body = await request.json();
  const parseResult = createKeySchema.safeParse(body);

  if (!parseResult.success) {
    return validationError(parseResult.error);
  }

  const { customerEmail, tier } = parseResult.data;

  // Generate new API key
  const { key: plainKey, prefix } = generateApiKey(tier);
  const keyHash = hashApiKey(plainKey);

  // Determine rate limits based on tier
  const rateLimits = {
    free: 100,
    pro: 1000,
    enterprise: 999999,
  };

  // Insert into database with user association
  const [newKey] = await db
    .insert(apiKeys)
    .values({
      userId, // Associate with admin who created it
      orgId, // Associate with organization
      keyHash,
      keyPrefix: prefix,
      customerEmail,
      tier,
      rateLimitDaily: rateLimits[tier],
    })
    .returning();

  // Return the plain key (ONLY shown once)
  return created({
    key: plainKey,
    info: newKey,
    message: 'API key generated successfully. Save it now - you won\'t see it again!',
  });
});

/**
 * GET /api/admin/keys
 *
 * List all API keys (Admin only)
 */
export const GET = withErrorHandler(async () => {
  // Verify admin role
  await requireAdminRole();

  // Query all keys (select only safe fields)
  const allKeys = await db
    .select({
      id: apiKeys.id,
      customerEmail: apiKeys.customerEmail,
      keyPrefix: apiKeys.keyPrefix,
      tier: apiKeys.tier,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      rateLimitDaily: apiKeys.rateLimitDaily,
      isActive: apiKeys.isActive,
      userId: apiKeys.userId,
      orgId: apiKeys.orgId,
      // DO NOT return keyHash or any sensitive data
    })
    .from(apiKeys);

  return created({
    keys: allKeys.map(key => ({
      id: key.id,
      keyPrefix: key.keyPrefix,
      name: key.customerEmail,
      tier: key.tier,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      rateLimit: key.rateLimitDaily,
      isActive: key.isActive,
      userId: key.userId,
      orgId: key.orgId,
    })),
    total: allKeys.length,
  });
});
