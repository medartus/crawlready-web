/**
 * API Key queries
 */

import { and, desc, eq } from 'drizzle-orm';

import type { ApiKey } from '../schema';
import { apiKeys } from '../schema';
import { hashApiKey } from '../utils';

// Database type - will be inferred from connection
type Database = any;

export const apiKeyQueries = {
  /**
   * Find API key by provided key (hashes and looks up)
   */
  async findByKey(db: Database, providedKey: string): Promise<ApiKey | undefined> {
    const keyHash = hashApiKey(providedKey);

    return await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true),
      ),
    });
  },

  /**
   * Update last used timestamp
   */
  async updateLastUsed(db: Database, apiKeyId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKeyId));
  },

  /**
   * Find all API keys for a user
   */
  async findByUserId(db: Database, userId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  },

  /**
   * Find active API keys for a user
   */
  async findActiveByUserId(db: Database, userId: string): Promise<ApiKey[]> {
    return await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.isActive, true),
        ),
      )
      .orderBy(desc(apiKeys.createdAt));
  },

  /**
   * Find API key by ID and user ID (for authorization)
   */
  async findByIdAndUserId(db: Database, keyId: string, userId: string): Promise<ApiKey | undefined> {
    return await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.id, keyId),
        eq(apiKeys.userId, userId),
      ),
    });
  },

  /**
   * Revoke API key (soft delete)
   */
  async revoke(db: Database, keyId: string, userId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(
        and(
          eq(apiKeys.id, keyId),
          eq(apiKeys.userId, userId),
        ),
      );
  },

  /**
   * Count active keys for a user
   */
  async countActiveByUserId(db: Database, userId: string): Promise<number> {
    const result = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.isActive, true),
        ),
      );

    return result.length;
  },
};
