/**
 * Cache access logging queries
 */

import type { NewCacheAccess } from '../schema';
import { cacheAccesses } from '../schema';

// Database type - will be inferred from connection
type Database = any;

export const cacheAccessQueries = {
  /**
   * Log a cache access
   */
  async log(db: Database, access: NewCacheAccess): Promise<void> {
    await db.insert(cacheAccesses).values(access);
  },
};
