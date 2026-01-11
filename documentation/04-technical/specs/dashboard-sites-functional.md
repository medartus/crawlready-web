# Dashboard: Sites Management - Functional Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Dependencies:** Onboarding Wizard, Database Schema

---

## 1. Overview

### 1.1 Purpose

The Sites Management page allows users to add, configure, and manage their website domains. Sites are the primary organizational unit in CrawlReady—all analytics, crawler activity, and settings are scoped to a site.

### 1.2 Key Concepts

| Concept | Definition |
|---------|------------|
| **Site** | A domain registered with CrawlReady (e.g., `mysite.com`) |
| **Domain** | The hostname without protocol (e.g., `mysite.com`, `app.mysite.com`) |
| **Status** | Current state: pending, active, error, suspended |
| **Verification** | Process to confirm domain ownership |

### 1.3 Site Lifecycle

```
Created → Pending → Verified → Active
                       ↓
                    Error (if integration fails)
                       ↓
                  Suspended (if billing fails)
```

---

## 2. User Stories

### US-1: Add New Site

**As a** logged-in user
**I want to** add a new website to CrawlReady
**So that** I can make it visible to AI crawlers

**Acceptance Criteria:**
- [ ] "Add Site" button visible on Sites page and Overview
- [ ] Click opens Add Site wizard (simplified if not first site)
- [ ] Enter domain name (auto-strip protocol, validate format)
- [ ] Framework auto-detection displayed
- [ ] Site created with `pending` status
- [ ] Redirect to integration setup

### US-2: View All Sites

**As a** logged-in user
**I want to** see all my registered sites
**So that** I can manage them in one place

**Acceptance Criteria:**
- [ ] Table/card view of all sites
- [ ] Each site shows:
  - Domain name
  - Status indicator (colored badge)
  - Last activity timestamp
  - Render count (this month)
  - Quick actions (Settings, Delete)
- [ ] Sort by: Name, Status, Last Activity, Renders
- [ ] Filter by: Status
- [ ] Pagination for > 10 sites

### US-3: Configure Site Settings

**As a** logged-in user
**I want to** customize settings for each site
**So that** I can optimize CrawlReady for my needs

**Acceptance Criteria:**
- [ ] Settings page per site
- [ ] Configurable options:
  - Display name (custom label)
  - Cache TTL (1h, 6h, 12h, 24h, 7d)
  - Enabled crawlers (select which bots to serve)
  - Notification preferences
  - Custom paths to exclude
- [ ] Save button with validation
- [ ] Success/error feedback

### US-4: View Site API Key

**As a** logged-in user
**I want to** see the API key for a specific site
**So that** I can update my integration

**Acceptance Criteria:**
- [ ] API key displayed (masked by default)
- [ ] "Show" button to reveal full key
- [ ] "Copy" button with feedback
- [ ] "Regenerate" button with confirmation
- [ ] Warning about key regeneration invalidating old key

### US-5: Delete Site

**As a** logged-in user
**I want to** remove a site I no longer need
**So that** I can clean up my account

**Acceptance Criteria:**
- [ ] Delete button in site settings
- [ ] Confirmation dialog with warnings:
  - "This will delete all cached pages"
  - "This will revoke the API key"
  - "This action cannot be undone"
- [ ] Type domain name to confirm
- [ ] Soft delete (data retained 30 days)
- [ ] Success feedback and redirect to Sites list

### US-6: Verify Domain Ownership

**As a** logged-in user
**I want to** verify I own a domain
**So that** CrawlReady knows it's legitimate

**Acceptance Criteria:**
- [ ] Three verification methods:
  - DNS TXT record
  - Meta tag
  - API response header
- [ ] Instructions for each method
- [ ] "Verify Now" button
- [ ] Automatic verification on successful test render
- [ ] Manual retry option

---

## 3. UI Specifications

### 3.1 Sites List View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sites                                                   [+ Add Site]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Manage your websites connected to CrawlReady                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Domain              │ Status    │ Last Activity │ Renders │ Actions ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │ mysite.com          │ 🟢 Active │ 2 min ago     │ 12,456  │ [⚙] [🗑]││
│  │ blog.mysite.com     │ 🟢 Active │ 1 hour ago    │ 3,421   │ [⚙] [🗑]││
│  │ newproject.dev      │ 🟡 Pending│ Never         │ 0       │ [⚙] [🗑]││
│  │ oldsite.com         │ 🔴 Error  │ 3 days ago    │ 892     │ [⚙] [🗑]││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Showing 4 sites                                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Site Card View (Mobile)

```
┌─────────────────────────────────┐
│ mysite.com              🟢 Active│
│                                  │
│ Last activity: 2 min ago         │
│ Renders this month: 12,456       │
│                                  │
│ [Settings]          [Delete]     │
└─────────────────────────────────┘
```

### 3.3 Add Site Modal (Quick Add)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Add Site                                                        [✕]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Enter your website domain:                                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ https:// │ example.com                                              ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Detected: Next.js ✓                                                     │
│                                                                          │
│  [Cancel]                                    [Add Site & Continue Setup] │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Site Settings Page

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Sites                                                         │
│                                                                          │
│  mysite.com Settings                                    🟢 Active        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  GENERAL                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Display Name                                                         ││
│  │ ┌───────────────────────────────────────────────────────────────┐   ││
│  │ │ My Main Website                                               │   ││
│  │ └───────────────────────────────────────────────────────────────┘   ││
│  │ Optional label shown in dashboard                                    ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  API KEY                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ cr_live_••••••••••••••••••••••••    [Show] [Copy] [Regenerate]      ││
│  │                                                                      ││
│  │ Created: Jan 5, 2026 • Last used: 2 minutes ago                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  CACHE SETTINGS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Cache TTL                                                            ││
│  │ ○ 1 hour   ● 6 hours   ○ 12 hours   ○ 24 hours   ○ 7 days           ││
│  │                                                                      ││
│  │ How long to cache rendered pages before re-rendering                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  AI CRAWLERS                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ☑ GPTBot (ChatGPT, OpenAI)                                           ││
│  │ ☑ ClaudeBot (Claude, Anthropic)                                      ││
│  │ ☑ PerplexityBot (Perplexity AI)                                      ││
│  │ ☑ Google-Extended (Gemini, Google AI)                                ││
│  │ ☐ CCBot (Common Crawl)                                               ││
│  │ ☐ Bytespider (TikTok AI)                                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  EXCLUDED PATHS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ /admin/*                                                             ││
│  │ /api/*                                                               ││
│  │ /private/*                                                           ││
│  │                                                                      ││
│  │ [+ Add Path]                                                         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  DANGER ZONE                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Delete this site                                                     ││
│  │ This will remove all cached pages and revoke the API key.            ││
│  │ This action cannot be undone.                                        ││
│  │                                                            [Delete]  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│                                                    [Cancel] [Save Changes]│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Delete Confirmation Modal

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Delete Site                                                     [✕]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⚠️ Are you sure you want to delete mysite.com?                          │
│                                                                          │
│  This will:                                                              │
│  • Delete all 12,456 cached pages                                        │
│  • Revoke the API key (cr_live_abc...)                                   │
│  • Remove all analytics data                                             │
│                                                                          │
│  This action cannot be undone.                                           │
│                                                                          │
│  Type "mysite.com" to confirm:                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  [Cancel]                                           [Delete Permanently] │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoint Contracts

### 4.1 GET /api/user/sites

**Description:** List all sites for the user's organization.

**Authentication:** Clerk session required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | all | Filter by status |
| sort | string | No | createdAt | Sort field |
| order | string | No | desc | Sort order |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Items per page |

**Response (200):**

```typescript
interface SitesListResponse {
  sites: Array<{
    id: string;
    domain: string;
    displayName: string | null;
    status: 'pending' | 'active' | 'error' | 'suspended';
    frameworkDetected: string | null;
    createdAt: string;
    verifiedAt: string | null;
    lastActivityAt: string | null;
    rendersThisMonth: number;
    settings: {
      cacheTtl: number;
      enabledCrawlers: string[];
    };
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

### 4.2 POST /api/user/sites

**Description:** Create a new site.

**Authentication:** Clerk session required

**Request Body:**

```typescript
{
  domain: string;                  // e.g., "mysite.com"
  displayName?: string;            // Optional custom label
}
```

**Response (201 - Created):**

```typescript
{
  site: {
    id: string;
    domain: string;
    displayName: string | null;
    status: 'pending';
    frameworkDetected: string | null;
    apiKey: string;                // Full key, shown only once
    apiKeyPrefix: string;
    createdAt: string;
  };
  nextStep: {
    label: string;
    href: string;
  };
}
```

**Response (400 - Validation Error):**

```typescript
{
  error: "VALIDATION_ERROR";
  message: "Invalid domain format";
  details: {
    field: "domain";
    issue: "Must be a valid domain name";
  };
}
```

**Response (409 - Conflict):**

```typescript
{
  error: "DOMAIN_EXISTS";
  message: "This domain is already registered";
  existingSiteId: string;
}
```

### 4.3 GET /api/user/sites/:siteId

**Description:** Get details for a specific site.

**Response (200):**

```typescript
{
  site: {
    id: string;
    domain: string;
    displayName: string | null;
    status: 'pending' | 'active' | 'error' | 'suspended';
    statusReason: string | null;   // Reason for error/suspended
    frameworkDetected: string | null;
    verificationMethod: 'dns_txt' | 'meta_tag' | 'api_response' | null;
    createdAt: string;
    verifiedAt: string | null;
    lastActivityAt: string | null;
    apiKeyPrefix: string;
    apiKeyCreatedAt: string;
    apiKeyLastUsedAt: string | null;
    settings: {
      cacheTtl: number;            // seconds
      enabledCrawlers: string[];
      excludedPaths: string[];
      notifications: {
        emailOnError: boolean;
        emailWeeklyDigest: boolean;
      };
    };
    stats: {
      rendersThisMonth: number;
      cacheHitRate: number;
      avgResponseTime: number;
      cachedPagesCount: number;
    };
  };
}
```

### 4.4 PATCH /api/user/sites/:siteId

**Description:** Update site settings.

**Request Body:**

```typescript
{
  displayName?: string;
  settings?: {
    cacheTtl?: number;
    enabledCrawlers?: string[];
    excludedPaths?: string[];
    notifications?: {
      emailOnError?: boolean;
      emailWeeklyDigest?: boolean;
    };
  };
}
```

**Response (200):**

```typescript
{
  site: { /* updated site object */ };
  message: "Site updated successfully";
}
```

### 4.5 DELETE /api/user/sites/:siteId

**Description:** Delete a site (soft delete).

**Request Body:**

```typescript
{
  confirmDomain: string;           // Must match site domain
}
```

**Response (200):**

```typescript
{
  message: "Site deleted successfully";
  deletedAt: string;
  retentionDays: 30;
}
```

**Response (400):**

```typescript
{
  error: "CONFIRMATION_MISMATCH";
  message: "Domain confirmation does not match";
}
```

### 4.6 POST /api/user/sites/:siteId/regenerate-key

**Description:** Regenerate the API key for a site.

**Request Body:**

```typescript
{
  confirm: boolean;                // Must be true
}
```

**Response (200):**

```typescript
{
  apiKey: string;                  // New full key
  apiKeyPrefix: string;
  previousKeyInvalidated: true;
  message: "New API key generated. Update your integration immediately.";
}
```

### 4.7 POST /api/user/sites/:siteId/verify

**Description:** Trigger domain verification check.

**Request Body:**

```typescript
{
  method: 'dns_txt' | 'meta_tag' | 'api_response';
}
```

**Response (200 - Verified):**

```typescript
{
  verified: true;
  method: string;
  verifiedAt: string;
  siteStatus: 'active';
}
```

**Response (200 - Not Verified):**

```typescript
{
  verified: false;
  method: string;
  error: {
    code: 'DNS_NOT_FOUND' | 'META_NOT_FOUND' | 'HEADER_NOT_FOUND';
    message: string;
    expected: string;
    found: string | null;
  };
}
```

---

## 5. Database Schema

### 5.1 Sites Table

```sql
CREATE TYPE site_status AS ENUM ('pending', 'active', 'error', 'suspended');
CREATE TYPE verification_method AS ENUM ('dns_txt', 'meta_tag', 'api_response');

CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id VARCHAR(255) NOT NULL,              -- Clerk organization ID
  user_id VARCHAR(255) NOT NULL,             -- Creator's Clerk user ID
  
  -- Domain
  domain VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  
  -- Status
  status site_status NOT NULL DEFAULT 'pending',
  status_reason TEXT,                        -- Explanation for error/suspended
  
  -- Verification
  verified_at TIMESTAMPTZ,
  verification_method verification_method,
  verification_token VARCHAR(64),            -- For DNS/meta verification
  
  -- Detection
  framework_detected VARCHAR(100),           -- 'nextjs', 'react', 'vue', etc.
  
  -- Settings (JSONB for flexibility)
  settings JSONB NOT NULL DEFAULT '{
    "cacheTtl": 21600,
    "enabledCrawlers": ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
    "excludedPaths": [],
    "notifications": {
      "emailOnError": true,
      "emailWeeklyDigest": true
    }
  }'::jsonb,
  
  -- Activity tracking
  last_activity_at TIMESTAMPTZ,
  renders_this_month INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,                    -- Soft delete
  
  -- Constraints
  UNIQUE (org_id, domain)
);

-- Indexes
CREATE INDEX idx_sites_org_id ON sites(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_domain ON sites(domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_status ON sites(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_created_at ON sites(created_at);
```

### 5.2 Site API Keys Table

```sql
CREATE TABLE site_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Key storage
  key_hash VARCHAR(64) NOT NULL,             -- SHA-256 hash
  key_prefix VARCHAR(20) NOT NULL,           -- For display: "cr_live_abc..."
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- One active key per site
  UNIQUE (site_id) WHERE is_active = TRUE
);

CREATE INDEX idx_site_api_keys_hash ON site_api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX idx_site_api_keys_site ON site_api_keys(site_id);
```

### 5.3 Drizzle Schema

```typescript
import { pgTable, pgEnum, uuid, varchar, text, boolean, timestamp, integer, jsonb, unique, index } from 'drizzle-orm/pg-core';

export const siteStatusEnum = pgEnum('site_status', ['pending', 'active', 'error', 'suspended']);
export const verificationMethodEnum = pgEnum('verification_method', ['dns_txt', 'meta_tag', 'api_response']);

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  
  domain: varchar('domain', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  
  status: siteStatusEnum('status').notNull().default('pending'),
  statusReason: text('status_reason'),
  
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verificationMethod: verificationMethodEnum('verification_method'),
  verificationToken: varchar('verification_token', { length: 64 }),
  
  frameworkDetected: varchar('framework_detected', { length: 100 }),
  
  settings: jsonb('settings').notNull().default({
    cacheTtl: 21600,
    enabledCrawlers: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
    excludedPaths: [],
    notifications: { emailOnError: true, emailWeeklyDigest: true },
  }),
  
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  rendersThisMonth: integer('renders_this_month').notNull().default(0),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  orgDomainUnique: unique('sites_org_domain_unique').on(table.orgId, table.domain),
  orgIdIdx: index('idx_sites_org_id').on(table.orgId),
  domainIdx: index('idx_sites_domain').on(table.domain),
  statusIdx: index('idx_sites_status').on(table.status),
}));

export const siteApiKeys = pgTable('site_api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  
  keyHash: varchar('key_hash', { length: 64 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => ({
  keyHashIdx: index('idx_site_api_keys_hash').on(table.keyHash),
  siteIdIdx: index('idx_site_api_keys_site').on(table.siteId),
}));

// Types
export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type SiteApiKey = typeof siteApiKeys.$inferSelect;
export type NewSiteApiKey = typeof siteApiKeys.$inferInsert;
```

---

## 6. Verification Methods

### 6.1 DNS TXT Record

**Instructions displayed to user:**

```
Add a TXT record to your domain's DNS:

Host/Name: @  (or leave blank)
Type: TXT
Value: crawlready-verify=cr_verify_abc123xyz789

This may take up to 48 hours to propagate.
```

**Verification Logic:**

```typescript
async function verifyDnsTxt(domain: string, expectedToken: string): Promise<boolean> {
  const records = await dns.resolveTxt(domain);
  const flatRecords = records.flat();
  return flatRecords.some(record => 
    record === `crawlready-verify=${expectedToken}`
  );
}
```

### 6.2 Meta Tag

**Instructions displayed to user:**

```
Add this meta tag to your homepage's <head>:

<meta name="crawlready-verify" content="cr_verify_abc123xyz789">
```

**Verification Logic:**

```typescript
async function verifyMetaTag(domain: string, expectedToken: string): Promise<boolean> {
  const response = await fetch(`https://${domain}/`);
  const html = await response.text();
  const metaMatch = html.match(/<meta\s+name="crawlready-verify"\s+content="([^"]+)"/i);
  return metaMatch?.[1] === expectedToken;
}
```

### 6.3 API Response Header

**Instructions displayed to user:**

```
Add this header to your CrawlReady middleware responses:

X-CrawlReady-Verify: cr_verify_abc123xyz789

This will be verified automatically when we detect your integration.
```

**Verification Logic:**

```typescript
async function verifyApiHeader(domain: string, expectedToken: string): Promise<boolean> {
  const response = await fetch('https://api.crawlready.com/api/render', {
    method: 'POST',
    body: JSON.stringify({ url: `https://${domain}/` }),
  });
  return response.headers.get('x-crawlready-verify') === expectedToken;
}
```

---

## 7. Validation Rules

### 7.1 Domain Validation

```typescript
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function validateDomain(input: string): { valid: boolean; domain: string; error?: string } {
  // Strip protocol if present
  let domain = input.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  
  // Remove www. prefix (optional)
  domain = domain.replace(/^www\./, '');
  
  if (!DOMAIN_REGEX.test(domain)) {
    return { valid: false, domain, error: 'Invalid domain format' };
  }
  
  if (domain.length > 253) {
    return { valid: false, domain, error: 'Domain name too long' };
  }
  
  return { valid: true, domain };
}
```

### 7.2 Settings Validation

| Setting | Validation |
|---------|------------|
| displayName | Max 100 chars, alphanumeric + spaces |
| cacheTtl | One of: 3600, 21600, 43200, 86400, 604800 |
| enabledCrawlers | Array of valid crawler names |
| excludedPaths | Array of valid path patterns |

---

## 8. Error States

### 8.1 No Sites

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              🌐                                          │
│                                                                          │
│                      No sites configured                                 │
│                                                                          │
│            Add your first website to get started with                    │
│                    AI crawler optimization.                              │
│                                                                          │
│                        [Add Your First Site]                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Site in Error State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  mysite.com                                                 🔴 Error     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ⚠️ Integration Error                                                    │
│                                                                          │
│  We haven't been able to verify your integration for 3 days.             │
│  Last successful response: January 8, 2026                               │
│                                                                          │
│  Common causes:                                                          │
│  • Middleware was removed or changed                                     │
│  • API key was rotated without updating .env                             │
│  • Site is not deployed or is offline                                    │
│                                                                          │
│  [Test Connection]    [View Troubleshooting Guide]                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Accessibility

- [ ] All form inputs have associated labels
- [ ] Status indicators use icons + text (not just color)
- [ ] Confirmation modals are keyboard navigable
- [ ] Delete confirmation requires explicit action
- [ ] Error messages are announced to screen readers
- [ ] Table is navigable with keyboard

---

## 10. Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `site_added` | domain, framework | Site created |
| `site_verified` | siteId, method | Verification successful |
| `site_settings_updated` | siteId, changes | Settings saved |
| `site_deleted` | siteId, domain | Site deleted |
| `api_key_regenerated` | siteId | Key regenerated |
| `verification_failed` | siteId, method, error | Verification failed |

---

## 11. Limits and Quotas

| Limit | Free Tier | Pro Tier | Enterprise |
|-------|-----------|----------|------------|
| Sites per organization | 3 | 10 | Unlimited |
| API keys per site | 1 | 1 | 5 |
| Excluded paths | 5 | 20 | Unlimited |

---

## 12. Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| Bulk site import | P2 | Import multiple domains at once |
| Site templates | P3 | Save and apply settings templates |
| Subdomain auto-discovery | P3 | Detect and suggest subdomains |
| Transfer site ownership | P2 | Move site between organizations |
| Site cloning | P3 | Duplicate settings to new site |

---

*This specification defines Sites Management MVP. Iterate based on user feedback.*
