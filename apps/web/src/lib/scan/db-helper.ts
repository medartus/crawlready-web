/**
 * Thin wrapper to get the Drizzle DB instance in API routes.
 *
 * Re-exports from the app's DB module so that scan/orchestrator
 * doesn't import directly from `@/libs/DB` (which has Next.js
 * auto-migration logic we don't want to couple to).
 */

import { db } from '@/libs/DB';

export function getDb() {
  return db;
}
