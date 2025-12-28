import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateApiKey, hashApiKey } from '@/libs/api-key-utils';
import { db } from '@/libs/DB';
import { apiKeys } from '@/models/Schema';

/**
 * POST /api/admin/keys
 *
 * Generate a new API key
 */

const createKeySchema = z.object({
  customerEmail: z.string().email('Valid email required'),
  tier: z.enum(['free', 'pro', 'enterprise']),
});

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication
    // For MVP, this endpoint is unprotected (should be behind auth)

    // Parse and validate request body
    const body = await request.json();
    const parseResult = createKeySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parseResult.error.errors,
        },
        { status: 400 },
      );
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

    // Insert into database
    const [newKey] = await db
      .insert(apiKeys)
      .values({
        keyHash,
        keyPrefix: prefix,
        customerEmail,
        tier,
        rateLimitDaily: rateLimits[tier],
      })
      .returning();

    // Return the plain key (ONLY shown once)
    return NextResponse.json(
      {
        key: plainKey,
        info: newKey,
        message: 'API key generated successfully. Save it now - you won\'t see it again!',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[/api/admin/keys POST] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/keys
 *
 * List all API keys (without showing the actual keys)
 */
export async function GET() {
  try {
    // TODO: Add admin authentication

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
        // DO NOT return keyHash or any sensitive data
      })
      .from(apiKeys);

    return NextResponse.json({
      keys: allKeys.map(key => ({
        key: key.keyPrefix, // Show key prefix as identifier
        name: key.customerEmail, // Use email as display name
        tier: key.tier,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        rateLimit: key.rateLimitDaily,
        isActive: key.isActive,
      })),
      total: allKeys.length,
    });
  } catch (error) {
    console.error('[/api/admin/keys GET] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
