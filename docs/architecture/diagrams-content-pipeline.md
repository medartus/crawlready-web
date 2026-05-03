# Content Pipeline Architecture — C4 Mermaid Diagrams

Precise end-to-end flow diagrams of the CrawlReady content pipeline infrastructure, based on `content-pipeline-infrastructure.md`. Uses C4 model levels: Context → Container → Component, plus detailed request-flow and decision diagrams.

---

## 1. C4 Context Diagram — System Landscape

Who interacts with CrawlReady and what are the external boundaries.

```mermaid
C4Context
  title CrawlReady — System Context Diagram

  Person(ai_bot, "AI Bot / Crawler", "GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.")
  Person(human, "Human Visitor", "Regular browser traffic — never modified")
  Person(customer, "Customer (Site Owner)", "Manages site via dashboard, deploys webhooks")

  System(crawlready, "CrawlReady Platform", "Scores, monitors, and optimizes websites for AI crawlers. Produces Optimized HTML + Markdown.")

  System_Ext(customer_origin, "Customer Origin", "Customer's web server (example.com). SSR, CSR, or hybrid.")
  System_Ext(cloudflare, "Cloudflare Edge Network", "CDN, Workers, KV, R2, Cache API, HTMLRewriter, Markdown for Bots")
  System_Ext(crawl_saas, "Crawling SaaS Provider", "Firecrawl (Phase 0-1) → Self-hosted Playwright (Phase 2+)")

  Rel(ai_bot, crawlready, "Requests page content", "HTTP GET with UA / Accept header")
  Rel(human, customer_origin, "Browses website", "HTTPS — passthrough, never modified")
  Rel(customer, crawlready, "Configures site, views dashboard, sends webhooks", "HTTPS / API")
  Rel(crawlready, customer_origin, "Crawls pages, fetches sitemaps, checks ETags", "HTTP GET/HEAD")
  Rel(crawlready, cloudflare, "Edge serving, caching, HTMLRewriter transforms", "Workers API")
  Rel(crawlready, crawl_saas, "Headless browser rendering", "API calls")
```

---

## 2. C4 Container Diagram — Three Planes

The three architectural planes and their containers.

```mermaid
C4Container
  title CrawlReady — Container Diagram (Three Planes)

  Person(ai_bot, "AI Bot / Crawler", "GPTBot, ClaudeBot, PerplexityBot, etc.")
  Person(customer, "Customer", "Site owner")
  System_Ext(customer_origin, "Customer Origin", "example.com")

  System_Boundary(crawlready, "CrawlReady Platform") {

    System_Boundary(control_plane, "Control Plane") {
      Container(site_registry, "Site Registry", "Supabase PG", "Tenants, domains, tiers, config")
      Container(page_tree, "Page Tree Manager", "Supabase PG", "Discovery, inventory, coverage tracking")
      Container(scheduler, "Scheduler", "Cloudflare Queues / BullMQ", "Crawl orchestration, priority queue P0-P5")
      Container(metering, "Metering Service", "Edge counters + PG", "Rate limits, budget enforcement, usage tracking")
    }

    System_Boundary(data_plane, "Data Plane") {
      Container(crawl_workers, "Crawl Workers", "Firecrawl → Playwright", "Headless browser + lightweight HTTP fetch")
      Container(transform_pipeline, "Transform Pipeline", "Event-driven workers", "4-stage: Extract → Schema → Render → Parity")
      Container(change_detect, "Change Detector", "Polling + webhooks", "ETag, lastmod, content hash, webhook, RSS")
    }

    System_Boundary(cache_layer, "Cache Layer") {
      Container(l0_cache, "L0: Origin HTML Cache", "Cloudflare Cache API", "Raw origin HTML, per-PoP, $0 cost")
      Container(l1_cache, "L1: Product Cache", "Cloudflare Workers KV", "Processed output (Opt. HTML + Markdown), global <50ms")
      Container(l2_store, "L2: Durable Store", "Cloudflare R2", "All format variants + metadata + historical versions")
    }

    System_Boundary(serving_plane, "Serving Plane — Cloudflare Workers (300+ PoPs)") {
      Container(edge_worker, "Edge Worker", "Cloudflare Workers (V8 isolates)", "Bot detect → Format route → Cache lookup → Fallback")
      Container(html_rewriter, "HTMLRewriter", "Cloudflare HTMLRewriter API", "Real-time Schema + ARIA injection for SSR (Business+)")
    }
  }

  Rel(ai_bot, edge_worker, "HTTP request", "UA + Accept header")
  Rel(customer, site_registry, "Register site, configure", "API / Dashboard")
  Rel(customer, scheduler, "Deploy webhook", "POST /api/v1/recache")
  Rel(edge_worker, l1_cache, "Cache lookup", "KV GET")
  Rel(edge_worker, l2_store, "L1 miss fallback", "R2 GET")
  Rel(edge_worker, html_rewriter, "SSR real-time transform", "HTMLRewriter API")
  Rel(edge_worker, l0_cache, "Origin HTML for HTMLRewriter", "Cache API GET")
  Rel(edge_worker, metering, "Async beacon", "{ tenant, url, bot, format, status }")
  Rel(scheduler, crawl_workers, "Dispatch crawl jobs", "Queue")
  Rel(crawl_workers, customer_origin, "Fetch / render pages", "HTTP GET / headless browser")
  Rel(crawl_workers, transform_pipeline, "Raw crawl output", "Event")
  Rel(transform_pipeline, l1_cache, "Write processed content", "KV PUT")
  Rel(transform_pipeline, l2_store, "Write durable copy", "R2 PUT")
  Rel(change_detect, customer_origin, "ETag/HEAD/sitemap polling", "HTTP HEAD/GET")
  Rel(change_detect, scheduler, "Changed pages", "Enqueue P2")
  Rel(page_tree, scheduler, "TTL-expired pages", "Enqueue P3/P4")
```

---

## 3. C4 Component Diagram — Edge Worker (Serving Plane)

Detailed internals of the Edge Worker — the entry point for every bot request.

```mermaid
C4Component
  title Edge Worker — Component Diagram

  Container_Ext(ai_bot, "AI Bot", "GPTBot, ClaudeBot, etc.")
  Container_Ext(l1_kv, "L1: Workers KV", "Product cache")
  Container_Ext(l2_r2, "L2: R2", "Durable store")
  Container_Ext(l0_cache_api, "L0: Cache API", "Origin HTML")
  Container_Ext(customer_origin, "Customer Origin", "example.com")
  Container_Ext(crawl_queue, "Crawl Queue", "P0-P5 scheduler")
  Container_Ext(metering_svc, "Metering", "Usage counters")
  Container_Ext(html_rewriter_svc, "HTMLRewriter", "Real-time transform")

  System_Boundary(edge, "Edge Worker (Cloudflare Worker)") {
    Component(bot_detector, "Bot Detector", "JS module", "UA pattern match → IP/CIDR verification (KV-cached) → classification: verified_bot | unverified | content_negotiation | human")
    Component(format_router, "Format Router", "JS module", "Accept: text/markdown → Markdown; everything else → Optimized HTML")
    Component(route_classifier, "Route Classifier", "JS module", "Lookup per-route SSR/CSR/hybrid classification from KV")
    Component(cache_resolver, "Cache Resolver", "JS module", "L1 lookup → L2 fallback → OTF/HTMLRewriter fallback. Stale-while-revalidate.")
    Component(fallback_handler, "Fallback Handler", "JS module", "SSR: Cloudflare Md for Bots or HTMLRewriter. CSR: origin passthrough + P0 enqueue. Budget exhausted: origin passthrough.")
    Component(response_builder, "Response Builder", "JS module", "Add X-CrawlReady headers (hit|stale|miss), Content-Type, ETA")
    Component(metering_beacon, "Metering Beacon", "Async JS", "Fire-and-forget: { tenant, url, bot_type, format, cache_status, latency }")
  }

  Rel(ai_bot, bot_detector, "Incoming HTTP request")
  Rel(bot_detector, format_router, "bot_type, is_bot=true")
  Rel(bot_detector, customer_origin, "is_bot=false → passthrough to origin")
  Rel(format_router, route_classifier, "desired_format")
  Rel(route_classifier, cache_resolver, "format + route_type (ssr|csr|hybrid)")
  Rel(cache_resolver, l1_kv, "KV GET cr:{tenant}:{url}:{format}")
  Rel(cache_resolver, l2_r2, "L1 miss → R2 GET")
  Rel(cache_resolver, fallback_handler, "L1+L2 miss")
  Rel(fallback_handler, html_rewriter_svc, "SSR + Opt HTML → HTMLRewriter path (Business+)")
  Rel(fallback_handler, l0_cache_api, "Fetch origin HTML for HTMLRewriter")
  Rel(fallback_handler, crawl_queue, "Enqueue P0 crawl")
  Rel(fallback_handler, customer_origin, "CSR fallback / budget exhausted → origin passthrough")
  Rel(cache_resolver, response_builder, "content + cache_status")
  Rel(fallback_handler, response_builder, "fallback content + miss/budget-exhausted")
  Rel(response_builder, metering_beacon, "After response sent")
  Rel(metering_beacon, metering_svc, "Async beacon")
```

---

## 4. C4 Component Diagram — Data Plane (Content Transformation)

The 4-stage transformation pipeline in detail.

```mermaid
C4Component
  title Data Plane — Content Transformation Pipeline Components

  Container_Ext(crawl_output, "Crawl Workers", "Raw HTML + metadata from headless browser or HTTP fetch")
  Container_Ext(l1_kv, "L1: Workers KV", "Product cache")
  Container_Ext(l2_r2, "L2: R2", "Durable store")
  Container_Ext(alert_svc, "Alert Service", "Customer notifications")

  System_Boundary(pipeline, "Transform Pipeline (4 Stages)") {
    Component(stage1, "Stage 1: Content Extraction", "Worker", "Strip non-content (<nav>, <script>, <style>, ads). Identify <main>. Preserve headings, lists, tables, code. Extract metadata, existing Schema.org, OG tags. Output: ContentExtract.")
    Component(stage2, "Stage 2: Schema.org Generation", "Worker", "Parallel pattern detectors: FAQ, Product, HowTo, Organization. Confidence >= 0.75 to emit. Never overwrite existing Schema. Validate against spec. Output: SchemaResult.")
    Component(stage3, "Stage 3: Output Renderer", "Worker", "Primary: Optimized HTML (clean + JSON-LD + ARIA + noise-stripped + OG/meta). Secondary: Markdown (GFM + YAML frontmatter, <8K tokens). Only if Accept: text/markdown exists. Output: CacheEntry[].")
    Component(stage4, "Stage 4: Content Parity Verification", "Worker", "Token-based Jaccard similarity. Exclude dynamic tokens. Threshold >= 0.90. On fail: block cache write, serve stale/origin, log + alert.")
  }

  Rel(crawl_output, stage1, "Raw HTML + metadata")
  Rel(stage1, stage2, "ContentExtract { clean_html, text, metadata, existing_schema, heading_tree, content_hash }")
  Rel(stage2, stage3, "SchemaResult { generated, existing, merged }")
  Rel(stage3, stage4, "CacheEntry[] (Optimized HTML, Markdown)")
  Rel(stage4, l1_kv, "Parity PASS → KV PUT")
  Rel(stage4, l2_r2, "Parity PASS → R2 PUT (durable + historical)")
  Rel(stage4, alert_svc, "Parity FAIL → block write, alert customer")
```

---

## 5. End-to-End Flow — Bot Request (Complete Path)

Full flowchart from incoming bot request to response, covering all decision points.

```mermaid
flowchart TD
    A["Incoming HTTP Request"] --> B{"Bot Detection"}

    B -->|"Accept: text/markdown"| C["bot_type = content_negotiation"]
    B -->|"UA matches AI bot pattern"| D{"IP/CIDR Verification<br/>(cached in KV, refreshed daily)"}
    B -->|"No match"| E["bot_type = human<br/>→ Passthrough to origin"]

    D -->|"Verified"| F["bot_type = specific_bot<br/>(GPTBot, ClaudeBot, etc.)"]
    D -->|"Unverified"| G["bot_type = unverified"]

    C --> H{"Format Selection"}
    F --> H
    G --> H

    H -->|"Accept: text/markdown"| I["format = Markdown"]
    H -->|"Everything else"| J["format = Optimized HTML"]

    I --> K{"Route Classification<br/>(per-route SSR/CSR/hybrid from KV)"}
    J --> K

    K --> L{"L1 Cache Lookup<br/>KV GET cr:{tenant}:{url}:{format}"}

    L -->|"HIT (fresh)"| M["Serve cached content<br/>X-CrawlReady: hit"]
    L -->|"HIT (stale, TTL expired)"| N["Serve stale content<br/>X-CrawlReady: stale<br/>+ Enqueue background P3 re-crawl"]
    L -->|"MISS"| O{"L2 Lookup (R2)"}

    O -->|"HIT"| P["Rehydrate L1 from L2<br/>Serve content"]
    O -->|"MISS"| Q{"Route Type?"}

    Q -->|"SSR + format=Markdown"| R["Cloudflare Markdown for Bots<br/>(graceful degradation)<br/>+ Enqueue P0 crawl"]
    Q -->|"SSR + format=HTML<br/>(Business+)"| S{"L0 Cache Lookup<br/>(Cache API — origin HTML)"}
    Q -->|"SSR + format=HTML<br/>(Starter/Pro)"| T["Serve origin HTML as-is<br/>+ Enqueue P0 crawl"]
    Q -->|"CSR (any format)"| U["Serve origin HTML as-is<br/>(empty shell — no alternative)<br/>+ Enqueue P0 crawl"]

    S -->|"HIT"| V["HTMLRewriter transforms:<br/>• Inject Schema.org JSON-LD<br/>• Add ARIA enrichments<br/>• Strip noise<br/>• Clean semantic structure<br/>X-CrawlReady: miss"]
    S -->|"MISS"| W["Fetch origin HTML<br/>→ cache.put() in L0<br/>→ HTMLRewriter transforms"]

    W --> V

    Q -->|"Budget exhausted<br/>(any route)"| X["Origin passthrough<br/>X-CrawlReady: budget-exhausted<br/>No crawl enqueued"]

    M --> Y["Metering Beacon (async)<br/>{ tenant, url, bot, format,<br/>cache_status, latency }"]
    N --> Y
    P --> Y
    R --> Y
    T --> Y
    U --> Y
    V --> Y
    X --> Y

    Y --> Z["Response to Bot"]
```

---

## 6. Request Flow — Level 2 (Middleware SDK)

Sequence diagram for when the customer uses the CrawlReady middleware SDK.

```mermaid
sequenceDiagram
    autonumber
    participant Bot as AI Bot<br/>(GPTBot, ClaudeBot, etc.)
    participant Origin as Customer Origin<br/>(example.com)
    participant MW as CrawlReady Middleware<br/>(@crawlready/next, /node, /cloudflare)
    participant Edge as CrawlReady Edge Worker<br/>(edge.crawlready.app)
    participant L1 as L1: Workers KV<br/>(Product Cache)
    participant L2 as L2: R2<br/>(Durable Store)
    participant Queue as Crawl Queue<br/>(Scheduler)
    participant Meter as Metering

    Bot->>Origin: GET /pricing HTTP/1.1<br/>User-Agent: GPTBot/1.0<br/>Accept: text/html

    Note over MW: Middleware intercepts request<br/>before route handler

    MW->>MW: Bot Detection<br/>UA check: GPTBot → verified bot

    alt Bot detected
        MW->>Edge: GET /serve/{site_key}/{url_hash}<br/>Accept: text/html<br/>X-CrawlReady-Bot: GPTBot

        Edge->>L1: KV GET cr:{tenant}:{url}:html

        alt L1 HIT (fresh)
            L1-->>Edge: Optimized HTML<br/>(Schema.org + ARIA + noise-stripped)
            Edge-->>MW: 200 OK<br/>Content-Type: text/html<br/>X-CrawlReady: hit
        else L1 HIT (stale)
            L1-->>Edge: Stale Optimized HTML
            Edge->>Queue: Enqueue P3 re-crawl (async, deduplicated)
            Edge-->>MW: 200 OK<br/>X-CrawlReady: stale
        else L1 MISS
            Edge->>L2: R2 GET {tenant}/{url_hash}/html
            alt L2 HIT
                L2-->>Edge: Stored Optimized HTML
                Edge->>L1: Rehydrate L1 (async)
                Edge-->>MW: 200 OK<br/>X-CrawlReady: hit
            else L2 MISS
                Edge->>Queue: Enqueue P0 crawl (immediate)
                Edge-->>MW: Fallback response<br/>X-CrawlReady: miss<br/>X-CrawlReady-ETA: 15
            end
        end

        Edge->>Meter: Async beacon<br/>{ tenant, url, GPTBot, html, hit, 45ms }

        MW-->>Bot: Serve CrawlReady response as HTTP response

    else Not a bot (human traffic)
        MW->>MW: No-op passthrough
        Origin-->>Bot: Normal HTML page (unmodified)
    end

    Note over MW: Fail-safe: Edge timeout >2s or 5xx<br/>→ serve origin content as-is.<br/>Customer site NEVER degraded.
```

---

## 7. Request Flow — Level 3 (DNS Proxy)

Sequence diagram for when the customer uses DNS CNAME proxy to CrawlReady.

```mermaid
sequenceDiagram
    autonumber
    participant Bot as AI Bot<br/>(ClaudeBot)
    participant DNS as DNS<br/>example.com CNAME<br/>→ proxy.crawlready.app
    participant Edge as CrawlReady Edge Worker<br/>(Cloudflare Workers)
    participant L0 as L0: Cache API<br/>(Origin HTML — per-PoP)
    participant L1 as L1: Workers KV<br/>(Product Cache)
    participant L2 as L2: R2<br/>(Durable Store)
    participant HRW as HTMLRewriter<br/>(Real-time transform)
    participant Origin as Customer Origin<br/>(actual IP)
    participant Queue as Crawl Queue
    participant Meter as Metering

    Bot->>DNS: GET https://example.com/blog/post-1<br/>User-Agent: ClaudeBot/1.0

    DNS-->>Edge: Resolved to proxy.crawlready.app<br/>TLS terminated by Cloudflare

    Note over Edge: CrawlReady receives ALL traffic<br/>for this domain

    Edge->>Edge: Step 1: Bot Detection<br/>UA: ClaudeBot → verify IP against CIDR<br/>Result: bot_type = "ClaudeBot" (verified)

    Edge->>Edge: Step 2: Format Selection<br/>No Accept: text/markdown<br/>→ format = Optimized HTML

    Edge->>Edge: Step 3: Route Classification<br/>KV lookup: /blog/* = SSR

    Edge->>L1: KV GET cr:{tenant}:{url}:html

    alt L1 HIT (fresh)
        L1-->>Edge: Optimized HTML
        Edge-->>Bot: 200 OK<br/>Content-Type: text/html<br/>X-CrawlReady: hit<br/>X-CrawlReady-Generated: 2026-04-30T12:00:00Z
    else L1 MISS + SSR route + Business tier
        Note over Edge: HTMLRewriter real-time path<br/>(0 extra hops — CrawlReady IS the edge)

        Edge->>L0: Cache API GET (origin HTML)
        alt L0 HIT
            L0-->>Edge: Cached origin HTML
        else L0 MISS
            Edge->>Origin: Fetch origin HTML
            Origin-->>Edge: Raw HTML
            Edge->>L0: cache.put() (TTL per origin Cache-Control)
        end

        Edge->>L1: Lookup pre-computed Schema + ARIA rules

        Edge->>HRW: HTMLRewriter transform:<br/>• Inject Schema.org JSON-LD into head<br/>• Add ARIA (role, aria-label on landmarks)<br/>• Strip noise (nav, footer, tracking)<br/>• Clean semantic structure

        HRW-->>Edge: Transformed Optimized HTML

        Edge->>Queue: Enqueue P0 crawl (async backfill for full pipeline)
        Edge-->>Bot: 200 OK<br/>X-CrawlReady: miss (real-time transform)
    end

    Edge->>Meter: Async beacon

    Note over Edge: Human traffic path (separate):<br/>bot_type = human<br/>→ transparent proxy to origin<br/>→ NO modification whatsoever
```

---

## 8. Request Flow — Level 3: Human vs Bot Routing

Shows how DNS proxy mode handles both traffic types.

```mermaid
flowchart TD
    A["ALL traffic arrives at<br/>proxy.crawlready.app<br/>(DNS CNAME from example.com)"] --> B{"Bot Detection"}

    B -->|"Verified AI Bot<br/>(UA + IP/CIDR match)"| C["Bot Path"]
    B -->|"Unverified Bot<br/>(UA match, IP mismatch)"| D["Bot Path<br/>(with unverified flag)"]
    B -->|"Content Negotiation<br/>(Accept: text/markdown)"| E["Bot Path"]
    B -->|"Human<br/>(no bot signals)"| F["Human Path"]

    C --> G{"Format Router"}
    D --> G
    E --> G

    G -->|"Accept: text/markdown"| H["Markdown Path"]
    G -->|"Everything else"| I["Optimized HTML Path"]

    H --> J["Cache Lookup<br/>L1 → L2 → Fallback"]
    I --> J

    J -->|"HIT"| K["Serve cached content<br/>+ metering beacon"]
    J -->|"MISS + SSR + Business+"| L["HTMLRewriter real-time<br/>(L0 origin HTML → transform)"]
    J -->|"MISS + SSR + Starter/Pro"| M["Cloudflare Md for Bots (md)<br/>or origin passthrough (html)<br/>+ P0 crawl enqueue"]
    J -->|"MISS + CSR"| N["Origin passthrough<br/>(empty shell — no alt)<br/>+ P0 crawl enqueue"]

    F --> O["Transparent Proxy<br/>to Customer Origin"]
    O --> P["Origin responds"]
    P --> Q["Return to human visitor<br/>ZERO modification<br/>(SSL managed by Cloudflare)"]

    K --> R["Response to Bot"]
    L --> R
    M --> R
    N --> R
```

---

## 9. Hybrid Strategy — Pre-Crawl vs On-the-Fly Decision Flow

The tier-aware algorithm that determines which pages get pre-crawled vs served on-the-fly.

```mermaid
flowchart TD
    A["Page in Inventory"] --> B{"Is homepage?"}

    B -->|"Yes"| C["PRE-CRAWL<br/>(always warm)"]
    B -->|"No"| D{"Discovered via webhook?"}

    D -->|"Yes"| C
    D -->|"No"| E{"Tenant Tier?"}

    E -->|"Starter ($29/mo)"| F{"In top 5 pages<br/>by bot traffic?"}
    E -->|"Pro ($49/mo)"| G{"From sitemap OR<br/>bot_traffic_30d >= 3?"}
    E -->|"Business ($199/mo)"| H{"Page status = active?"}
    E -->|"Enterprise"| C

    F -->|"Yes"| C
    F -->|"No"| I["ON-THE-FLY<br/>(serve fallback + async backfill)"]

    G -->|"Yes"| C
    G -->|"No"| I

    H -->|"Yes"| C
    H -->|"No"| I

    C --> J["Scheduler assigns priority:<br/>P1 (webhook) / P2 (ETag) / P3-P4 (TTL)"]
    J --> K["Crawl Worker executes"]
    K --> L["Transform Pipeline<br/>(4 stages)"]
    L --> M["Write to L1 (KV) + L2 (R2)"]

    I --> N["Bot hits uncached page"]
    N --> O["Edge serves fallback<br/>(origin / Cloudflare Md / HTMLRewriter)"]
    O --> P["Enqueue P0 crawl<br/>(immediate priority)"]
    P --> K
```

---

## 10. Content Discovery & Ingestion Pipeline

End-to-end from site registration through page inventory.

```mermaid
flowchart TD
    A["Site Registration<br/>(customer adds domain)"] --> B["SSR/CSR Auto-Detection<br/>(dual-fetch comparison)"]

    B --> C["Sample 5 URLs"]
    C --> D["Fetch A: Raw HTTP GET<br/>(no JS — strip layout elements)"]
    C --> E["Fetch B: Headless browser<br/>(full JS — strip layout elements)"]

    D --> F["content_ratio = len(raw) / len(rendered)"]
    E --> F

    F -->|">= 0.85"| G["Route = SSR"]
    F -->|"<= 0.15"| H["Route = CSR"]
    F -->|"0.15 - 0.85"| I["Route = HYBRID"]

    G --> J["Per-route classification stored<br/>{ /: ssr, /blog/*: ssr, /app/*: csr }"]
    H --> J
    I --> J

    A --> K["Discovery Sources<br/>(parallel)"]

    K --> L["Sitemap Parser<br/>(XML, index, RSS/Atom)"]
    K --> M["robots.txt Parser<br/>(directives, Sitemap: loc)"]
    K --> N["HTML Link Crawler<br/>(breadth-first, weekly)"]
    K --> O["Customer Webhook<br/>(deploy hook)"]
    K --> P["Bot Traffic Logs<br/>(analytics middleware)"]

    L --> Q["Page Tree Reconciler<br/>(dedup, normalize,<br/>robots.txt filter, prioritize)"]
    M --> Q
    N --> Q
    O --> Q
    P --> Q

    Q --> R["Page Inventory<br/>(per tenant)"]

    R --> S["Coverage Dashboard<br/>Pages Optimized: 347/412 (84%)"]
    R --> T["Scheduler picks up<br/>pages for crawling"]
```

---

## 11. Cache Topology — 4-Tier Lookup & Write Flow

```mermaid
flowchart TD
    subgraph Read_Path ["Read Path (Bot Request)"]
        R1["Edge Worker receives<br/>bot request"] --> R2{"L1: Workers KV<br/>Global <50ms"}

        R2 -->|"HIT (fresh)"| R3["Serve immediately<br/>X-CrawlReady: hit"]
        R2 -->|"HIT (stale)"| R4["Serve stale<br/>+ enqueue P3 re-crawl<br/>X-CrawlReady: stale"]
        R2 -->|"MISS"| R5{"L2: R2<br/>(Durable Store)"}

        R5 -->|"HIT"| R6["Rehydrate L1<br/>+ Serve"]
        R5 -->|"MISS"| R7{"L0: Cache API<br/>(Origin HTML — per-PoP)"}

        R7 -->|"HIT + SSR + Business+"| R8["HTMLRewriter transform<br/>(real-time Schema + ARIA)"]
        R7 -->|"MISS"| R9["Fetch origin HTML<br/>→ cache.put() in L0"]
        R9 --> R8

        R5 -->|"MISS + CSR or no HTMLRewriter"| R10["L3: On-the-Fly Generation<br/>Serve fallback<br/>+ Enqueue P0 crawl"]
    end

    subgraph Write_Path ["Write Path (Pipeline Output)"]
        W1["Transform Pipeline<br/>produces CacheEntry[]"] --> W2{"Content Parity<br/>Jaccard >= 0.90?"}

        W2 -->|"PASS"| W3["Write to L2 (R2)<br/>+ metadata + parity report"]
        W3 --> W4["Propagate to L1 (KV)<br/>key: cr:{tenant}:{url}:{format}"]

        W2 -->|"FAIL"| W5["Block cache write<br/>Serve stale or origin<br/>Log + alert customer"]
    end

    subgraph Invalidation ["Cache Invalidation (4 Triggers)"]
        I1["Customer webhook<br/>POST /api/v1/recache"] --> I5["Purge L0 + L1<br/>+ P1 re-crawl<br/>(< 30s)"]
        I2["ETag mismatch<br/>(content change detected)"] --> I6["Purge L0 + L1<br/>+ P2 re-crawl<br/>(< 5min)"]
        I3["TTL expiry"] --> I7["L1 auto-expires<br/>L0 short-TTL"]
        I4["Pipeline version upgrade"] --> I8["Background re-process<br/>from L2 stored HTML<br/>(hours, low-priority)"]
    end
```

---

## 12. Change Detection Hierarchy

```mermaid
flowchart TD
    A["Change Detection<br/>(cheapest → most expensive)"] --> B["Tier 1: Zero-Cost Signals<br/>(passive)"]
    A --> C["Tier 2: Lightweight Polling<br/>(~$0/check)"]
    A --> D["Tier 3: Content Hash<br/>(moderate cost)"]
    A --> E["Tier 4: Full Re-Crawl<br/>($0.01-0.05/page)"]

    B --> B1["Customer deploy webhook"]
    B --> B2["Sitemap lastmod comparison"]
    B --> B3["RSS/Atom new entries"]
    B --> B4["Bot traffic spike on URL"]

    C --> C1["HTTP HEAD + If-None-Match (ETag)"]
    C --> C2["HTTP HEAD + If-Modified-Since"]

    D --> D1["Fetch raw HTML body (no JS)"]
    D1 --> D2["Hash text content"]
    D2 --> D3{"Hash changed?"}
    D3 -->|"Yes"| D4["Trigger full re-crawl"]
    D3 -->|"No"| D5["No action needed"]

    E --> E1["Headless browser render<br/>+ full transform pipeline"]
    E1 --> E2{"Content changed?"}
    E2 -->|"Yes"| E3["Write new cache entry"]
    E2 -->|"No"| E4["Update TTL only<br/>(no cache write)"]

    subgraph Strategy_Per_Site_Type ["Strategy per Site Type"]
        S1["SSR + Sitemap → lastmod primary, ETag fallback"]
        S2["SSR no sitemap → ETag primary, content hash fallback"]
        S3["CSR/SPA → Webhook essential, TTL expiry fallback"]
        S4["Hybrid → Sitemap + webhook, per-route detection"]
        S5["Static SSG → Deploy webhook primary, lastmod fallback"]
    end
```

---

## 13. Resilience & Failure Modes

```mermaid
flowchart TD
    subgraph Failures ["Failure Modes & Mitigations"]
        F1["Crawl Worker crash / timeout"] --> M1["Retry 3x with backoff<br/>→ Dead-letter queue"]
        F2["Customer origin 5xx / rate limit"] --> M2["Circuit breaker:<br/>5min → 30min → 2hr<br/>Serve stale cache<br/>Alert customer"]
        F3["Edge KV read latency spike"] --> M3["L2 (R2) fallback<br/>KV has 99.99% read SLA"]
        F4["Schema extraction error"] --> M4["Serve without Schema<br/>(graceful degradation)"]
        F5["Content parity failure<br/>(Jaccard < 0.90)"] --> M5["Block cache write<br/>Serve stale or origin<br/>Alert customer"]
        F6["Crawl queue backpressure"] --> M6["Shed P5 (discovery)<br/>Preserve P0-P2 capacity"]
        F7["CrawlReady edge outage"] --> M7["Middleware fails-open<br/>(serves origin)<br/>Human traffic: NEVER affected"]
    end

    subgraph Properties ["Key Properties"]
        P1["Idempotency: Every crawl job safe to retry"]
        P2["Durability: L2 (R2) is durability layer<br/>L1 is regenerable read cache"]
        P3["Fail-open: Customer middleware<br/>always serves origin on failure"]
    end
```

---

## 14. Phase Evolution — Technology Migration Path

```mermaid
flowchart LR
    subgraph Phase_0_1 ["Phase 0-1 (Current)"]
        A1["Firecrawl API"] --- A2["Vercel Background Fn"]
        A2 --- A3["In-process Transform"]
        A3 --- A4["Vercel Edge Middleware"]
        A4 --- A5["Vercel KV"]
        A5 --- A6["Supabase Storage"]
        A6 --- A7["Supabase PostgreSQL"]
    end

    subgraph Phase_2 ["Phase 2"]
        B1["Self-hosted Playwright<br/>(Fly.io / Railway)"] --- B2["Cloudflare Queues / BullMQ"]
        B2 --- B3["Event-driven Workers"]
        B3 --- B4["Cloudflare Workers"]
        B4 --- B5["Workers KV"]
        B5 --- B6["Cloudflare R2"]
        B6 --- B7["Supabase PostgreSQL"]
    end

    subgraph Phase_3_Plus ["Phase 3+ (Target)"]
        C1["Playwright Pool<br/>(browser reuse, pooling)"] --- C2["SQS FIFO<br/>(per-tenant partitions)"]
        C2 --- C3["Streaming Pipeline<br/>(stage retries)"]
        C3 --- C4["Workers + Durable Objects"]
        C4 --- C5["Workers KV +<br/>Durable Objects"]
        C5 --- C6["R2 + lifecycle policies"]
        C6 --- C7["PG + tenant partitioning"]
    end

    Phase_0_1 -->|"Trigger: 100K pages/mo<br/>or $500/mo Firecrawl COGS"| Phase_2
    Phase_2 -->|"Scale + sophistication"| Phase_3_Plus
```

---

## 15. Crawl Orchestration — Priority Queue & Worker Pool

```mermaid
flowchart TD
    subgraph Priority_Queue ["Priority Queue (P0 = highest)"]
        P0["P0: On-the-fly (cache miss)<br/>→ immediate"]
        P1["P1: Webhook invalidation<br/>→ < 30s"]
        P2["P2: Known-changed (ETag/lastmod)<br/>→ < 5min"]
        P3["P3: TTL-expired high-priority<br/>→ < 1hr"]
        P4["P4: TTL-expired low-priority<br/>→ best-effort"]
        P5["P5: Discovery crawls<br/>→ background"]
    end

    P0 --> WP
    P1 --> WP
    P2 --> WP
    P3 --> WP
    P4 --> WP
    P5 --> WP

    subgraph WP ["Worker Pool"]
        HB["Headless Browser Workers<br/>Full JS render, DOM extraction<br/>$0.01-0.05/pg, 3-15s latency"]
        LW["Lightweight HTTP Fetch<br/>Raw HTML, ETag check<br/>~$0/req, 0.1-2s latency"]
    end

    WP --> PC["Polite Crawling Contract"]

    PC --> PC1["Max 2 concurrent / domain"]
    PC --> PC2["Min 1s delay between requests"]
    PC --> PC3["Honor robots.txt Crawl-delay"]
    PC --> PC4["Per-tenant concurrency cap:<br/>5 (Starter) → 50 (Business)"]

    WP --> TP["Transform Pipeline<br/>(4 stages)"]

    subgraph Backpressure ["Backpressure Handling"]
        BP1["Queue depth > 1K (P0-P2)"] --> BP2["Scale workers horizontally"]
        BP3["Sustained backpressure"] --> BP4["Shed P5 (discovery)<br/>Preserve P0-P2"]
        BP5["Per-domain circuit breaker"] --> BP6["Back off on 429/5xx:<br/>5min → 30min → 2hr"]
    end
```

---

## 16. SSR HTMLRewriter Path — Detailed Flow (Business+ Tier)

```mermaid
flowchart TD
    A["Bot request for SSR page<br/>(no Accept: text/markdown)<br/>Business+ tier"] --> B{"L1: Workers KV<br/>Pre-generated Optimized HTML?"}

    B -->|"HIT"| C["Serve from cache<br/>X-CrawlReady: hit"]

    B -->|"MISS"| D{"L0: Cache API<br/>Cached origin HTML?"}

    D -->|"HIT"| E["Use cached origin HTML"]
    D -->|"MISS"| F["Fetch origin HTML"]
    F --> G["cache.put() in L0<br/>(TTL per origin Cache-Control<br/>or 5-15 min default)"]
    G --> E

    E --> H["Parallel: Lookup pre-computed<br/>Schema + ARIA rules from KV<br/>(generated on last crawl)"]

    H --> I["HTMLRewriter transforms:<br/>1. Inject Schema.org JSON-LD into head<br/>2. Add ARIA enrichments<br/>   (role, aria-label on landmarks/interactive)<br/>3. Strip noise (nav, footer, tracking scripts)<br/>4. Clean semantic structure"]

    I --> J["Serve transformed Optimized HTML<br/>X-CrawlReady: miss (real-time)<br/>Always fresh, ~$0 COGS"]

    J --> K["Enqueue P0 crawl (async)<br/>for full pipeline processing<br/>(Schema gen + ARIA rule computation)"]

    Note1["Key insight:<br/>SSR pages still need periodic crawling —<br/>not for content caching, but for<br/>Schema generation and ARIA rule computation.<br/>HTMLRewriter eliminates the content cache<br/>but not the Schema/ARIA cache."]

    style Note1 fill:#ffffcc,stroke:#cccc00,color:#333
```

---

## Legend

| Diagram | C4 Level | Purpose |
|---|---|---|
| §1 Context | L1 - Context | System boundaries and external actors |
| §2 Container | L2 - Container | Three planes and their containers |
| §3 Edge Worker Components | L3 - Component | Internals of the serving plane edge worker |
| §4 Data Plane Components | L3 - Component | Transform pipeline 4-stage internals |
| §5 End-to-End Flow | Flow | Complete bot request path with all decisions |
| §6 Level 2 Middleware | Sequence | Middleware SDK integration request flow |
| §7 Level 3 DNS Proxy | Sequence | DNS proxy integration request flow |
| §8 Human vs Bot Routing | Flow | DNS proxy traffic bifurcation |
| §9 Hybrid Strategy | Flow | Pre-crawl vs OTF tier-aware decision tree |
| §10 Discovery Pipeline | Flow | Site registration through page inventory |
| §11 Cache Topology | Flow | 4-tier read/write/invalidation paths |
| §12 Change Detection | Flow | Tiered detection hierarchy per site type |
| §13 Resilience | Flow | Failure modes and mitigations |
| §14 Phase Evolution | Flow | Technology migration path Phase 0→3+ |
| §15 Crawl Orchestration | Flow | Priority queue, worker pool, backpressure |
| §16 HTMLRewriter Path | Flow | Business+ SSR real-time transform detail |
