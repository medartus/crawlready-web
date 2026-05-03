# Architecture: Infrastructure Overview

The unified reference for CrawlReady's infrastructure — how every component connects, what runs where, and why. Integrates all findings from the [gap analysis](./architectural-gap-analysis.md) into a single operational picture.

**Audience:** Engineers building Phase 0, architects reviewing design decisions.
**Scope:** Infrastructure topology, cross-cutting concerns, deployment, dependencies, and migration paths. Not scoring rubrics (see `scoring-detail.md`), not content pipeline transforms (see `content-pipeline-infrastructure.md`).

---

## Phase 0 System Topology

```
                          ┌─────────────────────────────────────────────────────────────┐
                          │                        INTERNET                               │
                          │                                                               │
                          │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
                          │  │ Anonymous     │  │ Clerk-Authed │  │ Customer Server  │   │
                          │  │ User          │  │ User         │  │ (middleware or   │   │
                          │  │ (diagnostic)  │  │ (dashboard)  │  │  script tag)     │   │
                          │  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
                          └─────────┼──────────────────┼──────────────────┼──────────────┘
                                    │                  │                  │
                                    ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL PLATFORM (crawlready.app)                             │
│                                                                                           │
│  ┌─────────────────────────┐                                                             │
│  │     EDGE MIDDLEWARE      │  Runs at edge before any route                              │
│  │  ┌───────────────────┐  │                                                             │
│  │  │ Rate Limiter       │  │  IP-based sliding window (Upstash Redis)                   │
│  │  │ Bot Detector       │  │  UA pattern match for tracking pixel/c.js analytics        │
│  │  │ Correlation ID     │  │  Generates UUID per request, propagated to all layers      │
│  │  │ Feature Flags      │  │  Vercel Edge Config reads                                  │
│  │  └───────────────────┘  │                                                             │
│  └──────────┬──────────────┘                                                             │
│             │                                                                             │
│             ▼                                                                             │
│  ┌──────────────────────────────────────────────────────────────┐                        │
│  │                    TWO DATA PLANES                            │                        │
│  │                                                               │                        │
│  │  ╔═══════════════════════════╗  ╔════════════════════════╗   │                        │
│  │  ║     SCAN & SCORING        ║  ║  ANALYTICS & INGEST    ║   │                        │
│  │  ║     PLANE                 ║  ║  PLANE                 ║   │                        │
│  │  ║                           ║  ║                        ║   │                        │
│  │  ║  POST /api/v1/scan        ║  ║  POST /api/v1/ingest   ║   │                        │
│  │  ║  GET  /api/v1/scan/{id}/  ║  ║  GET  /api/v1/t/{key}  ║   │                        │
│  │  ║       status              ║  ║  GET  /c.js             ║   │                        │
│  │  ║  GET  /api/v1/score/      ║  ║  POST /api/v1/sites    ║   │                        │
│  │  ║       {domain}            ║  ║  GET  /api/v1/sites     ║   │                        │
│  │  ║  POST /api/v1/subscribe   ║  ║  GET  /api/v1/sites/   ║   │                        │
│  │  ║                           ║  ║       {siteId}          ║   │                        │
│  │  ║  → Firecrawl API calls    ║  ║  DELETE /api/v1/sites/  ║   │                        │
│  │  ║  → Scoring pipeline       ║  ║       {siteId}          ║   │                        │
│  │  ║  → Score page generation  ║  ║                        ║   │                        │
│  │  ║                           ║  ║  → Beacon processing    ║   │                        │
│  │  ║  See: scan-workflow.md    ║  ║  → Site key validation  ║   │                        │
│  │  ╚═══════════════════════════╝  ║  → Bot detection        ║   │                        │
│  │                                  ║                        ║   │                        │
│  │                                  ║  See: analytics-       ║   │                        │
│  │                                  ║  infrastructure.md     ║   │                        │
│  │                                  ╚════════════════════════╝   │                        │
│  └──────────────────────────────────────────────────────────────┘                        │
│                                                                                           │
│  ┌─────────────────────────┐  ┌──────────────┐  ┌──────────────┐                        │
│  │ ISR / Static Pages      │  │ Background   │  │ Edge Config  │                        │
│  │ /score/{domain}          │  │ Functions    │  │ (feature     │                        │
│  │ / (landing page)         │  │ (async scan  │  │  flags)      │                        │
│  │ /dashboard/*             │  │  processing) │  │              │                        │
│  └─────────────────────────┘  └──────────────┘  └──────────────┘                        │
└──────────┬───────────────────────────┬───────────────────────────┬───────────────────────┘
           │                           │                           │
    ┌──────▼──────┐            ┌───────▼───────┐          ┌───────▼───────┐
    │  Supabase   │            │ Upstash Redis │          │  Firecrawl    │
    │ (PostgreSQL)│            │ (rate limits,  │          │  (crawl API)  │
    │             │            │  site key      │          │               │
    │ Tables:     │            │  cache)        │          │ JS rendering, │
    │ - scans     │            │               │          │ HTML extract  │
    │ - sites     │            │ Free tier:     │          │               │
    │ - crawler_  │            │ 10K cmds/day   │          │ $19/mo:       │
    │   visits    │            └───────────────┘          │ 500 credits   │
    │ - sub-      │                                        └───────────────┘
    │   scribers  │
    │             │
    │ Free tier:  │
    │ 500MB, 2    │
    │ projects    │
    └─────────────┘
```

---

## Two Data Planes — Why the Separation

CrawlReady has two fundamentally different data flows with different latency requirements, traffic patterns, and scaling characteristics:

| Dimension | Scan & Scoring Plane | Analytics & Ingest Plane |
|---|---|---|
| **Trigger** | User-initiated (one scan at a time) | Machine-generated (continuous beacons) |
| **Latency budget** | 5-30 seconds acceptable | < 50ms P95 required |
| **Traffic pattern** | Bursty (Show HN spike) | Steady (proportional to customer bot traffic) |
| **Auth** | None (diagnostic) or Clerk (dashboard) | Site key (ingest) or Clerk (dashboard) |
| **Write profile** | Complex (multi-table, multi-step) | Simple (single row append) |
| **Read profile** | Complex (joins, aggregations) | Simple (Phase 0), complex (Phase 1 dashboard) |
| **External dependency** | Firecrawl API (slow, expensive) | None (all internal) |
| **Failure mode** | Partial results acceptable | Silent drop acceptable |
| **Scaling bottleneck** | Firecrawl API rate limits + cost | Supabase write throughput |

The planes share: Supabase database, Upstash Redis, Clerk auth (for dashboard routes), and the `packages/core` library. They are deployed in the same Next.js app but designed as logically independent — enabling Phase 2 migration where the ingest plane moves to Cloudflare Workers while the scan plane stays on Vercel.

---

## Cross-Cutting Concerns

### 1. Observability (from Gap C5)

From day one, every request is traceable end-to-end.

```
Observability Stack (Phase 0):

  Structured Logging: Pino
    - JSON output in production, pretty-print in dev
    - Every log line includes: correlation_id, timestamp, level, component
    - Scan logs include: scan_id, url, status, duration_ms, firecrawl_cost_cents
    - Ingest logs include: site_key (masked), bot, source, processing_time_ms

  Error Tracking: Sentry (free tier)
    - Captures unhandled exceptions + manual breadcrumbs
    - Source maps uploaded at deploy
    - Alerts on new error types (email)

  Correlation ID:
    - Generated at edge middleware (UUID v4)
    - Propagated via X-Correlation-ID header to all downstream calls
    - Stored in scans.correlation_id for scan requests
    - Logged in every structured log line
    - Returned to client in API responses (debugging aid)

  Cost Tracking:
    - scans.firecrawl_cost_cents — per-scan Firecrawl API cost
    - Daily budget counter in Upstash Redis (key: budget:firecrawl:daily:{date})
    - Alert at 80% of daily budget via Sentry custom event
    - Hard stop at 100% — new scans return 503

  Metrics (Phase 1):
    - Vercel Analytics for web vitals
    - Custom counters: scans/day, ingest_events/day, active_sites
    - Supabase dashboard for DB metrics
```

### 2. Rate Limiting — 3 Layers (from Gap C2)

```
Layer 1: Edge (Vercel Edge Middleware)
  ┌─────────────────────────────────────────────────────┐
  │  IP-based counters using Upstash Redis               │
  │  Sliding window algorithm (@upstash/ratelimit)       │
  │                                                       │
  │  Key patterns:                                        │
  │    scan:ip:{ip}           → 3/hr (free diagnostic)   │
  │    scan:user:{clerk_id}   → tier-based               │
  │    ingest:site:{site_key} → 100/s                    │
  │    subscribe:ip:{ip}      → 5/hr                     │
  │                                                       │
  │  Response: 429 Too Many Requests + Retry-After       │
  │  Cost: Upstash free tier (10K commands/day)          │
  └─────────────────────────────────────────────────────┘

Layer 2: Application (per-endpoint guards)
  ┌─────────────────────────────────────────────────────┐
  │  Validation before expensive operations:             │
  │  - Scan: verify URL format, check honeypot field     │
  │  - Ingest: validate site_key exists before processing│
  │  - Subscribe: email format + disposable domain block │
  └─────────────────────────────────────────────────────┘

Layer 3: Budget Circuit Breaker
  ┌─────────────────────────────────────────────────────┐
  │  Daily Firecrawl budget = monthly plan / 30          │
  │                                                       │
  │  80% soft limit → throttle new scans (queue, don't   │
  │                   reject), alert founder              │
  │  100% hard limit → reject with 503 "At capacity"     │
  │                                                       │
  │  Counter: budget:firecrawl:daily:{YYYY-MM-DD}        │
  │  Storage: Upstash Redis (TTL: 48h)                   │
  └─────────────────────────────────────────────────────┘
```

### 3. Authentication Model

```
Split Auth Model:

  Clerk (@clerk/nextjs)
  ├── User authentication: sign-up, sign-in, session management
  ├── Used for: /dashboard/*, site management, analytics onboarding
  ├── JWT verification on /api/v1/sites/* and future /api/v1/analytics/*
  └── NOT used for: diagnostic scan, score pages, ingest, subscribe

  Lightweight Email Capture
  ├── "Fix this score" CTA on diagnostic → email only, no account
  ├── Stored in subscribers table
  └── Zero-friction path — user sees value before any auth

  Site Key (semi-public)
  ├── Format: cr_live_{16_alphanumeric}
  ├── Authenticates ingest beacons (POST /api/v1/ingest, GET /t/{key})
  ├── Embedded in customer's middleware/script tag — NOT secret
  ├── Trust model: possession = permission to write crawler_visits
  └── Abuse mitigation: rate limiting + source validation, not key secrecy

  Supabase
  └── Database only (PostgreSQL). No Supabase Auth.
```

### 4. Security Hardening (from Gap I8)

```
Phase 0 Security Checklist:

  API Surface:
  ├── All endpoints behind rate limiting (Layer 1)
  ├── CORS: allow only crawlready.app origin for browser requests
  ├── Content-Type validation on all POST endpoints
  ├── Input validation: URL format, max lengths, no script injection
  └── No secrets in client-side code or API responses

  Authentication:
  ├── Clerk JWT verification on all /dashboard and /api/v1/sites/* routes
  ├── Site ownership check: user.clerk_id === site.clerk_user_id
  └── No authorization bypass via direct API calls

  Data:
  ├── Phase 0: Application-level tenant isolation (WHERE site.clerk_user_id = ?)
  ├── Phase 1: Supabase Row-Level Security (RLS) policies
  ├── PII: only email addresses (in subscribers + Clerk). No passwords stored.
  └── Ingest: no PII in beacons (site_key, path, bot name, timestamp only)

  Infrastructure:
  ├── Environment variables via Vercel encrypted env vars
  ├── Separate env vars per environment (production, preview, development)
  ├── Supabase: service_role key server-side only, anon key for client reads
  └── Firecrawl: API key server-side only

  Headers (via Next.js middleware or next.config):
  ├── Strict-Transport-Security: max-age=31536000; includeSubDomains
  ├── X-Content-Type-Options: nosniff
  ├── X-Frame-Options: DENY
  ├── Referrer-Policy: strict-origin-when-cross-origin
  └── Content-Security-Policy: appropriate directives
```

### 5. Feature Flags (from Gap S8)

```
Vercel Edge Config (Phase 0):

  Why Edge Config:
  - Reads in < 1ms at the edge (no cold start, no network hop)
  - Free tier: 1 store, unlimited reads
  - JSON key-value — no SDK overhead
  - Sufficient for Phase 0 flag volume (< 20 flags)

  Flag Categories:
  ├── Launch gates:     scan_enabled, ingest_enabled, analytics_enabled
  ├── Feature rollout:  schema_preview_enabled, agent_interaction_enabled
  ├── Operational:      maintenance_mode, max_concurrent_scans
  └── Experiments:      landing_page_variant, cta_text_variant

  Access Pattern:
    import { get } from '@vercel/edge-config';
    const scanEnabled = await get('scan_enabled');  // < 1ms

  Update: Vercel dashboard or API. No deploy needed.
  Phase 1+: Evaluate LaunchDarkly or Statsig if flag complexity grows.
```

### 6. Testing Architecture (from Gap S7)

```
Testing Pyramid:

  Unit Tests (vitest — packages/core)
  ├── Scoring functions: input → score, deterministic
  ├── URL normalization: edge cases (trailing slash, www, protocol)
  ├── Bot detection: regex matches, edge cases
  ├── Schema pattern detectors: HTML snippet → detected types
  └── Coverage target: 90%+ for packages/core

  Integration Tests (vitest — apps/web)
  ├── API route handlers: request → response contract
  ├── Supabase queries: against test database
  ├── Ingest pipeline: beacon → validated → stored
  └── Rate limiter: verify correct 429 behavior

  Golden Set Tests (scoring-specific)
  ├── ~50 static HTML fixture files in packages/core/fixtures/
  ├── Each fixture has expected scores + recommendations
  ├── Regression guard: score changes require explicit fixture updates
  ├── Run in CI on every PR touching scoring code
  └── See scoring-detail.md for check-level rubrics

  E2E Tests (Playwright — Phase 1)
  ├── Full diagnostic flow: enter URL → see scores
  ├── Analytics onboarding: sign up → register site → copy snippet
  ├── Score page: verify ISR, OG image, meta tags
  └── Run against preview deployments in CI

  Load Tests (Phase 1, pre-Show HN)
  ├── k6 or Artillery against preview environment
  ├── Simulate: 100 concurrent scans, 1000 req/s ingest
  └── Verify: rate limiting activates, no cascading failures
```

---

## Infrastructure Dependencies Map

| Service | Purpose | Free Tier Limits | Phase 0 Cost | Failure Impact |
|---|---|---|---|---|
| **Vercel** | Hosting, edge, serverless, ISR | 100GB bandwidth, 100hr serverless | $0 (hobby) or $20/mo (pro) | **Total outage** — all services down |
| **Supabase** | PostgreSQL database | 500MB storage, 2 projects, 50K auth MAU | $0 | **Total outage** — no reads or writes |
| **Firecrawl** | JS rendering + HTML extraction | None (paid only) | $19/mo (500 credits) | **Scan plane down** — ingest unaffected |
| **Upstash Redis** | Rate limiting, site key cache, budget counter | 10K commands/day, 256MB | $0 | **Degraded** — rate limiting fails open, scan still works |
| **Clerk** | User authentication | 10K MAU | $0 | **Dashboard down** — diagnostic + ingest unaffected |
| **Sentry** | Error tracking | 5K errors/mo | $0 | **No impact** — monitoring blind, product works |
| **Vercel Edge Config** | Feature flags | 1 store, unlimited reads | $0 | **Degraded** — flags return defaults |

**Fail-open principle:** When Upstash Redis is unreachable, rate limiting is skipped (fail-open for reads, not for writes). When Sentry is down, errors are logged locally. When Edge Config is unavailable, flags return hardcoded defaults. Only Vercel, Supabase, and Firecrawl are hard dependencies.

**Monthly burn at Phase 0 launch:**
- Minimum: $19/mo (Firecrawl only — everything else on free tiers)
- Expected: $39/mo (Firecrawl $19 + Vercel Pro $20 for 60s function timeout)
- Maximum: $59/mo (add Supabase Pro $25 if free tier storage exceeded)

---

## Deployment Architecture (from Gap C4)

```
Environments:

  Production (crawlready.app)
  ├── Branch: main
  ├── Auto-deploy on merge to main
  ├── Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY,
  │             CLERK_SECRET_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
  │             SENTRY_DSN, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  └── Supabase: production project

  Preview (per-PR)
  ├── Branch: feature/* or fix/*
  ├── Auto-deploy on PR creation/update
  ├── URL: {branch}-crawlready.vercel.app
  ├── Env vars: same keys, different values (preview Supabase project)
  └── Used for: manual QA, Playwright E2E in CI

  Local Development
  ├── pnpm dev (Next.js dev server)
  ├── .env.local with development credentials
  ├── Supabase local via supabase start (Docker)
  └── Firecrawl: mock adapter in packages/core for offline dev

CI/CD Pipeline (GitHub Actions):
  On PR:
    1. pnpm install
    2. pnpm lint (ESLint)
    3. pnpm typecheck (TypeScript)
    4. pnpm test (vitest — unit + integration)
    5. Vercel preview deploy
    6. (Phase 1) Playwright E2E against preview URL

  On merge to main:
    1. Same checks as PR
    2. Vercel production deploy
    3. Post-deploy: smoke test (curl /api/v1/scan with test URL)
    4. Sentry release notification
```

---

## packages/core — The Business Logic Moat (from Gap S2)

```
packages/core/
├── src/
│   ├── scoring/          # All scoring functions
│   │   ├── crawlability.ts
│   │   ├── agent-readiness.ts
│   │   ├── agent-interaction.ts
│   │   ├── ai-readiness.ts    # Composite score
│   │   └── eu-ai-act.ts
│   ├── detection/         # Bot detection, URL normalization
│   │   ├── bot-registry.ts    # KnownBot[] — single source of truth
│   │   ├── url-normalize.ts
│   │   └── schema-patterns.ts # FAQ, Product, HowTo, Org detectors
│   ├── types/             # Shared type definitions
│   │   ├── scan.ts
│   │   ├── score.ts
│   │   ├── site.ts
│   │   └── ingest.ts
│   └── constants/         # Scoring weights, thresholds, version
│       ├── scoring-version.ts
│       └── thresholds.ts
├── fixtures/              # Golden set test fixtures
│   ├── csr-spa-react/
│   ├── ssr-nextjs/
│   ├── static-hugo/
│   └── ...
└── package.json           # Zero runtime dependencies

Constraints:
  - ZERO framework imports (no Next.js, no React, no Vercel SDK)
  - ZERO database imports (no Supabase client)
  - Pure functions: input → output, no side effects
  - This package is the reusable core for:
    - Next.js API routes (Phase 0)
    - Cloudflare Workers (Phase 2)
    - MCP server (Phase 1)
    - npm CLI (Phase 1)
    - Docusaurus plugin (Phase 1)
```

---

## Event Architecture Foundation (from Gap S1)

Phase 0 uses synchronous function calls — no event bus. But domain events are defined as TypeScript types from day one, enabling future migration to async event processing.

```
Domain Events (defined in packages/core/types/events.ts):

  Scan Plane:
  ├── ScanRequested    { scan_id, url, correlation_id, timestamp }
  ├── CrawlCompleted   { scan_id, checks_completed, checks_total }
  ├── ScoringCompleted { scan_id, scores, data_quality }
  ├── ScanFailed       { scan_id, error_code, error_message }
  └── ScanPartial      { scan_id, checks_failed[], scores_available }

  Analytics Plane:
  ├── BeaconReceived   { site_key, path, bot, source, timestamp }
  ├── SiteRegistered   { site_id, domain, clerk_user_id }
  ├── SiteDeleted      { site_id, domain }
  └── SiteKeyRotated   { site_id, old_key_prefix, new_key }

  Cross-Cutting:
  ├── BudgetThresholdReached { service: 'firecrawl', pct: 80 | 100 }
  └── RateLimitExceeded      { key_pattern, ip, limit }

Phase 0 Usage:
  - Events are TypeScript types only (compile-time contracts)
  - Emitted as structured log lines (Pino)
  - Consumed by: log aggregation, Sentry breadcrumbs

Phase 1+ Migration:
  - Same event types become messages on a queue (Inngest, or Cloudflare Queues)
  - Enables: async scan processing, webhook delivery, alert computation
```

---

## Migration Path: Phase 0 → Phase 2+

| Component | Phase 0 (Vercel) | Migration Trigger | Phase 2 (Cloudflare) |
|---|---|---|---|
| **Edge serving** | Vercel Edge Middleware | Content pipeline ships | Cloudflare Workers (300+ PoPs, HTMLRewriter) |
| **Ingest** | Next.js API route (Vercel serverless) | > 200 req/s sustained | Cloudflare Worker (global edge, < 10ms) |
| **Crawl engine** | Firecrawl API | > 100K pages/mo or > $500/mo COGS | Self-hosted Playwright (Fly.io / Railway) |
| **Cache** | None (diagnostic only) | Content pipeline ships | L0 (Cache API) → L1 (Workers KV) → L2 (R2) |
| **Queue** | Vercel Background Functions | > 50 concurrent scans | Cloudflare Queues / BullMQ |
| **Site key cache** | In-process LRU + Supabase | > 2,000 active sites | Upstash Redis shared layer |
| **Analytics storage** | Supabase `crawler_visits` | > 50M rows | Cloudflare Analytics Engine |
| **Feature flags** | Vercel Edge Config | > 20 flags or complex targeting | LaunchDarkly / Statsig |

**Migration strategy:** Each component migrates independently when its trigger condition is met. The `packages/core` library ensures business logic (scoring, bot detection, URL normalization) moves with zero rewrite. The data model (Supabase) stays until Phase 3+ when tenant partitioning is needed.

---

## Data Model — Reconciled (from Gap C6)

The authoritative data model is in `api-first.md`. The gap analysis identified these reconciliation items, all resolved:

| Issue | Resolution |
|---|---|
| `scans.id` type: INT vs UUID | INT (BIGINT GENERATED ALWAYS AS IDENTITY) — sequential, smaller indexes, no UUID overhead for public-facing IDs |
| Missing state columns on `scans` | Added: `status`, `correlation_id`, `error_code`, `error_message`, `crawl_started_at`, `scoring_started_at`, `completed_at`, `firecrawl_cost_cents` |
| `crawler_visits` missing `source` column | Added: `source TEXT NOT NULL DEFAULT 'middleware'` — values: 'middleware', 'js', 'pixel' |
| `sites` missing analytics config | Added: `integration_type TEXT DEFAULT 'middleware'`, `beacon_version INT DEFAULT 1`, `last_beacon_at TIMESTAMPTZ` |
| No composite indexes for score page | Added: `CREATE INDEX idx_scans_domain_status ON scans (domain, status) WHERE status IN ('complete', 'partial')` |
| No index for ingest hot path | Added: `CREATE INDEX idx_crawler_visits_site_visited ON crawler_visits (site_id, visited_at DESC)` |

See `api-first.md` §Data Model for the complete, reconciled schema.

---

## Endpoint Inventory — Complete (from Gap A12)

All endpoints across all phases, with auth model and spec status. Source of truth: `api-first.md` (to be updated).

### Phase 0 Endpoints

| Endpoint | Auth | Purpose | Spec |
|---|---|---|---|
| `POST /api/v1/scan` | None | Trigger diagnostic scan | Defined |
| `GET /api/v1/scan/{scanId}/status` | None | Poll scan progress (C1) | **New** |
| `GET /api/v1/score/{domain}` | None | Latest score for domain | Defined |
| `POST /api/v1/ingest` | SiteKey | Shared beacon endpoint | Updated |
| `GET /api/v1/t/{siteKey}` | None | Tracking pixel (A0) | **New** |
| `GET /c.js` | None | Client-side detection script (A0) | **New** |
| `POST /api/v1/subscribe` | None | Email capture | Defined |
| `POST /api/v1/sites` | Clerk | Register a site | Defined |
| `GET /api/v1/sites` | Clerk | List user's sites | Defined |
| `GET /api/v1/sites/{siteId}` | Clerk | Single site details (A12) | **New** |
| `DELETE /api/v1/sites/{siteId}` | Clerk | Remove site | Defined |

### Phase 1 Endpoints

| Endpoint | Auth | Purpose | Spec |
|---|---|---|---|
| `GET /api/v1/analytics/{siteId}/overview` | Clerk | Dashboard headline stats (A4) | **New** |
| `GET /api/v1/analytics/{siteId}/bots` | Clerk | Per-crawler breakdown (A4) | **New** |
| `GET /api/v1/analytics/{siteId}/pages` | Clerk | Top crawled pages (A4) | **New** |
| `GET /api/v1/analytics/{siteId}/timeseries` | Clerk | Chart data (A4) | **New** |
| `GET /api/v1/analytics/{siteId}/alerts` | Clerk | Actionable insights (A7) | **New** |
| `GET /api/v1/analytics/{siteId}/export` | Clerk | CSV/JSON export (A10) | **New** |
| `GET /api/v1/analytics/overview` | Clerk | Cross-site summary (A8) | **New** |
| `POST /api/v1/sites/{siteId}/rotate-key` | Clerk | Rotate site key (I2) | **New** |
| `POST /api/v1/sites/{siteId}/revoke-key` | Clerk | Revoke compromised key (I2) | **New** |
| `PATCH /api/v1/sites/{siteId}` | Clerk | Update site settings | **New** |
| `GET /api/v1/bots` | None | Known bot list + metadata (A5) | **New** |
| `GET /api/v1/score/{domain}/history` | None | Past scans list (S6) | **New** |
| `GET /api/v1/scan/{scanId}` | None | Specific scan result (S6) | **New** |
| `GET /api/v1/diff/{domain}` | None | Visual diff data | Defined |
| `GET /api/v1/recommend/{domain}` | None | Recommendations | Defined |
| `GET /api/v1/badge/{domain}.svg` | None | Embeddable badge | Defined |

### Phase 2 Endpoints

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/optimize` | Clerk | Trigger optimization |
| `POST /api/v1/recache/{url}` | HMAC | Webhook cache refresh |
| `GET /api/v1/sites/{siteId}/usage` | Clerk | Crawl budget usage |

---

## Architectural Principles

These principles govern all design decisions across both planes:

1. **Fail-open for reads.** Rate limiter down? Allow the request. Cache miss? Serve what you have. Analytics query slow? Show partial data. Never block a user because an auxiliary system failed.

2. **Correlation ID everywhere.** Every request gets a UUID at the edge. Every log line, every database row, every error report includes it. When something breaks at 3 AM, one ID traces the entire request path.

3. **`packages/core` is the moat.** All scoring, detection, normalization, and validation logic lives in a framework-agnostic package with zero external dependencies. This is the code that makes CrawlReady defensible — it must be portable across Vercel, Cloudflare, npm CLI, and MCP server.

4. **Cost awareness in every path.** Every scan records its Firecrawl cost. Every day has a budget. Every tier has explicit limits. The budget circuit breaker is not optional — it's a survival mechanism for a bootstrapped product.

5. **Partial results > no results.** A diagnostic that shows 7 of 9 checks is infinitely more valuable than a loading spinner. A score page with "some checks unavailable" is better than a 500 error. The system is designed for graceful degradation at every layer.

6. **Score pages are product.** Public score URLs (`/score/{domain}`) are CrawlReady's distribution engine. They must be fast (ISR), shareable (OG images), indexable (sitemap), and always available. Treat them as the most important pages on the site.

7. **Two planes, one codebase.** Scan and analytics are logically separate but deploy together in Phase 0. Design interfaces as if they were separate services (clean boundaries, typed contracts) so they can be when scale demands it.

---

## Related Documents

| Document | Scope |
|---|---|
| [scan-workflow.md](./scan-workflow.md) | Scan state machine, partial failures, score pages, cost tracking |
| [analytics-infrastructure.md](./analytics-infrastructure.md) | Ingest pipeline, dual integration, site key lifecycle, analytics API, scaling |
| [api-first.md](./api-first.md) | API endpoints, data model, error contract, versioning |
| [scoring-algorithm.md](./scoring-algorithm.md) | Score weights, display, interpretation bands |
| [scoring-detail.md](./scoring-detail.md) | Implementable rubrics, check-by-check |
| [crawler-analytics.md](./crawler-analytics.md) | Analytics feature spec, middleware snippets, dashboard views |
| [analytics-onboarding.md](./analytics-onboarding.md) | Clerk auth, site registration, snippet display |
| [crawling-provider.md](./crawling-provider.md) | Provider comparison, abstraction layer |
| [content-pipeline-infrastructure.md](./content-pipeline-infrastructure.md) | Content pipeline (Phase 2+), cache topology, edge serving |
| [multi-format-serving.md](./multi-format-serving.md) | Schema generation, multi-format research |
| [diagrams-infrastructure.md](./diagrams-infrastructure.md) | Mermaid diagrams: topology, scan workflow, analytics pipeline |
| [diagrams-content-pipeline.md](./diagrams-content-pipeline.md) | Mermaid diagrams: content pipeline C4, request flows |
| [architectural-gap-analysis.md](./architectural-gap-analysis.md) | Original 38-gap analysis (reference) |

---

## Decisions

- **Two data planes:** Scan & Scoring (user-triggered, slow, expensive) and Analytics & Ingest (machine-triggered, fast, cheap). Logically separated within one Next.js app. Enables independent scaling in Phase 2.
- **Fail-open:** All auxiliary systems (Redis, Sentry, Edge Config) fail open. Only Vercel, Supabase, and Firecrawl are hard dependencies.
- **Cost ceiling:** Monthly burn capped at ~$59/mo for Phase 0. Budget circuit breaker prevents runaway Firecrawl costs.
- **packages/core from day 1:** Zero-dependency business logic library. This is the moat — portable across all deployment targets.
- **Observability from day 1:** Pino structured logging + Sentry error tracking + correlation ID per request. Not optional.
- **Security hardening:** CORS, CSP, HSTS, input validation, tenant isolation checks on every authenticated endpoint. Phase 1 adds RLS.
- **Feature flags via Edge Config:** < 1ms reads, free tier, sufficient for Phase 0. No heavyweight SDK.
- **Testing:** vitest for unit/integration, golden set fixtures for scoring regression, Playwright E2E in Phase 1. CI runs on every PR.
- **Migration path:** Each component has an explicit trigger condition and target platform. No premature optimization — migrate when the data says so.
