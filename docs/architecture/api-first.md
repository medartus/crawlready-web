# Research: API-First Architecture Specification

Design specification for CrawlReady's API-first architecture — a single backend API that powers all distribution channels (web diagnostic, MCP server, npm CLI, Docusaurus plugin, edge proxy, partner widgets). Compiled April 2026 as part of the VP Innovation Strategic Analysis.

---

## Why API-First

### Current Implicit Architecture

The Phase 0 plan already works this way: Next.js API routes call Firecrawl, compute scores, and store results in Supabase. The web frontend consumes these API routes. This is effectively API-first — the specification formalizes it and ensures all future distribution channels consume the same backend.

### The Problem With Edge-First Thinking

The existing documentation frames CrawlReady primarily as an "edge proxy layer." This framing implies the product identity is tied to HTTP request interception. In reality, the edge proxy is one consumption mode among many. The core value — crawl a page, score it, transform it — is an API operation, not an edge operation.

### What API-First Enables

```
CrawlReady API (core backend)
    │
    ├── Web diagnostic (crawlready.app)           ← Phase 0
    ├── AI Crawler Analytics ingest (/v1/ingest)  ← Phase 0/1
    ├── Public score pages (/score/{domain})      ← Phase 0
    ├── MCP server (crawlready-mcp)               ← Phase 1
    ├── npm CLI + middleware (crawlready)           ← Phase 1
    ├── Docusaurus plugin (@crawlready/docusaurus) ← Phase 1
    ├── Partner referral tracking (/fix?url=...&source=...) ← Phase 1.5
    ├── Edge proxy (Cloudflare Worker template)    ← Phase 2
    └── Badge endpoint (/badge/{domain}.svg)       ← Phase 1
```

Every distribution channel consumes the same API. A score improvement, new bot detection pattern, or Schema.org generation capability propagates to all channels immediately without separate deployments.

---

## Phase 0 Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│                   crawlready.app                      │
│                (Vercel / Next.js)                      │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Landing Page │  │  Score Page   │  │  Dashboard  │ │
│  │  (SSR/static) │  │  (/score/*)  │  │ (/analytics)│ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬─────┘ │
│         │                  │                  │       │
│         └──────────────────┼──────────────────┘       │
│                            │                          │
│                    ┌───────▼────────┐                 │
│                    │  API Routes     │                 │
│                    │  /api/v1/*      │                 │
│                    └───────┬────────┘                 │
└────────────────────────────┼──────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼─────┐  ┌─────▼──────┐
     │  Firecrawl  │  │  Supabase   │  │  Scoring    │
     │  API        │  │  (Postgres)  │  │  Engine     │
     │  (crawl +   │  │  - scores   │  │  (in-app)   │
     │   extract)  │  │  - visits   │  │             │
     │             │  │  - emails   │  │             │
     └─────────────┘  └────────────┘  └─────────────┘
```

### Technology Stack (Phase 0)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14+ (App Router) | SSR for score pages (SEO), API routes for backend logic, deploy on Vercel |
| API | Next.js API Routes (`/api/v1/*`) | Co-located with frontend, zero additional infrastructure |
| Crawling | Crawling SaaS provider (see `docs/architecture/crawling-provider.md`) | No self-hosted Playwright, handles JS rendering |
| Database | Supabase (Postgres) | Free tier for Phase 0, scores + emails + crawler visits + sites |
| Auth | Clerk (`@clerk/nextjs`) | Site registration, analytics onboarding, future dashboard. See `docs/architecture/analytics-onboarding.md`. |
| Email capture | Lightweight (no auth) | Diagnostic gated features (PDF, alerts). Stored in `subscribers` table. No account. |
| Deployment | Vercel | Free tier for development, Pro ($20/mo) for production |
| Domain | crawlready.app | Secured |

### Why Next.js API Routes (Not a Separate Backend)

- **Phase 0 is two deliverables:** landing page + diagnostic. A single Next.js app handles both.
- **Zero DevOps overhead:** Vercel deploys on `git push`. No Docker, no Kubernetes, no separate API server.
- **Serverless scaling:** API routes run as serverless functions — scale to zero when idle, handle bursts during Show HN.
- **Co-located logic:** The scoring engine lives alongside the frontend that renders score pages. No cross-service latency.
- **Migration path:** If scale demands a separate backend (Phase 2+), API routes extract cleanly into a standalone service because they follow REST conventions.

---

## URL Normalization

All URLs and domains are normalized before storage, cache lookup, or display. This prevents duplicates and ensures consistent cache hits.

### Domain Normalization (for score pages and site registration)

```
Input:  "https://WWW.Example.COM/path?query=1"
Output: "example.com"
```

Rules applied in order:
1. Strip scheme (`http://`, `https://`)
2. Strip `www.` prefix
3. Lowercase
4. Strip trailing dot (DNS root)
5. Strip port if default (80, 443)
6. Strip path, query, fragment

For `/score/{domain}`, the domain is always the normalized form. `crawlready.app/score/example.com` and `crawlready.app/score/www.example.com` resolve to the same page.

### URL Normalization (for scan targets)

```
Input:  "https://WWW.Example.COM/Pricing/?ref=123#section"
Output: "https://example.com/pricing/"
```

Rules applied in order:
1. Lowercase scheme and host
2. Strip `www.` prefix
3. Strip fragment (`#...`)
4. Strip query string (Phase 0 — no query string support)
5. Preserve path as-is (including trailing slash)
6. Default to `https://` if no scheme provided

Phase 0 rejects URLs with authentication (`user:pass@host`), non-HTTP schemes, and IP addresses.

### Implementation

A single `normalizeUrl(input: string): { url: string; domain: string }` utility used everywhere: API routes, cache keys, database writes, score page generation.

---

## What Is a Scan?

**One scan** = one diagnostic analysis of a single URL. It consists of:

1. **1 crawling provider call** — JS-rendered scrape of the target URL (returns HTML + Markdown + metadata). This is the only provider cost.
2. **1 direct HTTP fetch** — `User-Agent: GPTBot/1.0`, no JS rendering. Shows what non-rendering bots see. Made from the API route, no provider cost.
3. **1 content negotiation probe** — `Accept: text/markdown` header. Made from the API route.
4. **1 llms.txt check** — `GET {origin}/llms.txt`. Made from the API route.

**Total provider cost per scan:** 1 credit (rendered view only).
**Total HTTP requests per scan:** 4 (1 provider + 3 direct).

**Rate limits:**
- 3 scans per hour per IP (unauthenticated)
- 1 scan per 24 hours per URL (cache — no new crawl within 24h)

**`/score/{domain}` semantics:** The score page always shows the most recent scan of the domain's **homepage** (`https://{domain}/`). Multi-page scoring is Phase 1+. The score page is served from the database — no crawling provider call.

---

## Error Contract

All API endpoints return errors in a consistent envelope:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "You have exceeded the rate limit of 3 scans per hour. Try again in 12 minutes.",
    "retry_after": 720
  }
}
```

### HTTP Status Codes

| Status | Code | When |
|---|---|---|
| 400 | `INVALID_URL` | URL is malformed, not HTTP(S), or is an IP address |
| 400 | `INVALID_DOMAIN` | Domain does not resolve or is not a valid hostname |
| 400 | `INVALID_PAYLOAD` | Request body fails validation (missing fields, wrong types) |
| 401 | `UNAUTHORIZED` | Clerk auth required but no valid JWT present |
| 403 | `FORBIDDEN` | User does not own the requested resource |
| 404 | `NOT_FOUND` | Domain never scanned, site not registered, etc. |
| 409 | `ALREADY_EXISTS` | Site already registered by this user |
| 429 | `RATE_LIMITED` | IP or site key rate limit exceeded. Includes `retry_after` (seconds). |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `PROVIDER_ERROR` | Crawling provider returned an error or timed out |
| 503 | `SERVICE_UNAVAILABLE` | CrawlReady is temporarily unavailable |

Rate limit responses include `Retry-After` header (seconds) and `X-RateLimit-Remaining` header.

---

## API Endpoints (Phase 0)

### Core Diagnostic API

#### `POST /api/v1/scan`

Triggers a new crawl and returns the AI Readiness Score.

**Request:**
```json
{
  "url": "https://example.com/pricing"
}
```

**Response:**
```json
{
  "url": "https://example.com/pricing",
  "ai_readiness_score": 31,
  "scores": {
    "crawlability": 23,
    "agent_readiness": 12,
    "agent_interaction": 45
  },
  "eu_ai_act": {
    "passed": 1,
    "total": 4,
    "checks": [
      { "name": "content_provenance", "passed": false },
      { "name": "content_transparency", "passed": false },
      { "name": "machine_readable_marking", "passed": true },
      { "name": "structured_data_provenance", "passed": false }
    ]
  },
  "schema_preview": {
    "detected_types": [],
    "generatable": [
      { "type": "FAQPage", "confidence": 0.87, "items_detected": 3 },
      { "type": "Product", "confidence": 0.92, "tiers_detected": 3 }
    ]
  },
  "recommendations": [
    {
      "severity": "critical",
      "category": "crawlability",
      "issue": "Content invisible to AI crawlers",
      "detail": "87% of page content is rendered by JavaScript and invisible to GPTBot, ClaudeBot, and PerplexityBot",
      "fix": "Add server-side rendering or use CrawlReady's optimization layer"
    }
  ],
  "score_url": "https://crawlready.app/score/example.com",
  "scanned_at": "2026-04-06T14:30:00Z"
}
```

**Rate limits:** 3 scans per hour per IP (un-authenticated). Authenticated users get higher limits.

**Cache:** Results are cached for 24 hours per URL. Subsequent requests within 24h return the cached result without triggering a new Firecrawl crawl.

#### `GET /api/v1/score/{domain}`

Returns the most recent score for a domain (cached, no new crawl).

**Response:** Same structure as `/api/v1/scan` response, or `404` if the domain has never been scanned.

**Cache:** Served from Supabase. No Firecrawl call. Sub-100ms response time.

### AI Crawler Analytics API

#### `POST /api/v1/ingest`

Receives beacon payloads from middleware snippets. See `docs/architecture/crawler-analytics.md` for full specification.

**Request:**
```json
{
  "s": "site_abc123",
  "p": "/pricing",
  "b": "GPTBot",
  "t": 1712419200000
}
```

**Response:** `204 No Content`

#### `GET /api/v1/analytics/{siteId}`

Returns crawler analytics for a registered site (authenticated).

**Response:**
```json
{
  "site_id": "site_abc123",
  "domain": "example.com",
  "period": "30d",
  "total_visits": 5024,
  "unique_pages": 67,
  "by_crawler": [
    { "bot": "Google-Extended", "visits": 2891, "pages": 67, "share": 0.58 },
    { "bot": "Meta-ExternalAgent", "visits": 1653, "pages": 52, "share": 0.33 },
    { "bot": "GPTBot", "visits": 312, "pages": 45, "share": 0.06 }
  ],
  "top_pages": [
    { "path": "/docs/getting-started", "visits": 1247 },
    { "path": "/pricing", "visits": 891 }
  ],
  "alerts": [
    {
      "type": "invisible_content",
      "path": "/pricing",
      "bot": "GPTBot",
      "visits": 89,
      "crawlability_score": 12,
      "message": "GPTBot visited /pricing 89 times but your crawlability score is 12/100"
    }
  ]
}
```

### Email Capture API

#### `POST /api/v1/subscribe`

Captures email for gated features (full report, historical tracking, score change alerts).

**Request:**
```json
{
  "email": "dev@example.com",
  "domain": "example.com",
  "source": "score_page"
}
```

**Response:** `201 Created`

---

## CLI vs Middleware: Two Distinct Products (April 7, 2026 Critical Analysis)

The docs previously conflated the npm CLI and the middleware package. These serve different use cases and should be architected as separate concerns within the same npm package (or as separate packages under the `@crawlready` org).

### The Middleware (`crawlready` npm package — runtime)

Runs in the server process. Intercepts AI crawler requests at runtime and serves optimized content. This is the core paid product distribution mechanism.

**What it does:**
- Detects AI crawlers via User-Agent matching in incoming HTTP requests
- Routes detected crawlers to CrawlReady's cached optimized content (paid mode) or performs basic HTML-to-Markdown conversion (free mode)
- Responds to `Accept: text/markdown` content negotiation headers
- Reports AI crawler visits to the Analytics ingest endpoint (beacon)
- Injects hidden `<link>` tag for free-tier backlink engine
- Always-on, runs continuously in the server process

**Entry points by framework:**
- Next.js: `withCrawlReady()` in `middleware.ts`
- Express/Hono: `crawlready()` middleware function
- Cloudflare Workers: `crawlreadyWorker()` handler wrapper
- Vercel Edge: `withCrawlReady()` in edge middleware

### The CLI (`npx crawlready` or `@crawlready/cli` — point-in-time)

A standalone diagnostic tool run from the terminal. Calls the CrawlReady API. Outputs results to stdout. Used for one-time checks, CI/CD integration, and development workflow.

**What it does:**
- `npx crawlready scan <url>` — Scan a URL and get the AI Readiness Score + sub-scores
- `npx crawlready diff <url>` — Show what AI crawlers see vs. browser view (text diff in terminal)
- `npx crawlready recommend <url>` — Get prioritized optimization recommendations
- `npx crawlready score <domain>` — Check cached score for a domain (no new crawl)

**Free mode (no API key):** Static analysis of HTML (heading structure, Schema.org presence, meta tags, robots.txt, llms.txt check). Basic HTML-to-Markdown conversion preview. Console output only.

**Paid mode (with `CRAWLREADY_API_KEY` env var):** Full Firecrawl-powered scan (JS rendering comparison). Visual diff output. AI Readiness Score with all three sub-scores. EU AI Act checklist. Schema generation preview.

### Package Architecture Decision

Two options:

**Option A — Single package with CLI binary:**
```
npm install crawlready
# Middleware: import { withCrawlReady } from 'crawlready/next'
# CLI: npx crawlready scan https://example.com
```
The `crawlready` package includes both the middleware exports and a `bin` entry for the CLI. Simpler for users — one install, two capabilities.

**Option B — Separate packages:**
```
npm install crawlready          # Middleware only
npm install @crawlready/cli     # CLI only  
```
Cleaner separation of concerns. CLI users don't pull in middleware dependencies and vice versa.

**Recommendation:** Option A for Phase 1 (simpler, faster to ship). Split into Option B only if the package grows too large or the two audiences diverge significantly.

---

## Phase 1+ API Extensions

These endpoints are not built in Phase 0 but the API structure accommodates them:

| Endpoint | Phase | Consumer |
|---|---|---|
| `GET /api/v1/diff/{domain}` | Phase 1 | MCP server (`crawlready_diff` tool), web diagnostic |
| `GET /api/v1/recommend/{domain}` | Phase 1 | MCP server (`crawlready_recommend` tool), web diagnostic |
| `GET /api/v1/badge/{domain}.svg` | Phase 1 | Embeddable badge endpoint |
| `POST /api/v1/optimize` | Phase 2 | CDN snippet integration, automated optimization |
| `GET /api/v1/fix-widget` | Phase 1.5 | Deferred — partner embedded diagnostic (build only when requested) |
| `POST /api/v1/recache/{url}` | Phase 2 | Webhook-triggered cache refresh |

---

## Data Model (Supabase)

### Tables

```sql
-- Sites registered for analytics (Clerk-based auth)
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

CREATE INDEX idx_sites_clerk_user ON sites(clerk_user_id);
CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_sites_key ON sites(site_key);

-- Diagnostic scan results
-- Uses JSONB `result` column to match the API response shape exactly.
-- Avoids premature flattening into typed columns.
CREATE TABLE scans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  scoring_version INT NOT NULL DEFAULT 1,
  ai_readiness_score INT NOT NULL,
  crawlability_score INT NOT NULL,
  agent_readiness_score INT NOT NULL,
  agent_interaction_score INT NOT NULL,
  eu_ai_act_passed INT NOT NULL DEFAULT 0,
  eu_ai_act JSONB,
  recommendations JSONB,
  schema_preview JSONB,
  raw_html_size INT,
  markdown_size INT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scans_domain ON scans(domain, scanned_at DESC);
CREATE INDEX idx_scans_url ON scans(url, scanned_at DESC);

-- AI crawler visit logs
CREATE TABLE crawler_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  bot TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawler_visits_site_bot ON crawler_visits(site_id, bot, visited_at);
CREATE INDEX idx_crawler_visits_site_path ON crawler_visits(site_id, path, visited_at);

-- Email subscribers (lightweight capture, no account)
CREATE TABLE subscribers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  domain TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_subscribers_email_domain ON subscribers(email, domain);
```

See `docs/architecture/analytics-onboarding.md` for the full Clerk + Supabase data model design.

### Row-Level Security

- `scans`: Public read (score pages are un-gated). Write via API routes only (service role).
- `crawler_visits`: Read restricted to site owner (via `clerk_user_id` on joined `sites` table). Write via ingest endpoint (service role).
- `subscribers`: Write via subscribe endpoint. Read via admin only.
- `sites`: Read restricted to owner (`clerk_user_id` matches). Write via registration flow (Clerk auth required).

---

## External Service Dependencies

| Service | Purpose | Phase 0 Cost | Failure Mode |
|---|---|---|---|
| **Crawling SaaS** | Crawl pages + extract HTML/Markdown | ~$0.001/page, est. $10-50/mo | Scan fails gracefully, returns `PROVIDER_ERROR` |
| **Supabase** | Database (PostgreSQL) | Free tier (500MB) | Score pages unavailable, ingest drops |
| **Clerk** | User authentication | Free tier (10K MAUs) | Site registration unavailable; diagnostic unaffected |
| **Vercel** | Hosting + serverless functions | Free → Pro ($20/mo) | Site down (standard Vercel SLA) |

**No other dependencies in Phase 0.** No Redis, no Cloudflare Workers, no separate backend service, no message queue. Complexity is minimized for a solo developer building 15-20 hrs/week. See `docs/architecture/crawling-provider.md` for provider selection.

---

## API Versioning

All endpoints are versioned under `/api/v1/`. This allows breaking changes in future versions (`/api/v2/`) without disrupting existing consumers (MCP server, npm CLI, npm middleware, partner referral links).

---

## Authentication Model

CrawlReady uses a **dual auth model**:

- **Clerk** — JWT-based auth for site management and future dashboard routes
- **Site key** — embedded in middleware snippets, sent in the ingest request body
- **No auth** — diagnostic, public score pages, email capture

| Endpoint | Auth Required | Method |
|---|---|---|
| `POST /api/v1/scan` | No (rate-limited by IP) | None |
| `GET /api/v1/score/{domain}` | No (public score pages) | None |
| `POST /api/v1/sites` | Yes (site owner) | Clerk JWT |
| `GET /api/v1/sites` | Yes (site owner) | Clerk JWT |
| `DELETE /api/v1/sites/{id}` | Yes (site owner) | Clerk JWT |
| `POST /api/v1/ingest` | Site key (in body `s` field) | Semi-public key |
| `GET /api/v1/analytics/{siteId}` | Yes (site owner) | Clerk JWT |
| `POST /api/v1/subscribe` | No | None |
| `GET /api/v1/badge/{domain}.svg` | No (public) | None (Phase 1) |

The diagnostic scan is intentionally un-authenticated — this is the zero-friction entry point. Clerk auth gates features that require site ownership (site management, analytics). The ingest endpoint uses a site key in the request body — this is a semi-public key embedded in customer middleware, not a secret Bearer token. See `docs/architecture/analytics-onboarding.md` for the full auth design.

---

## Migration Path to Standalone API (Phase 2+)

If scale demands separation of the API from the Next.js frontend:

1. Extract `/api/v1/*` routes into a standalone Hono/Express service
2. Deploy on Cloudflare Workers (global edge, low latency) or Railway/Fly.io
3. Frontend calls the external API instead of co-located routes
4. The MCP server, npm CLI, and middleware package already call HTTP endpoints — zero changes needed

This migration is a refactoring exercise, not a rewrite. The API contract stays the same.

---

## Decisions

- **Phase 0 backend:** Next.js API routes on Vercel. No separate backend service. Complexity must be minimal for 15-20 hrs/week solo.
- **Database:** Supabase Postgres (database only, no Supabase Auth). Free tier covers Phase 0-1 comfortably.
- **API versioning:** `/api/v1/` prefix from day one. Future-proofs for breaking changes.
- **Canonical base URL:** `crawlready.app/api/v1/*` — no subdomain, Next.js serves everything.
- **Auth model:** Dual — Clerk JWT for site management, site key for ingest, no auth for diagnostic. See `docs/architecture/analytics-onboarding.md`.
- **Error contract:** Consistent JSON error envelope with `code`, `message`, and optional `retry_after`. See Error Contract section above.
- **URL normalization:** All URLs and domains normalized before storage or cache lookup. See URL Normalization section above.
- **Scan definition:** One scan = 1 provider call + 3 direct HTTP requests. See "What Is a Scan?" section above.
- **Score caching:** Scan results cached 24h per URL. No new provider call within cache window. `GET /score/{domain}` always served from database.
- **Score page semantics:** `/score/{domain}` shows the homepage scan. Multi-page scoring is Phase 1+.
- **Crawler analytics ingest:** Supabase INSERT, not a queue. At Phase 0-1 scale (hundreds of users), Postgres handles the throughput. Migrate to time-series store only if needed.
- **Scoring version:** Every scan stores `scoring_version` (integer). Enables historical comparison as the algorithm evolves.