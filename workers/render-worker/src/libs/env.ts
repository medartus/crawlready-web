// NOTE: This is a simplified version of src/libs/Env.ts for the worker
// TODO: Move to shared package when implementing monorepo (see documentation/architecture/monorepo-refactor-plan.md)

/**
 * Environment variables for the worker
 * Simplified version without t3-oss/env-nextjs dependency
 */
export const Env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Supabase Storage
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'rendered-pages',

  // Redis
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  UPSTASH_REDIS_HOST: process.env.UPSTASH_REDIS_HOST || '',
  UPSTASH_REDIS_PORT: process.env.UPSTASH_REDIS_PORT || '',
  UPSTASH_REDIS_PASSWORD: process.env.UPSTASH_REDIS_PASSWORD || '',
  UPSTASH_REDIS_TLS: process.env.UPSTASH_REDIS_TLS || 'true',

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'production',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
