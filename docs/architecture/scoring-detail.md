# Architecture: Scoring Detail — Implementable Rubrics

Check-by-check scoring specification for all three sub-scores and the unified AI Readiness Score. This is the single source of truth for scoring implementation. Compiled April 2026.

For the composite formula, weights, display, and floor rule, see `docs/architecture/scoring-algorithm.md`. This document specifies **how each sub-score is computed**.

---

## Unified AI Readiness Score

```
AI Readiness Score = round(
  min(
    (0.50 × Crawlability) + (0.25 × Agent Readiness) + (0.25 × Agent Interaction),
    floor_cap
  )
)
```

**Floor rule:** If any sub-score < 20, the unified score is capped at 60.

**Order of operations:**
1. Compute each sub-score (0-100)
2. Compute weighted average
3. Apply floor cap if any sub-score < 20
4. Round to nearest integer

---

## Sub-Score 1: Crawlability Score (0-100)

Measures: Can AI crawlers see your content?

### Input Data

- **Rendered HTML:** Full page HTML from JS-rendered crawl (via crawling provider)
- **Bot HTML:** Raw HTTP response with `User-Agent: GPTBot/1.0` (no JS rendering)
- **Markdown:** Markdown conversion of rendered page (from crawling provider or own conversion)

### Checks

#### C1. Content Visibility Ratio (0-35 points)

Compares text content visible in the rendered page vs. text present in the bot HTML.

**Calculation:**
```
rendered_text = extractVisibleText(rendered_html)
bot_text = extractVisibleText(bot_html)
visibility_ratio = len(bot_text) / len(rendered_text)
```

| Ratio | Points | Interpretation |
|---|---|---|
| ≥ 0.90 | 35 | Excellent — nearly all content visible to bots |
| 0.70 – 0.89 | 25 | Good — most content visible, some JS-dependent sections |
| 0.50 – 0.69 | 15 | Fair — significant content missing |
| 0.20 – 0.49 | 8 | Poor — majority of content is JS-rendered only |
| < 0.20 | 0 | Critical — content is invisible to bots |

**Edge cases:**
- If rendered page has < 50 characters of text, score this check 0 (empty page)
- If bot HTML returns non-200 status, score this check 0
- Ignore whitespace-only differences

#### C2. Structural Clarity (0-25 points)

Checks the presence and quality of semantic HTML structure in the bot-visible HTML.

| Check | Points | Condition |
|---|---|---|
| Has `<h1>` | 5 | Exactly one `<h1>` present |
| Has heading hierarchy | 5 | At least one `<h2>`, no skipped levels (e.g., h1→h3 without h2) |
| Has `<p>` content | 5 | At least 3 `<p>` tags with > 20 chars each |
| Has lists or tables | 5 | At least one `<ul>`, `<ol>`, or `<table>` with content |
| Has `<meta description>` | 5 | Non-empty `<meta name="description">` present |

**Source:** Bot HTML (what crawlers actually receive).

#### C3. Noise Ratio (0-20 points)

Measures the ratio of useful content to total HTML payload in the bot HTML.

**Calculation:**
```
content_tokens = tokenize(extractVisibleText(bot_html))
total_tokens = tokenize(bot_html)
noise_ratio = 1 - (len(content_tokens) / len(total_tokens))
```

Tokenization: split on whitespace and punctuation. This is an approximation — exact LLM tokenization is not needed.

| Noise Ratio | Points | Interpretation |
|---|---|---|
| < 0.60 | 20 | Clean — content dominates the payload |
| 0.60 – 0.74 | 14 | Moderate noise — typical for well-built sites |
| 0.75 – 0.89 | 7 | Noisy — scripts, styles, and nav dominate |
| ≥ 0.90 | 0 | Extremely noisy — content is buried |

#### C4. Schema.org Presence (0-20 points)

Checks for Schema.org JSON-LD in the bot HTML.

| Check | Points | Condition |
|---|---|---|
| Any JSON-LD present | 5 | At least one `<script type="application/ld+json">` block |
| Valid JSON-LD | 5 | Parses as valid JSON with `@type` property |
| Rich type present | 5 | Type is one of: Product, FAQPage, HowTo, SoftwareApplication, Organization, Article, WebPage with meaningful properties |
| Multiple types or nested | 5 | Two or more Schema types, or one type with > 5 properties |

**Source:** Bot HTML.

### Crawlability Score Total

```
Crawlability = C1 + C2 + C3 + C4
```

Range: 0-100.

---

## Sub-Score 2: Agent Readiness Score (0-100)

Measures: Can AI agents act on your content?

### Input Data

- **Bot HTML:** Raw HTTP response (same as Crawlability)
- **Rendered HTML:** JS-rendered page (same as Crawlability)
- **Markdown probe response:** HTTP response to `Accept: text/markdown` request
- **llms.txt response:** HTTP response to `GET /llms.txt`
- **robots.txt response:** HTTP response to `GET /robots.txt` (same request as bot-view, may already be fetched)
- **Sitemap probe response:** HTTP HEAD response to `GET /sitemap.xml`
- **Well-known probes:** HTTP HEAD responses to `/.well-known/mcp/server-card.json` and `/.well-known/api-catalog`

### Checks

#### A1. Structured Data Completeness (0-25 points)

*Reduced from 30 to 25 points (April 2026 Cloudflare review) to accommodate the new A4 Standards Adoption category.*

| Check | Points | Condition |
|---|---|---|
| OpenGraph basics present | 4 | `og:title` AND `og:description` AND `og:image` present |
| OpenGraph type present | 2 | `og:type` present (not just the three basics) |
| Schema.org with key properties | 6 | JSON-LD present with ≥ 3 meaningful properties beyond `@type` and `name` |
| Product/pricing data structured | 7 | Schema.org `Product` or `SoftwareApplication` with `offers` property, OR pricing data in `<table>` with machine-readable structure |
| Twitter Card metadata | 2 | `twitter:card` + `twitter:title` present |
| Canonical URL | 4 | `<link rel="canonical">` present with valid URL |

#### A2. Content Negotiation Readiness (0-25 points)

*Reduced from 30 to 25 points (April 2026 Cloudflare review) to accommodate the new A4 Standards Adoption category.*

| Check | Points | Condition |
|---|---|---|
| `Accept: text/markdown` returns Markdown | 12 | Server responds with `Content-Type: text/markdown` or body starts with `#` and contains Markdown syntax |
| llms.txt present | 7 | `GET /llms.txt` returns 200 with non-empty body |
| JSON feed or API docs link | 6 | Page contains link to `/api`, `/docs`, or `<link rel="alternate" type="application/json">` |

**Implementation:** The Markdown probe and llms.txt check are 2 of the additional HTTP requests per scan (5 total for Agent Readiness — see A4 for the other 3).

The Markdown probe sends:
```
GET {url}
Accept: text/markdown
User-Agent: CrawlReady/1.0
```

If the server responds with Markdown content (detected by Content-Type header or heuristic: starts with `#`, contains `##`, `- `, `` ``` ``), award 12 points.

#### A3. Machine-Actionable Data Availability (0-30 points)

*Reduced from 40 to 30 points (April 2026 Cloudflare review) to accommodate the new A4 Standards Adoption category.*

| Check | Points | Condition |
|---|---|---|
| Key facts in structured HTML | 9 | Pricing, features, or contact info present in `<table>`, `<dl>`, or Schema.org (from bot HTML, not just rendered) |
| Clear heading hierarchy | 6 | H1 → H2 → content pattern with no more than 1 skipped level |
| Actionable CTAs discoverable | 8 | Links with text containing "sign up", "get started", "pricing", "docs", "api", "contact" are present as `<a>` tags in bot HTML |
| No critical data behind JS only | 7 | If rendered page has pricing/feature data, at least 50% is also present in bot HTML (uses visibility ratio from C1 applied to structured elements only) |

#### A4. Standards Adoption (0-20 points)

*New category added April 2026 (Cloudflare Agent Readiness review). Measures adoption of emerging AI agent standards. See `docs/research/cloudflare-agent-readiness.md` for analysis.*

| Check | Points | Condition |
|---|---|---|
| robots.txt AI bot rules | 5 | robots.txt contains at least one `User-agent` rule for an AI crawler (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Meta-ExternalAgent, Bytespider). Award 5 if any explicit `Allow` or `Disallow` rules exist for AI bots. Award 3 if only a generic `User-agent: *` rule exists with no AI-specific entries. Award 0 if no robots.txt or no relevant rules. |
| Content Signals directive | 3 | robots.txt contains a `Content-Signal:` directive (per contentsignals.org spec). Must include at least one of `ai-train`, `ai-input`, or `search` parameters. Currently 4% adoption across top 200K domains (Cloudflare Radar, April 2026). |
| Sitemap.xml presence | 4 | `HEAD /sitemap.xml` returns HTTP 200. Award 4 for 200 response with XML content-type. Award 2 for 200 response with non-XML content-type. Award 0 for 404 or error. |
| Link Headers (RFC 8288) | 3 | HTTP response headers contain at least one `Link:` header with a discovery-relevant `rel` value (`api-catalog`, `describedby`, `service-doc`, `alternate`, `canonical`). Zero additional HTTP cost — parsed from existing response headers. |
| MCP Server Card | 3 | `HEAD /.well-known/mcp/server-card.json` returns HTTP 200. Currently <15 sites in the top 200K support this (Cloudflare Radar, April 2026). Early adopters are rewarded. |
| API Catalog (RFC 9727) | 2 | `HEAD /.well-known/api-catalog` returns HTTP 200. Currently <15 sites support this. Relevant for API-heavy sites (CrawlReady's ICP). |

**Implementation:** robots.txt and Link Headers are parsed from HTTP responses already fetched — zero additional requests. Sitemap, MCP Server Card, and API Catalog require 3 additional HEAD requests (lightweight, parallel). Total Agent Readiness HTTP budget is 5 requests per scan (2 existing + 3 new HEAD).

**Scoring note:** A typical B2B SaaS site today scores 3-8 out of 20 on A4 (has robots.txt with generic rules, has sitemap.xml, nothing else). Fully standards-compliant sites score 15-20. The low baseline creates room for improvement recommendations.

### Agent Readiness Score Total

```
Agent Readiness = A1 + A2 + A3 + A4
```

Range: 0-100.

---

## Sub-Score 3: Agent Interaction Score (0-100)

Measures: Can visual AI agents navigate your site?

### Input Data

- **Rendered DOM:** The full rendered HTML from the JS-rendered crawl (via crawling provider). All checks analyze the rendered DOM — this is what visual agents see.

### Checks

#### I1. Semantic HTML Quality (0-25 points)

| Check | Points | Condition |
|---|---|---|
| Uses semantic elements | 8 | At least 3 of: `<nav>`, `<main>`, `<header>`, `<footer>`, `<article>`, `<section>` present |
| Buttons are `<button>` | 7 | ≥ 80% of clickable elements with click handlers are `<button>` or `<a>`, not `<div>` or `<span>` with `onclick` |
| Forms use `<form>` | 5 | All `<input>` elements are inside a `<form>` element |
| Landmark completeness | 5 | Has `<main>` AND at least one `<nav>` |

**Detection of "clickable div" pattern:** Look for `<div>` or `<span>` elements with `onclick`, `role="button"`, or `cursor: pointer` style. Compare count to `<button>` and `<a>` elements.

#### I2. Interactive Element Accessibility (0-30 points)

| Check | Points | Condition |
|---|---|---|
| Buttons/links have text or aria-label | 12 | ≥ 90% of `<button>` and `<a>` elements have non-empty text content or `aria-label`/`aria-labelledby` |
| Form inputs have labels | 8 | ≥ 80% of `<input>`, `<select>`, `<textarea>` elements have an associated `<label>` (via `for` attribute or wrapping) or `aria-label` |
| No icon-only buttons | 5 | No `<button>` elements where the only child is an `<svg>` or `<img>` without `aria-label` |
| Reasonable click target sizes | 5 | No interactive element smaller than 24x24px (from inline styles or computed dimensions if available) |

#### I3. Navigation & Content Structure (0-25 points)

| Check | Points | Condition |
|---|---|---|
| Skip navigation or clear sections | 5 | Has `<a href="#main-content">` or `<a href="#content">` skip link, OR has `<main>` with `id` attribute |
| No hover-only content | 8 | No critical content inside CSS `:hover` pseudo-class only (heuristic: check for `display: none` on elements that become visible on parent hover). This is an approximation — award points by default and deduct only if hover-only patterns are detected. |
| Content not behind infinite scroll | 7 | Page has < 3 "load more" or infinite scroll patterns (detect: `IntersectionObserver` usage, "load more" buttons, `scroll` event listeners — heuristic, award partial credit) |
| Internal navigation links | 5 | At least 3 internal `<a>` links present in `<nav>` elements |

#### I4. Visual-Semantic Consistency (0-20 points)

| Check | Points | Condition |
|---|---|---|
| No hidden text affecting layout | 7 | No elements with `visibility: hidden`, `opacity: 0`, or `position: absolute; left: -9999px` that contain > 50 chars of text |
| Icon fonts have labels | 7 | Elements with Font Awesome, Material Icons, or similar icon font classes have `aria-label` or adjacent text |
| Image alt text present | 6 | ≥ 70% of `<img>` elements with `src` have non-empty `alt` attribute |

### Agent Interaction Score Total

```
Agent Interaction = I1 + I2 + I3 + I4
```

Range: 0-100.

---

## EU AI Act Transparency Checklist

Binary checklist — does NOT affect the numeric score. Displayed separately as "X/4 checks passed."

| Check | Pass Condition |
|---|---|
| Content Provenance | Page contains `<meta name="author">` or Schema.org `author` property |
| Content Transparency | Page contains `<meta name="generator">` or visible "About" / "Imprint" link |
| Machine-Readable Marking | Any Schema.org JSON-LD present with `@type` property |
| Structured Data Provenance | Schema.org JSON-LD includes `publisher` or `creator` property |

**Source:** Bot HTML for all four checks.

---

## Worked Examples

### Example 1: Pure CSR SPA (React, no SSR)

| Check | Score | Reason |
|---|---|---|
| C1. Visibility ratio | 0 | Bot sees `<div id="root"></div>` — ratio ≈ 0.01 |
| C2. Structural clarity | 0 | Bot HTML has no headings, no paragraphs |
| C3. Noise ratio | 0 | Bot HTML is 99% scripts |
| C4. Schema.org | 0 | No JSON-LD in bot HTML |
| **Crawlability** | **0** | |
| A1. Structured data | 4 | Has basic OG tags in `<head>` (static) |
| A2. Content negotiation | 0 | No Markdown response, no llms.txt |
| A3. Machine-actionable | 0 | All data behind JS |
| A4. Standards adoption | 5 | Has robots.txt with generic rules (3), has sitemap.xml (2) |
| **Agent Readiness** | **9** | |
| I1. Semantic HTML | 15 | React app has decent semantic elements in rendered DOM |
| I2. Accessibility | 15 | Some aria-labels, some gaps |
| I3. Navigation | 12 | Has nav, no skip link |
| I4. Visual-semantic | 10 | Decent alignment, some icon-only buttons |
| **Agent Interaction** | **52** | |
| **AI Readiness Score** | **15** | (0×0.5 + 9×0.25 + 52×0.25 = 15.25, rounded) |

Floor rule does not apply further (14 < 60 already). Note: Crawlability < 20 AND Agent Readiness < 20, so cap at 60 applies — but 14 < 60 so no effect.

### Example 2: Well-Built SSR Site (Next.js, no Schema)

| Check | Score | Reason |
|---|---|---|
| C1. Visibility ratio | 25 | 75% of content visible in bot HTML (some client components) |
| C2. Structural clarity | 20 | Good heading hierarchy, meta description, some lists |
| C3. Noise ratio | 14 | Moderate noise — Next.js hydration scripts |
| C4. Schema.org | 0 | No JSON-LD |
| **Crawlability** | **59** | |
| A1. Structured data | 6 | OG tags complete, no Schema.org |
| A2. Content negotiation | 0 | No Markdown response, no llms.txt |
| A3. Machine-actionable | 14 | Pricing in HTML table, good hierarchy, CTAs visible |
| A4. Standards adoption | 8 | Has robots.txt with AI bot rules (5), has sitemap.xml (3) |
| **Agent Readiness** | **28** | |
| I1. Semantic HTML | 22 | Good semantic usage, minor gaps |
| I2. Accessibility | 22 | Most elements labeled, a few icon-only buttons |
| I3. Navigation | 20 | Good nav structure, no skip link |
| I4. Visual-semantic | 16 | Good alignment, image alts mostly present |
| **Agent Interaction** | **80** | |
| **AI Readiness Score** | **57** | (59×0.5 + 28×0.25 + 80×0.25 = 56.5, rounded) |

### Example 3: Fully Optimized Site

| Check | Score | Reason |
|---|---|---|
| **Crawlability** | **92** | Near-perfect visibility, clean structure, rich Schema |
| **Agent Readiness** | **88** | Full OG, rich Schema, Markdown response, llms.txt, AI bot rules, Content Signals, sitemap, MCP server card |
| **Agent Interaction** | **88** | Strong semantics, full accessibility, good nav |
| **AI Readiness Score** | **90** | (92×0.5 + 88×0.25 + 88×0.25 = 90, rounded) |

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Crawling provider timeout | Score all checks 0 for the affected crawl. Display "Scan incomplete — site did not respond within 30s." |
| Bot-view returns 403/429 | Crawlability checks that use bot HTML score 0. Display "This site blocks AI crawlers (HTTP {status})." Still score Agent Interaction from rendered DOM. |
| Bot-view returns redirect to different domain | Follow up to 3 redirects. If final URL is different domain, flag as "Redirects AI crawlers to {domain}" and score bot-dependent checks on the redirected content. |
| Page is behind login | Score based on what the logged-out page shows. Display "This page requires authentication — scoring the public version." |
| Page returns non-HTML (PDF, JSON) | Display "This URL returns {content-type}, not HTML. The diagnostic works on HTML pages." Score 0. |
| Empty page (< 50 chars rendered) | Score 0 across all sub-scores. Display "This page appears to be empty." |

---

## Scoring Version

Every scan stores a `scoring_version` field (integer). The current version is **2**.

- **Version 1:** Initial scoring algorithm (A1+A2+A3 for Agent Readiness).
- **Version 2:** Added A4 Standards Adoption category (April 2026, Cloudflare Agent Readiness review). Rebalanced A1 (30→25), A2 (30→25), A3 (40→30), added A4 (0-20). Total remains 100.

When thresholds, checks, or weights change, increment the version. Historical scans are never rescored — they retain their original version. The score page displays the version only if it differs from the current version ("Scored with algorithm v2 — rescan for latest").

---

## Decisions

- **EU AI Act checklist:** Binary only, does NOT affect the numeric AI Readiness Score.
- **Scoring version:** Stored per scan as an integer. Version 1 at launch.
- **Text extraction:** Use a simple "extract visible text" function (strip tags, normalize whitespace). Do not use LLM-based extraction — too slow and expensive for scoring.
- **Heuristic tolerance:** Agent Interaction checks (hover-only content, infinite scroll) are heuristic. Award benefit of the doubt — deduct only when patterns are clearly detected.
- **Crawling provider independence:** Checks are defined in terms of HTML/DOM properties, not provider-specific response fields. The `CrawlProvider` abstraction feeds data; scoring code never imports a provider SDK.
- **A4 Standards Adoption (April 2026 Cloudflare review):** New category added to Agent Readiness sub-score. Six checks measuring adoption of emerging AI agent standards. Points redistributed from A1/A2/A3 to keep total at 100. See `docs/research/cloudflare-agent-readiness.md` for the competitive analysis that motivated this change.
- **HTTP request budget:** Agent Readiness now uses 5 additional HTTP requests per scan (up from 2). Three new HEAD requests (sitemap.xml, MCP server card, API catalog) run in parallel. Total scan latency impact: <500ms.
- **OAuth discovery deferred:** Considered for A4 but deferred to Phase 1 to avoid scope creep. The check (`HEAD /.well-known/oauth-authorization-server`) is relevant but adds a 6th HTTP request and targets a narrower ICP segment.
