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

*Continued in Part 2: Serving, Integration, and Architectural Recommendations.*
