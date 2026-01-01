/**
 * Worker-specific database connection
 *
 * This is a simplified DB connection for the render worker that only supports
 * Postgres (no PGlite fallback needed for production workers).
 *
 * Uses the shared schema from the main app but handles connection independently.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';

import * as schema from './src/models/schema';

// Create Postgres client
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Connect to database
await client.connect();

// Initialize Drizzle ORM with schema
export const db = drizzle(client, { schema });

// NOTE: Worker does not run migrations.
// Migrations should be run by the main application only.
// Worker simply connects to the existing database.

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  await client.end();
});

process.on('SIGINT', async () => {
  await client.end();
});
