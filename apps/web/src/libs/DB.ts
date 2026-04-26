import path from 'node:path';

import { schema } from '@crawlready/database';
import { logger } from '@crawlready/logger';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { migrate as migratePg } from 'drizzle-orm/node-postgres/migrator';
import { PHASE_PRODUCTION_BUILD } from 'next/dist/shared/lib/constants';
import { Pool } from 'pg';

import { Env } from './Env';

let pool: Pool | null = null;
let drizzle: ReturnType<typeof drizzlePg> | null = null;

/**
 * AUTO_MIGRATE controls whether migrations run automatically on app startup.
 *
 * Production workflow:
 * - Use `supabase db push` or run migrations manually before deployment
 * - Set AUTO_MIGRATE=false in production environment variables
 */
const AUTO_MIGRATE = process.env.AUTO_MIGRATE !== 'false';

// Initialize database connection
if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && Env.DATABASE_URL) {
  const connectionString = Env.DATABASE_URL;

  // Validate Supabase connection string format for Vercel/serverless
  // Direct connections (db.xxx.supabase.co) don't work in serverless - must use connection pooler
  if (
    process.env.VERCEL === '1'
    && connectionString.includes('supabase.co')
    && connectionString.match(/@db\.\w+\.supabase\.co/)
    && !connectionString.includes('pooler')
  ) {
    throw new Error(
      'Invalid DATABASE_URL for Vercel. Direct connections (db.xxx.supabase.co) are not supported. '
      + 'Use the connection pooler URL from: https://app.supabase.com/project/_/settings/database → Connection Pooling',
    );
  }

  // Use Pool instead of Client for connection pooling (required for Vercel serverless)
  // Pool handles connection lifecycle better in serverless environments
  pool = new Pool({
    connectionString,
    // Connection pool settings optimized for serverless
    max: 1, // Serverless functions should use 1 connection per instance to avoid connection limits
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    // SSL is required for Supabase
    ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
  });

  const pgDrizzle = drizzlePg(pool, { schema });
  drizzle = pgDrizzle;

  // Run migrations only if AUTO_MIGRATE is enabled
  // Note: Migrations should be run separately in production, not on every cold start
  if (AUTO_MIGRATE) {
    migratePg(pgDrizzle, {
      migrationsFolder: path.join(process.cwd(), 'migrations'),
    })
      .then(() => {
        logger.info('✓ Database migrations completed successfully');
      })
      .catch((error) => {
        // Ignore "already exists" errors (migrations already applied)
        if (error instanceof Error && error.message.includes('already exists')) {
          logger.info('ℹ Database schema already up to date');
        } else {
          logger.error({ error }, '✗ Migration error');
          // Don't throw - allow app to start even if migrations fail
        }
      });
  } else {
    logger.info('ℹ AUTO_MIGRATE=false - Skipping automatic migrations');
  }
}

// Graceful shutdown handlers
if (pool) {
  process.on('SIGTERM', async () => {
    logger.info('Closing database connection pool (SIGTERM)');
    await pool?.end();
  });

  process.on('SIGINT', async () => {
    logger.info('Closing database connection pool (SIGINT)');
    await pool?.end();
  });
}

export const db = drizzle! as ReturnType<typeof drizzlePg<typeof schema>>;

// Re-export schema for convenience
export { schema } from '@crawlready/database';
