# Product Vision

CrawlReady evolves from a free diagnostic tool to an active AI visibility platform. Each phase builds on the last and is independently shippable.

---

## Guiding Principle

**The "aha" moment must happen in under 60 seconds.** A new user enters their domain URL — no signup — and within seconds sees something they have never seen before: a side-by-side of their site as rendered by a browser vs. what GPTBot actually receives. Missing sections are highlighted in red. An **AI Readiness Score** (0–100) headlines the result; the three sub-scores — **Crawlability Score** (can crawlers see your content?), **Agent Readiness Score** (can AI agents act on your content?), and **Agent Interaction Score** (can visual AI agents navigate your site?) — appear on drill-down. See `docs/architecture/scoring-algorithm.md`. The problem becomes real in one screen.

---

## Bandwidth Reality Check

This is a side project built alongside a day job at ~15–20 hrs/week. Every timeline must account for this constraint:
- "1 week" in full-time terms = **2–3 weeks** at part-time pace
- Each phase takes 2–3x longer than a full-time estimate
- Attempting too many deliverables in parallel is the primary risk — not any single technical challenge
- The plan below is scoped to what a solo developer can realistically ship, not what would be ideal

---

## Phase 0 — Validation: Diagnostic MVP + Analytics Onboarding (Weeks 1-6)

**Scope:** Three deliverables — (1) landing page at crawlready.app, (2) working diagnostic via crawling SaaS API, and (3) AI Crawler Analytics onboarding + ingest. No content modification. Zero cloaking risk. This phase validates demand before investing in anything else.

**This is the canonical Phase 0 scope.** All other docs defer to this section.

### Phase 0 Deliverables

**Deliverable 1 — Landing Page:**
A landing page with one input field: "Enter your URL."

**Deliverable 2 — Working Diagnostic:**
A working diagnostic that crawls the page and shows a side-by-side comparison + score.

What the diagnostic does:
- User enters their domain URL — no signup required to see the diagnostic
- CrawlReady crawls the page as: (a) a real browser and (b) each major AI bot user-agent
- Generates a side-by-side comparison: "What your page looks like to humans vs. what GPTBot actually receives"
- Highlights invisible content: "These 3 sections are rendered by JavaScript and are never seen by AI crawlers"
- Issues an **AI Readiness Score** (0–100) as the headline metric — a weighted composite of three sub-scores. See `docs/architecture/scoring-algorithm.md` and `docs/architecture/scoring-detail.md`.
- Issues a **Crawlability Score** (0–100) per page with specific gaps identified:
  - Content visibility ratio (what % of human-visible text is in the raw HTML)
  - Structural clarity (headings, lists, semantic markup present?)
  - Noise ratio (scripts, styles, tracking code as % of payload)
  - Schema.org presence
- Issues an **Agent Readiness Score** (0–100) per page measuring how well AI agents can act on the content:
  - Structured data completeness (Schema.org JSON-LD, OpenGraph, machine-readable product/pricing data) — 0-25 pts
  - Content negotiation readiness (does the server respond to `Accept: text/markdown`? Is llms.txt present?) — 0-25 pts
  - Machine-actionable data availability (can key business facts be extracted without visual rendering?) — 0-30 pts
  - **Standards adoption** (robots.txt AI bot rules, Content Signals directive, sitemap.xml, Link Headers RFC 8288, MCP Server Card, API Catalog RFC 9727) — 0-20 pts — *NEW: added April 2026 after Cloudflare Agent Readiness review. See `docs/research/cloudflare-agent-readiness.md`.*
  - 5 additional HTTP requests per scan (2 existing + 3 new parallel HEAD requests for sitemap.xml, MCP Server Card, API Catalog)
- Issues an **Agent Interaction Score** (0–100) per page measuring how well visual AI agents (OpenAI Operator, Anthropic Computer Use) can navigate the site:
  - Semantic HTML quality (proper `<button>`, `<form>`, `<nav>` vs generic `<div>`)
  - Interactive element accessibility (labels, ARIA roles, click target sizes)
  - Navigation structure (keyboard-navigable, traversable hierarchy)
  - Visual-semantic consistency (what's visually prominent matches what's semantically important)
  - Zero additional HTTP requests — uses the rendered DOM already captured by the crawling provider
- **Schema Generation Preview:** After checking Schema.org presence, the diagnostic analyzes the page content for detectable structured data patterns and displays what CrawlReady could generate: "0 Schema.org types detected. Based on your content, we can generate: FAQPage (3 Q&A pairs detected), Product (pricing data detected). [Preview generated markup]." This is display-only in Phase 0 — actual generation and injection activates in the paid tier. Zero additional crawl cost (uses HTML already fetched). See `docs/architecture/multi-format-serving.md`.
- Provides actionable recommendations: "Add SSR to these routes" / "Your pricing section is client-rendered and invisible" / "Reduce HTML noise from 14K tokens to under 2K" / "Add Schema.org Product markup to make your pricing agent-readable" / "Your signup button uses a `<div>` — AI agents can’t find it" / "Add a Content Signals directive to robots.txt to declare your AI training preferences" / "Your llms.txt is a single massive file — split it by section to fit within agent context windows" / "Expose an MCP Server Card at /.well-known/mcp/server-card.json to help agents discover your API" *(Cloudflare-inspired recommendation patterns — see `docs/research/cloudflare-agent-readiness.md`)*
- Generates a **public, permanent score URL** (e.g., `crawlready.app/score/stripe.com`) — this is built into the diagnostic, not a separate deliverable
- CTA: "Fix this score" requires email (lead capture, lightweight — no account creation)

**Deliverable 3 — AI Crawler Analytics Onboarding + Ingest:**
Self-serve site registration and ingest API, open to any site. See `docs/architecture/analytics-onboarding.md`.

What analytics onboarding delivers:
- User signs up via **Clerk** (social login, email/password)
- User registers a site (domain input), receives a `site_key`
- System displays middleware snippet (copy-paste, 3–5 lines) for the user's framework
- Ingest endpoint receives AI crawler visit beacons from customer middleware (`POST /api/v1/ingest`, 204 response)
- Minimal site management UI: list registered sites, view site key, copy snippet
- No analytics dashboard in Phase 0 (that's Phase 1) — just registration, key management, and data ingest

### Phase 0 — IN / OUT Scope

**IN (Diagnostic side):**
- Landing page with URL input
- Diagnostic scan page (side-by-side, scores, recommendations, Schema preview)
- Public score page (`/score/{domain}`)
- Email subscribe endpoint (lightweight capture, no account creation)
- Scan + score API endpoints (`POST /api/v1/scan`, `GET /api/v1/score/{domain}`)
- Standards adoption checks: robots.txt AI bot rules, Content Signals, sitemap.xml, Link Headers, MCP Server Card, API Catalog (A4 category, 3 additional HEAD requests per scan — added April 2026 Cloudflare review)

**IN (Analytics side):**
- Clerk-based sign-up / sign-in
- Site registration + site key generation
- Middleware snippet display post-registration
- Ingest endpoint (`POST /api/v1/ingest`)
- Minimal site management UI (`/dashboard/sites`)

**OUT (Phase 1+):**
- Analytics dashboard UI (charts, per-crawler breakdown, per-page views)
- Alerts ("GPTBot visited /pricing 89 times but received empty HTML")
- Hidden backlink injection (requires response body modification)
- Embeddable badge endpoint
- npm package
- MCP server or Docusaurus plugin (Phase 1 — moved forward from Phase 3)
- GitHub repo or open-source pipeline (Phase 2)
- GitHub Action (Phase 2)
- Cloudflare Worker template (Phase 2)
- Site key rotation UI
- Schema.org generation + injection (paid tier, Phase 1-2)
- All Phase 1+ deliverables gated on validation metrics

**Pre-seeding:** 20 popular developer tool sites (enough for Show HN screenshots and a short blog post). Not 200 — that's Phase 1 scope.

**Distribution:** Show HN only. One channel, executed well. See `docs/research/validation-experiment.md`.

**Kill gate:** If Show HN generates <200 visits and <20 signups, reconsider the project before building anything further.

### Messaging Tracks

**EU AI Act readiness angle (zero development cost):** EU AI Act Article 50 transparency rules take effect August 2, 2026 — 4 months from Phase 0 launch window. The diagnostic includes an "AI Transparency Readiness" checklist (4 binary checks using data already collected during the scan) as a secondary hook alongside the primary AI Readiness Score. This targets compliance-motivated buyers (fintech, healthcare, regulated industries) who wouldn't respond to "improve your AI crawlability" but will respond to "are you ready for August 2?" See `docs/research/eu-ai-act-compliance.md`.

**Traffic defense messaging angle:** Fresh Q1 2026 data shows organic search traffic erosion is 2-3x worse than previously documented — US organic Google search referrals down 38% YoY, small publishers have lost 60% of search referrals, and social referrals are collapsing (Facebook -43%, X -46%). This creates a third messaging track alongside CSR invisibility and compliance urgency:

Three messaging tracks for the landing page (each targets a different buyer motivation):

1. **CSR Invisibility (primary — technical teams):** "Your pricing section is invisible to AI crawlers. See what GPTBot actually receives." Binary, urgent, shareable. Strongest for CSR SPAs with 0-20 crawlability scores.

2. **Traffic Defense (secondary — business/growth teams):** "Your organic search traffic dropped 38% this year. Cited publishers gain 20-40% more clicks. Non-cited publishers lose 15-25%. CrawlReady shows you what to fix." Addresses the acute pain of revenue decline. Strongest for publishers and SSR sites that are already losing traffic.

3. **Compliance Urgency (tertiary — legal/compliance teams):** "EU AI Act Article 50 takes effect August 2, 2026. Is your site ready?" Time-limited urgency for regulated industries.

The traffic defense angle is additive — it does not replace the CSR beachhead strategy. It opens CrawlReady to content publishers, media sites, and documentation-heavy B2B companies (Phase 1+ ICP expansion) who wouldn't respond to "your SPA is invisible" but will respond to "you're losing traffic and here's how to defend it." The data supports this urgency claim: cited publishers gain 20-40% CTR boost; non-cited lose 15-25%. AI-referred traffic converts at 4.4x the rate of organic. See `docs/product/problem.md` for full traffic erosion data.

### Why This First

- Ships fastest — no edge infrastructure required
- Zero regulatory risk
- Validates demand before building the paid product
- Establishes the brand before asking for any infrastructure trust
- The diagnostic creates the pain. The optimization tier fixes it.
- The EU AI Act deadline creates time-sensitive urgency for the compliance-aware ICP segment
- Analytics onboarding seeds continuous engagement data from day one

### Auth Model

CrawlReady uses a **split auth model** for Phase 0:

- **Clerk** — handles all user authentication: sign-up, sign-in, session management. Used for site registration, analytics onboarding, and the future dashboard. See `docs/architecture/analytics-onboarding.md`.
- **Lightweight email capture** — the diagnostic gated features (PDF report, historical tracking, score change alerts) are gated behind email collection only. No account creation required. This preserves the zero-friction diagnostic experience.
- **Supabase** — database only (PostgreSQL). No Supabase Auth.

### Tech Stack

- Next.js (App Router) frontend + API routes
- **API-first architecture:** Next.js API routes (`/api/v1/*`) are the core backend, consumed by the web frontend and all future distribution channels (MCP server, npm CLI, Docusaurus plugin, partner referral tracking via `/fix?url=...&source=...`). See `docs/architecture/api-first.md`.
- **Crawling SaaS provider** for crawling + HTML-to-Markdown extraction (no self-hosted Playwright needed — eliminates infrastructure complexity). Provider selected based on JS rendering, custom UA support, cost, and latency. See `docs/architecture/crawling-provider.md`.
- **Clerk** for user authentication (site registration, analytics onboarding)
- **Supabase** for database (PostgreSQL) — scores, sites, crawler visits, subscribers
- Deploy on **Vercel**
- Domain: **crawlready.app**

---

## Phase 1 — Free Tier Expansion (Weeks 7-14, only if Phase 0 validates)

**Gate:** Phase 0 must hit must-have validation targets (500+ visits, 50+ signups) before building Phase 1 deliverables.

**Scope:** Expand the diagnostic's distribution surface and feature set. Still free, still zero cloaking risk.

**What Phase 1 adds:**
- Ship **AI Crawler Analytics** dashboard + ultra-light middleware snippets for Next.js, Express, Cloudflare Workers, and Vercel Edge. See `docs/architecture/crawler-analytics.md`.
- **Hidden backlink growth engine:** For free-tier analytics users, middleware injects a hidden `<link rel="ai-analytics" href="https://crawlready.app/score/{domain}">` tag in the `<head>` of every page (invisible to humans, discoverable by crawlers). Paid tiers can remove it. An opt-in badge (unbranded or branded) is available but never forced.
- Pre-seed 200 additional sites (expand SEO footprint via public score URLs)
- Ship npm package (`crawlready`) with free-tier static analysis (CLI output, no API key needed)
- **Ship MCP server** (`crawlready-mcp`) — puts CrawlReady inside developers' IDEs (Cursor, VS Code, etc.). See MCP Server Design below.
- Create embeddable badge SVG endpoint (`crawlready.app/badge/site.svg`)
- **Ship Docusaurus plugin MVP** (`@crawlready/docusaurus`) — vertical wedge for API documentation sites. See Docusaurus Plugin Design below.
- Cross-post blog to dev.to and Hashnode
- Optional: generates an llms.txt file as a downloadable side output (minor feature, not the hook)

**This tier is permanently free** — its purpose is top-of-funnel acquisition, not revenue. Developers will share a free diagnostic tool. They won't share a $49/month product page.

### MCP Server Design (Phase 1 — Moved Forward from Phase 3)

**Rationale for moving forward:** 14,000–25,000+ MCP servers are now cataloged with 97M monthly SDK downloads. 56% of MCP servers target developers — exact ICP overlap. No GEO/AI optimization company has shipped an MCP server. An MCP server is 1–2 weeks of development and puts CrawlReady inside the developer's IDE — the highest-intent discovery channel possible. The MCP ecosystem is growing explosively; early entrants get discovery advantage.

**The MCP server exposes three tools (read-only, uses the same API as the web diagnostic):**

**Tool 1: `crawlready_scan`**
- Input: URL string
- Output: AI Readiness Score (0–100, headline) + Crawlability (0–100) + Agent Readiness (0–100) + Agent Interaction (0–100) + summary of key gaps
- Use case: Developer checks their site's score without leaving their editor

**Tool 2: `crawlready_diff`**
- Input: URL string
- Output: Side-by-side text diff of browser-rendered content vs. AI crawler view, with highlighted missing sections
- Use case: Developer sees exactly what GPTBot misses on their page

**Tool 3: `crawlready_recommend`**
- Input: URL string
- Output: Prioritized list of actionable recommendations (add SSR, reduce noise, add Schema.org, improve content negotiation)
- Use case: Developer gets specific fix instructions for their page

**One resource:**

**Resource: `crawlready://score/{domain}`**
- Returns the current score for a configured domain (cached)

**Distribution:**
- Publish to GitHub MCP Registry (2,000+ verified entries)
- List on Smithery, mcpserverdirectory.org, mcpservers.org
- Discoverable from within Cursor, VS Code, and other AI-assisted IDEs
- Each IDE discovery is a high-intent touchpoint that leads back to crawlready.app

**Tech stack:** TypeScript MCP SDK, calls CrawlReady's API routes (same backend as the web diagnostic). No additional infrastructure required.

### Docusaurus Plugin Design (Phase 1 — Moved Forward from Phase 3)

**Rationale for moving forward:** API documentation is the highest-value use case for AI crawlability right now. 30% of programming searches are done on ChatGPT (Q1 2025). When a developer asks "how do I authenticate with the Stripe API?" the quality of the AI answer depends on how well the crawler parsed Stripe's docs. Doc sites are built on a small number of platforms — one plugin covers thousands of sites. Docusaurus has ~500K weekly downloads with React ecosystem overlap matching CrawlReady's ICP.

**What the Phase 1 MVP plugin does:**

```bash
npm install @crawlready/docusaurus
```

```javascript
// docusaurus.config.js
plugins: ['@crawlready/docusaurus']
```

1. **Build-time crawlability audit** — runs during `docusaurus build` and reports AI Readiness Score + Crawlability Score + Agent Readiness Score in the build output. Flags specific docs-related issues:
   - Code blocks that may not be preserved in AI crawler extraction
   - API endpoint tables that lack structured data markup
   - Parameter definitions not in machine-readable format
   - Client-side search components hiding content from crawlers
2. **Generates a docs-optimized llms.txt** — auto-generates `llms.txt` from the site's sidebar/nav structure, mapping each doc page to its title and URL
3. **Adds `/ai/` prefix routes** (optional, off by default) — serves pre-generated AI-optimized Markdown versions of each doc page at `/ai/docs/getting-started` etc.
4. **Reports score in CI** — outputs a machine-readable crawlability report for GitHub Action integration

**Phase 1 MVP scope (what is NOT included):**
- No connection to CrawlReady hosted service (that's Phase 2 paid tier)
- No edge proxy or content serving to AI crawlers (that's Level 2 integration)
- No analytics dashboard
- This is a free, standalone build tool — its purpose is distribution and vertical credibility

**Distribution:**
- Submit to Docusaurus community plugins directory
- Blog post: "Making your Docusaurus docs visible to AI search in 5 minutes"
- npm search for "docusaurus AI" — first result in the space
- Each installation is a distribution touchpoint leading to crawlready.app

**Expansion path:** After Docusaurus, ship plugins for VitePress (Vue), Nextra (Next.js), and Astro (Phase 2+). Avoid competing with Mintlify directly (already has AI features via auto-generated llms.txt).

**Docs-specific diagnostic features (added to Phase 0 diagnostic):** The Phase 0 diagnostic already works on doc sites. Add doc-specific checks that surface in the score page when a documentation site is scanned:
- "Code block preservation: X of Y code blocks may be lost during AI extraction"
- "API reference structure: endpoint definitions are/are not in structured format"
- "Documentation navigation: X pages are discoverable from crawlable links"
- These checks use the HTML/Markdown already fetched — no additional crawling cost

---

## Phase 1.5 — Monitoring Tool Integrations (Months 4-5)

**Scope:** Build a B2B2B distribution channel by integrating CrawlReady as the "fix layer" for GEO monitoring tools that can identify problems but cannot solve them.

**The insight:** $230M+ in funded monitoring tools — led by Profound ($155M, $1B valuation, 700+ enterprise customers) plus Peec.ai ($21M), Evertune ($19M), and incumbents (Semrush, Ahrefs) — tell thousands of customers they have low AI visibility. None of them fix it. CrawlReady is the fix.

**What Phase 1.5 delivers:**
- Public referral endpoint: `crawlready.app/fix?url={url}&source={partner_id}` — zero integration effort for partners, pre-fills the diagnostic with the URL and tracks attribution
- Partner outreach to Profound (700+ enterprise customers, $155M funded, $1B valuation — highest value and acquisition optionality), Peec.ai (1,500+ customers, $21M funded), and Otterly (inside Semrush, 15K-20K+ users)
- Revenue share: 20% of first year revenue per converted customer (referral tier)

**Why this matters:**
- Customers arrive pre-educated about the problem — the monitoring tool did the awareness work
- Zero CAC on referred customers
- Conversion rates should be significantly higher than cold traffic (customer already knows their score is low)

**Phase 1.5 does NOT include:** embedded partner UI or automated fix pipeline (both deferred until a signed partner explicitly requests them).

See `docs/research/monitoring-integration.md` for full partnership model, API design, and partner priority list.

---

## Phase 2 — Pro: CDN Snippet Optimization (Months 5-7)

**Scope:** Intercept AI bot requests via a CDN/middleware snippet and serve pre-generated AI-optimized content. No DNS change required from the customer.

**This is the first paid tier.** Customers upgrade from free when they've seen their crawlability score and want to fix it.

**What it does:**
- Customer adds a 10-line Cloudflare Worker, Nginx rule, or Vercel middleware snippet to their existing infrastructure
- Incoming AI crawler requests are routed to CrawlReady's pre-generated content cache
- Human traffic is never intercepted — customer's infrastructure stays in full control
- AI-optimized pages are generated from a headless browser crawl (executes JS, captures full DOM)
- Content is restructured: strip nav/ads/decorative elements, make JS-hidden content visible, add semantic headings and explicit definitions, produce clean Markdown-equivalent HTML
- **Dynamic Schema.org generation (April 2026 multi-format review):** Generate and inject attribute-rich JSON-LD (FAQPage, Product, HowTo, Organization) from extracted page content where none exists on origin. Validated against Schema.org specifications before serving. See `docs/architecture/multi-format-serving.md`.
- **Multi-format serving (April 2026 multi-format review):** Serve format-appropriate content to different AI client types — Markdown to text-extraction crawlers (GPTBot, ClaudeBot, PerplexityBot), enriched HTML with Schema.org to Google-Extended (maximizes AI Overview citation), original HTML with enhanced ARIA to visual agents. See `docs/product/solution.md` for the full client-to-format mapping.
- Diff engine detects content changes on origin and triggers cache invalidation
- Dashboard shows: which pages were served to which bots, crawlability score trend over time
- **Transparency endpoint:** `/crawlready-preview` is publicly accessible — anyone can verify what AI crawlers receive

**Key constraint:** The AI-optimized page must contain the same information as the human page. The diff engine flags and blocks divergences. This is CrawlReady's core differentiator vs. competitors who offer no proof of content parity.

**Onboarding target:** Under 15 minutes from signup to first AI crawler served.

**Open-source pipeline (Phase 2):** This is when the transformation pipeline is open-sourced under AGPL — when there is a working, stable product worth contributing to. Phase 0-1 ships proprietary to maximize velocity.

**Tech stack:**
- Cloudflare Workers for edge routing (global PoPs, low latency)
- **Dual detection:** UA + IP verification (primary, works today) AND `Accept: text/markdown` content negotiation (forward-compatible with Cloudflare's Markdown for Agents standard, Feb 2026). Serve optimized Markdown to any client that requests it via content negotiation, regardless of identity.
- Custom Playwright pipeline for content generation (full transformation control — replaces Firecrawl API from Phase 0-1). **Note:** Validate Firecrawl COGS during Phase 0 to confirm whether custom Playwright is needed for cost reasons or just quality reasons.
- KV store for cached AI-optimized pages
- Diff engine for content parity monitoring
- Cache strategy: Starter default 7-day TTL, Pro 24h, Business 12h, Enterprise 6h + webhook-triggered refresh + recache API (see `docs/product/solution.md` for full tier table)
- **Potential complementary mechanism for SSR sites (April 2026 multi-format review):** Cloudflare HTMLRewriter can transform HTML in real-time at the edge — injecting Schema.org, stripping noise, adding ARIA attributes — with no cache required and near-zero COGS. This works only for SSR sites where origin HTML is content-rich; CSR sites still require the pre-generated cache. Decision on whether to implement deferred to Phase 2, informed by actual customer mix from Phase 0-1. See `docs/architecture/multi-format-serving.md` for full trade-off analysis.

---

## Phase 3 — AI Citation Monitoring (Months 8-10)

**Scope:** Track whether CrawlReady-optimized pages are being cited in AI-generated answers, and connect changes to outcomes.

**Build vs. buy decision: Buy/partner, do not build from scratch.** Citation monitoring is increasingly commodity (Otterly ~$29/mo Lite, Semrush AI toolkit $140–500/mo, Peec.ai). CrawlReady's differentiated value is at the crawl/transformation layer. Options: (a) integrate Otterly's API if available at reasonable cost, (b) build a thin wrapper calling ChatGPT/Perplexity APIs to check for domain citations, (c) partner with a monitoring vendor. The only reason to build fully is to tie citations to specific content transformation hashes — a unique capability. Defer final decision until Phase 2 revenue validates the business.

**What it delivers (regardless of build/buy):**
- Records whether the customer's domain/pages are cited in AI answers
- Tracks citation rate over time — shows impact of Phase 2 optimizations
- Surfaces competitor citation analysis: "Competitor X is cited for these queries where you are not"
- Closes the loop: Phase 1 shows what bots see. Phase 2 changes what bots see. Phase 3 shows whether it worked.

**Important caveat to communicate to customers:** Format optimization (Phase 2) addresses ~15–20% of what drives AI citations (peer-reviewed: GEO-SFE paper, ~17.3% citation improvement from structural optimization). Authority, comprehensiveness, and recency matter more. Citation monitoring will show the contribution of format optimization — it will not guarantee citation for every query.

---

## Phase 4 — Enterprise: DNS Proxy + Autonomous Optimization (Months 10-12+)

**Scope:** Full DNS proxy for maximum control + AI-driven content optimization feedback loop.

**What it does — DNS proxy:**
- Customer changes DNS CNAME to CrawlReady's edge network (offered only after 30+ days on Phase 2)
- All traffic flows through CrawlReady. Human requests pass through transparently.
- SLA guarantees, dedicated support, custom bot rules, team seats

**What it does — autonomous optimization:**
- A/B tests different content structures for the same page (FAQ format vs. definition-first vs. bullet-heavy)
- Measures which variant gets cited more
- Automatically promotes winning variants
- Surfaces content gaps: "You have no clear answer to this query that drives citation for competitors"

**Competitive note:** Mersel AI, MachineContext, and Prerender.io are also collecting optimization data. The "data moat" thesis requires CrawlReady to reach sufficient scale quickly or find a vertical niche where competitors have less data.

---

## Long-Term Vision (12+ months)

CrawlReady becomes the **AI interface layer** for the web — the infrastructure site owners use to manage their relationship with AI engines, AI agents, and AI-driven commerce, built on transparency and provable content parity.

**The positioning (revised — April 2026 strategic review):** "The interface layer between your website and AI — for crawlers, visual agents, commerce agents, and compliance." This positions CrawlReady at the intersection of four growing markets with the same underlying architecture:
- **GEO / AI Search** ($1.5B, 40% CAGR): "Can crawlers see your content?"
- **Agentic AI** ($7.6B, 40% CAGR): "Can agents act on and navigate your content?"
- **AI Compliance** (EU AI Act, August 2026): "Can you prove transparency?"
- **Traffic Defense** (immediate): "Can you stop losing traffic to competitors who ARE cited in AI answers?"

Logical extensions:
- **Agentic commerce layer:** Generate MCP server endpoints for customer products automatically, making products discoverable and purchasable by AI agents. ACP (OpenAI/Stripe) and UCP (Shopify/Walmart/Visa/Mastercard) are already live — the first autonomous agent purchase was completed March 25, 2026.
- **Agent identity verification:** Verify that an AI agent accessing your content is authorized (connects to emerging KYA "Know Your Agent" frameworks)
- **Content licensing:** Manage data licensing agreements with AI companies on behalf of website owners
- **Agent-readiness API:** Expose structured product/service data via a programmatic API that AI agents can query directly, bypassing HTML parsing entirely

---

## What NOT to Build

To stay focused as a solo developer:

- **No analytics suite** — don't compete with Google Analytics or Plausible
- **No keyword research** — don't compete with Ahrefs/Semrush
- **No content writing AI** — don't compete with Jasper/Frase
- **No backlink monitoring** — irrelevant to the AI crawlability problem
- **No rate limiting or bot blocking** — different product, different ICP (see `docs/product/problem.md`)
- **No llms.txt-first strategy** — llms.txt can be a minor feature output, not the product hook (no major AI engine uses it as of April 2026)
- **No full SEO schema audit tool** — CrawlReady generates Schema.org for AI consumption, it does not replace dedicated Schema validators (Google Rich Results Test, Schema.org validator) or SEO audit tools (Screaming Frog, Sitebulb)

---

## Decisions (Formerly Open Questions)

All product vision questions have been researched and resolved. See `docs/decisions/open-questions.md` for full evidence and sources.

- **Email gating:** Un-gate the headline score + shareable URL. Gate full PDF report, historical tracking, and "email me when score changes" behind email. Preserves the viral loop while capturing emails from engaged users.
- **SPAs with hash routing:** Support pushState routing only in Phase 0. Flag hash SPAs as "limited crawl surface" in the diagnostic. The ICP (modern B2B SaaS) almost entirely uses pushState.
- **Cache refresh:** Starter default 7-day TTL + webhook-triggered refresh + recache API. Higher tiers get shorter TTLs (Pro: 24h, Business: 12h, Enterprise: 6h). No daily full-site re-crawls. See `docs/product/solution.md` for the full tier table.
- **Benchmarking:** Build a suite of ~50 representative URLs across page types. Measure content coverage (F1 vs gold standard), noise ratio, structure preservation, information completeness. Publish results as differentiation content.
- **Citation monitoring:** Buy/partner for Phase 3, do not build from scratch. CrawlReady's value is at crawl/transformation, not monitoring.
- **Phase 0 scope (revised April 2026):** Three deliverables — landing page + working diagnostic + analytics onboarding with ingest. Auth split: Clerk for site registration, lightweight email capture for diagnostic gating, Supabase as DB only. No npm package, badges, GitHub repo, or multi-channel launch. Pre-seed 20 sites, not 200. Show HN as sole launch channel. Everything else gated on validation. Crawling SaaS provider is not locked to Firecrawl — selected based on comparison. See `docs/architecture/crawling-provider.md`.
- **Open-source timing:** Deferred to Phase 2. Community management overhead incompatible with 15-20 hrs/week solo bandwidth during Phase 0-1. Open-source when there is a stable product worth contributing to.
