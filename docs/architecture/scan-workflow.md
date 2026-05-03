# Architecture: Scan & Scoring Workflow

The complete scan plane — from URL submission to score page generation. Covers the state machine, multi-step orchestration, partial failure handling, score page architecture, and cost tracking. Integrates gaps C1, C3, C5, C6, C7, S4, S5, S6 from the [gap analysis](./architectural-gap-analysis.md).

**Scope:** Scan plane only. For the analytics/ingest plane, see [analytics-infrastructure.md](./analytics-infrastructure.md). For the unified infrastructure topology, see [infrastructure-overview.md](./infrastructure-overview.md).

---

## Scan State Machine (from Gap C1)

Every scan is a multi-step workflow with explicit state transitions:

```
                  ┌───────────┐
                  │  PENDING   │  POST /api/v1/scan creates scan row
                  └─────┬─────┘
                        │ Trigger async crawl
                        ▼
                  ┌───────────┐
                  │  CRAWLING  │  Firecrawl + direct HTTP + probes
                  └─────┬─────┘
                        │
                  ┌─────┴─────┐
                  │           │
                  ▼           ▼
            All checks    Any required
            succeed       check fails
                  │           │
                  ▼           │
            ┌───────────┐    │
            │  SCORING   │    │    Retry 2x with backoff
            └─────┬─────┘    │    then mark as FAILED
                  │           │
          ┌───────┴───────┐  │
          │               │  │
          ▼               ▼  ▼
    ┌───────────┐  ┌──────────┐  ┌─────────┐
    │  COMPLETE  │  │  PARTIAL  │  │  FAILED  │
    │            │  │           │  │          │
    │ All checks │  │ Some      │  │ Required │
    │ passed     │  │ non-req   │  │ check    │
    │            │  │ checks    │  │ failed   │
    │            │  │ failed    │  │          │
    └───────────┘  └──────────┘  └─────────┘
```

**States:**
- **PENDING** — Scan row created, URL validated, awaiting async processing
- **CRAWLING** — Firecrawl API call in progress, plus parallel probes (content negotiation, llms.txt, robots.txt, standards checks)
- **SCORING** — All crawl data received, scoring pipeline running
- **COMPLETE** — All checks passed, scores computed, results stored
- **PARTIAL** — Some non-required checks failed, scores computed from available data
- **FAILED** — A required check (rendered view or bot view) failed after retries

---

## Scan Workflow — Step by Step

```
Step 1: Request Validation & Scan Creation
  Endpoint: POST /api/v1/scan
  ┌──────────────────────────────────────────────────────────────┐
  │  1. Rate limit check (Upstash Redis: scan:ip:{ip} → 3/hr)  │
  │  2. URL validation (packages/core/url-normalize.ts):        │
  │     - Must be valid HTTP/HTTPS URL                          │
  │     - Normalize: lowercase host, strip trailing slash,      │
  │       remove www prefix, remove fragments                   │
  │     - Reject: localhost, private IPs, too-long URLs         │
  │  3. Budget circuit breaker check (Upstash: budget key)      │
  │  4. Honeypot field validation (anti-abuse, not CAPTCHA)     │
  │  5. CREATE scan row:                                        │
  │     INSERT INTO scans (url, domain, status, correlation_id) │
  │     VALUES ($1, $2, 'pending', gen_random_uuid())           │
  │  6. Return immediately:                                     │
  │     { scan_id, correlation_id, status: 'pending' }          │
  │  7. Trigger async processing via waitUntil() or Vercel      │
  │     Background Function                                     │
  └──────────────────────────────────────────────────────────────┘

Step 2: Async Crawl Execution
  Runtime: Vercel Background Function (60s timeout on Pro)
  ┌──────────────────────────────────────────────────────────────┐
  │  UPDATE scans SET status = 'crawling',                      │
  │    crawl_started_at = NOW() WHERE id = $scan_id             │
  │                                                              │
  │  Execute in parallel:                                        │
  │  ┌────────────────────────────────────────────────────────┐ │
  │  │ REQUIRED:                                               │ │
  │  │  a. Rendered view (Firecrawl API — JS execution)       │ │
  │  │     → Full DOM, computed styles, accessibility tree     │ │
  │  │     → Retry 2x on failure (backoff: 1s, 3s)           │ │
  │  │  b. Bot view (direct HTTP GET with AI bot UA)          │ │
  │  │     → Raw HTML as received by GPTBot/ClaudeBot         │ │
  │  │     → Retry 2x on failure                              │ │
  │  ├────────────────────────────────────────────────────────┤ │
  │  │ NON-REQUIRED (fail silently):                          │ │
  │  │  c. Content negotiation probe                          │ │
  │  │     → HEAD with Accept: text/markdown → check 200/406  │ │
  │  │  d. llms.txt check                                     │ │
  │  │     → GET {origin}/.well-known/llms.txt (or /llms.txt) │ │
  │  │  e. robots.txt parse                                   │ │
  │  │     → GET {origin}/robots.txt → parse AI bot rules     │ │
  │  │  f. Schema.org detection (from Firecrawl HTML output)  │ │
  │  │     → Extract existing JSON-LD, microdata, RDFa        │ │
  │  │  g. Standards adoption probes (3 parallel HEAD reqs):  │ │
  │  │     → sitemap.xml presence check                       │ │
  │  │     → MCP Server Card (.well-known/mcp/server-card)    │ │
  │  │     → API Catalog (.well-known/api-catalog)            │ │
  │  │  h. Accessibility tree analysis (from rendered DOM)    │ │
  │  └────────────────────────────────────────────────────────┘ │
  │                                                              │
  │  Record Firecrawl cost:                                     │
  │    UPDATE scans SET firecrawl_cost_cents = $cost             │
  │    INCRBY budget:firecrawl:daily:{date} $cost (Redis)       │
  └──────────────────────────────────────────────────────────────┘

Step 3: Scoring Pipeline
  ┌──────────────────────────────────────────────────────────────┐
  │  UPDATE scans SET status = 'scoring',                       │
  │    scoring_started_at = NOW() WHERE id = $scan_id           │
  │                                                              │
  │  Compute (all from packages/core — pure functions):         │
  │                                                              │
  │  1. Crawlability Score (0-100):                             │
  │     - Content visibility ratio (rendered vs bot view)       │
  │     - Structural clarity (headings, lists, semantic HTML)   │
  │     - Noise ratio (scripts/styles as % of payload)          │
  │     - Schema.org presence                                   │
  │     - robots.txt AI bot rules                               │
  │     See: scoring-detail.md §Crawlability                    │
  │                                                              │
  │  2. Agent Readiness Score (0-100):                          │
  │     - Structured data completeness (0-25 pts)               │
  │     - Content negotiation readiness (0-25 pts)              │
  │     - Machine-actionable data (0-30 pts)                    │
  │     - Standards adoption (0-20 pts)                         │
  │     See: scoring-detail.md §Agent Readiness                 │
  │                                                              │
  │  3. Agent Interaction Score (0-100):                        │
  │     - Semantic HTML quality                                 │
  │     - Interactive element accessibility                     │
  │     - Navigation structure                                  │
  │     - Visual-semantic consistency                           │
  │     See: scoring-detail.md §Agent Interaction               │
  │                                                              │
  │  4. AI Readiness Score (composite):                         │
  │     = 50% Crawlability + 25% Agent Readiness                │
  │       + 25% Agent Interaction                               │
  │     See: scoring-algorithm.md                               │
  │                                                              │
  │  5. EU AI Act Transparency Checklist (4 binary checks)     │
  │     See: scoring-detail.md §EU AI Act                       │
  │                                                              │
  │  6. Schema Generation Preview                               │
  │     - Run pattern detectors on crawled HTML                 │
  │     - Detect: FAQPage, Product, HowTo, Organization        │
  │     - Store detected patterns + preview JSON-LD             │
  │     - Display-only in Phase 0 (generation in paid tier)     │
  │     See: multi-format-serving.md §Phase 0 Impact            │
  │                                                              │
  │  7. Recommendations engine                                  │
  │     - Prioritized list of actionable fixes                  │
  │     - Generated from scores + detected issues               │
  └──────────────────────────────────────────────────────────────┘

Step 4: Result Storage & Score Page
  ┌──────────────────────────────────────────────────────────────┐
  │  UPDATE scans SET                                            │
  │    status = 'complete' (or 'partial'),                      │
  │    ai_readiness_score = $score,                             │
  │    crawlability_score = $crawl_score,                       │
  │    agent_readiness_score = $agent_score,                    │
  │    agent_interaction_score = $interaction_score,             │
  │    recommendations = $recommendations_jsonb,                │
  │    schema_preview = $schema_preview_jsonb,                  │
  │    checks_completed = $completed,                           │
  │    checks_total = $total,                                   │
  │    checks_failed = $failed_array,                           │
  │    data_quality = 'full' | 'partial',                       │
  │    completed_at = NOW()                                     │
  │  WHERE id = $scan_id                                        │
  │                                                              │
  │  Trigger ISR revalidation for /score/{domain}               │
  │  (Next.js revalidatePath or on-demand ISR)                  │
  └──────────────────────────────────────────────────────────────┘
```

---

## Partial Failure Strategy (from Gap C3)

**Principle:** Always show what we have. Never discard partial results.

### Per-Check Failure Model

| Check | Required? | On Failure | Score Impact |
|---|---|---|---|
| Rendered view (Firecrawl) | **Yes** | Retry 2x → scan FAILED | Cannot compute any score |
| Bot view (direct HTTP) | **Yes** | Retry 2x → scan FAILED | Cannot compute crawlability |
| Content negotiation probe | No | Mark "not tested", skip | Agent Readiness: content negotiation section = 0 |
| llms.txt check | No | Mark "not found", skip | Agent Readiness: llms.txt check = 0 |
| robots.txt parse | No | Assume no restrictions | Crawlability: robots.txt check = N/A |
| Schema.org detection | No | Score as 0 | Crawlability: Schema check = 0 |
| Standards adoption probes | No | Each probe independent | Agent Readiness: per-probe scoring |
| Accessibility tree parse | No | Agent Interaction = N/A | Reweight: AI Readiness = 67% Crawl + 33% Agent Readiness |

### Score Reweighting on Missing Data

```
Standard weights:
  AI Readiness = 50% Crawlability + 25% Agent Readiness + 25% Agent Interaction

If Agent Interaction data unavailable:
  AI Readiness = 67% Crawlability + 33% Agent Readiness
  Display: "Based on available data — Agent Interaction check could not complete"

If Agent Readiness data unavailable:
  AI Readiness = 67% Crawlability + 33% Agent Interaction
  Display: "Based on available data — Agent Readiness check could not complete"

If both unavailable (only Crawlability available):
  AI Readiness = 100% Crawlability
  Display: "Limited diagnostic — only crawlability data available"
```

### API Response Contract

```json
{
  "scan_id": 123,
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "partial",
  "checks_completed": 7,
  "checks_total": 9,
  "checks_failed": ["content_negotiation", "llms_txt"],
  "data_quality": "partial",
  "scores": {
    "ai_readiness": 42,
    "crawlability": 23,
    "agent_readiness": 61,
    "agent_interaction": null
  },
  "reweight_applied": false,
  "recommendations": [ ... ],
  "schema_preview": { ... }
}
```

---

## Client Polling Flow

The diagnostic UI polls for scan completion:

```
Client                           Server

POST /api/v1/scan
  { url: "https://example.com" }
  ──────────────────────────────▶
                                  Create scan (PENDING)
  ◀──────────────────────────────
  { scan_id: 123, status: "pending" }

  (poll every 2 seconds, max 30 polls = 60s timeout)

GET /api/v1/scan/123/status
  ──────────────────────────────▶
  ◀──────────────────────────────
  {
    "scan_id": 123,
    "status": "crawling",
    "progress_pct": 30,
    "checks_completed": 2,
    "checks_total": 9,
    "eta_seconds": 12
  }

  ... (2 seconds later) ...

GET /api/v1/scan/123/status
  ──────────────────────────────▶
  ◀──────────────────────────────
  {
    "scan_id": 123,
    "status": "scoring",
    "progress_pct": 75,
    "checks_completed": 8,
    "checks_total": 9,
    "eta_seconds": 4
  }

  ... (2 seconds later) ...

GET /api/v1/scan/123/status
  ──────────────────────────────▶
  ◀──────────────────────────────
  {
    "scan_id": 123,
    "status": "complete",
    "progress_pct": 100,
    "redirect_url": "/score/example.com"
  }

  Client redirects to /score/example.com
```

**Timeout handling:** If 30 polls (60s) pass without COMPLETE/PARTIAL/FAILED:
- Client shows: "This is taking longer than usual. Your results will be available at [score URL]."
- Scan continues in background regardless of client disconnect
- Score page auto-updates when scan completes (ISR revalidation)

---

## Score Page Architecture (from Gap C7)

Public score pages (`/score/{domain}`) are CrawlReady's primary distribution engine.

### Rendering Strategy: ISR (Incremental Static Regeneration)

```
/score/{domain}
  ├── ISR with 1-hour revalidation interval
  ├── First request generates static page
  ├── Subsequent requests served from cache
  ├── On-demand revalidation triggered when new scan completes
  ├── Fallback: 'blocking' (first visit waits for generation)
  └── Stale page served while revalidation happens in background
```

### OG Image Generation (Vercel OG)

```
/api/og/score/{domain}
  ├── Dynamic social preview image generated at edge
  ├── Shows: AI Readiness Score (large), 3 sub-scores, domain
  ├── Cached by social platforms after first fetch
  └── Uses @vercel/og (Satori + Resvg, < 100ms at edge)

Meta tags on /score/{domain}:
  <meta property="og:title" content="AI Readiness Score: 42/100 — example.com" />
  <meta property="og:description" content="Crawlability: 23 | Agent Readiness: 61 | Agent Interaction: 55" />
  <meta property="og:image" content="https://crawlready.app/api/og/score/example.com" />
  <meta property="og:url" content="https://crawlready.app/score/example.com" />
  <meta name="twitter:card" content="summary_large_image" />
```

### Sitemap & SEO

```
/sitemap-scores.xml (dynamic, regenerated daily)
  ├── Lists all domains with COMPLETE scans
  ├── <lastmod> from scan.completed_at
  ├── <changefreq>weekly</changefreq>
  ├── <priority>0.7</priority>
  └── Max 50,000 URLs per sitemap (split if needed)

/robots.txt
  ├── Allow: /score/*
  ├── Sitemap: https://crawlready.app/sitemap-scores.xml
  └── Disallow: /api/, /dashboard/
```

### Structured Data on Score Pages

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "AI Readiness Score: example.com",
  "description": "AI crawlability diagnostic for example.com",
  "url": "https://crawlready.app/score/example.com",
  "dateModified": "2026-04-20T14:30:00Z",
  "publisher": {
    "@type": "Organization",
    "name": "CrawlReady",
    "url": "https://crawlready.app"
  }
}
```

### Score Freshness Indicator

```
Score Page UI:
  ┌───────────────────────────────────────────┐
  │  AI Readiness Score: 42/100               │
  │  Last scanned: 2 hours ago ✓ Fresh        │
  │                                            │
  │  [Rescan now] ← triggers new scan         │
  │                                            │
  │  Freshness rules:                          │
  │    < 24h  → ✓ Fresh (green)               │
  │    1-7d   → ⚠ Recent (yellow)             │
  │    > 7d   → ⚡ Stale — rescan recommended  │
  └───────────────────────────────────────────┘
```

---

## Scan Result URL Strategy (from Gap S6)

Two URL patterns for accessing scan results:

```
Latest Score (canonical, shareable):
  GET /score/{domain}
  → Always shows the most recent COMPLETE scan
  → ISR-cached, revalidated on new scan
  → This is the URL users share on Twitter, Show HN, etc.

Historical Scan (permalink):
  GET /score/{domain}/{scan_id}
  → Shows a specific scan result (immutable)
  → Useful for: "my score improved from 23 to 67"
  → Phase 1: add comparison view between two scans

API Equivalents:
  GET /api/v1/score/{domain}         → latest COMPLETE scan data
  GET /api/v1/score/{domain}/history → list of past scans
  GET /api/v1/scan/{scan_id}         → specific scan data
```

---

## Cost Budget Enforcement (from Gap S4)

Every scan has a measurable cost. The system tracks and enforces budget limits.

```
Per-Scan Cost Tracking:

  1. Before Firecrawl call:
     Check budget:firecrawl:daily:{date} in Redis
     If >= hard_limit → reject scan (503)
     If >= soft_limit → log warning, allow but alert

  2. After Firecrawl response:
     Record cost in scan row: firecrawl_cost_cents
     Increment daily counter: INCRBY budget:firecrawl:daily:{date} $cost
     Set TTL on counter: EXPIRE 48h (auto-cleanup)

  3. Daily budget calculation:
     Monthly Firecrawl plan: $19 (500 credits)
     Daily budget: $19 / 30 ≈ $0.63/day ≈ 63 cents
     Soft limit (80%): 50 cents/day
     Hard limit (100%): 63 cents/day

     At $0.001-0.05 per page:
       Conservative: 63 / 0.05 = ~12 scans/day at expensive pages
       Optimistic:   63 / 0.001 = ~630 scans/day at cheap pages
       Expected:     ~50-100 scans/day at mixed complexity

  4. Alert flow:
     soft_limit reached → Sentry custom event → email alert
     hard_limit reached → Sentry custom event → scans return 503
     Daily reset: midnight UTC (Redis key expires naturally)
```

---

## CrawlProvider Abstraction (from Gap I6)

The crawling provider is accessed through an interface, enabling provider swaps without code changes.

```typescript
// packages/core/types/crawl-provider.ts

interface CrawlRequest {
  url: string;
  user_agent?: string;
  render_js: boolean;
  timeout_ms: number;
  correlation_id: string;
}

interface CrawlResponse {
  html: string;
  markdown?: string;
  metadata: {
    status_code: number;
    content_type: string;
    response_time_ms: number;
    rendered: boolean;
  };
  cost_cents: number;
  screenshot_url?: string;
  accessibility_tree?: object;
}

interface CrawlProvider {
  name: string;
  crawl(request: CrawlRequest): Promise<CrawlResponse>;
  checkHealth(): Promise<boolean>;
  estimateCost(request: CrawlRequest): number;
}
```

**Phase 0 implementation:** `FirecrawlProvider` in `apps/web/lib/crawl-providers/firecrawl.ts`. Mock provider in `packages/core/fixtures/` for testing. See [crawling-provider.md](./crawling-provider.md) for provider comparison.

---

## Webhook Security (from Gap S5)

For inbound webhooks (Phase 1: customer deploy hooks, Phase 2: `POST /api/v1/recache`):

```
HMAC Signing:

  Customer registers webhook in dashboard → CrawlReady generates:
    webhook_secret: whsec_{32_random_chars}

  Customer includes in webhook request:
    X-CrawlReady-Signature: sha256={hmac_hex}
    X-CrawlReady-Timestamp: {unix_epoch_seconds}

  Server verification:
    1. Check timestamp is within ±5 minutes (replay protection)
    2. Compute HMAC-SHA256(webhook_secret, timestamp + "." + request_body)
    3. Constant-time compare with provided signature
    4. Reject on mismatch (401)

  Phase 0: Not needed (no inbound webhooks)
  Phase 1: Implement for POST /api/v1/recache
```

---

## Decisions

- **State machine in Supabase:** Scan status stored as TEXT column, transitions enforced in application code (packages/core). No separate state machine library — the workflow is simple enough for explicit state transitions.
- **Async via waitUntil/Background Functions:** Phase 0 uses Vercel's `waitUntil()` or Background Functions for the async crawl. No external queue. Queue added in Phase 1 when concurrent scans > 50.
- **Partial results always shown:** The system never discards partial data. If 7 of 9 checks complete, the user sees 7 of 9 results with clear messaging about what's missing.
- **ISR for score pages:** 1-hour revalidation + on-demand revalidation on new scan. Balances freshness with server cost. Score pages are the most important pages on the site.
- **OG images via Vercel OG:** Dynamic social preview images generated at edge. Critical for viral sharing — a score screenshot in a tweet drives clicks.
- **Budget circuit breaker is mandatory:** Not optional, not "nice to have." A single bad day without budget enforcement can exhaust the monthly Firecrawl plan.
- **CrawlProvider interface from day 1:** Even though Phase 0 only uses Firecrawl, the interface enables testing with mock providers and migration to Playwright in Phase 2.
- **Polling, not WebSocket:** Client polls every 2s for scan status. WebSocket adds complexity with no material UX benefit for a 10-30s operation. Max 30 polls = 60s timeout.
- **Scan permalinks:** Both `/score/{domain}` (latest) and `/score/{domain}/{scan_id}` (historical). Enables "my score improved" narratives that drive sharing.
