# Architecture: Content Pipeline & Serving Infrastructure — Part 2

Continuation of `content-pipeline-infrastructure.md`. Covers edge serving, customer integration, the pre-crawl vs. on-the-fly recommendation, resilience, scaling, and technology choices.

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
│  Step 2: Format Selection                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │ content_negotiation       → Markdown             │    │
│  │ GPTBot/ClaudeBot/Perplexity → Markdown           │    │
│  │ Google-Extended           → Enriched HTML+Schema │    │
│  │ Visual agents (Operator)  → ARIA-enhanced HTML   │    │
│  │ MCP / API clients         → Structured JSON      │    │
│  │ unverified                → Markdown (safe default)│   │
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
import { withCrawlReady } from '@crawlready/next';
export default withCrawlReady(nextConfig, {
  siteKey: process.env.CRAWLREADY_SITE_KEY,
});

// Express / Hono
import { crawlready } from '@crawlready/node';
app.use(crawlready({ siteKey: process.env.CRAWLREADY_SITE_KEY }));

// Cloudflare Worker
import { crawlreadyWorker } from '@crawlready/cloudflare';
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
| **Removed pages** | Serve cached 410 for 7 days, then purge | Clean de-indexing signal. |

### The Hybrid Algorithm

```python
def should_pre_crawl(page, tenant):
    # Always pre-crawl
    if page.url == tenant.homepage:          return True
    if page.discovered_via == 'webhook':     return True  # explicit push
    if page.priority >= 0.8:                 return True  # high sitemap priority

    # Pre-crawl if bots care
    if page.bot_traffic_30d >= 5:            return True

    # Pre-crawl if in sitemap AND within budget
    if page.discovered_via == 'sitemap' and tenant.crawl_budget_remaining > 0:
        return True

    # Everything else: on-the-fly
    return False
```

### Why Not Pure Pre-Crawl

- **Cost explosion:** 50K pages × $0.01/crawl × weekly = $2,000/month. Most pages get zero bot traffic.
- **Waste:** Top 10% of pages receive 90%+ of bot traffic. Pre-crawling the other 90% has near-zero ROI.
- **Freshness illusion:** 7-day TTL means most content is already stale when a bot visits.

### Why Not Pure On-the-Fly

- **Cold start penalty:** 5-15s latency on first bot visit. Bots may timeout.
- **Thundering herd:** Google-Extended crawling 500 pages in 10 minutes overwhelms worker pool.
- **No proactive optimization:** New pricing page sits unoptimized until first bot visit.

### Cost Comparison

| Strategy | 1K-page site (500 bot-visited) | 50K-page site (2K bot-visited) |
|---|---|---|
| Pure pre-crawl (weekly) | 4K crawls/mo = $40-200 | 200K crawls/mo = $2K-10K |
| Pure on-the-fly | 500 crawls/mo = $5-25 | 2K crawls/mo = $20-100 |
| **Balanced hybrid** | **~600 crawls/mo = $6-30** | **~3K crawls/mo = $30-150** |

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

## 12. SSR Sites: HTMLRewriter as a Complementary Fast Path

For SSR sites where origin HTML already contains content, Cloudflare's HTMLRewriter enables a **zero-cache real-time path**:

```
Bot request → Edge Worker
  → Fetch origin HTML
  → HTMLRewriter transforms in-flight:
    - Inject Schema.org JSON-LD into <head>
    - Strip <nav>, <footer>, tracking scripts
    - Add ARIA attributes to interactive elements
  → Serve transformed HTML
  → No cache needed, always fresh, ~$0 COGS
```

**Trade-off:**

| Dimension | Pre-Generated Cache | HTMLRewriter |
|---|---|---|
| CSR sites | Yes (renders JS) | **No** (can't execute JS) |
| SSR sites | Yes (cache overhead) | Yes (real-time, no cache) |
| Freshness | TTL-dependent | Always live |
| COGS | $0.01-0.05/page | ~$0/request |
| Schema injection | Pre-generated | Real-time via `<head>` append |

**Recommendation:** Offer HTMLRewriter as the default path for SSR customers (cheaper, fresher). Fall back to pre-generated cache only for CSR routes. The pipeline architecture supports both — HTMLRewriter is just a "Stage 3 variant" that runs at the edge instead of in the worker pool.

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
│    GPTBot/ClaudeBot → Markdown
│    Google-Extended  → Enriched HTML + Schema
│    Visual agents    → ARIA HTML
│    MCP clients      → Structured JSON
│    Accept: text/md  → Markdown
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

- **Serving topology:** Hybrid — Level 2 (middleware) and Level 3 (DNS proxy) from the same content pipeline. Consistent with existing docs.
- **Cache strategy:** Balanced hybrid — pre-crawl high-value pages (sitemap, bot-visited, webhook-pushed), on-the-fly for long-tail with async backfill. 5-60x cheaper than pure pre-crawl, eliminates cold starts for pages that matter.
- **Edge platform:** Cloudflare Workers for serving (0ms cold start, native KV, HTMLRewriter, R2 integration, $0.30/M requests). Not AWS Lambda@Edge (cold start, cost), not Vercel Edge (limited regions, no KV, no HTMLRewriter).
- **Cache topology:** L1 (Workers KV, hot, eventual consistency) → L2 (R2, durable, consistent) → L3 (on-the-fly generation).
- **Pipeline stages:** 4-stage (Extract → Schema Gen → Multi-Format Render → Parity Verify). Each stage independently testable and retryable.
- **Change detection:** Tiered approach (webhooks → ETag/HEAD → content hash → full re-crawl). CSR sites depend on webhooks; SSR sites use lightweight polling.
- **SSR optimization:** HTMLRewriter as a zero-cache real-time path for SSR sites. Complements pre-generated cache for CSR. Decision on when to implement deferred to Phase 2.
- **Polite crawling:** Max 2 concurrent requests per origin domain, 1s minimum delay, honor `Crawl-delay`. Non-negotiable.
- **Fail-open:** Customer middleware always serves origin on CrawlReady failure. Human traffic is never affected. CrawlReady being down must be invisible to end users.
- **Crawl engine migration:** Firecrawl → self-hosted Playwright when volume > 100K pages/mo or COGS > $500/mo.
