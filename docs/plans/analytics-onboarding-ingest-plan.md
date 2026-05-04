# Analytics Onboarding & Ingest — Implementation Plan

**Phase:** 0
**Deliverable:** Analytics Onboarding & Ingest
**Canonical scope:** `docs/product/vision.md` lines 65-74
**Last updated:** Session date

---

## 1. Existing Code Inventory

### Backend (API Routes) — ✅ Functional

| File | Endpoint | Status |
|---|---|---|
| `apps/web/src/app/api/v1/sites/route.ts` | `POST /api/v1/sites` (register), `GET /api/v1/sites` (list) | ✅ Works |
| `apps/web/src/app/api/v1/sites/[id]/route.ts` | `GET /api/v1/sites/[id]`, `DELETE /api/v1/sites/[id]` | ✅ Works |
| `apps/web/src/app/api/v1/ingest/route.ts` | `POST /api/v1/ingest` (beacon receiver) | ✅ Works — needs hardening |
| `apps/web/src/app/api/v1/t/[key]/route.ts` | `GET /api/v1/t/[key]` (tracking pixel) | ✅ Works |
| `apps/web/src/app/c.js/route.ts` | `GET /c.js` (bot detection script) | ✅ Works |
| `apps/web/src/app/api/v1/analytics/[siteId]/route.ts` | `GET /api/v1/analytics/[siteId]` (basic stats) | ✅ Works |

### Frontend (Pages) — Mixed

| File | Route | Status |
|---|---|---|
| `apps/web/src/app/[locale]/(auth)/dashboard/page.tsx` | `/dashboard` → redirect to `/dashboard/sites` | ✅ Works |
| `apps/web/src/app/[locale]/(auth)/dashboard/layout.tsx` | Dashboard shell | ⚠️ Header nav, needs sidebar per vision |
| `apps/web/src/app/[locale]/(auth)/dashboard/sites/page.tsx` | `/dashboard/sites` (list) | ✅ Works |
| `apps/web/src/app/[locale]/(auth)/dashboard/sites/[siteId]/page.tsx` | `/dashboard/sites/[siteId]` (detail) | ✅ Works |
| `apps/web/src/app/[locale]/(auth)/onboarding/layout.tsx` | Onboarding shell | ⚠️ 3-step flow, needs rework |
| `apps/web/src/app/[locale]/(auth)/onboarding/add-site/page.tsx` | Site registration | ✅ Works — correct beacon snippets |
| `apps/web/src/app/[locale]/(auth)/onboarding/crawl/page.tsx` | Pre-cache pages | ❌ WRONG — content pipeline, not analytics |
| `apps/web/src/app/[locale]/(auth)/onboarding/integrate/page.tsx` | Integration code | ❌ WRONG — shows `api.crawlready.com/render` rewrite, not analytics beacon |
| `apps/web/src/app/[locale]/(auth)/onboarding/organization-selection/page.tsx` | Org selection | ✅ Works |

### Shared Utilities

| File | Purpose | Status |
|---|---|---|
| `apps/web/src/lib/utils/api-helpers.ts` | Error contract, IP extraction | ✅ Works |
| `apps/web/src/lib/utils/rate-limit.ts` | In-memory rate limiter | ✅ Works |
| `apps/web/src/lib/utils/snippets.ts` | Beacon snippet templates | ✅ Works |
| `apps/web/src/middleware.ts` | Clerk auth + intl + public API allowlist | ✅ Works |

### Database Schema

| Table | File | Status |
|---|---|---|
| `sites` | `packages/database/src/schema/index.ts` | ✅ Correct — has clerkUserId, domain, siteKey, tier |
| `crawler_visits` | `packages/database/src/schema/index.ts` | ✅ Correct — siteId FK, path, bot, source, verified |
| `scans` | `packages/database/src/schema/index.ts` | ✅ Separate (diagnostic) |
| `subscribers` | `packages/database/src/schema/index.ts` | ✅ Separate (email capture) |
| `organization` | `packages/database/src/schema/index.ts` | ✅ Clerk + Stripe integration |

---

## 2. Code to Delete or Rewrite

### DELETE

| File | Reason |
|---|---|
| `apps/web/src/app/[locale]/(auth)/onboarding/crawl/page.tsx` | Content pipeline pre-caching flow. Not part of Phase 0 analytics onboarding. Calls non-existent `/api/onboarding/parse-sitemap` and `/api/onboarding/crawl-status`. |

### REWRITE (Major)

| File | Reason |
|---|---|
| `apps/web/src/app/[locale]/(auth)/onboarding/integrate/page.tsx` | Shows content pipeline rewrite middleware (`api.crawlready.com/render?url=...`). Must show analytics beacon snippets + dual integration (middleware/script tag) per `analytics-onboarding.md`. |
| `apps/web/src/app/[locale]/(auth)/onboarding/layout.tsx` | 3-step flow (Add Site → Pre-Cache → Integrate). Must become the spec'd flow: Add Site → Choose Integration → Verify Integration → Done. |

### REWRITE (Minor / Harden)

| File | What changes |
|---|---|
| `apps/web/src/app/api/v1/ingest/route.ts` | Add Zod validation, centralize bot list, add dedup check, use `waitUntil()`, add correlation ID |
| `apps/web/src/app/api/v1/t/[key]/route.ts` | Centralize bot list import |
| `apps/web/src/app/c.js/route.ts` | Centralize bot list import |
| `apps/web/src/lib/utils/snippets.ts` | Centralize bot list import |
| `apps/web/src/app/api/v1/sites/route.ts` | Add Zod validation |
| `apps/web/src/app/api/v1/sites/[id]/route.ts` | Add Zod validation, add PATCH endpoint |

---

## 3. EPICs and Tasks

### EPIC 1: Foundation & Shared Infrastructure

> Centralize shared code, add validation, establish observability patterns. All other EPICs depend on this.

#### E1-T1: Centralize Bot Registry

**Description:** Create a single source of truth for AI bot detection. Currently duplicated in 4 files.

**Files to create:**
- `packages/core/detection/bot-registry.ts` — bot list, regex, `Set<string>`, bot metadata

**Files to modify:**
- `apps/web/src/app/api/v1/ingest/route.ts` — import from core
- `apps/web/src/app/api/v1/t/[key]/route.ts` — import from core
- `apps/web/src/app/c.js/route.ts` — import from core (or inline for JS output)
- `apps/web/src/lib/utils/snippets.ts` — import from core

**Reference docs:**
- `docs/architecture/analytics-infrastructure.md` §Bot List Management (A5)

**Acceptance criteria:**
- Single `KNOWN_BOTS` Set and `AI_BOTS_REGEX` exported from `packages/core`
- All 4 consumer files import from the shared package
- `c.js` route may inline the regex string for output but sources it from the registry
- Tests: unit test that bot registry contains all expected bots

---

#### E1-T2: Add Zod Validation Schemas

**Description:** Add Zod schemas for all API route inputs per `api-first.md` security patterns.

**Files to create:**
- `apps/web/src/lib/validations/ingest.ts` — Zod schema for ingest payload
- `apps/web/src/lib/validations/sites.ts` — Zod schema for site registration/update

**Files to modify:**
- `apps/web/src/app/api/v1/ingest/route.ts` — use Zod parse
- `apps/web/src/app/api/v1/sites/route.ts` — use Zod parse
- `apps/web/src/app/api/v1/sites/[id]/route.ts` — use Zod parse

**Reference docs:**
- `docs/architecture/api-first.md` §Error Contract
- `docs/architecture/dashboard-vision.md` §Security Patterns

**Acceptance criteria:**
- All API inputs validated via Zod before processing
- Error responses match the `api-first.md` error contract
- Invalid input returns the correct error code and message

---

#### E1-T3: Add Correlation ID Middleware

**Description:** Generate a correlation ID per request and propagate it through logging. Per `diagrams-infrastructure.md` Observability section.

**Files to create:**
- `apps/web/src/lib/utils/correlation.ts` — `getCorrelationId(request)` helper

**Files to modify:**
- `apps/web/src/middleware.ts` — inject `X-Correlation-Id` header
- `apps/web/src/app/api/v1/ingest/route.ts` — log with correlation ID
- `apps/web/src/app/api/v1/sites/route.ts` — log with correlation ID

**Reference docs:**
- `docs/architecture/diagrams-infrastructure.md` §Correlation ID Flow

**Acceptance criteria:**
- Every API response includes `X-Correlation-Id` header
- All log statements include the correlation ID
- If client sends `X-Correlation-Id`, server reuses it

---

#### E1-T4: Implement In-Process LRU Cache for Site Key Lookups

**Description:** Phase 0 uses in-process LRU cache (100 entries, 5-min TTL) for site key → site ID resolution. Currently every ingest request hits the DB.

**Files to create:**
- `apps/web/src/lib/cache/site-key-cache.ts` — LRU cache with TTL

**Files to modify:**
- `apps/web/src/app/api/v1/ingest/route.ts` — use cache before DB lookup
- `apps/web/src/app/api/v1/t/[key]/route.ts` — use cache before DB lookup

**Reference docs:**
- `docs/architecture/analytics-infrastructure.md` §Site Key Caching (A2)

**Acceptance criteria:**
- Cache hit avoids DB query
- Cache invalidated on site delete (via cache.delete)
- 100-entry max, 5-minute TTL
- Tests: cache hit, cache miss, cache expiry, cache invalidation

---

### EPIC 2: Ingest Pipeline Hardening

> Make the ingest pipeline match the 9-step spec. Depends on EPIC 1 (bot registry, Zod, correlation ID, LRU cache).

#### E2-T1: Add 1-Second Dedup Window

**Description:** Per analytics-infrastructure.md Step 7, add a 1-second dedup window to prevent obvious duplicate beacons.

**Files to create:**
- `apps/web/src/lib/cache/dedup-cache.ts` — simple time-based dedup (Map with TTL)

**Files to modify:**
- `apps/web/src/app/api/v1/ingest/route.ts` — check dedup before DB write

**Reference docs:**
- `docs/architecture/analytics-infrastructure.md` §Shared Processing Pipeline Step 7

**Acceptance criteria:**
- Identical `(siteKey, bot, path)` within 1s window → silently deduplicated
- After 1s → treated as new visit (correct behavior)
- Tests: duplicate within 1s rejected, after 1s accepted

---

#### E2-T2: Use `waitUntil()` for Async DB Writes

**Description:** Replace `void db.insert(...).catch()` with Vercel's `waitUntil()` for proper async lifecycle. Current approach risks the promise being garbage-collected if the serverless function exits.

**Files to modify:**
- `apps/web/src/app/api/v1/ingest/route.ts` — use `waitUntil()`
- `apps/web/src/app/api/v1/t/[key]/route.ts` — use `waitUntil()`

**Reference docs:**
- `docs/architecture/analytics-infrastructure.md` §Pipeline Step 8-9
- Vercel `waitUntil` docs

**Acceptance criteria:**
- DB write executes after response is sent
- Write survives function return (not GC'd)
- Error in write doesn't affect response

---

#### E2-T3: Refactor Ingest Route to Match 9-Step Pipeline

**Description:** Restructure the ingest route to clearly follow the 9-step pipeline documented in analytics-infrastructure.md. This task integrates E1-T1 through E1-T4 and E2-T1/T2 into the final route.

**Files to modify:**
- `apps/web/src/app/api/v1/ingest/route.ts` — full refactor

**Reference docs:**
- `docs/architecture/analytics-infrastructure.md` §Shared Processing Pipeline (all 9 steps)

**Pipeline steps mapped:**
1. Parse & normalize input (Zod from E1-T2)
2. Validate bot (bot registry from E1-T1)
3. Server timestamp + replay protection (existing)
4. Site key lookup with LRU cache (E1-T4)
5. Rate limit (existing)
6. Path normalization (existing)
7. Dedup check (E2-T1)
8. Return 204 before DB write (existing)
9. Async DB write via `waitUntil()` (E2-T2)

**Acceptance criteria:**
- Route handler reads as a clear 9-step pipeline
- Each step has a log statement on failure (with correlation ID)
- All silent 204 rejections are distinguishable in logs

---

### EPIC 3: Onboarding Flow Rework

> Rework the onboarding to match the spec'd flow. Independent of EPIC 2 but depends on EPIC 1.

#### E3-T1: Delete Crawl Page & Remove Content Pipeline References

**Description:** Remove the onboarding crawl page and all references to the content pipeline pre-caching flow. This is Phase 2+, not Phase 0.

**Files to delete:**
- `apps/web/src/app/[locale]/(auth)/onboarding/crawl/page.tsx`

**Files to modify:**
- `apps/web/src/app/[locale]/(auth)/onboarding/layout.tsx` — remove crawl step

**Acceptance criteria:**
- No references to `/api/onboarding/parse-sitemap` or `/api/onboarding/crawl-status`
- No references to `api.crawlready.com/render`

---

#### E3-T2: Rewrite Onboarding Layout (Step Flow)

**Description:** Update the onboarding layout to match the spec'd flow from `dashboard-vision.md` §Onboarding Flow.

**New flow (Phase 0 simplified):**
1. Add Site (domain input → site key)
2. Choose Integration (middleware vs. script tag, framework selector, snippet)
3. Verify Integration (synthetic bot request — or skip)
4. Done (summary + go to dashboard)

**Files to modify:**
- `apps/web/src/app/[locale]/(auth)/onboarding/layout.tsx` — new step definitions, progress bar

**Reference docs:**
- `docs/architecture/dashboard-vision.md` §Onboarding Flow
- `docs/architecture/analytics-onboarding.md` §Onboarding Steps

**Acceptance criteria:**
- 4-step progress indicator
- Correct step detection from pathname
- Incomplete onboarding resumes at last step on next login

---

#### E3-T3: Rewrite Integration Page (Dual Model)

**Description:** Rewrite the integrate page to show the correct analytics beacon snippets (NOT content pipeline rewrite middleware). Present dual integration model: Middleware (recommended) and Script Tag (quick start).

**Files to rewrite:**
- `apps/web/src/app/[locale]/(auth)/onboarding/integrate/page.tsx`

**Design:**
- Toggle: [Middleware (recommended)] | [Script Tag]
- If middleware: framework selector + beacon snippet from `snippets.ts`
- If script tag: `<script>` + `<noscript>` tracking pixel snippet
- Pre-filled site key from registration (session storage or API)

**Reference docs:**
- `docs/architecture/analytics-onboarding.md` §Snippet Templates
- `docs/architecture/analytics-infrastructure.md` §Dual Integration
- `docs/architecture/crawler-analytics.md` §Integration Models

**Acceptance criteria:**
- Middleware tab shows correct beacon snippets (fire-and-forget POST to `/api/v1/ingest`)
- Script tag tab shows `<script src="https://crawlready.app/c.js" data-key="..." async>` + `<noscript><img>`
- Framework selector: Next.js, Express, Cloudflare Workers, Generic
- Copy button works
- Site key pre-filled

---

#### E3-T4: Create Verify Integration Page

**Description:** Implement the synthetic bot verification step. CrawlReady sends HTTP requests with AI bot UAs to the user's site, then checks for a matching beacon within 15 seconds.

**Files to create:**
- `apps/web/src/app/[locale]/(auth)/onboarding/verify/page.tsx` — UI (poll for beacon)
- `apps/web/src/app/api/v1/verify-integration/route.ts` — backend (send synthetic requests, check for beacon)

**Reference docs:**
- `docs/architecture/dashboard-vision.md` §Step 4: Verify Integration
- `docs/architecture/analytics-onboarding.md` §Synthetic Bot Verification

**Design:**
- User clicks "Verify my integration"
- Backend sends HTTP GET to user's domain with GPTBot UA
- Backend polls `crawler_visits` for matching beacon (15s timeout)
- Success: "✓ Integration verified! We sent a GPTBot request to your site and received your beacon in X.Xs."
- Failure: troubleshooting tips
- [Try again] + [Skip for now] always available

**Acceptance criteria:**
- `POST /api/v1/verify-integration` sends at least 1 synthetic request
- Polls for beacon receipt within 15s
- Returns success/failure with timing
- UI shows progress + result
- Skip always available

---

#### E3-T5: Create Onboarding Done Page

**Description:** Summary page after onboarding completes.

**Files to create:**
- `apps/web/src/app/[locale]/(auth)/onboarding/done/page.tsx`

**Design:**
- Success checkmark
- Summary: "Your site is live on CrawlReady: AI crawler visits are being tracked"
- Integration method shown
- [Go to Dashboard →] CTA

**Acceptance criteria:**
- Clears onboarding session state
- Links to dashboard

---

#### E3-T6: Handle Incomplete Onboarding (Resume on Login)

**Description:** If user abandons onboarding, next login redirects back to the step they left off. Dashboard empty state links back.

**Files to modify:**
- `apps/web/src/middleware.ts` — check onboarding completion status
- `apps/web/src/app/[locale]/(auth)/dashboard/sites/page.tsx` — empty state links to onboarding

**Reference docs:**
- `docs/architecture/dashboard-vision.md` §Incomplete Onboarding

**Acceptance criteria:**
- User with 0 sites redirected to onboarding
- Dashboard empty state CTA goes to onboarding

---

### EPIC 4: Site Management Improvements

> Enhance the site detail page. Independent of EPICs 2 and 3.

#### E4-T1: Add PATCH Endpoint for Sites

**Description:** Allow updating a site's integration method and other mutable fields.

**Files to modify:**
- `apps/web/src/app/api/v1/sites/[id]/route.ts` — add PATCH handler

**Fields updatable:**
- `integration_method` ('middleware' | 'script_tag')

**Reference docs:**
- `docs/architecture/analytics-onboarding.md` §Site Settings

**Acceptance criteria:**
- Zod-validated input
- Ownership check (clerkUserId)
- Returns updated site

---

#### E4-T2: Add Script Tag Display to Site Detail Page

**Description:** The site detail page currently only shows middleware snippets. Add the script tag snippet display (dual integration).

**Files to modify:**
- `apps/web/src/app/[locale]/(auth)/dashboard/sites/[siteId]/page.tsx` — add toggle and script tag snippet

**Reference docs:**
- `docs/architecture/analytics-onboarding.md` §Snippet Templates
- `docs/architecture/dashboard-vision.md` §Integration Page

**Acceptance criteria:**
- Toggle between middleware and script tag views
- Script tag shows `<script>` + `<noscript>` with site key pre-filled
- Copy button for both

---

#### E4-T3: Add Integration Status Indicator

**Description:** Show the last beacon received time on the site card and detail page. Uses existing analytics endpoint.

**Files to modify:**
- `apps/web/src/app/api/v1/sites/route.ts` — add `last_beacon_at` to GET response
- `apps/web/src/app/[locale]/(auth)/dashboard/sites/page.tsx` — display status
- `apps/web/src/app/[locale]/(auth)/dashboard/sites/[siteId]/page.tsx` — display status

**Reference docs:**
- `docs/architecture/dashboard-vision.md` §Integration Status Banner

**Acceptance criteria:**
- "Last beacon: 2 minutes ago" or "No beacons received"
- Green/amber/red indicator based on recency

---

### EPIC 5: Dashboard Shell (Phase 0 Minimal)

> Scope-constrained to what Phase 0 actually needs. Full sidebar is Phase 1.

#### E5-T1: Improve Dashboard Empty States

**Description:** The empty state for 0 sites should direct to onboarding. The empty state messaging should match the vision doc.

**Files to modify:**
- `apps/web/src/app/[locale]/(auth)/dashboard/sites/page.tsx` — improved empty state per dashboard-vision.md

**Reference docs:**
- `docs/architecture/dashboard-vision.md` §Adaptive Dashboard Home

**Acceptance criteria:**
- 0 sites → empty state with icon + message + "Add Your First Site" CTA
- CTA goes to `/onboarding/add-site`

---

#### E5-T2: Add Integration Tab to Site Detail Page

**Description:** The site detail page should have a tabbed layout with Setup, Status, and Site Key sections per the dashboard vision's Integration page spec.

**Files to modify:**
- `apps/web/src/app/[locale]/(auth)/dashboard/sites/[siteId]/page.tsx` — add tabbed layout

**Reference docs:**
- `docs/architecture/dashboard-vision.md` §Integration Page

**Acceptance criteria:**
- Tab 1 (Setup): integration type toggle, framework selector, snippet
- Tab 2 (Status): last beacon time, total beacons count
- Tab 3 (Site Key): masked key, copy button

---

### EPIC 6: Testing & Quality

> Tests for all new and modified code. Can run in parallel with implementation.

#### E6-T1: API Route Tests

**Description:** Unit/integration tests for all API routes.

**Files to create:**
- `apps/web/src/app/api/v1/ingest/__tests__/route.test.ts`
- `apps/web/src/app/api/v1/sites/__tests__/route.test.ts`
- `apps/web/src/app/api/v1/t/__tests__/route.test.ts`

**Test coverage:**
- Ingest: valid payload, missing fields, invalid bot, replay attack, rate limit, dedup
- Sites: CRUD, ownership check, limit check, duplicate domain
- Tracking pixel: bot detection, non-bot passthrough

---

#### E6-T2: Shared Utility Tests

**Description:** Unit tests for shared code.

**Files to create:**
- `packages/core/detection/__tests__/bot-registry.test.ts`
- `apps/web/src/lib/cache/__tests__/site-key-cache.test.ts`
- `apps/web/src/lib/cache/__tests__/dedup-cache.test.ts`
- `apps/web/src/lib/validations/__tests__/ingest.test.ts`

---

---

## 4. Dependency Graph

```
EPIC 1: Foundation (must complete first)
├── E1-T1: Bot Registry          ─┐
├── E1-T2: Zod Validation         ├── All independent, can parallelize
├── E1-T3: Correlation ID         │
└── E1-T4: LRU Cache             ─┘
        │
        ▼
EPIC 2: Ingest Hardening (depends on EPIC 1)
├── E2-T1: Dedup Window         ─── depends on E1-T4 (cache pattern)
├── E2-T2: waitUntil()          ─── independent
└── E2-T3: 9-Step Refactor      ─── depends on ALL of E1 + E2-T1 + E2-T2
        │
        ▼ (E2-T3 is the integration task)

EPIC 3: Onboarding Rework (depends on E1-T1, E1-T2)
├── E3-T1: Delete Crawl Page    ─── independent
├── E3-T2: Layout Rework        ─── independent
├── E3-T3: Integration Page     ─── depends on E1-T1 (bot registry for snippets)
├── E3-T4: Verify Integration   ─── depends on E2-T3 (ingest must work)
├── E3-T5: Done Page            ─── independent
└── E3-T6: Incomplete Handling  ─── depends on E3-T2

EPIC 4: Site Management (depends on E1-T2)
├── E4-T1: PATCH Endpoint       ─── depends on E1-T2 (Zod)
├── E4-T2: Script Tag Display   ─── independent
└── E4-T3: Status Indicator     ─── independent

EPIC 5: Dashboard Shell
├── E5-T1: Empty States         ─── independent
└── E5-T2: Tabbed Detail Page   ─── depends on E4-T2, E4-T3

EPIC 6: Testing (parallel with implementation)
├── E6-T1: API Route Tests      ─── after EPIC 2
└── E6-T2: Utility Tests        ─── after EPIC 1
```

### Parallel Execution Groups

**Wave 1 (No dependencies — fully parallel):**
- E1-T1: Bot Registry
- E1-T2: Zod Validation
- E1-T3: Correlation ID
- E1-T4: LRU Cache
- E3-T1: Delete Crawl Page
- E3-T2: Layout Rework
- E3-T5: Done Page
- E4-T2: Script Tag Display
- E4-T3: Status Indicator
- E5-T1: Empty States

**Wave 2 (Depends on Wave 1):**
- E2-T1: Dedup Window (needs E1-T4)
- E2-T2: waitUntil() (needs E1-T3 for correlation)
- E3-T3: Integration Page (needs E1-T1)
- E3-T6: Incomplete Handling (needs E3-T2)
- E4-T1: PATCH Endpoint (needs E1-T2)
- E6-T2: Utility Tests (needs E1-*)

**Wave 3 (Integration — depends on Wave 2):**
- E2-T3: 9-Step Refactor (needs all E1 + E2-T1 + E2-T2)
- E5-T2: Tabbed Detail Page (needs E4-T2, E4-T3)

**Wave 4 (End-to-end — depends on Wave 3):**
- E3-T4: Verify Integration (needs E2-T3)
- E6-T1: API Route Tests (needs E2-T3)

---

## 5. Reference Document Map

| Task | Must-Read Docs |
|---|---|
| E1-T1 Bot Registry | `analytics-infrastructure.md` §A5, `crawler-analytics.md` §Bot Detection |
| E1-T2 Zod Validation | `api-first.md` §Error Contract |
| E1-T3 Correlation ID | `diagrams-infrastructure.md` §Observability |
| E1-T4 LRU Cache | `analytics-infrastructure.md` §A2 |
| E2-T1 Dedup | `analytics-infrastructure.md` §Pipeline Step 7 |
| E2-T2 waitUntil | `analytics-infrastructure.md` §Pipeline Step 8-9 |
| E2-T3 9-Step Refactor | `analytics-infrastructure.md` §Shared Processing Pipeline (full) |
| E3-T1 Delete Crawl | `product/vision.md` §Phase 0 IN/OUT |
| E3-T2 Layout | `dashboard-vision.md` §Onboarding Flow |
| E3-T3 Integration Page | `analytics-onboarding.md` §Snippet Templates, `analytics-infrastructure.md` §Dual Integration |
| E3-T4 Verify | `dashboard-vision.md` §Step 4, `analytics-onboarding.md` §Synthetic Bot Verification |
| E3-T5 Done Page | `dashboard-vision.md` §Step 6 |
| E3-T6 Incomplete | `dashboard-vision.md` §Incomplete Onboarding |
| E4-T1 PATCH | `analytics-onboarding.md` §Site Settings |
| E4-T2 Script Tag | `analytics-onboarding.md` §Snippet Templates, `analytics-infrastructure.md` §Script-Tag Path |
| E4-T3 Status | `dashboard-vision.md` §Integration Status Banner |
| E5-T1 Empty States | `dashboard-vision.md` §Adaptive Dashboard Home |
| E5-T2 Tabbed Detail | `dashboard-vision.md` §Integration Page |

---

## 6. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Synthetic bot verification blocked by firewalls | Skip always available; troubleshooting tips in UI |
| In-process LRU not shared across Vercel isolates | Documented limitation; migrate to Upstash Redis in Phase 1 |
| Bot list update propagation for middleware users | Dashboard notification + snippet version display |
| Rate limiter per-isolate on Vercel | Documented; sufficient for Phase 0 abuse prevention |
| `waitUntil()` not available in dev mode | Fallback to `void` promise in development |

---

## 7. Out of Scope (Phase 1+)

Per `docs/product/vision.md` §Phase 0 OUT:
- Analytics dashboard UI (charts, per-crawler breakdown, per-page views)
- Alerts system
- Domain verification (meta tag)
- Site key rotation
- Data export
- Hidden backlink injection
- Sidebar navigation (current header nav is acceptable for Phase 0)
- Org-scoped sites (clerkUserId → orgId migration deferred)

---

## Decisions

- **Crawl page deleted:** Content pipeline pre-caching is Phase 2+. The crawl page calls non-existent APIs and shows the wrong integration model.
- **Integrate page rewritten:** Must show analytics beacon snippets, not content pipeline rewrite middleware.
- **4-step onboarding:** Add Site → Choose Integration → Verify → Done. Simpler than the 6-step vision (optimization activation is Phase 2).
- **Header nav kept for Phase 0:** Full sidebar migration deferred to Phase 1 to maintain scope discipline.
- **Bot registry in packages/core:** Matches the spec and eliminates the 4-way duplication.
- **LRU cache is per-isolate:** Accepted limitation for Phase 0. Redis in Phase 1.
