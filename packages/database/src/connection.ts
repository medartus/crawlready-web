/**
 * Clean database connection for CrawlReady
 *
 * This provides a pure Postgres connection without PGlite or Next.js dependencies.
 * Suitable for both web app (production) and worker.
 */

import { logger } from '@crawlready/logger';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

import { schema } from './schema';

let client: Client | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;

/**
 * Create and return database connection
 */
export async function createConnection(connectionString: string) {
  if (drizzleDb) {
    return drizzleDb;
  }

  client = new Client({ connectionString });
  await client.connect();

  drizzleDb = drizzle(client, { schema });
  logger.info('Database connection established');

  return drizzleDb;
}

/**
 * Get database instance (must be initialized first via createConnection)
 */
export function getDb() {
  if (!drizzleDb) {
    throw new Error('Database not initialized. Call createConnection() first.');
  }
  return drizzleDb;
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  if (client) {
    logger.info('Closing database connection (SIGTERM)');
    await client.end();
  }
});

process.on('SIGINT', async () => {
  if (client) {
    logger.info('Closing database connection (SIGINT)');
    await client.end();
  }
});
