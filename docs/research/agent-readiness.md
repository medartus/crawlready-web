# Research: Agent Readiness Score Design

Analysis of the AI agent economy and design specification for CrawlReady's Agent Readiness Score — a companion metric to the existing Crawlability Score. Compiled April 2026.

---

## Why Agent Readiness Matters Now

The AI landscape has moved beyond crawlers reading pages to agents acting on pages. The existing Crawlability Score measures "can AI crawlers see your content?" Agent Readiness measures "can AI agents act on your content?" — a fundamentally different and larger market.

### Key Data Points

- Agentic AI market: **$7.6B in 2026**, projected **$236B by 2034** (40% CAGR) — Sources: DigitalApplied, SkillsIndex
- **14,000–25,000+ MCP servers** cataloged, 97M monthly SDK downloads — Sources: Nevermined, Nerq Q1 2026
- **80% of Fortune 500** deploy active AI agents in production — Source: DigitalApplied 2026
- OpenAI launched **Agentic Commerce Protocol (ACP)** in September 2025 with Stripe — 4% transaction fee
- **Universal Commerce Protocol (UCP)** launched January 2026 with Shopify, Walmart, Target, Visa, Mastercard
- First autonomous AI agent purchase completed **March 25, 2026** — Claude Sonnet 4.5 bought a product in 43 seconds via UCP
- AI agents evaluate products via **"Semantic Density Score"** — how much useful machine-readable data is available without guessing
- **35% of B2B buyers** in 2026 use AI assistants in vendor evaluation
- AI-powered search traffic grew from 4% (2024) to **18%** (early 2026)
- **30% of programming searches** now done on ChatGPT (Q1 2025)

### The Shift From Crawlers to Agents

| Dimension | AI Crawlers (2024-2025) | AI Agents (2025-2026) |
|---|---|---|
| Behavior | Read pages, index content | Read, evaluate, compare, transact |
| Protocol | User-Agent + HTTP | MCP, ACP, UCP, content negotiation |
| Value to site owner | Citation in AI search | Direct revenue from agent transactions |
| What they need | Clean Markdown / HTML | Structured data, pricing, APIs, actions |
| Detection | UA string + IP range | `Accept: text/markdown` header, MCP protocol, OAuth, Content Signals |
| Market size | $1–1.5B (GEO) | $7.6B (agentic AI) |
| Standards | robots.txt, sitemap.xml | robots.txt + Content Signals, MCP Server Card, API Catalog (RFC 9727), Agent Skills, WebMCP, OAuth discovery (RFC 8414/9728), Web Bot Auth |

---

## Agent Readiness Score: Component Design

The Agent Readiness Score (0–100) measures how well a website can be consumed and acted upon by AI agents. It complements the Crawlability Score — a site can score high on crawlability (content is visible) but low on agent readiness (content is not actionable).

### Emerging Agent Standards Landscape (April 2026 — Cloudflare Agent Readiness Review)

Cloudflare's isitagentready.com tool (launched April 17, 2026) and Radar AI Insights dataset established baseline adoption rates across the top 200K domains. This data informs which standards CrawlReady should check:

| Standard | Adoption (200K domains) | CrawlReady Phase | Rationale |
|---|---|---|---|
| robots.txt | 78% | **Phase 0** (A4) | Near-universal; check for AI-specific rules |
| Content Signals (`Content-Signal:` in robots.txt) | 4% | **Phase 0** (A4) | Growing standard; zero HTTP cost (parsed from robots.txt) |
| Markdown content negotiation | 3.9% | **Phase 0** (A2) | Already in A2 |
| Sitemap.xml | ~60-70% estimated | **Phase 0** (A4) | Fundamental discoverability; 1 HEAD request |
| Link Headers (RFC 8288) | Very low | **Phase 0** (A4) | Zero HTTP cost (parsed from existing response headers) |
| MCP Server Card (`/.well-known/mcp/server-card.json`) | <15 sites | **Phase 0** (A4) | 1 HEAD request; rewards early adopters |
| API Catalog (RFC 9727, `/.well-known/api-catalog`) | <15 sites | **Phase 0** (A4) | 1 HEAD request; relevant for API-heavy ICP |
| Agent Skills (`/.well-known/agent-skills/index.json`) | Near zero | Phase 1 | Too early; revisit when adoption grows |
| WebMCP | Near zero | Phase 1+ | Chrome-specific proposal; too early |
| Web Bot Auth (`/.well-known/http-message-signatures-directory`) | Near zero | Phase 1+ | Relevant for sites running agents, not CrawlReady's ICP |
| OAuth discovery (RFC 8414/9728) | Low but growing | Phase 1 | Relevant but adds scope; deferred |
| x402, UCP, ACP (commerce) | Near zero | Phase 2+ | Cloudflare doesn't score these either |

Source: `blog.cloudflare.com/agent-readiness/`, `radar.cloudflare.com/ai-insights`, `contentsignals.org/`. See `docs/research/cloudflare-agent-readiness.md` for full analysis.

### Score Components (Phase 0)

Phase 0 checks analyze the HTML/Markdown already fetched by the crawling provider, plus 5 additional lightweight HTTP requests (2 existing + 3 new HEAD requests added in the April 2026 Cloudflare review).

**Component 1: Structured Data Completeness (0–30 points)**

What it checks:
- Schema.org JSON-LD presence and validity (Organization, Product, SoftwareApplication, APIReference, FAQPage, HowTo)
- OpenGraph metadata completeness (title, description, image, type)
- Product/pricing data in machine-readable format vs. only in rendered text

Scoring:
- 0 points: No structured data
- 10 points: Basic OpenGraph only
- 20 points: Schema.org present but incomplete (missing key properties)
- 30 points: Rich Schema.org + OpenGraph with product/organization/API data

Why it matters: AI agents evaluating products rely on structured data to extract pricing, features, and specifications without guessing. Agents score sites by "Semantic Density" — the ratio of machine-readable data to total content.

**Component 2: Content Negotiation Readiness (0–30 points)**

What it checks:
- Does the server respond to `Accept: text/markdown` with actual Markdown content?
- Does the site serve an `llms.txt` file?
- Are there alternative machine-readable endpoints (API docs, JSON feeds)?

Scoring:
- 0 points: No content negotiation support, no llms.txt, no machine-readable alternatives
- 10 points: llms.txt present OR JSON-LD API documentation
- 20 points: Responds to `Accept: text/markdown` with valid Markdown OR has well-structured API endpoints
- 30 points: Full content negotiation support + llms.txt + structured API

Why it matters: As AI agents adopt the `Accept: text/markdown` standard (already used by Claude Code, OpenCode), sites that respond correctly gain an advantage. This is the forward-compatible path that bypasses UA detection entirely.

Implementation note: The content negotiation check requires a single additional HTTP request with the `Accept: text/markdown` header during the diagnostic scan. The llms.txt check is a single GET to `/llms.txt`. Minimal additional Firecrawl cost.

**Component 3: Machine-Actionable Data Availability (0–40 points)**

What it checks:
- Are key business facts (pricing, features, contact, API endpoints) extractable from structured data or clean semantic HTML without requiring visual rendering?
- Is there a clear information hierarchy (H1 → H2 → content) that agents can navigate programmatically?
- Are call-to-action targets (signup URLs, API endpoints, documentation links) discoverable from the page content?

Scoring:
- 0 points: Key business data exists only in JS-rendered visual elements with no structured equivalent
- 15 points: Some data in structured format, but key facts (pricing, features) require visual rendering
- 30 points: Most business data extractable from HTML/structured data, clear hierarchy
- 40 points: All key business data in structured format, clear navigation hierarchy, actionable links discoverable

Why it matters: When an AI agent is asked "what does CrawlReady cost?" it needs to find pricing data in a structured format, not parse a screenshot. Sites where critical business data is only available through visual rendering are invisible to agents — regardless of whether the content is technically crawlable.

### Combined Score Calculation

```
Agent Readiness Score = Structured Data (0-30) + Content Negotiation (0-30) + Machine-Actionable Data (0-40)
```

The weighting favors actionable data (40 points) over metadata (30 points) because agents primarily evaluate what they can act on, not what metadata says about the page.

### Phase 0 Implementation

The Agent Readiness Score is computed alongside the Crawlability Score during the same diagnostic scan. No additional crawling passes are required — the checks analyze the same HTML, Markdown, and HTTP responses already collected.

Additional requests per scan: 5 maximum
- One `Accept: text/markdown` probe request (existing)
- One `/llms.txt` check (existing)
- One `HEAD /sitemap.xml` (new, April 2026 Cloudflare review)
- One `HEAD /.well-known/mcp/server-card.json` (new, April 2026 Cloudflare review)
- One `HEAD /.well-known/api-catalog` (new, April 2026 Cloudflare review)

Display: The score page shows three scores:
```
Crawlability Score: 23/100     ← "AI crawlers can barely see your content"
Agent Readiness Score: 12/100  ← "AI agents cannot act on your content"
Agent Interaction Score: 45/100 ← "Visual AI agents struggle to navigate your site"
```

The Crawlability Score remains the primary Phase 0 hook (strongest CSR aha moment). The Agent Readiness Score becomes the "wait, there's more" moment. The Agent Interaction Score (see `docs/product/solution.md` for full design) addresses the visual browsing agent modality (OpenAI Operator, Anthropic Computer Use) and measures accessibility tree quality — the primary interface these agents use. It is often the highest of the three scores (most modern sites have reasonable semantic HTML), which creates a natural coaching moment: "Your site works for visual agents but is invisible to crawlers."

---

## Phase 1+ Evolution

As the product matures, the Agent Readiness Score expands to include:

- **MCP Server Card** (moved to Phase 0, April 2026): Basic presence check at `/.well-known/mcp/server-card.json` is now in A4 (Phase 0). Phase 1 adds validation of the JSON content (tools listed, transport type, authentication config).
- **OAuth discovery** (Phase 1): Check `/.well-known/oauth-authorization-server` and `/.well-known/openid-configuration`. Deferred from Phase 0 to avoid scope creep but relevant for agent authentication.
- **Agent Skills discovery** (Phase 1): Check `/.well-known/agent-skills/index.json`. Currently <15 sites support this (Cloudflare Radar, April 2026). Revisit when adoption grows.
- **Commerce protocol compatibility** (Phase 2+): Does the site support ACP or UCP for agent transactions? Cloudflare tracks these as informational (not scored) as of April 2026.
- **Agent authentication readiness** (Phase 2+): Does the site support Web Bot Auth (`/.well-known/http-message-signatures-directory`) and KYA (Know Your Agent) frameworks?
- **WebMCP** (Phase 2+): Chrome-specific proposal for exposing MCP over web pages. Too early to score.

Adoption of these standards will be tracked using Cloudflare Radar data (updated weekly) as a benchmark for when to add new checks.

---

## Competitive Positioning

No competitor in the AI optimization space (MachineContext, Mersel, HypoText, Prerender.io, DualWeb.AI, 11+ total) offers an integrated agent readiness + agent interaction assessment as part of a comprehensive crawlability diagnostic.

**Cloudflare isitagentready.com (April 2026):** Cloudflare launched a free agent readiness scanner checking 5 categories of standards adoption (Discoverability, Content Accessibility, Bot Access Control, Protocol Discovery, Commerce). It also exposes an MCP server for programmatic scanning and is integrated into Cloudflare's URL Scanner API. **Key distinction:** Cloudflare checks *standards adoption* (does your site speak the protocols?). CrawlReady checks *content quality for AI* (can AI actually understand your content?). A site can pass every Cloudflare check but score 0 on CrawlReady because its content is JS-hidden. These are complementary dimensions. CrawlReady absorbs Cloudflare's standards checks (via the new A4 category) to become the superset tool.

AgentReady.tools offers a standalone "AI Readiness Score" with paid tiers ($19-79/mo). The GEO scoring tools (SearchScore, Orchly, ViaMetric, AI Crawler Check, AmICitable) check metadata signals but not agent-actionable data availability.

CrawlReady's unified diagnostic (AI Readiness Score headline + three sub-scores with A4 standards adoption + EU checklist + visual diff + permanent shareable URLs) provides a differentiated integrated view no competitor offers.

---

## Strategic Implications

1. **TAM expansion:** The agent readiness framing expands the addressable market from GEO optimization ($1–1.5B) to agentic AI infrastructure ($7.6B). Same product architecture, much larger market.
2. **Churn reduction:** Agent readiness has direct, measurable value (structured data = better agent evaluation = more conversions) independent of the ~15% citation factor ceiling that limits the crawlability value prop.
3. **Future-proofing:** If AI crawlers eventually render JS (solving the CSR invisibility problem), the Agent Readiness Score retains its value — structured data and content negotiation matter regardless of rendering capability.
4. **Pricing support:** Agent readiness infrastructure commands higher willingness-to-pay ($199–999/mo) than format optimization ($29–49/mo) because the value is closer to revenue impact.

---

## Decisions

- **Phase 0 scope (updated April 2026 Cloudflare review):** Agent Readiness sub-score now has 4 categories: A1 Structured Data (25pts), A2 Content Negotiation (25pts), A3 Machine-Actionable Data (30pts), A4 Standards Adoption (20pts). Total remains 100. Uses existing crawl data plus 5 lightweight HTTP requests (up from 2).
- **Score display:** Show Agent Readiness Score and Agent Interaction Score as secondary metrics alongside the primary Crawlability Score. All three scores displayed on a single score page. Do not split them into separate products.
- **Messaging:** Phase 0 marketing leads with the Crawlability Score (stronger CSR hook). Agent Readiness Score is the expansion story for Phase 1+ and for SSR sites where the crawlability hook is weaker.
- **A4 Standards Adoption (April 2026):** New category added after analyzing Cloudflare's isitagentready.com. Six checks (robots.txt AI rules, Content Signals, sitemap.xml, Link Headers, MCP Server Card, API Catalog) measuring emerging standards. See `docs/research/cloudflare-agent-readiness.md`.
- **MCP Server Card moved to Phase 0:** Basic presence check (HEAD request) is now in A4. Full JSON validation deferred to Phase 1.
- **Agent Readiness Score components deferred to Phase 1+:** OAuth discovery, Agent Skills, commerce protocols, Web Bot Auth, WebMCP.
- **Cloudflare Radar as benchmark:** Use Cloudflare's weekly Radar data on standards adoption to inform when to add new checks and to benchmark CrawlReady scan results against global averages.

Sources: `digitalapplied.com/blog/agentic-ai-statistics-2026-definitive-collection-150-data-points`, `nevermined.ai/blog/model-context-protocol-adoption-statistics`, `nerq.ai/report/q1-2026`, `skillsindex.dev/blog/state-of-ai-agent-tools-february-2026`, `openai.com/blog/buy-it-in-chatgpt`, `ucpchecker.com/blog/first-autonomous-ai-agent-purchase-ucp`, `wearepresta.com/ai-shopping-agents-the-strategic-guide-to-agentic-commerce-in-2026/`
