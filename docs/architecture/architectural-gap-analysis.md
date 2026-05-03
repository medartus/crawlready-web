# Architecture: Principal-Level Gap Analysis & Infrastructure Design

A comprehensive architectural review identifying gaps, missing infrastructure, and design recommendations across CrawlReady's full product lifecycle. Written from a principal engineer perspective, focused on high-level interactions, workflows, data flows, and mechanisms — not low-level code.

**Scope:** Every document in `docs/product/` and `docs/architecture/` has been reviewed. This analysis identifies what's missing, what's inconsistent, and what must be designed to support Phase 0 through Phase 4.

**Structure:** Gaps organized by criticality (Critical → Important → Strategic), each with: the gap description, why it matters, the proposed design, and where it fits in the existing architecture.

---

## Summary of Findings

| Category | Count | Description |
|---|---|---|
| **Critical (C1-C7)** | 7 | Scan/scoring plane. Must resolve before Phase 0 ships. |
| **Important (I1-I8)** | 8 | Scan/scoring plane. Should resolve before Phase 1. |
| **Strategic (S1-S9)** | 9 | Long-term architecture decisions. Design now, build incrementally. |
| **Analytics & Ingest (A1-A14)** | 14 | Full analytics/ingest infrastructure. End-to-end pipeline, data aggregation, API design, bot management, alerts, scaling. |
| **Total** | **38** | Across both data planes. ~12 days of Phase 0 critical path work. |

---

## Critical Gaps (Phase 0 Blockers)

### C1. Scan Workflow Orchestration — No State Machine

**Gap:** `api-first.md` defines `POST /api/v1/scan` and `GET /api/v1/score/{domain}` but treats the scan as a single atomic operation. In reality, a scan is a multi-step workflow (validate URL → crawl rendered view → crawl bot view → probe content negotiation → check llms.txt → compute scores → store → generate score page). No state tracking, no retry semantics, no partial failure handling.

**Why it matters:** Firecrawl API calls take 3-15s. Vercel serverless functions have 10s (hobby) or 60s (pro) timeouts. A scan that takes 20s+ will silently fail with no recovery. Users see a spinner that never resolves.

**Proposed Design:**

```
Scan States: PENDING → CRAWLING → SCORING → COMPLETE | FAILED | PARTIAL

Data Model Addition:
┌─────────────────────────────────────────────────────────┐
│ scans table — add columns:                               │
│   status        TEXT NOT NULL DEFAULT 'pending'          │
│   correlation_id UUID NOT NULL DEFAULT gen_random_uuid() │
│   error_code    TEXT                                      │
│   error_message TEXT                                      │
│   crawl_started_at  TIMESTAMPTZ                          │
│   scoring_started_at TIMESTAMPTZ                         │
│   completed_at       TIMESTAMPTZ                         │
│   firecrawl_cost_cents INT                               │
└─────────────────────────────────────────────────────────┘

Workflow:
1. POST /api/v1/scan → validate URL, create scan row (PENDING), return scan_id + correlation_id
2. Trigger async crawl (Vercel background function or waitUntil)
   → Update status = CRAWLING
   → Execute: rendered fetch (Firecrawl) + bot fetch (direct HTTP) + content negotiation probe + llms.txt check
   → On any fetch failure: retry 2x with backoff, then mark check as "unavailable"
3. On crawl complete → Update status = SCORING
   → Run scoring pipeline (all 3 sub-scores + EU AI Act checklist)
   → Partial scoring: if one sub-score fails, store the others, mark status = PARTIAL
4. On scoring complete → Update status = COMPLETE
   → Write final scores, recommendations, schema_preview

Client Polling:
GET /api/v1/scan/{scan_id}/status → { status, progress_pct, eta_seconds }
GET /api/v1/score/{domain} → latest COMPLETE scan for domain

Timeout Safety:
- Vercel Pro: 60s function limit is sufficient for single-page scan
- If approaching timeout: flush partial results (status = PARTIAL), return what we have
- Client shows partial results with "Some checks could not complete" messaging
```

**Where it fits:** Extends `api-first.md` §API Endpoints and the `scans` data model. The correlation_id feeds into observability (see C5).

---

### C2. Rate Limiting & Abuse Prevention

**Gap:** The diagnostic mentions "3 scans/hr/IP" and the ingest mentions "100 req/s per site key" but no enforcement mechanism is defined. A single bad actor could exhaust the Firecrawl budget in minutes.

**Why it matters:** Firecrawl costs $0.001-0.05 per page. 1,000 abusive scans = $1-50 in costs. Show HN traffic could bring legitimate traffic spikes alongside abuse. Without rate limiting, the free tier is an unlimited cost amplifier.

**Proposed Design:**

```
Rate Limiting Strategy — 3 Layers:

Layer 1: Edge Rate Limiting (Vercel Edge Middleware)
  - IP-based: 3 scans/hr for diagnostic (free), 10/hr for authenticated
  - Uses Vercel's built-in edge middleware with in-memory counter
  - Phase 0: sufficient for launch
  - Response: 429 Too Many Requests with Retry-After header

Layer 2: Application Rate Limiting (Upstash Redis)
  - Sliding window algorithm via @upstash/ratelimit
  - Key patterns:
    - scan:ip:{ip} → 3/hr (free diagnostic)
    - scan:user:{clerk_id} → tier-based limits
    - ingest:site:{site_key} → 100/s
    - subscribe:ip:{ip} → 5/hr
  - Cost: Upstash free tier (10K commands/day) covers Phase 0
  - Upgrade: Upstash Pay-as-you-go ($0.20/100K commands) at scale

Layer 3: Budget Circuit Breaker
  - Track daily Firecrawl API spend
  - Soft limit (80% of daily budget): throttle new scans, queue instead of reject
  - Hard limit (100%): reject new scans with 503 + "Service at capacity"
  - Alert founder via email/Slack when soft limit hit
  - Daily budget = monthly Firecrawl plan / 30

Anti-Abuse Specific:
  - Diagnostic: require passing a lightweight challenge (honeypot field) — not CAPTCHA
  - Ingest: validate site_key exists before processing payload
  - Subscribe: email format validation + disposable email domain blocklist
```

**Where it fits:** New cross-cutting concern. Touches every public API endpoint defined in `api-first.md`. Upstash Redis becomes a Phase 0 infrastructure dependency.

---

### C3. Error Recovery & Partial Failure Strategy

**Gap:** No document addresses what happens when individual steps of a scan fail. The scoring algorithm assumes all input data is available. The API contract has error codes but no partial-success semantics.

**Why it matters:** In production, partial failures are the norm, not the exception. Firecrawl may timeout. The target site may block certain request types. The llms.txt check may fail while everything else succeeds. Showing "Error" when 90% of the diagnostic data is available destroys the user experience.

**Proposed Design:**

```
Principle: Always show what we have. Never discard partial results.

Per-Check Failure Model:
┌──────────────────────────┬───────────┬──────────────────────────────┐
│ Check                     │ Required? │ On Failure                    │
├──────────────────────────┼───────────┼──────────────────────────────┤
│ Rendered view (Firecrawl) │ Yes       │ Retry 2x → scan FAILED       │
│ Bot view (direct HTTP)    │ Yes       │ Retry 2x → scan FAILED       │
│ Content negotiation probe │ No        │ Mark as "not tested", skip    │
│ llms.txt check            │ No        │ Mark as "not found", skip     │
│ robots.txt parse          │ No        │ Assume no restrictions, skip  │
│ Schema.org detection      │ No        │ Score as 0, note unavailable  │
│ Accessibility tree parse  │ No        │ Agent Interaction = N/A       │
└──────────────────────────┴───────────┴──────────────────────────────┘

Score Computation with Missing Data:
- If a non-required check fails: compute sub-score without it, add note
- If Agent Interaction data unavailable: compute AI Readiness from Crawlability (67%) + Agent Readiness (33%) — reweight
- If rendered view fails: scan is FAILED (can't produce meaningful result)
- Display: "Based on available data" qualifier when any check is missing

API Response:
{
  "status": "complete" | "partial" | "failed",
  "checks_completed": 7,
  "checks_total": 9,
  "checks_failed": ["content_negotiation", "llms_txt"],
  "scores": { ... },  // computed from available data
  "data_quality": "full" | "partial" | "degraded"
}
```

**Where it fits:** Extends the scoring algorithm in `scoring-detail.md` and the API contract in `api-first.md`.

---

### C4. Deployment Architecture — Phase 0 Specifics

**Gap:** `api-first.md` says Vercel. `content-pipeline-infrastructure.md` says Cloudflare Workers. The Phase 0 deployment topology is not explicitly defined: environment strategy, CI/CD, preview deployments, function configuration, environment variables.

**Why it matters:** Without a clear deployment architecture, the first deploy is ad-hoc. Environment variable management, preview URLs for testing, and the staging→production promotion path are undefined.

**Proposed Design:**

```
Phase 0 Deployment Topology:

┌──────────────────────────────────────────────────────┐
│                    Vercel Platform                     │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Edge        │  │ Serverless   │  │ Background   │ │
│  │ Middleware   │  │ Functions    │  │ Functions    │ │
│  │ (bot detect, │  │ (/api/v1/*)  │  │ (scan async  │ │
│  │  rate limit) │  │              │  │  processing) │ │
│  └─────────────┘  └──────────────┘  └─────────────┘ │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐                   │
│  │ Static/ISR  │  │ Edge Config  │                   │
│  │ (score pages,│  │ (feature     │                   │
│  │  landing)   │  │  flags)      │                   │
│  └─────────────┘  └──────────────┘                   │
└──────────────────┬──────────────┬────────────────────┘
                   │              │
          ┌────────▼────┐  ┌─────▼──────────┐
          │ Supabase    │  │ Upstash Redis  │
          │ (PostgreSQL)│  │ (rate limiting)│
          └─────────────┘  └────────────────┘
                   │
          ┌────────▼────┐
          │ Firecrawl   │
          │ (crawl API) │
          └─────────────┘

Environment Strategy:
  - Production: crawlready.app (Vercel production branch)
  - Preview: pr-{n}.crawlready.app (Vercel preview per PR)
  - Local: localhost:3000 (Firecrawl sandbox API key, Supabase local)

Environment Variables (Phase 0):
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  CLERK_SECRET_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  FIRECRAWL_API_KEY
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
  NEXT_PUBLIC_APP_URL (canonical URL for score pages)

CI/CD Pipeline:
  1. Push to main → Vercel auto-deploy to production
  2. Push to PR branch → Vercel preview deployment
  3. Pre-deploy: lint + type-check + unit tests (GitHub Actions)
  4. Post-deploy: smoke test (hit /api/v1/scan with known URL, verify 200)

Vercel Function Configuration:
  /api/v1/scan      → maxDuration: 60s (Pro plan required)
  /api/v1/score/*   → ISR with 1hr revalidation
  /api/v1/ingest    → maxDuration: 10s (lightweight, no external calls needed)
  /api/v1/subscribe → maxDuration: 10s
```

**Where it fits:** New section in `api-first.md` or standalone deployment doc. Resolves the Vercel-vs-Cloudflare confusion by clarifying: Phase 0-1 = Vercel, Phase 2+ = Cloudflare migration.

---

### C5. Observability — Structured from Day 1

**Gap:** `content-pipeline-infrastructure.md` lists "Console logs" for Phase 0-1 observability. No structured logging, no error tracking, no cost monitoring. At Phase 0 launch (Show HN), you'll have zero visibility into what's failing.

**Why it matters:** Show HN brings 5-15K visitors in hours. If the diagnostic breaks under load, unstructured console logs in Vercel's log viewer won't help diagnose the issue. You need to know: which scans failed, why, how much Firecrawl spend occurred, and what the P95 latency is.

**Proposed Design:**

```
Phase 0 Observability Stack (minimal, free/cheap):

1. Structured Logging
   - Use pino (already standard in Next.js ecosystem)
   - Every log entry includes: correlation_id, action, duration_ms, error?
   - Log to Vercel Runtime Logs (free, 1hr retention)
   - Upgrade path: Axiom free tier (500MB/mo) for persistent logs

2. Error Tracking
   - Sentry free tier (5K events/mo, 1 user)
   - Capture: unhandled exceptions, Firecrawl API errors, Supabase errors
   - Tag with: correlation_id, scan_id, url, phase (crawling|scoring)

3. Metrics (Lightweight)
   Track in Supabase (simple counters table or Vercel Analytics):
   - scans_total (per day)
   - scans_failed (per day, per error_code)
   - firecrawl_cost_cents (per day)
   - p95_scan_duration_ms (per day)
   - ingest_events_total (per day)
   - active_sites (total)

4. Cost Monitoring
   - After each Firecrawl API call: log cost estimate
   - Daily summary: total Firecrawl spend vs. budget
   - Alert (email) when daily spend > 80% of daily budget

5. Correlation ID Pattern
   - Generated at scan creation (UUID v4)
   - Passed through every function call, every log entry, every external API call
   - Stored in scan row for debugging
   - Returned in API responses as X-Correlation-Id header
```

**Where it fits:** Cross-cutting concern. Affects every API endpoint and the scan workflow. Add as a new section to `api-first.md` or create `docs/architecture/observability.md`.

---

### C6. Data Model Inconsistencies & Missing Schema

**Gap:** Multiple inconsistencies across documentation:
- `crawler_visits.site_id` is TEXT in `crawler-analytics.md` but UUID in `api-first.md`
- `scans` table has no state tracking columns
- No index for public score URL lookup (`GET /score/{domain}`)
- No `scan_checks` detail table — everything in a flat JSONB blob
- No data retention mechanism (90-day mention but no implementation)
- Score page requires latest COMPLETE scan per domain — no optimized query path

**Proposed Design:**

```sql
-- Reconciled and extended data model for Phase 0

-- Sites (unchanged from api-first.md, clarifying types)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  site_key TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clerk_user_id, domain)
);

-- Scans (extended with state machine + observability)
CREATE TABLE scans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending | crawling | scoring | complete | partial | failed
  scoring_version INT NOT NULL DEFAULT 1,
  ai_readiness_score INT,         -- nullable until scoring completes
  crawlability_score INT,
  agent_readiness_score INT,
  agent_interaction_score INT,
  eu_ai_act_passed INT,
  eu_ai_act JSONB,
  recommendations JSONB,
  schema_preview JSONB,
  checks_completed INT DEFAULT 0,
  checks_total INT DEFAULT 0,
  raw_html_size INT,
  markdown_size INT,
  error_code TEXT,
  error_message TEXT,
  firecrawl_cost_cents INT,
  crawl_started_at TIMESTAMPTZ,
  scoring_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for score page: latest complete scan per domain
CREATE INDEX idx_scans_domain_latest
  ON scans(domain, completed_at DESC)
  WHERE status IN ('complete', 'partial');

-- Index for scan status polling
CREATE UNIQUE INDEX idx_scans_correlation
  ON scans(correlation_id);

-- Crawler visits (reconciled: site_id is UUID, not TEXT)
CREATE TABLE crawler_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  bot TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawler_visits_site_bot
  ON crawler_visits(site_id, bot, visited_at);
CREATE INDEX idx_crawler_visits_site_path
  ON crawler_visits(site_id, path, visited_at);

-- Data retention: partition by month (Phase 1)
-- Phase 0: manual cleanup via cron or Supabase pg_cron
-- DELETE FROM crawler_visits WHERE created_at < NOW() - INTERVAL '90 days';

-- Subscribers (unchanged)
CREATE TABLE subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  domain TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_subscribers_email_domain
  ON subscribers(email, domain);
```

**Where it fits:** Replaces the data model section in `api-first.md`. Resolves type inconsistency with `crawler-analytics.md`.

---

### C7. Score Page Architecture — The Primary Growth Engine

**Gap:** Public score URLs (`crawlready.app/score/{domain}`) are identified as one of only two genuinely unique differentiators, but the architecture is completely undefined. No ISR strategy, no OG image generation, no stale score handling, no SEO optimization.

**Why it matters:** The score page is the viral loop. Every diagnostic produces a shareable URL. If it's slow, ugly, or not indexed by Google, the primary growth mechanism doesn't work.

**Proposed Design:**

```
Score Page Architecture:

Route: /score/[domain]/page.tsx (Next.js App Router)
Rendering: ISR (Incremental Static Regeneration)
  - Revalidate: 3600s (1 hour)
  - On-demand revalidation: triggered after new scan completes
  - Fallback: 'blocking' (first visit renders server-side, then cached)

Data Flow:
  Browser → Vercel Edge (cached ISR page)
    → Cache MISS → Server Component fetches latest scan from Supabase
    → Render score page with sub-scores, recommendations, CTA
    → Cache for 1 hour

OG Image Generation:
  Route: /api/og/score/[domain]
  Method: Vercel OG (@vercel/og, Satori-based)
  Content: Domain name + AI Readiness Score (large number) + color band
  Size: 1200x630 (standard OG)
  Caching: same ISR cadence as score page

Meta Tags:
  <title>{domain} AI Readiness Score: {score}/100 | CrawlReady</title>
  <meta name="description" content="{domain} scores {score}/100 for AI readiness.
    Crawlability: {c}, Agent Readiness: {ar}, Agent Interaction: {ai}." />
  <meta property="og:image" content="https://crawlready.app/api/og/score/{domain}" />
  <link rel="canonical" href="https://crawlready.app/score/{domain}" />

Score Freshness:
  - Display "Scanned {relative_time}" (e.g., "Scanned 2 hours ago")
  - If scan > 7 days old: show "This score may be outdated" banner + rescan CTA
  - If no scan exists: show "No scan available" + diagnostic CTA

Sitemap:
  - Dynamic sitemap at /sitemap-scores.xml
  - Includes all domains with complete scans
  - Priority: 0.7, changefreq: weekly
  - Submitted to Google Search Console

Structured Data (on score page itself):
  JSON-LD WebPage + Rating schema
  → Dogfooding CrawlReady's own Schema.org generation
```

**Where it fits:** New architectural component. Referenced in `scoring-algorithm.md` §Score URL and `api-first.md` §Future API Extensions but never specified.

---

## Important Gaps (Pre-Phase 1)

### I1. Multi-Tenancy & Row-Level Security

**Gap:** RLS mentioned in `api-first.md` ("Supabase RLS ensures tenant isolation") but no actual RLS policies are defined. The Clerk→Supabase integration pattern is unspecified.

**Proposed Design:**

```
Phase 0 Strategy: Service-role bypass with application-level isolation.

Why not RLS in Phase 0:
- Clerk JWTs need custom Supabase JWT verification config
- RLS adds complexity to every query
- All API routes run server-side (no direct Supabase client access)
- Application-level WHERE clauses are sufficient for Phase 0

Application-Level Isolation Pattern:
  Every database query that touches tenant data includes:
    WHERE clerk_user_id = {authenticated_user_id}
  Enforced via a repository pattern:
    siteRepository.getByDomain(clerkUserId, domain)
    scanRepository.getLatest(domain) // scans are public by design

Phase 1: Add RLS when dashboard expands:
  ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
  CREATE POLICY sites_user_read ON sites
    FOR SELECT USING (clerk_user_id = auth.jwt()->>'sub');
  CREATE POLICY sites_user_write ON sites
    FOR ALL USING (clerk_user_id = auth.jwt()->>'sub');
  -- scans: no RLS (public score pages need unauthenticated read)
  -- crawler_visits: RLS via site_id → sites.clerk_user_id join

Service-Role Bypass:
  Backend API routes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
  RLS protects against direct Supabase client access only.
```

---

### I2. Authentication Edge Cases & Site Key Lifecycle

**Gap:** Clerk for auth and site keys for ingest are defined, but: no key rotation, no key revocation, no compromised key response, no multi-user access.

**Proposed Design:**

```
Site Key Lifecycle:

Generation: On site registration via dashboard
  Format: cr_{random_24_chars} (as defined in analytics-onboarding.md)
  Storage: sites.site_key (unique, indexed)

Rotation:
  POST /api/v1/sites/{site_id}/rotate-key (authenticated, Clerk)
  → Generate new key
  → Old key remains valid for 24 hours (grace period for snippet update)
  → After 24h: old key rejected at ingest
  → Dashboard shows "Update your snippet" banner during grace period

Revocation (Compromised Key):
  POST /api/v1/sites/{site_id}/revoke-key (authenticated, Clerk)
  → Old key immediately invalid
  → New key generated
  → Dashboard shows urgent "Update your snippet" alert

Multi-User Access (Phase 1+):
  - Clerk Organizations feature
  - sites.clerk_org_id (nullable, for team access)
  - Defer until first customer requests it
```

---

### I3. Data Retention & Lifecycle Management

**Gap:** `crawler-analytics.md` mentions 90-day raw retention, but no mechanism exists. No retention policy for scans. No archival. No GDPR deletion workflow.

**Proposed Design:**

```
Retention Policies:

┌──────────────────────┬────────────────────────────┬──────────────────┐
│ Data                  │ Retention                   │ Mechanism         │
├──────────────────────┼────────────────────────────┼──────────────────┤
│ crawler_visits (raw)  │ 90 days                     │ pg_cron daily job │
│ crawler_visits (agg)  │ Indefinite (daily rollups)  │ Materialized view │
│ scans (complete)      │ 1 year                      │ pg_cron monthly   │
│ scans (latest/domain) │ Indefinite                  │ Preserved by job  │
│ sites                 │ Until user deletes          │ User action       │
│ subscribers           │ Until unsubscribe           │ User action       │
└──────────────────────┴────────────────────────────┴──────────────────┘

Phase 0 Implementation:
  Supabase pg_cron extension (free):
    SELECT cron.schedule('clean-crawler-visits', '0 3 * * *',
      $$DELETE FROM crawler_visits WHERE created_at < NOW() - INTERVAL '90 days'$$
    );

GDPR Data Deletion:
  DELETE /api/v1/sites/{site_id} (authenticated)
  → Cascade: crawler_visits, site_key
  → Scans by domain remain (public data, no PII)
  → Subscriber entry removed if email matches
```

---

### I4. Scoring Test Strategy — Golden Set

**Gap:** No testing strategy for the scoring algorithm. The rubrics in `scoring-detail.md` are complex with many edge cases. Scoring changes could silently break.

**Proposed Design:**

```
Golden Set Testing:

Fixtures: Static HTML files representing known site archetypes:
  1. pure-csr-spa.html         → Expected: Crawlability ~15, Agent Readiness ~30
  2. ssr-well-structured.html  → Expected: Crawlability ~85, Agent Readiness ~70
  3. ssr-noisy.html            → Expected: Crawlability ~60, Agent Readiness ~25
  4. docs-site-docusaurus.html → Expected: Crawlability ~90, Agent Readiness ~80
  5. saas-landing-mixed.html   → Expected: varies by section
  6. schema-rich.html          → Expected: high Agent Readiness
  7. aria-complete.html        → Expected: high Agent Interaction
  8. empty-shell.html          → Expected: all scores near 0

Test Runner:
  - Unit tests that feed HTML fixtures through the scoring pipeline
  - Assert scores within ±5 of expected values
  - Assert each individual check passes/fails as expected
  - Run on every PR that touches scoring code

Regression Prevention:
  - scoring_version in scans table tracks algorithm changes
  - Golden set tests must pass before version bump
  - Version bump requires updating expected scores if algorithm changes
```

---

### I5. API Versioning & Deprecation Policy

**Gap:** `/api/v1/` prefix exists but no strategy for breaking changes, deprecation timeline, or backward compatibility.

**Proposed Design:**

```
Versioning Strategy:

- URL-based: /api/v1/, /api/v2/ (already adopted)
- v1 guaranteed stable for 12 months after v2 ships
- Breaking changes = new version (field removal, type change, semantic change)
- Additive changes in-place (new optional fields, new endpoints)

Deprecation Timeline:
  1. Announce deprecation (response header: Sunset: {date})
  2. 3-month warning period (old version works, header warns)
  3. 6-month grace (old version still works)
  4. 12-month shutdown (old version returns 410 Gone)

Phase 0 Reality:
  - Only v1 exists. Don't over-engineer.
  - Document the policy in README/docs for future reference
  - Use typed response schemas (Zod) from day 1 to catch accidental breaking changes
```

---

### I6. CrawlProvider Abstraction Completeness

**Gap:** `crawling-provider.md` defines a `CrawlProvider` interface but it's missing health checks, cost tracking, rate limit awareness, and circuit breaker pattern.

**Proposed Design:**

```typescript
// Extended CrawlProvider interface

type CrawlProviderHealth = {
  status: 'healthy' | 'degraded' | 'down';
  latencyP50Ms: number;
  latencyP95Ms: number;
  errorRate: number; // 0.0-1.0 over last 5 minutes
};

type CrawlCostEstimate = {
  creditsCost: number;
  estimatedUsdCents: number;
};

type CrawlProvider = {
  // Core (existing)
  scrape: (url: string, options?: CrawlOptions) => Promise<CrawlResult>;

  // Health & Monitoring
  healthCheck: () => Promise<CrawlProviderHealth>;

  // Cost Awareness
  estimateCost: (options?: CrawlOptions) => CrawlCostEstimate;

  // Circuit Breaker (built into adapter)
  // - 5 failures in 60s → circuit OPEN (reject requests for 30s)
  // - After 30s → HALF-OPEN (allow 1 request)
  // - Success → CLOSED (resume normal)
};

// Implemented in FirecrawlProvider adapter
// MockProvider for tests returns static HTML fixtures
// DirectFetchProvider for bot-view (no JS rendering needed)
```

---

### I7. Ingest API Write Optimization

**Gap:** Individual INSERT per beacon works at Phase 0 scale but has no batching, no deduplication, and the `visited_at` comes from the client (trivially spoofable).

**Proposed Design:**

```
Phase 0 (simple, correct):
  - Individual INSERT per beacon (sufficient for hundreds of sites)
  - Server-side timestamp (ignore client 't' field for storage, keep for drift detection)
  - Dedup: ignore duplicate (site_id, path, bot) within 1-second window
    → Simple: ON CONFLICT DO NOTHING with partial unique index

Phase 1 (if scale demands):
  - Batch writes: collect beacons in memory (or Vercel KV), flush every 5s or 100 events
  - Move to Supabase pg_partman for monthly partitions
  - Consider Cloudflare Analytics Engine (free, unlimited writes, SQL-like queries)

Validation Hardening:
  - Reject if |client_timestamp - server_timestamp| > 300s (5 min, already specified)
  - Reject if path length > 2048 chars
  - Reject if bot not in known bot list
  - Normalize path (strip query params, fragments)
```

---

### I8. Security Hardening Checklist

**Gap:** No CORS policy, no CSP headers, no input sanitization strategy documented.

**Proposed Design:**

```
Phase 0 Security Checklist:

1. CORS Policy:
   /api/v1/scan      → same-origin only (no CORS)
   /api/v1/score/*   → same-origin only
   /api/v1/ingest    → Access-Control-Allow-Origin: * (beacons from any domain)
   /api/v1/subscribe → same-origin only

2. CSP Headers (Next.js middleware):
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
     https://js.clerk.dev; style-src 'self' 'unsafe-inline';
     img-src 'self' data: https:; connect-src 'self' https://api.clerk.dev
     https://*.supabase.co;

3. Input Validation (Zod schemas on every endpoint):
   - URL: valid URL format, HTTPS preferred, max 2048 chars
   - Domain: valid hostname, no IP addresses, no localhost
   - Email: RFC 5322 format, not in disposable domain list
   - Site key: exact format match (cr_ prefix + 24 alphanumeric)
   - Bot name: enum of known bots
   - Path: max 2048 chars, no null bytes

4. SQL Injection: Supabase client uses parameterized queries (safe by default)

5. Rate Limiting: see C2

6. Secrets: All API keys in Vercel environment variables, never in code

7. Dependency Security: npm audit in CI, Dependabot enabled (already in repo)
```

---

## Strategic Gaps (Long-Term Architecture)

### S1. Event Architecture — Foundation for Scale

**Gap:** The content pipeline describes event-driven workers, but no event catalog, schema, or bus is defined. Without this, Phase 2+ becomes a rewrite.

**Proposed Design:**

```
Event Catalog (Domain Events):

Scan Domain:
  scan.requested      { correlation_id, url, domain, source }
  scan.crawl.started  { correlation_id, provider }
  scan.crawl.completed { correlation_id, html_size, md_size, cost_cents }
  scan.crawl.failed   { correlation_id, error_code, retries }
  scan.scoring.started  { correlation_id }
  scan.scoring.completed { correlation_id, scores }
  scan.completed      { correlation_id, status, scores, url }

Analytics Domain:
  crawler_visit.received { site_id, path, bot, timestamp }
  crawler_visit.batch_flushed { site_id, count }

Site Domain:
  site.registered     { site_id, domain, clerk_user_id }
  site.key.rotated    { site_id }
  site.deleted        { site_id, domain }

Phase 0 Implementation:
  - Events are function calls (no bus needed)
  - Log events as structured log entries (pino)
  - This establishes the vocabulary for Phase 2's event bus

Phase 2 Migration:
  - Replace function calls with Cloudflare Queues or SQS
  - Event schema validated with Zod (already in use)
  - Add consumers: analytics aggregation, alerting, cost tracking
```

---

### S2. Phase 0→2 Migration Path — packages/core Isolation

**Gap:** Phase 0 is Vercel-native. Phase 2+ is Cloudflare Workers. No strategy for incremental migration. Risk: Phase 0 code becomes tightly coupled to Next.js/Vercel, requiring a rewrite.

**Proposed Design:**

```
Package Isolation Strategy:

packages/core/ (create in Phase 0)
  Purpose: Business logic with ZERO framework imports
  Contains:
    - Scoring algorithm (all 3 sub-scores + composite)
    - URL normalization
    - Bot detection patterns
    - Schema.org pattern detectors
    - Content extraction logic
    - Zod validation schemas (shared between API routes and edge)
  Does NOT contain:
    - Next.js imports
    - Vercel-specific APIs
    - Supabase client (injected via interface)
    - Clerk imports

packages/database/ (already exists)
  Purpose: Supabase client, queries, types
  Pattern: Repository interfaces + Supabase implementations

apps/web/ (existing Next.js app)
  Purpose: API routes, pages, UI components
  Imports: packages/core, packages/database

Future:
  apps/edge/ (Phase 2, Cloudflare Worker)
    Imports: packages/core (same scoring, same logic)
    Uses: Workers KV instead of Supabase for cache reads

Migration path:
  1. Phase 0: Build with packages/core from day 1
  2. Phase 1: packages/core is battle-tested, all business logic portable
  3. Phase 2: Create apps/edge/ importing packages/core
     → Edge worker for serving, Vercel for dashboard/API
  4. Phase 3: Vercel becomes dashboard-only, all serving on Cloudflare
```

---

### S3. Content Pipeline State Machine (Phase 2+)

**Gap:** The 4-stage pipeline (Extract → Schema → Render → Parity) has no per-page per-stage tracking. A pipeline failure at Stage 3 loses all Stage 1-2 work.

**Proposed Design:**

```
Pipeline State per Page:

page_pipeline_runs table:
  page_url, tenant_id, pipeline_version,
  stage1_status, stage1_output_ref,   -- content extraction
  stage2_status, stage2_output_ref,   -- schema generation
  stage3_status, stage3_output_ref,   -- output rendering
  stage4_status, stage4_parity_score, -- content parity
  started_at, completed_at

Resumability:
  - Each stage writes output to R2 (durable)
  - On failure: retry from last successful stage
  - On pipeline version upgrade: re-run from stage 1 using stored L2 HTML

Phase 0: Not needed (in-process pipeline, single function)
Phase 2: Implement when pipeline becomes event-driven workers
```

---

### S4. Cost Budget Enforcement System

**Gap:** Firecrawl is the dominant cost. No per-tenant budget tracking, no circuit breaker, no cost alerting beyond the rate limiter.

**Proposed Design:**

```
Cost Tracking Architecture:

Per-Scan:
  - After Firecrawl call: record estimated cost in scans.firecrawl_cost_cents
  - Log: { event: "firecrawl.cost", cents: N, url, correlation_id }

Per-Day Aggregate (Phase 0):
  - Simple: SUM(firecrawl_cost_cents) from scans WHERE created_at > today
  - Query on each scan request (cached 1 min)
  - Thresholds:
    - 80% daily budget → log warning
    - 100% daily budget → reject new free-tier scans, allow paid
    - 150% daily budget → reject all scans, alert founder

Per-Tenant (Phase 1, paid tier):
  - Track fresh_crawls_used this billing period
  - sites table: add crawls_used INT, crawls_limit INT, billing_period_start
  - On each crawl: increment crawls_used
  - At limit: return 402 Payment Required with upgrade CTA
```

---

### S5. Webhook Security

**Gap:** Customer deploy webhooks (`POST /api/v1/recache`) have no signature verification. Ingest uses site key only. No HMAC.

**Proposed Design:**

```
Webhook Signing (Phase 1, when recache endpoint ships):

Outbound (CrawlReady → Customer):
  Not applicable in Phase 0 (CrawlReady doesn't send webhooks)

Inbound (Customer → CrawlReady):
  POST /api/v1/recache
  Headers:
    X-CrawlReady-Signature: sha256={hmac_of_body_with_site_key}
    X-CrawlReady-Timestamp: {unix_seconds}

  Verification:
    1. Check timestamp within 5 minutes (prevent replay)
    2. Compute HMAC-SHA256(site_key, timestamp + "." + body)
    3. Compare with provided signature (constant-time comparison)

Phase 0: Not needed (recache is Phase 1+)
Document the pattern now so the ingest endpoint can adopt it later.
```

---

### S6. Scan Result URL Strategy — Permalink Design

**Gap:** Scans have auto-increment IDs. Score pages use domain-based paths. No mapping between individual scans and public URLs. No historical scan access.

**Proposed Design:**

```
URL Structure:

Public Score (latest):
  /score/{domain}
  → Always shows latest COMPLETE scan for domain
  → ISR cached, revalidated on new scan

Historical Scan (Phase 1):
  /score/{domain}/history/{scan_id}
  → Shows a specific scan result
  → Useful for "score over time" feature

Score Badge (embeddable):
  /badge/{domain}.svg
  → Dynamic SVG showing current score
  → Cache 1 hour

API Access:
  GET /api/v1/score/{domain}          → latest scan JSON
  GET /api/v1/score/{domain}/history  → list of past scans
  GET /api/v1/scan/{scan_id}          → specific scan JSON
```

---

### S7. Testing Architecture

**Gap:** No testing strategy beyond scoring golden set. No integration tests, no load tests, no E2E tests.

**Proposed Design:**

```
Testing Pyramid:

Unit Tests (packages/core):
  - Scoring algorithm: golden set (see I4)
  - URL normalization: edge cases (IDN, ports, fragments, encoding)
  - Bot detection: regex coverage for all known bots
  - Schema pattern detectors: fixture-based
  - Framework: vitest (already in monorepo ecosystem)

Integration Tests (apps/web):
  - API route tests with msw (Mock Service Worker)
  - Mock Firecrawl responses, assert scan workflow
  - Mock Supabase, assert correct queries
  - Framework: vitest + msw

E2E Tests (Phase 1):
  - Playwright browser tests
  - Test diagnostic flow: enter URL → see score
  - Test analytics onboarding: sign up → register site → copy snippet
  - Run in CI against preview deployments

Load Tests (pre-Show HN):
  - k6 or autocannon against preview deployment
  - Target: 50 concurrent scans, 1000 ingest events/s
  - Verify: no 5xx, P95 < 30s for scans, P95 < 200ms for ingest
```

---

### S8. Feature Flag System

**Gap:** No feature flags. Phase 0→1 transition will require rolling out features incrementally. Schema preview, analytics dashboard, and alerts all need controlled rollout.

**Proposed Design:**

```
Phase 0 (minimal):
  - Vercel Edge Config (free tier: 1 config, 100KB)
  - Simple JSON: { "schema_preview_enabled": true, "analytics_dashboard_enabled": false }
  - Read in middleware/server components
  - No per-user targeting needed in Phase 0

Phase 1 (if needed):
  - Vercel Feature Flags or LaunchDarkly free tier
  - Per-user targeting for beta features
  - Percentage rollouts for risky changes
```

---

### S9. Infrastructure Dependencies Map

**Gap:** No single document shows all external service dependencies, their SLAs, free tier limits, and cost at scale.

**Proposed Design:**

```
Phase 0 External Dependencies:

┌────────────────────┬────────────────┬───────────────────┬──────────────┐
│ Service             │ Free Tier       │ Phase 0 Needs      │ Phase 0 Cost │
├────────────────────┼────────────────┼───────────────────┼──────────────┤
│ Vercel (Pro)        │ N/A (Pro req'd) │ 60s fn, 100GB BW   │ $20/mo       │
│ Supabase (Free)     │ 500MB DB, 2 PJ  │ 4 tables, pg_cron  │ $0           │
│ Clerk (Free)        │ 10K MAU         │ Auth + Orgs later   │ $0           │
│ Firecrawl (Hobby)   │ 500 one-time    │ ~3K scans/mo        │ $16/mo       │
│ Upstash Redis (Free)│ 10K cmd/day     │ Rate limiting       │ $0           │
│ Sentry (Free)       │ 5K events/mo    │ Error tracking      │ $0           │
│ GitHub (Free)       │ Unlimited       │ CI/CD, repo         │ $0           │
├────────────────────┼────────────────┼───────────────────┼──────────────┤
│ TOTAL               │                 │                     │ ~$36/mo      │
└────────────────────┴────────────────┴───────────────────┴──────────────┘

SLA & Failover:
  - Firecrawl down → scans fail (no fallback in Phase 0)
  - Supabase down → entire app down (single DB dependency)
  - Clerk down → auth fails (users can't log in, but diagnostic still works if unauthenticated)
  - Vercel down → everything down (hosting)
  - Upstash down → rate limiting fails-open (allow all requests)
```

---

## Cross-Cutting Architectural Principles

These principles apply across all gaps and inform implementation decisions:

1. **Fail-open for reads, fail-closed for writes.** Rate limiter down → allow requests. Scoring check fails → show partial results. But: never write invalid data to the scan table.

2. **Correlation ID everywhere.** Every scan gets a UUID. It flows through every log, every API call, every error. This is the single most valuable debugging tool.

3. **packages/core is the moat.** Business logic in a framework-agnostic package from day 1. This is the only code that survives the Phase 2 platform migration intact.

4. **Cost awareness is a feature.** Track Firecrawl spend per scan, per day, per tenant. The budget circuit breaker prevents a Show HN spike from generating a $500 Firecrawl bill.

5. **Partial results > no results.** The diagnostic must always show something. A partial scan with 7/9 checks is infinitely better than a loading spinner that never resolves.

6. **Score pages are the product.** The viral loop depends on score pages being fast (ISR), shareable (OG images), and indexed (sitemap + structured data). Treat them as first-class infrastructure, not an afterthought.

---

## Analytics & Ingest Infrastructure (NEW — Comprehensive Design)

The existing gap analysis touched analytics/ingest only lightly (I7 write optimization, I2 site key lifecycle, I3 retention). This section provides the complete infrastructure design for the analytics and ingest subsystem — the second of CrawlReady's two core data planes (the first being the scan/scoring plane).

### A0. Detection Model — Dual Integration (Architectural Decision)

**Decision:** CrawlReady offers **two integration paths** for AI crawler analytics. Both feed into the same ingest pipeline (A1) and produce the same dashboard data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RECOMMENDED: Server-Side Middleware                                      │
│  ────────────────────────────────────                                     │
│  Accuracy: ★★★★★ (detects ALL known AI crawlers)                         │
│  Setup: Requires adding ~5 lines to server middleware                    │
│  Best for: Developers who can modify their server code                   │
│                                                                           │
│  The middleware reads User-Agent at the HTTP request level — before       │
│  any response is sent. This catches every bot, including those that       │
│  don't execute JS and don't fetch external resources.                     │
│                                                                           │
│  Dashboard messaging: "Full coverage — all AI crawlers detected"          │
├─────────────────────────────────────────────────────────────────────────┤
│  QUICK START: Client-Side Script Tag                                      │
│  ───────────────────────────────────                                      │
│  Accuracy: ★★★☆☆ (detects JS-rendering bots + image-fetching bots)       │
│  Setup: Copy-paste one <script> tag into HTML <head>                     │
│  Best for: Quick evaluation, non-technical users, static sites            │
│                                                                           │
│  A <script> tag + <noscript> tracking pixel. Lower coverage but           │
│  zero server-side changes. Natural upsell path to middleware.             │
│                                                                           │
│  Dashboard messaging: "Partial coverage — switch to middleware to         │
│  detect GPTBot, ClaudeBot, and all non-JS crawlers"                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Why both (not either/or):**
- **Different users, different capabilities.** A Next.js developer can add middleware in 2 minutes. A WordPress marketing team cannot. Both are paying customers.
- **Natural upsell funnel.** Script tag → sees some data → "Switch to middleware to catch GPTBot too" → higher engagement, stickier product.
- **Low maintenance cost.** Both paths converge into the identical shared processing pipeline (A1). The incremental code for the second path is ~30 lines.
- **Industry precedent.** Google Analytics (gtag.js + Measurement Protocol), Plausible (script + server proxy), Segment (analytics.js + server-side SDKs) — all offer both.

---

#### Path 1: Server-Side Middleware (Recommended)

**Customer integration:**

```typescript
// Next.js example — 5 lines in middleware.ts
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: 'YOUR_SITE_KEY', p: request.nextUrl.pathname, b: bot, t: Date.now(), v: 1 }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  return NextResponse.next();
}
```

Framework snippets provided for: Next.js, Express/Hono, Cloudflare Workers, generic JS runtime. (Existing snippets in `crawler-analytics.md` and `analytics-onboarding.md` remain valid.)

**Coverage:** 100% of known AI crawlers. Server-side UA detection is deterministic — if the bot sends a request, it's detected.

**Trade-off:** Requires server-side code change. Bot regex is hardcoded in customer code → snippet versioning problem (see A5 mitigation).

---

#### Path 2: Client-Side Script Tag (Quick Start)

**Customer integration (the entire setup):**

```html
<!-- CrawlReady AI Crawler Analytics — add to your HTML <head> -->
<script src="https://crawlready.app/c.js" data-key="cr_live_xxx" async></script>
<noscript>
  <img src="https://crawlready.app/t/cr_live_xxx" style="display:none" alt="" />
</noscript>
```

**How it works:**

```
Sub-Layer A: Client-Side JS (bots that render JavaScript)
  Bot visits page → fetches & executes c.js → checks navigator.userAgent
  If bot detected: POST /api/v1/ingest { s, p, b, t, v }
  If human: does NOTHING (zero ingest traffic from humans)
  Catches: Google-Extended, Bytespider, Applebot-Extended

Sub-Layer B: Tracking Pixel Fallback (bots that don't execute JS)
  Bot visits page → bot does NOT run JS → processes <noscript> → fetches <img>
  GET https://crawlready.app/t/cr_live_xxx
  CrawlReady server reads User-Agent + Referer headers
  If known bot: logs visit, returns 1x1 transparent GIF
  If human: returns GIF, does NOT log
  Catches: bots that fetch images but don't execute JS
  Note: <noscript> is ignored by JS-capable browsers → zero human impact
```

**Coverage:** Partial — depends on bot JS-rendering and image-fetching behavior.

**Advantages:**
- **Plug-and-play:** Copy-paste into `<head>`. No server-side changes.
- **CrawlReady controls bot list:** `c.js` hosted by CrawlReady. Bot regex updates reach all customers within 1 hour (CDN TTL). No snippet versioning problem.
- **Zero human traffic to ingest:** Script checks UA client-side.
- **Works on static sites:** GitHub Pages, Netlify, any HTML host.

---

#### Coverage Comparison

```
┌─────────────────────┬────────────────────────┬─────────────────────────┐
│ Bot                  │ Middleware (Path 1)     │ Script Tag (Path 2)      │
├─────────────────────┼────────────────────────┼─────────────────────────┤
│ GPTBot               │ ✓ Detected              │ △ Pixel only (if imgs)   │
│ ClaudeBot            │ ✓ Detected              │ △ Pixel only (if imgs)   │
│ PerplexityBot        │ ✓ Detected              │ △ Pixel only (if imgs)   │
│ OAI-SearchBot        │ ✓ Detected              │ △ Partial (JS or pixel)  │
│ Google-Extended      │ ✓ Detected              │ ✓ JS detection           │
│ Bytespider           │ ✓ Detected              │ ✓ JS detection           │
│ Applebot-Extended    │ ✓ Detected              │ ✓ JS detection           │
│ Meta-ExternalAgent   │ ✓ Detected              │ △ Partial (JS or pixel)  │
│ HTML-only bots       │ ✓ Detected              │ ✗ NOT detected           │
│ Human visitors       │ Not logged (UA filter)  │ Not logged (by design)   │
├─────────────────────┼────────────────────────┼─────────────────────────┤
│ ESTIMATED COVERAGE   │ ~100%                   │ ~60-80%                  │
└─────────────────────┴────────────────────────┴─────────────────────────┘
```

---

#### Onboarding Flow

```
1. User registers site → receives site_key
2. Dashboard shows TWO options:

   ┌───────────────────────────────────────────────────────────────┐
   │  Choose your integration method:                               │
   │                                                                │
   │  [★ Recommended] Server-Side Middleware                        │
   │  Detects ALL AI crawlers. Copy 5 lines into your middleware.  │
   │  → [Next.js] [Express] [Cloudflare] [Other]                  │
   │                                                                │
   │  [Quick Start] Script Tag                                      │
   │  Partial coverage. Copy 1 tag into your HTML <head>.          │
   │  → [Copy snippet]                                             │
   └───────────────────────────────────────────────────────────────┘

3. If user chose Script Tag:
   Dashboard shows: "Partial coverage — 3 of 10 known crawlers detected.
   Switch to middleware for full coverage." [How to upgrade →]

4. Dashboard tracks which integration method each site uses
   (source = 'middleware' | 'js' | 'pixel' in crawler_visits)
```

**Impact on existing docs (to be updated separately):**
- `crawler-analytics.md` — add dual-integration model, keep middleware snippets, add script tag section
- `analytics-onboarding.md` — update onboarding flow to show both options, add script tag snippet
- `api-first.md` — add tracking pixel endpoint (`GET /api/v1/t/{siteKey}`), add `GET /c.js`

---

### A1. Ingest Pipeline — End-to-End Processing Flow

**Gap:** `crawler-analytics.md` defines the beacon format and `POST /api/v1/ingest` response, but the internal processing pipeline is unspecified. With the dual-integration model (A0), there are now THREE ingest paths (middleware beacon, client-side JS beacon, and tracking pixel) that must all funnel into the same storage layer.

**Proposed Design:**

```
Three Ingest Paths → Shared Processing Pipeline:

Path A: Server-Side Middleware Beacon (Recommended — from A0 Path 1)
  POST /api/v1/ingest
  Body: { s: "cr_live_xxx", p: "/pricing", b: "GPTBot", t: 1712419200000, v: 1 }
  Source: Customer middleware (Next.js, Express, Cloudflare Workers, etc.)
  Data quality: HIGHEST (exact path, verified bot from server-side UA, full coverage)

Path B: Client-Side JS Beacon (Quick Start — from A0 Path 2, Sub-Layer A)
  POST /api/v1/ingest
  Body: { s: "cr_live_xxx", p: "/pricing", b: "GPTBot", t: 1712419200000, v: 1 }
  Source: c.js executing in bot's JS runtime
  Data quality: HIGH (exact pathname, identified bot, but only JS-rendering bots)

Path C: Tracking Pixel (Quick Start — from A0 Path 2, Sub-Layer B)
  GET /api/v1/t/{siteKey}
  Headers: User-Agent (bot identity), Referer (page path)
  Source: <noscript><img> tag fetched by non-JS bot
  Data quality: MEDIUM (path from Referer may be absent, UA needs server-side parsing)

All three paths converge into the Shared Processing Pipeline:

  ┌─────────────────────────────────────────────────────────────────┐
  │  Shared Processing Pipeline                                      │
  │  Target: < 50ms P95 end-to-end                                   │
  └─────────┬───────────────────────────────────────────────────────┘
            │
  Step 1: Normalize Input (< 1ms)
            │  Path A & B: Parse JSON body, Zod validate
            │  Path C: Extract site_key from URL, bot from UA header,
            │          path from Referer header (or "unknown")
            │  All produce: { site_key, path, bot, timestamp, source }
            │
  Step 2: Bot Validation (< 1ms)
            │  Path A & B: Check `b` field against server-side KnownBot enum
            │  Path C: Parse UA string, match against KnownBot regex patterns
            │  Reject silently (204 / 1x1 GIF) if no bot match
            │  Accept unknown bots with tag "unverified" (forward-compatibility)
            │
  Step 3: Timestamp Assignment (< 1ms)
            │  Path A & B: Validate client timestamp drift (|server - client| < 300s)
            │              Store server_time as visited_at, client_t as metadata
            │  Path C: Use server_time as visited_at (no client timestamp)
            │
  Step 4: Site Key Lookup (< 5ms, cached)
            │  Lookup site_key → site_id mapping (see A2 caching strategy)
            │  Reject silently if key not found
            │
  Step 5: Rate Limit Check (< 2ms)
            │  Sliding window: 100 req/s per site_key
            │  Phase 0: Upstash Redis @upstash/ratelimit
            │  If exceeded: reject 429 with Retry-After header
            │
  Step 6: Path Normalization (< 1ms)
            │  Strip query string (?...) and fragment (#...)
            │  Collapse consecutive slashes (/// → /)
            │  Truncate to 2048 chars
            │  If empty after normalization: set to "/"
            │
  Step 7: Deduplication (< 2ms)
            │  Same (site_id, path, bot) within 1-second window → skip
            │  Prevents double-counting (e.g. JS-rendering bot triggers both
            │  Path B + Path C, or middleware + script tag both installed)
            │  Phase 0: INSERT ON CONFLICT DO NOTHING
            │  Phase 1: Upstash Redis SET NX with 1s TTL
            │
  Step 8: Write to Supabase (< 30ms, async)
            │  INSERT INTO crawler_visits (site_id, path, bot, visited_at, source)
            │  source = 'middleware' | 'js' | 'pixel' — tracks integration method
            │  Fire-and-forget via waitUntil() → response returned BEFORE write
            │  On write failure: log error, do not retry (beacon data is low-value)
            │
  Step 9: Return Response (< 1ms)
            │  Path A & B: 204 No Content (empty body)
            │  Path C: 200 + 1x1 transparent GIF (43 bytes, Cache-Control: no-store)
            └
```

**The `c.js` Script (CrawlReady-hosted):**

```javascript
// https://crawlready.app/c.js (~400 bytes gzipped)
// CrawlReady controls this file — updates reach all customers instantly
(function () {
  const d = document.currentScript;
  if (!d) {
    return;
  }
  const k = d.getAttribute('data-key');
  if (!k) {
    return;
  }
  const ua = navigator.userAgent;
  const r = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;
  const m = ua.match(r);
  if (!m) {
    return;
  } // Human visitor → exit, zero network traffic
  const x = new XMLHttpRequest();
  x.open('POST', 'https://crawlready.app/api/v1/ingest');
  x.setRequestHeader('Content-Type', 'application/json');
  x.send(JSON.stringify({
    s: k,
    p: location.pathname,
    b: m[0],
    t: Date.now(),
    v: 1
  }));
})();
```

**Tracking Pixel Endpoint (NEW):**

```
GET /api/v1/t/{siteKey}

  Server-side processing:
    1. Extract site_key from URL path
    2. Read User-Agent header → parse for known bot
    3. Read Referer header → extract path (fallback: "unknown")
    4. If known bot: feed into shared pipeline (Step 4 onward)
    5. If human UA: skip logging
    6. Always return: 1x1 transparent GIF, 43 bytes
       Headers:
         Content-Type: image/gif
         Cache-Control: no-store
         Content-Length: 43
```

**Key design decisions:**
- **Silent rejection** for invalid site keys and unknown bots. Never reveal validation logic. Always 204 (Path A) or transparent GIF (Path B).
- **Server-side timestamp as source of truth.** Client timestamp (Path A only) used for drift detection.
- **Response before write.** Response returns immediately; DB write happens asynchronously via `waitUntil()`.
- **Dedup at 1-second granularity** also prevents double-counting when a JS-rendering bot triggers both Layer 1 and Layer 2.
- **`source` column** in `crawler_visits` tracks which layer detected the visit — useful for understanding detection coverage.
- **`c.js` caching:** Served with `Cache-Control: public, max-age=3600` (1 hour). Balances freshness (bot list updates reach customers within 1 hour) with CDN efficiency.

---

### A2. Site Key Lookup — Caching Strategy

**Gap:** Every ingest beacon requires resolving `site_key → site_id`. At 100 req/s per site, with 100 active sites, that's potentially 10,000 DB reads/s. No caching strategy defined.

**Proposed Design:**

```
Site Key Cache (3-layer, progressively faster):

Layer 1: In-Process LRU Cache (Phase 0)
  - Node.js Map with LRU eviction (100 entries)
  - TTL: 5 minutes
  - Hit rate: ~95%+ (most beacons come from the same small set of sites)
  - Cost: $0 (in-process memory)
  - Limitation: not shared across Vercel function instances
    → Each cold start rebuilds cache. Acceptable at Phase 0 scale.

Layer 2: Upstash Redis (Phase 1, shared across instances)
  - Key: sitekey:{site_key} → { site_id, tier, domain }
  - TTL: 15 minutes
  - SET on first lookup, GET on subsequent
  - Invalidation: on site deletion or key rotation → DELETE key
  - Cost: included in Upstash free tier (same Redis as rate limiter)

Layer 3: Supabase (source of truth)
  - SELECT id, domain, tier FROM sites WHERE site_key = $1
  - Only on cache miss (< 5% of requests)
  - Index: idx_sites_key (already defined)

Cache Invalidation Triggers:
  - Site deleted → purge from Redis + LRU
  - Site key rotated → purge old key, warm new key
  - Site tier changed → purge and refetch

Phase 0 Simplification:
  Just Layer 1 (in-process LRU) + Layer 3 (Supabase).
  No Redis for caching until Upstash is added for rate limiting.
  At Phase 0 scale (< 100 sites, < 1000 events/day), every beacon hitting
  Supabase directly is fine. The LRU is an optimization, not a requirement.
```

---

### A3. Analytics Data Aggregation & Query Strategy

**Gap:** The dashboard views in `crawler-analytics.md` require aggregated data: total visits by period, per-bot breakdown, top pages, sparkline charts, period-over-period comparisons. These are expensive queries against raw `crawler_visits`. No aggregation strategy exists.

**Why it matters:** At 500 sites × 1,000 visits/month = 500K rows in month one. A `GROUP BY bot, DATE_TRUNC('day', visited_at)` over 30 days of data for a single site is fine. But at Phase 1 scale (5,000 sites, 10M rows), these queries become multi-second without aggregation.

**Proposed Design:**

```
Phase 0: Real-Time Queries (sufficient for < 500K rows)

  Dashboard queries run directly against crawler_visits.
  Postgres handles this fine for the expected scale.

  Query patterns (all filtered by site_id):

  Overview:
    SELECT COUNT(*) AS total_visits,
           COUNT(DISTINCT path) AS unique_pages,
           COUNT(DISTINCT bot) AS active_crawlers
    FROM crawler_visits
    WHERE site_id = $1
      AND visited_at >= NOW() - INTERVAL '30 days';

  By Crawler:
    SELECT bot,
           COUNT(*) AS visits,
           COUNT(DISTINCT path) AS pages
    FROM crawler_visits
    WHERE site_id = $1
      AND visited_at >= NOW() - INTERVAL '30 days'
    GROUP BY bot
    ORDER BY visits DESC;

  Top Pages:
    SELECT path,
           COUNT(*) AS visits
    FROM crawler_visits
    WHERE site_id = $1
      AND visited_at >= NOW() - INTERVAL '30 days'
    GROUP BY path
    ORDER BY visits DESC
    LIMIT 20;

  Time Series (for sparklines, daily granularity):
    SELECT DATE_TRUNC('day', visited_at) AS day,
           COUNT(*) AS visits
    FROM crawler_visits
    WHERE site_id = $1
      AND visited_at >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day;

  Per-Bot Detail:
    SELECT path,
           COUNT(*) AS visits
    FROM crawler_visits
    WHERE site_id = $1
      AND bot = $2
      AND visited_at >= NOW() - INTERVAL '30 days'
    GROUP BY path
    ORDER BY visits DESC
    LIMIT 20;

Phase 1: Materialized Aggregates (when > 1M rows)

  Strategy: Daily rollup table + pg_cron job.

  CREATE TABLE crawler_visits_daily (
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    bot TEXT NOT NULL,
    path TEXT NOT NULL,
    day DATE NOT NULL,
    visit_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (site_id, bot, path, day)
  );

  -- pg_cron: run at 00:05 UTC daily
  INSERT INTO crawler_visits_daily (site_id, bot, path, day, visit_count)
  SELECT site_id, bot, path,
         DATE_TRUNC('day', visited_at)::DATE AS day,
         COUNT(*) AS visit_count
  FROM crawler_visits
  WHERE visited_at >= CURRENT_DATE - 1
    AND visited_at < CURRENT_DATE
  GROUP BY site_id, bot, path, day
  ON CONFLICT (site_id, bot, path, day)
  DO UPDATE SET visit_count = EXCLUDED.visit_count;

  Dashboard queries then read from crawler_visits_daily:
  - Sub-10ms for any period up to 365 days
  - Raw crawler_visits used only for "last hour" real-time view

Phase 2+: Consider Cloudflare Analytics Engine
  - Free, unlimited writes
  - SQL-like queries with automatic rollups
  - Move beacon writes here, keep Supabase for dashboard state
```

**Where it fits:** New data model table for Phase 1. Affects dashboard API endpoint query implementation.

---

### A4. Analytics API — Complete Endpoint Specification

**Gap:** Only `GET /api/v1/analytics/{siteId}` is defined in `api-first.md`, with a mock response. Missing: time range filtering, pagination, per-bot detail, time-series data, export, comparison periods. The dashboard UI in `crawler-analytics.md` implies query capabilities that have no corresponding API.

**Proposed Design:**

```
Analytics Endpoints (Phase 1, data accumulating in Phase 0):

All analytics endpoints require Clerk auth. User must own the site.

1. GET /api/v1/analytics/{siteId}/overview
   Purpose: Dashboard headline metrics
   Query params:
     ?period=7d|30d|90d (default: 30d)
   Response:
   {
     "site_id": "uuid",
     "domain": "example.com",
     "period": "30d",
     "total_visits": 5024,
     "unique_pages": 67,
     "active_crawlers": 5,
     "vs_previous_period": {
       "total_visits_change": 0.12,    // +12% vs prior 30d
       "unique_pages_change": -0.03
     }
   }

2. GET /api/v1/analytics/{siteId}/bots
   Purpose: Per-crawler breakdown
   Query params:
     ?period=7d|30d|90d
   Response:
   {
     "bots": [
       {
         "bot": "Google-Extended",
         "display_name": "Google AI",
         "visits": 2891,
         "pages": 67,
         "share": 0.58,
         "trend": "up"    // vs previous period
       }
     ]
   }

3. GET /api/v1/analytics/{siteId}/pages
   Purpose: Top crawled pages with pagination
   Query params:
     ?period=7d|30d|90d
     &bot=GPTBot              (optional: filter by bot)
     &limit=20&offset=0       (pagination)
   Response:
   {
     "pages": [
       { "path": "/docs/getting-started", "visits": 1247, "bots": 5 }
     ],
     "total": 67,
     "limit": 20,
     "offset": 0
   }

4. GET /api/v1/analytics/{siteId}/timeseries
   Purpose: Chart data for sparklines and trend graphs
   Query params:
     ?period=7d|30d|90d
     &bot=GPTBot              (optional: filter by bot)
     &granularity=hour|day    (default: day; hour only for 7d)
   Response:
   {
     "datapoints": [
       { "timestamp": "2026-04-01T00:00:00Z", "visits": 142 },
       { "timestamp": "2026-04-02T00:00:00Z", "visits": 168 }
     ],
     "granularity": "day"
   }

5. GET /api/v1/analytics/{siteId}/alerts
   Purpose: Actionable insights (cross-references crawler visits with scan data)
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
       },
       {
         "type": "new_crawler",
         "severity": "info",
         "bot": "Meta-ExternalAgent",
         "first_seen": "2026-04-15T10:00:00Z",
         "visits_7d": 23,
         "message": "New AI crawler detected: Meta-ExternalAgent (23 visits in 7 days)"
       },
       {
         "type": "traffic_spike",
         "severity": "warning",
         "bot": "ClaudeBot",
         "visits_today": 450,
         "visits_avg_daily": 45,
         "message": "ClaudeBot traffic is 10x above average today"
       }
     ]
   }

6. GET /api/v1/analytics/{siteId}/export
   Purpose: Data export (CSV or JSON)
   Query params:
     ?format=csv|json
     &period=7d|30d|90d
   Response:
     Content-Type: text/csv (or application/json)
     Content-Disposition: attachment; filename="crawlready-example.com-30d.csv"

7. GET /api/v1/sites/{siteId}  (MISSING from Phase 0 spec)
   Purpose: Get single site details including snippet + recent stats
   Auth: Clerk JWT
   Response:
   {
     "id": "uuid",
     "domain": "example.com",
     "site_key": "cr_live_a1b2c3d4e5f6",
     "tier": "free",
     "created_at": "2026-04-07T10:00:00Z",
     "visit_count_30d": 1247,
     "last_visit_at": "2026-04-20T14:30:00Z",
     "snippet": { ... }
   }
```

**Phase mapping:**
- Phase 0: `GET /api/v1/sites/{siteId}` (basic site detail, needed for dashboard)
- Phase 1: All analytics endpoints (overview, bots, pages, timeseries, alerts, export)

---

### A5. Bot List Management & Snippet Versioning

**Gap:** The bot detection regex must be kept current as new AI crawlers emerge. The two integration paths (A0) have different update characteristics:

```
Per-Integration-Path Bot List Update:

  Script Tag (Quick Start):
    SOLVED — CrawlReady hosts c.js. Bot list updates are a server-side
    deploy that reaches all customers within 1 hour (CDN TTL).
    Zero customer action required.

  Middleware (Recommended):
    UNSOLVED — Bot regex is hardcoded in customer-deployed code.
    When a new crawler appears, customers must update their snippet.
    Mitigation strategies below.

Bot Registry (packages/core — single source of truth):

  1. Canonical Bot List:
     Maintained in packages/core:
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

  2. Build Pipeline for c.js:
     c.js is BUILT from the bot registry, not hand-edited:
       - packages/core exports the bot list
       - Build step generates the regex for c.js from the list
       - Same list used by ingest server for validation
       - Single source of truth → no drift between c.js and server

  3. Adding a New Bot:
     Script Tag users:
       1. Add entry to packages/core bot registry
       2. Build pipeline regenerates c.js with updated regex
       3. Deploy to CDN
       4. Within 1 hour, all script tag customers detect the new bot
       → Zero customer action required

     Middleware users:
       1. Add entry to packages/core bot registry
       2. Deploy server (ingest now accepts the new bot)
       3. Dashboard shows: "New AI crawler detected: GrokBot.
          Update your middleware snippet to track it." [Copy updated regex]
       4. Email notification to middleware site owners (Phase 1)
       → Requires customer to update their middleware (manual step)

  4. Beacon Version Field:
     All beacons include a version: { ..., v: 1 }
     Version increments when the bot list changes.
     Server tracks latest beacon version per site.
     Dashboard shows:
       - Script tag: "Detecting 10/12 known bots" (stale CDN cache)
       - Middleware: "Your snippet is v1 (current is v3). Update to detect
         3 new crawlers." [Copy updated snippet]

  5. Public Bot List Endpoint (Phase 1):
     GET /api/v1/bots
     Returns the full bot registry with metadata.
     Used by: dashboard UI (bot colors, display names), MCP server,
              advanced middleware customers who want the raw list.

  6. Server-Side Validation:
     Ingest server validates `b` field against the same registry.
     Unknown bots: accepted with tag "unverified" (forward-compatibility
     for edge cases where customer sends a bot name we don't yet recognize).

  7. Long-Term Middleware Mitigation (Phase 2):
     Option A: npm package (@crawlready/detect) — npm update pulls new bots
     Option B: Middleware fetches bot list from GET /api/v1/bots on startup (cached 24h)
     Decision deferred to Phase 2 based on customer feedback.
```

---

### A6. Domain Verification & Ownership

**Gap:** `analytics-onboarding.md` explicitly states: "Different users CAN register the same domain." No domain ownership verification exists. A competitor or bad actor could register `stripe.com`, point a snippet at it with fake data, and pollute the analytics.

**Why it matters at Phase 0:** Low risk — the only data at stake is crawler visit counts, which are low-value per event. A bad actor gains nothing except fake data in their own dashboard. But at Phase 1 (alerts, upsell), fake data could trigger misleading recommendations.

**Proposed Design:**

```
Phase 0: No Verification (acceptable)
  - Registering a domain doesn't give access to anyone else's data
  - Each user sees only their own crawler_visits (filtered by their site_key)
  - Risk: a user registers a domain they don't own and sends fake beacons → only pollutes their own data
  - Acceptable because: the snippet runs on THEIR server, so if beacons arrive, they genuinely control the domain's server

Phase 1: Lightweight Verification (trust but verify)
  Option A: DNS TXT Record
    - After registration, show: "Add a TXT record: crawlready-verify=cr_live_a1b2c3d4e5f6"
    - Background job checks DNS within 72 hours
    - Unverified sites: data still collected, but dashboard shows "Unverified" badge
    - Verified sites: eligible for alerts, export, and cross-site features

  Option B: Meta Tag Verification
    - "Add <meta name='crawlready-verify' content='cr_live_a1b2c3d4e5f6'> to your homepage"
    - Server fetches homepage periodically and checks for tag
    - Simpler for users than DNS

  Recommendation: Option B for Phase 1 (lower friction). Add DNS as alternative for users who prefer it.

  Data Impact of Verification:
    - Verified: full analytics, alerts, export, public badge
    - Unverified: data collected, basic stats, no alerts, no export
    - This creates a soft incentive to verify without blocking the onboarding flow
```

---

### A7. Analytics Alert System Architecture

**Gap:** `crawler-analytics.md` shows alerts like "GPTBot visited /pricing 89 times but received an empty `<div>`." This requires joining crawler_visits with scan data. No architecture for how alerts are generated, when they run, or where the cross-referenced data lives.

**Proposed Design:**

```
Alert Generation Pipeline:

  Alert Types:
  ┌────────────────────────┬───────────────────────────────────────────┬─────────┐
  │ Type                    │ Trigger Logic                              │ Phase   │
  ├────────────────────────┼───────────────────────────────────────────┼─────────┤
  │ invisible_content       │ crawler_visits.path has scan with          │ Phase 1 │
  │                         │ crawlability_score < 30 AND visits > 10   │         │
  ├────────────────────────┼───────────────────────────────────────────┼─────────┤
  │ new_crawler             │ First occurrence of a bot for this site    │ Phase 1 │
  │                         │ in the last 7 days                        │         │
  ├────────────────────────┼───────────────────────────────────────────┼─────────┤
  │ traffic_spike           │ Today's visits for a bot > 5x the         │ Phase 1 │
  │                         │ trailing 7-day daily average               │         │
  ├────────────────────────┼───────────────────────────────────────────┼─────────┤
  │ no_recent_activity      │ No crawler visits in 7+ days for a site   │ Phase 1 │
  │                         │ that previously had traffic                │         │
  ├────────────────────────┼───────────────────────────────────────────┼─────────┤
  │ snippet_outdated        │ Beacon version < current server version   │ Phase 1 │
  ├────────────────────────┼───────────────────────────────────────────┼─────────┤
  │ score_change            │ New scan for domain shows score change    │ Phase 2 │
  │                         │ of ±10 or more from previous scan         │         │
  └────────────────────────┴───────────────────────────────────────────┴─────────┘

  Computation Strategy:
    Phase 1: On-demand (compute when dashboard API is called)
      - GET /api/v1/analytics/{siteId}/alerts runs alert queries at request time
      - Simple SQL joins: crawler_visits × scans (by domain + path)
      - Acceptable latency: < 500ms (small result sets per site)

    Phase 2: Background job (pg_cron daily)
      - Pre-compute alerts into an alerts table
      - Email notifications for critical alerts
      - Webhook notifications for integrations

  Data Model (Phase 2):
    CREATE TABLE site_alerts (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      alert_type TEXT NOT NULL,
      severity TEXT NOT NULL,  -- critical, warning, info
      payload JSONB NOT NULL,  -- type-specific alert data
      dismissed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

  invisible_content Alert — Detailed Query:
    SELECT cv.path, cv.bot, COUNT(*) AS visits, s.crawlability_score
    FROM crawler_visits cv
    JOIN LATERAL (
      SELECT crawlability_score FROM scans
      WHERE domain = (SELECT domain FROM sites WHERE id = cv.site_id)
        AND url LIKE '%' || cv.path
        AND status IN ('complete', 'partial')
      ORDER BY completed_at DESC LIMIT 1
    ) s ON TRUE
    WHERE cv.site_id = $1
      AND cv.visited_at >= NOW() - INTERVAL '30 days'
    GROUP BY cv.path, cv.bot, s.crawlability_score
    HAVING COUNT(*) > 10 AND s.crawlability_score < 30;
```

---

### A8. Multi-Site Analytics Overview

**Gap:** A user can register up to 10 sites. No cross-site dashboard, no aggregate view, no endpoint to see "all my sites at a glance."

**Proposed Design:**

```
Endpoint: GET /api/v1/analytics/overview
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
    },
    {
      "site_id": "uuid-2",
      "domain": "docs.example.com",
      "visits_30d": 7426,
      "active_crawlers": 4,
      "top_crawler": "GPTBot",
      "has_alerts": false,
      "alert_count": 0
    }
  ]
}

Phase: This is the default dashboard landing page for Phase 1.
Phase 0: /dashboard/sites list view is sufficient (site list + visit_count_30d).
```

---

### A9. Ingest Beacon Reliability & Idempotency

**Gap:** Snippets use fire-and-forget `fetch().catch(() => {})`. No retry, no acknowledgment. The `t` (timestamp) field is the only differentiator, but if a customer's middleware retries, the same event could be recorded twice. No idempotency mechanism.

**Proposed Design:**

```
Reliability Model: At-Most-Once Delivery (by design)

  Why at-most-once is correct for this use case:
  - Each beacon represents one AI crawler request
  - Individual events have low value — aggregates are what matter
  - At-most-once means: some events may be lost, none are duplicated
  - The alternative (at-least-once with dedup) adds latency and complexity
    for zero user-visible benefit

  Expected loss rate: < 1%
  Sources of loss:
    - Customer server network failure → beacon never sent
    - CrawlReady endpoint temporarily unavailable → beacon dropped
    - Vercel cold start timeout → beacon dropped
  Mitigation: None needed. 99%+ delivery is sufficient for analytics.

  Idempotency (Phase 0): Not implemented
  - The 1-second dedup window (A1, Step 7) prevents obvious duplicates
  - True idempotency (idempotency key per beacon) adds overhead with no benefit
  - If a customer middleware retries within 1 second → deduped
  - If a customer middleware retries after 1 second → recorded as separate visit
    → This is actually correct: if the bot hit the server twice, it IS two visits

  Beacon Acknowledgment (Phase 2 — only if customer requests it):
  - Optional response body: { "received": true, "event_id": "..." }
  - Requires opt-in header: X-CrawlReady-Ack: true
  - 99% of customers should use fire-and-forget (default)
```

---

### A10. Data Export Architecture

**Gap:** `crawler-analytics.md` states: "users can export their crawler visit data via API or CSV download." No endpoint or format defined.

**Proposed Design:**

```
Endpoint: GET /api/v1/analytics/{siteId}/export
Auth: Clerk JWT (site owner)
Query params:
  ?format=csv|json (default: csv)
  &period=7d|30d|90d|all (default: 30d)
  &bot=GPTBot (optional filter)

CSV Format:
  timestamp,path,bot
  2026-04-20T14:30:00Z,/pricing,GPTBot
  2026-04-20T14:31:12Z,/docs/api,ClaudeBot
  ...

JSON Format:
  { "events": [ { "timestamp": "...", "path": "...", "bot": "..." } ] }

Limits:
  - Max export: 100,000 rows (paginated if more)
  - Free tier: last 30 days only
  - Paid tier: full retention window

Implementation:
  - Stream response (don't buffer entire export in memory)
  - Use Supabase cursor-based pagination internally
  - Set Content-Disposition header for browser download

Phase: Phase 1 (once dashboard ships)
```

---

### A11. Hidden Backlink Injection Architecture

**Gap:** `crawler-analytics.md` describes injecting `<link rel="ai-analytics" href="crawlready.app/score/{domain}">` into responses for free-tier users. Previous designs placed this in client-side scripts or middleware — both add complexity to the customer's site and have coverage limitations.

**Decision:** The hidden backlink is injected in the **optimized AI page** that CrawlReady generates and serves to AI crawlers (Phase 2+ content pipeline). Not via client-side script. Not via middleware.

**Proposed Design:**

```
Injection via Optimized AI Page (CrawlReady-Controlled):

  CrawlReady's content pipeline generates an optimized version of the
  customer's pages for AI crawlers (see content-pipeline-infrastructure.md).
  For free-tier users, this optimized page includes the backlink:

  <link rel="ai-analytics" href="https://crawlready.app/score/{domain}" />

  Injected by CrawlReady's content pipeline during page generation.
  The customer never sees this tag — it's only in the AI-facing version.

Why this is the right place:
  - CrawlReady controls the optimized page entirely — no customer action
  - Works for ALL bots (every AI crawler receives the optimized page)
  - No framework-specific code needed
  - No client-side DOM manipulation or middleware response modification
  - Removal on upgrade is automatic (server-side tier check during generation)
  - Cannot be accidentally removed by the customer
  - Cannot be bypassed (customer doesn't control the optimized page content)

Removal:
  - Paid tier: content pipeline checks site tier during generation → skips backlink
  - Downgrade: next page regeneration re-includes the backlink
  - No customer-facing configuration needed

Tag format:
  <link rel="ai-analytics" href="https://crawlready.app/score/{domain}" />

  This tag is:
  - Invisible to human visitors (they see the original site, not the AI page)
  - Discoverable by all AI crawlers that receive the optimized page
  - A real, indexable backlink to CrawlReady's score pages
  - Useful for SEO (Google-Extended sees it) and AI citation graphs

Phase mapping:
  Phase 0-1: Not applicable (no content pipeline yet, no optimized AI pages)
  Phase 2: Injected automatically when content pipeline ships
  Note: The backlink is a natural part of the content pipeline — zero extra
        infrastructure needed. It's a single line added during page generation.
```

---

### A12. Complete Endpoint Inventory — Gap Audit

**Gap:** Endpoints are scattered across `api-first.md`, `analytics-onboarding.md`, `crawler-analytics.md`, and the gap analysis. No single source of truth. Several implied endpoints have no specification.

**Complete Inventory:**

```
Phase 0 Endpoints:
┌────────────────────────────────────┬────────┬──────────────────────────────┬────────────┐
│ Endpoint                            │ Auth    │ Purpose                       │ Spec Status │
├────────────────────────────────────┼────────┼──────────────────────────────┼────────────┤
│ POST /api/v1/scan                   │ None    │ Trigger diagnostic scan       │ ✓ Defined   │
│ GET  /api/v1/scan/{scanId}/status   │ None    │ Poll scan progress            │ ✗ MISSING   │
│ GET  /api/v1/score/{domain}         │ None    │ Latest score for domain       │ ✓ Defined   │
│ POST /api/v1/ingest                 │ SiteKey │ JS beacon (Layer 1, from c.js)│ ✓ Updated   │
│ GET  /api/v1/t/{siteKey}            │ None    │ Tracking pixel (Layer 2)      │ ✗ NEW (A0)  │
│ GET  /c.js                          │ None    │ Client-side detection script   │ ✗ NEW (A0)  │
│ POST /api/v1/subscribe              │ None    │ Email capture                 │ ✓ Defined   │
│ POST /api/v1/sites                  │ Clerk   │ Register a site               │ ✓ Defined   │
│ GET  /api/v1/sites                  │ Clerk   │ List user's sites             │ ✓ Defined   │
│ GET  /api/v1/sites/{siteId}         │ Clerk   │ Single site details           │ ✗ MISSING   │
│ DELETE /api/v1/sites/{siteId}       │ Clerk   │ Remove site                   │ ✓ Defined   │
└────────────────────────────────────┴────────┴──────────────────────────────┴────────────┘

Phase 1 Endpoints:
┌────────────────────────────────────────────┬────────┬──────────────────────────┬────────────┐
│ Endpoint                                    │ Auth    │ Purpose                   │ Spec Status │
├────────────────────────────────────────────┼────────┼──────────────────────────┼────────────┤
│ GET  /api/v1/analytics/{siteId}/overview    │ Clerk   │ Dashboard headline stats  │ ✗ NEW (A4)  │
│ GET  /api/v1/analytics/{siteId}/bots        │ Clerk   │ Per-crawler breakdown     │ ✗ NEW (A4)  │
│ GET  /api/v1/analytics/{siteId}/pages       │ Clerk   │ Top pages + pagination    │ ✗ NEW (A4)  │
│ GET  /api/v1/analytics/{siteId}/timeseries  │ Clerk   │ Chart data                │ ✗ NEW (A4)  │
│ GET  /api/v1/analytics/{siteId}/alerts      │ Clerk   │ Actionable insights       │ ✗ NEW (A4)  │
│ GET  /api/v1/analytics/{siteId}/export      │ Clerk   │ CSV/JSON export           │ ✗ NEW (A10) │
│ GET  /api/v1/analytics/overview             │ Clerk   │ Cross-site summary        │ ✗ NEW (A8)  │
│ POST /api/v1/sites/{siteId}/rotate-key      │ Clerk   │ Rotate site key           │ ✗ NEW (I2)  │
│ POST /api/v1/sites/{siteId}/revoke-key      │ Clerk   │ Revoke compromised key    │ ✗ NEW (I2)  │
│ PATCH /api/v1/sites/{siteId}                │ Clerk   │ Update site settings      │ ✗ MISSING   │
│ GET  /api/v1/diff/{domain}                  │ None    │ Visual diff data          │ ✓ Defined   │
│ GET  /api/v1/recommend/{domain}             │ None    │ Recommendations           │ ✓ Defined   │
│ GET  /api/v1/badge/{domain}.svg             │ None    │ Embeddable badge          │ ✓ Defined   │
│ GET  /api/v1/bots                           │ None    │ Known bot list + metadata │ ✗ NEW (A5)  │
│ GET  /api/v1/score/{domain}/history         │ None    │ Past scans list           │ ✗ NEW (S6)  │
│ GET  /api/v1/scan/{scanId}                  │ None    │ Specific scan result      │ ✗ NEW (S6)  │
└────────────────────────────────────────────┴────────┴──────────────────────────┴────────────┘

Phase 2 Endpoints:
┌────────────────────────────────────┬────────┬──────────────────────────┬────────────┐
│ Endpoint                            │ Auth    │ Purpose                   │ Spec Status │
├────────────────────────────────────┼────────┼──────────────────────────┼────────────┤
│ POST /api/v1/optimize               │ Clerk   │ Trigger optimization      │ ✓ Defined   │
│ POST /api/v1/recache/{url}          │ HMAC    │ Webhook cache refresh     │ ✓ Defined   │
│ GET  /api/v1/sites/{siteId}/usage   │ Clerk   │ Crawl budget usage        │ ✗ MISSING   │
└────────────────────────────────────┴────────┴──────────────────────────┴────────────┘

Missing Phase 0 Endpoints to Design Now:

  GET /api/v1/scan/{scanId}/status
    Purpose: Client polls for async scan completion (from C1 state machine)
    Response:
    {
      "scan_id": 123,
      "correlation_id": "uuid",
      "status": "crawling",       // pending|crawling|scoring|complete|partial|failed
      "progress_pct": 45,
      "checks_completed": 2,
      "checks_total": 9,
      "eta_seconds": 8
    }
    Rate: poll every 2 seconds, max 30 polls (60s timeout on client)

  GET /api/v1/sites/{siteId}
    Purpose: Single site detail (needed for site management dashboard)
    Response:
    {
      "id": "uuid",
      "domain": "example.com",
      "site_key": "cr_live_a1b2c3d4e5f6",
      "tier": "free",
      "created_at": "2026-04-07T10:00:00Z",
      "visit_count_30d": 1247,
      "last_visit_at": "2026-04-20T14:30:00Z",
      "snippet": "<script src=\"https://crawlready.app/c.js\" data-key=\"cr_live_a1b2c3d4e5f6\" async></script>\n<noscript><img src=\"https://crawlready.app/t/cr_live_a1b2c3d4e5f6\" style=\"display:none\" alt=\"\" /></noscript>"
    }

  GET /api/v1/t/{siteKey}
    Purpose: Tracking pixel endpoint for non-JS bots (Layer 2)
    See A0/A1 for full processing pipeline
    Response: 1x1 transparent GIF (43 bytes)
    Headers: Content-Type: image/gif, Cache-Control: no-store

  GET /c.js
    Purpose: Client-side bot detection script (Layer 1)
    See A0/A1 for script contents and build pipeline
    Response: ~400 bytes gzipped JavaScript
    Headers: Content-Type: application/javascript,
             Cache-Control: public, max-age=3600
    Served via Vercel edge or CDN.
```

---

### A13. Analytics Data Flow — Complete System Diagram

```
Customer's Website (HTML <head>)     CrawlReady (Vercel)                      Supabase
┌──────────────────────────┐        ┌──────────────────────────────────┐     ┌──────────┐
│ <script src="c.js"        │        │                                  │     │          │
│   data-key="cr_live_xxx"> │        │  GET /c.js (CDN-cached, 1hr)     │     │          │
│ <noscript>                │        │    → Returns bot detection script │     │          │
│   <img src="/t/KEY" />    │        │                                  │     │          │
│ </noscript>               │        │                                  │     │          │
└──────────┬───────────────┘        │                                  │     │          │
           │                         │                                  │     │          │
  AI Bot visits page                 │                                  │     │          │
           │                         │                                  │     │          │
  ┌────────┴────────┐                │                                  │     │          │
  │ Bot renders JS? │                │                                  │     │          │
  └──┬──────────┬───┘                │                                  │     │          │
     │Yes       │No                  │                                  │     │          │
     ▼          ▼                    │                                  │     │          │
  Layer 1    Layer 2                 │                                  │     │          │
  c.js runs  <img> fetched           │                                  │     │          │
     │          │                    │                                  │     │          │
     │  POST /api/v1/ingest          │  Shared Processing Pipeline      │     │          │
     │──────────────────────────────▶│    ├─ Normalize input            │     │          │
     │  {s,p,b,t,v}                  │    ├─ Validate bot               │     │          │
     │                               │    ├─ Lookup site_key (cached) ──│────▶│  sites   │
     │  GET /api/v1/t/{key}          │    ├─ Rate limit (Upstash) ──────│──▶Redis       │
     │──────────────────────────────▶│    ├─ Normalize path             │     │          │
     │  (UA + Referer headers)       │    ├─ Dedup check                │     │          │
                                     │    ├─ Return 204 / 1x1 GIF      │     │          │
                                     │    └─ waitUntil: INSERT ─────────│────▶│ crawler_ │
                                     │                                  │     │ visits   │
                                     │  Dashboard (Phase 1)             │     │          │
                                     │    │                             │     │          │
   Site Owner's Browser              │    ├─ GET /analytics/{id}/overview│    │          │
┌──────────────────┐                 │    │   → SELECT COUNT(*) ────────│────▶│ crawler_ │
│  Dashboard UI     │◀───────────────│    │     FROM crawler_visits     │     │ visits   │
│  - charts         │   JSON API     │    │                             │     │          │
│  - top pages      │                │    ├─ GET /analytics/{id}/alerts │     │          │
│  - alerts         │                │    │   → JOIN crawler_visits ────│────▶│ scans    │
│  - export         │                │    │     WITH scans by domain    │     │          │
└──────────────────┘                 │    │                             │     │          │
                                     │    └─ GET /analytics/{id}/export │     │          │
                                     │       → Stream CSV ──────────────│────▶│ crawler_ │
                                     │                                  │     │ visits   │
                                     └──────────────────────────────────┘     └──────────┘
```

---

### A14. Analytics Infrastructure Scaling Triggers

**Gap:** No defined thresholds for when to evolve from Phase 0 simple architecture to Phase 1/2 optimized architecture.

```
Scaling Decision Matrix:

┌──────────────────────┬──────────────┬─────────────────┬───────────────────────┐
│ Metric                │ Phase 0 OK    │ Trigger Phase 1  │ Trigger Phase 2       │
├──────────────────────┼──────────────┼─────────────────┼───────────────────────┤
│ Total crawler_visits  │ < 500K rows   │ > 1M rows        │ > 50M rows            │
│ rows                  │              │                  │                        │
├──────────────────────┼──────────────┼─────────────────┼───────────────────────┤
│ Ingest req/s          │ < 50 req/s    │ > 200 req/s      │ > 5,000 req/s         │
│ (sustained)           │              │                  │                        │
├──────────────────────┼──────────────┼─────────────────┼───────────────────────┤
│ Dashboard query P95   │ < 200ms       │ > 500ms          │ > 2s                  │
│                       │              │ → Add daily       │ → Cloudflare Analytics │
│                       │              │   rollup table    │   Engine               │
├──────────────────────┼──────────────┼─────────────────┼───────────────────────┤
│ Active sites          │ < 500         │ > 2,000          │ > 20,000              │
│                       │              │ → Redis for       │ → Dedicated ingest     │
│                       │              │   site key cache  │   service              │
├──────────────────────┼──────────────┼─────────────────┼───────────────────────┤
│ Supabase DB size      │ < 400MB       │ > 400MB          │ N/A (migrated)        │
│ (free tier = 500MB)   │              │ → Upgrade to Pro  │                        │
│                       │              │   or add retention│                        │
└──────────────────────┴──────────────┴─────────────────┴───────────────────────┘

Phase 0 → Phase 1 Migration Steps:
  1. Add crawler_visits_daily rollup table + pg_cron job
  2. Move site_key cache to Upstash Redis (shared across Vercel instances)
  3. Add data retention (90-day raw, indefinite rollups)
  4. Shard indexes by adding monthly partitioning

Phase 1 → Phase 2 Migration Steps:
  1. Move beacon writes to Cloudflare Analytics Engine (unlimited free writes)
  2. Keep Supabase for dashboard state, alerts, site management
  3. Extract ingest into standalone Cloudflare Worker (global edge, < 10ms)
  4. Move rollup computation to Cloudflare Cron Triggers
```

---

## Implementation Priority

### Scan & Scoring Plane (C/I/S gaps)

| Priority | Gap | Effort | When |
|---|---|---|---|
| P0 | C1: Scan state machine | 2 days | Before any scan code |
| P0 | C2: Rate limiting (Layer 1 + 2) | 1 day | Before Show HN |
| P0 | C4: Deployment architecture | 1 day | Before first deploy |
| P0 | C6: Data model reconciliation | 0.5 day | Before migration creation |
| P0 | C5: Observability (structured logging + Sentry) | 1 day | With first API route |
| P0 | C3: Partial failure handling | 1 day | With scoring implementation |
| P0 | C7: Score page ISR + OG | 2 days | With diagnostic UI |
| P1 | I4: Scoring golden set tests | 1 day | Before scoring code freeze |
| P1 | I8: Security hardening | 0.5 day | Before Show HN |
| P1 | I6: CrawlProvider extension | 0.5 day | With Firecrawl adapter |
| P1 | I1: RLS preparation | 0.5 day | With site management |
| P1 | I5: API versioning policy | 0.5 day | Documentation only |
| P2 | S1-S9: Strategic gaps | Ongoing | Design now, build incrementally |

### Analytics & Ingest Plane (A gaps)

| Priority | Gap | Effort | When |
|---|---|---|---|
| P0 | A1: Ingest pipeline (end-to-end processing) | 1.5 days | With ingest endpoint |
| P0 | A2: Site key lookup caching (in-process LRU) | 0.5 day | With ingest endpoint |
| P0 | A12: Missing Phase 0 endpoints (scan status, site detail) | 1 day | With site management UI |
| P0 | A5: Bot registry in packages/core + snippet version field | 0.5 day | Before snippet templates |
| P1 | A3: Analytics data aggregation (daily rollup table) | 1 day | With dashboard build |
| P1 | A4: Analytics API endpoints (overview, bots, pages, timeseries) | 2 days | With dashboard build |
| P1 | A7: Alert system (on-demand computation) | 1.5 days | After dashboard MVP |
| P1 | A8: Multi-site analytics overview | 0.5 day | With dashboard build |
| P1 | A10: Data export (CSV/JSON) | 0.5 day | With dashboard build |
| P1 | A11: Hidden backlink injection (Next.js component) | 0.5 day | After beacon stabilizes |
| P1 | I2: Site key rotation + revocation | 0.5 day | With site management |
| P1 | I3: Data retention cron | 0.5 day | Post-launch |
| P1 | I7: Ingest write optimization (batching) | 0.5 day | If scale demands |
| P1 | A6: Domain verification (meta tag) | 1 day | Before alerts ship |
| P2 | A9: Beacon reliability (acknowledgment opt-in) | 0.5 day | Only if requested |
| P2 | A14: Analytics scaling (Cloudflare Analytics Engine) | 2 days | When triggers hit |

**Phase 0 critical path — Scan plane: ~8.5 days**
**Phase 0 critical path — Analytics plane: ~3.5 days**
**Phase 0 total: ~12 days**

---

## Decisions

### Scan & Scoring Plane

- **Scan state machine:** PENDING → CRAWLING → SCORING → COMPLETE | PARTIAL | FAILED. Stored in scans table. Polled by client.
- **Rate limiting:** 3-layer (edge + Upstash Redis + budget circuit breaker). Upstash free tier for Phase 0.
- **Partial failures:** Always show partial results. Only fail scan if rendered view or bot view fails.
- **Deployment:** Vercel-only for Phase 0-1. Cloudflare migration starts Phase 2. Environments: production + preview per PR.
- **Observability:** Pino structured logging + Sentry free tier from day 1. Correlation ID on every scan.
- **Data model:** Reconciled type inconsistencies. Added state columns to scans. Added composite indexes for score page queries.
- **Score pages:** ISR with 1hr revalidation. Vercel OG for dynamic social images. Sitemap for SEO.
- **packages/core:** Create from day 1. Zero framework imports. All scoring, normalization, detection logic lives here.
- **Testing:** Golden set fixtures for scoring. vitest for unit/integration. Playwright E2E in Phase 1.
- **Cost tracking:** Per-scan Firecrawl cost in DB. Daily budget circuit breaker. Alert at 80%.

### Analytics & Ingest Plane

- **Detection model (A0) — Dual integration:** Two paths, both feeding into the same pipeline. (1) **Middleware (recommended):** ~5 lines of server-side code, 100% bot coverage, best accuracy. (2) **Script tag (quick start):** copy-paste `<script>` + `<noscript>` into HTML `<head>`, ~60-80% coverage, zero server-side changes. Keeping both is deliberate — different user segments, natural upsell funnel, low incremental maintenance cost. Industry precedent (GA, Plausible, Segment).
- **Customer onboarding:** Dashboard presents both options with clear trade-offs. Middleware labeled "★ Recommended" with framework-specific tabs (Next.js, Express, Cloudflare, Other). Script tag labeled "Quick Start" with one-click copy. Dashboard tracks integration method per site and nudges script tag users to upgrade.
- **Ingest pipeline (A1):** Three paths (middleware POST, c.js POST, tracking pixel GET) → shared 9-step processing pipeline with < 50ms P95 target. Silent rejection for invalid keys/bots. Server-side timestamp as source of truth. Response before DB write via `waitUntil()`. `source` column = 'middleware' | 'js' | 'pixel' in `crawler_visits`.
- **Tracking pixel endpoint:** `GET /api/v1/t/{siteKey}` — returns 1×1 transparent GIF (43 bytes). Bot detection via `User-Agent` header, page path via `Referer` header. `Cache-Control: no-store`. Only for script tag Path 2.
- **`c.js` serving:** `GET /c.js` — ~400 bytes gzipped. Served via CDN with 1-hour TTL. Bot list updates reach script tag customers within 1 hour. Built from `packages/core` bot registry.
- **Site key caching (A2):** Phase 0 = in-process LRU (100 entries, 5-min TTL) + Supabase fallback. Phase 1 = add Upstash Redis shared layer. Cache invalidated on site deletion, key rotation, tier change.
- **Aggregation strategy (A3):** Phase 0 = real-time queries against raw `crawler_visits` (sufficient for < 500K rows). Phase 1 = daily rollup table (`crawler_visits_daily`) via pg_cron. Phase 2 = Cloudflare Analytics Engine.
- **Analytics API (A4):** Split into 6 focused endpoints (overview, bots, pages, timeseries, alerts, export) instead of a single monolithic `/analytics/{siteId}` response. All require Clerk auth + site ownership.
- **Bot list management (A5):** `KnownBot` registry in `packages/core` with metadata. Script tag users: auto-updated via c.js CDN (solved). Middleware users: dashboard notification + copy-updated-regex (mitigated). Phase 2: npm package or API-based bot list for middleware users.
- **Domain verification (A6):** Phase 0 = no verification (acceptable). Phase 1 = meta tag verification. Verified/unverified feature gating.
- **Alert system (A7):** Phase 1 = on-demand computation at API call time (joins `crawler_visits` × `scans`). 6 alert types: invisible_content, new_crawler, traffic_spike, no_recent_activity, snippet_outdated, score_change. Phase 2 = pre-computed alerts table + email notifications.
- **Multi-site overview (A8):** Phase 1 endpoint aggregates all user's sites with visit counts, top crawler, alert counts. Phase 0 = `/dashboard/sites` list view is sufficient.
- **Beacon reliability (A9):** At-most-once delivery by design. Expected loss rate < 1%. 1-second dedup window prevents double-counting across paths.
- **Data export (A10):** Phase 1 CSV/JSON streaming export. Max 100K rows per export. Free tier limited to 30 days.
- **Hidden backlink (A11):** Injected in the **optimized AI page** generated by CrawlReady's content pipeline (Phase 2). NOT via client-side script, NOT via middleware. CrawlReady controls the optimized page entirely — backlink added during generation for free-tier users, omitted for paid tiers. Works for ALL bots. Zero customer action. Cannot be bypassed.
- **Scaling triggers (A14):** Documented thresholds for when to add rollup table (> 1M rows), Redis cache (> 2K sites), Cloudflare Analytics Engine (> 50M rows). No premature optimization.

### Docs Requiring Update (from A0 decision)

- `crawler-analytics.md` — add dual-integration model alongside existing middleware snippets, add script tag section, update hidden backlink section to reference content pipeline
- `analytics-onboarding.md` — update onboarding flow to present both integration options, add script tag snippet alongside middleware snippets
- `api-first.md` — add `GET /api/v1/t/{siteKey}` and `GET /c.js` endpoints, update ingest description
