# Open Questions — Answered

Consolidated from all CrawlReady docs. Research conducted April 2026 via web search, competitor analysis, academic papers, and industry data. Each answer includes evidence, a decision, and confidence level.

---

## 1. ICP & Market Sizing

### 1.1 — What percentage of B2B SaaS sites are still pure CSR?

**Evidence:** No published stat for "B2B SaaS × pure CSR" exists. Closest proxies:
- State of React 2024: 75% of respondents use SPA patterns, but multi-select — overlaps with SSR (62.5%) and SSG (48%)
- State of JS 2024: ~33% of professionals selected "None" for meta-framework use at work
- SSR/SSG is the default for new projects (Next.js App Router, Nuxt 3, SvelteKit), but legacy React SPAs remain common in production

**Decision:** Estimate **15–25% of B2B SaaS sites** are still pure CSR. It is real but shrinking. Do not build the entire pitch around CSR invisibility — it is the dramatic hook, not the primary market. The broader "noisy SSR" segment is larger and growing. Run our own scan of 500 B2B SaaS homepages during pre-seeding to get a real number.

**Confidence:** Low — no hard data. Directionally reliable. | Sources: `2024.stateofreact.com/en-US/usage/`, `2024.stateofjs.com/en-US/libraries/meta-frameworks/`

---

### 1.2 — Which industries have highest JS-heavy + AI search intent?

**Evidence:**
- OtterlyAI (1M+ citations): technical barriers affect 73% of sites; community/editorial sources dominate citations
- Seenos.ai (their sample): B2B SaaS (+34% AI-attributed traffic increase) and financial services (+47%) showed strongest outcomes from optimization
- State of React 2024 respondent industries: Programming/DevTools, Consulting, E-commerce, Finance, MarTech, HealthTech are top React-using sectors

**Decision:** Primary targets: **B2B SaaS and developer tools** (technical ICP, high AI search intent, React-heavy). Secondary: **Fintech** (high LTV, JS-heavy, strong Seenos signal). Defer: e-commerce (different buyer persona), healthcare (compliance complexity).

**Confidence:** Medium — multiple signals converge. | Sources: `otterly.ai/blog/the-ai-citations-report-2025/`, `seenos.ai/ai-search-learning/does-it-work`

---

### 1.3 — Is there a meaningful market among SSR/SSG sites?

**Evidence:**
- MachineContext blog: ~15–20K tokens typical HTML page → ~3K clean Markdown (~80% reduction). Cloudflare Markdown test: 16K → 3.15K (~80%)
- GEO-SFE academic paper (arXiv 2603.29979): ~17.3% citation improvement from structural optimization alone across 6 generative engines
- Prerender.io claims 25% of AI bots "can fetch JavaScript but can't execute it" — latency and completeness issues affect even SSR sites
- Vercel study: major AI crawlers do not render JavaScript; SSR fixes emptiness but not verbosity

**Decision:** **Yes, meaningful market.** The pitch shifts from "you are invisible" to "AI crawlers see your content buried in 80% noise — we clean it up." The ~17.3% citation lift from structure alone is the quantified business case. **This is the primary market by volume.** Lead with the diagnostic score showing the noise ratio.

**Confidence:** Medium-High — academic + industry data align. | Sources: `machinecontext.ai/blog/`, `arxiv.org/html/2603.29979v1`, `vercel.com/blog/the-rise-of-the-ai-crawler`

---

### 1.4 — Does Prerender.io cannibalize CrawlReady?

**Evidence:**
- Prerender.io homepage now explicitly sells "JavaScript Rendering for SEO, AEO, and LLM Visibility" — direct competitive framing
- Their product renders HTML snapshots, not structured Markdown — different output quality
- HN sentiment (older threads): price sensitivity and desire for self-hosting
- Pricing: $49/mo for only 25K renders — expensive at scale

**Decision:** **High overlap on CSR invisibility story. Partial overlap on SSR optimization** (Prerender serves rendered HTML, not structured Markdown extraction). Differentiate on: (a) Markdown output vs HTML snapshot, (b) open-source, (c) transparency endpoint, (d) free diagnostic, (e) much more generous request limits. **Do not position as "Prerender for AI"** — position as "the AI-native optimization layer" with a fundamentally different output format.

**Confidence:** High — clear competitive overlap with clear differentiation vectors. | Sources: `prerender.io/`, `prerender.io/ai-search/`

---

## 2. Problem Validation & Impact

### 2.1 — Typical content-to-noise ratio for SSR sites?

**Evidence:**
- MachineContext's own published range: ~80% token reduction (15–20K HTML tokens → ~3K Markdown), not the 94% sometimes cited
- Cloudflare Markdown for Agents test: ~80% reduction (16K → 3.15K)
- HTTP Archive 2024: median homepage HTML is ~18KB, but total page weight is ~2.6MB (JS, images dominate bytes; crawlers focused on HTML still see templates, nav, hydration)
- The 94% figure may represent pathological pages; 80% is a safer median claim

**Decision:** Use **~80% as the standard claim** ("AI crawlers receive 5× more noise than content on a typical SSR page"). Reserve 90%+ for specific examples of particularly noisy pages. Run our own measurements during pre-seeding to establish CrawlReady-specific benchmarks with real data.

**Confidence:** Medium — consistent across MachineContext and Cloudflare examples. | Sources: `machinecontext.ai/blog/the-token-cost-of-a-bad-pipeline`, `almanac.httparchive.org/en/2024/page-weight/`

---

### 2.2 — Citation rate difference between noisy and optimized content?

**Evidence:**
- GEO-SFE paper: **~17.3% citation improvement** from structural optimization across 6 engines — strongest peer-reviewed data point
- Earlier GEO work (Aggarwal et al.): up to ~40% from combined semantic + structural modifications
- OtterlyAI: "chunked, schema-tagged, quotable" pages see 3–5× more citations (vendor claim, directional)
- Seenos: 2.3% → 12.7% citation rate after full optimization programs (~5.5×) — confounded with authority/content changes
- Structural clarity is ~15% of citation factors per multiple sources

**Decision:** **Yes, meaningful but not dominant.** Use the ~17.3% figure from the peer-reviewed paper as the defensible claim. Framing: "Format optimization is one lever — it addresses ~15–20% of what drives AI citations. But it is the lever you can fix in 15 minutes without writing new content." Honest, specific, actionable.

**Confidence:** Medium — one strong academic source, vendor data directionally supportive. | Sources: `arxiv.org/html/2603.29979v1`, `otterly.ai/blog/the-ai-citations-report-2025/`, `seenos.ai/ai-search-learning/does-it-work`

---

## 3. Technical Architecture

### 3.1 — User-agent only or add IP range matching?

**Evidence:**
- **OpenAI:** publishes GPTBot IP ranges at `openai.com/gptbot-ranges.txt`
- **Perplexity:** publishes JSON IP lists, explicitly recommends UA + IP matching
- **Google:** publishes JSON IP ranges + DNS reverse lookup verification
- **Apple:** publishes Applebot IP ranges as JSON
- **Anthropic (ClaudeBot):** does NOT publish IP ranges — uses shared provider IPs, recommends robots.txt only
- User-Agent is trivially spoofable — Google's own verification guide requires DNS or IP confirmation
- Cloudflare uses multiple signals: IP, UA, JA3/JA4 TLS fingerprints, session features, ML

**Decision:** **UA + IP range verification for vendors that publish ranges** (OpenAI, Perplexity, Google, Apple). **UA-only fallback for ClaudeBot** until Anthropic publishes ranges. Implement a per-vendor verification matrix. Sync IP ranges from vendor JSON endpoints on a daily schedule.

**Confidence:** High — vendor documentation is clear. | Sources: `openai.com/gptbot-ranges.txt`, `docs.perplexity.ai/guides/bots`, `developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests`, `support.anthropic.com/en/articles/8896518-what-is-claudebot`

---

### 3.2 — How to handle content behind login?

**Evidence:**
- Prerender.io: designed for public pages only. Authenticated content is not the default path
- MachineContext: no documented authenticated crawl flow
- Security risk of storing customer credentials is significant (GDPR, SOC2, supply chain)
- Prerender has run for years on public pages only — the model works

**Decision:** **Phase 1–2: optimize only publicly accessible URLs.** If customers ask, offer: (a) export docs as a public staging path, (b) Enterprise: self-hosted worker in customer VPC. Do not build credential management for Phase 1–2.

**Confidence:** High — industry precedent is clear. | Sources: `docs.prerender.io/docs/how-does-prerender-work`

---

### 3.3 — Cache refresh frequency?

**Evidence:**
- No authoritative "GPTBot TTL" is published. OpenAI and Perplexity note robots.txt changes propagate in ~24h
- Prerender.io TTLs: Starter 24h–7d, Growth 12h–14d, Pro 6h–30d, plus recache API for on-demand refresh
- Cloudflare supports single-URL purge via API — instant invalidation
- Vercel ISR on-demand revalidation is the framework-native analog

**Decision:** **Default TTL of 7 days + webhook-triggered refresh on content change + manual recache API.** Higher tiers get shorter defaults (Pro: 24h, Enterprise: 6h). The recache API is critical — let customers trigger refresh on deploy via CI/CD. Do not build daily full-site re-crawls.

**Confidence:** High — well-established industry pattern. | Sources: `docs.prerender.io/docs/modify-the-cache-expiration`, `developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/`

---

### 3.4 — Public Markdown endpoint or bot-only?

**Evidence:**
- llms.txt convention establishes a norm that machine-oriented alternate representations can be public
- Google canonicalization: duplicate content manageable with `rel=canonical` or `noindex`
- A public endpoint is the strongest anti-cloaking defense: "anyone can audit what we serve AI bots"
- Competitors cannot replicate the transparency argument without opening their black boxes

**Decision:** **Public by default** (`/crawlready-preview/page-slug`) with `rel=canonical` pointing to the original human URL. Add `X-Robots-Tag: noindex` to prevent Google indexing (avoids crawl budget waste). Optionally let Enterprise customers make it private.

**Confidence:** High — aligns with transparency strategy with clean SEO solution. | Sources: `support.google.com/webmasters/answer/139394`

---

### 3.5 — SPAs with hash-based routing?

**Evidence:**
- Hash fragments (`#/path`) are not sent to the server — the edge proxy only sees `/`
- Modern frameworks (Next.js, React Router, Remix) overwhelmingly use HTML5 pushState routing
- Hash routing persists mainly on static hosting (GitHub Pages) and legacy apps
- Prerender's guidance: require explicit URL manifests for hash-based SPAs

**Decision:** **Support pushState routing only in Phase 1.** For hash SPAs: flag as "limited crawl surface" in the diagnostic and recommend migration to history API routing. Not worth building early — the ICP almost entirely uses pushState.

**Confidence:** High — ICP alignment is clear.

---

## 4. Competitive Intelligence

### 4.1 — Competitor transformation quality gaps?

**Evidence:** Public evidence of specific failure modes is thin. No HN threads, Reddit discussions, G2 profiles, or independent benchmarks found for MachineContext, Mersel, or HypoText. The WCXB (Web Content Extraction Benchmark) shows extractors good on articles often fail on forums, products, collections, and documentation by 20–30 F1 points.

**Decision:** **Cannot answer from desk research alone.** Run our own side-by-side tests during pre-seeding: 20 complex pages (SPAs, docs with code blocks, pricing tables, i18n pages, tabs/accordions) comparing raw HTML vs MachineContext output vs our pipeline. Category-level weaknesses to test: code block preservation, table structure, accordion/tab content extraction, i18n routing, product JSON-LD vs visible DOM. This becomes blog post content.

**Confidence:** Low — requires hands-on testing. | Sources: `webcontentextraction.org/`

---

### 4.2 — How to benchmark transformation quality?

**Evidence:**
- WCXB defines word-level precision, recall, and F1 against human annotations — closest standard
- mdream project benchmarks Markdown converters on speed, token counts, and feature support
- No single "GLUE for HTML-to-Markdown" exists

**Decision:** Build a **benchmark suite of ~50 representative URLs** across page types (marketing, docs, API ref, pricing, blog). For each, create a "gold standard" Markdown version. Measure: (a) content coverage (F1 vs gold), (b) noise ratio (tokens removed), (c) structure preservation (headings, lists, tables, code blocks intact), (d) information completeness (key facts, numbers, pricing lines present). Run against our pipeline + competitor outputs. **Publish results** as differentiation content.

**Confidence:** Medium — methodology is sound despite no standard. | Sources: `webcontentextraction.org/`, `github.com/harlan-zw/mdream`

---

### 4.3 — When will Cloudflare build this natively?

**Evidence (UPDATED April 2026):**
- **February 2026: Cloudflare shipped "Markdown for Agents"** — automatic HTML-to-Markdown conversion at the edge via `Accept: text/markdown` content negotiation header. The feature is live, documented, and free for all Cloudflare zones.
- Achieves ~80% token reduction (16,180 HTML → 3,150 Markdown on their blog)
- Also shipped "Content Signals" framework for publishers to manage AI bot access policies
- March 2026: `/crawl` endpoint returning Markdown — additional building block
- **Adoption gap:** GPTBot and PerplexityBot do NOT send the `Accept: text/markdown` header. Only coding agents (Claude Code, OpenCode) do. No major AI search crawler has adopted the header yet.

**Decision (REVISED):** **Cloudflare has already built the Markdown delivery infrastructure.** The original "12–18 months" assumption was wrong — they shipped in February 2026. The remaining question is when AI crawlers will adopt the `Accept: text/markdown` header, which is a matter of when, not if. CrawlReady must build value above the generic Markdown conversion layer: scoring, purpose-built transformation quality (semantic restructuring, FAQ blocks, definition paragraphs — not just HTML-to-Markdown), vertical templates, transparency endpoint, content parity diff engine. CrawlReady should support both UA detection (today) and content negotiation (future) to stay ahead of both competitors and the Cloudflare standard. The open-source community moat and scoring/diagnostic tools matter more than the Markdown serving mechanism itself.

**Confidence:** High — Cloudflare has shipped. Adoption timeline for `Accept: text/markdown` among AI crawlers is the remaining uncertainty. | Sources: `developers.cloudflare.com/fundamentals/reference/markdown-for-agents/`, `blog.cloudflare.com/markdown-for-agents`, `machinecontext.ai/blog/can-chatgpt-request-markdown`, `theregister.com/2026/02/13/cloudflare_markdown_for_ai_crawlers`

---

## 5. Pricing & Packaging

### 5.1 — Is $49/mo the right Pro price?

**Evidence:**
- Prerender.io: $49/mo for 25K renders (verified post-Oct 2025 reprice)
- Mersel AI: pricing on their site appears to be a demo example, not actual SKUs — real model is managed GEO with "book a call"
- HypoText: tiers exist but no public dollar amounts
- MachineContext: no pricing found publicly
- Developer tool anchors: Plausible $9/mo, Supabase ~$25/mo Pro, PostHog usage-based
- Developer audiences prefer transparent, usage-aligned pricing

**Decision:** **$49/mo is defensible but consider a $29/mo entry tier** to lower the trial barrier. The risk is buyers anchoring to Prerender's $49 for 25K renders. Make the unit clear: "edge transformations" (cached, milliseconds) are cheaper than "full browser renders" (Playwright, seconds). The free diagnostic does the heavy conversion lifting.

**Confidence:** Medium — $29–49 range is safe. | Sources: `prerender.io/pricing`, `docs.prerender.io/docs/changes-to-prerender-pricing`

---

### 5.2 — Is 500K requests too generous?

**Evidence:**
- Cloudflare Radar 2025: AI bots average 4.2% of HTML requests
- For a site with 100K monthly pageviews, AI bot requests might be 4–10K
- Cloudflare Workers pricing: 10M requests included on paid plan ($5/mo), $0.30/additional million — 500K requests costs essentially nothing
- Prerender charges $49 for 25K because each render is expensive (headless browser). CrawlReady serves from cache (cheap)

**Decision:** **Keep 500K — it is cheap to serve and a strong competitive differentiator.** Marginal cost of 500K cached Worker responses is negligible. Real costs are in the crawling/transformation pipeline, not edge serving. Consider reframing as **"unlimited cached responses, 10K fresh crawls/month"** to separate the cheap part (serving) from the expensive part (rendering).

**Confidence:** High — unit economics are clear. | Sources: `blog.cloudflare.com/radar-2025-year-in-review/`, `developers.cloudflare.com/workers/platform/pricing/`

---

## 6. Go-to-Market & Distribution

### 6.1 — Email gate for free diagnostic?

**Evidence:**
- HubSpot Website Grader: requires email for personalized report
- Google PageSpeed, Lighthouse, SSL Labs, SecurityHeaders: no email required for basic results
- PLG devtools guidance: ungate core try-before-buy experience; gate depth/enterprise features
- Developer sentiment: 66% prefer email when already evaluating (Evans Data), but sensitive to feeling tricked

**Decision:** **Un-gate the headline score + shareable URL.** Gate the full PDF report, historical trend tracking, and "email me when score changes" behind email. Preserves the viral loop (public URLs, badge sharing, Twitter screenshots) while capturing emails from engaged users. Pattern: instant score = free, actionable depth = email.

**Confidence:** High — matches successful precedents. | Sources: `blog.hubspot.com/marketing/website-grader-relaunch`, `pagespeed.web.dev/`

---

### 6.2 — On-demand or pre-generated score pages?

**Evidence:**
- HubSpot: on-demand generation after submit, not pre-rendered directory
- Mozilla Observatory: cached for 24h, minimum 60s between rescans
- Playwright: ~30–90s per crawl, ~0.7–1.1GB RAM per concurrent browser

**Decision:** **On-demand with aggressive caching (24h TTL).** Pre-seed 200 sites before launch (batch job overnight), then all subsequent scans are on-demand. Use a job queue with concurrency limits. Stale-while-revalidate pattern: serve cached result immediately, trigger background refresh if stale.

**Confidence:** High — standard pattern. | Sources: `observatory.mozilla.org/faq/`

---

### 6.3 — npm package without API key?

**Evidence:**
- PostHog: MIT, SDK needs project token for any host
- Sentry: SDK needs DSN — empty DSN = no network call
- Plausible: AGPL self-hosted needs no third-party account
- PLG principle: minimize steps to first value

**Decision:** **Free/local mode works without API key** — runs HTML extraction + scoring entirely on user's machine (CLI output only). **API key required for hosted features** (edge proxy, dashboard, historical tracking, badge endpoint, team features). The keyless local mode IS the open-source core; the hosted service is the paid product.

**Confidence:** High — well-established pattern.

---

### 6.4 — How many pre-seeded score pages?

**Evidence:**
- HubSpot accumulated 250K URLs in year one through usage, did not pre-seed
- Programmatic SEO: indexation can be low for thin pages (~18% in one study), quality + internal linking helps
- Firecrawl API at ~1 credit per page — 200 pages is negligible cost

**Decision (SUPERSEDED by 11.2 — April 2026 critical analysis):** Original plan was 200 for launch, 500 within first month. **Revised to 20 for Phase 0** (enough for Show HN screenshots and blog post). 200 additional sites in Phase 1. See section 11.2 for the revised scope rationale — Phase 0 must ship in 3 weeks part-time with exactly 2 deliverables.

**Confidence:** Medium — 200 is a reasonable starting point. | Sources: `hubspot.com/blog/bid/5539/Website-Grader-Analyzes-Over-2-Million-Sites`

---

### 6.5 — Data-driven or emotional blog post?

**Evidence:**
- Plausible's viral post combined provocation + evidence — hit #1 on HN, ~48K uniques in a week
- PostHog content doctrine: genuine usefulness, opinionated but substantive, non-clickbait
- Show HN analysis: specific pain point + demo + solo projects perform well
- HN audience rewards technical depth and data; punishes obvious marketing

**Decision:** **Data-first with a sharp thesis.** Title: "We scanned 200 SaaS sites — here's what ChatGPT actually sees." Open with the most striking finding ("73% serve AI crawlers 80% noise"). Include real screenshots and score comparisons. The emotional hook comes from the data, not the framing. **Separate the Show HN post** (link to tool, technical framing) **from the blog post** (data + educational framing) — two launches, two audiences, different days.

**Confidence:** High — strong precedent. | Sources: `plausible.io/blog/blog-post-changed-my-startup`, `posthog.com/blog/dev-marketing-for-startups`

---

### 6.6 — Numeric score or letter grade for badges?

**Evidence:**
- Lighthouse, Codecov: numeric (0–100, percentage) — developer norm
- SecurityHeaders, SSL Labs, Mozilla Observatory: letter grades (A+–F) — security norm
- Letter grades are coarser, more "gameable"; numerics feel precise and CI-native
- No research on which format drives more badge adoption

**Decision:** **Numeric by default (85/100), with color coding.** Aligns with Lighthouse/Codecov ecosystem. Offer a letter-grade variant as an option. Badge URL: `crawlready.app/badge/site.com.svg` (numeric) and `crawlready.app/badge/site.com.svg?style=grade` (letter). Green/yellow/red color range: 80+/50–79/below 50.

**Confidence:** Medium — numeric is safer given ICP.

---

## 7. Open-Source & Licensing

### 7.1 — BSL vs AGPL?

**Evidence:**
- HashiCorp BSL (Aug 2023): major backlash, Terraform forked as OpenTofu (Linux Foundation). BSL not recognized as "open source" by OSI
- Plausible: moved MIT → AGPLv3 to stop proprietary forks/hosted clones
- Cal.com: AGPLv3 with commercial enterprise paths
- PostHog: MIT + proprietary `ee/` directory
- Supabase: Apache-2.0
- AGPL: prevents hosting without open-sourcing modifications. Familiar to developers but corporations sometimes avoid
- BSL: clearer commercial restrictions but less familiar, reputational risk after HashiCorp

**Decision:** **AGPL for the transformation pipeline.** Prevents competitors from hosting CrawlReady commercially without contributing back, is recognized as legitimate open source (unlike BSL), and has working precedent (Plausible, Cal.com). Proprietary layer (hosted edge delivery, dashboard, scoring engine, analytics) stays under commercial license. Avoid BSL — HashiCorp precedent makes it a trust liability for a new project.

**Confidence:** High — clear precedent and alignment. | Sources: `hashicorp.com/blog/hashicorp-adopts-business-source-license`, `plausible.io/blog/open-source-licenses`, `opentofu.org/blog/opentofu-announces-fork-of-terraform`

---

## 8. Build & Execution

### 8.1 — Realistic part-time timeline?

**Evidence:**
- Existing building blocks: Firecrawl (hosted crawl + extract + Markdown API), Jina Reader (reader API), Turndown (HTML→Markdown), Mozilla Readability (content extraction)
- Firecrawl and Jina Reader delegate rendering and extraction entirely — trade margin for speed
- Playwright MVP for single-developer: weeks for basic crawl, months for production-grade extraction

**Decision:** **Use Firecrawl as the transformation backend for Phase 0–1.** Do not build Playwright from scratch for the diagnostic. Firecrawl gives crawl + extract + Markdown in one API call. Build the scoring algorithm, Next.js frontend, and score page generation ourselves. **Realistic timeline: 2–3 weeks part-time for the diagnostic MVP** using Firecrawl. Build custom Playwright pipeline only for Phase 2 when full control is needed.

**Confidence:** Medium-High — depends on Firecrawl API reliability. | Sources: `docs.firecrawl.dev/features/scrape`

---

### 8.2 — Documentation frameworks: market share and AI visibility?

**Evidence:**
- Downloads (approximate, 2026): Docusaurus and VitePress ~500K weekly, Starlight ~350K/month, Nextra strong in Next.js shops
- Most doc frameworks are SSG (good for crawlers) — pain is noise (nav, search UI, scripts, versioned URLs), not CSR invisibility
- Mintlify auto-generates llms.txt and llms-full.txt — already has AI-facing features
- Starlight/Astro emphasizes minimal JS — often cleaner HTML

**Decision:** **Target Docusaurus first** (largest market share, React ecosystem = ICP overlap, heavy JS client-side search). Avoid competing with Mintlify directly (already has AI features, less technical audience). Docusaurus plugin is the vertical wedge: "Make your Docusaurus docs 5× cleaner for AI crawlers in one npm install." Secondary: VitePress (Vue), Nextra (Next.js).

**Confidence:** Medium — Docusaurus is the safest bet. | Sources: `pkgpulse.com/blog/docusaurus-vs-vitepress-vs-nextra-vs-starlight-documentation-sites-2026`, `mintlify.com/docs/llms.txt`

---

### 8.3 — Concurrent Playwright crawls per VM?

**Evidence:**
- ~700MB–1.1GB RAM per headless Chromium instance
- 8GB VM: ~4–6 concurrent light crawls before swap thrash
- Managed alternatives: Browserless (free: 2, paid: 30–100+), Browserbase (free: 3, Developer: 25), Firecrawl (per-credit model)
- Firecrawl at ~$0.01–0.05/page — 200 pre-seeded sites = $2–10 total

**Decision:** **Do not self-host Playwright for Phase 0–1.** Use Firecrawl API (eliminates infrastructure complexity entirely). For pre-seeding: Firecrawl. For launch-day traffic: queue system with Firecrawl concurrency limits. **Self-host Playwright only for Phase 2** when full control and cost optimization are needed at scale.

**Confidence:** High — cloud API pricing is clear. | Sources: `datawookie.dev/blog/2025/06/playwright-browser-footprint`, `docs.firecrawl.dev/billing`

---

### 8.4 — Abuse prevention for free scanner?

**Evidence:**
- SSL Labs: IP-based throttling + terms of use
- VirusTotal: 4 requests/minute, 500/day for free API
- Mozilla Observatory: minimum 60s between scans per site
- Common pattern: IP + fingerprint rate limits, CAPTCHA at abuse threshold, progressive gating

**Decision:** **IP-based rate limiting: 3 scans per hour per IP without signup, 10 per hour with email, unlimited with API key.** Lightweight queue system (return "scan in progress, check back in 30s"). CAPTCHA only if abuse is detected (not by default). Per-site limit: 1 scan per 24h per URL (prevents hammering).

**Confidence:** High — well-established patterns. | Sources: `ssllabs.com/about/terms.html`, `observatory.mozilla.org/faq/`

---

## 9. Platform & Marketplace

### 9.1 & 9.2 — Cloudflare Apps marketplace viability?

**Evidence:** **Cloudflare Apps has been deprecated.** A June 2025 docs PR removed references to it. Community forum discusses "Cloudflare App sunsetting." Support URLs redirect to generic Workers marketing. There is no replacement "Workers App Store" with public revenue split and approval process. Workers for Platforms is for ISVs building multi-tenant platforms, not a consumer marketplace.

**Decision:** **Remove Cloudflare Apps marketplace from the distribution strategy entirely.** Replace with: (a) publish a Cloudflare Worker template on GitHub (discoverable, forkable), (b) write a Cloudflare-specific integration guide in CrawlReady docs, (c) target the Cloudflare developer blog for a guest post or case study.

**Confidence:** High — Apps marketplace is confirmed deprecated. | Sources: `github.com/cloudflare/cloudflare-docs/pull/23037`, `community.cloudflare.com/t/cloudflare-app-sunsetting/621719`

---

## 10. Build vs. Buy

### 10.1 — Build or buy citation monitoring?

**Evidence:**
- Otterly: Lite ~$29/mo, Standard ~$189/mo, Premium ~$489/mo
- Semrush AI toolkit: $140–500/mo
- Peec.ai: API gated to higher tiers
- Building your own: prompt suites × models × scheduling × storage + UI; model API costs dominate
- Citation monitoring is increasingly commodity

**Decision:** **Buy/partner for Phase 3. Do not build.** CrawlReady's value is at the crawl/transformation layer, not monitoring. Options: (a) integrate Otterly's API, (b) build a thin wrapper calling ChatGPT/Perplexity APIs to check for domain citations, (c) partner with a monitoring vendor. The only reason to build is to tie citations to specific content transformation hashes — a unique capability. Defer until Phase 2 revenue validates the business.

**Confidence:** High — build/buy calculus clearly favors buying for a solo founder. | Sources: `otterly.ai/pricing`, `semrush.com/kb/1547-seo-toolkit-pricing-limits`

---

## 11. Critical Analysis (April 2026)

Questions surfaced by an independent critical analysis of all CrawlReady strategy docs, cross-referenced against live market data.

### 11.1 — Are unit economics viable at $29 Starter with Firecrawl?

**Evidence:**
- Firecrawl API costs $0.01–$0.05 per page
- Original Starter tier: 5K fresh crawls/month at $29/mo → $50–$250 COGS
- Original Pro tier: 25K fresh crawls/month at $49/mo → $250–$1,250 COGS
- Every paid tier was negative margin at original crawl limits
- Cached responses (served from Cloudflare Workers) cost ~$0 — the cost is entirely in fresh crawls

**Decision:** **No, not viable at original limits.** Reduce fresh crawl limits: Starter 500/month, Pro 2,500/month, Business 10K/month. This keeps Firecrawl COGS at $5–$25/mo for Starter (positive margin at $29). Validate actual per-page costs during Phase 0 before committing to tier limits. Overage rate raised from $0.005 to $0.01 to cover COGS with margin.

**Confidence:** High — arithmetic is clear. | Sources: `docs.firecrawl.dev/billing`, `developers.cloudflare.com/workers/platform/pricing/`

---

### 11.2 — Can Phase 0 be built in 2 weeks part-time?

**Evidence:**
- Original Phase 0 included: Next.js landing page, Firecrawl integration, scoring algorithm, side-by-side UI, score URL generation, email capture, pre-seeding 200 sites, npm package, badge endpoint, GitHub repo, embeddable widgets
- At 15–20 hrs/week, that's ~30–40 total hours in "2 weeks"
- A working diagnostic alone (landing page + Firecrawl + scoring + UI + score URLs + email) is ~45–60 hours of work
- The original scope was 6–8 weeks of realistic part-time effort, not 2

**Decision:** **No.** Realistic estimate is 3 weeks part-time for the diagnostic MVP only (landing page + working diagnostic). Remove npm package, badge endpoint, GitHub repo, and pre-seeding 200 sites from Phase 0. Pre-seed 20 sites (enough for screenshots). Move everything else to Phase 1+ gated on validation.

**Confidence:** High — based on typical Next.js project build times with API integration.

---

### 11.3 — Should open-source be a Phase 0 priority?

**Evidence:**
- Plausible Analytics (AGPL, the cited precedent): 4-person team, $3.1M revenue, 99.9% from hosted service. Community contributions are valuable but require active management.
- OpenClaw (fastest-growing GitHub project, Feb 2026): costs founder $10–20K/month with no monetization path
- AGPL creates corporate adoption friction: one founder switched 90% of their project from AGPL to Apache 2.0
- 99% of open-source community members never pay (Commune Research, 2026)
- Community contributions won't materialize until the project has hundreds of stars and active usage — which takes months of investment with no return
- Community management (issues, PRs, documentation, expectation management) is a significant tax on 15–20 hrs/week

**Decision:** **No. Defer to Phase 2.** Phase 0-1 ships proprietary to maximize velocity. Open-source the transformation pipeline when there is a stable, working product worth contributing to and the developer has bandwidth to manage contributions. The "trust through transparency" benefit can be achieved in Phase 0 by explaining the transformation logic in docs — a GitHub repo is not required for this.

**Confidence:** High — research evidence is strong. | Sources: `plausible.io/blog/building-open-source`, `building.theatlantic.com/he-built-the-fastest-growing-open-source-project`, `devonmeadows.com/research/oss-business-models/`

---

### 11.4 — Is the SSR noise-reduction pitch strong enough for Phase 0?

**Evidence:**
- CSR SPA owners: content scores 0–20. The diagnostic shows a near-empty page. The problem is binary and visceral.
- SSR site owners: content scores 40–70. The diagnostic shows "your content has noise" — which is less dramatic and requires more explanation.
- The buyer doesn't experience AI crawler token counts directly. They experience "why am I not showing up in ChatGPT?" — and the answer is usually authority/comprehensiveness (80% of citation factors), not format.
- The CSR pitch ("your content doesn't exist") converts faster than the SSR pitch ("your content has noise") because urgency is higher.
- Despite the CSR segment being "small and shrinking" in terms of new projects, the installed base of legacy CSR SPAs in production is substantial.

**Decision:** **No, not for Phase 0.** Lead with CSR invisibility as the Phase 0 beachhead — stronger aha moment, higher urgency, clearer conversion path. Expand to SSR sites in Phase 1+ using CSR success stories as proof. The diagnostic serves both segments (the score adjusts), but the marketing hook must be the dramatic CSR version for initial traction.

**Confidence:** Medium-High — logic is sound but untested. Phase 0 will validate.

---

## Summary

| Theme | Count | All Answered |
|-------|-------|-------------|
| ICP & Market Sizing | 4 | Yes |
| Problem Validation & Impact | 2 | Yes |
| Technical Architecture | 5 | Yes |
| Competitive Intelligence | 3 | Yes (4.1 deferred to hands-on testing) |
| Pricing & Packaging | 2 | Yes |
| Go-to-Market & Distribution | 6 | Yes |
| Open-Source & Licensing | 1 | Yes |
| Build & Execution | 4 | Yes |
| Platform & Marketplace | 2 | Yes |
| Build vs. Buy | 1 | Yes |
| Critical Analysis | 4 | Yes |
| **Total answered** | **34** | |
