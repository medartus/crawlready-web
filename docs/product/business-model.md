# Business Model

CrawlReady is a B2B SaaS with a free-tier-first funnel, usage-based pricing, and a developer ICP. Built as a side project with a demand validation gate before committing to full build.

---

## Ideal Customer Profile

### Primary ICP — Developer-led B2B SaaS with JS frontends

**Who:** CTOs, lead developers, or technical co-founders at SaaS companies (5–100 employees) with any JavaScript frontend (Next.js, React, Vue, Angular, SvelteKit — whether CSR, SSR, or hybrid). They own both the website infrastructure and the marketing outcome.

**Why they buy:** They understand crawlability and rendering. They have authority to add a Cloudflare Worker or Nginx rule (Level 2 onboarding requires no DNS change). They buy tools without procurement processes. They've already Googled "why isn't my site showing up in ChatGPT."

**The universal hook:** "Your site looks different to AI crawlers than to humans." This works across the severity spectrum:
- **CSR SPA owners (critical — score 0–20):** Content is literally invisible. The diagnostic shows a near-empty page. Most dramatic aha moment.
- **SSR/SSG site owners with heavy JS (moderate — score 40–70):** Content is present but buried in 90%+ HTML noise (nav, scripts, tracking, styling). Client-rendered components are missing. The diagnostic shows clear gaps.
- **Hybrid sites (variable — score 20–60):** Some routes are server-rendered, others are client-only. The diagnostic reveals the inconsistency.

**Where to reach them:** Hacker News (Show HN), Product Hunt, dev.to, Twitter/X tech community, Reddit r/webdev and r/nextjs.

### Secondary ICP (Phase 3+) — SEO-aware marketing teams at technical SaaS

**Who:** Growth leads and SEO managers at SaaS companies who are being asked to "do something about AI search visibility" and have budget to solve it quickly.

**When they enter:** After Phase 3 (citation monitoring) ships. They need the outcome metric (citations) more than the technical diagnostic.

**Drop for now:** Marketing teams at non-technical companies, content publishers, agencies managing WordPress sites — their buyer persona and distribution channels don't overlap with a developer-first product.

---

## Unit Economics (Critical — April 2026 Analysis)

Before committing to pricing, the cost structure must be validated. The Firecrawl API is the primary COGS for Phase 0–1, and it creates a margin problem at the originally planned crawl limits.

**Firecrawl COGS per customer (at $0.01–$0.05/page):**

| Tier (Original Limits) | Fresh Crawls/Month | Firecrawl COGS Range | Price | Margin |
|---|---|---|---|---|
| Starter (was 5K) | 5,000 | $50–$250/mo | $29/mo | **Negative** |
| Pro (was 25K) | 25,000 | $250–$1,250/mo | $49/mo | **Deeply negative** |
| Business (was 100K) | 100,000 | $1,000–$5,000/mo | $199/mo | **Catastrophic** |

**The original crawl limits make every paid tier unprofitable.** Even at the optimistic $0.01/page rate, the Starter tier costs $50 in Firecrawl credits against $29 in revenue.

**Resolution:** Reduce fresh crawl limits to sustainable levels. Actual AI bot traffic for a site with 100K monthly human pageviews is ~4–10K requests — but those are *cached response serves*, not *fresh crawls*. Fresh crawls only occur on cache miss or manual refresh. Realistic fresh crawl usage per customer is much lower than the tier limits. The revised limits below reflect this reality while still being generous relative to actual usage patterns.

**Phase 0 validation task:** During the diagnostic phase, measure actual Firecrawl costs per scan to calibrate pricing. The $0.01–$0.05 range is wide — pinning the actual cost per page type (marketing page vs. docs page vs. SPA) will determine whether $29 or $49 is the right Starter price.

---

## Pricing

Two-unit model: **cached responses** (cheap — served from edge, negligible marginal cost) and **fresh crawls** (expensive — Playwright/Firecrawl rendering). This separates the value delivered (optimized bot responses) from the cost incurred (content generation).

| Tier | Price | Cached Responses/Month | Fresh Crawls/Month | Features |
|---|---|---|---|---|
| **Free** | $0 | N/A | 3 scans/hr per IP | AI Readiness Score (unified 0–100 headline), Crawlability Score (0–100), Agent Readiness Score (0–100), Agent Interaction Score (0–100), EU AI Act checklist (X/4), visual diff (browser vs. crawler), top 3 recommendations, Schema generation preview (detection only), public shareable score URL. Full recommendations + PDF gated behind email capture. |
| **Starter** | $29/mo | Unlimited | 500 | CDN snippet (Level 2), Markdown serving, crawlability score trend, webhook-triggered refresh |
| **Pro** | $49/mo | Unlimited | 2,500 | Priority cache refresh (24h default TTL), cache freshness alerts, API access, embeddable badge, **dynamic Schema.org generation + injection (FAQPage, Product, HowTo)**, multi-format serving (Markdown + enriched HTML per AI client type) |
| **Business** | $199/mo | Unlimited | 10K | Citation monitoring (Phase 3, buy/partner), team seats (3), 12h default TTL, advanced analytics, agent readiness API, dynamic Schema.org generation + injection |
| **Enterprise** | Custom | Unlimited | Unlimited | DNS proxy (Level 3), SLA, SOC 2 docs, custom bot rules, 6h TTL, dedicated support, EU AI Act compliance reporting, dynamic Schema.org generation + injection |

**Crawl limit rationale (revised):** Fresh crawls are the expensive operation (Firecrawl/Playwright rendering at $0.01–$0.05/page). Cached responses are nearly free ($0.30 per million on Cloudflare Workers). The limits above keep Firecrawl COGS at $5–$25/mo for Starter and $25–$125/mo for Pro — sustainable margins. Limits are subject to validation against actual Firecrawl costs during Phase 0.

**Overage:** $0.01 per additional fresh crawl above tier limits (covers COGS with margin).

**Annual discount:** 20% (2 months free).

**Why this pricing model:**
- **Separates cheap from expensive:** Serving cached Markdown to AI bots costs ~$0 on Cloudflare Workers (10M requests included on $5/mo plan). The real cost is the Playwright/Firecrawl rendering pipeline. Pricing must reflect this.
- **$29 Starter tier lowers the trial barrier:** Prerender.io charges $49 for 25K renders (full browser renders are a different, more expensive unit). CrawlReady's $29 with unlimited cached responses and 500 fresh crawls covers a typical site's refresh needs.
- **$49 Pro for higher-frequency sites:** 2,500 fresh crawls covers sites with hundreds of pages updating weekly. The unit education matters: "edge transformations (cached, milliseconds) are fundamentally cheaper than full browser renders (Playwright, seconds)."
- **Cloudflare Workers unit economics:** 500K cached Worker responses cost ~$0.15 at $0.30/million. The margin is in the SaaS value, not the infrastructure cost.

**Why no domain limits:**
- A solo developer with one high-traffic domain provides more value (and more cost) than an agency with 20 low-traffic domains
- Domain count is a proxy metric that creates artificial upgrade pressure without reflecting real value

**AI bot traffic context:** Cloudflare Radar 2025 reports AI bots average 4.2% of HTML requests. For a site with 100K monthly human pageviews, AI bot requests might be 4–10K. These are mostly *cached response serves* (nearly free). Fresh crawls only happen on cache miss, webhook-triggered refresh, or TTL expiry. Most Starter customers will use well under 500 fresh crawls/month.

---

## Revenue Targets (Revised — Honest Assessment, April 2026)

Building alone, alongside a day job. Constraints: ~15–20 hrs/week. 17+ direct and adjacent competitors already exist (MachineContext, Mersel AI, HypoText, Prerender.io, DualWeb.AI, GenRankEngine, iGEO, Clemelopy, MultiLipi, Pure.md, AgentReady.tools, plus 6+ free scanners and npm middleware packages — see `docs/product/market.md` for full April 7, 2026 landscape). Targets are adjusted accordingly.

**Conversion math reality check:** $5K MRR requires ~100 customers at ~$50 weighted average. At 5% free-to-paid conversion, that's ~2,000 engaged free users. At 5% signup rate from visitors, that's ~40,000 landing page visitors. For a solo side project without paid acquisition, 40K visitors in 12 months is aggressive. Targets below reflect this honestly.

### Phase 0 — Validation (Weeks 1-6, $0 revenue target)

| Week | Activity | Success Metric |
|---|---|---|
| 1-3 | Build landing page + live diagnostic (Firecrawl API) | Page live at crawlready.app |
| 3 | Pre-seed 20 sites, write blog post | Score pages live, post drafted |
| 4 | Show HN launch | 30+ upvotes, quality comments |
| 5-6 | Monitor results, assess feedback | See `docs/research/validation-experiment.md` |
| 7 | Go/no-go decision | Kill gate metrics below |

**Kill gate:** If Show HN generates <200 visits and <20 signups, reconsider the project before building anything.

**Bandwidth caveat:** "Week 1-3" at 15-20 hrs/week is ~45-60 total hours. A working diagnostic with Next.js frontend, Firecrawl integration, scoring algorithm, side-by-side UI, score URL generation, and email capture is tight but achievable if scope is held to exactly these deliverables.

### Phase 1 — Free Diagnostic Expansion + Distribution (Months 2-4, $0 revenue)

| Month | Target | How |
|---|---|---|
| 2-3 | Scale diagnostic + pre-seed 200 sites | Firecrawl API, scoring refinement, SEO footprint expansion |
| 3 | Ship MCP server + npm package | Distribution into developer IDEs and npm ecosystem |
| 3 | Ship AI Crawler Analytics dashboard + middleware snippets | Free tool for ongoing engagement + backlink growth |
| 3-4 | First 100-200 free users | Convert waitlist + organic from Show HN + dev.to content + MCP discovery |
| 4 | Docusaurus plugin MVP + badge endpoint | Vertical wedge for API documentation sites |

### Phase 1.5 — Monitoring Tool Integrations (Months 4-5, $0 direct revenue)

| Month | Target | How |
|---|---|---|
| 4 | Public referral endpoint live | `crawlready.app/fix?url=...&source=...` — zero-effort integration for partners |
| 4-5 | Outreach to Profound, Peec.ai, and Otterly | Email + demo of the fix flow for their customers (Profound outreach begins during Phase 1 — see `docs/research/monitoring-integration.md`) |
| 5 | First partnership referrals flowing | Track conversion from monitoring tool referrals vs. organic |

### Phase 2 — First Revenue (Months 5-8)

| Month | Target | How |
|---|---|---|
| 5-6 | Launch Starter ($29/mo) + Pro ($49/mo) tiers | Convert free users with low crawlability + agent readiness scores |
| 6-7 | $500-1,000 MRR (15-30 paid customers) | Direct outreach to waitlist + monitoring tool referrals + MCP-discovered users |
| 7-8 | $1,000-2,000 MRR (20-50 paid customers) | Organic SEO compounding + partner referral volume increasing |

### Phase 3 — Growth (Months 8-12)

| Month | Target | How |
|---|---|---|
| 8-9 | $2,000-3,000 MRR (40-60 paid customers) | Business tier upgrades, monitoring partner referrals scaling, expand to SSR ICP |
| 10-12 | $3,000-5,000 MRR (60-100 paid customers) | Organic SEO compounding, partner channel maturation, open-source launch |

### Revenue Targets — Two Scenarios (Revised — April 2026 Innovation Review)

**Base case (crawlability-only framing): $2,000–3,000 MRR at 12 months.**
This is unchanged from the previous conservative estimate. It reflects the reality of a competitive GEO market with 8+ competitors, part-time effort, and the ~15% citation factor ceiling. The conversion math remains: $3K MRR requires ~60 customers at ~$50 average, which requires ~1,200 engaged free users at 5% conversion, which requires ~24,000 visitors at 5% signup rate.

**Upside case (agent readiness + compliance + monitoring partnerships): $5,000–8,000 MRR at 12 months.**
This scenario reflects the expanded positioning (crawlability + agent readiness + EU AI Act compliance) and the B2B2B monitoring tool distribution channel. The additional revenue drivers:

| Driver | Incremental MRR Potential | Rationale |
|---|---|---|
| Agent readiness positioning | +$500-1,500/mo | Higher WTP ($199+ Business tier) from agent-readiness-aware buyers (35% of B2B buyers use AI assistants for vendor evaluation) |
| EU AI Act compliance angle | +$500-1,000/mo | Opens regulated industry buyers (fintech, healthcare) with compliance budgets, August 2 deadline creates urgency |
| Monitoring tool referrals | +$1,000-2,000/mo | Zero-CAC customers from Profound/Peec.ai/Otterly referrals; higher conversion rate (pre-educated buyers). Profound alone has 700+ enterprise customers. |
| MCP server + Docusaurus discovery | +$500-1,000/mo | IDE-native and vertical-specific distribution channels no competitor has |

**Conditions for the upside case:**
- Phase 0 validates the hook (must-have kill gate metrics are met)
- Agent readiness score resonates with users (tracked via score page engagement)
- At least one monitoring tool partnership is active by Month 6
- EU AI Act deadline creates measurable inbound interest

**12-month target: $3,000–5,000 MRR (base-to-realistic), $5,000–8,000 MRR (upside).** The upside is achievable without a viral moment — it comes from structural advantages (multiple distribution channels, broader positioning, higher WTP segments) rather than luck.

Break-even (infrastructure costs): ~$200/mo (Cloudflare Workers $5/mo, Firecrawl/Playwright credits ~$100/mo, Vercel Pro $20/mo, Supabase free→Pro $25/mo, misc $50/mo).

### Why targets are revised upward (April 2026 innovation review)

The original $2-3K MRR target was set assuming:
- CrawlReady competes only in the GEO optimization market ($1.5B)
- Distribution is limited to Show HN + organic SEO
- The value prop is capped at ~15% of citation factors
- No partner channels

The revised upside reflects:
- Agent readiness positioning expands TAM from $1.5B to $7.6B+ (agentic AI market)
- EU AI Act compliance opens regulated industry buyers with higher WTP and a hard deadline (August 2, 2026)
- Monitoring tool partnerships provide zero-CAC customer acquisition channel
- MCP server and Docusaurus plugin create distribution channels no competitor has
- The base-case conservative target ($3-5K MRR) is preserved — only the upside is raised

**Critical caveat:** The upside scenario requires the agent readiness and compliance angles to resonate with actual users during Phase 0. If Phase 0 data shows users only engage with the crawlability score (not agent readiness or compliance), revert to the base case and focus entirely on crawlability optimization.

### What would accelerate past $5K

Everything from the original list, plus:
- A viral Show HN or blog post breaks through (5K+ visits in a week)
- Cloudflare Worker template generates organic distribution via GitHub discovery
- A competitor has a public failure (cloaking penalty, downtime) and CrawlReady's transparency angle wins converts
- Open-source repo (Phase 2+) reaches 500+ stars (community flywheel)
- Docusaurus plugin captures the API docs niche before competitors notice
- **Monitoring tool partnership with Profound drives 50+ referrals/month** (700+ enterprise customers, 10%+ of Fortune 500)
- **EU AI Act deadline (August 2) creates inbound demand spike** from compliance-motivated buyers
- **Agent readiness score goes viral** as a "check your score" moment separate from crawlability

---

## Acquisition Strategy

For full channel analysis with implementation details, see `docs/research/distribution-strategy.md`. Summary below.

**Solo founder constraint (critical):** The full distribution strategy identifies 12 channels. Attempting all 12 simultaneously is a 6-person team's plan. Phase 0 uses **one channel** (Show HN). Additional channels are added one at a time in subsequent phases, gated on validation metrics and available bandwidth.

### The Core Growth Engine: Public Shareable Score URLs

Modeled on HubSpot's Website Grader (2M+ leads, 20K monthly visitors from a free scoring tool). Every crawlability scan generates a permanent, public, shareable, indexable URL (e.g., `crawlready.app/score/stripe.com`). This is built into the diagnostic itself — every scan creates a score page automatically.

### Phase 0 — Build + Launch (Weeks 1-6)
- Build landing page with **live** diagnostic (not mocked — real crawl via Firecrawl API)
- Pre-seed 20 popular developer tool sites with scores (enough for screenshots and Show HN)
- Write data-driven blog post: "We scanned 20 SaaS sites — here's what ChatGPT actually sees"
- **Show HN** (Tuesday-Thursday, 9AM-12PM EST): link to working free tool, technical framing
- That's it. No npm package, no badges, no GitHub Action, no MCP server for Phase 0.

### Phase 1 — Expand Distribution (Weeks 7-16, if validated)
- Pre-seed 200 additional sites (expand SEO footprint)
- Ship npm package (`crawlready`) with free-tier static analysis
- **Ship MCP server** (`crawlready-mcp`) — 3 tools for IDE-native crawlability checks
- Create embeddable badge SVG endpoint
- **Ship Docusaurus plugin MVP** (`@crawlready/docusaurus`) — vertical wedge for API docs
- Cross-post blog to dev.to and Hashnode
- Share on Twitter/X with striking side-by-side screenshots
- Reddit: r/webdev, r/nextjs (educational framing, not sales)

### Phase 1.5 — Monitoring Tool Integrations (Months 4-5, if Phase 1 shows traction)
- Build public referral endpoint for monitoring tools (`crawlready.app/fix?url=...&source=...`)
- Outreach to Profound (700+ enterprise customers, $155M funded), Peec.ai (1,500+ customers), and Otterly (inside Semrush, 15K-20K+ users)
- Revenue share: 20% of first year revenue per converted customer
- See `docs/research/monitoring-integration.md` for full partnership model

### Phase 2 — Multi-Channel Distribution (Months 3-6, if Phase 1 converted)
- Create GitHub repo with open-source transformation pipeline (AGPL licensed)
- Publish GitHub Action (CI/CD crawlability checks on every PR)
- Publish Cloudflare Worker template repo
- Product Hunt launch (separate from Show HN — different audience)

### Phase 3 — Platform Channels (Months 7-12)
- Vercel marketplace integration
- Agency white-label channel
- Framework ecosystem packages (Nuxt, Remix, Astro)

### Distribution Advantages No Competitor Has

| Channel | Competitors | CrawlReady | Phase |
|---|---|---|---|
| Public shareable score URLs | None | Built into diagnostic | 0 |
| Visual diff diagnostic | None (metadata-only or signal-checking tools exist — no competitor shows browser render vs. crawler HTML side-by-side) | Core product | 0 |
| Agent Readiness Score | AgentReady.tools (similar metric name) | Built into diagnostic with unified composite score | 0 |
| EU AI Act readiness checklist | None | Built into diagnostic | 0 |
| npm package | botversion (basic) | Full middleware + free analysis | 1 |
| AI Crawler Analytics middleware | MachineContext (edge-level, paid only) | Free, framework-level ultra-light snippets + dashboard | 0/1 |
| Hidden backlink (free tier) | None | `<link>` tag in `<head>` on all free-tier pages | 0/1 |
| MCP server | None in AI optimization | IDE-native crawlability checks | 1 |
| Docusaurus plugin | None | Vertical wedge for API docs | 1 |
| Embeddable score badge | None in AI optimization | Planned (shields.io format) | 1 |
| Monitoring tool integration | None | "Fix layer" for $230M+ funded monitoring tools (Profound $155M at $1B) | 1.5 |
| Open-source repo | None (all proprietary) | Planned (AGPL licensed) | 2 |
| GitHub Action | None | Planned (CI/CD integration) | 2 |
| Cloudflare Worker template | None | Planned (GitHub repo) | 2 |

See `docs/research/distribution-strategy.md` for complete implementation details per channel.

---

## Moat

The core mechanic (user-agent detection + Markdown serving) is no longer a moat — eight or more companies already ship it. Defensibility must come from elsewhere.

**Short-term — Diagnostic-first acquisition:** The free crawlability diagnostic with public shareable score URLs (HubSpot Website Grader model) creates a distribution moat. No competitor generates permanent, indexable score pages. Each scan creates a page that ranks in Google, compounds SEO authority, and generates inbound leads. This is achievable as a solo founder and defensible through first-mover advantage on the score URL pattern.

**Short-term — AI Crawler Analytics stickiness:** The AI Crawler Analytics middleware runs continuously on customer sites. Removing it means losing visibility into AI crawler activity. This creates ongoing engagement (daily/weekly check-ins) that a one-time diagnostic cannot match. The hidden backlink mechanic (free-tier `<link>` tag in `<head>`) compounds SEO authority for CrawlReady's score pages. See `docs/architecture/crawler-analytics.md`.

**Short-term — Agent readiness positioning:** No competitor measures agent readiness. The Agent Readiness Score positions CrawlReady in the $7.6B agentic AI market, not just the $1.5B GEO market. The agent readiness framing removes the ~15% citation ceiling — agent readiness has direct, measurable value independent of search citation algorithms. See `docs/research/agent-readiness.md`.

**Short-term — B2B2B monitoring partnerships:** $230M+ in funded monitoring tools — led by Profound ($155M, $1B valuation, 700+ enterprise customers) — that cannot fix what they find. CrawlReady as the "fix layer" creates a zero-CAC distribution channel. The more monitoring tools integrate with CrawlReady, the harder it is for competitors to displace. See `docs/research/monitoring-integration.md`.

**Short-term — CDN snippet switching costs:** Once a developer has added a Cloudflare Worker rule and tuned their optimization settings, removing it requires deliberate effort. Low friction to add, non-trivial to remove.

**Medium-term — Multi-format transformation intelligence (April 2026 multi-format review):** Dynamic Schema.org generation requires content understanding — extracting structured facts (Q&A patterns, pricing data, step-by-step instructions) from unstructured HTML and producing valid, attribute-rich JSON-LD. This is a content intelligence capability that commodity Markdown converters cannot replicate. Attribute-rich Schema.org achieves 61.7% citation rate vs. 41.6% for generic types (Growth Marshal, p = .012) — a ~15-20% citation factor that no competitor addresses. Multi-format serving (Markdown + enriched HTML + enhanced ARIA) adds a layer above the single-format output every competitor ships. See `docs/architecture/multi-format-serving.md`.

**Medium-term — Transparency trust + EU AI Act compliance:** The content parity diff engine and public `/crawlready-preview` endpoint build trust that proprietary competitors cannot match. EU AI Act Article 50 transparency rules take effect August 2, 2026. CrawlReady's architecture is already compliance-aligned — this becomes a defensible advantage as regulatory enforcement increases. See `docs/research/eu-ai-act-compliance.md`.

**Medium-term — Open-source community (Phase 2+, deferred):** An open-source transformation pipeline (AGPL licensed) creates contributor investment, public auditability, and adoption-driven switching costs. No competitor in the AI optimization space is open source. However, open-source community management requires significant bandwidth. Research shows: Plausible Analytics needed a 4-person team to reach $3.1M revenue with 99.9% from hosted service, not community; one open-source founder (OpenClaw) spends $10-20K/month with no monetization; AGPL creates corporate adoption friction. Defer to Phase 2 when there is a product worth contributing to.

**Medium-term — DNS proxy switching costs (Enterprise):** Customers on Level 3 (DNS proxy) face the same friction as switching away from Cloudflare. This is the highest-retention tier.

**Long-term — Vertical depth:** Purpose-built transformation templates for specific content types (developer docs, API references, SaaS landing pages) outperform generic pipelines. Each vertical mastered is expertise that generalist competitors cannot replicate without the same specialization effort.

**Long-term — Data moat (Phase 4):** Every optimized page generates signal about what content structures AI crawlers prefer and which formats get cited. At scale, this becomes a training dataset for the autonomous optimization model. Note: competitors (Mersel, MachineContext, Prerender.io) are also accumulating this data. The data moat only works at sufficient scale.

---

## Key Risks

1. **Direct competition already exists (17+ competitors, updated April 7, 2026 critical analysis):** MachineContext, Mersel AI, HypoText, Prerender.io, DualWeb.AI, GenRankEngine, iGEO, Clemelopy, MultiLipi, and Pure.md all ship active AI optimization or GEO tooling. Additionally, 6+ free diagnostic scanners (AI Crawler Check, AmICitable, AgentReady.tools, AgentReady.site, AI PeekABoo, agent-ready.org) compete directly with Phase 0, AgentReady.tools already ships an "AI Readiness Score" with paid tiers ($19-79/mo), npm middleware packages (`botversion`, `@chambrin/ai-crawler-guard`, `@agentmarkup/next`) occupy the developer channel, and MachineContext now offers Schema.org generation and edge-level crawler analytics. CrawlReady is not entering an empty market at any layer. Mitigation: differentiate on visual diff diagnostic (genuinely unique), permanent shareable score URLs (genuinely unique), compound distribution engine (npm + MCP + badge + GitHub Action — no competitor has multi-channel), attribute-rich Schema.org generation from CSR pages, and transparency architecture. Open-source deferred to Phase 2. See `docs/research/differentiation.md` and `docs/product/market.md`.

2. **Cloudflare has already built the infrastructure (UPDATED April 2026, multi-format review):** Cloudflare shipped "Markdown for Agents" in February 2026 — automatic HTML-to-Markdown conversion via `Accept: text/markdown` content negotiation at the edge. The risk is no longer "when will they build it" but "when will AI crawlers adopt the content negotiation header." As of April 2026, GPTBot and PerplexityBot do NOT send the header (only Claude Code and OpenCode do). When adoption occurs, every Cloudflare site gets generic Markdown serving for free. **However, Cloudflare does not generate Schema.org, does not serve multi-format content per AI client type, and does not offer scoring or diagnostics.** Mitigation: CrawlReady's value must be above the Markdown conversion layer — scoring, dynamic Schema.org generation, multi-format serving intelligence, transformation quality (purpose-built restructuring vs. generic conversion), vertical templates, transparency endpoint, content parity diff engine, and content negotiation support alongside UA detection. Ship as a Cloudflare Worker template (complementary, not competitive). See `docs/architecture/multi-format-serving.md`.

3. **Cloaking rule changes:** If AI providers explicitly classify format-only content switching as a policy violation, the core mechanic becomes a liability. Mitigation: the dynamic rendering precedent is strong; the transparency endpoint and content parity diff engine make CrawlReady the most defensible player if enforcement tightens; Level 1 (diagnostic only) has zero risk.

4. **JS rendering problem gets solved by AI companies:** If GPTBot, ClaudeBot, etc. add their own JS rendering capability (as Googlebot did), the invisibility problem disappears. Mitigation: format optimization (noise reduction, structure) remains valuable even if crawlers render JS. The optimization value is permanent; the invisibility hook is temporary.

5. **Format optimization is only ~15% of citations (revised upward with Schema generation):** With Markdown-only serving, CrawlReady addresses ~15-20% of citation factors. With dynamic Schema.org generation (Phase 1-2), this rises to ~30-35% — a substantial lever but still not the majority. Customers who expect citation guarantees from optimization alone will churn. Mitigation: honest marketing about what CrawlReady fixes (crawlability, format, structured data) vs. what it doesn't (authority, comprehensiveness). Phase 3 citation monitoring closes the feedback loop. See `docs/architecture/multi-format-serving.md` for revised citation data.

6. **Willingness to pay at self-serve price point:** $49/month may be too low to signal value or too high for a side-project-scale product. Mitigation: the free diagnostic lowers the trust bar; usage-based pricing scales naturally with value delivered. Mersel AI prices at $29-79/mo, validating the range.

7. **Solo founder bandwidth:** This is being built alongside a day job. Mitigation: the graduated onboarding model (diagnostic free → CDN snippet paid) means the product earns trust incrementally. Open-source approach leverages community contributions to extend the solo founder's reach.

---

## Decisions (Formerly Open Questions)

All business model questions have been researched and resolved. See `docs/decisions/open-questions.md` for full evidence and sources.

- **Pro pricing:** $49/mo is defensible. $29/mo Starter tier lowers the trial barrier. Fresh crawl limits reduced from original proposal (5K→500 Starter, 25K→2,500 Pro) to ensure positive unit economics against Firecrawl COGS. Validate actual costs during Phase 0 before committing.
- **Request limits:** Unlimited cached responses (negligible cost on Cloudflare Workers). Fresh crawl limits set to maintain positive margins at Firecrawl's $0.01-$0.05/page rate. Original limits (5K/25K/100K) were unsustainable.
- **Email gating:** Un-gate the headline score + shareable URL. Gate full PDF report, historical tracking, and "email me when score changes" behind email.
- **License:** AGPL for the transformation pipeline — but deferred to Phase 2. Phase 0-1 ships proprietary to maximize velocity. Community management overhead is incompatible with 15-20 hrs/week solo bandwidth. Open-source when there is a product worth contributing to.
- **Cloudflare distribution:** Cloudflare Apps marketplace deprecated (June 2025). Replaced with: Worker template on GitHub + integration guide (Phase 2).
- **Competitor count (updated April 7, 2026 critical analysis):** 17+ direct and adjacent competitors, not 8. Six additional free diagnostic scanners (AI Crawler Check, AmICitable, AgentReady.tools, AgentReady.site, AI PeekABoo, agent-ready.org), new npm package (@agentmarkup/next), and expanded capabilities from MachineContext (Schema.org generation + edge crawler analytics) discovered. The free scanner space is now crowded. See `docs/product/market.md` for full landscape.
