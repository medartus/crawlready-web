# Sites Database Schema - Technical Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Related:** Sites Management Spec, Onboarding Wizard Spec

---

## 1. Overview

### 1.1 Purpose

This document defines the database schema for the Sites entity and related tables. Sites are the primary organizational unit in CrawlReady—all renders, analytics, and settings are scoped to a site.

### 1.2 Design Principles

1. **Multi-tenant:** Sites belong to organizations (via Clerk)
2. **Soft delete:** Retain data for 30 days after deletion
3. **Audit trail:** Track all state changes
4. **Flexible settings:** JSONB for extensible configuration
5. **Performance:** Indexed for common query patterns

---

## 2. Entity Relationship Diagram

```
┌─────────────────────┐
│   organizations     │  (Clerk-managed)
│   (org_id)          │
└─────────┬───────────┘
          │
          │ 1:N
          ▼
┌─────────────────────┐       1:N      ┌─────────────────────┐
│       sites         │───────────────▶│   site_api_keys     │
│                     │                └─────────────────────┘
│  - domain           │
│  - status           │       1:N      ┌─────────────────────┐
│  - settings         │───────────────▶│  rendered_pages     │
│                     │                └─────────────────────┘
│                     │
│                     │       1:N      ┌─────────────────────┐
│                     │───────────────▶│   cache_accesses    │
└─────────────────────┘                └─────────────────────┘
```

---

## 3. Tables

### 3.1 sites

The primary table storing website/domain information.

#### SQL Definition

```sql
-- Create enum types
CREATE TYPE site_status AS ENUM ('pending', 'active', 'error', 'suspended');
CREATE TYPE verification_method AS ENUM ('dns_txt', 'meta_tag', 'api_response', 'auto');

-- Create sites table
CREATE TABLE sites (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Ownership (Clerk integration)
    org_id VARCHAR(255) NOT NULL,              -- Clerk organization ID
    user_id VARCHAR(255) NOT NULL,             -- Creator's Clerk user ID
    
    -- Domain information
    domain VARCHAR(255) NOT NULL,              -- Normalized domain (e.g., "mysite.com")
    display_name VARCHAR(255),                 -- User-friendly label
    
    -- Status tracking
    status site_status NOT NULL DEFAULT 'pending',
    status_reason TEXT,                        -- Explanation for error/suspended status
    status_changed_at TIMESTAMPTZ,             -- When status last changed
    
    -- Verification
    verification_token VARCHAR(64),            -- Token for DNS/meta verification
    verification_method verification_method,   -- How site was verified
    verified_at TIMESTAMPTZ,                   -- When verification succeeded
    
    -- Framework detection
    framework_detected VARCHAR(100),           -- 'nextjs', 'react', 'vue', 'angular', etc.
    framework_version VARCHAR(50),             -- '14.0.0', '18.2.0', etc.
    framework_confidence VARCHAR(20),          -- 'high', 'medium', 'low'
    
    -- Settings (JSONB for flexibility)
    settings JSONB NOT NULL DEFAULT '{
        "cacheTtl": 21600,
        "enabledCrawlers": ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        "excludedPaths": [],
        "notifications": {
            "emailOnError": true,
            "emailOnFirstCrawler": true,
            "emailWeeklyDigest": true
        },
        "rendering": {
            "waitForSelector": null,
            "timeout": 30000,
            "blockResources": ["image", "font"]
        }
    }'::jsonb,
    
    -- Usage tracking
    renders_count INTEGER NOT NULL DEFAULT 0,           -- Lifetime render count
    renders_this_month INTEGER NOT NULL DEFAULT 0,      -- Current month renders
    renders_month_reset_at TIMESTAMPTZ,                 -- When month counter resets
    
    -- Activity tracking
    last_render_at TIMESTAMPTZ,                         -- Last successful render
    last_crawler_visit_at TIMESTAMPTZ,                  -- Last actual crawler visit
    last_error_at TIMESTAMPTZ,                          -- Last error occurred
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,                             -- Soft delete timestamp
    
    -- Constraints
    CONSTRAINT sites_domain_format CHECK (domain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$'),
    CONSTRAINT sites_unique_domain UNIQUE (org_id, domain)
);

-- Indexes for common queries
CREATE INDEX idx_sites_org_id ON sites(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_domain ON sites(domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_status ON sites(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_created_at ON sites(created_at DESC);
CREATE INDEX idx_sites_last_crawler_visit ON sites(last_crawler_visit_at DESC) WHERE deleted_at IS NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

#### Column Details

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| org_id | VARCHAR(255) | No | Clerk organization ID |
| user_id | VARCHAR(255) | No | Creator's Clerk user ID |
| domain | VARCHAR(255) | No | Normalized domain |
| display_name | VARCHAR(255) | Yes | User-friendly name |
| status | site_status | No | Current status |
| status_reason | TEXT | Yes | Explanation for status |
| status_changed_at | TIMESTAMPTZ | Yes | When status changed |
| verification_token | VARCHAR(64) | Yes | Verification token |
| verification_method | verification_method | Yes | How verified |
| verified_at | TIMESTAMPTZ | Yes | Verification timestamp |
| framework_detected | VARCHAR(100) | Yes | Detected framework |
| framework_version | VARCHAR(50) | Yes | Framework version |
| framework_confidence | VARCHAR(20) | Yes | Detection confidence |
| settings | JSONB | No | Configuration object |
| renders_count | INTEGER | No | Lifetime renders |
| renders_this_month | INTEGER | No | Monthly renders |
| renders_month_reset_at | TIMESTAMPTZ | Yes | Month reset time |
| last_render_at | TIMESTAMPTZ | Yes | Last render time |
| last_crawler_visit_at | TIMESTAMPTZ | Yes | Last crawler visit |
| last_error_at | TIMESTAMPTZ | Yes | Last error time |
| created_at | TIMESTAMPTZ | No | Creation timestamp |
| updated_at | TIMESTAMPTZ | No | Last update timestamp |
| deleted_at | TIMESTAMPTZ | Yes | Soft delete timestamp |

---

### 3.2 site_api_keys

API keys for authentication against the render service.

#### SQL Definition

```sql
CREATE TABLE site_api_keys (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Key storage (never store plaintext)
    key_hash VARCHAR(64) NOT NULL,             -- SHA-256 hash of the key
    key_prefix VARCHAR(20) NOT NULL,           -- Display prefix: "cr_live_abc..."
    key_suffix VARCHAR(8),                     -- Last 4 chars for identification
    
    -- Metadata
    name VARCHAR(100),                         -- Optional key name
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,                  -- Last successful use
    use_count INTEGER NOT NULL DEFAULT 0,      -- Total uses
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                    -- Optional expiration
    
    -- Constraints
    CONSTRAINT site_api_keys_one_active_per_site UNIQUE (site_id) WHERE is_active = TRUE
);

-- Indexes
CREATE INDEX idx_site_api_keys_hash ON site_api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_site_api_keys_site_id ON site_api_keys(site_id);
CREATE INDEX idx_site_api_keys_active ON site_api_keys(site_id, is_active) WHERE is_active = TRUE;
```

#### Column Details

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| site_id | UUID | No | Reference to sites table |
| key_hash | VARCHAR(64) | No | SHA-256 hash |
| key_prefix | VARCHAR(20) | No | Display prefix |
| key_suffix | VARCHAR(8) | Yes | Last 4 chars |
| name | VARCHAR(100) | Yes | Key name |
| last_used_at | TIMESTAMPTZ | Yes | Last use time |
| use_count | INTEGER | No | Usage count |
| is_active | BOOLEAN | No | Active status |
| revoked_at | TIMESTAMPTZ | Yes | Revocation time |
| revoked_reason | VARCHAR(255) | Yes | Revocation reason |
| created_at | TIMESTAMPTZ | No | Creation time |
| expires_at | TIMESTAMPTZ | Yes | Expiration time |

---

### 3.3 site_status_history

Audit trail for site status changes.

#### SQL Definition

```sql
CREATE TABLE site_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Status change
    from_status site_status,
    to_status site_status NOT NULL,
    reason TEXT,
    
    -- Who made the change
    changed_by VARCHAR(255),                   -- Clerk user ID or 'system'
    change_type VARCHAR(50) NOT NULL,          -- 'manual', 'verification', 'error_detected', etc.
    
    -- Metadata
    metadata JSONB,                            -- Additional context
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_status_history_site_id ON site_status_history(site_id);
CREATE INDEX idx_site_status_history_created ON site_status_history(created_at DESC);
```

---

### 3.4 site_verifications

Track verification attempts.

#### SQL Definition

```sql
CREATE TABLE site_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Verification details
    method verification_method NOT NULL,
    success BOOLEAN NOT NULL,
    
    -- What we checked
    expected_value TEXT NOT NULL,
    found_value TEXT,
    
    -- Error info
    error_code VARCHAR(50),
    error_message TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_verifications_site_id ON site_verifications(site_id);
CREATE INDEX idx_site_verifications_created ON site_verifications(created_at DESC);
```

---

## 4. Settings Schema

### 4.1 Settings JSONB Structure

```typescript
interface SiteSettings {
  // Cache configuration
  cacheTtl: number;                            // Seconds (default: 21600 = 6 hours)
  
  // Crawler configuration
  enabledCrawlers: string[];                   // List of enabled crawler names
  
  // Path exclusions
  excludedPaths: string[];                     // Glob patterns to exclude
  
  // Notification preferences
  notifications: {
    emailOnError: boolean;
    emailOnFirstCrawler: boolean;
    emailWeeklyDigest: boolean;
  };
  
  // Rendering options
  rendering: {
    waitForSelector: string | null;            // CSS selector to wait for
    timeout: number;                           // Render timeout in ms
    blockResources: string[];                  // Resource types to block
    customHeaders: Record<string, string>;     // Additional headers to send
  };
  
  // Advanced options
  advanced: {
    followRedirects: boolean;
    maxRedirects: number;
    retryOnError: boolean;
    cacheErrorPages: boolean;
  };
}
```

### 4.2 Default Settings

```sql
DEFAULT '{
    "cacheTtl": 21600,
    "enabledCrawlers": ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
    "excludedPaths": [],
    "notifications": {
        "emailOnError": true,
        "emailOnFirstCrawler": true,
        "emailWeeklyDigest": true
    },
    "rendering": {
        "waitForSelector": null,
        "timeout": 30000,
        "blockResources": ["image", "font"]
    },
    "advanced": {
        "followRedirects": true,
        "maxRedirects": 5,
        "retryOnError": true,
        "cacheErrorPages": false
    }
}'::jsonb
```

### 4.3 Settings Validation

```typescript
import { z } from 'zod';

const VALID_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'Meta-ExternalAgent',
];

const VALID_RESOURCES = ['image', 'font', 'stylesheet', 'script', 'media'];

export const siteSettingsSchema = z.object({
  cacheTtl: z.number().min(3600).max(604800),  // 1 hour to 7 days
  enabledCrawlers: z.array(z.enum(VALID_CRAWLERS as [string, ...string[]])),
  excludedPaths: z.array(z.string().max(200)).max(50),
  notifications: z.object({
    emailOnError: z.boolean(),
    emailOnFirstCrawler: z.boolean(),
    emailWeeklyDigest: z.boolean(),
  }),
  rendering: z.object({
    waitForSelector: z.string().max(200).nullable(),
    timeout: z.number().min(5000).max(60000),
    blockResources: z.array(z.enum(VALID_RESOURCES as [string, ...string[]])),
    customHeaders: z.record(z.string()).optional(),
  }).optional(),
  advanced: z.object({
    followRedirects: z.boolean(),
    maxRedirects: z.number().min(0).max(10),
    retryOnError: z.boolean(),
    cacheErrorPages: z.boolean(),
  }).optional(),
}).partial();
```

---

## 5. Drizzle ORM Schema

```typescript
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const siteStatusEnum = pgEnum('site_status', [
  'pending',
  'active',
  'error',
  'suspended',
]);

export const verificationMethodEnum = pgEnum('verification_method', [
  'dns_txt',
  'meta_tag',
  'api_response',
  'auto',
]);

// Sites table
export const sites = pgTable(
  'sites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: varchar('org_id', { length: 255 }).notNull(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    
    domain: varchar('domain', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }),
    
    status: siteStatusEnum('status').notNull().default('pending'),
    statusReason: text('status_reason'),
    statusChangedAt: timestamp('status_changed_at', { withTimezone: true }),
    
    verificationToken: varchar('verification_token', { length: 64 }),
    verificationMethod: verificationMethodEnum('verification_method'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    
    frameworkDetected: varchar('framework_detected', { length: 100 }),
    frameworkVersion: varchar('framework_version', { length: 50 }),
    frameworkConfidence: varchar('framework_confidence', { length: 20 }),
    
    settings: jsonb('settings').notNull().default({
      cacheTtl: 21600,
      enabledCrawlers: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
      excludedPaths: [],
      notifications: {
        emailOnError: true,
        emailOnFirstCrawler: true,
        emailWeeklyDigest: true,
      },
      rendering: {
        waitForSelector: null,
        timeout: 30000,
        blockResources: ['image', 'font'],
      },
    }),
    
    rendersCount: integer('renders_count').notNull().default(0),
    rendersThisMonth: integer('renders_this_month').notNull().default(0),
    rendersMonthResetAt: timestamp('renders_month_reset_at', { withTimezone: true }),
    
    lastRenderAt: timestamp('last_render_at', { withTimezone: true }),
    lastCrawlerVisitAt: timestamp('last_crawler_visit_at', { withTimezone: true }),
    lastErrorAt: timestamp('last_error_at', { withTimezone: true }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    orgDomainUnique: unique('sites_org_domain_unique').on(table.orgId, table.domain),
    orgIdIdx: index('idx_sites_org_id').on(table.orgId),
    domainIdx: index('idx_sites_domain').on(table.domain),
    statusIdx: index('idx_sites_status').on(table.status),
    createdAtIdx: index('idx_sites_created_at').on(table.createdAt),
  })
);

// Site API Keys table
export const siteApiKeys = pgTable(
  'site_api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    
    keyHash: varchar('key_hash', { length: 64 }).notNull(),
    keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
    keySuffix: varchar('key_suffix', { length: 8 }),
    
    name: varchar('name', { length: 100 }),
    
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    useCount: integer('use_count').notNull().default(0),
    
    isActive: boolean('is_active').notNull().default(true),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: varchar('revoked_reason', { length: 255 }),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    hashIdx: index('idx_site_api_keys_hash').on(table.keyHash),
    siteIdIdx: index('idx_site_api_keys_site_id').on(table.siteId),
  })
);

// Site Status History table
export const siteStatusHistory = pgTable(
  'site_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    siteId: uuid('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    
    fromStatus: siteStatusEnum('from_status'),
    toStatus: siteStatusEnum('to_status').notNull(),
    reason: text('reason'),
    
    changedBy: varchar('changed_by', { length: 255 }),
    changeType: varchar('change_type', { length: 50 }).notNull(),
    
    metadata: jsonb('metadata'),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    siteIdIdx: index('idx_site_status_history_site_id').on(table.siteId),
    createdAtIdx: index('idx_site_status_history_created').on(table.createdAt),
  })
);

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  apiKeys: many(siteApiKeys),
  statusHistory: many(siteStatusHistory),
}));

export const siteApiKeysRelations = relations(siteApiKeys, ({ one }) => ({
  site: one(sites, {
    fields: [siteApiKeys.siteId],
    references: [sites.id],
  }),
}));

export const siteStatusHistoryRelations = relations(siteStatusHistory, ({ one }) => ({
  site: one(sites, {
    fields: [siteStatusHistory.siteId],
    references: [sites.id],
  }),
}));

// Types
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type SiteApiKey = typeof siteApiKeys.$inferSelect;
export type NewSiteApiKey = typeof siteApiKeys.$inferInsert;
export type SiteStatusHistory = typeof siteStatusHistory.$inferSelect;
```

---

## 6. Migration

### 6.1 Migration File

```sql
-- Migration: Create sites tables
-- Version: 0002_add_sites

-- Create enums
DO $$ BEGIN
    CREATE TYPE site_status AS ENUM ('pending', 'active', 'error', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('dns_txt', 'meta_tag', 'api_response', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    status site_status NOT NULL DEFAULT 'pending',
    status_reason TEXT,
    status_changed_at TIMESTAMPTZ,
    verification_token VARCHAR(64),
    verification_method verification_method,
    verified_at TIMESTAMPTZ,
    framework_detected VARCHAR(100),
    framework_version VARCHAR(50),
    framework_confidence VARCHAR(20),
    settings JSONB NOT NULL DEFAULT '{"cacheTtl":21600,"enabledCrawlers":["GPTBot","ClaudeBot","PerplexityBot","Google-Extended"],"excludedPaths":[],"notifications":{"emailOnError":true,"emailOnFirstCrawler":true,"emailWeeklyDigest":true}}'::jsonb,
    renders_count INTEGER NOT NULL DEFAULT 0,
    renders_this_month INTEGER NOT NULL DEFAULT 0,
    renders_month_reset_at TIMESTAMPTZ,
    last_render_at TIMESTAMPTZ,
    last_crawler_visit_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT sites_org_domain_unique UNIQUE (org_id, domain)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sites_org_id ON sites(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites(created_at DESC);

-- Create site_api_keys table
CREATE TABLE IF NOT EXISTS site_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_suffix VARCHAR(8),
    name VARCHAR(100),
    last_used_at TIMESTAMPTZ,
    use_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_site_api_keys_hash ON site_api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_site_api_keys_site_id ON site_api_keys(site_id);

-- Create site_status_history table
CREATE TABLE IF NOT EXISTS site_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    from_status site_status,
    to_status site_status NOT NULL,
    reason TEXT,
    changed_by VARCHAR(255),
    change_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_status_history_site_id ON site_status_history(site_id);
CREATE INDEX IF NOT EXISTS idx_site_status_history_created ON site_status_history(created_at DESC);
```

---

## 7. Common Queries

### 7.1 Get Sites for Organization

```typescript
const sites = await db.query.sites.findMany({
  where: and(
    eq(sites.orgId, orgId),
    isNull(sites.deletedAt)
  ),
  orderBy: [desc(sites.createdAt)],
  with: {
    apiKeys: {
      where: eq(siteApiKeys.isActive, true),
    },
  },
});
```

### 7.2 Get Site by Domain

```typescript
const site = await db.query.sites.findFirst({
  where: and(
    eq(sites.domain, domain),
    isNull(sites.deletedAt)
  ),
});
```

### 7.3 Verify API Key

```typescript
const apiKey = await db.query.siteApiKeys.findFirst({
  where: and(
    eq(siteApiKeys.keyHash, hash(providedKey)),
    eq(siteApiKeys.isActive, true)
  ),
  with: {
    site: true,
  },
});
```

### 7.4 Update Site Status

```typescript
await db.transaction(async (tx) => {
  // Get current status
  const site = await tx.query.sites.findFirst({
    where: eq(sites.id, siteId),
  });
  
  // Update site
  await tx.update(sites)
    .set({ 
      status: newStatus,
      statusReason: reason,
      statusChangedAt: new Date(),
    })
    .where(eq(sites.id, siteId));
  
  // Record history
  await tx.insert(siteStatusHistory).values({
    siteId,
    fromStatus: site.status,
    toStatus: newStatus,
    reason,
    changedBy: userId || 'system',
    changeType: type,
  });
});
```

---

## 8. Data Retention

### 8.1 Soft Delete Policy

- Sites are soft-deleted (deleted_at set)
- Data retained for 30 days
- Permanent deletion via scheduled job

### 8.2 Cleanup Job

```typescript
// Run daily
async function cleanupDeletedSites() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await db.delete(sites).where(
    and(
      isNotNull(sites.deletedAt),
      lt(sites.deletedAt, thirtyDaysAgo)
    )
  );
}
```

---

*This schema supports the Sites Management feature with full audit history and flexible configuration.*
