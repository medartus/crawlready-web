# Research: Distribution Strategy & Market Opportunities

Deep research on distribution channels, growth mechanics, and untapped market opportunities for CrawlReady. Compiled April 2026 from web research, competitor analysis, and case study extraction. **Revised April 2026 to reflect solo founder bandwidth constraints.**

---

## Solo Founder Constraint (Critical)

This document identifies 12 distribution channels. **Attempting all 12 simultaneously is a 6-person team's plan, not a solo developer's plan at 15–20 hrs/week.**

The revised approach: Phase 0 uses **one channel** (Show HN + the score URLs that are built into the diagnostic itself). Additional channels are added **one at a time** in subsequent phases, gated on validation metrics and available bandwidth. The channel analysis below remains valid as a menu of options — but the execution sequence is strictly serialized.

---

## Executive Summary

The current acquisition strategy identifies **12 distinct distribution channels**, ranked by effort-to-impact ratio, with specific implementation plans for each. However, only 2 are Phase 0 deliverables — the rest are gated on validation.

The single highest-impact insight: **CrawlReady's free diagnostic should follow the HubSpot Website Grader playbook** — a free scoring tool that generated 2M+ leads, 20,000 monthly visitors, and 1,500 monthly leads for HubSpot by giving public, shareable score URLs. This is not a minor feature; it should be the primary growth engine. The good news: score URLs are built into the diagnostic automatically — they don't require separate development.

---

## Distribution Channel Rankings

| Rank | Channel | Effort | Time to Impact | Potential Scale | Phase |
|---|---|---|---|---|---|
| 1 | Public Shareable Score URLs (HubSpot model) | Low | Immediate | Very High | **Phase 0** (built into diagnostic) |
| 2 | Show HN launch | Low | 1 week | High spike | **Phase 0** |
| 3 | One blog post (data-driven) | Low | 1 week to write | Very High if it lands | **Phase 0** (supports Show HN) |
| 4 | npm middleware package | Medium | 2-3 weeks | High (ongoing) | Phase 1 |
| 5 | Embeddable score badge/widget | Low | 1 week | High (viral) | Phase 1 |
| 6 | Cross-post to dev.to / Twitter / Reddit | Low | 1 day each | Medium | Phase 1 |
| 7 | Open-source GitHub repo (AGPL) | Medium | 2-3 weeks | High (ongoing) | Phase 2 |
| 8 | GitHub Action (CI/CD) | Medium | 2 weeks | High (ongoing) | Phase 2 |
| 9 | Cloudflare Worker template + integration guide | Low | 1-2 weeks | Medium | Phase 2 |
| 10 | Docusaurus plugin (vertical wedge) | Medium | 2-3 weeks | Medium | **Phase 1** (moved forward) |
| 11 | MCP server | Medium | 1-2 weeks | High (ongoing) | **Phase 1** (moved forward) |
| 12 | Agency white-label channel | High | 1-2 months | High (revenue) | Phase 3 |
| 13 | **AI Crawler Analytics middleware** | Low | 1-2 weeks | **Very High** (sticky) | **Phase 0/1** (VP innovation addition) |
| 14 | **Hidden backlink growth engine** | Low | 1 day | **High** (compounding) | **Phase 0/1** (VP innovation addition) |
| — | Vercel marketplace integration | High | 3-4 weeks | Medium | Phase 3+ |
| — | Framework ecosystem (Nuxt, Remix, Astro) | High | Ongoing | Medium | Phase 3+ |

---

## Channel 1: Public Shareable Score URLs (The Growth Engine)

### The HubSpot Website Grader Playbook

HubSpot launched Website Grader in 2007 — a free tool that scored websites on a 0–100 scale. Results:
- 2M+ URLs graded, 2M+ leads generated
- 20,000 people per month found HubSpot via the tool
- 1,500 HubSpot leads per month
- 400 new email subscribers per month
- Helped power HubSpot's growth to a $25B+ company

**The mechanic that made it viral:** Every score result had a **unique, public, shareable URL** (e.g., `websitegrader.com/results/stripe.com`). People shared their scores. Companies compared scores. Blog posts embedded score URLs. Each shared URL was an indexable page that ranked in Google.

### How CrawlReady Implements This

Every crawlability diagnostic generates a permanent, public URL:
```
crawlready.app/score/stripe.com
crawlready.app/score/vercel.com
crawlready.app/score/linear.app
```

Each URL is:
- **Publicly accessible** — no login required to view
- **Shareable** — developers share their score (or competitors' scores) on Twitter, HN, Reddit
- **Indexable** — Google crawls and ranks each score page for "[company] AI crawlability" queries
- **Embeddable** — can be linked from blog posts, docs, and README files
- **Lead-generating** — "Get your full report" or "Fix this score" requires email

### The Viral Loop

```
Developer scans their site → sees score → shares on Twitter/Slack
→ colleagues scan their sites → share theirs
→ blog posts compare scores across companies
→ each score page ranks in Google → new visitors scan → loop continues
```

### Pre-Seeding Strategy

Before launch, pre-generate scores for well-known developer tool sites (20 for Phase 0, expanding to 200+ in Phase 1):
- stripe.com, vercel.com, linear.app, supabase.com, clerk.dev, resend.com
- Popular open-source project sites (React, Vue, Svelte homepages)
- Direct CrawlReady competitors (machinecontext.ai, hypotext.dev)

This creates immediate content for blog posts, HN discussions, and social sharing: "We scanned 200 popular developer tool sites — here's how they score for AI crawlers."

### Why This Works Better Than Competitors

MachineContext has a URL test tool (`machinecontext.ai/any-url`) but the results are **ephemeral** — there's no permanent, shareable, indexable URL. CrawlReady's public score pages are a structural distribution advantage that MachineContext can copy but hasn't built.

---

## Channel 2: Show HN Launch

### Optimized Tactics (from research)

**Timing:** Tuesday–Thursday, 9 AM–12 PM EST. The first 60 minutes are critical — need 30-50 upvotes in that window.

**Headline formula:** `Show HN: CrawlReady – See what AI crawlers actually see on your site (free tool)`

**Post structure:**
1. Who you are (solo developer, side project)
2. The problem in one sentence ("GPTBot doesn't execute JavaScript — most JS sites are invisible to AI search")
3. The interesting technical insight (side-by-side rendering comparison)
4. What makes this different (free diagnostic, transparency endpoint, content parity proof)
5. Invite feedback, not sales

**Expected impact (based on research data):**
- Front page = 5,000–15,000 visits
- 3–8% signup rate from developer tools = 150–1,200 signups
- Plausible Analytics: HN was 43.6K of their top referral traffic

**Key rule:** Give people a free, easy way to try it. No signup required for the basic scan. Email required for full report + monitoring.

---

## Channel 3: npm Middleware Package

### The Landscape (Updated April 2026)

The npm space is no longer uncontested. Several early packages exist:

- **`botversion`** (v0.2.0, March 2026) — Next.js middleware, auto-detects 30+ AI crawlers, two rendering modes (Auto-Detect and AI-Native). First mover but Next.js only.
- **`@chambrin/ai-crawler-guard`** (v0.1.0, March 2026) — framework-agnostic TypeScript, supports Next.js/Express/Hono/Nuxt. Focused on blocking/redirecting rather than optimization.
- **`seo-middleware-nextjs`** — routes bot traffic to pre-rendering engines. Traditional SEO approach.

All are very early-stage (v0.x) with limited documentation and adoption. None offer transformation quality, content negotiation support, or connection to a hosted optimization platform.

**Framework signal:** Next.js 16.2 (March 2026) shipped AI-focused features (AGENTS.md, Agent DevTools, agent-ready scaffolding). This validates the market but may absorb some basic middleware functionality over time.

### CrawlReady's npm Differentiation

CrawlReady's npm package must offer more than UA detection (which existing packages already do). The differentiators:

1. **Transformation quality** — not just detect bots, but serve purpose-built Markdown via the hosted pipeline
2. **Content negotiation support** — respond to `Accept: text/markdown` headers in addition to UA detection
3. **Free local mode** — static analysis and crawlability scoring without API key (open-source core)
4. **Multi-framework from day one** — Next.js, Express, Hono, Nuxt, Cloudflare Workers

```bash
npm install crawlready
```

```typescript
// middleware.ts (Next.js)
import { withCrawlReady } from 'crawlready/next';
export default withCrawlReady({ apiKey: 'cr_...' });
```

```typescript
// server.ts (Express/Hono)
import { crawlready } from 'crawlready';
app.use(crawlready({ apiKey: 'cr_...' }));
```

### Why This Still Matters

- npm is the #1 discovery channel for JavaScript developers
- `npm install` is lower friction than "add a Cloudflare Worker snippet"
- The package appears in `package.json` — visible to the whole team, not just the person who added the CDN rule
- Weekly download counts are public social proof
- Auto-discovery through npm search for "AI crawler," "GPTBot," "AI SEO"
- Existing packages validate the channel but none offer the full optimization pipeline

### What the Package Does

**Free tier (no API key):** Static analysis only — detect AI crawlers, log which bots visit, report crawlability issues to console. Respond to `Accept: text/markdown` with basic HTML-to-Markdown conversion.

**Paid tier (with API key):** Route AI crawler requests to CrawlReady's cached Markdown, diff engine, analytics dashboard. Purpose-built transformation with vertical templates.

This is the open-source core in action: the npm package IS the open-source pipeline. The hosted SaaS is the backend it connects to.

---

## Channel 4: Embeddable Score Badge/Widget

### The Mechanic

Offer an embeddable badge that sites can add to their README, docs, or footer:

```markdown
[![AI Crawlability Score](https://crawlready.app/badge/stripe.com.svg)](https://crawlready.app/score/stripe.com)
```

Renders as: `[AI Crawlability: 85/100]` with CrawlReady branding and a link back.

### Why This Works

- **GitHub README badges** are a proven distribution channel (Codecov, SonarCloud, DeepSource all use this)
- Every badge is a **backlink** to crawlready.app — compounds SEO authority
- Badges update automatically — the score refreshes on a schedule
- Developers already understand and adopt README badges
- Companies with good scores will **want** to display them (social proof)

### Variants

1. **GitHub README badge** (SVG, like shields.io format)
2. **Website footer badge** (small HTML embed, like Foglift's widget)
3. **Full embedded scanner widget** (iframe, like Foglift's scan embed — visitors enter their own URL and get scored, leads flow to CrawlReady)

### Prior Art

- **Foglift** already offers an embeddable scan widget for agencies (iframe + JS embed, with referral tracking)
- **AgentRank** offers embeddable badges for GitHub READMEs with daily score updates
- **ReviewAI** uses embeddable badges as backlink generators
- **SonarCloud** badges on GitHub repos drove massive developer adoption

---

## Channel 5: GitHub Action (CI/CD Integration)

### The Concept

A GitHub Action that runs AI crawlability checks as part of CI/CD:

```yaml
# .github/workflows/crawlready.yml
name: AI Crawlability Check
on: [push]
jobs:
  crawlability:
    runs-on: ubuntu-latest
    steps:
      - uses: crawlready/check@v1
        with:
          url: 'https://staging.mysite.com'
          threshold: 70
```

The action:
- Scans the deployed staging/preview URL
- Reports the AI Crawlability Score
- Fails the build if score drops below threshold
- Posts a comment on the PR with the score diff

### Why This Matters

- GitHub Actions marketplace has 20,000+ actions — developers actively browse it
- Fits naturally into existing developer workflows
- Creates a **habit loop** — every PR shows the score, keeping CrawlReady visible
- PR comments with scores are seen by the entire team — word-of-mouth within organizations
- Publishing to the Actions marketplace requires no approval process (immediate listing)

### Prior Art

Lighthouse CI, Codecov, and SonarCloud all use this pattern to embed themselves into developer workflows. Lighthouse CI in particular runs on every PR and posts score comments — the exact mechanic CrawlReady should replicate for AI crawlability.

---

## Channel 6: One Viral Blog Post (Plausible Model)

### The Lesson from Plausible

Plausible Analytics published one blog post — "Why you should stop using Google Analytics on your website" — that attracted 50,000 readers in days, generated 166 new trials in the first week (more than the prior 4 months combined), and drove 180,000+ visitors (2,200% increase).

**What made it work:** It was not about the product. It was a strong opinion about a universal problem. The product was the solution mentioned at the end.

### CrawlReady's Equivalent

Title candidates (pick one):
- **"We scanned 200 popular SaaS sites — 73% are invisible to ChatGPT"**
- **"Your Next.js site ranks #1 on Google but doesn't exist in ChatGPT. Here's why."**
- **"The AI search tax: what your site looks like to GPTBot (and why it matters)"**

Structure:
1. Open with the striking data point (scan results from pre-seeded score pages)
2. Show real side-by-side screenshots of popular sites (browser vs. GPTBot view)
3. Explain the technical reason (JS rendering, noise ratio) without selling
4. Link to the free scanner so readers can check their own site
5. Mention CrawlReady as one solution — not the only mention, and not a sales pitch

### Distribution Path

Publish on: the CrawlReady blog (for SEO), then cross-post to dev.to and Hashnode (for reach). Submit to Hacker News as a blog post (not Show HN — different post, different day). Share on Twitter/X with the most striking screenshot.

---

## Channel 7: Docusaurus Plugin (Vertical Wedge)

### Why Docusaurus

- **4x more popular** than ReadTheDocs (3.3% vs 0.9% of static site generators)
- Used by React Router, Redux, Jest, Babel, and hundreds of developer tool projects
- Docusaurus sites are static (SSG) but often have heavy JS (client-side search, interactive components)
- The developer docs vertical is the ideal first wedge for CrawlReady

### What the Plugin Does

```bash
npm install @crawlready/docusaurus
```

```javascript
// docusaurus.config.js
plugins: ['@crawlready/docusaurus']
```

The plugin:
- Auto-generates AI-optimized versions of every docs page
- Adds structured Markdown metadata (code examples, parameter tables, API endpoints)
- Exposes an `/ai/` prefix route that serves the optimized versions
- Reports crawlability score in the Docusaurus build output
- Optional: connects to CrawlReady hosted service for analytics and monitoring

### Distribution

- Submit to Docusaurus's community plugins directory
- Blog post: "Making your Docusaurus docs visible to AI search in 5 minutes"
- GitHub repo with good README → appears in npm search for "docusaurus AI"

### Expansion Path

After Docusaurus: Mintlify integration (Mintlify already auto-generates llms.txt — CrawlReady offers the actual optimization layer), GitBook plugin, ReadTheDocs extension, Astro integration.

---

## Channel 8: Cloudflare Worker Template + Integration Guide

### Why Not the Cloudflare Apps Marketplace

Cloudflare Apps has been deprecated (June 2025 docs PR removed references, community forum discusses sunsetting, support URLs redirect to generic Workers marketing). There is no replacement "Workers App Store" with public revenue split and approval process. Workers for Platforms targets ISVs building multi-tenant platforms, not a consumer marketplace.

### What to Ship Instead

**A public Cloudflare Worker template on GitHub** — discoverable, forkable, and immediately usable:

1. **GitHub repo:** `crawlready/cloudflare-worker` — a ready-to-deploy Worker that detects AI crawlers (UA + IP range verification) and routes to CrawlReady's hosted Markdown cache
2. **Integration guide:** Step-by-step docs for adding CrawlReady to an existing Cloudflare Workers setup
3. **Content play:** Target the Cloudflare developer blog for a guest post or case study on AI crawler optimization with Workers

### Implementation

The Worker template:
1. Detects AI crawlers (user-agent + published IP range verification per vendor)
2. Routes to CrawlReady's hosted Markdown cache
3. Passes through human traffic transparently
4. Reports analytics to the CrawlReady dashboard

Installation: `wrangler deploy` from the template repo. Config: set `CRAWLREADY_API_KEY` environment variable.

### Distribution Value

- Cloudflare Workers developers discover the template via GitHub search and CrawlReady docs
- The template repo becomes a backlink and SEO asset
- Lower effort than a marketplace submission (no approval process)
- Not locked into a deprecated platform

---

## Channel 9: MCP Server (Moved to Phase 1)

**Timeline update (April 2026 innovation review):** Moved from Phase 3 to Phase 1. The MCP ecosystem has grown to 14,000–25,000+ servers with 97M monthly SDK downloads. Early entrants get discovery advantage. 1–2 weeks of development effort for massive distribution potential.

### The Opportunity

56% of new MCP servers target developers. As of April 2026, the MCP ecosystem has exploded: 14,000–25,000+ servers cataloged, 97M monthly SDK downloads, MCP donated to Linux Foundation's Agentic AI Foundation. CrawlReady as an MCP server means developers can:
- Query their AI crawlability score + agent readiness score from their IDE (Cursor, VS Code + Copilot)
- Get optimization recommendations as they write code
- Check what AI crawlers see on any URL without leaving their editor
- No GEO/AI optimization company has shipped an MCP server — first-mover advantage

### Distribution

- Publish to the GitHub MCP Registry (2,000+ verified entries)
- List on Smithery, mcpserverdirectory.org, mcpservers.org
- Discoverable from within Cursor, VS Code, and other AI-assisted IDEs
- Each IDE discovery is a high-intent touchpoint leading back to crawlready.app

### What the MCP Server Exposes

```
Tool: crawlready_scan — Scan a URL and return AI Crawlability Score + Agent Readiness Score + summary
Tool: crawlready_diff — Show what AI crawlers see vs. browser view with highlighted missing sections
Tool: crawlready_recommend — Get prioritized, actionable optimization recommendations for a page
Resource: crawlready://score/{domain} — Read the current cached score for a domain
```

See `docs/product/vision.md` for the full MCP Server Design specification.

---

## Channel 10: Agency White-Label Channel

### The Market Reality

- **Fewer than 5% of agencies** currently offer GEO services (Foglift research, 2026)
- **73% of marketing leaders** plan to allocate dedicated budget to AI search optimization within 12 months
- Existing white-label platforms: GrackerAI (50+ agency partners, $2,500/mo retainers), Geordy (30% average margins), GeoCentrix ($2K-$10K MRR per client)

### CrawlReady's Agency Opportunity

These existing platforms (GrackerAI, Geordy, GeoCentrix) are **monitoring** dashboards. They tell agencies how visible their clients are in AI answers. They do not **fix** the problem.

CrawlReady can offer agencies the **optimization** layer — white-labeled:
- Agency brands the crawlability diagnostic and shares it with clients
- Client sees low score → agency upsells CrawlReady-powered optimization
- Agency charges $500-2,500/mo per client; pays CrawlReady $49-199/mo per client
- Agency margins: 75-90% (much higher than GrackerAI's 30-50% because CrawlReady is infrastructure, not service)

### Implementation (Phase 2)

- White-label dashboard with agency branding
- Embeddable scan widget with referral tracking (like Foglift's embed model)
- API access for agency workflow integration
- Branded PDF reports

### Why This Is Phase 2

Building white-label features before PMF is premature. But having the embeddable widget (Channel 4) from day one means agencies can start using CrawlReady organically, and the white-label features can be built when agency demand is validated.

---

## Channel 11: Vercel Marketplace Integration

### The Opportunity

Vercel's partner program states "one in two sales and project delivery at Vercel is done in collaboration with partners." They offer:
- Partner Fund for referral earnings
- Dedicated Partner Managers
- Learning portal with sales decks and technical guides
- Monthly Technical Excellence sessions

### Implementation

A native Vercel integration that:
1. Auto-detects AI crawler traffic on Vercel-deployed sites
2. Adds Edge Middleware that routes AI bots to CrawlReady
3. Reports AI crawlability score in the Vercel dashboard
4. One-click enable from the Vercel integrations page

### Why Phase 2

Vercel requires a Pro plan team and marketplace provider approval. The integration effort is medium-high. Best to pursue after PMF is validated and the product is stable.

---

## Channel 12: Framework Ecosystem Packages

### Beyond Next.js

- **Nuxt:** `nuxt-ai-ready` already exists but requires a paid license and focuses on llms.txt. A free, open-source CrawlReady Nuxt module would compete directly.
- **Remix:** No AI crawler optimization packages exist. First-mover opportunity.
- **Astro:** Growing fast for content sites. No AI optimization packages.
- **SvelteKit:** Same gap.

### The npm Ecosystem Play

Every framework package is:
- A new discovery surface in npm search
- A new GitHub repo that links to CrawlReady
- A new community to engage (Nuxt Discord, Remix Discord, Astro Discord)
- A deeper integration than a generic CDN snippet

---

## Channel 13: AI Crawler Analytics Middleware (VP Innovation Addition — April 2026)

### The Opportunity

No developer tool for JavaScript-stack sites (React, Next.js, Express) shows which AI crawlers visit, how often, and what pages they crawl. MAIO exists for WordPress; nothing exists for the developer ICP. CrawlReady ships ultra-light middleware snippets (3-5 lines, copy-paste, no npm install) that detect AI crawler visits server-side and report to a dashboard.

### Why This Is a Distribution Channel

Unlike the one-time diagnostic, the analytics middleware runs continuously. It generates daily engagement ("who crawled me today?"), creates a natural upsell path ("GPTBot visited /pricing 89 times but received an empty `<div>`"), and produces aggregate market intelligence across all customers.

**Effort:** Low — 8-10 days total (ingest API + 4 framework snippets + dashboard)
**Time to Impact:** 1-2 weeks
**Scale:** Very High — stickiest free tool CrawlReady can build
**Phase:** Phase 0 (ingest API) + Phase 1 (dashboard + snippets)

See `docs/architecture/crawler-analytics.md` for the full feature specification.

---

## Channel 14: Hidden Backlink Growth Engine (VP Innovation Addition — April 2026)

### The Mechanic

The AI Crawler Analytics middleware injects a hidden `<link rel="ai-analytics" href="https://crawlready.app/score/{domain}">` tag in the HTML `<head>` of every page for free-tier users. This tag is invisible to human visitors but discoverable by all crawlers (Google, AI crawlers). Paid tiers can remove it.

### Why This Is a Distribution Channel

Every free user's site becomes a backlink source for CrawlReady's score pages. 500 free users = thousands of crawlable `<link>` tags across all their pages, all pointing to `crawlready.app/score/*`. Googlebot indexes these links and builds domain authority for the exact pages that generate new users. This is a self-reinforcing SEO compounding loop.

An opt-in visible badge ("AI Score: 72/100" — unbranded or branded) is available for users who want to display their score, but is never auto-injected.

**Effort:** Low — 1 day (meta tag injection is part of the middleware)
**Time to Impact:** 1-3 months (SEO compounding takes time)
**Scale:** High — compounds with every new free user
**Phase:** Phase 0/1

---

## Compound Distribution Model

The channels above are not independent — they compound:

```
npm package → appears in package.json → team discovers it
→ GitHub Action → runs on every PR → score visible to team
→ Embeddable badge → appears in README → visitors click through
→ Public score URL → shared on Twitter → more people scan
→ Blog post → drives HN traffic → spikes signups
→ Docusaurus plugin → adopted by open-source projects → badge in README → loop
→ Cloudflare Worker template → discovered by Workers users → deploys
→ MCP server → discoverable from IDE → developers scan from editor
→ Agency embed widget → client sites surface CrawlReady → leads
→ AI Crawler Analytics middleware → daily engagement → upsell to paid
→ Hidden backlink → SEO compounding → more organic discovery → more free users
```

Each channel feeds the others. The public score URL is the hub — every other channel drives traffic to it or links from it.

---

## Competitive Distribution Gaps

| Channel | MachineContext | Mersel | HypoText | Prerender | npm packages | **CrawlReady** |
|---|---|---|---|---|---|---|
| Public shareable scores | No | No | No | No | No | **Planned** |
| npm package | No | No | No | No | Yes (basic) | **Planned (full pipeline)** |
| Embeddable badge | No | No | No | No | No | **Planned** |
| GitHub Action | No | No | No | No | No | **Planned** |
| Show HN (free tool framing) | No (proprietary) | No | No | No | No | **Planned** |
| Docusaurus plugin | No | No | No | No | No | **Planned** |
| Cloudflare Worker template | No | Partial | No | No | No | **Planned** |
| MCP server | No | No | No | No | No | **Planned** |
| Content negotiation support | No | No | No | No | No | **Planned** |
| Agency white-label | No | Yes (managed) | No | No | No | **Phase 2** |
| AI Crawler Analytics | No | No | No | No | No | **Planned (Phase 0/1)** |
| Hidden backlink engine | No | No | No | No | No | **Planned (Phase 0/1)** |

**Updated assessment (April 2026):** The npm channel is no longer uncontested — `botversion` and `@chambrin/ai-crawler-guard` exist as early entrants. However, no competitor has built a multi-channel distribution engine. They rely on direct marketing and paid search. CrawlReady's developer-first approach enables distribution channels that proprietary SaaS cannot access. The npm differentiation must come from transformation quality and hosted platform integration, not basic UA detection.

**Solo founder reality check:** While no competitor has built all these channels, attempting them all at once is counterproductive. The advantage is in serial execution — each channel builds on the previous one's signal. Phase 0 validates the hook. Phase 1 expands reach. Phase 2 opens the developer ecosystem. Phase 3 adds platform distribution. This ordering is strict.

---

## Revised Launch Sequence (Bandwidth-Constrained)

The original launch sequence attempted to ship 10+ deliverables across 5 channels in 8 weeks. At 15–20 hrs/week, this is unrealistic. The revised sequence serializes execution and gates each expansion on validation data.

### Phase 0 — Build + Launch (Weeks 1-6)

- **Weeks 1-3:** Build landing page + working diagnostic (Firecrawl API). Pre-seed 20 sites.
- **Week 3:** Write blog post: "We scanned 20 SaaS sites — here's what ChatGPT actually sees"
- **Week 4:** Show HN launch (Tuesday-Thursday, 9AM-12PM EST). Blog post published same day or day after.
- **Weeks 5-6:** Monitor results. Respond to HN comments. Track visits, signups, and feedback.
- **Week 7:** Go/no-go decision based on kill gate metrics.

**Phase 0 deliverables:** Landing page, diagnostic, 20 pre-seeded score pages, blog post, Show HN post, AI Crawler Analytics ingest endpoint (`/api/v1/ingest`). The ingest endpoint ships alongside the diagnostic — it's a single API route.

### Phase 1 — Expand Distribution (Weeks 7-16, if validated)

Add channels **one at a time**, based on Phase 0 data:

- **Week 7-8:** Pre-seed 200 additional sites (expand SEO footprint). Ship AI Crawler Analytics dashboard + middleware snippets for Next.js, Express, Cloudflare Workers, Vercel Edge. See `docs/architecture/crawler-analytics.md`.
- **Week 9-10:** Ship npm package with free-tier static analysis
- **Week 11-12:** Ship MCP server (`crawlready-mcp`) — 3 tools: `crawlready_scan`, `crawlready_diff`, `crawlready_recommend`. Publish to GitHub MCP Registry, Smithery, and other directories. Puts CrawlReady inside developer IDEs (Cursor, VS Code). See `docs/product/vision.md` for MCP Server Design.
- **Week 13-14:** Embeddable badge SVG endpoint + Docusaurus plugin MVP (vertical wedge for API documentation sites)
- **Week 15-16:** Cross-post to dev.to, Hashnode, Twitter/X, Reddit (educational framing)

### Phase 2 — Developer Distribution (Months 4-6, if Phase 1 converted)

- Open-source GitHub repo (AGPL licensed transformation pipeline)
- GitHub Action for CI/CD crawlability checks
- Cloudflare Worker template repo
- Product Hunt launch

### Phase 3 — Platform + Vertical Channels (Months 8-12)

- Agency white-label channel
- Vercel marketplace integration
- Framework ecosystem packages (Nuxt, Remix, Astro)

Note: MCP server and Docusaurus plugin were moved forward to Phase 1 (see Phase 1 section above).

---

## Key Metrics to Track Per Channel

| Channel | Primary Metric | Secondary Metric |
|---|---|---|
| Public score URLs | Unique score pages shared | Backlinks generated |
| Show HN | Upvotes + signups in 24 hours | Quality of HN comments |
| npm package | Weekly downloads | GitHub stars |
| Embeddable badge | Badges deployed (tracked via SVG requests) | Backlinks generated |
| GitHub Action | Marketplace installs | PRs with score comments |
| Blog post | Pageviews + time on page | Signups from post |
| Docusaurus plugin | npm downloads | Sites using plugin |
| Cloudflare Worker template | GitHub stars + forks | Active deployments |
| MCP server | Registry listings + installs | Scans from IDE |
| Agency channel | Partners onboarded | Client revenue per partner |
| AI Crawler Analytics | Middleware installs (site keys issued) | Daily active users on dashboard |
| Hidden backlinks | Free-tier sites with meta tag | Googlebot-indexed backlinks to score pages |

---

## Decisions (Formerly Open Questions)

All distribution questions have been researched and resolved. See `docs/decisions/open-questions.md` for full evidence and sources.

- **Score page generation:** On-demand with aggressive caching (24h TTL). Pre-seed 20 sites for Phase 0 launch, 200 in Phase 1.
- **Email gating:** Un-gate the headline score + shareable URL. Gate full PDF report, historical tracking, and "email me when score changes" behind email.
- **npm package API key:** Free/local mode works without API key (CLI output only). API key required for hosted features (edge proxy, dashboard, analytics). **Deferred to Phase 1.**
- **Pre-seeded pages:** 20 for Phase 0 (enough for Show HN screenshots and blog post). 200 in Phase 1. 500+ in Phase 2. Quality over quantity — each page needs real score breakdown and recommendations.
- **Blog post style:** Data-first with a sharp thesis. Title: "We scanned 20 SaaS sites — here's what ChatGPT actually sees." Published same day or day after Show HN.
- **Cloudflare distribution:** Worker template on GitHub + integration guide (Cloudflare Apps marketplace deprecated June 2025). **Deferred to Phase 2.**
- **Solo founder constraint (April 2026):** 12 channels is a 6-person plan. Phase 0 uses Show HN only. Each subsequent channel added one at a time, gated on validation data and bandwidth.
