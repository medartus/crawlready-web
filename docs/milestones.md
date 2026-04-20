# Phase 0 Milestones and Expectations

Implementation milestones for CrawlReady Phase 0. Each milestone defines its goal, deliverables, acceptance criteria, and hard gates. Estimated at ~6 weeks part-time (15-20 hrs/week).

---

## Overview

Phase 0 ships three deliverables:

1. **Landing page** at crawlready.app with a single URL input
2. **Working diagnostic** via crawling SaaS API (AI Readiness Score, visual diff, public score URLs)
3. **AI Crawler Analytics onboarding + ingest** (Clerk auth, site registration, middleware snippet, data collection)

```
M1: Foundation → M2: Crawling + Scoring → M3: Scan API → M4: Frontend → M6: Polish + Launch
M1: Foundation → M5: Analytics Onboarding ─────────────────────────────→ M6: Polish + Launch
```

---

## Milestone 1: Project Foundation

**Timeline:** ~Week 1

**Goal:** Scaffolded project with configured infrastructure and a validated crawling provider.

### Deliverables

- Next.js project with App Router, TypeScript, Tailwind CSS, and a clean project structure (`src/app/`, `src/lib/`, `src/types/`)
- Supabase project with all 4 tables created (`sites`, `scans`, `crawler_visits`, `subscribers`), RLS policies, and indexes
- Clerk integration with `@clerk/nextjs` protecting `/dashboard/*` routes
- Vercel deployment with environment variables configured (Clerk keys, Supabase URL/anon key/service role key, Firecrawl API key)
- `crawlready.app` domain pointed to Vercel
- `CrawlProvider` abstraction interface with a Firecrawl adapter implementation

### Acceptance Criteria

- `npm run dev` starts a working Next.js app on localhost
- Visiting `/dashboard/sites` redirects to Clerk sign-in
- Visiting `/sign-in` and `/sign-up` render Clerk auth components
- Supabase tables exist with correct schemas, indexes, and RLS policies
- The Firecrawl adapter can successfully crawl a test URL and return rendered HTML + Markdown
- The `CrawlProvider` interface is provider-agnostic (scoring code never imports Firecrawl directly)

### Hard Gate: Firecrawl 100-Crawl Validation

Before proceeding to Milestone 2, run 100 test crawls across 4 categories:

| Category | Count | Examples |
|---|---|---|
| CSR SPAs | 25 | React apps, Vue apps without SSR |
| SSR sites | 25 | Next.js, Nuxt, SvelteKit marketing sites |
| Documentation | 25 | Docusaurus, GitBook, ReadTheDocs sites |
| SaaS marketing | 25 | Stripe, Linear, Vercel landing pages |

Record for each crawl: cost, latency, HTML quality, Markdown quality, custom UA behavior.

**Pass criteria:**
- Cost < $0.03 per page on average
- Custom UA header is respected (bot simulation works)
- Latency < 15 seconds for user-facing scans
- HTML + Markdown output quality is sufficient for scoring

**Fail action:** Switch to Scrape.do adapter (adds ~2-3 days for HTML-to-Markdown conversion layer).

### Key Files

| File | Purpose |
|---|---|
| `src/lib/db/schema.sql` | All Phase 0 table definitions |
| `src/lib/crawl/provider.ts` | `CrawlProvider` interface |
| `src/lib/crawl/firecrawl.ts` | Firecrawl adapter |
| `src/middleware.ts` | Clerk middleware |

---

## Milestone 2: Crawling Pipeline + Scoring Engine

**Timeline:** ~Week 2

**Goal:** Given a URL, execute the full crawling pipeline and compute all scores.

### Deliverables

**Crawling pipeline** -- 4 HTTP operations per scan:

1. JS-rendered crawl via Firecrawl (1 provider credit) -- returns full HTML + Markdown + metadata
2. Bot-view fetch with `User-Agent: GPTBot/1.0` (direct HTTP, no JS, no provider cost)
3. Content negotiation probe with `Accept: text/markdown` and `User-Agent: CrawlReady/1.0`
4. `GET {origin}/llms.txt` check

**Scoring engine** -- 11 checks across 3 sub-scores:

| Sub-Score | Weight | Checks | Max Points |
|---|---|---|---|
| Crawlability | 50% | C1 content visibility ratio (35), C2 structural clarity (25), C3 noise ratio (20), C4 Schema.org (20) | 100 |
| Agent Readiness | 25% | A1 structured data completeness (30), A2 content negotiation (30), A3 machine-actionable data (40) | 100 |
| Agent Interaction | 25% | I1 semantic HTML quality (25), I2 interactive a11y (30), I3 navigation/structure (25), I4 visual-semantic consistency (20) | 100 |

**Composite formula:** `round(min(0.50*C + 0.25*A + 0.25*I, floor_cap))`
- Floor rule: if any sub-score < 20, the unified score is capped at 60

**EU AI Act checklist** -- 4 binary checks (does NOT affect numeric score):
1. Content provenance (`meta author` or Schema.org `author`)
2. Content transparency (`meta generator` or About/Imprint link)
3. Machine-readable marking (JSON-LD with `@type`)
4. Structured data provenance (`publisher` or `creator` in JSON-LD)

**Schema preview** -- detect existing JSON-LD types and count (display-only, no generation)

**Recommendations engine** -- generate actionable fix suggestions ranked by severity

### Acceptance Criteria

- Crawling pipeline fetches all 4 data sources for a given URL
- A pure CSR SPA (e.g., a React app without SSR) scores near 0 on Crawlability
- A well-built SSR site scores 50-70 on Crawlability
- Composite score correctly applies the 50/25/25 weighting
- Floor rule activates when any sub-score < 20 (caps unified score at 60)
- EU AI Act checklist returns X/4 with correct pass/fail per check
- Schema preview detects JSON-LD types when present
- Recommendations are generated for checks that score poorly
- Provider timeout or failure results in affected checks scoring 0 with appropriate messaging

### Key Files

| File | Purpose |
|---|---|
| `src/lib/crawl/bot-fetch.ts` | Direct HTTP fetcher for bot UA, markdown probe, llms.txt |
| `src/lib/scoring/crawlability.ts` | C1-C4 checks |
| `src/lib/scoring/agent-readiness.ts` | A1-A3 checks |
| `src/lib/scoring/agent-interaction.ts` | I1-I4 checks |
| `src/lib/scoring/composite.ts` | Weighted formula + floor rule |
| `src/lib/scoring/eu-ai-act.ts` | 4 binary checks |
| `src/lib/scoring/schema-preview.ts` | JSON-LD detection |
| `src/lib/scoring/recommendations.ts` | Fix suggestions |

---

## Milestone 3: Scan API + Data Persistence

**Timeline:** ~Week 3

**Goal:** Working API endpoints with caching, rate limiting, and persistent storage.

### Deliverables

**`POST /api/v1/scan`**
- Accepts `{ "url": "https://example.com" }`
- Normalizes URL (lowercase, strip www, strip query strings, default to https)
- Checks 24h cache -- returns cached result if scanned within 24 hours (no new crawl)
- Enforces rate limit: 3 scans/hour/IP (unauthenticated)
- Orchestrates: crawl pipeline -> scoring engine -> store in `scans` table -> return response
- Returns: `ai_readiness_score`, `scores` (3 sub-scores), `eu_ai_act`, `schema_preview`, `recommendations`, `score_url`, `scanned_at`
- Error handling: provider timeout (checks score 0 + messaging), 403/429 bot responses, redirects (up to 3), login walls, non-HTML content

**`GET /api/v1/score/{domain}`**
- Returns latest scan from DB only (no new crawl)
- 404 if domain has never been scanned
- Sub-100ms response time (database read only)

**`POST /api/v1/subscribe`**
- Accepts `{ "email": "...", "domain": "...", "source": "..." }`
- Stores in `subscribers` table
- Returns 201

**Error contract** -- all errors use a consistent JSON envelope:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "...",
    "retry_after": 720
  }
}
```

### Acceptance Criteria

- `POST /scan` triggers a full crawl + score pipeline and returns the correct response shape
- Submitting the same URL within 24 hours returns cached results (no Firecrawl credit consumed)
- Fourth scan from the same IP within an hour returns 429 with `Retry-After` header
- `GET /score/{domain}` returns the most recent scan or 404
- Malformed URLs return 400 `INVALID_URL`
- Scan results are persisted in the `scans` table with all fields populated
- `POST /subscribe` stores emails and returns 201; duplicate email+domain returns 409

### Key Files

| File | Purpose |
|---|---|
| `src/app/api/v1/scan/route.ts` | Scan endpoint |
| `src/app/api/v1/score/[domain]/route.ts` | Score lookup endpoint |
| `src/app/api/v1/subscribe/route.ts` | Email capture endpoint |
| `src/lib/scan/orchestrator.ts` | Coordinates crawl + score + store |
| `src/lib/utils/url.ts` | URL/domain normalization |
| `src/lib/utils/rate-limit.ts` | IP-based rate limiting |

---

## Milestone 4: Landing Page + Diagnostic Result UI

**Timeline:** ~Week 4

**Goal:** User-facing pages that deliver the "aha" moment in under 60 seconds.

### Deliverables

**Landing page (`/`)**
- Single URL input field: "Enter your URL"
- Clean, modern design
- No signup required
- Submitting triggers `POST /api/v1/scan` and navigates to the result page

**Diagnostic result page (`/scan/[id]`)**
- Visual diff: side-by-side human-rendered view vs what GPTBot receives, with JS-invisible sections highlighted in red
- AI Readiness Score: headline 0-100 with color band
  - 0-20: Critical (red)
  - 21-40: Poor (orange)
  - 41-60: Fair (yellow)
  - 61-80: Good (light green)
  - 81-100: Excellent (green)
- Three sub-scores with drill-down showing individual check results
- EU AI Act checklist: X/4 with pass/fail per check
- Schema preview: detected types and count
- Top 3 recommendations shown free
- Full recommendations gated behind email capture
- CTA: "Fix this score" -> email capture
- Share button linking to the public score page

**Public score page (`/score/[domain]`)**
- Permanent, indexable URL (e.g., `crawlready.app/score/stripe.com`)
- Displays latest AI Readiness Score, sub-scores, EU checklist
- Social meta tags for sharing (OG title, description, image with score)
- CTA to run own scan: "Check your site's AI readiness"

**Pre-seed 20 sites**
- Batch-crawl ~20 popular developer tool sites via Firecrawl
- Pre-populate `/score/{domain}` pages ready for Show HN screenshots

### Acceptance Criteria

- Entering a URL on the landing page initiates a scan with visible loading state (5-15s expected)
- The diagnostic result page renders all score sections correctly
- Visual diff clearly highlights content differences between browser and bot views
- Score color bands match the documented ranges
- Public score page at `/score/{domain}` is server-rendered (for SEO/social sharing)
- OG meta tags produce correct social previews when shared
- Pre-seeded sites have populated score pages with reasonable scores
- Email capture form stores subscribers and unlocks full recommendations
- The page is responsive and works on mobile

### Key Files

| File | Purpose |
|---|---|
| `src/app/page.tsx` | Landing page |
| `src/app/scan/[id]/page.tsx` | Diagnostic result page |
| `src/app/score/[domain]/page.tsx` | Public score page (SSR) |
| `src/components/score-display.tsx` | Score visualization components |
| `src/components/visual-diff.tsx` | Side-by-side diff renderer |
| `src/components/email-gate.tsx` | Email capture modal/form |

---

## Milestone 5: Analytics Onboarding + Ingest

**Timeline:** ~Week 5

**Goal:** Clerk-authenticated dashboard for site registration and a working ingest endpoint collecting AI crawler visit data.

### Deliverables

**Auth flow**
- Clerk sign-up/sign-in at `/sign-in`, `/sign-up` (email/password + Google OAuth + GitHub OAuth)
- `clerkMiddleware()` protects all `/dashboard/*` routes
- `auth()` used in API routes for authenticated endpoints

**Site registration (`/dashboard/sites`)**
- List registered sites with visit count (30d)
- Register a new site by entering a domain
- Domain normalization: lowercase, strip www
- Generate `site_key` in format `cr_live_` + 12 random alphanumeric characters
- Limit: 10 sites per user
- After registration, display:
  - Site key with copy button
  - Framework-specific middleware snippets (Next.js, Express/Hono, Cloudflare Workers, Generic)
  - Each snippet uses the same bot regex: `GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider`
- Delete site (cascades to delete associated `crawler_visits`)

**`POST /api/v1/ingest`**
- Payload: `{ "s": "site_key", "p": "/path", "b": "GPTBot", "t": 1712419200000 }`
- Response: `204 No Content`
- Validation:
  - `s` must match a registered site key
  - `b` must be in the known bot allowlist
  - `t` must be within 5 minutes of server time (replay protection)
- Rate limit: 100 requests/second per site key
- Stores in `crawler_visits` table

**`GET /api/v1/analytics/{siteId}` (minimal)**
- Clerk-authenticated, user must own the site
- Returns basic visit count and top bots (no full dashboard UI)

### Acceptance Criteria

- Unauthenticated users visiting `/dashboard/sites` are redirected to Clerk sign-in
- After sign-in, users can register a site and receive a site key
- Site key follows the `cr_live_` + 12 chars format
- Middleware snippets include the user's actual site key (not a placeholder)
- Copy-to-clipboard works for snippets
- 11th site registration attempt returns an error (10-site limit)
- Duplicate domain registration by the same user returns 409
- `POST /ingest` with a valid payload returns 204 and creates a `crawler_visits` row
- `POST /ingest` with an invalid site key returns 400
- `POST /ingest` with a timestamp > 5 minutes old is rejected
- Deleting a site removes it and all associated crawler visits

### Key Files

| File | Purpose |
|---|---|
| `src/app/dashboard/sites/page.tsx` | Site list + registration |
| `src/app/api/v1/sites/route.ts` | Create + list sites |
| `src/app/api/v1/sites/[id]/route.ts` | Delete site |
| `src/app/api/v1/ingest/route.ts` | Ingest endpoint |
| `src/app/api/v1/analytics/[siteId]/route.ts` | Basic analytics |
| `src/lib/analytics/snippets.ts` | Middleware snippet templates |

---

## Milestone 6: Polish, Pre-seed, and Launch

**Timeline:** ~Week 6

**Goal:** Production-ready product, pre-seeded with real data, and launched on Show HN.

### Deliverables

**Error handling and edge cases**
- Graceful failures for all crawl/scoring edge cases:
  - Provider timeout: "Scan incomplete -- site did not respond within 30s"
  - Bot-view 403/429: "This site blocks AI crawlers (HTTP {status})"
  - Redirect to different domain: flag and score redirected content
  - Login wall: "This page requires authentication -- scoring the public version"
  - Non-HTML content: "This URL returns {content-type}, not HTML"
  - Empty page (< 50 chars): "This page appears to be empty"

**Loading states**
- Scan takes 5-15 seconds; show a progress indicator with status updates
- Skeleton loading for score pages

**SEO and social sharing**
- Meta tags on all public pages
- Dynamic OG images for score pages showing the score value
- Sitemap including all pre-seeded score pages
- Robots.txt allowing search engine indexing

**Rate limit UX**
- Clear messaging when rate limits are hit
- Display remaining scans and reset time

**Pre-seed execution**
- Batch-crawl 20 developer tool sites
- Verify scores are reasonable (sanity check against worked examples in scoring-detail.md)
- Fix any scoring edge cases discovered during pre-seeding

**Launch preparation**
- Blog post draft for Show HN submission
- Show HN targeting Tuesday-Thursday morning EST for maximum visibility

### Acceptance Criteria

- All error scenarios display user-friendly messages (no raw error dumps)
- Loading states appear during scan execution
- Score pages have correct OG tags (verify with social preview tools)
- Sitemap is generated and accessible at `/sitemap.xml`
- Pre-seeded sites have populated, reasonable scores
- Rate limit messages are clear and include retry timing
- Production deployment on Vercel is stable under expected load

### Validation Gates (Post-Launch)

Monitor for 2-3 weeks after Show HN launch:

| Signal | Target | Action |
|---|---|---|
| Landing visits (weeks 4-6 post-launch) | 500+ | Proceed to Phase 1 |
| Email signups | 50+ (~10% of visits) | Proceed to Phase 1 |
| Show HN upvotes | 30+ | Strong validation signal |
| "I'd pay for this" comments | 10+ | Accelerate Phase 1 |
| Inbound "when available?" inquiries | 5+ | Very strong signal |
| 30%+ scans on CSR SPAs | -- | Confirms ICP hypothesis |
| Visits < 200 AND signups < 20 | Kill gate | Reconsider before Phase 1 |
| 0-5 upvotes and silence | Kill gate | Project may not be viable |
| "MachineContext already does this" narrative | Pivot signal | Re-evaluate differentiation |

### Learning Goals

- Hook strength: does the visual diff / score create enough "aha" to share?
- ICP mix: what types of sites are people scanning? (CSR vs SSR vs other)
- Objection themes: what pushback appears in comments?
- Pricing interest: any unprompted willingness to pay?
- Real Firecrawl COGS per scan: validate unit economics for pricing tiers

---

## Dependencies Between Milestones

| Milestone | Depends On | Can Parallelize With |
|---|---|---|
| M1: Foundation | -- | -- |
| M2: Crawling + Scoring | M1 | -- |
| M3: Scan API | M2 | -- |
| M4: Frontend | M3 | M5 (different concern) |
| M5: Analytics | M1 only | M2, M3, M4 |
| M6: Polish + Launch | M4, M5 | -- |

M5 (analytics onboarding) is the only milestone that can be built in parallel with the diagnostic track (M2-M4), since it only depends on the foundation (M1). With solo bandwidth, sequential focus is recommended unless a particular milestone is blocked.

---

## What Is Explicitly Not in Phase 0

- Analytics dashboard UI (charts, per-crawler breakdown) -- Phase 1
- Alerts ("GPTBot visited /pricing but received empty HTML") -- Phase 1
- Badge endpoint (`/badge/{domain}.svg`) -- Phase 1
- npm package / CLI -- Phase 1
- MCP server / Docusaurus plugin -- Phase 1
- GitHub Action / Cloudflare Worker template -- Phase 2
- Schema.org generation + injection (paid) -- Phase 1-2
- Historical score tracking over time -- Phase 1
- Site key rotation UI -- Phase 1
- Hidden backlink injection -- Phase 1
- Stripe / billing integration -- Phase 2
- PDF export -- Phase 1
- Multi-page scoring (only homepage in Phase 0) -- Phase 1

## Key Decisions

- **Revenue target for Phase 0:** $0. This is pure validation.
- **Scoring version:** Integer per scan, starting at version 1. Historical scans are never rescored.
- **Auth split:** Clerk for registered users, lightweight email for diagnostic gating, Supabase as DB only.
- **Rate limits:** 3 scans/hour/IP (diagnostic), 100 req/s/key (ingest), 24h cache per URL.
- **Distribution:** Show HN only. One channel, executed well.
- **Estimated infrastructure cost:** ~$20-50/month (Vercel Pro + Firecrawl credits + Supabase free tier).
