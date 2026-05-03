# Infrastructure Architecture — Mermaid Diagrams

Precise diagrams of CrawlReady's Phase 0 infrastructure, scan workflow, analytics/ingest pipeline, and cross-cutting concerns. Complements [diagrams-content-pipeline.md](./diagrams-content-pipeline.md) (which covers the Phase 2+ content pipeline).

---

## 1. Phase 0 System Topology — C4 Context

```mermaid
C4Context
  title CrawlReady Phase 0 — System Context Diagram

  Person(anon_user, "Anonymous User", "Enters URL, sees diagnostic score. No signup required.")
  Person(auth_user, "Authenticated User", "Registers sites, views dashboard, manages snippets. Clerk auth.")
  Person(customer_server, "Customer Server", "Runs middleware or serves script tag. Sends beacons.")

  System(crawlready, "CrawlReady Platform", "Next.js on Vercel. Scores, monitors, and optimizes websites for AI crawlers.")

  System_Ext(firecrawl, "Firecrawl API", "Headless browser rendering + HTML extraction. $19/mo, 500 credits.")
  System_Ext(supabase, "Supabase", "PostgreSQL database. Scans, sites, crawler_visits, subscribers.")
  System_Ext(upstash, "Upstash Redis", "Rate limiting, site key cache, budget counters. Free tier: 10K cmds/day.")
  System_Ext(clerk, "Clerk", "User authentication. Sign-up, sign-in, JWT sessions. Free tier: 10K MAU.")
  System_Ext(sentry, "Sentry", "Error tracking + structured logging breadcrumbs. Free tier: 5K errors/mo.")
  System_Ext(vercel_ec, "Vercel Edge Config", "Feature flags. < 1ms reads. Free tier.")

  Rel(anon_user, crawlready, "POST /api/v1/scan, GET /score/{domain}", "HTTPS")
  Rel(auth_user, crawlready, "POST /api/v1/sites, GET /dashboard/*", "HTTPS + Clerk JWT")
  Rel(customer_server, crawlready, "POST /api/v1/ingest, GET /api/v1/t/{key}", "HTTPS + site_key")
  Rel(crawlready, firecrawl, "Crawl pages (JS rendering)", "HTTPS API")
  Rel(crawlready, supabase, "Read/write scan data, sites, visits", "PostgreSQL")
  Rel(crawlready, upstash, "Rate limit checks, site key cache, budget", "Redis REST API")
  Rel(crawlready, clerk, "JWT verification, user management", "HTTPS API")
  Rel(crawlready, sentry, "Error reports, breadcrumbs", "HTTPS")
  Rel(crawlready, vercel_ec, "Feature flag reads", "Edge API")
```

---

## 2. Phase 0 Container Diagram — Two Data Planes

```mermaid
C4Container
  title CrawlReady Phase 0 — Container Diagram

  Person(anon_user, "Anonymous User", "Diagnostic scan")
  Person(auth_user, "Authenticated User", "Site management")
  Person(customer_server, "Customer Server", "Beacon sender")

  System_Boundary(vercel, "Vercel Platform (crawlready.app)") {

    Container(edge_mw, "Edge Middleware", "Vercel Edge", "Rate limiting, bot detection, correlation ID, feature flags")

    System_Boundary(scan_plane, "Scan & Scoring Plane") {
      Container(scan_api, "Scan API Routes", "Next.js API", "POST /scan, GET /scan/{id}/status, GET /score/{domain}")
      Container(scan_bg, "Background Functions", "Vercel BG", "Async crawl execution, scoring pipeline")
      Container(score_pages, "Score Pages (ISR)", "Next.js ISR", "/score/{domain} — public, shareable, OG images")
    }

    System_Boundary(analytics_plane, "Analytics & Ingest Plane") {
      Container(ingest_api, "Ingest API Routes", "Next.js API", "POST /ingest, GET /t/{key}, GET /c.js")
      Container(sites_api, "Sites API Routes", "Next.js API", "POST /sites, GET /sites, DELETE /sites/{id}")
      Container(dashboard, "Dashboard Pages", "Next.js SSR", "/dashboard/sites — site management UI")
    }

    Container(pkg_core, "packages/core", "TypeScript library", "Scoring, bot detection, URL normalization. Zero dependencies.")
  }

  System_Ext(firecrawl, "Firecrawl", "Crawl API")
  System_Ext(supabase, "Supabase", "PostgreSQL")
  System_Ext(upstash, "Upstash Redis", "Cache + rate limit")
  System_Ext(clerk, "Clerk", "Auth")

  Rel(anon_user, edge_mw, "Scan requests", "HTTPS")
  Rel(auth_user, edge_mw, "Dashboard requests", "HTTPS + Clerk JWT")
  Rel(customer_server, edge_mw, "Beacons", "HTTPS + site_key")

  Rel(edge_mw, scan_api, "Scan requests")
  Rel(edge_mw, ingest_api, "Ingest requests")
  Rel(edge_mw, sites_api, "Site mgmt requests")
  Rel(edge_mw, upstash, "Rate limit checks")

  Rel(scan_api, scan_bg, "Trigger async crawl")
  Rel(scan_bg, firecrawl, "JS rendering")
  Rel(scan_bg, pkg_core, "Scoring functions")
  Rel(scan_bg, supabase, "Write scan results")
  Rel(scan_bg, upstash, "Budget counter")

  Rel(score_pages, supabase, "Read latest scan")

  Rel(ingest_api, upstash, "Site key cache, dedup, rate limit")
  Rel(ingest_api, supabase, "Write crawler_visits (async)")
  Rel(ingest_api, pkg_core, "Bot validation, path normalization")

  Rel(sites_api, clerk, "JWT verification")
  Rel(sites_api, supabase, "CRUD sites")

  Rel(dashboard, clerk, "Session check")
  Rel(dashboard, supabase, "Read sites")
```

---

## 3. Scan Workflow — State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /api/v1/scan<br/>URL validated, scan row created

    PENDING --> CRAWLING: Async crawl triggered<br/>(waitUntil / Background Fn)

    CRAWLING --> SCORING: All required checks complete
    CRAWLING --> FAILED: Required check failed after 2 retries<br/>(rendered view or bot view)

    SCORING --> COMPLETE: All scores computed,<br/>all checks passed
    SCORING --> PARTIAL: Scores computed from available data,<br/>some non-required checks failed

    COMPLETE --> [*]
    PARTIAL --> [*]
    FAILED --> [*]

    note right of PENDING
        Client polls GET /scan/{id}/status
        every 2s, max 30 polls (60s)
    end note

    note right of CRAWLING
        Parallel execution:
        - Firecrawl (rendered view) [required]
        - Direct HTTP (bot view) [required]
        - Content negotiation probe
        - llms.txt check
        - robots.txt parse
        - Standards probes (3x HEAD)
        - Schema.org detection
        - Accessibility tree analysis
    end note

    note right of PARTIAL
        Reweight scores if sub-score
        data unavailable. Display
        "Based on available data" qualifier.
    end note
```

---

## 4. Scan Workflow — End-to-End Sequence

```mermaid
sequenceDiagram
    autonumber
    participant User as User Browser
    participant Edge as Edge Middleware
    participant ScanAPI as POST /api/v1/scan
    participant Redis as Upstash Redis
    participant DB as Supabase
    participant BG as Background Function
    participant FC as Firecrawl API
    participant Core as packages/core
    participant ISR as Score Page (ISR)

    User->>Edge: POST /api/v1/scan { url }
    Edge->>Redis: Rate limit check (scan:ip:{ip})

    alt Rate limited
        Redis-->>Edge: Over limit
        Edge-->>User: 429 Too Many Requests
    else Allowed
        Redis-->>Edge: OK
        Edge->>ScanAPI: Forward request

        ScanAPI->>Redis: Budget circuit breaker check
        ScanAPI->>DB: INSERT scan (status=pending)
        ScanAPI-->>User: { scan_id, correlation_id, status: pending }

        ScanAPI->>BG: Trigger async (waitUntil)

        Note over BG: Async execution begins

        BG->>DB: UPDATE status = crawling
        
        par Required checks
            BG->>FC: Crawl rendered view (JS execution)
            FC-->>BG: Full DOM + accessibility tree
            BG->>BG: Direct HTTP GET (bot view)
        and Non-required checks (parallel)
            BG->>BG: HEAD (content negotiation)
            BG->>BG: GET llms.txt
            BG->>BG: GET robots.txt
            BG->>BG: HEAD sitemap.xml, MCP card, API catalog
        end

        BG->>Redis: INCRBY budget counter
        BG->>DB: UPDATE firecrawl_cost_cents

        BG->>DB: UPDATE status = scoring
        BG->>Core: Compute crawlability score
        BG->>Core: Compute agent readiness score
        BG->>Core: Compute agent interaction score
        BG->>Core: Compute AI readiness (composite)
        BG->>Core: Run schema pattern detectors
        BG->>Core: Generate recommendations

        BG->>DB: UPDATE status = complete, scores, recommendations

        BG->>ISR: Revalidate /score/{domain}

        Note over User: Meanwhile, user polls...

        User->>Edge: GET /api/v1/scan/{id}/status
        Edge-->>User: { status: complete, redirect_url: /score/{domain} }

        User->>ISR: GET /score/{domain}
        ISR->>DB: Read latest scan
        ISR-->>User: Score page with results
    end
```

---

## 5. Analytics Ingest Pipeline — End-to-End Flow

```mermaid
flowchart TD
    subgraph Customer_Side ["Customer's Website"]
        MW["Middleware<br/>(server-side UA check)"]
        CJS["c.js script<br/>(client-side, CDN-cached)"]
        PIX["noscript img<br/>(tracking pixel)"]
    end

    subgraph Entry_Points ["Three Entry Points"]
        E1["POST /api/v1/ingest<br/>(from middleware)"]
        E2["POST /api/v1/ingest<br/>(from c.js)"]
        E3["GET /api/v1/t/{key}<br/>(from tracking pixel)"]
    end

    MW -->|"AI bot detected"| E1
    CJS -->|"Bot UA matched"| E2
    PIX -->|"Image fetched by bot"| E3

    E1 --> S1
    E2 --> S1
    E3 --> S1

    subgraph Pipeline ["Shared Processing Pipeline (< 50ms P95)"]
        S1["Step 1: Normalize Input<br/>Unified NormalizedBeacon format<br/>source = middleware|js|pixel"]
        S2["Step 2: Validate Bot<br/>Check against packages/core registry<br/>Unknown → accept as unverified"]
        S3["Step 3: Server Timestamp<br/>visited_at = NOW()<br/>Client timestamp stored for debug"]
        S4["Step 4: Site Key Lookup<br/>LRU cache → Supabase fallback<br/>Invalid key → silent reject (204)"]
        S5["Step 5: Rate Limit<br/>Upstash: 100 req/s per site_key<br/>Over limit → silent 204"]
        S6["Step 6: Path Normalization<br/>Lowercase, strip trailing slash,<br/>remove query params/fragments"]
        S7["Step 7: Dedup Check<br/>Redis SETNX {key}:{path}:{bot}<br/>1-second window"]
        S8["Step 8: Return Response<br/>204 No Content (POST)<br/>1×1 GIF (GET pixel)<br/>BEFORE database write"]
        S9["Step 9: Async DB Write<br/>waitUntil: INSERT crawler_visits<br/>On failure: log + drop (at-most-once)"]

        S1 --> S2 --> S3 --> S4 --> S5 --> S6 --> S7 --> S8 --> S9
    end

    S4 -.->|"Cache miss"| SB["Supabase<br/>(sites table)"]
    S5 -.->|"Check + SETNX"| RD["Upstash Redis"]
    S7 -.->|"SETNX"| RD
    S9 -.->|"INSERT"| CV["Supabase<br/>(crawler_visits)"]
```

---

## 6. Analytics Ingest — Dual Integration Decision

```mermaid
flowchart TD
    A["Customer registers site<br/>in dashboard"] --> B["Dashboard presents<br/>two integration options"]

    B --> C["★ Middleware<br/>(Recommended)"]
    B --> D["Quick Start<br/>(Script Tag)"]

    C --> C1["Framework-specific tabs:<br/>Next.js | Express | Cloudflare | Other"]
    C1 --> C2["~5 lines of server-side code"]
    C2 --> C3["Coverage: ~100%<br/>Source: middleware"]
    C3 --> C4["Bot regex in customer code<br/>(may go stale)"]

    D --> D1["Copy-paste into HTML head"]
    D1 --> D2["script src=c.js + noscript img"]
    D2 --> D3["Coverage: ~60-80%<br/>Source: js | pixel"]
    D3 --> D4["Bot list auto-updated<br/>via CDN (1hr TTL)"]

    C4 --> E["Dashboard tracks<br/>integration_type per site"]
    D4 --> E

    E --> F{"Script tag user?"}
    F -->|"Yes"| G["Nudge: Upgrade to middleware<br/>for 100% coverage"]
    F -->|"No"| H["Show snippet version status"]

    H --> I{"Beacon version current?"}
    I -->|"No"| J["Alert: Your snippet is v1<br/>(current is v3).<br/>Copy updated regex."]
    I -->|"Yes"| K["All good ✓"]
```

---

## 7. Site Key Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: POST /api/v1/sites<br/>Generate cr_live_{random}

    Active --> Rotating: POST /sites/{id}/rotate-key<br/>New key generated

    Rotating --> Active: 24h grace period expires<br/>Old key stops working

    Active --> Revoked: POST /sites/{id}/revoke-key<br/>Emergency — immediate invalidation

    Revoked --> Active: New key generated immediately

    Active --> Deleted: DELETE /sites/{id}<br/>Key invalidated, data retained 90 days

    Deleted --> [*]

    note right of Active
        Key format: cr_live_{16_alphanumeric}
        Semi-public: embedded in middleware/HTML
        Trust model: possession = write permission
    end note

    note right of Rotating
        Grace period: both old and new keys
        accepted for 24 hours. Dashboard shows
        "Update your snippet within 24 hours."
    end note

    note right of Revoked
        No grace period. Old key dead immediately.
        Use case: key leaked in public repo.
    end note
```

---

## 8. Rate Limiting — 3-Layer Flow

```mermaid
flowchart TD
    A["Incoming Request"] --> B{"Layer 1: Edge<br/>Upstash Redis<br/>Sliding Window"}

    B -->|"Over limit"| C["429 Too Many Requests<br/>+ Retry-After header"]
    B -->|"Under limit"| D{"Request Type?"}
    B -->|"Redis unreachable"| D

    D -->|"POST /api/v1/scan"| E{"Layer 2: Application<br/>URL validation +<br/>honeypot check"}
    D -->|"POST /api/v1/ingest"| F{"Layer 2: Application<br/>Site key exists?"}
    D -->|"POST /api/v1/subscribe"| G{"Layer 2: Application<br/>Email format +<br/>disposable domain block"}

    E -->|"Invalid"| H["400 Bad Request"]
    E -->|"Valid"| I{"Layer 3: Budget<br/>Circuit Breaker"}

    F -->|"Invalid key"| J["204 No Content<br/>(silent reject)"]
    F -->|"Valid key"| K["Process beacon"]

    G -->|"Invalid"| H
    G -->|"Valid"| L["Store subscriber"]

    I -->|"< 80% daily budget"| M["Execute scan"]
    I -->|"80-100% budget<br/>(soft limit)"| N["Execute scan + alert founder"]
    I -->|"> 100% budget<br/>(hard limit)"| O["503 Service at capacity"]

    subgraph Rate_Limits ["Rate Limit Keys (Upstash Redis)"]
        RL1["scan:ip:{ip} → 3/hr (free)"]
        RL2["scan:user:{clerk_id} → tier-based"]
        RL3["ingest:site:{site_key} → 100/s"]
        RL4["subscribe:ip:{ip} → 5/hr"]
    end

    subgraph Budget ["Budget Counter (Upstash Redis)"]
        BK["budget:firecrawl:daily:{date}"]
        BK --> BV["Soft: 80% of $0.63/day"]
        BK --> BH["Hard: 100% of $0.63/day"]
    end
```

---

## 9. Score Page Architecture

```mermaid
flowchart TD
    A["User shares<br/>crawlready.app/score/stripe.com<br/>on Twitter/HN"] --> B["Visitor clicks link"]

    B --> C{"ISR Cache?"}

    C -->|"Fresh (< 1hr)"| D["Serve static page<br/>instantly"]
    C -->|"Stale"| E["Serve stale page<br/>+ background revalidation"]
    C -->|"First visit"| F["Generate page<br/>(blocking fallback)"]

    D --> G["Score Page Content"]
    E --> G
    F --> G

    G --> G1["AI Readiness Score: 42/100"]
    G --> G2["3 sub-scores with drill-down"]
    G --> G3["Side-by-side diff preview"]
    G --> G4["Recommendations list"]
    G --> G5["Schema Generation Preview"]
    G --> G6["Freshness indicator"]
    G --> G7["CTA: Fix this score (email gate)"]

    subgraph SEO ["SEO & Social"]
        H1["OG Image (Vercel OG)<br/>Dynamic score card"]
        H2["Meta tags<br/>og:title, og:description, og:image"]
        H3["Schema.org WebPage JSON-LD"]
        H4["sitemap-scores.xml<br/>(all scored domains)"]
        H5["robots.txt: Allow /score/*"]
    end

    G --> H1
    G --> H2
    G --> H3

    subgraph Revalidation ["ISR Revalidation Triggers"]
        T1["New scan completes<br/>→ on-demand revalidation"]
        T2["1-hour interval<br/>→ time-based revalidation"]
    end
```

---

## 10. Observability — Correlation ID Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Edge as Edge Middleware
    participant API as API Route
    participant BG as Background Fn
    participant FC as Firecrawl
    participant DB as Supabase
    participant Sentry as Sentry
    participant Pino as Pino Logger

    User->>Edge: Request
    
    Note over Edge: Generate correlation_id<br/>(UUID v4)
    
    Edge->>Pino: log { correlation_id, method, path, ip }
    Edge->>API: Forward + X-Correlation-ID header

    API->>Pino: log { correlation_id, handler, params }
    API->>DB: INSERT scan (correlation_id = $uuid)
    API-->>User: { scan_id, correlation_id }
    
    API->>BG: Trigger async (pass correlation_id)
    
    BG->>Pino: log { correlation_id, step: "crawl_start" }
    BG->>FC: Crawl (pass correlation_id in metadata)
    
    alt Firecrawl error
        FC-->>BG: Error
        BG->>Pino: log { correlation_id, error, step: "crawl_failed" }
        BG->>Sentry: captureException({ correlation_id, error })
        BG->>DB: UPDATE scan status=failed, error_code, error_message
    else Success
        FC-->>BG: HTML + metadata
        BG->>Pino: log { correlation_id, step: "crawl_complete", duration_ms }
        BG->>Pino: log { correlation_id, step: "scoring_start" }
        BG->>DB: UPDATE scan status=complete, scores
        BG->>Pino: log { correlation_id, step: "scan_complete", total_ms }
    end

    Note over User: When debugging: search logs<br/>by correlation_id to trace<br/>entire request lifecycle
```

---

## 11. Data Aggregation — Phase Evolution

```mermaid
flowchart LR
    subgraph Phase_0 ["Phase 0: Real-Time Queries"]
        P0_Write["INSERT INTO<br/>crawler_visits"]
        P0_Read["SELECT COUNT(*)<br/>FROM crawler_visits<br/>WHERE site_id = $1"]
        P0_Note["Sufficient for < 500K rows<br/>P95 < 200ms"]
    end

    subgraph Phase_1 ["Phase 1: Daily Rollups"]
        P1_Write["INSERT INTO<br/>crawler_visits"]
        P1_Cron["pg_cron daily job<br/>→ INSERT INTO<br/>crawler_visits_daily"]
        P1_Read["Dashboard queries<br/>use rollup table<br/>for periods > 7d"]
        P1_Retention["90-day retention<br/>on raw events"]
        P1_Note["Triggered at > 1M rows<br/>or P95 > 500ms"]

        P1_Write --> P1_Cron
        P1_Cron --> P1_Read
    end

    subgraph Phase_2 ["Phase 2: Analytics Engine"]
        P2_Write["Beacon writes →<br/>Cloudflare Analytics<br/>Engine (unlimited)"]
        P2_Read["Dashboard queries →<br/>Analytics Engine SQL"]
        P2_Ingest["Ingest endpoint →<br/>Cloudflare Worker<br/>(global edge)"]
        P2_Note["Triggered at > 50M rows<br/>or > 5K req/s"]
    end

    Phase_0 -->|"> 1M rows or<br/>P95 > 500ms"| Phase_1
    Phase_1 -->|"> 50M rows or<br/>> 5K req/s"| Phase_2
```

---

## 12. Alert System — Computation Flow (Phase 1)

```mermaid
flowchart TD
    A["GET /api/v1/analytics/{siteId}/alerts<br/>(Clerk auth + site ownership)"] --> B["On-demand computation<br/>(no pre-computed table in Phase 1)"]

    B --> C["invisible_content alert"]
    B --> D["new_crawler alert"]
    B --> E["traffic_spike alert"]
    B --> F["no_recent_activity alert"]
    B --> G["snippet_outdated alert"]

    C --> C1["JOIN crawler_visits × scans<br/>WHERE visits > 10<br/>AND crawlability_score < 30"]

    D --> D1["SELECT DISTINCT bot<br/>FROM crawler_visits<br/>WHERE first_seen > 7 days ago"]

    E --> E1["Compare today's visits<br/>vs 7-day daily average<br/>per bot. Spike = 5x"]

    F --> F1["No visits in 7+ days<br/>for previously active site"]

    G --> G1["site.beacon_version<br/>< server.current_version"]

    C1 --> H["Assemble alerts array"]
    D1 --> H
    E1 --> H
    F1 --> H
    G1 --> H

    H --> I["Return JSON response<br/>sorted by severity"]

    subgraph Phase_2_Evolution ["Phase 2 Evolution"]
        J["pg_cron daily →<br/>pre-compute alerts<br/>into site_alerts table"]
        K["Email notifications<br/>for critical alerts"]
        L["Webhook notifications<br/>for integrations"]
    end
```

---

## 13. Infrastructure Dependencies — Failure Impact

```mermaid
flowchart TD
    subgraph Hard_Deps ["Hard Dependencies (outage = total/plane failure)"]
        V["Vercel<br/>Hosting + Edge + Serverless"]
        S["Supabase<br/>PostgreSQL database"]
        F["Firecrawl<br/>Crawl API (scan plane only)"]
    end

    subgraph Soft_Deps ["Soft Dependencies (outage = degraded, fail-open)"]
        R["Upstash Redis<br/>Rate limiting + cache"]
        CL["Clerk<br/>Auth (dashboard only)"]
        SE["Sentry<br/>Error tracking"]
        EC["Vercel Edge Config<br/>Feature flags"]
    end

    V -->|"Down"| V1["ALL services unavailable"]
    S -->|"Down"| S1["No reads or writes<br/>Both planes down"]
    F -->|"Down"| F1["Scan plane down<br/>Ingest plane UNAFFECTED"]

    R -->|"Down"| R1["Rate limiting skipped<br/>(fail-open)<br/>Site key cache miss<br/>→ Supabase fallback"]
    CL -->|"Down"| CL1["Dashboard inaccessible<br/>Diagnostic + ingest<br/>UNAFFECTED"]
    SE -->|"Down"| SE1["Monitoring blind<br/>Product UNAFFECTED"]
    EC -->|"Down"| EC1["Flags return defaults<br/>Product UNAFFECTED"]

    style V fill:#ff6b6b,color:#fff
    style S fill:#ff6b6b,color:#fff
    style F fill:#ffa94d,color:#fff
    style R fill:#69db7c,color:#333
    style CL fill:#69db7c,color:#333
    style SE fill:#69db7c,color:#333
    style EC fill:#69db7c,color:#333
```

---

## 14. Deployment Pipeline

```mermaid
flowchart TD
    subgraph PR_Flow ["On Pull Request"]
        PR1["Push to feature/* or fix/*"]
        PR2["GitHub Actions CI"]
        PR3["pnpm install"]
        PR4["pnpm lint (ESLint)"]
        PR5["pnpm typecheck (TypeScript)"]
        PR6["pnpm test (vitest)"]
        PR7["Vercel Preview Deploy"]
        PR8["Preview URL ready<br/>{branch}.crawlready.vercel.app"]

        PR1 --> PR2 --> PR3 --> PR4 --> PR5 --> PR6 --> PR7 --> PR8
    end

    subgraph Merge_Flow ["On Merge to main"]
        M1["Merge PR to main"]
        M2["Same CI checks"]
        M3["Vercel Production Deploy"]
        M4["Post-deploy smoke test<br/>(curl scan endpoint)"]
        M5["Sentry release notification"]
        M6["Live at crawlready.app"]

        M1 --> M2 --> M3 --> M4 --> M5 --> M6
    end

    subgraph Environments ["Environment Config"]
        E1["Production<br/>crawlready.app<br/>Branch: main<br/>Supabase: prod project"]
        E2["Preview<br/>{branch}.vercel.app<br/>Branch: feature/*<br/>Supabase: preview project"]
        E3["Local Dev<br/>localhost:3000<br/>Supabase: local (Docker)<br/>Firecrawl: mock adapter"]
    end
```

---

## 15. packages/core — Dependency Graph

```mermaid
flowchart TD
    subgraph Core ["packages/core (zero external deps)"]
        SC["scoring/<br/>crawlability.ts<br/>agent-readiness.ts<br/>agent-interaction.ts<br/>ai-readiness.ts<br/>eu-ai-act.ts"]
        DET["detection/<br/>bot-registry.ts<br/>url-normalize.ts<br/>schema-patterns.ts"]
        TYP["types/<br/>scan.ts, score.ts<br/>site.ts, ingest.ts<br/>events.ts"]
        CON["constants/<br/>scoring-version.ts<br/>thresholds.ts"]
    end

    subgraph Consumers ["Consumers of packages/core"]
        WEB["apps/web<br/>(Next.js API routes)"]
        MCP["MCP Server<br/>(Phase 1)"]
        CLI["npm CLI<br/>(Phase 1)"]
        DOC["Docusaurus plugin<br/>(Phase 1)"]
        CF["Cloudflare Workers<br/>(Phase 2)"]
    end

    SC --> TYP
    SC --> CON
    DET --> TYP
    DET --> CON

    WEB --> Core
    MCP --> Core
    CLI --> Core
    DOC --> Core
    CF --> Core

    subgraph Build_Outputs ["Build Outputs from Core"]
        CJS_BUILD["c.js script<br/>(generated from<br/>bot-registry.ts)"]
        FIX["fixtures/<br/>Golden set test HTML<br/>+ expected scores"]
    end

    DET -->|"bot-registry.ts"| CJS_BUILD
```

---

## Legend

| Diagram | Level | Purpose |
|---|---|---|
| §1 Phase 0 Context | C4 L1 | System boundaries, all external services |
| §2 Phase 0 Containers | C4 L2 | Two data planes, internal containers |
| §3 Scan State Machine | State | Scan lifecycle states and transitions |
| §4 Scan Sequence | Sequence | End-to-end scan from request to score page |
| §5 Ingest Pipeline | Flow | 9-step beacon processing with all entry points |
| §6 Dual Integration | Flow | Customer onboarding decision tree |
| §7 Site Key Lifecycle | State | Key create/rotate/revoke/delete states |
| §8 Rate Limiting | Flow | 3-layer rate limiting with budget breaker |
| §9 Score Page | Flow | ISR, OG images, SEO, revalidation |
| §10 Observability | Sequence | Correlation ID tracing through all layers |
| §11 Aggregation | Flow | Phase 0→1→2 data aggregation evolution |
| §12 Alert System | Flow | On-demand alert computation (Phase 1) |
| §13 Dependencies | Flow | Hard vs soft dependencies, failure impact |
| §14 Deployment | Flow | CI/CD pipeline, environments |
| §15 packages/core | Flow | Core library dependency graph and consumers |
