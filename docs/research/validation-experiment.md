# Research: Demand Validation Experiment

Design for validating CrawlReady demand by shipping a real, functional free diagnostic tool. The goal is to answer: "Do developers care enough about AI crawlability to use a free tool, share their scores, and express willingness to pay for a fix?"

---

## Why Ship Real, Not Mocked

The original plan was a mocked diagnostic with a waitlist. The revised distribution research (see `docs/research/distribution-strategy.md`) changes this:

- **The viral loop depends on real, shareable scores.** A mocked diagnostic cannot generate the public score URLs that drive the HubSpot Website Grader growth model.
- **Show HN demands a working product.** "Enter your URL and see what GPTBot sees" needs to actually work. Mocks get downvoted.
- **Pre-seeded score pages** require a real crawler. These pages are the content that drives the Show HN post and blog.

Building the real diagnostic takes ~3 weeks part-time instead of ~1 week for the mock, but the distribution potential is 10x higher.

---

## Honest Timeline Caveat

All timelines below assume 15–20 hrs/week of development time. "Week 1-3" is ~45–60 total hours of work. A working diagnostic with Next.js frontend, Firecrawl integration, scoring algorithm, side-by-side UI, score URL generation, and email capture is tight but achievable if scope is held to exactly these deliverables — nothing more.

Previous versions of this plan included npm package, badge endpoint, GitHub repo, GitHub Action, and MCP server in Phase 0. These have been moved to Phase 1+ to match solo founder bandwidth.

---

## Experiment Design

### Phase 0 — Build Diagnostic MVP (3 weeks to build)

**What to build (exactly 2 deliverables):**
1. A landing page at crawlready.app with one input field: "Enter your URL"
2. A working diagnostic that:
   - Crawls via **Firecrawl API** as (a) a browser and (b) GPTBot/ClaudeBot user-agents
   - Generates a side-by-side comparison with highlighted differences
   - Computes an AI Readiness Score (0–100, headline metric) from three sub-scores: Crawlability, Agent Readiness, Agent Interaction. See `docs/architecture/scoring-algorithm.md` and `docs/architecture/scoring-detail.md`.
   - Creates a **public, permanent score URL** (e.g., `crawlready.app/score/stripe.com`)
   - Shows CTA: "Fix this score" requires email (lead capture)
   - Un-gates headline score + shareable URL (no email required to see the score)

**Pre-seeding:** 20 popular developer tool sites with scores before launch (via Firecrawl batch job, ~$0.20–1.00 total). Enough for Show HN screenshots and a blog post.

**What Phase 0 does NOT include:**
- No npm package (Phase 1)
- No embeddable badge endpoint (Phase 1)
- No GitHub repo or open-source pipeline (Phase 2)
- No GitHub Action (Phase 2). MCP server and Docusaurus plugin are Phase 1 deliverables (moved forward from Phase 3).
- No paid tier, no CDN snippet, no Markdown serving
- No dashboard, no accounts (beyond email capture)
- No ongoing monitoring (one-time scan only)

**Tech stack:** Next.js frontend + API routes, **Firecrawl API** for crawling + HTML-to-Markdown extraction (eliminates infrastructure complexity), Supabase for score storage + email capture. Deploy on Vercel.

**Cost:** ~$20–50/mo (Vercel Pro for serverless functions, Firecrawl credits for crawling, Supabase free tier).

**Rate limiting:** IP-based: 3 scans per hour per IP without signup, 10 per hour with email. Per-site: 1 scan per 24h per URL. CAPTCHA only if abuse is detected (not by default).

### Phase 1 Expansion (if validated)

After Phase 0 hits must-have targets, add:
- Pre-seed 200 additional sites (expand SEO footprint)
- npm package (`crawlready`) with free-tier static analysis
- Embeddable badge SVG endpoint (`crawlready.app/badge/site.com.svg`)
- Cross-post blog to dev.to, Hashnode, Twitter/X, Reddit

### Distribution Plan (Phase 0 only)

**Week 3 — Write blog post:**
- Draft: "We scanned 20 SaaS sites — here's what ChatGPT actually sees" (uses pre-seeded scores as data)
- Include real screenshots, score comparisons, and link to free scanner

**Week 4 — Show HN:**
- Show HN post: "Show HN: CrawlReady — See what AI crawlers actually see on your site"
- Timing: Tuesday-Thursday, 9 AM-12 PM EST (need 30-50 upvotes in first hour for front page)
- Frame as "interesting technical insight + free tool" not sales
- Link to working tool
- Publish blog post same day or day after
- Be ready to answer technical questions in depth for 4-6 hours

**Week 5-6 — Monitor + assess:**
- Track visits, signups, and URLs entered
- Respond to HN/Twitter feedback
- Catalog objections and ICP signals

**That's it for Phase 0 distribution.** No Product Hunt, no Reddit, no dev.to cross-posts, no Discord/Slack communities. One channel, executed well.

---

## Success Metrics

### Must-hit targets (otherwise reconsider the project)

| Metric | Target | Measurement |
|---|---|---|
| Landing page visits (Weeks 4-6) | 500+ | Vercel Analytics or Plausible |
| Email signups | 50+ (10%+ conversion from visits) | Email capture count |
| Show HN upvotes | 30+ | HN front page = strong signal |
| Inbound "when is this available?" messages | 5+ | Email replies, Twitter DMs, HN comments |

### Strong signals (proceed aggressively to Phase 1)

| Metric | Target | Why it matters |
|---|---|---|
| Email signups | 200+ | High demand; accelerate build |
| "I'd pay for this" comments | 10+ | Willingness to pay validated |
| Users entering their own URLs | High engagement rate | The hook works |
| CSR SPA URLs entered | 30%+ of total scans | CSR-first ICP validated |

### Kill signals (stop or pivot)

| Metric | Threshold | Implication |
|---|---|---|
| Landing page visits after Show HN | <200 | The hook doesn't grab attention |
| Email signups | <20 | Not enough interest to sustain a product |
| Show HN | 0-5 upvotes, no comments | Developers don't find this novel |
| "MachineContext already does this" comments | Dominant response | Differentiation is insufficient |
| "Just use SSR" comments | Dominant response | ICP is wrong — the audience doesn't perceive this as a real problem |

---

## What to Learn From the Experiment

1. **Is the diagnostic hook compelling?** Do developers click through when they see "what GPTBot sees on your site"?
2. **Which ICP segment responds?** Track which URLs are entered — CSR SPAs vs. SSR sites vs. WordPress. This validates the ICP hypothesis. If CSR SPAs dominate, the CSR-first beachhead is confirmed.
3. **What objections surface?** HN comments will surface the real concerns (cloaking risk, "Cloudflare already does this," "just use SSR," "MachineContext does this," etc.).
4. **Is there willingness to pay?** Unprompted "what will this cost?" or "when can I pay?" are the strongest signals.
5. **What Firecrawl actually costs per scan?** Measure real COGS to calibrate pricing before committing to tier limits.

---

## Timeline

| Week | Activity | Output |
|---|---|---|
| Week 1-3 | Build diagnostic MVP + pre-seed 20 sites | Live at crawlready.app, 20 score pages |
| Week 3 | Write blog post | Post drafted, screenshots ready |
| Week 4 | Show HN launch + publish blog | Traffic spike + quality feedback |
| Week 5-6 | Monitor results, respond to feedback | Data on visits, signups, ICP segments |
| Week 7 | Go/no-go decision | Decision document |

**Total investment before go/no-go decision:** ~3 weeks of build time + 4 weeks of distribution/monitoring. If the experiment fails, total loss is 7 weeks of part-time effort and ~$50 in infrastructure costs. The score pages retain some SEO value regardless.

---

## After Validation: Build Sequence

If the experiment hits the must-hit targets:

1. **Weeks 7-10:** Pre-seed 200 sites, ship npm package, badge endpoint (Phase 1 distribution expansion)
2. **Weeks 11-14:** Build paid tier — CDN snippet optimization, Cloudflare Worker, Markdown serving
3. **Weeks 15-18:** Open-source the transformation pipeline (AGPL), GitHub Action
4. **Month 5+:** Citation monitoring (buy/partner via Otterly API or thin wrapper), Business tier

If the experiment hits kill signals:
- Analyze what went wrong (hook? ICP? differentiation? timing?)
- Consider pivoting to: (a) agency-only model (white-label the diagnostic), (b) different ICP (e-commerce instead of SaaS), or (c) shelving the product entirely
- The diagnostic and score pages retain value as a portfolio piece and SEO asset

---

## Decisions (Formerly Open Questions)

All validation experiment questions have been researched and resolved. See `docs/decisions/open-questions.md` for full evidence and sources.

- **Domain:** crawlready.app (secured).
- **Crawling infrastructure:** Use Firecrawl API for Phase 0–1 (no self-hosted Playwright). ~700MB–1.1GB RAM per Chromium instance makes self-hosting expensive; Firecrawl at ~$0.01–0.05/page is negligible. Build custom Playwright pipeline only for Phase 2.
- **Badge format:** Numeric score (85/100) with color coding (green/yellow/red). Offer letter-grade variant as an option. Aligns with Lighthouse/Codecov developer ecosystem norms. **Deferred to Phase 1.**
- **Abuse prevention:** IP-based rate limiting (3 scans/hr without signup, 10/hr with email). Per-site: 1 scan per 24h per URL. CAPTCHA only on abuse detection. Queue system for concurrent requests.
- **Phase 0 scope (revised April 2026):** Three deliverables — landing page + working diagnostic + analytics onboarding with ingest. Pre-seed 20 sites, not 200. Show HN as sole launch channel. Auth split: Clerk for site registration, email capture for diagnostic gating, Supabase as DB only. See `docs/product/vision.md` for canonical scope.
- **Honest timeline:** 3 weeks part-time to build the diagnostic MVP, not 2. Budget for reality, not optimism.

---

## Pre-Build Checklist (April 7, 2026 Critical Analysis Addition)

Complete these items **before writing any code** for Phase 0:

### 1. Validate Firecrawl Costs (Day 1-2)
Run 100 test crawls on Firecrawl across diverse site types to establish actual per-page cost:
- 25 CSR SPAs (React, Vue, Angular without SSR)
- 25 SSR sites (Next.js, Nuxt, Remix)
- 25 documentation sites (Docusaurus, ReadTheDocs, GitBook)
- 25 SaaS marketing sites (mixed rendering)

Record: time per crawl, cost per crawl, HTML size, Markdown size, failure rate. If average cost exceeds $0.02/page, revise crawl limits or pricing before building.

### 2. Reserve npm Names (Day 1)
All names confirmed available as of April 7, 2026 (404 on npm registry):
- [ ] `npm login` (authenticate with npm)
- [ ] Create npm org `@crawlready` (`npm org create crawlready`)
- [ ] Publish placeholder `crawlready` package (empty package with README pointing to crawlready.app)
- [ ] Publish placeholder `@crawlready/cli`
- [ ] Publish placeholder `@crawlready/docusaurus`

### 3. Create GitHub Org (Day 1)
- [ ] Create `crawlready` org on GitHub (if not already done)
- [ ] Create initial repo `crawlready/crawlready` (private until launch)

### 4. Initialize Git Repo (Day 1)
- [ ] `git init` in workspace
- [ ] Add `.gitignore` for Next.js
- [ ] Initial commit with all docs (research phase complete)
