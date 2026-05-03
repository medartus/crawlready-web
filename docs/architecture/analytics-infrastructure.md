# Architecture: Analytics & Ingest Infrastructure

The complete analytics plane — from beacon collection through data storage to dashboard serving. Covers the dual integration model, ingest processing pipeline, site key lifecycle, data aggregation, analytics API, bot list management, alert system, and scaling triggers. Integrates gaps A0-A14, I2, I3, I7 from the [gap analysis](./architectural-gap-analysis.md).

**Scope:** Analytics & ingest plane only. For the scan plane, see [scan-workflow.md](./scan-workflow.md). For the unified infrastructure topology, see [infrastructure-overview.md](./infrastructure-overview.md).

---

## Dual Integration Model (from Gap A0)

Two paths for customers to send AI crawler visit data to CrawlReady. Both feed into the same shared processing pipeline.

```
Path 1: Middleware (★ Recommended)                Path 2: Script Tag (Quick Start)
┌─────────────────────────────────────┐          ┌─────────────────────────────────────┐
│ Server-side, ~5 lines of code       │          │ Client-side, copy-paste into <head>  │
│                                      │          │                                      │
│ Customer's server intercepts request │          │ <script src="https://crawlready.app  │
│ → Checks User-Agent against bot list│          │   /c.js" data-key="cr_live_xxx"      │
│ → If AI bot: POST /api/v1/ingest   │          │   async></script>                    │
│   {s: siteKey, p: path, b: bot,    │          │ <noscript>                           │
│    t: timestamp, v: version}        │          │   <img src="https://crawlready.app   │
│ → Continue serving normal response   │          │     /api/v1/t/cr_live_xxx"           │
│                                      │          │     style="display:none" alt="" />   │
│ Coverage: ~100% of AI bot visits     │          │ </noscript>                          │
│ Source field: 'middleware'           │          │                                      │
│                                      │          │ Layer 1 (c.js): JS-capable bots      │
│ Framework snippets:                  │          │   → Detects bot UA in JS context     │
│ - Next.js middleware                 │          │   → POST /api/v1/ingest              │
│ - Express middleware                 │          │   Source field: 'js'                 │
│ - Cloudflare Worker                  │          │                                      │
│ - Generic Node.js                    │          │ Layer 2 (noscript img): Non-JS bots  │
│                                      │          │   → GET /api/v1/t/{siteKey}          │
│ See: crawler-analytics.md            │          │   → Bot detected via UA header       │
│   for full snippet templates         │          │   → Page path via Referer header     │
│                                      │          │   Source field: 'pixel'              │
│                                      │          │                                      │
│                                      │          │ Coverage: ~60-80% of AI bot visits   │
│                                      │          │ (bots that don't render JS or fetch  │
│                                      │          │  images are missed)                  │
└──────────────────┬──────────────────┘          └──────────────────┬──────────────────┘
                   │                                                │
                   └────────────────────┬───────────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────┐
                          │  SHARED PROCESSING        │
                          │  PIPELINE (A1)            │
                          │  9 steps, < 50ms P95      │
                          │  See below                │
                          └──────────────────────────┘
```

### Why Two Paths

| Dimension | Middleware | Script Tag |
|---|---|---|
| **Setup effort** | Requires server-side code change | Copy-paste into HTML `<head>` |
| **Bot coverage** | ~100% (server-side UA check) | ~60-80% (depends on JS/image fetch) |
| **Page path accuracy** | Exact (from request URL) | Inferred (from Referer header) |
| **Bot identification** | Customer-side regex (may go stale) | CrawlReady-hosted c.js (auto-updated) |
| **Best for** | Technical teams, production deployments | Quick evaluation, non-technical users |
| **Natural evolution** | — | Upgrade to middleware for better coverage |

**Dashboard presentation:** Both options shown during onboarding. Middleware labeled "★ Recommended" with framework-specific tabs. Script tag labeled "Quick Start" with one-click copy. Dashboard tracks `integration_type` per site and nudges script tag users: "Upgrade to middleware for 100% coverage."

---

## Ingest Processing Pipeline (from Gap A1)

All three input paths (middleware POST, c.js POST, tracking pixel GET) converge into one 9-step pipeline.

```
Step 1: Normalize Input
  ┌────────────────────────────────────────────────────────────────┐
  │  Three entry points → unified internal format:                │
  │                                                                │
  │  Middleware POST /api/v1/ingest:                               │
  │    Body: { s: siteKey, p: "/pricing", b: "GPTBot", t: ts, v: 1 }
  │    → source = 'middleware'                                     │
  │                                                                │
  │  c.js POST /api/v1/ingest:                                    │
  │    Body: { s: siteKey, p: "/pricing", b: "GPTBot", t: ts, v: 1 }
  │    → source = 'js'                                             │
  │                                                                │
  │  Tracking pixel GET /api/v1/t/{siteKey}:                      │
  │    UA header → bot detection                                   │
  │    Referer header → path extraction                            │
  │    → source = 'pixel'                                          │
  │                                                                │
  │  Output: NormalizedBeacon {                                    │
  │    site_key, path, bot, source, client_timestamp,             │
  │    beacon_version                                              │
  │  }                                                             │
  └────────────────────────────────────────────────────────────────┘

Step 2: Validate Bot Name
  ┌────────────────────────────────────────────────────────────────┐
  │  Check bot name against packages/core bot registry:           │
  │                                                                │
  │  Known bot (GPTBot, ClaudeBot, etc.)                          │
  │    → Continue with verified = true                            │
  │                                                                │
  │  Unknown bot name                                              │
  │    → Accept with verified = false, tag "unverified"           │
  │    → Forward-compatibility: customer may detect a bot         │
  │      before we add it to our registry                         │
  │                                                                │
  │  Empty or clearly invalid bot name                            │
  │    → Silent reject (204 response, no DB write)                │
  └────────────────────────────────────────────────────────────────┘

Step 3: Server-Side Timestamp
  ┌────────────────────────────────────────────────────────────────┐
  │  Assign server timestamp as source of truth:                  │
  │    visited_at = NOW()                                          │
  │                                                                │
  │  Client timestamp (t field) stored separately for debugging   │
  │  but never used for queries or aggregation.                   │
  │                                                                │
  │  Why: client clocks are unreliable. Server time ensures       │
  │  monotonic ordering and correct time-series aggregation.      │
  └────────────────────────────────────────────────────────────────┘

Step 4: Site Key Lookup (with cache)
  ┌────────────────────────────────────────────────────────────────┐
  │  Look up site_key → site_id + domain + tier:                  │
  │                                                                │
  │  Phase 0 Cache: In-process LRU                                │
  │    - Capacity: 100 entries                                     │
  │    - TTL: 5 minutes                                            │
  │    - Hit rate: ~95% at steady state                           │
  │    - On miss: query Supabase, populate cache                  │
  │                                                                │
  │  Phase 1 Cache: + Upstash Redis shared layer                  │
  │    - Adds cross-instance consistency                          │
  │    - LRU → Redis → Supabase (3-tier lookup)                  │
  │                                                                │
  │  Cache invalidation triggers:                                  │
  │    - Site deleted → evict from cache                          │
  │    - Site key rotated → evict old key, warm new key           │
  │    - Tier changed → evict (tier affects rate limits)          │
  │                                                                │
  │  Invalid/revoked key → silent reject (204, no DB write)       │
  └────────────────────────────────────────────────────────────────┘

Step 5: Rate Limiting
  ┌────────────────────────────────────────────────────────────────┐
  │  Upstash Redis sliding window:                                │
  │    Key: ingest:site:{site_key}                                │
  │    Limit: 100 requests/second                                 │
  │                                                                │
  │  Over limit → silent reject (204 response)                    │
  │  Why silent: the customer's middleware should not retry        │
  │  on rate limit. Fire-and-forget semantics.                    │
  │                                                                │
  │  Fail-open: if Redis is unreachable, skip rate limit check    │
  │  (accept the beacon). Better to accept a few extra beacons   │
  │  than to drop legitimate data.                                │
  └────────────────────────────────────────────────────────────────┘

Step 6: Path Normalization
  ┌────────────────────────────────────────────────────────────────┐
  │  Normalize the page path for consistent aggregation:          │
  │                                                                │
  │  - Lowercase                                                   │
  │  - Strip trailing slash (except root "/")                     │
  │  - Remove query parameters (they fragment analytics)          │
  │  - Remove fragments (#section)                                │
  │  - Truncate to 2048 chars max                                 │
  │  - Reject paths with obvious injection attempts               │
  │                                                                │
  │  Uses: packages/core/detection/url-normalize.ts               │
  └────────────────────────────────────────────────────────────────┘

Step 7: Deduplication (1-Second Window)
  ┌────────────────────────────────────────────────────────────────┐
  │  Prevent double-counting when both c.js and pixel fire:       │
  │                                                                │
  │  Dedup key: {site_key}:{path}:{bot}                           │
  │  Window: 1 second                                              │
  │  Storage: Upstash Redis (SETNX with 1s TTL)                  │
  │                                                                │
  │  If key exists → skip DB write (already recorded)             │
  │  If key doesn't exist → set key, proceed to write            │
  │                                                                │
  │  Why 1 second: same bot visiting same path within 1 second   │
  │  is almost certainly a duplicate from dual-path firing.       │
  │  After 1 second, it's likely a genuine second visit.          │
  │                                                                │
  │  Fail-open: if Redis unreachable, skip dedup (accept both).  │
  └────────────────────────────────────────────────────────────────┘

Step 8: Return Response (before DB write)
  ┌────────────────────────────────────────────────────────────────┐
  │  Respond immediately — don't wait for database:               │
  │                                                                │
  │  POST /api/v1/ingest → 204 No Content                        │
  │    Headers: X-Correlation-ID: {uuid}                          │
  │    Body: empty                                                │
  │                                                                │
  │  GET /api/v1/t/{siteKey} → 200 OK                            │
  │    Headers: Content-Type: image/gif                           │
  │             Cache-Control: no-store                           │
  │             Content-Length: 43                                 │
  │    Body: 1×1 transparent GIF (43 bytes)                      │
  │                                                                │
  │  The client (customer's middleware or c.js) gets a fast       │
  │  response. DB write happens asynchronously.                   │
  └────────────────────────────────────────────────────────────────┘

Step 9: Async Database Write (via waitUntil)
  ┌────────────────────────────────────────────────────────────────┐
  │  Using Vercel's waitUntil() — write happens after response:   │
  │                                                                │
  │  INSERT INTO crawler_visits (                                  │
  │    site_id, path, bot, source, visited_at, beacon_version     │
  │  ) VALUES ($1, $2, $3, $4, NOW(), $5)                         │
  │                                                                │
  │  On write failure: log error (Pino + Sentry), drop beacon.   │
  │  At-most-once delivery — no retry. Individual events are      │
  │  low-value; aggregates matter. < 1% expected loss rate.       │
  │                                                                │
  │  Phase 1 optimization (I7): batch writes                      │
  │    If ingest volume > 200 req/s:                              │
  │    - Buffer beacons in-memory (max 100 or 1 second)           │
  │    - Bulk INSERT in one query                                  │
  │    - Reduces DB connections from N to N/100                   │
  └────────────────────────────────────────────────────────────────┘
```

### Pipeline Performance Target

| Metric | Target | Rationale |
|---|---|---|
| End-to-end P95 latency | < 50ms | Customer's middleware should not noticeably slow their request |
| Time to response (Step 8) | < 20ms | Response sent before DB write |
| DB write latency (Step 9) | < 100ms | Async, not on critical path |
| Dedup accuracy | > 99% | 1-second window catches dual-path duplicates |
| Overall delivery rate | > 99% | At-most-once, < 1% expected loss |

---

## Site Key Lifecycle (from Gaps A2, I2)

### Key Format

```
Site Key Format: cr_live_{16_alphanumeric}
  Example: cr_live_a1b2c3d4e5f6g7h8

  Prefix: cr_live_ (distinguishes from future test keys: cr_test_)
  Body: 16 chars from [a-z0-9] = 36^16 ≈ 7.9 × 10^24 combinations
  Total length: 24 characters

  Generation: crypto.randomBytes(12).toString('base64url').slice(0, 16).toLowerCase()
```

### Key Operations

```
Create (on site registration):
  POST /api/v1/sites
  → Generate cr_live_{random}
  → Store in sites.site_key
  → Return to user in response + dashboard

Rotate (Phase 1):
  POST /api/v1/sites/{siteId}/rotate-key
  Auth: Clerk JWT (site owner)
  → Generate new cr_live_{random}
  → Old key enters grace period (accepts beacons for 24 hours)
  → After 24h: old key stops working
  → Dashboard shows: "Key rotated. Update your snippet within 24 hours."
  → Cache: evict old key, warm new key

  Grace period mechanism:
    sites.previous_site_key = old_key
    sites.key_rotated_at = NOW()
    Ingest pipeline: check site_key OR previous_site_key (if rotated_at < 24h ago)

Revoke (Phase 1 — emergency):
  POST /api/v1/sites/{siteId}/revoke-key
  Auth: Clerk JWT (site owner)
  → Immediately invalidate current key (no grace period)
  → Generate new key
  → Dashboard shows warning: "Key revoked. Update your snippet immediately."
  → Use case: key leaked in a public repository

Delete (on site removal):
  DELETE /api/v1/sites/{siteId}
  → Cascade: crawler_visits retained for 90 days (data retention)
  → Site key becomes invalid immediately
  → Cache: evict key
```

### Trust Model

```
Site keys are SEMI-PUBLIC by design:
  - Embedded in customer's server code (middleware) or HTML (script tag)
  - Anyone with the key can send beacons for that site
  - This is acceptable because:
    1. The data (crawler visit counts) is low-value per event
    2. A bad actor gains nothing — they pollute only their own dashboard
    3. Rate limiting (100 req/s per key) prevents abuse at scale
    4. The snippet runs on the customer's server — if beacons arrive,
       they genuinely control the domain's server

  Comparison: Google Analytics measurement IDs (G-XXXXX) are equally
  public and Google has operated this model for 20+ years.
```

---

## Bot List Management (from Gap A5)

### Bot Registry — Single Source of Truth

```
Location: packages/core/detection/bot-registry.ts

  interface KnownBot {
    id: string;              // 'gptbot'
    display_name: string;    // 'GPTBot (OpenAI)'
    regex_pattern: string;   // 'GPTBot'
    category: 'search' | 'training' | 'agent';
    renders_js: boolean;     // affects script tag coverage expectations
    fetches_images: boolean; // affects tracking pixel coverage
    color: string;           // '#10B981' for dashboard charts
    docs_url: string;        // link to bot documentation
  }

  Consumers of this registry:
  ├── c.js build pipeline (generates client-side regex)
  ├── Ingest server (validates bot names)
  ├── Middleware snippet templates (provides regex)
  ├── Dashboard UI (bot colors, display names)
  ├── Scoring pipeline (bot-specific checks)
  └── Phase 1: GET /api/v1/bots (public registry endpoint)
```

### Bot List Update Flow

```
Adding a New Bot:

  Script Tag Path (auto-updated):
    1. Add entry to packages/core bot registry
    2. Build pipeline regenerates c.js with updated regex
    3. Deploy to Vercel (c.js served with 1-hour CDN TTL)
    4. Within 1 hour, all script tag customers detect the new bot
    → Zero customer action required

  Middleware Path (requires customer update):
    1. Add entry to packages/core bot registry
    2. Deploy server (ingest now accepts the new bot)
    3. Dashboard notification: "New AI crawler detected: GrokBot.
       Update your middleware snippet to track it." [Copy updated regex]
    4. Phase 1: email notification to middleware site owners
    → Requires customer to update their middleware (manual step)

  Phase 2 mitigation for middleware:
    Option A: npm package (@crawlready/detect) — npm update pulls new bots
    Option B: Middleware fetches bot list from GET /api/v1/bots on startup
    Decision deferred to Phase 2 based on customer feedback.
```

### Beacon Version Tracking

```
All beacons include a version field: { ..., v: 1 }

  Version increments when the bot list changes.

  Server tracks latest beacon version per site (sites.beacon_version).

  Dashboard shows:
    Script tag: "Detecting 10/12 known bots" (stale CDN cache)
    Middleware: "Your snippet is v1 (current is v3).
      Update to detect 3 new crawlers." [Copy updated snippet]
```

---

## Domain Verification (from Gap A6)

### Phase 0: No Verification (Acceptable)

```
Registering a domain doesn't give access to anyone else's data.
Each user sees only their own crawler_visits (filtered by their site_key).
Risk: a user registers a domain they don't own → pollutes only their own data.
Acceptable because: the snippet runs on THEIR server.
```

### Phase 1: Lightweight Verification

```
Option A: Meta Tag Verification (recommended — lower friction)
  1. After registration, dashboard shows:
     "Add this tag to your homepage's <head>:
      <meta name='crawlready-verify' content='cr_live_a1b2c3d4e5f6'>"
  2. Background job fetches homepage periodically (hourly for 72h)
  3. If tag found → site.verified = true
  4. Dashboard shows verified/unverified badge

Option B: DNS TXT Record (alternative for advanced users)
  1. "Add TXT record: crawlready-verify=cr_live_a1b2c3d4e5f6"
  2. Background job checks DNS within 72h
  3. More familiar for DevOps teams, higher friction for frontend devs

Feature Gating by Verification:
  Verified: full analytics, alerts, export, public badge
  Unverified: data collected, basic stats, no alerts, no export
  → Soft incentive to verify without blocking the onboarding flow
```

---

## Data Aggregation Strategy (from Gap A3)

### Phase 0: Real-Time Queries

```
Sufficient for < 500K rows in crawler_visits.

Dashboard queries run directly against the raw table:

  SELECT COUNT(*) FROM crawler_visits
  WHERE site_id = $1 AND visited_at >= NOW() - INTERVAL '30 days';

  SELECT bot, COUNT(*) FROM crawler_visits
  WHERE site_id = $1 AND visited_at >= NOW() - INTERVAL '30 days'
  GROUP BY bot ORDER BY COUNT(*) DESC;

Indexes required:
  CREATE INDEX idx_crawler_visits_site_visited
    ON crawler_visits (site_id, visited_at DESC);
  CREATE INDEX idx_crawler_visits_site_bot
    ON crawler_visits (site_id, bot, visited_at DESC);

Expected performance: < 200ms for all queries at < 500K rows.
```

### Phase 1: Daily Rollup Table

Triggered when `crawler_visits` exceeds 1M rows or dashboard query P95 > 500ms.

```sql
CREATE TABLE crawler_visits_daily (
  site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  bot         TEXT NOT NULL,
  path        TEXT NOT NULL,
  source      TEXT NOT NULL,       -- middleware, js, pixel
  visit_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (site_id, date, bot, path, source)
);

-- Populated by pg_cron job running at 00:15 UTC daily:
INSERT INTO crawler_visits_daily (site_id, date, bot, path, source, visit_count)
SELECT site_id, visited_at::date, bot, path, source, COUNT(*)
FROM crawler_visits
WHERE visited_at >= CURRENT_DATE - 1
  AND visited_at < CURRENT_DATE
GROUP BY site_id, visited_at::date, bot, path, source
ON CONFLICT (site_id, date, bot, path, source)
DO UPDATE SET visit_count = EXCLUDED.visit_count;
```

Dashboard queries switch to the rollup table for periods > 7 days. Raw table still used for intra-day and detailed queries.

### Phase 2: Cloudflare Analytics Engine

Triggered when `crawler_visits` exceeds 50M rows or ingest > 5,000 req/s.

```
Cloudflare Analytics Engine:
  - Unlimited free writes (included with Workers)
  - SQL-like query API
  - Automatic rollups and retention
  - Global edge writes (< 10ms)

Migration:
  - Beacon writes move from Supabase to Analytics Engine
  - Supabase retains: site management, alerts, dashboard state
  - Ingest endpoint moves to Cloudflare Worker (global edge)
```

---

## Data Retention (from Gap I3)

```
crawler_visits (raw events):
  Phase 0: No retention (table grows until migration trigger)
  Phase 1: 90-day retention via pg_cron:
    DELETE FROM crawler_visits
    WHERE visited_at < NOW() - INTERVAL '90 days';
    -- Run daily at 01:00 UTC
    -- Batch delete: LIMIT 10000 per execution to avoid lock contention

crawler_visits_daily (rollups):
  Indefinite retention. Rollups are small and serve historical dashboards.

scans:
  Phase 0: No retention (scan history is valuable)
  Phase 1: 1-year retention for free-tier scans:
    DELETE FROM scans
    WHERE completed_at < NOW() - INTERVAL '1 year'
    AND domain NOT IN (SELECT domain FROM sites);
    -- Only delete scans for domains with no registered site

subscribers:
  Indefinite (email list is a business asset).

sites:
  Retained until user deletes. Soft-delete pattern:
    sites.deleted_at = NOW()
    crawler_visits retained for 90 more days
    After 90 days: hard delete + cascade
```

---

## Analytics API Endpoints (from Gap A4)

Six focused endpoints for the Phase 1 dashboard. All require Clerk auth + site ownership verification.

### 1. Overview

```
GET /api/v1/analytics/{siteId}/overview
Auth: Clerk JWT (site owner)
Query: ?period=7d|30d|90d

Response:
{
  "site_id": "uuid",
  "domain": "example.com",
  "period": "30d",
  "total_visits": 5024,
  "unique_pages": 67,
  "active_crawlers": 5,
  "vs_previous_period": {
    "total_visits_change": 0.12,
    "unique_pages_change": -0.03
  }
}
```

### 2. Per-Crawler Breakdown

```
GET /api/v1/analytics/{siteId}/bots
Auth: Clerk JWT
Query: ?period=7d|30d|90d

Response:
{
  "bots": [
    {
      "bot": "Google-Extended",
      "display_name": "Google AI",
      "visits": 2891,
      "pages": 67,
      "share": 0.58,
      "trend": "up"
    }
  ]
}
```

### 3. Top Pages

```
GET /api/v1/analytics/{siteId}/pages
Auth: Clerk JWT
Query: ?period=7d|30d|90d&bot=GPTBot&limit=20&offset=0

Response:
{
  "pages": [
    { "path": "/docs/getting-started", "visits": 1247, "bots": 5 }
  ],
  "total": 67,
  "limit": 20,
  "offset": 0
}
```

### 4. Time Series

```
GET /api/v1/analytics/{siteId}/timeseries
Auth: Clerk JWT
Query: ?period=7d|30d|90d&bot=GPTBot&granularity=hour|day

Response:
{
  "datapoints": [
    { "timestamp": "2026-04-01T00:00:00Z", "visits": 142 },
    { "timestamp": "2026-04-02T00:00:00Z", "visits": 168 }
  ],
  "granularity": "day"
}

Constraint: granularity=hour only available for period=7d
```

### 5. Alerts (from Gap A7)

```
GET /api/v1/analytics/{siteId}/alerts
Auth: Clerk JWT

Response:
{
  "alerts": [
    {
      "type": "invisible_content",
      "severity": "critical",
      "path": "/pricing",
      "bot": "GPTBot",
      "visits_30d": 89,
      "crawlability_score": 12,
      "message": "GPTBot visited /pricing 89 times but your crawlability score is 12/100",
      "action": "run_diagnostic",
      "action_url": "/scan?url=https://example.com/pricing"
    }
  ]
}
```

**Alert types and computation:**

| Alert Type | Trigger Logic | Phase |
|---|---|---|
| `invisible_content` | crawler_visits.path has scan with crawlability_score < 30 AND visits > 10 | Phase 1 |
| `new_crawler` | First occurrence of a bot for this site in last 7 days | Phase 1 |
| `traffic_spike` | Today's visits for a bot > 5x the 7-day daily average | Phase 1 |
| `no_recent_activity` | No crawler visits in 7+ days for a previously active site | Phase 1 |
| `snippet_outdated` | Beacon version < current server version | Phase 1 |
| `score_change` | New scan shows score change of ±10 from previous scan | Phase 2 |

**Computation strategy:**
- Phase 1: On-demand (compute at API call time via SQL joins)
- Phase 2: Pre-computed via pg_cron into `site_alerts` table + email notifications

### 6. Data Export (from Gap A10)

```
GET /api/v1/analytics/{siteId}/export
Auth: Clerk JWT
Query: ?format=csv|json&period=7d|30d|90d&bot=GPTBot

CSV Format:
  timestamp,path,bot
  2026-04-20T14:30:00Z,/pricing,GPTBot
  2026-04-20T14:31:12Z,/docs/api,ClaudeBot

Limits:
  - Max: 100,000 rows (paginated if more)
  - Free tier: last 30 days only
  - Paid tier: full retention window

Implementation:
  - Stream response (don't buffer entire export)
  - Cursor-based pagination internally
  - Content-Disposition header for browser download
```

### Multi-Site Overview (from Gap A8)

```
GET /api/v1/analytics/overview
Auth: Clerk JWT
Purpose: Cross-site summary for all user's registered sites

Response:
{
  "total_sites": 3,
  "total_visits_30d": 12450,
  "sites": [
    {
      "site_id": "uuid-1",
      "domain": "example.com",
      "visits_30d": 5024,
      "active_crawlers": 5,
      "top_crawler": "Google-Extended",
      "has_alerts": true,
      "alert_count": 2
    }
  ]
}

Phase 0: /dashboard/sites list view is sufficient.
Phase 1: This endpoint powers the default dashboard landing page.
```

---

## Tracking Pixel & c.js Endpoints

### Tracking Pixel

```
GET /api/v1/t/{siteKey}

Purpose: Detect non-JS bots via <noscript><img> (Layer 2 of script tag path)

Request:
  User-Agent: GPTBot/1.0 (+https://openai.com/gptbot)
  Referer: https://example.com/pricing

Processing:
  1. Extract siteKey from URL path
  2. Extract bot from User-Agent header (same regex as c.js)
  3. Extract path from Referer header (normalize, strip origin)
  4. If bot detected → feed into shared pipeline (Steps 4-9)
  5. If no bot detected → return pixel anyway (no-op)

Response:
  Status: 200 OK
  Content-Type: image/gif
  Cache-Control: no-store
  Content-Length: 43
  Body: 1×1 transparent GIF

The 1×1 GIF (43 bytes, base64):
  R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7
```

### c.js (Client-Side Detection Script)

```
GET /c.js

Purpose: Detect JS-capable bots and send beacon (Layer 1 of script tag path)

Hosting: Served by Vercel, CDN-cached with 1-hour TTL
Size: ~400 bytes gzipped

Build pipeline:
  1. packages/core exports bot registry (regex patterns)
  2. Build step generates minified c.js with embedded regex
  3. Single source of truth: bot registry → c.js → no drift

Script behavior:
  1. Read data-key attribute from own <script> tag
  2. Check navigator.userAgent against bot regex
  3. If match → POST /api/v1/ingest with {s, p, b, t, v}
  4. Fire-and-forget: fetch().catch(() => {})
  5. If no match → do nothing (human visitor)

Response headers:
  Content-Type: application/javascript
  Cache-Control: public, max-age=3600
  (Bot list updates propagate within 1 hour)
```

---

## Complete Data Flow Diagram (from Gap A13)

```
Customer's Website (HTML <head>)        CrawlReady (Vercel)                    Supabase
┌────────────────────────────┐        ┌────────────────────────────────┐     ┌──────────┐
│ <script src="c.js"          │        │                                │     │          │
│   data-key="cr_live_xxx">   │        │  GET /c.js (CDN, 1hr TTL)     │     │          │
│ <noscript>                  │        │    → Bot detection script      │     │          │
│   <img src="/t/KEY" />      │        │                                │     │          │
│ </noscript>                 │        │                                │     │          │
└──────────┬─────────────────┘        │                                │     │          │
           │                           │                                │     │          │
  AI Bot visits page                   │                                │     │          │
           │                           │                                │     │          │
  ┌────────┴────────┐                  │                                │     │          │
  │ Bot renders JS? │                  │                                │     │          │
  └──┬──────────┬───┘                  │                                │     │          │
     │Yes       │No                    │                                │     │          │
     ▼          ▼                      │                                │     │          │
  Layer 1    Layer 2                   │                                │     │          │
  c.js runs  <img> fetched             │                                │     │          │
     │          │                      │                                │     │          │
     │  POST /api/v1/ingest            │  Shared Processing Pipeline    │     │          │
     │────────────────────────────────▶│    ├─ Normalize input          │     │          │
     │  {s,p,b,t,v}                    │    ├─ Validate bot             │     │          │
     │                                 │    ├─ Server timestamp         │     │          │
     │  GET /api/v1/t/{key}            │    ├─ Lookup site_key ─────────│────▶│  sites   │
     │────────────────────────────────▶│    │   (LRU cache → Supabase) │     │          │
     │  (UA + Referer headers)         │    ├─ Rate limit ──────────────│──▶Redis       │
                                       │    ├─ Normalize path           │     │          │
  OR: Customer Middleware              │    ├─ Dedup check (1s window)  │     │          │
  ┌──────────────────────┐             │    ├─ Return 204 / 1×1 GIF    │     │          │
  │ Server-side UA check │             │    └─ waitUntil: INSERT ───────│────▶│ crawler_ │
  │ POST /api/v1/ingest  │────────────▶│                                │     │ visits   │
  │ {s,p,b,t,v}          │             │                                │     │          │
  └──────────────────────┘             │                                │     │          │
                                       │  Dashboard (Phase 1)           │     │          │
                                       │    │                           │     │          │
  Site Owner's Browser                 │    ├─ GET /analytics/overview  │     │          │
┌──────────────────┐                   │    │   → SELECT COUNT(*) ──────│────▶│ crawler_ │
│  Dashboard UI     │◀─────────────────│    │     FROM crawler_visits   │     │ visits   │
│  - charts         │   JSON API       │    │                           │     │          │
│  - top pages      │                  │    ├─ GET /analytics/alerts    │     │          │
│  - alerts         │                  │    │   → JOIN crawler_visits ──│────▶│ scans    │
│  - export         │                  │    │     WITH scans by domain  │     │          │
└──────────────────┘                   │    │                           │     │          │
                                       │    └─ GET /analytics/export    │     │          │
                                       │       → Stream CSV ────────────│────▶│ crawler_ │
                                       │                                │     │ visits   │
                                       └────────────────────────────────┘     └──────────┘
```

---

## Scaling Triggers (from Gap A14)

| Metric | Phase 0 OK | Trigger Phase 1 | Trigger Phase 2 |
|---|---|---|---|
| Total `crawler_visits` rows | < 500K | > 1M → add daily rollup table | > 50M → Cloudflare Analytics Engine |
| Ingest req/s (sustained) | < 50 | > 200 → add batch writes | > 5,000 → dedicated Cloudflare Worker |
| Dashboard query P95 | < 200ms | > 500ms → add rollup table | > 2s → Analytics Engine |
| Active sites | < 500 | > 2,000 → Redis for site key cache | > 20,000 → dedicated ingest service |
| Supabase DB size (free = 500MB) | < 400MB | > 400MB → upgrade to Pro or add retention | N/A (migrated) |

### Phase 0 → Phase 1 Migration Steps

1. Add `crawler_visits_daily` rollup table + pg_cron job
2. Move site key cache to Upstash Redis (shared across Vercel instances)
3. Add data retention (90-day raw, indefinite rollups)
4. Add monthly partitioning on `crawler_visits`

### Phase 1 → Phase 2 Migration Steps

1. Move beacon writes to Cloudflare Analytics Engine (unlimited free writes)
2. Keep Supabase for dashboard state, alerts, site management
3. Extract ingest into standalone Cloudflare Worker (global edge, < 10ms)
4. Move rollup computation to Cloudflare Cron Triggers

---

## Beacon Reliability Model (from Gap A9)

```
Design: At-Most-Once Delivery

  Why at-most-once is correct:
  - Each beacon = one AI crawler request
  - Individual events are low-value; aggregates matter
  - At-most-once: some events may be lost, none are duplicated
  - The alternative (at-least-once + dedup) adds latency and complexity
    for zero user-visible benefit

  Expected loss rate: < 1%
  Sources of loss:
  - Customer server network failure → beacon never sent
  - CrawlReady endpoint temporarily unavailable → dropped
  - Vercel cold start timeout → dropped
  Mitigation: None needed. 99%+ delivery is sufficient for analytics.

  Idempotency (Phase 0): Not implemented
  - The 1-second dedup window prevents obvious duplicates
  - True idempotency keys add overhead with no benefit
  - If customer middleware retries within 1s → deduped
  - If retry after 1s → recorded as separate visit (correct behavior)

  Acknowledgment (Phase 2 — only if requested):
  - Optional: { "received": true, "event_id": "..." }
  - Requires opt-in header: X-CrawlReady-Ack: true
  - 99% of customers should use fire-and-forget (default)
```

---

## Hidden Backlink Architecture (from Gap A11)

```
Decision: Backlink injected in the OPTIMIZED AI PAGE, not via middleware or script.

  CrawlReady's content pipeline (Phase 2+) generates optimized pages.
  For free-tier users, the optimized page includes:

  <link rel="ai-analytics" href="https://crawlready.app/score/{domain}" />

  Why this is the right place:
  ├── CrawlReady controls the optimized page entirely
  ├── Works for ALL bots (every AI crawler receives it)
  ├── No framework-specific code needed
  ├── No client-side DOM manipulation or middleware modification
  ├── Removal on upgrade is automatic (tier check during generation)
  ├── Cannot be accidentally removed by the customer
  └── Cannot be bypassed

  Phase mapping:
  ├── Phase 0-1: Not applicable (no content pipeline yet)
  └── Phase 2: Injected automatically when content pipeline ships
```

---

## Decisions

- **Dual integration (A0):** Middleware (recommended, ~100% coverage) and script tag (quick start, ~60-80%). Both feed the same pipeline. Keeping both is deliberate — different user segments, natural upsell funnel.
- **Pipeline design (A1):** 9-step shared pipeline with < 50ms P95. Response before DB write via `waitUntil()`. Silent rejection for invalid keys/bots. At-most-once delivery.
- **Site key caching (A2):** Phase 0 = in-process LRU (100 entries, 5-min TTL). Phase 1 = add Upstash Redis. Invalidated on delete, rotate, tier change.
- **Aggregation (A3):** Phase 0 = real-time queries (< 500K rows). Phase 1 = daily rollup via pg_cron. Phase 2 = Cloudflare Analytics Engine.
- **Analytics API (A4):** 6 focused endpoints, not one monolithic response. All require Clerk auth + site ownership.
- **Bot registry (A5):** Single source in `packages/core`. c.js auto-updates. Middleware users notified in dashboard.
- **Domain verification (A6):** Phase 0 = none. Phase 1 = meta tag. Verified/unverified feature gating.
- **Alerts (A7):** Phase 1 = on-demand computation (SQL joins). 6 alert types. Phase 2 = pre-computed + email.
- **Beacon reliability (A9):** At-most-once by design. < 1% loss rate. No idempotency keys in Phase 0.
- **Data export (A10):** Phase 1 streaming CSV/JSON. Max 100K rows. Free tier limited to 30 days.
- **Hidden backlink (A11):** In the content pipeline optimized page (Phase 2), not middleware or script.
- **Scaling triggers (A14):** Documented thresholds for rollup table (1M rows), Redis (2K sites), Analytics Engine (50M rows). No premature optimization.
- **Data retention (I3):** 90-day raw events, indefinite rollups, 1-year free-tier scans.
- **Site key lifecycle (I2):** Rotate with 24h grace period. Revoke immediate (emergency). Delete cascades with retention.
