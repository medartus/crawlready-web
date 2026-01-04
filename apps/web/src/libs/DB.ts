import path from 'node:path';

import * as schema from '@crawlready/database';
import { logger } from '@crawlready/logger';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';
import { Client } from 'pg';

import { Env } from './Env';

let client;
let drizzle;

/**
 * AUTO_MIGRATE controls whether migrations run automatically on app startup.
 *
 * Development workflow:
 * - Local dev (PGlite): Set AUTO_MIGRATE=true (default) - migrations run automatically
 * - Supabase: Set AUTO_MIGRATE=false - use `supabase db push` instead
 *
 * Production workflow:
 * - Use `supabase db push` or run migrations manually before deployment
 * - Set AUTO_MIGRATE=false in production environment variables
 */
const AUTO_MIGRATE = process.env.AUTO_MIGRATE !== 'false';

// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate
if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && Env.DATABASE_URL) {
  client = new Client({
    connectionString: Env.DATABASE_URL,
  });
  await client.connect();

  drizzle = drizzlePg(client, { schema });

  // Run migrations only if AUTO_MIGRATE is enabled
  if (AUTO_MIGRATE) {
    try {
      await migratePg(drizzle, {
        migrationsFolder: path.join(process.cwd(), 'migrations'),
      });
      logger.info('✓ Database migrations completed successfully');
    } catch (error) {
      // Ignore "already exists" errors (migrations already applied)
      if (error instanceof Error && error.message.includes('already exists')) {
        logger.info('ℹ Database schema already up to date');
      } else {
        logger.error({ error }, '✗ Migration error');
        throw error;
      }
    }
  } else {
    logger.info('ℹ AUTO_MIGRATE=false - Skipping automatic migrations');
  }
} else {
  // Stores the db connection in the global scope to prevent multiple instances due to hot reloading with Next.js
  const global = globalThis as unknown as { client: PGlite; drizzle: PgliteDatabase<typeof schema> };

  if (!global.client) {
    global.client = new PGlite();
    await global.client.waitReady;

    global.drizzle = drizzlePglite(global.client, { schema });
  }

  drizzle = global.drizzle;

  // PGlite always runs migrations (in-memory database, no persistence issues)
  try {
    await migratePglite(global.drizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    });
  } catch (error) {
    // Ignore "already exists" errors for PGlite too (hot reload scenario)
    if (!(error instanceof Error && error.message.includes('already exists'))) {
      logger.error({ error }, '✗ PGlite migration error');
      throw error;
    }
  }
}

export const db = drizzle;
