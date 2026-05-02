# Architecture: Content Pipeline & Serving Infrastructure

Long-term target architecture for CrawlReady's content ingestion, transformation, caching, and serving infrastructure. This is the system that makes "every page on a customer's site discoverable and optimized for LLMs" a reality.

**Scope:** Content pipeline and serving infrastructure only. Platform concerns (billing, dashboard, auth) are in existing docs.

**Relationship to phases:** This describes the target-state architecture. Phase 0-1 uses simplified versions (Firecrawl API, Vercel serverless, Supabase). This doc shows where those evolve to at scale.

---

## Design Principles

1. **Pre-crawl what you know, generate on-the-fly what you don't.** Warm cache for discovered pages. Synthesize on cache miss with async backfill. Never let a bot request go unserved.
2. **The content pipeline is the product.** Every other component consumes pipeline output. Pipeline quality determines competitive differentiation.
3. **Edge-native serving.** Bot responses served from nearest PoP. The pipeline writes to the edge; the edge never calls origin.
4. **Format-aware, not format-locked.** Pipeline produces multiple output formats (Markdown, enriched HTML, structured JSON) from a single crawl. Serving layer selects optimal format per client.
5. **Cost scales with value, not traffic.** Cached responses cost ~$0 to serve. Only fresh crawls incur meaningful cost. Decouple "serve" cost from "generate" cost.
6. **Customer infrastructure stays in control.** At Level 2 (middleware), the customer's stack calls CrawlReady. At Level 3 (DNS proxy), CrawlReady proxies but never modifies human traffic.

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
│  (headless     │ (Schema gen,       │ (multi-fmt  │ Detect  │
│   browser)     │  Markdown, enrich) │  per-page)  │ (diff)  │
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

## 1. Site Discovery & Page Tree Management

### Discovery Pipeline

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

### Page Removal Detection

1. **Soft-delete** — `status = 'removed'`, retain cache 7 days
2. **Serve 410 to bots** — signals de-indexing
3. **Alert customer** — "15 pages removed since last crawl"
4. **Hard-delete cache** — after retention window

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

### 4-Stage Pipeline

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
┌─ Stage 3: Multi-Format Renderer ───────────────────────┐
│                                                         │
│  Format A — Markdown                                    │
│    For: GPTBot, ClaudeBot, PerplexityBot, Accept: md    │
│    GFM with YAML frontmatter. Target < 8K tokens.       │
│                                                         │
│  Format B — Enriched HTML                               │
│    For: Google-Extended (AI Overviews)                   │
│    clean_html + injected Schema.org JSON-LD in <head>   │
│                                                         │
│  Format C — ARIA-Enhanced HTML                          │
│    For: Visual agents (Operator, Computer Use)           │
│    Original HTML + injected ARIA attributes              │
│                                                         │
│  Format D — Structured JSON                             │
│    For: Programmatic agents, MCP clients                 │
│    Machine-readable content + Schema as top-level data   │
│                                                         │
│  Output: CacheEntry[] (one per format)                   │
└────────────────────────┬───────────────────────────────┘
                         ▼
┌─ Stage 4: Content Parity Verification ─────────────────┐
│  - Text coverage: extracted ⊇ 95% of origin text       │
│  - Fact preservation: prices, dates, names in all fmts  │
│  - No hallucination: Schema only from visible content   │
│  - On failure: block cache write, serve stale/origin    │
└────────────────────────────────────────────────────────┘
```

### Pipeline Execution Modes

| Mode | Trigger | Latency Budget | Workers |
|---|---|---|---|
| **Batch** (pre-crawl) | Scheduler, TTL, webhook | Minutes | Worker pool |
| **On-the-fly** (cache miss) | Edge miss → queue | < 15s | Dedicated fast-path |
| **Re-process** (pipeline upgrade) | New version deployed | Hours | Low-priority pool |

### On-the-Fly Fallback Strategy

When a bot hits a page with no cache:

- **SSR sites:** Serve lightweight Markdown conversion of raw-fetched HTML (fast, content-rich)
- **CSR sites:** Serve origin HTML as-is (raw HTML is empty anyway — nothing to convert)
- Both: enqueue P0 crawl. Next bot request served from warm cache.

---

## 4. Cache Layer & Storage

### 3-Tier Cache Topology

```
L1: Edge Cache (Cloudflare Workers KV)
    - Global read: < 50ms from any PoP
    - Key: cr:{tenant_hash}:{url_hash}:{format}
    - Eventually consistent (60s propagation)
    - 99%+ of bot requests served here
         │ (miss)
         ▼
L2: Origin Cache (Cloudflare R2)
    - Durable, consistent
    - All format variants + metadata + parity report
    - Key: {tenant}/{domain}/{url_hash}/{format}/{ts}.ext
    - Source-of-truth for L1 rehydration
    - Historical version retention
         │ (miss)
         ▼
L3: On-the-Fly Generation
    - Page never crawled
    - Enqueue P0 crawl, serve fallback
    - Write to L2 → propagate to L1
```

### Cache Invalidation (4 triggers)

| Trigger | Mechanism | Latency |
|---|---|---|
| **Customer webhook** (`POST /api/v1/recache`) | L1 purge + P1 re-crawl | < 30s |
| **Content change detected** (ETag mismatch) | L1 purge + P2 re-crawl | < 5min |
| **TTL expiry** | L1 auto-expires | Per-tier TTL |
| **Pipeline version upgrade** | Background re-process from L2 HTML | Hours |

### Stale-While-Revalidate

TTL expired → serve stale content immediately + enqueue background re-crawl (P3, deduplicated). Bot gets fast response; cache refreshes asynchronously. Prevents thundering herd on TTL expiry.

### Storage Cost (Projected)

| Scale | Pages | L1 KV/mo | L2 R2/mo | Total |
|---|---|---|---|---|
| 100 tenants × 500 pages | 50K | ~$5 | ~$2 | ~$7 |
| 1K × 1K | 1M | ~$50 | ~$30 | ~$80 |
| 10K × 2K | 20M | ~$500 | ~$300 | ~$800 |

Storage is negligible. Crawl compute is the dominant cost.

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

---

*Continued in Part 2: Serving, Integration, and Architectural Recommendations.*
