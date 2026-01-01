// NOTE: This is a temporary copy from src/models/Schema.ts
// TODO: Move to shared package when implementing monorepo (see documentation/architecture/monorepo-refactor-plan.md)

import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums for CrawlReady
export const apiKeyTierEnum = pgEnum('api_key_tier', ['free', 'pro', 'enterprise']);
export const jobStatusEnum = pgEnum('job_status', ['queued', 'processing', 'completed', 'failed']);
export const cacheLocationEnum = pgEnum('cache_location', ['hot', 'cold', 'none']);

// API Keys Table
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  orgId: text('org_id'),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
  tier: apiKeyTierEnum('tier').notNull().default('free'),
  rateLimitDaily: integer('rate_limit_daily').notNull().default(100),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
}, table => ({
  keyHashIdx: index('idx_api_keys_key_hash').on(table.keyHash),
  customerEmailIdx: index('idx_api_keys_customer_email').on(table.customerEmail),
  isActiveIdx: index('idx_api_keys_is_active').on(table.isActive),
  userIdIdx: index('idx_api_keys_user_id').on(table.userId),
  orgIdIdx: index('idx_api_keys_org_id').on(table.orgId),
}));

// Render Jobs Table
export const renderJobs = pgTable('render_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  normalizedUrl: text('normalized_url').notNull(),
  status: jobStatusEnum('status').notNull().default('queued'),
  queuedAt: timestamp('queued_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  renderDurationMs: integer('render_duration_ms'),
  htmlSizeBytes: integer('html_size_bytes'),
  storageKey: text('storage_key'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),
  workerId: varchar('worker_id', { length: 100 }),
  puppeteerVersion: varchar('puppeteer_version', { length: 20 }),
}, table => ({
  apiKeyStatusIdx: index('idx_render_jobs_api_key_status').on(table.apiKeyId, table.status),
  normalizedUrlIdx: index('idx_render_jobs_normalized_url').on(table.normalizedUrl),
  queuedAtIdx: index('idx_render_jobs_queued_at').on(table.queuedAt),
  statusCreatedIdx: index('idx_render_jobs_status_created').on(table.status, table.queuedAt),
}));

// Cache Access Logs Table
export const cacheAccesses = pgTable('cache_accesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  normalizedUrl: text('normalized_url').notNull(),
  cacheLocation: cacheLocationEnum('cache_location').notNull(),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull().defaultNow(),
  responseTimeMs: integer('response_time_ms').notNull(),
}, table => ({
  apiKeyDateIdx: index('idx_cache_accesses_api_key_date').on(table.apiKeyId, table.accessedAt),
  normalizedUrlIdx: index('idx_cache_accesses_normalized_url').on(table.normalizedUrl),
  accessedAtIdx: index('idx_cache_accesses_accessed_at').on(table.accessedAt),
}));

// Rendered Pages Metadata Table
export const renderedPages = pgTable('rendered_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  normalizedUrl: text('normalized_url').notNull().unique(),
  storageKey: text('storage_key').notNull(),
  storageLocation: cacheLocationEnum('storage_location').notNull().default('hot'),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
  htmlSizeBytes: integer('html_size_bytes').notNull(),
  firstRenderedAt: timestamp('first_rendered_at', { withTimezone: true }).notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
  accessCount: integer('access_count').notNull().default(0),
  inRedis: boolean('in_redis').notNull().default(true),
}, table => ({
  normalizedUrlIdx: unique('idx_rendered_pages_normalized_url').on(table.normalizedUrl),
  lastAccessedIdx: index('idx_rendered_pages_last_accessed').on(table.lastAccessedAt),
  accessCountIdx: index('idx_rendered_pages_access_count').on(table.accessCount),
  inRedisIdx: index('idx_rendered_pages_in_redis').on(table.inRedis),
  apiKeyIdIdx: index('idx_rendered_pages_api_key_id').on(table.apiKeyId),
}));

// Type exports for TypeScript
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type RenderJob = typeof renderJobs.$inferSelect;
export type NewRenderJob = typeof renderJobs.$inferInsert;

export type CacheAccess = typeof cacheAccesses.$inferSelect;
export type NewCacheAccess = typeof cacheAccesses.$inferInsert;

export type RenderedPage = typeof renderedPages.$inferSelect;
export type NewRenderedPage = typeof renderedPages.$inferInsert;
