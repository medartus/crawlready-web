# CrawlReady: Database Schema Specification

**Version**: 1.0  
**Date**: December 28, 2024  
**Status**: Draft - Pending Approval  
**Dependencies**: Business Requirements v1.0, Functional Specification v1.0

---

## 1. Overview

### 1.1 Purpose

This document specifies the PostgreSQL database schema for the CrawlReady pre-rendering proxy service, including:
- Table structures with proper ENUM types (not varchar)
- Relationships and foreign keys
- Indexes for query optimization
- Drizzle ORM definitions
- Migration strategy

### 1.2 Database Technology

**Platform**: Supabase PostgreSQL 15+  
**ORM**: Drizzle ORM (type-safe, performance-focused)  
**Migrations**: Drizzle Kit  
**Connection**: SSL required, connection pooling via Supabase Pooler

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐
│   api_keys      │
│─────────────────│
│ id (PK)         │
│ customer_email  │
│ key_hash        │─┐
│ tier (ENUM)     │ │
│ rate_limit      │ │
└─────────────────┘ │
                     │
         ┌───────────┴──────────────┬─────────────────────┐
         │                          │                     │
         ▼                          ▼                     ▼
┌─────────────────┐        ┌─────────────────┐  ┌──────────────────┐
│  render_jobs    │        │ cache_accesses  │  │   usage_daily    │
│─────────────────│        │─────────────────│  │──────────────────│
│ id (PK)         │        │ id (PK)         │  │ id (PK)          │
│ api_key_id (FK) │        │ api_key_id (FK) │  │ api_key_id (FK)  │
│ url             │        │ normalized_url  │  │ date             │
│ normalized_url  │───┐    │ cache_location  │  │ cache_hits       │
│ status (ENUM)   │   │    │ response_time   │  │ cache_misses     │
│ storage_key     │   │    └─────────────────┘  │ storage_bytes    │
└─────────────────┘   │                         └──────────────────┘
                      │
                      │
                      ▼
             ┌─────────────────┐
             │ rendered_pages  │
             │─────────────────│
             │ id (PK)         │
             │ normalized_url  │ (UNIQUE)
             │ storage_key     │
             │ html_size_bytes │
             │ access_count    │
             │ in_redis        │
             └─────────────────┘
```

---

## 3. Enum Types

### 3.1 api_key_tier

**Purpose**: Define customer pricing tiers.

```sql
CREATE TYPE api_key_tier AS ENUM ('free', 'pro', 'enterprise');
```

**Values**:
- `free`: 100 renders/day, community support
- `pro`: 10,000 renders/day, email support
- `enterprise`: Custom limits, dedicated support

**Usage**: Determines rate limits, features, support level.

---

### 3.2 job_status

**Purpose**: Track render job lifecycle.

```sql
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');
```

**State Transitions**:
```
queued → processing → completed
              ↓
            failed (after 3 retries)
```

**Values**:
- `queued`: Job added to BullMQ, waiting for worker
- `processing`: Worker picked up job, rendering in progress
- `completed`: Rendering successful, HTML cached
- `failed`: Rendering failed after all retries

---

### 3.3 cache_location

**Purpose**: Track where cached content was served from.

```sql
CREATE TYPE cache_location AS ENUM ('hot', 'cold', 'none');
```

**Values**:
- `hot`: Served from Redis hot cache (<50ms)
- `cold`: Served from Supabase Storage, promoted to hot cache
- `none`: Not cached (triggered new render)

**Usage**: Analytics, cache performance monitoring.

---

## 4. Table Definitions

### 4.1 api_keys

**Purpose**: Store customer API keys for authentication and rate limiting.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash
  key_prefix VARCHAR(20) NOT NULL, -- For display: "sk_live_abc..."
  tier api_key_tier NOT NULL DEFAULT 'free',
  rate_limit_daily INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_customer_email ON api_keys(customer_email);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active) WHERE is_active = TRUE;
```

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| customer_email | VARCHAR(255) | No | - | Customer contact email |
| key_hash | VARCHAR(64) | No | - | SHA-256 hash of API key (never store plaintext) |
| key_prefix | VARCHAR(20) | No | - | Display prefix (e.g., "sk_live_abc123...") |
| tier | api_key_tier | No | 'free' | Pricing tier (determines rate limit) |
| rate_limit_daily | INTEGER | No | 100 | Renders allowed per day |
| is_active | BOOLEAN | No | TRUE | Key can be disabled without deletion |
| created_at | TIMESTAMPTZ | No | NOW() | When key was generated |
| last_used_at | TIMESTAMPTZ | Yes | NULL | Last API request with this key |

**Indexes**:
- `key_hash`: Fast lookup during authentication (every request)
- `customer_email`: Admin queries (list all keys for customer)
- `is_active`: Filter out disabled keys

**Row Level Security** (Supabase):
```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no public access)
CREATE POLICY "Service role only" ON api_keys
  FOR ALL
  USING (auth.role() = 'service_role');
```

---

### 4.2 render_jobs

**Purpose**: Track all render jobs (queued, processing, completed, failed).

```sql
CREATE TABLE render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  
  -- Timing
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  render_duration_ms INTEGER,
  
  -- Results
  html_size_bytes INTEGER,
  storage_key TEXT, -- Supabase Storage path
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  worker_id VARCHAR(100), -- Which Fly.io instance processed job
  puppeteer_version VARCHAR(20)
);

-- Indexes
CREATE INDEX idx_render_jobs_api_key_status ON render_jobs(api_key_id, status);
CREATE INDEX idx_render_jobs_normalized_url ON render_jobs(normalized_url);
CREATE INDEX idx_render_jobs_queued_at ON render_jobs(queued_at) WHERE status = 'queued';
CREATE INDEX idx_render_jobs_status_created ON render_jobs(status, queued_at);
```

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Job identifier (ULID format in application) |
| api_key_id | UUID | No | - | Which customer requested render |
| url | TEXT | No | - | Original URL (as submitted by customer) |
| normalized_url | TEXT | No | - | URL after normalization (for cache key) |
| status | job_status | No | 'queued' | Current job state |
| queued_at | TIMESTAMPTZ | No | NOW() | When job was created |
| started_at | TIMESTAMPTZ | Yes | NULL | When worker picked up job |
| completed_at | TIMESTAMPTZ | Yes | NULL | When job finished (success or fail) |
| render_duration_ms | INTEGER | Yes | NULL | Time from start to completion |
| html_size_bytes | INTEGER | Yes | NULL | Size of rendered HTML |
| storage_key | TEXT | Yes | NULL | Supabase Storage path (e.g., "rendered/abc123.html") |
| error_message | TEXT | Yes | NULL | Error details if failed |
| retry_count | INTEGER | No | 0 | How many times job was retried |
| worker_id | VARCHAR(100) | Yes | NULL | Fly.io instance hostname |
| puppeteer_version | VARCHAR(20) | Yes | NULL | For debugging (e.g., "21.6.0") |

**Indexes**:
- `(api_key_id, status)`: Dashboard queries (show my jobs by status)
- `normalized_url`: Find existing job for URL (before queuing duplicate)
- `queued_at` (where queued): Worker pulls oldest jobs first
- `(status, queued_at)`: Monitor queue depth by status

**Retention Policy** (cron job):
```sql
-- Delete completed jobs older than 30 days
DELETE FROM render_jobs 
WHERE status = 'completed' 
  AND completed_at < NOW() - INTERVAL '30 days';

-- Delete failed jobs older than 7 days
DELETE FROM render_jobs 
WHERE status = 'failed' 
  AND completed_at < NOW() - INTERVAL '7 days';
```

---

### 4.3 cache_accesses

**Purpose**: Log every cache access for analytics (hit/miss, location, latency).

```sql
CREATE TABLE cache_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  normalized_url TEXT NOT NULL,
  cache_location cache_location NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time_ms INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_cache_accesses_api_key_date ON cache_accesses(api_key_id, accessed_at);
CREATE INDEX idx_cache_accesses_normalized_url ON cache_accesses(normalized_url);
CREATE INDEX idx_cache_accesses_accessed_at ON cache_accesses(accessed_at);
```

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Log entry ID |
| api_key_id | UUID | No | - | Which customer accessed cache |
| normalized_url | TEXT | No | - | URL that was accessed |
| cache_location | cache_location | No | - | Where served from (hot/cold/none) |
| accessed_at | TIMESTAMPTZ | No | NOW() | When request was made |
| response_time_ms | INTEGER | No | - | Time to serve response |

**Indexes**:
- `(api_key_id, accessed_at)`: Customer analytics (usage over time)
- `normalized_url`: Page-level analytics (access count per URL)
- `accessed_at`: Global analytics (traffic patterns)

**Retention Policy**:
```sql
-- Delete logs older than 90 days
DELETE FROM cache_accesses 
WHERE accessed_at < NOW() - INTERVAL '90 days';
```

**Partitioning** (Phase 2, when >10M rows):
```sql
-- Partition by month
CREATE TABLE cache_accesses_2024_12 PARTITION OF cache_accesses
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');
```

---

### 4.4 usage_daily

**Purpose**: Aggregated daily metrics for billing and dashboards.

```sql
CREATE TABLE usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Counts
  cache_hits INTEGER NOT NULL DEFAULT 0,
  cache_misses INTEGER NOT NULL DEFAULT 0,
  renders_completed INTEGER NOT NULL DEFAULT 0,
  renders_failed INTEGER NOT NULL DEFAULT 0,
  
  -- Performance
  avg_cache_hit_time_ms INTEGER,
  avg_render_time_ms INTEGER,
  
  -- Storage
  storage_bytes_added BIGINT NOT NULL DEFAULT 0,
  total_storage_bytes BIGINT NOT NULL DEFAULT 0,
  
  UNIQUE (api_key_id, date)
);

-- Indexes
CREATE INDEX idx_usage_daily_api_key_date ON usage_daily(api_key_id, date);
CREATE INDEX idx_usage_daily_date ON usage_daily(date);
```

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Row identifier |
| api_key_id | UUID | No | - | Customer |
| date | DATE | No | - | Date (UTC) |
| cache_hits | INTEGER | No | 0 | Requests served from cache |
| cache_misses | INTEGER | No | 0 | Requests that triggered render |
| renders_completed | INTEGER | No | 0 | Successful renders |
| renders_failed | INTEGER | No | 0 | Failed renders |
| avg_cache_hit_time_ms | INTEGER | Yes | NULL | Average response time for cache hits |
| avg_render_time_ms | INTEGER | Yes | NULL | Average render duration |
| storage_bytes_added | BIGINT | No | 0 | New storage used today |
| total_storage_bytes | BIGINT | No | 0 | Cumulative storage |

**Aggregation** (daily cron job at 00:05 UTC):
```sql
INSERT INTO usage_daily (api_key_id, date, cache_hits, cache_misses, avg_cache_hit_time_ms)
SELECT 
  api_key_id,
  DATE(accessed_at) as date,
  COUNT(*) FILTER (WHERE cache_location IN ('hot', 'cold')) as cache_hits,
  COUNT(*) FILTER (WHERE cache_location = 'none') as cache_misses,
  AVG(response_time_ms) FILTER (WHERE cache_location IN ('hot', 'cold')) as avg_cache_hit_time_ms
FROM cache_accesses
WHERE accessed_at >= CURRENT_DATE - INTERVAL '1 day'
  AND accessed_at < CURRENT_DATE
GROUP BY api_key_id, DATE(accessed_at)
ON CONFLICT (api_key_id, date) 
DO UPDATE SET
  cache_hits = EXCLUDED.cache_hits,
  cache_misses = EXCLUDED.cache_misses,
  avg_cache_hit_time_ms = EXCLUDED.avg_cache_hit_time_ms;
```

---

### 4.5 rendered_pages

**Purpose**: Metadata about all rendered pages (not HTML content itself).

```sql
CREATE TABLE rendered_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_url TEXT NOT NULL UNIQUE,
  
  -- Storage
  storage_key TEXT NOT NULL, -- Supabase Storage path
  html_size_bytes INTEGER NOT NULL,
  
  -- Lifecycle
  first_rendered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 0,
  
  -- Cache status
  in_redis BOOLEAN NOT NULL DEFAULT TRUE
);

-- Indexes
CREATE UNIQUE INDEX idx_rendered_pages_normalized_url ON rendered_pages(normalized_url);
CREATE INDEX idx_rendered_pages_last_accessed ON rendered_pages(last_accessed_at);
CREATE INDEX idx_rendered_pages_access_count ON rendered_pages(access_count DESC);
CREATE INDEX idx_rendered_pages_in_redis ON rendered_pages(in_redis) WHERE in_redis = TRUE;
```

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Row identifier |
| normalized_url | TEXT | No | - | Unique URL (after normalization) |
| storage_key | TEXT | No | - | Supabase Storage path |
| html_size_bytes | INTEGER | No | - | Size of HTML file |
| first_rendered_at | TIMESTAMPTZ | No | NOW() | When first rendered |
| last_accessed_at | TIMESTAMPTZ | No | NOW() | Most recent access |
| access_count | INTEGER | No | 0 | Total times accessed |
| in_redis | BOOLEAN | No | TRUE | Currently in hot cache? |

**Indexes**:
- `normalized_url` (unique): Lookup metadata by URL
- `last_accessed_at`: LRU eviction decisions
- `access_count`: Identify most popular pages
- `in_redis` (filtered): Find hot-cached pages

**Update on Access**:
```sql
-- Increment access count and update last accessed time
UPDATE rendered_pages 
SET 
  access_count = access_count + 1,
  last_accessed_at = NOW()
WHERE normalized_url = $1;
```

---

## 5. Drizzle ORM Schema

### 5.1 Schema Definition

**File**: `src/db/schema.ts`

```typescript
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, date, bigint, index, pgEnum, unique } from 'drizzle-orm/pg-core';

// ==========================================
// ENUMS
// ==========================================

export const apiKeyTierEnum = pgEnum('api_key_tier', ['free', 'pro', 'enterprise']);
export const jobStatusEnum = pgEnum('job_status', ['queued', 'processing', 'completed', 'failed']);
export const cacheLocationEnum = pgEnum('cache_location', ['hot', 'cold', 'none']);

// ==========================================
// TABLES
// ==========================================

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerEmail: varchar('customer_email', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
  tier: apiKeyTierEnum('tier').notNull().default('free'),
  rateLimitDaily: integer('rate_limit_daily').notNull().default(100),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
}, (table) => ({
  keyHashIdx: index('idx_api_keys_key_hash').on(table.keyHash),
  customerEmailIdx: index('idx_api_keys_customer_email').on(table.customerEmail),
  isActiveIdx: index('idx_api_keys_is_active').on(table.isActive).where(table.isActive.eq(true)),
}));

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
}, (table) => ({
  apiKeyStatusIdx: index('idx_render_jobs_api_key_status').on(table.apiKeyId, table.status),
  normalizedUrlIdx: index('idx_render_jobs_normalized_url').on(table.normalizedUrl),
  queuedAtIdx: index('idx_render_jobs_queued_at').on(table.queuedAt).where(table.status.eq('queued')),
  statusCreatedIdx: index('idx_render_jobs_status_created').on(table.status, table.queuedAt),
}));

export const cacheAccesses = pgTable('cache_accesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  apiKeyId: uuid('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  normalizedUrl: text('normalized_url').notNull(),
  cacheLocation: cacheLocationEnum('cache_location').notNull(),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).notNull().defaultNow(),
  responseTimeMs: integer('response_time_ms').notNull(),
}, (table) => ({
  apiKeyDateIdx: index('idx_cache_accesses_api_key_date').on(table.apiKeyId, table.accessedAt),
  normalizedUrlIdx: index('idx_cache_accesses_normalized_url').on(table.normalizedUrl),
  accessedAtIdx: index('idx_cache_accesses_accessed_at').on(table.accessedAt),
}));

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
}, (table) => ({
  apiKeyDateIdx: index('idx_usage_daily_api_key_date').on(table.apiKeyId, table.date),
  dateIdx: index('idx_usage_daily_date').on(table.date),
  apiKeyDateUnique: unique('usage_daily_api_key_date_unique').on(table.apiKeyId, table.date),
}));

export const renderedPages = pgTable('rendered_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  normalizedUrl: text('normalized_url').notNull().unique(),
  storageKey: text('storage_key').notNull(),
  htmlSizeBytes: integer('html_size_bytes').notNull(),
  firstRenderedAt: timestamp('first_rendered_at', { withTimezone: true }).notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
  accessCount: integer('access_count').notNull().default(0),
  inRedis: boolean('in_redis').notNull().default(true),
}, (table) => ({
  normalizedUrlIdx: unique('idx_rendered_pages_normalized_url').on(table.normalizedUrl),
  lastAccessedIdx: index('idx_rendered_pages_last_accessed').on(table.lastAccessedAt),
  accessCountIdx: index('idx_rendered_pages_access_count').on(table.accessCount),
  inRedisIdx: index('idx_rendered_pages_in_redis').on(table.inRedis).where(table.inRedis.eq(true)),
}));

// ==========================================
// TYPES
// ==========================================

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
```

---

### 5.2 Database Connection

**File**: `src/db/client.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL!;

// Create postgres client
const client = postgres(connectionString, {
  ssl: 'require',
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance
export const db = drizzle(client, { schema });

// Type-safe query builder
export type Database = typeof db;
```

---

### 5.3 Example Queries

#### Insert API Key
```typescript
import { db } from './db/client';
import { apiKeys } from './db/schema';

const newKey = await db.insert(apiKeys).values({
  customerEmail: 'customer@example.com',
  keyHash: computeHash(apiKey),
  keyPrefix: apiKey.slice(0, 15) + '...',
  tier: 'pro',
  rateLimitDaily: 10000,
}).returning();
```

#### Find Jobs by Status
```typescript
import { eq, and } from 'drizzle-orm';
import { renderJobs } from './db/schema';

const queuedJobs = await db
  .select()
  .from(renderJobs)
  .where(eq(renderJobs.status, 'queued'))
  .orderBy(renderJobs.queuedAt)
  .limit(10);
```

#### Update Job Status
```typescript
await db
  .update(renderJobs)
  .set({
    status: 'processing',
    startedAt: new Date(),
  })
  .where(eq(renderJobs.id, jobId));
```

#### Aggregate Daily Usage
```typescript
import { sql } from 'drizzle-orm';

const usage = await db
  .select({
    date: usageDaily.date,
    totalRenders: sql<number>`${usageDaily.rendersCompleted} + ${usageDaily.rendersFailed}`,
    cacheHitRate: sql<number>`
      CASE 
        WHEN ${usageDaily.cacheHits} + ${usageDaily.cacheMisses} > 0 
        THEN CAST(${usageDaily.cacheHits} AS FLOAT) / (${usageDaily.cacheHits} + ${usageDaily.cacheMisses}) 
        ELSE 0 
      END
    `,
  })
  .from(usageDaily)
  .where(eq(usageDaily.apiKeyId, apiKeyId))
  .orderBy(desc(usageDaily.date))
  .limit(30);
```

---

## 6. Migration Strategy

### 6.1 Initial Migration

**File**: `migrations/0000_initial.sql`

```sql
-- Create ENUMs
CREATE TYPE api_key_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE job_status AS ENUM ('queued', 'processing', 'completed', 'failed');
CREATE TYPE cache_location AS ENUM ('hot', 'cold', 'none');

-- Create tables (as defined in Section 4)
-- (Full SQL from sections 4.1-4.5 goes here)

-- Enable Row Level Security on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_accesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendered_pages ENABLE ROW LEVEL SECURITY;

-- Service role only policies (no public access)
CREATE POLICY "Service role only" ON api_keys FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON render_jobs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON cache_accesses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON usage_daily FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role only" ON rendered_pages FOR ALL USING (auth.role() = 'service_role');
```

**Run Migration**:
```bash
npx drizzle-kit push:pg
```

---

### 6.2 Future Migrations

**Naming Convention**: `NNNN_description.sql` (e.g., `0001_add_webhook_support.sql`)

**Example** (add webhook URL to API keys):
```sql
-- Migration: 0001_add_webhook_url
ALTER TABLE api_keys 
ADD COLUMN webhook_url TEXT,
ADD COLUMN webhook_secret VARCHAR(64);

CREATE INDEX idx_api_keys_webhook_url ON api_keys(webhook_url) 
WHERE webhook_url IS NOT NULL;
```

**Rollback Strategy**: Keep previous migration files, manual rollback if needed (Drizzle doesn't support auto-rollback).

---

## 7. Data Retention Policies

### 7.1 Automatic Cleanup (Cron Jobs)

**Schedule**: Daily at 02:00 UTC (low-traffic time)

```sql
-- Delete old render_jobs (completed > 30 days, failed > 7 days)
DELETE FROM render_jobs 
WHERE (status = 'completed' AND completed_at < NOW() - INTERVAL '30 days')
   OR (status = 'failed' AND completed_at < NOW() - INTERVAL '7 days');

-- Delete old cache_accesses (> 90 days)
DELETE FROM cache_accesses 
WHERE accessed_at < NOW() - INTERVAL '90 days';

-- Delete old usage_daily (> 2 years)
DELETE FROM usage_daily 
WHERE date < CURRENT_DATE - INTERVAL '2 years';
```

**Implementation**: Supabase pg_cron extension or external cron job (GitHub Actions).

---

### 7.2 Customer Data Deletion

**Trigger**: Customer closes account or requests deletion

```sql
-- Delete all data for customer (cascades to related tables)
DELETE FROM api_keys WHERE customer_email = 'customer@example.com';

-- Rendered pages are NOT deleted (shared across customers)
-- Only delete if no other customer has accessed the URL
```

---

## 8. Performance Optimization

### 8.1 Query Performance Targets

| Query Type | Target | Measurement |
|------------|--------|-------------|
| Authenticate (find by key_hash) | <5ms | EXPLAIN ANALYZE |
| Check rate limit (Redis) | <2ms | Redis latency |
| Insert render job | <10ms | EXPLAIN ANALYZE |
| Find queued jobs (worker) | <20ms | EXPLAIN ANALYZE |
| Update job status | <10ms | EXPLAIN ANALYZE |
| Log cache access | <5ms | EXPLAIN ANALYZE |
| Aggregate daily usage | <100ms | EXPLAIN ANALYZE |

---

### 8.2 Index Monitoring

**Monitor Index Usage**:
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

**Find Unused Indexes** (candidates for removal):
```sql
SELECT 
  schemaname || '.' || tablename AS table,
  indexname AS index,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
  AND idx_scan = 0 
  AND indexrelname NOT LIKE '%_pkey';
```

---

### 8.3 Table Size Monitoring

```sql
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;
```

**Alert**: If any table >10GB (MVP), >100GB (post-MVP), consider partitioning.

---

## 9. Backup & Recovery

### 9.1 Automated Backups

**Provider**: Supabase (automatic)

**Schedule**:
- **Daily**: Full backup at 00:00 UTC
- **Retention**: 7 days (MVP), 30 days (post-MVP)
- **Storage**: Supabase backup storage (included in plan)

**Testing**: Restore backup to test instance monthly.

---

### 9.2 Manual Backup

```bash
# Export schema
pg_dump -h db.supabase.co -U postgres -s crawlready > schema.sql

# Export data
pg_dump -h db.supabase.co -U postgres -a crawlready > data.sql

# Export single table
pg_dump -h db.supabase.co -U postgres -t api_keys crawlready > api_keys.sql
```

---

### 9.3 Point-in-Time Recovery

**Supabase Feature**: Available on Pro plan ($25/mo)

**RPO (Recovery Point Objective)**: 1 hour (transaction log replay)

**RTO (Recovery Time Objective)**: 4 hours (restore + verification)

---

## 10. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-28 | 1.0 | System | Initial draft with proper ENUMs |

---

## 11. References

- Drizzle ORM Docs: https://orm.drizzle.team/
- PostgreSQL ENUM Types: https://www.postgresql.org/docs/current/datatype-enum.html
- Supabase Database: https://supabase.com/docs/guides/database
- Business Requirements: `documentation/specs/business-requirements.md`
- Functional Specification: `documentation/specs/functional-spec.md`

---

**Document Status**: DRAFT - Pending stakeholder review

