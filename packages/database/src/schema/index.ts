import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ==========================================
// TODO App Schema (from boilerplate)
// ==========================================

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// ==========================================
// CRAWLREADY: Pre-Rendering Proxy Service
// ==========================================

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

// Daily Usage Metrics Table
export const usageDaily = pgTable('usage_daily', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  cacheHits: integer('cache_hits').notNull().default(0),
  cacheMisses: integer('cache_misses').notNull().default(0),
  rendersCompleted: integer('renders_completed').notNull().default(0),
  rendersFailed: integer('renders_failed').notNull().default(0),
  avgCacheHitTimeMs: integer('avg_cache_hit_time_ms'),
  avgRenderTimeMs: integer('avg_render_time_ms'),
  storageBytesAdded: bigint('storage_bytes_added', { mode: 'number' }).notNull().default(0),
  totalStorageBytes: bigint('total_storage_bytes', { mode: 'number' }).notNull().default(0),
}, table => ({
  apiKeyDateIdx: index('idx_usage_daily_api_key_date').on(table.apiKeyId, table.date),
  dateIdx: index('idx_usage_daily_date').on(table.date),
  apiKeyDateUnique: unique('usage_daily_api_key_date_unique').on(table.apiKeyId, table.date),
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

export type UsageDaily = typeof usageDaily.$inferSelect;
export type NewUsageDaily = typeof usageDaily.$inferInsert;

export type RenderedPage = typeof renderedPages.$inferSelect;
export type NewRenderedPage = typeof renderedPages.$inferInsert;

// ==========================================
// RELATIONS
// ==========================================

export const apiKeysRelations = relations(apiKeys, ({ many }) => ({
  renderedPages: many(renderedPages),
  renderJobs: many(renderJobs),
  cacheAccesses: many(cacheAccesses),
  usageDaily: many(usageDaily),
}));

export const renderedPagesRelations = relations(renderedPages, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [renderedPages.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const renderJobsRelations = relations(renderJobs, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [renderJobs.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const cacheAccessesRelations = relations(cacheAccesses, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [cacheAccesses.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const usageDailyRelations = relations(usageDaily, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [usageDaily.apiKeyId],
    references: [apiKeys.id],
  }),
}));

// Export schema object with all tables and relations for proper type inference
// This ensures Drizzle can properly infer types for db.query API
export const schema = {
  organizationSchema,
  todoSchema,
  apiKeys,
  renderJobs,
  cacheAccesses,
  usageDaily,
  renderedPages,
  apiKeysRelations,
  renderedPagesRelations,
  renderJobsRelations,
  cacheAccessesRelations,
  usageDailyRelations,
};
