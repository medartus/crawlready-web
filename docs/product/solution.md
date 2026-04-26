# Solution

CrawlReady intercepts requests from known AI crawlers and serves them a structured, machine-readable version of the page — while leaving the human-facing site completely untouched.

---

## Core Mechanic

When a request arrives at a CrawlReady-protected domain:

1. **Detect visitor type** via two complementary mechanisms (see below)
2. **Route accordingly:**
   - **Human visitor** → pass request through to origin server unchanged
   - **Known AI crawler** → serve a pre-generated, clean Markdown/semantic HTML version of the same page
3. **Content parity is enforced** — the AI version contains the same information as the human version, restructured for machine extraction (no marketing fluff, no JS-dependent content, no navigation noise)

### Detection Mechanisms (Dual Approach)

CrawlReady supports two detection mechanisms simultaneously:

**Mechanism 1 — User-Agent + IP Verification (works today):**
Inspect the User-Agent and verify against published IP ranges using a per-vendor matrix (see AI Crawler Verification Matrix below). This is the primary mechanism because no major AI search crawler sends content negotiation headers yet.

**Mechanism 2 — Content Negotiation via `Accept: text/markdown` (future-proof):**
Cloudflare shipped "Markdown for Agents" in February 2026, establishing `Accept: text/markdown` as a standard for AI clients to request Markdown content. As of April 2026, only coding agents (Claude Code, OpenCode) send this header — GPTBot and PerplexityBot do not. When AI search crawlers adopt this header, CrawlReady will serve Markdown to any client that requests it, regardless of User-Agent identity.

Content negotiation bypasses the need for UA/IP verification entirely — if a client explicitly asks for Markdown via HTTP headers, serve it. This is the standards-compliant path and eliminates false-positive/false-negative detection issues.

**Why support both:** UA detection is necessary today (bots don't send the header). Content negotiation is the standards-compliant future. Supporting both positions CrawlReady ahead of competitors who only do UA detection AND ahead of Cloudflare's generic conversion (which lacks transformation quality, scoring, and diff engine).

---

## Onboarding — Three Levels

CrawlReady offers three integration levels. Customers start at Level 1 (zero friction, free) and upgrade as they see value. DNS control is the final step, not the first.

### Level 1 — AI Crawlability Diagnostic (Free, Zero Friction)

**What it is:** A free tool where anyone enters a URL and instantly sees a side-by-side comparison of what their page looks like in a browser vs. what GPTBot, ClaudeBot, and PerplexityBot actually receive.

**How to set up:** Enter a URL. No signup required for the initial scan.

**What it delivers:**

- Side-by-side rendering: browser vs. each major AI crawler's view
- Highlights invisible content: "These 4 sections are rendered by JavaScript and never seen by AI crawlers"
- **Crawlability Score** (0–100) per page with specific gaps identified
- **Agent Readiness Score** (0–100) per page measuring how well AI agents can act on the content (see Agent Readiness section below)
- Actionable fix list: what to change for each crawler
- Optional llms.txt generation (minor feature, not the headline — see note below)

**The "aha" moment:** A developer enters their URL and sees their marketing hero section, product features, and pricing table all missing from the AI crawler view. The problem becomes viscerally real.

**Risk:** Zero. Purely diagnostic. No DNS change, no traffic routing, no proxy.

**Note on llms.txt:** CrawlReady can generate an llms.txt file as a secondary output, but this is not the core value. As of April 2026, no major AI engine (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews) uses llms.txt as a ranking or citation signal. An OtterlyAI study found only 0.1% of AI bot requests access llms.txt files. Google's John Mueller confirmed: "No AI system currently uses llms.txt." The file may have future value as a standard evolves, but it is not a reliable hook today.

---

### Level 2 — CDN / Middleware Snippet (First Paid Tier)

**What it is:** A 10-line config snippet (Cloudflare Worker, Nginx rule, or Vercel middleware) added to the customer's existing infrastructure. Intercepts AI crawler requests and routes them to CrawlReady's pre-generated Markdown cache. Human traffic is never touched.

**How to set up:** Customer adds the snippet to their existing Cloudflare/Vercel/Nginx config. No DNS change. Customer's infrastructure remains in full control. CrawlReady only handles the AI bot slice of traffic (typically 5–15% of requests).

**Risk:** Low. The customer controls their infrastructure. CrawlReady is an additional routing rule, not a replacement proxy.

**Value:** Full AI optimization benefit without the DNS commitment. This is the tier where the product earns trust.

---

### Level 3 — Full DNS Proxy (Enterprise)

**What it is:** Customer changes their DNS CNAME to point to CrawlReady's edge network. All traffic flows through CrawlReady. Human requests pass through transparently; AI crawler requests are intercepted.

**When to offer it:** Only to customers who have used Level 2 for 30+ days and want the full capability set (SLA, custom bot rules, advanced analytics, guaranteed cache freshness).

**Risk:** High trust requirement — equivalent to routing traffic through Cloudflare. Appropriate only after the customer has seen value and trusts the platform.

**Advantage:** Once a customer is here, switching cost is significant — same friction as leaving Cloudflare. This is the long-term retention moat.

---

## What CrawlReady Does NOT Do

- **Does not modify the human-visible site** — no risk of breaking existing design or UX
- **Does not serve different information** — same facts, different format
- **Does not block AI crawlers** — the product improves visibility, it does not reduce it
- **Does not require JavaScript** — the edge layer works at the HTTP request level
- **Does not touch non-AI traffic** at Levels 1 and 2 — only AI crawler requests are handled

---

## The Cloaking Risk and Why It's Manageable

**The risk:** Serving different content to bots vs. humans resembles SEO cloaking, which Google penalizes.

**The defense — dynamic rendering precedent:**

Google has already addressed this exact pattern. For years (2016–2022), Google's own documentation explicitly blessed **dynamic rendering**: serving pre-rendered static HTML to Googlebot while serving JavaScript-rendered content to human browsers. They called it an acceptable workaround and explicitly stated: _"Dynamic rendering is not cloaking."_ (Google Search Central)

CrawlReady applies the same pattern to AI bots instead of Googlebot. The mechanism is identical: detect crawler by user-agent, serve a pre-rendered equivalent of the page. The content is the same; the format is optimized for the crawling agent.

**The equivalent content guarantee (not just "format only"):**

CrawlReady's transformation pipeline enforces content parity through a diff engine that flags any AI-served version that diverges from the human version in substance. What changes:

- Navigation, footers, ads, and decorative elements are stripped
- JavaScript-hidden content is made visible (this is the core value)
- Structure is improved: semantic headings, explicit definitions, FAQ blocks
- Marketing copy is not rewritten

What never changes: facts, claims, product descriptions, pricing, dates.

**The remaining narrow risk:**

- AI providers (OpenAI, Anthropic, Perplexity) have not issued guidance on receiving format-optimized content. Their ToS prohibit _blocking_ their crawlers and _misrepresenting_ content — not optimization.
- Regulatory risk (EU AI Act Article 50, effective **August 2, 2026**) focuses on transparency and provenance. CrawlReady's public preview endpoint addresses this directly — and positions CrawlReady as a compliance tool, not just an optimization tool. See `docs/research/eu-ai-act-compliance.md`.

**Mitigation:** Level 1 (diagnostic only) has zero cloaking risk. Level 2 (CDN snippet) carries the same risk profile as Prerender.io for Googlebot — which was broadly deployed for 6+ years without penalty.

---

## Technical Architecture (High Level)

```
User request
     │
     ▼
CrawlReady Edge (CDN / Customer's Cloudflare Worker / Nginx)
     │
     ├── Accept: text/markdown header present?
     │        │
     │        ├── YES → serve pre-cached AI-optimized Markdown
     │        │          (content negotiation path — standards-compliant)
     │        │
     │        └── NO  → User-Agent = known AI bot? (UA + IP verification)
     │                    │
     │                    ├── YES → serve pre-cached AI-optimized Markdown
     │                    │          (generated from customer's actual content)
     │                    │
     │                    └── NO  → proxy to customer's origin server
     │                               (completely transparent pass-through)
     │
     └── Log: bot identity, pages accessed, frequency, detection method
```

**Content generation pipeline (multi-format — April 2026 multi-format review):**

- Phase 0–1: Firecrawl API handles crawling + extraction + Markdown conversion (no self-hosted Playwright needed)
- Phase 2+: Custom Playwright pipeline for full transformation control at scale
- Strips navigation, ads, sidebars, decorative elements
- Restructures into: H1 title → definition paragraph → structured facts → FAQ blocks → links
- **Phase 1-2: Generates attribute-rich Schema.org JSON-LD** (FAQPage, Product, HowTo, Organization) from extracted page content where none exists on origin — injected into HTML served to Google-Extended
- **Phase 1-2: Multi-format output** — the pipeline produces format-appropriate content per AI client type (Markdown for text crawlers, enriched HTML with Schema.org for Google-Extended). See "Multi-Format Content Serving" section below.
- Diff engine monitors for content changes and invalidates cache

**Unit economics warning (April 2026 critical analysis):** Firecrawl API costs $0.01–$0.05 per page. At the originally planned crawl limits (5K Starter, 25K Pro), every paid tier was **negative margin** (Starter: $50–$250 COGS against $29 revenue). Fresh crawl limits have been reduced — see `docs/product/business-model.md` for revised pricing. Validate actual per-page COGS during Phase 0 before committing to tier limits.

**Edge infrastructure:**

- Cloudflare Workers (lowest latency, global PoPs, free tier for development)
- Vercel Edge Functions
- Customer's own Nginx / Caddy (Level 2 only)

---

## Multi-Format Content Serving (Innovation Addition — April 2026 Multi-Format Review)

Different AI clients consume content differently. Serving Markdown to every AI client is suboptimal — Google-Extended benefits from enriched HTML with Schema.org, while text-extraction crawlers benefit from clean Markdown. CrawlReady serves the optimal format per client type.

| AI Client                              | Detection Method           | Format Served                            | Why                                                                                               |
| -------------------------------------- | -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GPTBot, ClaudeBot, PerplexityBot       | UA + IP verification       | Markdown                                 | Text-extraction crawlers optimize for token efficiency                                            |
| Google-Extended (AI Overviews)         | UA + IP verification       | Enriched HTML with Schema.org JSON-LD    | Google uses its own rendering pipeline (headless Chromium) and benefits most from structured data |
| Visual agents (Operator, Computer Use) | UA detection (emerging)    | Original HTML + enhanced ARIA attributes | Visual agents process rendered pixels via accessibility tree                                      |
| `Accept: text/markdown` clients        | Content negotiation header | Markdown                                 | Standards-compliant path                                                                          |
| Programmatic agents (Phase 2+)         | MCP protocol / API calls   | Structured JSON                          | Direct data access without HTML parsing                                                           |

**Why Google-Extended gets enriched HTML, not Markdown:** Google-Extended uses Google's Web Rendering Service (headless Chromium) — it renders JavaScript and processes HTML normally. Sending it Markdown is suboptimal. Attribute-rich Schema.org JSON-LD injected into the HTML maximizes Google AI Overview citation probability: FAQPage Schema makes sites 3.2x more likely to appear in AI Overviews (Citedify, 2026). See `docs/architecture/multi-format-serving.md` for full citation impact data.

**Phase 0 implementation:** The diagnostic already crawls pages and analyzes their content. Multi-format serving is a Phase 1-2 capability for the paid tier. In Phase 0, the diagnostic detects which formats each AI client would benefit from and includes this in the recommendations.

---

## Dynamic Schema.org Generation (Innovation Addition — April 2026 Multi-Format Review)

During the content transformation pipeline, CrawlReady extracts structured facts from page content and generates valid JSON-LD Schema.org markup that does not exist on the origin site.

### Why This Matters

Generic Schema.org shows no measurable citation effect when controlling for Google ranking position (OR = 0.678, p = .296). But attribute-rich Schema.org — Product with pricing/specs, FAQPage with Q&A pairs, HowTo with steps — achieves a **61.7% citation rate vs. 41.6%** for generic types (p = .012, Growth Marshal study, 730 citations). This advantage is most pronounced for lower-authority domains (DR ≤ 60) — exactly CrawlReady's ICP.

MachineContext now auto-generates Schema.org JSON-LD as part of its pipeline (confirmed April 7, 2026). CrawlReady's differentiation is in **attribute-rich** generation — extracting Q&A patterns (FAQPage), pricing/specs (Product), and step-by-step instructions (HowTo) from page content — vs. generic enrichment. Additionally, CrawlReady generates Schema from CSR pages where no content is visible to competitors' pipelines (CSR sites serve empty HTML to MachineContext's edge layer unless the user is already a customer).

### Target Schema Types (Prioritized by Citation Impact)

1. **FAQPage** (highest citation impact): Detect Q&A patterns — headings ending in `?`, `<details>`/`<summary>` elements, support pages. Generate FAQPage JSON-LD with `mainEntity` array.
2. **Product** (highest agent readiness impact): Detect pricing tables, feature lists, plan comparisons on SaaS pages. Generate Product or SoftwareApplication JSON-LD with `offers`, `featureList`.
3. **HowTo** (high value for docs): Detect step-by-step content, numbered instruction lists, setup guides. Generate HowTo JSON-LD with `step` arrays.
4. **Organization** (baseline authority): Detect company identity signals — logo, address, social links. Generate Organization JSON-LD.

### Implementation Phasing

- **Phase 0 (diagnostic):** Detect patterns and display a "Schema Generation Preview" — shows what CrawlReady would generate, gated behind the paid tier CTA. Zero additional crawl cost (uses HTML already fetched).
- **Phase 1-2 (paid tier):** Generate and inject Schema.org JSON-LD into HTML served to Google-Extended. Validate generated markup against Schema.org specifications. Content parity diff engine verifies Schema reflects actual page content.

### Quality Safeguards

- Only generate Schema types with high-confidence extraction patterns
- Validate all generated JSON-LD against Schema.org specifications
- Flag low-confidence extractions for human review in the dashboard
- Never generate Schema that contradicts visible page content

See `docs/architecture/multi-format-serving.md` for the full design specification with citation data and extraction patterns.

---

## HTMLRewriter as Potential Complementary Mechanism (Trade-Off Analysis — April 2026 Multi-Format Review)

Cloudflare's HTMLRewriter API enables streaming HTML transformation at the edge — injecting Schema.org, stripping noise, adding ARIA attributes in real-time as the origin response passes through. This is a potential complementary serving mechanism for SSR sites (where origin HTML is already content-rich).

**For SSR sites:** HTMLRewriter can transform in real-time with no cache required, no TTL management, and near-zero COGS ($0.30/million requests on Workers).

**For CSR sites:** HTMLRewriter cannot execute JavaScript. A CSR site's origin HTML is an empty `<div id="root"></div>` — there is no content to transform. The pre-generated cache (via headless browser render) remains the only solution.

**Decision status:** Deferred to Phase 2. The choice depends on the actual customer mix observed during Phase 0-1. If the majority of paid customers are CSR sites (the Phase 0 beachhead), HTMLRewriter adds no value. If SSR sites become a significant segment, HTMLRewriter offers a dramatically simpler and cheaper path for those customers. See `docs/architecture/multi-format-serving.md` for the full trade-off analysis.

---

## AI Crawler Verification Matrix

User-Agent alone is trivially spoofable. CrawlReady uses a per-vendor verification strategy combining UA matching with IP range verification where vendors publish ranges. IP ranges are synced from vendor endpoints on a daily schedule.

| Crawler            | Vendor     | UA String                | IP Verification                                                         | Verification Source                                                                            | Traffic Share (Feb 2026)          |
| ------------------ | ---------- | ------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------- |
| GPTBot             | OpenAI     | `GPTBot/1.0`             | Published IP ranges (txt)                                               | `openai.com/gptbot-ranges.txt`                                                                 | 12.1-12.8% (#3)                   |
| OAI-SearchBot      | OpenAI     | `OAI-SearchBot`          | Published IP ranges (JSON)                                              | `openai.com/searchbot.json`                                                                    | Included in OpenAI share          |
| ChatGPT-User       | OpenAI     | `ChatGPT-User`           | Published IP ranges                                                     | Same as GPTBot                                                                                 | Included in OpenAI share          |
| Meta-ExternalAgent | Meta       | `Meta-ExternalAgent/1.0` | General Meta infra IP ranges (141 IPv4 CIDRs) — UA + IP cross-reference | `blog.bgg.ovh` peering geofeed; `developers.facebook.com/docs/sharing/webmasters/web-crawlers` | **15.6% (#2)**                    |
| ClaudeBot          | Anthropic  | `ClaudeBot`              | **Not published** — UA-only fallback                                    | Anthropic does not publish CIDR ranges (uses shared provider IPs)                              | 11.1-11.4% (#4)                   |
| PerplexityBot      | Perplexity | `PerplexityBot`          | Published IP ranges (JSON)                                              | `perplexity.com/perplexitybot.json`                                                            | —                                 |
| Perplexity-User    | Perplexity | `Perplexity-User`        | Published IP ranges (JSON)                                              | Same endpoint                                                                                  | —                                 |
| Google-Extended    | Google     | `Google-Extended`        | Published IP ranges (JSON) + DNS reverse lookup                         | `developers.google.com/static/crawling/ipranges/common-crawlers.json`                          | Part of Googlebot 34.6-38.7% (#1) |
| Applebot-Extended  | Apple      | `Applebot-Extended`      | Published IP ranges (JSON)                                              | `search.developer.apple.com/applebot.json`                                                     | —                                 |
| Bytespider         | ByteDance  | `Bytespider`             | No official CIDR list — known ranges include 47.128.x.x                 | No vendor-published verification endpoint; community-maintained lists only                     | 4.23% of DISALLOW rules           |

**Traffic share context (February 2026):** The top four AI crawlers — Googlebot (34.6-38.7%), Meta-ExternalAgent (15.6%), GPTBot (12.1-12.8%), and ClaudeBot (11.1-11.4%) — control 73.5-74.3% of all AI bot traffic. Dedicated AI training crawlers (45.4%) now surpass mixed-purpose bots (43.9%) for the first time. Sources: websearchapi.ai Monthly AI Crawler Report, seomator.com AI Bot Traffic by Country.

**Meta-ExternalAgent note:** Meta-ExternalAgent doubled from 8.5% to 15.6% between December 2025 and February 2026, surging past GPTBot to the #2 position. It trains Meta's Llama models and powers Meta AI across Facebook, Instagram, WhatsApp, and Threads. Respects robots.txt. Meta publishes general infrastructure IP ranges (141 IPv4 CIDRs) but does not publish crawler-specific ranges like OpenAI does — verification requires cross-referencing Meta's known IP space.

**Bytespider note:** Included for detection completeness. Bytespider is ByteDance's aggressive training crawler (Doubao LLM). It is known to exhibit high crawl rates and sometimes ignore robots.txt. ByteDance does not publish official CIDR ranges. CrawlReady should detect and log Bytespider traffic but deprioritize optimization serving — its training-only purpose means no direct citation or agent benefit to site owners.

**Fallback policy:** For crawlers without published IP ranges (ClaudeBot), accept UA match but apply stricter rate limits and behavioral checks. Monitor for Anthropic publishing ranges in the future.

**Content negotiation bypass:** Any client sending `Accept: text/markdown` receives Markdown regardless of UA/IP verification. This renders the verification matrix unnecessary for standards-compliant clients. As adoption of the `Accept: text/markdown` header grows among AI crawlers, the UA/IP verification matrix becomes a fallback for legacy bots rather than the primary detection path.

**Open-source community lists** (supplementary, not authoritative): `monperrus/crawler-user-agents` (UA patterns), `lord-alfred/ipranges` (aggregated IP ranges with automated updates). Always reconcile against vendor-published sources.

---

## Cache Strategy

CrawlReady pre-generates AI-optimized Markdown versions and serves them from cache. The refresh strategy balances freshness against rendering costs.

**Default TTLs by tier:**

| Tier              | Default TTL                 | Recache API          | Webhook Refresh |
| ----------------- | --------------------------- | -------------------- | --------------- |
| Free (diagnostic) | 24h rescan interval per URL | No                   | No              |
| Starter           | 7 days                      | Yes                  | Yes             |
| Pro               | 24h                         | Yes                  | Yes             |
| Business          | 12h                         | Yes (priority queue) | Yes             |
| Enterprise        | 6h                          | Yes (instant)        | Yes             |

Note: The 7-day default TTL applies to the Starter paid tier's optimization cache. The Free tier's 24h limit is a diagnostic rescan interval, not a cache TTL. Higher tiers get progressively shorter defaults for fresher AI-optimized content. All paid tiers support webhook-triggered refresh for on-deploy invalidation, which is the primary freshness mechanism.

**Refresh triggers:**

- **Webhook-triggered:** Customer sends a POST to `/api/recache/{url}` on deploy or content publish. This is the primary freshness mechanism — avoids wasteful periodic crawls.
- **Manual recache API:** Customer triggers a refresh for specific URLs via dashboard or API call.
- **Scheduled re-crawl:** Fallback for customers without webhook integration. Respects the tier TTL.
- **Content change detection:** ETag/Last-Modified polling on higher tiers to detect changes without full re-renders.

**What is NOT built:** Daily full-site re-crawls. Too expensive for the value delivered. Per-URL invalidation (like Cloudflare's single-file purge) is the model.

**Scope:** Phase 1–2 optimizes publicly accessible URLs only. Authenticated/behind-login content is out of scope — matches industry precedent (Prerender.io operates on public pages only).

---

## What Differentiates This From Competitors

Multiple companies now offer active AI optimization layers (MachineContext, Mersel AI, HypoText, Prerender.io, DualWeb.AI, GenRankEngine, iGEO, Clemelopy, MultiLipi, Pure.md — 11+ as of April 2026, including adjacent tools like isagentready.com). Cloudflare launched isitagentready.com (April 17, 2026) as a free standards-adoption scanner with MCP integration — checking protocol endpoints (MCP Server Card, API Catalog, Content Signals, OAuth) rather than content quality. The core mechanic — user-agent detection + Markdown serving — is table stakes. CrawlReady's differentiation is not the mechanic itself but five capabilities no competitor offers:

**1. Free diagnostic as the primary product (not a feature)**

- The crawlability diagnostic (side-by-side browser vs. AI crawler view, per-page score, public shareable URL) is the business — not just a feature of the optimization tier
- MachineContext has a URL test tool, but no detailed scoring, no gap analysis, no permanent shareable score URLs
- Free GEO scoring tools (SearchScore, Orchly, ViaMetric) check metadata signals — CrawlReady shows what AI crawlers **actually receive**
- The diagnostic creates demand for the paid optimization tier by making the problem visible and shareable
- **Value prop framing:** "AI crawlers see 100% of your content instead of 0%" (CSR) or "5x cleaner signal for AI crawlers" (SSR). Never promise citations — promise visibility. Format optimization addresses ~15–20% of citation factors; the other 80% (authority, comprehensiveness, recency) is outside CrawlReady's scope.

**2. Transparency-first architecture**

- Every CrawlReady-protected domain exposes a public `/crawlready-preview` endpoint — anyone (including Google, regulators, or competitors) can see exactly what AI crawlers receive
- A content parity diff engine continuously verifies the AI version matches the human version in substance
- No competitor offers public proof of content equivalence

**3. Graduated trust model**

- Free diagnostic → CDN snippet → DNS proxy: each step increases trust before increasing commitment
- Competitors like MachineContext and HypoText go straight to "deploy our edge layer" — a trust jump that developer audiences resist for new products

**4. Attribute-rich Schema.org generation + multi-format serving (April 2026 multi-format review, updated April 7 critical analysis)**

- MachineContext now auto-generates Schema.org JSON-LD (confirmed April 7, 2026). CrawlReady's differentiation is **attribute-rich** generation — extracting FAQPage with Q&A pairs, Product with pricing/specs, HowTo with steps — vs. generic enrichment. Attribute-rich Schema achieves 61.7% citation rate vs. 41.6% for generic types (Growth Marshal, p = .012).
- CrawlReady generates Schema from CSR pages where competitors' pipelines see empty HTML — a structural advantage for the CSR/hybrid segment
- Multi-format serving delivers the optimal format per AI client type (Markdown for text crawlers, enriched HTML with Schema for Google-Extended, original HTML with enhanced ARIA for visual agents) — not one-size-fits-all Markdown
- MultiLipi ships Markdown + JSON-LD pass-through, but does not generate Schema where none exists on the origin

**5. Content quality analysis — the dimension Cloudflare and all standards-only scanners miss (April 2026 Cloudflare review)**

- Cloudflare's isitagentready.com checks *standards adoption* (does your site speak the protocols?). CrawlReady checks *content quality for AI* (can AI actually understand your content?). A site can pass every Cloudflare check and still score 0 on CrawlReady because its content is JS-hidden.
- CrawlReady absorbs Cloudflare's standards checks via the A4 (Standards Adoption) category of the Agent Readiness sub-score — making CrawlReady the superset tool.
- Positioning: *"Cloudflare checks if your site speaks the protocols. CrawlReady checks if AI can actually understand your content."*
- See `docs/research/cloudflare-agent-readiness.md` for full competitive analysis.

---

## Agent Readiness Score (Innovation Addition — April 2026)

The AI landscape has moved beyond crawlers reading pages to agents acting on pages. The agentic AI market is $7.6B in 2026 (projected $236B by 2034 at 40% CAGR). 80% of Fortune 500 companies deploy active AI agents in production. OpenAI's Agentic Commerce Protocol and the Universal Commerce Protocol are live, with the first autonomous AI agent purchase completed March 25, 2026. CrawlReady's diagnostic should measure agent readiness alongside crawlability.

### What It Measures

The Agent Readiness Score (0–100) complements the Crawlability Score. A site can score high on crawlability (content is visible) but low on agent readiness (content is not actionable). The score has four components (updated April 2026 after Cloudflare Agent Readiness review):

**1. Structured Data Completeness (0–25 points)**

- Schema.org JSON-LD presence and validity (Organization, Product, SoftwareApplication, APIReference, FAQPage, HowTo)
- OpenGraph metadata completeness
- Product/pricing data in machine-readable format vs. only in rendered text

**2. Content Negotiation Readiness (0–25 points)**

- Does the server respond to `Accept: text/markdown` with actual Markdown?
- Does the site serve an `llms.txt` file?
- Are there alternative machine-readable endpoints (API docs, JSON feeds)?

**3. Machine-Actionable Data Availability (0–30 points)**

- Are key business facts (pricing, features, contact, API endpoints) extractable without visual rendering?
- Is there a clear information hierarchy (H1 → H2 → content) that agents can navigate programmatically?
- Are call-to-action targets (signup URLs, API endpoints, docs links) discoverable from the page content?

**4. Standards Adoption (0–20 points) — NEW (April 2026 Cloudflare review)**

- Does robots.txt contain explicit rules for AI crawlers (GPTBot, ClaudeBot, etc.)?
- Does robots.txt contain a Content Signals directive (`Content-Signal: ai-train, ai-input, search`)?
- Does the site have a sitemap.xml?
- Does the HTTP response include Link Headers (RFC 8288) for resource discovery?
- Does the site expose an MCP Server Card at `/.well-known/mcp/server-card.json`?
- Does the site expose an API Catalog (RFC 9727) at `/.well-known/api-catalog`?

The A4 category was added after analyzing Cloudflare's isitagentready.com tool and Radar adoption data. It measures adoption of emerging AI agent standards using lightweight HTTP probes. See `docs/research/cloudflare-agent-readiness.md` and `docs/architecture/scoring-detail.md` for full rubrics.

### Phase 0 Implementation

The Agent Readiness Score is computed alongside the Crawlability Score during the same diagnostic scan. 5 additional HTTP requests are needed per scan (updated from 2, April 2026 Cloudflare review): one `Accept: text/markdown` probe, one `/llms.txt` check, and three parallel HEAD requests for sitemap.xml, MCP Server Card, and API Catalog. robots.txt and Link Headers are parsed from HTTP responses already fetched — zero additional cost.

The score page displays both metrics:

- **Crawlability Score: 23/100** — "AI crawlers can barely see your content"
- **Agent Readiness Score: 12/100** — "AI agents cannot act on your content"

The Crawlability Score remains the primary Phase 0 hook (strongest CSR aha moment). The Agent Readiness Score is the secondary "there's more" moment that expands the conversation beyond search citations and into the agent economy.

### Why It Matters

- **Removes the 15% ceiling:** Agent readiness has direct, measurable value independent of the ~15–20% citation factor that limits the crawlability value prop
- **Future-proofs the product:** If AI crawlers eventually render JS, the Agent Readiness Score retains its value — structured data and content negotiation matter regardless of rendering capability
- **Expands TAM:** Same architecture serves a $7.6B market (agentic AI) alongside the $1–1.5B GEO market
- **Higher WTP:** Agent readiness infrastructure commands higher willingness-to-pay than format optimization because the value is closer to revenue impact

See `docs/research/agent-readiness.md` for the full design specification with scoring rubrics and data sources.

---

## Agent Interaction Score (Innovation Addition — April 2026 Strategic Review)

The AI agent landscape has bifurcated into two distinct modalities that websites must serve:

1. **Text-extraction agents** (GPTBot, ClaudeBot, PerplexityBot) — read raw HTML/Markdown, extract content
2. **Visual browsing agents** (OpenAI Operator, Anthropic Computer Use, Perplexity Comet) — process rendered pixels and navigate via the accessibility tree

The Agent Readiness Score (above) addresses modality 1. The Agent Interaction Score addresses modality 2 — a fundamentally different and rapidly growing interaction pattern.

### Why This Matters Now

- **OpenAI Operator** (Jan 2026) processes raw pixels through a Vision-Action Loop using CUA model — achieves 87% on WebVoyager and 38.1% on OSWorld benchmarks
- **Anthropic Computer Use** views screens directly, operating across desktop applications
- **Google web.dev** (2026) explicitly documents that "the accessibility tree is the primary interface between AI agents and websites"
- Agents use three complementary modalities: **screenshots** (vision), **raw HTML** (parsing), **accessibility tree** (semantic map of roles, names, and states)
- **28% of Fortune 500** have deployed MCP servers; **80%** deploy active AI agents in production workflows
- Visual agents don't care about `Accept: text/markdown` — they see the page as rendered and navigate via the accessibility tree

No competitor in the AI optimization space measures how well visual agents can navigate and interact with a website. This is a differentiated product axis.

### What It Measures

The Agent Interaction Score (0–100) assesses how well AI visual browsing agents can navigate, understand, and interact with a website. It complements the Crawlability Score (can crawlers see content?) and Agent Readiness Score (can agents act on data?) by measuring a third dimension: can agents USE the website?

**1. Semantic HTML Quality (0–25 points)**

- Proper semantic elements (`<button>`, `<form>`, `<nav>`, `<main>`, `<header>`, `<footer>`) vs. generic `<div>` and `<span>` with click handlers
- Heading hierarchy completeness (H1 → H2 → H3 — no skipped levels)
- Landmark elements present (`<main>`, `<nav>`, `<aside>`, `<footer>`)

Scoring:

- 0 points: Majority `<div>`-based layout with no semantic elements
- 10 points: Some semantic elements but inconsistent (e.g., `<nav>` present but forms use `<div>` buttons)
- 20 points: Consistent semantic HTML with minor gaps
- 25 points: Full semantic HTML with complete landmark structure

**2. Interactive Element Accessibility (0–30 points)**

- All interactive elements (buttons, links, inputs) have accessible names (via text content, `aria-label`, or `aria-labelledby`)
- Form inputs have associated `<label>` elements
- Click targets have visible area larger than 8 square pixels (per web.dev agent spec)
- Focus indicators present on interactive elements

Scoring:

- 0 points: Interactive elements lack accessible names; forms have no labels
- 10 points: Some labels present but significant gaps (>30% of interactive elements unnamed)
- 20 points: Most interactive elements properly labeled; minor gaps
- 30 points: All interactive elements have accessible names, proper labels, adequate click targets

**3. Navigation & Content Structure (0–25 points)**

- Programmatic navigation path exists (keyboard-navigable, no mouse-only interactions)
- Content is organized in a traversable hierarchy (agents can systematically walk through sections)
- No content hidden behind hover-only interactions, infinite scroll without landmarks, or mouse-dependent reveal patterns
- Skip navigation links or clear content sections for efficient agent traversal

Scoring:

- 0 points: Mouse-dependent interactions; content behind hover reveals; no keyboard navigation
- 10 points: Basic keyboard navigation works but content structure is flat
- 20 points: Clear hierarchy with some accessibility gaps
- 25 points: Fully keyboard-navigable with clear content landmarks

**4. Visual-Semantic Consistency (0–20 points)**

- What's visually prominent matches what's semantically important (agents cross-reference screenshots with accessibility tree)
- No invisible elements that affect layout (e.g., hidden elements occupying space, off-screen content loaded in DOM)
- Text content matches rendered visual (no CSS-replaced content, icon fonts without labels)

Scoring:

- 0 points: Significant mismatch between visual and semantic content (icon-only buttons, CSS-hidden text)
- 10 points: Some mismatches (icon buttons without labels, some off-screen content)
- 20 points: Strong visual-semantic alignment throughout

### Phase 0 Implementation

The Agent Interaction Score is computed from the same browser render that Firecrawl already performs. No additional crawling passes are required — the checks analyze the rendered DOM and its accessibility properties.

**Data extraction method:** Firecrawl renders the page with a headless browser. From the rendered DOM, extract:

- Element tag distribution (semantic vs. generic)
- ARIA attributes and role assignments
- Form label associations
- Heading hierarchy
- Interactive element properties (names, types, sizes)
- Landmark element presence

**Additional cost:** Zero additional HTTP requests. All data comes from the existing rendered DOM. Implementation adds 2-3 days to the Phase 0 build.

**Display:** The score page shows three scores:

```
Crawlability Score: 23/100     ← "AI crawlers can barely see your content"
Agent Readiness Score: 12/100  ← "AI agents cannot act on your content"
Agent Interaction Score: 45/100 ← "Visual AI agents struggle to navigate your site"
```

The Agent Interaction Score will often be the highest of the three (most modern sites have reasonable semantic HTML even if they lack structured data), which creates a natural coaching moment: "Your site works for visual agents but is invisible to crawlers."

### Competitive Positioning

No AI optimization platform measures agent interaction readiness as part of an integrated diagnostic:

- MachineContext, Mersel, HypoText, Prerender.io — focus on text-extraction optimization only
- GEO scoring tools (SearchScore, Orchly, ViaMetric, AI Crawler Check, AmICitable, AgentReady.tools, and 3+ others) — check metadata signals, not accessibility tree quality
- isagentready.com — standalone accessibility tree scanner (validates the concept but is not integrated into a comprehensive crawlability + agent readiness diagnostic)
- Lighthouse — measures human accessibility but doesn't frame it for AI agents
- CrawlReady's Agent Interaction Score is part of a unified diagnostic alongside crawlability and agent readiness — no competitor offers this integrated view

### Strategic Value

- **Repositions CrawlReady:** From "can crawlers read your content" to "can agents USE your website" — a fundamentally larger value proposition
- **Addresses the visual agent modality:** Operator and Computer Use process pixels, not markdown. The accessibility tree is their primary interface. This score directly measures that.
- **Leverages existing infrastructure:** Accessibility tree data is a byproduct of browser rendering (which Firecrawl already does). Near-zero incremental cost.
- **Cross-sells to engineering teams:** The Crawlability Score targets SEO/marketing. The Agent Interaction Score targets engineering and product teams who own the frontend — expanding the internal champion surface within customer organizations.
- **Future-proof:** If AI crawlers eventually render JS (solving CSR invisibility), both the Agent Readiness Score and the Agent Interaction Score retain full value. The Crawlability Score is the only metric at risk of obsolescence.

Sources: `web.dev/articles/ai-agent-site-ux`, `downgraf.com/general/web-design-for-ai-agents`, `nohacks.co/blog/how-ai-agents-see-your-website`, `agentsindex.ai/compare/anthropic-computer-use-vs-openai-operator`

---

## Unified AI Readiness Score (Innovation Addition — April 2026 Strategic Review)

The three diagnostic scores (Crawlability, Agent Readiness, Agent Interaction) roll up into a single headline metric: the **AI Readiness Score** (0-100). This is a weighted composite:

```
AI Readiness Score = (0.50 × Crawlability) + (0.25 × Agent Readiness) + (0.25 × Agent Interaction)
```

Crawlability receives 50% weight because it is the Phase 0 hook — CSR sites scoring near zero must see this reflected in the headline. Agent Readiness and Agent Interaction each receive 25%.

**Score interpretation:**

| Range | Label | Description |
|---|---|---|
| 0-20 | Critical | Your site is invisible or broken for AI systems |
| 21-40 | Poor | Major gaps — AI crawlers and agents struggle with your content |
| 41-60 | Fair | Partially visible — significant room for improvement |
| 61-80 | Good | Most content is AI-accessible with minor gaps |
| 81-100 | Excellent | Fully AI-ready — crawlable, actionable, navigable |

**Floor rule:** The unified score cannot exceed 60 if any sub-score is below 20. This prevents a site with excellent semantic HTML but invisible content from getting a misleadingly high headline score.

The sub-scores and their component rubrics remain unchanged. The unified score is purely additive. The public score page (`crawlready.app/score/{domain}`) displays the unified score as the headline, with sub-scores on drill-down.

See `docs/architecture/scoring-algorithm.md` for the full algorithm design, display specification, and integration points.

---

## AI Crawler Analytics (Innovation Addition — April 2026 Strategic Review)

CrawlReady ships a continuously-running free tool alongside the one-time diagnostic: **AI Crawler Analytics**. Ultra-light middleware snippets (3-5 lines, copy-paste, no npm install) detect AI crawler visits server-side and report to CrawlReady's dashboard.

**Why middleware, not a JS script:** AI crawlers do not execute JavaScript. Detection must happen server-side, at the HTTP request level, by reading the User-Agent header.

**Framework coverage:** Next.js middleware, Express/Hono, Cloudflare Workers, Vercel Edge Functions.

**What it shows:** Per-crawler visit counts, per-page crawl frequency, top crawled pages, and alerts when crawlers visit pages with low crawlability scores ("GPTBot visited /pricing 89 times but received an empty `<div>`").

**Backlink mechanic (free tier):** The middleware injects a hidden `<link rel="ai-analytics" href="https://crawlready.app/score/{domain}">` tag in the HTML `<head>`. Invisible to humans, discoverable by all crawlers. Creates indexable backlinks to CrawlReady's score pages. Paid tiers can remove this tag. An opt-in visible badge (unbranded "AI Score: 72/100" or branded "Powered by CrawlReady") is available but never auto-injected.

**Phase 0:** Ingest API endpoint ships alongside the diagnostic. **Phase 1:** Full dashboard, alerts, and all 4 framework snippets.

See `docs/architecture/crawler-analytics.md` for the full feature specification including middleware code, data model, dashboard design, and upsell flow.

---

## Decisions (Formerly Open Questions)

All technical architecture questions have been researched and resolved. See `docs/decisions/open-questions.md` for full evidence and sources.

- **Bot detection:** UA + IP range verification per vendor (see verification matrix above). UA-only fallback for ClaudeBot until Anthropic publishes ranges.
- **A4 Standards Adoption (April 2026 Cloudflare review):** New scoring category added to Agent Readiness sub-score after analyzing Cloudflare's isitagentready.com. Six checks measuring emerging AI agent standards (robots.txt AI rules, Content Signals, sitemap.xml, Link Headers, MCP Server Card, API Catalog). Points redistributed: A1(30→25), A2(30→25), A3(40→30), A4(0-20) — total remains 100. HTTP budget increased from 2 to 5 requests per scan. See `docs/architecture/scoring-detail.md`.
- **Authenticated content:** Out of scope for Phase 0–2. Optimize public URLs only. Enterprise: self-hosted worker in customer VPC.
- **Cache refresh:** Starter default 7-day TTL, Pro 24h, Business 12h, Enterprise 6h + webhook-triggered refresh + recache API (see cache strategy table above). No daily full-site re-crawls.
- **Public Markdown endpoint:** Public by default (`/crawlready-preview/page-slug`) with `rel=canonical` to original URL and `X-Robots-Tag: noindex`. Core differentiator — do not hide it.
- **Benchmarking:** Build a suite of ~50 representative URLs. Measure content coverage (F1 vs gold standard), noise ratio, structure preservation, information completeness. Run against our pipeline + competitor outputs. Publish as differentiation content.
- **Value prop framing (April 2026 critical analysis):** Promise visibility, not citations. "AI crawlers see 100% of your content instead of 0%" (CSR) and "5x cleaner signal" (SSR) are provable. Citation rate improvement (~17%) is a downstream metric CrawlReady cannot guarantee — it depends on authority, comprehensiveness, and recency which are outside scope.
- **Unit economics:** Fresh crawl limits reduced from original plan to ensure positive margins against Firecrawl COGS. See `docs/product/business-model.md` for revised pricing.

### Diagnostic Score Structure Decision (April 2026 Strategic Review)

**Question:** Should the Phase 0 diagnostic use a four-score model (Crawlability + Agent Readiness + Agent Interaction + Compliance, all 0-100) or a three-score model with a separate compliance checklist?

**Decision: Three numeric scores + binary compliance checklist.**

**Update (April 2026 Innovation Review):** The three numeric scores now roll up into a single **AI Readiness Score** (0-100) as the headline metric. The sub-scores remain visible on drill-down. The display hierarchy becomes:

- **Headline:** AI Readiness Score (single unified number — the shareable, viral metric)
- **Drill-down:** Crawlability + Agent Readiness + Agent Interaction sub-scores
- **Detail:** Per-factor scoring rubrics with specific recommendations
- **Secondary:** EU AI Act Transparency Checklist (expandable)

See `docs/architecture/scoring-algorithm.md` for the weighting algorithm and display specification.

The diagnostic displays:

1. **Crawlability Score** (0–100): Can AI crawlers see your content?
2. **Agent Readiness Score** (0–100): Can AI agents act on your structured data?
3. **Agent Interaction Score** (0–100): Can visual AI agents navigate your site?
4. **EU AI Act Transparency Checklist** (X/4 requirements met): Binary pass/fail per requirement

**Why NOT a fourth numeric score for compliance:**

- Compliance is inherently binary — you either meet a requirement or you don't. A 0-100 scale implies false precision on legal matters.

**Why three numeric scores (not two as before):**

- The Agent Interaction Score addresses a completely different modality (visual agents via accessibility tree) than the Agent Readiness Score (data extraction via structured content). They measure orthogonal capabilities.
- Three scores create three distinct "aha moments": "your content is invisible" (crawlability), "your data isn't actionable" (readiness), "visual agents can't navigate your site" (interaction).
- Each score targets a different internal champion: SEO/marketing (crawlability), product (readiness), engineering (interaction). This expands the number of people within a customer organization who care about CrawlReady.
- The Agent Interaction Score is often the highest of the three (most modern sites have reasonable semantic HTML even if they lack structured data), creating a natural coaching moment: "Your site works for visual agents but is invisible to crawlers."

**Display hierarchy on the score page:**

```
AI Readiness Score: 31/100 [HEADLINE — largest, top of page]
├── Crawlability Score: 23/100 [first sub-score, most prominent]
├── Agent Readiness Score: 12/100
├── Agent Interaction Score: 45/100
└── EU AI Act: 1/4 checks passed [binary, expandable]
```

- **Headline:** AI Readiness Score (largest number on page — the unified, shareable, viral metric)
- **Primary sub-score:** Crawlability Score (shown first and largest among the three sub-scores — the Phase 0 hook)
- **Secondary sub-scores:** Agent Readiness Score + Agent Interaction Score (side by side, below Crawlability)
- **Tertiary:** EU AI Act Transparency Checklist (below scores, expandable — secondary hook for compliance-motivated buyers)

This layout preserves the CSR aha moment through the Crawlability sub-score while giving users a single headline number (AI Readiness Score) to share and improve. See `docs/architecture/scoring-algorithm.md` for the weighting algorithm and `docs/architecture/scoring-detail.md` for implementable scoring rubrics.
