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
| Detection | UA string + IP range | `Accept: text/markdown` header, MCP protocol |
| Market size | $1–1.5B (GEO) | $7.6B (agentic AI) |

---

## Agent Readiness Score: Component Design

The Agent Readiness Score (0–100) measures how well a website can be consumed and acted upon by AI agents. It complements the Crawlability Score — a site can score high on crawlability (content is visible) but low on agent readiness (content is not actionable).

### Score Components (Phase 0 — Lightweight)

For Phase 0, add 2–3 checks that require no additional crawling infrastructure beyond what the Crawlability Score already uses. These checks analyze the HTML/Markdown already fetched by Firecrawl.

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

Additional requests per scan: 2 maximum
- One `Accept: text/markdown` probe request
- One `/llms.txt` check

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

- **MCP endpoint discovery** (Phase 1): Does the site expose an MCP server? Is it listed in registries?
- **Commerce protocol compatibility** (Phase 2+): Does the site support ACP or UCP for agent transactions?
- **Agent authentication readiness** (Phase 3+): Does the site support KYA (Know Your Agent) frameworks?

These are tracked as future roadmap items, not Phase 0 scope.

---

## Competitive Positioning

No competitor in the AI optimization space (MachineContext, Mersel, HypoText, Prerender.io, DualWeb.AI, 11+ total) offers an integrated agent readiness + agent interaction assessment as part of a comprehensive crawlability diagnostic. AgentReady.tools offers a standalone "AI Readiness Score" with paid tiers ($19-79/mo), and isagentready.com provides standalone accessibility tree scanning. The GEO scoring tools (SearchScore, Orchly, ViaMetric, AI Crawler Check, AmICitable) check metadata signals but not agent-actionable data availability. CrawlReady's unified diagnostic (AI Readiness Score headline + three sub-scores + EU checklist) provides a differentiated integrated view no competitor offers.

---

## Strategic Implications

1. **TAM expansion:** The agent readiness framing expands the addressable market from GEO optimization ($1–1.5B) to agentic AI infrastructure ($7.6B). Same product architecture, much larger market.
2. **Churn reduction:** Agent readiness has direct, measurable value (structured data = better agent evaluation = more conversions) independent of the ~15% citation factor ceiling that limits the crawlability value prop.
3. **Future-proofing:** If AI crawlers eventually render JS (solving the CSR invisibility problem), the Agent Readiness Score retains its value — structured data and content negotiation matter regardless of rendering capability.
4. **Pricing support:** Agent readiness infrastructure commands higher willingness-to-pay ($199–999/mo) than format optimization ($29–49/mo) because the value is closer to revenue impact.

---

## Decisions

- **Phase 0 scope:** Add 3 agent-readiness checks (structured data, content negotiation, machine-actionable data) to the diagnostic. These use existing crawl data plus 2 lightweight HTTP requests.
- **Score display:** Show Agent Readiness Score and Agent Interaction Score as secondary metrics alongside the primary Crawlability Score. All three scores displayed on a single score page. Do not split them into separate products.
- **Messaging:** Phase 0 marketing leads with the Crawlability Score (stronger CSR hook). Agent Readiness Score is the expansion story for Phase 1+ and for SSR sites where the crawlability hook is weaker.
- **Agent Readiness Score components deferred to Phase 1+:** MCP endpoint discovery, commerce protocol compatibility, agent authentication readiness.

Sources: `digitalapplied.com/blog/agentic-ai-statistics-2026-definitive-collection-150-data-points`, `nevermined.ai/blog/model-context-protocol-adoption-statistics`, `nerq.ai/report/q1-2026`, `skillsindex.dev/blog/state-of-ai-agent-tools-february-2026`, `openai.com/blog/buy-it-in-chatgpt`, `ucpchecker.com/blog/first-autonomous-ai-agent-purchase-ucp`, `wearepresta.com/ai-shopping-agents-the-strategic-guide-to-agentic-commerce-in-2026/`
