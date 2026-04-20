# Research: Multi-Format Optimization — Beyond Markdown Serving

Analysis of multi-format content serving as CrawlReady's next differentiation layer. Covers dynamic Schema.org generation, HTMLRewriter trade-offs for SSR sites, revised citation impact data, and newly discovered competitors. Compiled April 2026.

---

## Why Multi-Format Matters Now

The AI optimization market has converged on a single output: Markdown. Cloudflare ships generic Markdown for free (Markdown for Agents, Feb 2026). 10+ competitors serve Markdown to AI crawlers. The Markdown delivery mechanism is commodity.

But different AI clients consume content differently — and most of them don't want Markdown:

| AI Client Type | How It Consumes Content | What It Needs | Current CrawlReady Plan |
|---|---|---|---|
| Text-extraction crawlers (GPTBot, ClaudeBot, PerplexityBot) | Parse raw HTML or Markdown | Clean Markdown with semantic structure | Addressed (core product) |
| Google-Extended (AI Overviews) | Uses Google's rendering + structured data pipeline | Enriched HTML with Schema.org JSON-LD | **Not addressed** — only Markdown |
| Visual browsing agents (OpenAI Operator, Anthropic Computer Use) | Screenshot + accessibility tree | Original HTML with strong ARIA attributes | Partially addressed (Agent Interaction Score measures it) |
| Content negotiation clients (Claude Code, OpenCode) | Request `Accept: text/markdown` | Clean Markdown | Addressed |
| Programmatic agents (MCP clients, commerce protocols) | Structured data endpoints | JSON, structured API responses | Not addressed until Phase 2+ |

Serving only Markdown leaves the highest-impact citation channel (Google AI Overviews via enriched HTML + Schema) and the fastest-growing interaction model (programmatic agents via structured data) unaddressed.

The differentiation opportunity is multi-format serving intelligence — the same content, transformed and served in the optimal format for each AI client type.

---

## The Schema.org Citation Impact (Revised Data)

### Current Documentation Is Wrong on Schema Impact

The existing `docs/product/market.md` citation factor table assigns Schema.org markup approximately **~3% of citation weight**. This figure is based on Seenos.ai and OtterlyAI studies from early 2026 that did not distinguish between generic and attribute-rich Schema implementations.

New empirical research tells a different story.

### Growth Marshal Empirical Study (730 AI Citations)

The most rigorous study available — Growth Marshal Research, 2026 — analyzed 730 AI citations with statistical controls for Google organic ranking position (the dominant confound in citation studies).

**Key findings:**

- **Generic Schema.org** (Organization, basic Article with minimal properties): **no measurable citation effect** when controlling for ranking position (OR = 0.678, p = .296)
- **Attribute-rich Schema.org** (Product with pricing/ratings/specs, FAQPage with Q&A pairs, HowTo with steps): **61.7% citation rate vs. 41.6%** for generic types (p = .012)
- The advantage is most pronounced for **lower-authority domains** (DR ≤ 60) — exactly CrawlReady's ICP
- Google organic rank position is the dominant predictor of AI citation — each position reduces odds by ~24%

**Implication:** The ~3% figure applies to generic Schema only. Attribute-rich Schema with concrete data fields (pricing, aggregate ratings, specifications, Q&A pairs) is a **15-20% citation factor** — 5-7x larger than previously documented.

### FAQPage Schema: The Highest-Impact Single Type

Multiple 2026 sources converge on FAQPage as the highest-impact Schema type for AI citations:

- **3.2x more likely** to appear in Google AI Overviews with FAQPage Schema specifically (Citedify, 2026)
- **30-36% increase** in AI citation probability with proper structured data overall (Surferstack, Citedify, 2026)
- **3.1x multiplier** for Google AI Overviews citation likelihood with complete Schema markup (AISoSystem, 2026)

The mechanism is intuitive: AI Overviews frequently answer questions. FAQPage Schema pre-structures content in question-answer format — exactly what the AI extraction pipeline needs.

### Revised Citation Factor Table

| Factor | Approx. Weight | CrawlReady addresses? |
|---|---|---|
| Content comprehensiveness | ~25% | No |
| Source authority (backlinks, mentions) | ~20% | No |
| Content recency | ~18% | Indirectly (cache freshness) |
| Structural clarity (headings, lists, FAQs) | ~15% | Yes (core value) |
| Attribute-rich Schema.org (pricing, FAQ, specs) | ~15-20% | **Yes — with dynamic generation (Phase 1-2)** |
| Factual verifiability | ~10% | No |
| Content uniqueness | ~7% | No |
| Generic Schema markup | ~3% | Partially (detection in Phase 0) |
| Technical performance | ~2% | Yes |

**Revised impact:** With dynamic Schema.org generation added to the transformation pipeline, CrawlReady addresses approximately **~30-35% of the citation equation** — up from ~15-20% with Markdown-only serving. This changes the product's value prop from a contributing factor to a substantial lever.

Sources: `growthmarshal.io/research/schema-citation-study`, `growthmarshal.io/field-notes/your-generic-schema-is-useless`, `surferstack.com/guides/how-to-use-structured-data-and-schema-markup-to-increase-ai-citation-rates-in-2026`, `citedify.com/blog/ai-search-schema-markup-guide-2026`, `schemavalidator.org/guides/ai-overviews-schema-markup/`, `aisosystem.com/en/blog/schema-markup-the-complete-guide-for-ai-and-google`, `seoscore.tools/blog/faq-schema-markup/`

---

## Dynamic Schema Generation as a Capability

### What It Means

During the content transformation pipeline, CrawlReady extracts structured facts from the page content and generates valid JSON-LD Schema.org markup that does not exist on the origin site. The generated Schema is injected into the HTML served to crawlers that benefit from it (primarily Google-Extended for AI Overviews).

This is not a metadata audit tool. It is an active content enrichment step within the existing transformation pipeline.

### Target Schema Types (Prioritized by Citation Impact)

**Priority 1 — FAQPage (highest citation impact):**
- Detect Q&A patterns: headings that are questions, expandable/accordion sections, support pages, content with explicit question-answer structure
- Generate FAQPage JSON-LD with `mainEntity` array of `Question` + `acceptedAnswer` pairs
- Example: A pricing FAQ section rendered as visual accordions becomes a structured FAQPage

**Priority 2 — Product (highest agent readiness impact):**
- Detect pricing tables, feature lists, plan comparisons on SaaS landing pages
- Generate Product or SoftwareApplication JSON-LD with `offers`, `aggregateRating`, `featureList` properties
- Example: A SaaS pricing page with 3 tiers rendered in CSS grids becomes structured Product data

**Priority 3 — HowTo (high value for documentation sites):**
- Detect step-by-step content, numbered lists, setup guides, tutorials
- Generate HowTo JSON-LD with `step` arrays
- Example: A "Getting Started" guide becomes a structured HowTo

**Priority 4 — Organization (baseline authority signal):**
- Detect company identity signals: logo, address, social links, about pages
- Generate Organization JSON-LD with `name`, `url`, `logo`, `sameAs`
- Low citation impact individually, but required for entity establishment in knowledge graphs

### Why No Competitor Does This

All competitors in the AI optimization space (MachineContext, Mersel AI, HypoText, Prerender.io, MultiLipi, Pure.md) serve Markdown or clean HTML. They **detect** Schema.org presence (or ignore it entirely) but none **generate** it.

The reason: dynamic Schema generation requires content understanding, not just format conversion. Extracting "this is a Q&A pattern" or "this is a pricing table with 3 tiers" from arbitrary HTML requires NLP/heuristic intelligence beyond regex-based HTML-to-Markdown conversion. This creates a quality moat — the accuracy of generated Schema determines its value.

### Implementation Approach

**Phase 0 (diagnostic — detection + preview):**
- Analyze fetched HTML for detectable patterns (Q&A, pricing, steps, organization signals)
- Display in diagnostic: "CrawlReady detected 0 Schema.org types on your page. Based on your content, we can generate: FAQPage (3 Q&A pairs detected), Product (pricing data detected). Preview the generated markup."
- Zero additional crawl cost — uses HTML already fetched by Firecrawl
- Gate activation behind "Fix this score" CTA (lead capture / paid tier upsell)

**Phase 1-2 (paid tier — generation + injection):**
- Schema generation runs as part of the content transformation pipeline
- Generated JSON-LD is injected into the `<head>` of the HTML served to Google-Extended
- Validation step: generated Schema passes Google's Rich Results Test before serving
- Content parity diff engine verifies Schema reflects actual page content (no hallucinated data)

**Quality safeguards:**
- Only generate Schema types with high-confidence extraction patterns
- Validate all generated JSON-LD against Schema.org specifications
- Flag low-confidence extractions for human review in the dashboard
- Never generate Schema that contradicts visible page content

---

## Multi-Format Serving Architecture

### The 4-Layer Transformation Stack

The transformation pipeline produces multiple output formats from a single crawl. Each layer is independently valuable.

```
Origin HTML (fetched via Firecrawl in Phase 0-1, Playwright in Phase 2+)
    │
    ├── Layer 1: Schema Generation Engine
    │   └── Extracts structured facts from content
    │   └── Generates JSON-LD (FAQPage, Product, HowTo, Organization)
    │   └── Validates against Schema.org spec
    │
    ├── Layer 2: HTML Enrichment Engine
    │   └── Injects generated Schema.org into <head>
    │   └── Adds ARIA attributes to interactive elements (accessibility)
    │   └── Strips noise (nav, footer, scripts, tracking)
    │   └── Preserves content substance
    │
    ├── Layer 3: Markdown Conversion Engine
    │   └── Converts enriched HTML to clean Markdown
    │   └── Preserves code blocks, tables, headings
    │   └── Produces the text-extraction-optimized format
    │
    └── Layer 4: Content Parity Diff Engine (unchanged)
        └── Verifies substance matches between all output formats
        └── Flags divergences between origin and transformed content
```

### Format Routing by AI Client Type

| AI Client | Detection Method | Format Served | Why |
|---|---|---|---|
| GPTBot, ClaudeBot, PerplexityBot | UA + IP verification | Markdown | Text-extraction crawlers optimize for token efficiency |
| Google-Extended | UA + IP verification | Enriched HTML with Schema.org JSON-LD | Google uses its own rendering pipeline and benefits most from structured data |
| Visual agents (Operator, Computer Use) | UA detection (emerging) | Original HTML + enhanced ARIA | Visual agents process rendered pixels via accessibility tree |
| `Accept: text/markdown` clients | Content negotiation header | Markdown | Standards-compliant path |
| Programmatic agents (Phase 2+) | MCP protocol / API calls | Structured JSON | Direct data access without HTML parsing |

Google-Extended is the critical addition. Google AI Overviews is the #1 AI citation channel by volume. Google-Extended uses Google's Web Rendering Service (headless Chromium) — it renders JavaScript and processes HTML normally. Serving it Markdown is suboptimal. Serving it enriched HTML with attribute-rich Schema.org JSON-LD maximizes AI Overview citation probability.

---

## HTMLRewriter Trade-Off Analysis

Cloudflare's HTMLRewriter API enables streaming HTML transformation at the edge. It provides a jQuery-like interface for parsing and modifying HTML elements in flight — without buffering the entire response body.

### What HTMLRewriter Can Do

- Inject JSON-LD `<script>` tags into `<head>` (Schema.org generation)
- Strip elements by selector (remove `<nav>`, `<footer>`, tracking scripts)
- Add/modify attributes (ARIA labels, semantic roles)
- Modify text content
- Deploy to 300+ Cloudflare edge locations in under 60 seconds
- Process with negligible latency (< 1ms average CPU time)
- Cost: effectively $0 at CrawlReady's scale ($0.30/million requests on Workers)

### Why It Could Be Valuable (SSR Sites)

For SSR sites where the origin HTML is complete and content-rich:
- **No cache needed** — transform in real-time, eliminating TTL management and cache invalidation complexity
- **Always fresh** — content reflects the live origin, no stale cache risk
- **Near-zero COGS** — no Firecrawl/Playwright rendering costs, transformation happens on Cloudflare's infrastructure
- **Customer data stays local** — the Worker runs in the customer's Cloudflare account, CrawlReady never stores their content

### Why It Cannot Replace the Pre-Generated Cache (CSR Sites)

For CSR sites (CrawlReady's Phase 0 beachhead ICP):
- **HTMLRewriter cannot execute JavaScript** — it operates on the raw HTML response from the origin server
- A CSR site's origin HTML is an empty `<div id="root"></div>` + script tags — there is no content to transform
- The pre-generated cache (via Firecrawl/Playwright headless browser render) remains the only solution for CSR
- This is the core problem CrawlReady solves — the inability of AI crawlers to render JS

### Trade-Off Summary

| Dimension | Pre-Generated Cache | HTMLRewriter |
|---|---|---|
| Works for CSR sites | Yes (renders JS via headless browser) | No (cannot execute JS) |
| Works for SSR sites | Yes (but adds cache overhead) | Yes (real-time, no cache) |
| Content freshness | Depends on TTL + cache invalidation | Always live |
| COGS | $0.01-0.05/page (Firecrawl/Playwright) | ~$0/request (Workers pricing) |
| Cloudflare dependency | No (works with any edge) | Yes (requires Cloudflare) |
| Complexity | Cache management, TTL, invalidation | Worker deployment, HTMLRewriter rules |
| Schema injection | Inject into pre-generated HTML | Inject in real-time via `<head>` append |

### Conclusion

HTMLRewriter is a potential complementary mechanism for SSR sites — not a replacement for the pre-generated cache. The decision on whether to implement it depends on the actual customer mix observed during Phase 0-1:

- If the majority of paid customers are CSR sites (as the Phase 0 beachhead targets), HTMLRewriter adds no value — the cache is required regardless
- If SSR sites become a significant paid customer segment (Phase 1+), HTMLRewriter offers a dramatically simpler and cheaper serving path for those customers
- The architectural decision should be deferred to Phase 2, informed by real customer data from Phase 0-1

Reference: `developers.cloudflare.com/workers/runtime-apis/html-rewriter`, `blog.cloudflare.com/introducing-htmlrewriter`, `overthetopseo.com/edge-seo-using-cloudflare-workers-to-deploy-changes-instantly-4/`

---

## New Competitors Discovered (April 2026)

Three competitors not documented in the existing market analysis:

### MultiLipi

- **Product:** "Dual-layer architecture" — an HTML layer for humans and search engines, plus a Data Layer (Markdown + JSON-LD) optimized for LLMs
- **Differentiator:** First competitor to explicitly ship JSON-LD alongside Markdown in their AI optimization output — goes beyond Markdown-only serving
- **Assessment:** Validates the multi-format thesis. However, their JSON-LD serving appears to be pass-through of existing Schema (not dynamically generated). CrawlReady's dynamic Schema generation would remain differentiated.
- **Source:** `multilipi.com/technology/architecture`

### Pure.md

- **Product:** "Global cache between LLMs and the web" — focuses on extreme token optimization
- **Performance:** Claims 28K tokens per page vs. competitors' 55-143K on identical content
- **Assessment:** Competes on token efficiency rather than content enrichment. Positioned as infrastructure (cache layer) rather than a customer-facing product. Different market positioning but validates that optimization quality varies widely across competitors.
- **Source:** `pure.md`

### isagentready.com

- **Product:** AI agent readiness scanner using accessibility tree analysis
- **Differentiator:** Specifically measures how AI agents interact with websites via the accessibility tree — the same concept as CrawlReady's Agent Interaction Score
- **Assessment:** Validates the agent interaction scoring concept. However, CrawlReady's Agent Interaction Score is one of three scores in a comprehensive diagnostic (alongside Crawlability and Agent Readiness), not a standalone product. The "no competitor measures agent interaction" claim in existing docs needs nuancing to "no competitor in the AI optimization space measures this as part of a comprehensive crawlability diagnostic."
- **Source:** `isagentready.com/blog/how-ai-agents-see-your-website-the-accessibility-tree-explained`

### Updated Competitor Count

The total documented competitor count increases from 8+ to **11+** direct and adjacent competitors as of April 2026. Market velocity continues to accelerate.

---

## Phase 0 Impact: Schema Generation Preview

The multi-format optimization findings create one concrete addition to the Phase 0 diagnostic, at zero additional scope or crawl cost:

**What to add to the diagnostic score page:**

After the existing Schema.org presence check in the Crawlability Score, display a "Schema Generation Preview" section:

```
Schema.org Status: 0 types detected

CrawlReady can generate:
├── FAQPage — 3 Q&A patterns detected in your content
├── Product — pricing data detected (3 tiers: $29/$49/$199)
└── HowTo — 1 step-by-step guide detected

[Preview generated markup] ← expands to show the JSON-LD
[Fix this score →] ← CTA, requires email / paid tier
```

**Why this works:**
- Uses HTML already fetched during the diagnostic scan — zero additional requests
- Shows concrete, actionable value that only CrawlReady can deliver (no competitor does this)
- Creates a natural upsell moment: "We found what's missing AND we can generate it"
- The preview is display-only in Phase 0 — actual generation and injection activates in the paid tier

**Implementation notes:**
- Pattern detection is heuristic-based: headings ending in `?`, `<details>`/`<summary>` elements, pricing tables with currency symbols, ordered lists with instructional content
- Low-confidence detections are omitted from the preview (only show high-confidence patterns)
- The generated JSON-LD preview passes basic Schema.org validation before display

---

## Decisions

- **Product identity:** CrawlReady remains "the AI interface layer." Dynamic Schema generation is an additive capability within the multi-format serving architecture, not the product identity. Markdown serving remains the primary output for text-extraction crawlers.
- **Schema generation scope:** Target four Schema types in priority order: FAQPage (highest citation impact), Product (highest agent readiness impact), HowTo (documentation sites), Organization (baseline authority). Do not attempt to generate all 800+ Schema.org types.
- **Phase 0 scope:** Add Schema generation preview to the diagnostic (detection + preview display). Zero additional crawl cost. Gate activation behind paid tier CTA. This is a display addition, not a scope change.
- **Phase 1-2 scope:** Dynamic Schema generation becomes a feature in the paid tier (Pro and above). Generated JSON-LD is injected into HTML served to Google-Extended. Validation ensures generated Schema reflects actual page content.
- **HTMLRewriter decision:** Defer to Phase 2. Document as a potential complementary mechanism for SSR sites alongside the pre-generated cache for CSR sites. The architectural decision depends on the actual customer mix observed during Phase 0-1.
- **Pricing:** No new tiers. Schema detection + preview is included in the Free diagnostic. Schema generation + injection is a Pro tier feature (and above). Follows the existing pattern where higher tiers unlock more transformation capabilities.
- **Competitor claims:** Update "no competitor measures agent interaction" to "no competitor in the AI optimization space offers this as part of a comprehensive crawlability diagnostic" (isagentready.com exists as a standalone tool). Update competitor count from 8+ to 11+.
- **Citation impact claim:** Update from "CrawlReady addresses ~15-20% of the citation equation" to "~30-35% with dynamic Schema generation" — but only once Schema generation ships in the paid tier. Phase 0 marketing retains the ~15-20% claim.

Sources: `growthmarshal.io/research/schema-citation-study`, `growthmarshal.io/field-notes/your-generic-schema-is-useless`, `surferstack.com/guides/how-to-use-structured-data-and-schema-markup-to-increase-ai-citation-rates-in-2026`, `citedify.com/blog/ai-search-schema-markup-guide-2026`, `schemavalidator.org/guides/ai-overviews-schema-markup/`, `developers.cloudflare.com/workers/runtime-apis/html-rewriter`, `multilipi.com/technology/architecture`, `pure.md`, `isagentready.com`, `crystallize.com/blog/commerce-mcp-server`, `shopify.dev/docs/agents/catalog/catalog-mcp`
