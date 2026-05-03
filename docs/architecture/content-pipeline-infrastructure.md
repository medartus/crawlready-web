# Architecture: Content Pipeline & Serving Infrastructure

Long-term target architecture for CrawlReady's content ingestion, transformation, caching, and serving infrastructure. This is the system that makes "every page on a customer's site discoverable and optimized for LLMs" a reality.

**Scope:** Content pipeline and serving infrastructure only. Platform concerns (billing, dashboard, auth) are in existing docs.

**Relationship to phases:** This describes the target-state architecture. Phase 0-1 uses simplified versions (Firecrawl API, Vercel serverless, Supabase). This doc shows where those evolve to at scale.

---

## Design Principles

1. **Pre-crawl what you know, generate on-the-fly what you don't.** Warm cache for discovered pages. Synthesize on cache miss with async backfill. Never let a bot request go unserved.
2. **The content pipeline is the product.** Every other component consumes pipeline output. Pipeline quality determines competitive differentiation.
3. **Edge-native serving.** Bot responses served from nearest PoP. The pipeline writes to the edge; the edge never calls origin.
4. **HTML-first, Markdown opt-in.** Pipeline produces Optimized HTML (Schema.org + ARIA enrichments + noise-stripped) as the default for all requests. Markdown served only when explicitly requested via `Accept: text/markdown`. New formats added only when a real consumer exists with a working delivery mechanism.
5. **Cost scales with value, not traffic.** Cached responses cost ~$0 to serve. Only fresh crawls incur meaningful cost. Decouple "serve" cost from "generate" cost.
6. **Tier-aware resource allocation.** Starter customers get budget-conservative defaults (mostly on-the-fly). Business/Enterprise get aggressive pre-crawling. One algorithm does not fit all price points.
7. **Leverage platform primitives.** Cloudflare Markdown for Bots handles basic HTML→Markdown conversion for SSR sites natively. CrawlReady adds value on top: Schema.org injection, CSR rendering, content quality, analytics, and optimization intelligence.
8. **Customer infrastructure stays in control.** At Level 2 (middleware), the customer's stack calls CrawlReady. At Level 3 (DNS proxy), CrawlReady proxies but never modifies human traffic.

---

## System Overview

```
┌────────────────────────────────────────────────────────────┐
│                     CONTROL PLANE                           │
│                                                             │
│  Site Registry │ Page Tree Manager │ Scheduler │ Metering   │
│  (tenants,     │ (discovery,       │ (crawl    │ (rate      │
│   domains)     │  inventory)       │  orch.)   │  limits)   │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                      DATA PLANE                             │
│                                                             │
│  Crawl Workers │ Transform Pipeline │ Cache Store │ Change  │
│  (headless     │ (Schema gen, ARIA, │ (HTML+Md    │ Detect  │
│   browser)     │  Md + Enriched HTML)│  per-page)  │ (diff)  │
└───────────────────────────┬────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│                    SERVING PLANE                            │
│            Edge Network (Cloudflare Workers)                │
│                                                             │
│  Bot Detector → Format Router → Cache Lookup → Fallback    │
│                                                             │
│  Modes:                                                     │
│  - Level 2: Customer middleware calls CrawlReady edge       │
│  - Level 3: DNS proxy, CrawlReady handles full routing      │
└────────────────────────────────────────────────────────────┘
```

---

## 1. Site Coverage & Page Discovery

> **Framing note:** Internally this is "discovery." To the customer it's **coverage** — "how many of my pages are optimized?" The customer never sees discovery mechanics. They see a coverage percentage, a list of optimized pages, and time-to-first-optimization for new content.

### Discovery Pipeline (Internal)

```
Site Registration
       │
       ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Sitemap Parser│  │ robots.txt   │  │ HTML Link    │
│ (XML, index,  │  │ Parser       │  │ Crawler      │
│  RSS/Atom)    │  │ (directives, │  │ (breadth-    │
│               │  │  sitemap loc)│  │  first <a>)  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └─────────────────┼─────────────────┘
                         ▼
                ┌────────────────┐
                │ Page Tree       │
                │ Reconciler      │
                │ (dedup, norm,   │
                │  robots.txt,    │
                │  prioritize)    │
                └────────┬───────┘
                         ▼
                ┌────────────────┐
                │ Page Inventory  │
                │ (per tenant)    │
                └────────────────┘
```

### Discovery Sources (Priority Order)

| Source | Signal Quality | Cost | Frequency |
|---|---|---|---|
| **Customer webhook** (deploy hook) | Highest — explicit | $0 | On-push |
| **Sitemap XML** | High — canonical list | 1 HTTP GET | Every 6h |
| **RSS/Atom feed** | High for content sites | 1 HTTP GET | Every 1h |
| **Sitemap `<lastmod>`** | Medium | Parsed from sitemap | With fetch |
| **Breadth-first link crawl** | Medium — discovers orphans | 1 crawl/page | Weekly |
| **robots.txt `Sitemap:` directive** | Bootstrap hint | 1 HTTP GET | On registration |
| **Bot traffic logs** (analytics middleware) | High intent | $0 (beacon) | Real-time |

### Page Inventory Data Model

```sql
CREATE TABLE page_inventory (
  tenant_id       UUID NOT NULL,
  url             TEXT NOT NULL,
  domain          TEXT NOT NULL,
  discovered_via  TEXT NOT NULL,  -- sitemap, link_crawl, webhook, bot_traffic, manual
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_crawled_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ,  -- from sitemap <lastmod> or HTTP headers
  content_hash    TEXT,           -- SHA-256 of extracted text
  status          TEXT NOT NULL DEFAULT 'active',  -- active, removed, redirect, error
  priority        FLOAT NOT NULL DEFAULT 0.5,      -- 0.0-1.0
  cache_formats   JSONB DEFAULT '{}',              -- {md: true, html: true, json: false}
  etag            TEXT,
  ttl_override    INT,           -- per-page TTL override (seconds)
  PRIMARY KEY (tenant_id, url)
);

CREATE INDEX idx_page_crawl_priority
  ON page_inventory (tenant_id, status, priority DESC, last_crawled_at ASC)
  WHERE status = 'active';
```

### Page Removal & Decay Detection

**Removal flow (extended retention — 30 days, not 7):**

1. **Soft-delete** — `status = 'removed'`, retain cache 30 days
2. **Serve 410 to bots** — signals de-indexing
3. **Alert customer** — "15 pages removed since last crawl"
4. **After 30 days with no bot visits:** hard-delete cache
5. **After 30 days with bot visits:** alert customer — "This page was removed but bots are still visiting it. Do you want to redirect it?"

**Cache decay tiers (for active pages with no traffic):**

| Bot visits in last 90 days | Decay Tier | Cache behavior |
|---|---|---|
| 10+ | **Hot** | Normal TTL, pre-crawl priority |
| 1-9 | **Warm** | Extended TTL (2x default), pre-crawl if budget allows |
| 0 | **Cold** | On-the-fly only, 30-day TTL, no proactive refresh |
| 0 for 180+ days | **Frozen** | Cache retained but never refreshed. Serve stale-if-requested. |

### Coverage Dashboard (Customer-Facing)

```
Dashboard → "Site Coverage"
┌─────────────────────────────────────────────────┐
│  Pages Optimized: 347 / 412 (84%)               │
│  [████████████████░░░░] 84%                      │
│                                                   │
│  ⚠ 65 pages not yet optimized:                   │
│    - 42 discovered today (processing...)          │
│    - 18 returned errors on crawl                  │
│    - 5 blocked by robots.txt                      │
│                                                   │
│  New content pickup: ~6 hours (via sitemap)       │
│  Fastest: add deploy webhook → < 30 seconds       │
│  [Configure webhook →]                            │
└─────────────────────────────────────────────────┘
```

### Bulk URL Restructure Detection

When > 20% of inventory changes in one sitemap cycle:

1. **Detect** — flag mass URL change event
2. **Detect redirects** — if old URLs 301→new URLs, update inventory in-place (no re-crawl needed)
3. **Alert customer** — "Your site structure changed significantly. 5,000 new pages detected."
4. **Offer bulk re-crawl** — one-time overage charge, or included for Business+ tiers
5. **Priority routing** — new URLs from restructure get P1.5 priority (between webhook and ETag-detected)

---

## 2. Crawl Orchestration

### Scheduling Algorithm

```
Priority levels (P0 = highest):
  P0: On-the-fly requests (cache miss from edge)      → immediate
  P1: Webhook-triggered invalidations                  → < 30s
  P2: Known-changed pages (ETag/lastmod mismatch)      → < 5min
  P3: TTL-expired high-priority pages                  → < 1hr
  P4: TTL-expired low-priority pages                   → best-effort
  P5: Discovery crawls (new page exploration)           → background
```

### Worker Pool

| Worker Type | Purpose | Cost | Latency |
|---|---|---|---|
| **Headless Browser** | Full JS rendering, DOM extraction, screenshots | $0.01-0.05/pg | 3-15s |
| **Lightweight HTTP Fetch** | Raw HTML (bot view), ETag check, content negotiation probe | ~$0/req | 0.1-2s |

**Scaling:** Horizontal auto-scale on queue depth. Per-tenant concurrency limits prevent origin DDoS. Circuit breaker per domain backs off on 429/5xx.

### Polite Crawling Contract

| Level | Mechanism | Default |
|---|---|---|
| Per-domain | Max concurrent requests | 2 |
| Per-domain | Min delay between requests | 1s |
| robots.txt | Honor `Crawl-delay` | Yes |
| Per-tenant | Max concurrent workers | 5 (Starter) → 50 (Business) |

### Implementation Path

| Phase | Headless Browser | HTTP Fetch |
|---|---|---|
| 0-1 | Firecrawl API (SaaS) | Direct `fetch()` |
| 2 | Self-hosted Playwright (Fly.io / Railway containers) | Same |
| 3+ | Playwright pool with browser reuse, connection pooling | Dedicated worker pool |

**Migration trigger:** Monthly crawl volume > 100K pages OR Firecrawl COGS > $500/mo.

---

## 3. Content Transformation Pipeline

### 3-Stage Pipeline

```
Raw Crawl Output (HTML + metadata)
       │
       ▼
┌─ Stage 1: Content Extraction ──────────────────────────┐
│  - Strip non-content: <nav>, <script>, <style>, ads    │
│  - Identify main content region (<main> or heuristic)  │
│  - Preserve: headings, lists, tables, code blocks      │
│  - Extract: metadata, existing Schema.org, OG tags     │
│  Output: ContentExtract {clean_html, text, metadata,   │
│          existing_schema, heading_tree, content_hash}   │
└────────────────────────┬───────────────────────────────┘
                         ▼
┌─ Stage 2: Schema.org Generation Engine ────────────────┐
│  Pattern detectors (parallel):                         │
│  - FAQDetector: headings ending "?", <details>,  Q&A   │
│  - ProductDetector: pricing tables, currency, CTAs     │
│  - HowToDetector: ordered lists, "Step N" patterns     │
│  - OrganizationDetector: logo, address, social links   │
│                                                         │
│  Rules:                                                 │
│  - Only emit types with confidence >= 0.75             │
│  - Never overwrite existing origin Schema.org           │
│  - Validate against Schema.org spec                    │
│  - Cross-check against visible page content            │
│                                                         │
│  Future (Phase 3+): LLM-assisted extraction for        │
│  low-confidence pages. Batch, not per-request.          │
│  Output: SchemaResult {generated, existing, merged}     │
└────────────────────────┬───────────────────────────────┘
                         ▼
┌─ Stage 3: Output Renderer ─────────────────────────┐
│                                                         │
│  Primary — Optimized HTML (default for ALL requests)    │
│    clean_html + Schema.org JSON-LD in <head>             │
│    + ARIA enrichments on semantic/interactive elements   │
│    + noise stripped (<nav>, ads, tracking scripts)       │
│    + OG/meta tags verified and enriched                  │
│                                                         │
│  Secondary — Markdown (opt-in via Accept header)        │
│    ONLY when Accept: text/markdown is present            │
│    GFM with YAML frontmatter. Target < 8K tokens.       │
│    See §3a below for Cloudflare Markdown interaction.    │
│                                                         │
│  Output: CacheEntry[] (one per format)                   │
│                                                         │
│  Format routing at edge:                                 │
│    Accept: text/markdown? → Markdown                     │
│    Everything else?       → Optimized HTML               │
└────────────────────────┬──────────────────────────────┘
                         ▼
┌─ Stage 4: Content Parity Verification ─────────────────┐
│  Algorithm: Token-based Jaccard similarity              │
│  1. Extract text tokens from origin rendered page       │
│  2. Extract text tokens from generated Markdown/HTML    │
│  3. Exclude known-dynamic tokens (timestamps, session,  │
│     CSRF, "5 minutes ago"-style relative dates)         │
│  4. Compute token overlap ratio (Jaccard index)         │
│  5. Threshold: >= 0.90 overlap = PASS                   │
│  6. On fail: diff token sets, identify missing sections,│
│     block cache write, serve stale/origin, log + alert  │
│                                                         │
│  Fact preservation: prices, dates, proper nouns must    │
│  appear in all output formats.                          │
│  Schema validation: JSON-LD only from visible content.  │
└────────────────────────────────────────────────────────┘
```

### 3a. Cloudflare Markdown for Bots — How It Fits

Cloudflare (Feb 2026) introduced automatic HTML→Markdown conversion at the edge for requests with `Accept: text/markdown`. This overlaps with our Format A for SSR sites.

**Position: Complement, not replace.**

```
┌──────────────────────────────────────────────────────────────────┐
│                SSR Site (origin HTML has content)                  │
│                                                                    │
│  Path 1 — Cloudflare native (no CrawlReady):                      │
│    Bot sends Accept: text/markdown → Cloudflare converts HTML→Md   │
│    Result: Basic markdown. No Schema. No optimization. No analytics│
│                                                                    │
│  Path 2 — CrawlReady pre-generated cache (our primary path):      │
│    Bot request → Edge worker serves pre-generated Md from cache    │
│    Result: Optimized Md + YAML frontmatter + Schema in HTML path   │
│           + analytics + coverage tracking                          │
│                                                                    │
│  Path 3 — CrawlReady fallback leveraging Cloudflare:              │
│    Cache miss on SSR page → instead of serving raw HTML,           │
│    let Cloudflare's native conversion handle it as graceful        │
│    degradation while we enqueue P0 crawl for warm cache            │
│    Result: Decent markdown immediately, optimized version next hit │
├──────────────────────────────────────────────────────────────────┤
│                CSR Site (origin HTML is empty shell)               │
│                                                                    │
│  Cloudflare native: USELESS (converts empty shell → empty Md)     │
│  CrawlReady: ESSENTIAL (headless browser → rendered content → Md)  │
│  This is where CrawlReady's value is most obvious to the customer │
└──────────────────────────────────────────────────────────────────┘
```

**Strategic implications:**

| Dimension | Cloudflare Markdown for Bots | CrawlReady Pipeline |
|---|---|---|
| SSR content conversion | Yes (basic Markdown only) | Yes (Optimized HTML + Markdown) |
| CSR/SPA rendering | No | Yes (headless browser) |
| Schema.org injection | No | Yes (generated + merged) |
| ARIA enrichments | No | Yes (semantic/interactive elements) |
| Content quality control | No (raw conversion) | Yes (extraction + parity check) |
| Analytics & coverage | No | Yes |
| YAML frontmatter (Md) | No | Yes (structured metadata) |
| Token budget optimization | No | Yes (< 8K target for Markdown) |

**Decision:** Cloudflare's native markdown is a **fallback for SSR cache misses** (Path 3), not a replacement for the pipeline. CrawlReady's differentiation is Schema generation, CSR support, content quality, and analytics — none of which Cloudflare provides. For customers not yet on CrawlReady, Cloudflare's feature is "good enough" for SSR; our pitch becomes: "You need us for CSR, Schema, and intelligence."

### Future Format Extension Policy

New formats are added only when:
1. **A real consumer exists** that sends identifiable requests (User-Agent or Accept header)
2. **A working delivery mechanism exists** (CrawlReady can intercept and serve the format)
3. **The format produces meaningfully different output** from existing formats

Candidates on watch:
- **Structured JSON:** Deferred. Re-evaluate when programmatic agent standards emerge or `Accept: application/json` becomes a crawler convention.

**ARIA enrichments** are NOT a separate format. They are integrated into the primary Optimized HTML output. ARIA attributes (`role`, `aria-label`, landmark roles) are added to semantic and interactive elements where they improve the DOM's clarity for any consumer — bots, screen readers, and agents alike. Never overwrites existing ARIA attributes. The Agent Interaction Score remains as a diagnostic metric with improvement recommendations.

### Pipeline Execution Modes

| Mode | Trigger | Latency Budget | Workers |
|---|---|---|---|
| **Batch** (pre-crawl) | Scheduler, TTL, webhook | Minutes | Worker pool |
| **On-the-fly** (cache miss) | Edge miss → queue | < 15s | Dedicated fast-path |
| **Re-process** (pipeline upgrade) | New version deployed | Hours | Low-priority pool |

### On-the-Fly Fallback Strategy

When a bot hits a page with no cache:

- **SSR sites:** Cloudflare's native Markdown for Bots handles the conversion as graceful degradation. Bot gets decent markdown immediately. CrawlReady enqueues P0 crawl — next hit is served from warm cache with optimized content + Schema.
- **CSR sites:** Serve origin HTML as-is (raw HTML is empty anyway — Cloudflare markdown also useless here). Enqueue P0 crawl with headless browser rendering.
- Both: enqueue P0 crawl. Next bot request served from warm cache.

### OTF Fallback Policy

| Question | Answer |
|---|---|
| Does a cache miss consume a crawl credit? | YES — the async backfill crawl counts against budget |
| What headers during fallback? | `X-CrawlReady: miss` + `X-CrawlReady-ETA: {seconds}` |
| What if crawl budget exhausted? | Serve origin HTML passthrough with `X-CrawlReady: budget-exhausted`. No crawl enqueued. |
| Can customer disable OTF? | YES — setting `otf_enabled: false` serves nothing from CrawlReady unless warm cache exists |

### Pipeline Versioning & Re-Processing

| Question | Answer |
|---|---|
| How is pipeline version tracked? | Global version counter. Each cache entry stores `pipeline_version` at write time. |
| Does re-processing consume customer budget? | NO — it's our upgrade, not their content change. |
| Can customer opt out? | YES — `pin_pipeline_version: true` keeps stable output until explicitly upgraded. |
| What triggers re-processing? | Major version bumps only (e.g., new Schema detector, Markdown format change). Not every deploy. |
| Execution | Background re-process from L2 stored HTML. Low-priority pool. Hours to complete. |

---

## 4. Cache Layer & Storage

### 4-Tier Cache Topology

L0 and L1 serve fundamentally different purposes: **L0 caches the input** (raw origin HTML), **L1 caches the output** (CrawlReady's processed content). L0 cannot replace L1 — Cache API is per-PoP (no global consistency), has no persistence guarantee (Cloudflare evicts at will), supports no metadata/enumeration, and doesn't store processed content. L1 (Workers KV) provides global reads, guaranteed persistence, structured metadata (pipeline version, parity score), and bulk operations needed for tenant management and pipeline upgrades.

```
L0: Origin HTML Cache (Cloudflare Cache API)
    - STORES: Customer's raw origin HTML (the INPUT to transforms)
    - Purpose: Avoid hitting customer origin on L1 miss (HTMLRewriter path)
    - TTL: Respects origin Cache-Control headers (or 5-15 min default)
    - Key: Origin URL (standard HTTP cache key)
    - Scope: Per-PoP (not globally consistent — 300+ independent caches)
    - Cost: $0 (included in Workers plan)
    - Persistence: NOT guaranteed — Cloudflare evicts based on popularity
    - Used by: HTMLRewriter real-time path, OTF generation input
    - Useless for CSR: origin HTML is an empty shell
         │ (miss → fetch origin, cache.put())
         ▼
L1: Product Cache (Cloudflare Workers KV)
    - STORES: CrawlReady's PROCESSED output (Optimized HTML, Markdown)
    - Purpose: Serve bot requests with zero compute — the core serving layer
    - Contains: Schema.org, ARIA enrichments, noise-stripped content
    - Global read: < 50ms from any PoP (globally replicated)
    - Key: cr:{tenant_hash}:{url_hash}:{format}
    - Metadata: pipeline_version, parity_score, generated_at, tenant_id
    - Persistence: Guaranteed until explicitly deleted
    - Supports: Enumeration, bulk purge, per-tenant operations
    - 99%+ of bot requests served here at steady state
    - Cost: ~$0.50/GB-month storage + $0.50/M reads
         │ (miss)
         ▼
L2: Durable Store (Cloudflare R2)
    - All format variants + metadata + parity report
    - Key: {tenant}/{domain}/{url_hash}/{format}/{ts}.ext
    - Source-of-truth for L1 rehydration
    - Historical version retention
         │ (miss)
         ▼
L3: On-the-Fly Generation
    - Page never crawled
    - For SSR: use L0 cached origin HTML as input (fast)
    - Enqueue P0 crawl, serve fallback
    - Write to L2 → propagate to L1
```

### L1 Cost at Scale

Average per-page: ~60KB Optimized HTML + ~15KB Markdown = ~75KB.

| Scale | Pages | L1 Storage | L1 Reads | L1 Writes | **L1 Total/mo** | Revenue (est.) | L1 % Revenue |
|---|---|---|---|---|---|---|---|
| 100 × 500 pages | 50K | $1.88 | $0.25 | free | **~$2** | $3K | 0.07% |
| 1K × 1K | 1M | $37.50 | $2.50 | $5 | **~$45** | $49K | 0.09% |
| 10K × 2K | 20M | $750 | $25 | $50 | **~$825** | $490K | 0.17% |

L1 cost is negligible at every scale. Removing it would save $45/month at 1K customers but require running HTMLRewriter on every request (~$0.30/M Workers invocations + CPU time + origin fetches for CSR). The math doesn't favor removal.

### Cache Invalidation (4 triggers)

| Trigger | Mechanism | Latency |
|---|---|---|
| **Customer webhook** (`POST /api/v1/recache`) | L0 + L1 purge + P1 re-crawl | < 30s |
| **Content change detected** (ETag mismatch) | L0 + L1 purge + P2 re-crawl | < 5min |
| **TTL expiry** | L1 auto-expires. L0 short-TTL handles itself. | Per-tier TTL |
| **Pipeline version upgrade** | Background re-process from L2 HTML | Hours |

### Stale-While-Revalidate

TTL expired → serve stale content immediately + enqueue background re-crawl (P3, deduplicated). Bot gets fast response; cache refreshes asynchronously. Prevents thundering herd on TTL expiry.

### L2 Storage Cost (R2)

R2 adds durable storage for historical versions and metadata. Combined L1+L2 totals:

| Scale | Pages | L1 (KV) | L2 (R2) | L0 (Cache API) | **Total Storage/mo** |
|---|---|---|---|---|---|
| 100 × 500 | 50K | ~$2 | ~$2 | $0 | **~$4** |
| 1K × 1K | 1M | ~$45 | ~$30 | $0 | **~$75** |
| 10K × 2K | 20M | ~$825 | ~$300 | $0 | **~$1,125** |

Storage is negligible at every scale. Crawl compute is the dominant cost.

---

## 5. Change Detection & Freshness

### Detection Hierarchy (cheapest → most expensive)

**Tier 1 — Zero-Cost Signals (passive):**
- Customer deploy webhook
- Sitemap `<lastmod>` comparison
- RSS/Atom new entries
- Bot traffic spike on a URL

**Tier 2 — Lightweight Polling (cheap):**
- HTTP HEAD with `If-None-Match` (ETag)
- HTTP HEAD with `If-Modified-Since`
- Cost: ~$0/check. Frequency: hourly → daily per tier.

**Tier 3 — Content Hash (moderate):**
- Fetch raw HTML body (no JS rendering)
- Hash text content, compare against stored hash
- If changed → trigger full re-crawl
- Accurate for SSR, useless for CSR

**Tier 4 — Full Re-Crawl (expensive):**
- Headless browser render + full pipeline
- If content unchanged → update TTL only (no cache write)
- Cost: $0.01-0.05/page

### Strategy per Site Type

| Site Type | Primary Detection | Fallback |
|---|---|---|
| **SSR + Sitemap** | `<lastmod>` | ETag polling |
| **SSR, no sitemap** | ETag polling | Content hash |
| **CSR/SPA** | Customer webhook | TTL expiry |
| **Hybrid** | Sitemap + webhook | Per-route |
| **Static (SSG)** | Deploy webhook | `<lastmod>` |

**Key insight for CSR:** ETag/hash detection is useless — server always returns the same HTML shell. Webhook integration is essential, not optional, for CSR customers.

### Traffic-Adaptive TTL

Pages receiving heavy bot traffic get shorter TTLs (fresher content matters more). Pages with zero traffic get extended TTLs (no point refreshing what nobody reads).

| Bot visits / 30 days | TTL Multiplier | Starter (14d default) | Pro (7d default) | Business (3d default) |
|---|---|---|---|---|
| 0 | 2.0x | 28 days | 14 days | 6 days |
| 1-10 | 1.0x | 14 days | 7 days | 3 days |
| 11-50 | 0.5x | 7 days | 3.5 days | 1.5 days |
| 50+ | 0.25x | 3.5 days | ~2 days | ~18 hours |

This alone reduces crawl costs by 30-40% — extending TTLs on unvisited pages and concentrating freshness budget on pages bots actually care about.

### Customer-Configurable TTL

TTL is customer-configurable. We set smart defaults; the customer tunes to their update cadence.

**Override priority:** Per-page override > Site-level override > Tier default.

| Tier | Min TTL | Max TTL | Default | Rationale |
|---|---|---|---|---|
| Starter | 1 day | 30 days | 14 days | Prevent budget self-destruction / serving ancient content |
| Pro | 6 hours | 30 days | 7 days | Allow aggressive if customer chooses |
| Business | 1 hour | 30 days | 3 days | Business can afford frequent refresh |
| Enterprise | 5 minutes | 90 days | 24 hours | Full flexibility |

### Traffic-Weighted Priority (Feedback Loop)

```python
def compute_page_priority(page, tenant):
    """
    Dynamic priority based on actual bot traffic.
    Runs periodically (hourly for Pro+, daily for Starter).
    """
    # Base priority from sitemap (0.0-1.0)
    base = page.sitemap_priority or 0.5

    # Traffic signal: normalized bot visit count (0.0-1.0)
    max_traffic = max(p.bot_traffic_30d for p in tenant.pages) or 1
    traffic_signal = page.bot_traffic_30d / max_traffic

    # Recency signal: recently visited pages get boost
    days_since_last_bot_visit = (now() - page.last_bot_visit_at).days
    recency_boost = max(0, 1.0 - (days_since_last_bot_visit / 30))

    # Combined priority
    priority = (0.3 * base) + (0.5 * traffic_signal) + (0.2 * recency_boost)

    return clamp(priority, 0.0, 1.0)
```

### Customer Crawl Controls

Table-stakes controls exposed to the customer:

| Control | Description | Default |
|---|---|---|
| **Concurrency limit** | Max concurrent CrawlReady requests to origin | 2 (can increase to 10) |
| **Crawl window** | Time-of-day restriction (e.g., "don't crawl 2am-4am UTC") | None (24/7) |
| **Excluded paths** | Glob patterns to never crawl (`/admin/*`, `/api/*`, `/internal/*`) | None |
| **Priority pages** | Customer-declared high-priority URLs (always pre-crawled) | Homepage only |
| **OTF toggle** | Enable/disable on-the-fly generation | Enabled |

---

## 6. Edge Serving Layer

### Request Flow

```
Incoming HTTP Request
       │
       ▼
┌─ Edge Worker ──────────────────────────────────────────┐
│                                                         │
│  Step 1: Bot Detection                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Check 1: Accept: text/markdown header?           │    │
│  │   → YES: bot_type = "content_negotiation"        │    │
│  │                                                  │    │
│  │ Check 2: UA matches known AI bot pattern?        │    │
│  │   → Verify IP against published CIDR ranges      │    │
│  │     (cached in KV, refreshed daily)              │    │
│  │   → Verified: bot_type = "{specific_bot}"        │    │
│  │   → Unverified: bot_type = "unverified"          │    │
│  │                                                  │    │
│  │ Check 3: None of the above                       │    │
│  │   → bot_type = "human" → passthrough to origin   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Step 2: Format Selection                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Accept: text/markdown?   → Markdown              │    │
│  │ Everything else          → Optimized HTML        │    │
│  │   (GPTBot, ClaudeBot, PerplexityBot,             │    │
│  │    Google-Extended, unverified bots)              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Step 3: Cache Lookup (L1 → L2 → Fallback)             │
│  ┌─────────────────────────────────────────────────┐    │
│  │ HIT (fresh) → Serve + headers:                   │    │
│  │   Content-Type: text/markdown | text/html         │    │
│  │   X-CrawlReady: hit                              │    │
│  │   X-CrawlReady-Generated: {timestamp}             │    │
│  │                                                  │    │
│  │ HIT (stale) → Serve stale + enqueue re-crawl    │    │
│  │   X-CrawlReady: stale                            │    │
│  │                                                  │    │
│  │ MISS → Serve fallback + enqueue P0 crawl         │    │
│  │   X-CrawlReady: miss                             │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Step 4: Metering (async beacon)                        │
│  { tenant, url, bot, format, cache_status, latency }    │
└─────────────────────────────────────────────────────────┘
```

### Transparency Endpoint

Every CrawlReady-protected domain exposes:

```
GET /crawlready-preview?url={page_url}&format={md|html|json}

Returns: The exact content bots receive for this URL.
Auth: None (public). This is CrawlReady's transparency guarantee.
```

---

## 7. Customer Integration

### Level 2 — Middleware SDK

Customer adds middleware. On bot detection, middleware fetches optimized content from CrawlReady's edge and serves it.

```
Customer Server → Middleware detects bot (UA check)
  → GET https://edge.crawlready.app/serve/{site_key}/{url_hash}
    Accept: {format_for_this_bot}
  → CrawlReady edge returns optimized content
  → Middleware serves as HTTP response
  → Human traffic: passthrough (middleware is no-op)
```

**SDK Entry Points:**

```typescript
// Next.js
// Cloudflare Worker
import { crawlreadyWorker } from '@crawlready/cloudflare';
import { withCrawlReady } from '@crawlready/next';
// Express / Hono
import { crawlready } from '@crawlready/node';
export default withCrawlReady(nextConfig, {
  siteKey: process.env.CRAWLREADY_SITE_KEY,
});
app.use(crawlready({ siteKey: process.env.CRAWLREADY_SITE_KEY }));
export default crawlreadyWorker({
  siteKey: '<key>',
  origin: '<origin_url>',
});
```

**Fail-safe behavior:** CrawlReady edge timeout (> 2s) or 5xx → serve origin content as-is. Customer site is NEVER degraded by CrawlReady unavailability.

### Level 3 — DNS Proxy

```
DNS: example.com CNAME → proxy.crawlready.app
  → CrawlReady edge receives ALL traffic
  → Bot: serve from cache (same as Level 2 path)
  → Human: transparent proxy to origin (no modification)
  → SSL: CrawlReady manages TLS (Let's Encrypt / Cloudflare)
```

### Integration Comparison

| Dimension | Level 2 (Middleware) | Level 3 (DNS Proxy) |
|---|---|---|
| Setup effort | Add 5-10 line middleware | DNS CNAME change |
| Customer control | Full (middleware in their stack) | Shared (CrawlReady manages routing) |
| Latency overhead | 1 extra HTTP hop (~50ms) | 0 extra hops (CrawlReady IS the edge) |
| SSR real-time transform | Via HTMLRewriter at CrawlReady edge | Via HTMLRewriter at CrawlReady edge |
| Trust requirement | Low | High (all traffic flows through us) |
| Fallback on outage | Middleware serves origin | DNS failover required |
| Best for | Phase 2 customers, trust-building | Enterprise, 30+ days on Level 2 |

---

## 8. Pre-Crawl vs. On-the-Fly: Architecture Recommendation

### Verdict: Balanced Hybrid with Intelligent Warm-Up

Neither pure pre-crawl nor pure on-the-fly is optimal. The architecture uses both, with the balance set by page priority and cost budget.

### Decision Matrix

| Page Category | Strategy | Rationale |
|---|---|---|
| **Homepage + top 10 pages** (by bot traffic) | Pre-crawl, always warm | 80%+ of bot traffic. Cold cache unacceptable. |
| **All sitemap pages** | Pre-crawl on registration + TTL refresh | Sitemap = customer's intent declaration. |
| **Pages with bot traffic history** | Pre-crawl, priority ∝ traffic | If bots visit it, keep it warm. |
| **Long-tail pages** (low/no bot traffic) | On-the-fly + async backfill | Pre-crawling pages bots never visit is waste. |
| **New pages** (just deployed) | Pre-crawl if webhook-triggered, OTF otherwise | Webhooks signal intent. |
| **Removed pages** | Serve cached 410 for 30 days, alert if bots still visit | Clean de-indexing + customer awareness. |

### The Tier-Aware Hybrid Algorithm

```python
def should_pre_crawl(page, tenant):
    # Universal: always pre-crawl homepage
    if page.url == tenant.homepage:
        return True

    # Universal: always pre-crawl webhook-pushed pages
    if page.discovered_via == 'webhook':
        return True

    if tenant.tier == 'starter':
        # Starter ($29/mo, 500 crawls): only pre-crawl top N by bot traffic
        top_pages = get_top_pages_by_bot_traffic(tenant, limit=5)
        return page.url in top_pages

    elif tenant.tier == 'pro':
        # Pro ($49/mo, 2500 crawls): pre-crawl sitemap + bot-visited
        if page.discovered_via == 'sitemap':
            return True
        if page.bot_traffic_30d >= 3:
            return True
        return False

    elif tenant.tier == 'business':
        # Business ($199/mo, 10K crawls): pre-crawl all active pages
        if page.status == 'active':
            return True
        return False

    elif tenant.tier == 'enterprise':
        # Enterprise (custom): pre-crawl everything, always warm
        return True

    return False
```

### Tier-Differentiated Strategy Overview

| Dimension | Starter ($29/mo) | Pro ($49/mo) | Business ($199/mo) | Enterprise (custom) |
|---|---|---|---|---|
| **Pre-crawl scope** | Homepage + top 5 by traffic | All sitemap pages | All discovered pages | Everything, always warm |
| **Default TTL** | 14 days | 7 days | 3 days | 24 hours |
| **TTL configurable** | Yes (1d-30d range) | Yes (6h-30d range) | Yes (1h-30d range) | Yes (5m-90d range) |
| **Change detection** | Webhook + TTL | + ETag/HEAD polling | + Content hash | + RSS monitoring |
| **Budget priority** | Maximize coverage | Balance freshness & coverage | Maximize freshness | Near-real-time |
| **HTMLRewriter for SSR** | No | No | Yes | Yes (default for SSR routes) |
| **Traffic-adaptive TTL** | Daily recalc | Hourly recalc | Hourly recalc | Real-time |

### Why Not Pure Pre-Crawl

- **Cost explosion:** 50K pages × $0.01/crawl × weekly = $2,000/month. Most pages get zero bot traffic.
- **Waste:** Top 10% of pages receive 90%+ of bot traffic. Pre-crawling the other 90% has near-zero ROI.
- **Freshness illusion:** 7-day TTL means most content is already stale when a bot visits.

### Why Not Pure On-the-Fly

- **Cold start penalty:** 5-15s latency on first bot visit. Bots may timeout.
- **Thundering herd:** Google-Extended crawling 500 pages in 10 minutes overwhelms worker pool.
- **No proactive optimization:** New pricing page sits unoptimized until first bot visit.

### Cost Comparison (with tier-aware hybrid)

| Strategy | 1K-page site (500 bot-visited) | 50K-page site (2K bot-visited) |
|---|---|---|
| Pure pre-crawl (weekly) | 4K crawls/mo = $40-200 | 200K crawls/mo = $2K-10K |
| Pure on-the-fly | 500 crawls/mo = $5-25 | 2K crawls/mo = $20-100 |
| **Tier-aware hybrid** | **~600 crawls/mo = $6-30** | **~3K crawls/mo = $30-150** |

Hybrid is 5-60x cheaper than pure pre-crawl while eliminating cold starts for pages that matter.

---

## 9. Resilience & Failure Modes

| Component | Failure Mode | Mitigation |
|---|---|---|
| **Crawl worker** | Browser crash, timeout | Retry 3x with backoff. Dead-letter queue. |
| **Customer origin** | 5xx, timeout, rate limit | Circuit breaker: 5min → 30min → 2hr. Serve stale cache. Alert customer. |
| **Edge KV** | Read latency spike | L2 fallback. KV has 99.99% read SLA. |
| **Transform pipeline** | Schema extraction error | Serve without Schema (graceful degradation). |
| **Transform pipeline** | Content parity failure | Block cache write. Serve stale or origin. Alert. |
| **Crawl queue** | Backpressure | Shed P5 (discovery). Preserve P0-P2 capacity. |
| **CrawlReady edge** (outage) | Workers down | Customer middleware fails-open (serves origin). |

### Key Properties

- **Idempotency:** Every crawl job is idempotent. Safe to retry without side effects.
- **Durability:** L2 (R2/S3) is the durability layer. L1 (KV) is a read cache. All cache is regenerable from origin.
- **Fail-open:** Customer middleware always serves origin on CrawlReady failure. Human traffic is never affected.

---

## 10. Scaling Dimensions

| Component | Scaling Mechanism | Bottleneck |
|---|---|---|
| Edge workers | Auto (Cloudflare) | None at projected scale |
| Crawl workers | Container auto-scale on queue depth | Browser memory (~300MB/inst) |
| Transform pipeline | Stateless, scales with crawl workers | CPU for Schema extraction |
| Cache KV | Auto (Cloudflare) | Write throughput (1K/s per ns) |
| Object storage (L2) | Auto (R2/S3) | None |
| Page inventory DB | Vertical → read replicas | Write at 10K+ tenants |

### Tenant Isolation

- **Crawl queue:** Fair-share scheduling. No single tenant starves others.
- **Worker pool:** Per-tenant concurrency caps. No tenant > 20% of total capacity.
- **Edge KV:** Namespaced by tenant.
- **Metering:** Per-tenant counters at the edge. Over-limit → 429 with `Retry-After`.

### Cost Model

```
Monthly cost ≈
  (active_pages × crawl_frequency × $0.001-0.05/page)   -- Crawl compute (dominant)
  + (cached_entries × ~$0.000001/entry/mo)                -- Storage (negligible)
  + (bot_requests × ~$0.0000003/req)                      -- Edge serving (negligible)

Dominant cost: CRAWL COMPUTE.
Primary cost lever: Reduce unnecessary crawls (the hybrid strategy).
```

---

## 11. Technology Choices

### Phase Evolution

| Component | Phase 0-1 | Phase 2 | Phase 3+ (Target) |
|---|---|---|---|
| **Crawl engine** | Firecrawl API | Self-hosted Playwright (Fly.io / Railway) | Playwright pool with browser reuse |
| **Crawl queue** | Vercel background fn | Cloudflare Queues / BullMQ | SQS FIFO with per-tenant partitions |
| **Transform** | In-process | Separate event-driven workers | Streaming pipeline with stage retries |
| **Edge serving** | Vercel Edge Middleware | Cloudflare Workers | Workers + Durable Objects |
| **L1 cache** | Vercel KV / in-memory | Cloudflare Workers KV | Workers KV + Durable Objects |
| **L2 cache** | Supabase Storage | Cloudflare R2 | R2 with lifecycle policies |
| **Page inventory** | Supabase PostgreSQL | Supabase PostgreSQL | PG with tenant partitioning |
| **Change detection** | Webhook + TTL | + ETag/HEAD polling | + Sitemap monitor + RSS + hash |
| **Schema gen** | Heuristic patterns | Heuristic + confidence | Heuristic + LLM-assisted |
| **Observability** | Console logs | Sentry + structured logs | OpenTelemetry + cost dashboards |

### Why Cloudflare as Edge Platform

| Criterion | Cloudflare Workers | AWS Lambda@Edge | Vercel Edge |
|---|---|---|---|
| Global PoPs | 300+ | ~30 regions (Lambda) | ~20 regions |
| Cold start | 0ms (V8 isolates) | 100-500ms | ~0ms |
| KV store | Workers KV (native) | DynamoDB (cross-svc) | Redis-based (single region) |
| Compute | Full JS/Wasm | 5s limit | Light compute |
| Object storage | R2 ($0 egress) | S3 ($0.09/GB egress) | External only |
| Cost | $0.30/M requests | ~$1.20/M | $20/mo + per-req |
| HTMLRewriter | Yes | No | No |

Cloudflare wins on cold start, cost, native KV, HTMLRewriter (SSR transform), and R2 egress pricing.

---

## 12. SSR Sites: HTMLRewriter + Cloudflare Markdown for Bots

### The Two Complementary Edge Technologies

**HTMLRewriter (Cloudflare Workers API):** Transforms HTML in-flight at the edge. CrawlReady controls the transformation logic (Schema injection, noise stripping). Available for any Cloudflare Workers deployment.

**Cloudflare Markdown for Bots (Feb 2026):** Cloudflare natively converts HTML→Markdown at the edge when a request includes `Accept: text/markdown`. This is a Cloudflare platform feature, not CrawlReady code.

### SSR/CSR Auto-Detection (Dual-Fetch Comparison)

**Why not text-length heuristic:** Measuring `<body>` text content length fails on any modern hybrid site. A Next.js page with SSR layout shell (header, nav, footer = 500+ chars) but CSR main content area gets classified as SSR — but the actual content bots need isn't in the raw HTML. Per-component rendering (React Server Components, Nuxt islands, Astro islands) makes page-level classification meaningless without comparing rendered output.

**Detection algorithm (runs on site registration + weekly re-check):**

```
1. Select sample URLs:
   - Homepage
   - 3-5 URLs from sitemap (diverse route patterns)
   - Any customer-specified important pages

2. For each sample URL, execute two fetches:
   Fetch A: Lightweight HTTP GET (raw HTML, no JS)
     → Strip layout elements: <nav>, <header>, <footer>, <aside>
     → Extract remaining text content
     → Call this: raw_content_text

   Fetch B: Headless browser render (full JS, wait for network idle)
     → Strip same layout elements
     → Extract remaining text content
     → Call this: rendered_content_text

3. Compare:
   content_ratio = len(raw_content_text) / max(len(rendered_content_text), 1)

   - content_ratio >= 0.85 → ROUTE IS SSR
     (raw HTML has ≥85% of rendered content — JS adds little)

   - content_ratio <= 0.15 → ROUTE IS CSR
     (raw HTML has ≤15% of rendered content — JS renders everything)

   - 0.15 < content_ratio < 0.85 → ROUTE IS HYBRID
     (some content server-rendered, some client-rendered)

4. Supplementary: framework signal detection
   - <script id="__NEXT_DATA__"> → Next.js (SSR/SSG likely)
   - window.__NUXT__ → Nuxt.js (SSR hydration)
   - data-reactroot without content → React SPA (CSR likely)
   - meta[name="generator"] content="Astro" → Island architecture (hybrid)

5. Classify site:
   - All routes SSR → site is SSR
   - All routes CSR → site is CSR
   - Mixed → site is HYBRID (per-route strategy applies)

6. Store per-route:
   { "/": "ssr", "/blog/*": "ssr", "/app/*": "csr", "/products/*": "hybrid" }

7. Customer can override any route classification via dashboard.
```

**Why strip layout elements before comparison:** `<nav>`, `<header>`, `<footer>` are almost always SSR even on CSR sites. Including them inflates `raw_content_text` and masks CSR main content — exactly the failure mode of the text-length heuristic. We want to measure whether the *main content region* is server-rendered.

**Cost:** $0.05-0.25 per site registration (5 headless renders). Negligible vs. crawl compute.

### Per-Route Strategy Selection

A hybrid site may have SSR marketing pages and CSR dashboard routes:

| Route Pattern | Rendering | Markdown Path | HTML Path |
|---|---|---|---|
| `/`, `/pricing`, `/blog/*` | SSR | CrawlReady cache (or Cloudflare Md fallback) | HTMLRewriter + Schema |
| `/app/*`, `/dashboard/*` | CSR | CrawlReady cache (headless rendered) | CrawlReady cache |
| Customer-excluded paths | N/A | Not served | Not served |

### HTMLRewriter Path for SSR (Optimized HTML)

```
Bot request for SSR page (no Accept: text/markdown)
  → Check L1 for pre-generated Optimized HTML
  → HIT: serve from cache
  → MISS: Edge worker checks L0 for cached origin HTML
    → L0 HIT or fetch origin
    → Parallel: lookup pre-computed Schema + ARIA rules from KV
      (Schema + ARIA generated on last crawl, stored separately)
    → HTMLRewriter:
      - Inject Schema.org JSON-LD into <head>
      - Add ARIA enrichments (role, aria-label on landmarks/interactive)
      - Strip noise (<nav>, <footer>, tracking scripts)
      - Clean semantic structure
    → Serve transformed HTML
    → Always fresh, ~$0 COGS
```

**Key insight:** SSR pages still need periodic crawling — not for content caching, but for Schema generation and ARIA rule computation. The HTMLRewriter path eliminates the content cache but not the Schema/ARIA cache.

### Cloudflare Markdown for Bots Path for SSR (Accept: text/markdown)

```
Bot request for SSR page with Accept: text/markdown
  → CrawlReady edge checks L1/L2 cache for Markdown variant
  → HIT: serve CrawlReady-optimized Markdown (YAML frontmatter, token-optimized)
  → MISS: Cloudflare's native Markdown for Bots handles conversion as graceful degradation
         + CrawlReady enqueues P0 crawl for optimized Markdown version
  → Next hit: warm cache with CrawlReady-quality Markdown
```

### Trade-offs Summary

| Dimension | CrawlReady Pre-Generated Cache | HTMLRewriter (real-time) | Cloudflare Md for Bots (native) |
|---|---|---|---|
| CSR sites | Yes (renders JS) | **No** (can't execute JS) | **No** (empty shell) |
| SSR sites | Yes (cache overhead) | Yes (real-time, no cache) | Yes (basic conversion) |
| Freshness | TTL-dependent | Always live | Always live |
| COGS | $0.01-0.05/page | ~$0/request | ~$0/request |
| Schema injection | Pre-generated | Real-time via `<head>` append | No |
| ARIA enrichments | Pre-generated | Real-time via HTMLRewriter | No |
| Content quality | High (extracted, curated) | Medium (noise stripped + ARIA) | Low (raw conversion) |
| YAML frontmatter | Yes (Markdown only) | No | No |
| Token optimization | Yes (< 8K target, Markdown) | No | No |
| Analytics/metering | Yes | Yes (edge worker) | No (platform-level) |

**Recommendation:** For Business+ SSR customers, offer HTMLRewriter as default for Optimized HTML (cheaper, fresher, includes ARIA + Schema). For `Accept: text/markdown` requests, always prefer CrawlReady cache; use Cloudflare native Markdown as SSR fallback on cache miss. CSR routes always go through pre-generated cache (no alternative).

---

## 13. Infrastructure Topology (Target State)

```
┌─────────────────────────────────────┐
│     Customer Origin (example.com)    │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────────────────────────┐
    │          │                               │
┌───▼────┐ ┌──▼──────────┐  ┌────────────────▼───────────┐
│ Deploy  │ │ Sitemap/RSS │  │ Customer Middleware (SDK)    │
│ Webhook │ │ Poller      │  │ (bot detect → call edge)    │
└───┬────┘ └──┬──────────┘  └────────────────┬───────────┘
    │         │                               │
    ▼         ▼                               │
┌──────────────────────────┐                  │
│    Control Plane          │                  │
│  (Page Tree + Scheduler   │                  │
│   + Metering)             │                  │
└──────────┬───────────────┘                  │
           │                                   │
           ▼                                   │
┌──────────────────────────┐                  │
│    Data Plane             │                  │
│  (Crawl Workers +         │                  │
│   Transform Pipeline)     │                  │
└──────────┬───────────────┘                  │
           │                                   │
           ▼                                   │
┌──────────────────────────┐                  │
│    Cache Layer            │                  │
│  L0: Cache API (origin)   │                  │
│  L1: Workers KV (edge)    │                  │
│  L2: R2 (durable)         │                  │
└──────────┬───────────────┘                  │
           │                                   │
           ▼                                   │
┌─────────────────────────────────────────────┘
│         Serving Plane
│    (Cloudflare Workers — 300+ PoPs)
│
│  Bot requests:
│    Level 2: middleware → edge.crawlready.app/serve/...
│    Level 3: DNS proxy → bot detection → cache lookup
│
│  Format routing:
│    Accept: text/markdown  → Markdown
│    Everything else        → Optimized HTML
│      (GPTBot, ClaudeBot, PerplexityBot,
│       Google-Extended, unverified bots)
│
│  Fallback: stale-while-revalidate → origin passthrough
└─────────────────────────────────────────────┘
```

---

## 14. Key Metrics to Instrument

| Metric | Why | Alert Threshold |
|---|---|---|
| **Cache hit rate** (L1) | Core efficiency indicator | < 90% → investigate |
| **P95 bot response latency** | Bot experience | > 500ms → scale edge/cache |
| **Crawl success rate** | Pipeline health | < 95% → investigate origins |
| **Content parity pass rate** | Trust & quality | < 99% → pipeline bug |
| **Fresh crawls / tenant / day** | Cost control | > 2x tier limit → metering bug |
| **Queue depth** (P0-P2) | Backpressure early warning | > 1K items → scale workers |
| **Schema generation confidence** | Quality signal | Avg < 0.8 → retrain heuristics |
| **On-the-fly fallback rate** | Cache warmth | > 10% of bot requests → pre-crawl coverage gap |

---

## 15. Open Questions for Implementation

1. **Playwright hosting:** Fly.io vs. Railway vs. ECS Fargate for containerized browser workers. Evaluate cold start, cost per minute, and max concurrent instances.
2. **KV namespace strategy:** One global namespace vs. per-tenant namespace in Workers KV. Single namespace simplifies operations; per-tenant enables independent purges.
3. **Schema generation model:** Pure heuristic vs. hybrid heuristic+LLM. LLM improves accuracy on complex pages but adds $0.001-0.01/page cost and latency.
4. **Level 3 DNS proxy SSL:** Cloudflare for SaaS (custom hostnames) vs. Let's Encrypt with automated cert provisioning. Cloudflare simplifies but adds vendor lock-in.
5. **Historical cache retention:** How many versions to keep per page? Needed for "diff over time" feature. Storage is cheap but adds operational complexity.

---

## Decisions

- **Serving topology:** Hybrid — Level 2 (middleware) and Level 3 (DNS proxy) from the same content pipeline.
- **Edge platform:** Cloudflare Workers for serving (0ms cold start, native KV, HTMLRewriter, R2 integration, $0.30/M requests). No separate CDN — Cloudflare all-in-one eliminates inter-service hops and cache coherence issues.
- **Cache topology:** L0 (Cache API, origin HTML) → L1 (Workers KV, generated content) → L2 (R2, durable) → L3 (OTF generation). L0 eliminates 80-95% of origin hits for HTMLRewriter path at $0 cost.
- **Change detection:** Tiered approach (webhooks → ETag/HEAD → content hash → full re-crawl). CSR depends on webhooks.
- **Polite crawling:** Max 2 concurrent per origin, 1s delay, honor `Crawl-delay`. Non-negotiable. Customer-configurable overrides.
- **Fail-open:** Middleware serves origin on CrawlReady failure. Human traffic never affected.
- **Crawl engine migration:** Firecrawl → self-hosted Playwright at 100K pages/mo or $500/mo COGS.
- **Format routing:** HTML-first, Markdown opt-in. Optimized HTML (Schema.org + ARIA enrichments + noise-stripped + OG/meta) is the default for all requests. Markdown served only when `Accept: text/markdown` is present. Structured JSON deferred (no consumer).
- **ARIA enrichments:** Integrated into the Optimized HTML format, not a separate format. Scoped to elements where ARIA adds semantic value (landmarks, interactive elements, ambiguous buttons). Never overwrites existing ARIA attributes.
- **Tier-aware strategy:** Each tier gets different pre-crawl/OTF/TTL/change-detection profiles. Starter is budget-conservative. Enterprise is freshness-maximizing.
- **TTL defaults:** Starter 14d, Pro 7d, Business 3d, Enterprise 24h. Customer-configurable with per-tier guardrails (min/max).
- **Traffic-adaptive caching:** Bot traffic feeds back into page priority and TTL multipliers. Estimated 30-40% crawl cost reduction.
- **Cache decay:** Hot/warm/cold/frozen tiers based on 90-day bot traffic. Frozen pages never proactively refreshed.
- **Removed page retention:** 30 days (not 7). Alert customer if bots still visit removed pages.
- **Discovery reframing:** Customer sees "Coverage" (percentage, optimized pages list, time-to-first-optimization). Discovery mechanics are internal.
- **Cloudflare Markdown for Bots:** Complement, not replace. Graceful degradation for SSR Markdown cache misses. CrawlReady differentiates on Schema, ARIA, CSR rendering, content quality, analytics.
- **SSR/CSR auto-detection:** Dual-fetch content comparison (raw HTML vs headless-rendered, with layout elements stripped). Framework signal detection as supplementary. Customer override available. Per-route classification for hybrid sites.
- **HTMLRewriter scope:** Business+ SSR customers for Optimized HTML. Includes Schema injection and ARIA enrichments. Requires periodic crawls for Schema generation and ARIA rule computation.
- **Content parity:** Token-based Jaccard index with dynamic content exclusion. Threshold: 0.90.
- **Pipeline versioning:** Global version counter. Re-processing on major bumps only, does not consume customer budget.
- **Customer crawl controls:** Concurrency limits, time windows, path exclusions, priority pages, OTF toggle, TTL overrides.
- **Bulk restructure handling:** Detect >20% inventory change, map redirects, offer one-time bulk re-crawl.
- **OTF fallback policy:** Cache miss consumes crawl credit. Budget exhaustion → origin passthrough. Customer can disable OTF.
