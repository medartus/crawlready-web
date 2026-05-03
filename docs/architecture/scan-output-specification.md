# Architecture: Scan Output Specification

The complete rules and logic for turning raw scan data into actionable, evidence-backed output. Every score line shows measured data, a plain-language interpretation, and a specific action. This is the single source of truth for what scan results contain and how they communicate value.

**Scope:** Phase 0 diagnostic scan output only. For score computation, see `scoring-detail.md`. For scan orchestration, see `scan-workflow.md`. For the API contract shell, see `api-first.md`.

---

## Principle: Evidence First, Always

Every output line follows this structure:

```
[What we measured] → [What it means] → [What to do]
```

**Rules:**
1. Never show a score without the measured value that produced it (ratio, count, presence/absence).
2. Never show a measured value without a plain-language sentence explaining what it means for AI visibility.
3. Never show a problem without a specific, verifiable action to fix it.
4. Numbers are supporting evidence, not the output. The output is a sentence.

**Bad output:** "Content Visibility: 8/35 points"
**Good output:** "23% of your visible text reaches AI crawlers. The other 77% is rendered by JavaScript and invisible to GPTBot, ClaudeBot, and PerplexityBot."

---

## Check-by-Check Output Specification

Each check produces a structured output object stored in `scoreBreakdown` (JSONB). The UI and API both consume this structure.

### Output Object Shape (per check)

```typescript
interface CheckOutput {
  id: string;                    // e.g. "c1_visibility"
  name: string;                  // user-facing label
  category: 'crawlability' | 'agent_readiness' | 'agent_interaction';
  points: number;                // awarded points
  maxPoints: number;             // maximum for this check
  severity: 'critical' | 'warning' | 'good' | 'excellent';
  evidence: Record<string, any>; // measured values (check-specific)
  interpretation: string;        // plain-language sentence
  action: string | null;         // one-line fix (null if score is excellent)
}
```

### Severity Mapping (universal)

| Points % of Max | Severity | Meaning |
|---|---|---|
| 0-25% | `critical` | Broken or absent. Fix immediately. |
| 26-59% | `warning` | Present but degraded. Should improve. |
| 60-84% | `good` | Works for most AI consumers. Minor gaps. |
| 85-100% | `excellent` | No action needed. |

---

### Crawlability Checks (C1-C4)

#### C1. Content Visibility Ratio (0-35 pts)

**Evidence fields:**
```typescript
{
  rendered_text_length: number;   // chars of visible text in rendered DOM
  bot_text_length: number;        // chars of visible text in bot HTML
  visibility_ratio: number;       // bot / rendered (0.0-1.0)
  invisible_sections: string[];   // detected sections missing from bot HTML
  bot_status_code: number;        // HTTP status of bot-view fetch
}
```

**Interpretation templates:**

| Ratio | Template |
|---|---|
| >= 0.90 | "{ratio}% of your visible text reaches AI crawlers. Your content is fully accessible." |
| 0.70-0.89 | "{ratio}% of your visible text reaches AI crawlers. Some sections ({invisible_count} detected) are JavaScript-rendered and invisible to GPTBot, ClaudeBot, and PerplexityBot." |
| 0.50-0.69 | "Only {ratio}% of your visible text reaches AI crawlers. {invisible_count} major sections are invisible, including: {invisible_list}." |
| 0.20-0.49 | "Only {ratio}% of your content is visible to AI crawlers. Most of your page ({rendered_text_length} characters) is rendered by JavaScript and never seen by AI bots." |
| < 0.20 | "AI crawlers see almost nothing. Your page has {rendered_text_length} characters of content for humans, but only {bot_text_length} characters in the raw HTML. {invisible_count} content sections are completely invisible." |
| bot returns non-200 | "AI crawlers receive an HTTP {bot_status_code} error when requesting your page. No content is accessible." |

**Action templates:**

| Ratio | Action |
|---|---|
| >= 0.90 | null (no action needed) |
| 0.70-0.89 | "Move the {invisible_count} JavaScript-rendered sections to server-side rendering. {framework_specific_hint}" |
| 0.50-0.69 | "Your content rendering strategy leaves significant gaps. Implement server-side rendering for content-critical routes. {framework_specific_hint}" |
| < 0.50 | "Your page content is invisible to AI crawlers. Add server-side rendering to make your content accessible. {framework_specific_hint}" |
| bot returns 403/429 | "Your server blocks requests with AI crawler User-Agents. Review your firewall, WAF, or bot protection rules to allow GPTBot, ClaudeBot, and PerplexityBot." |

---

#### C2. Structural Clarity (0-25 pts)

**Evidence fields:**
```typescript
{
  has_h1: boolean;
  h1_count: number;              // flag if > 1
  has_heading_hierarchy: boolean;
  skipped_levels: string[];      // e.g. ["h1→h3 (missing h2)"]
  paragraph_count: number;       // <p> tags with > 20 chars
  has_lists_or_tables: boolean;
  has_meta_description: boolean;
  meta_description_length: number;
}
```

**Interpretation template:**

Build from components:
- h1: "Your page {has|is missing} a `<h1>` heading." If count > 1: "Your page has {h1_count} `<h1>` headings (should be exactly 1)."
- Hierarchy: "Heading hierarchy is {clean|broken}: {skipped_levels_detail}."
- Paragraphs: "Found {paragraph_count} content paragraphs." If < 3: "AI crawlers find very little structured text content."
- Lists/tables: "{Has|No} structured data elements (lists or tables)."
- Meta description: "{Has a|Missing} meta description{' ({meta_description_length} chars)' if present}."

**Combined interpretation example:**
"Your page has a `<h1>` heading with a clean hierarchy, but only 2 content paragraphs and no structured data elements. Meta description is present (148 chars). AI crawlers can parse the structure but find limited extractable content."

**Action:** Focus on the lowest-scoring sub-check. Examples:
- Missing h1: "Add a single `<h1>` element containing the primary topic of this page."
- Skipped levels: "Fix heading hierarchy: add an `<h2>` between your `<h1>` and `<h3>` elements."
- Few paragraphs: "Break your content into clearly separated paragraphs using `<p>` tags. AI crawlers extract information from paragraph boundaries."
- No lists/tables: "Structure key facts (pricing, features, specs) using `<table>`, `<ul>`, or `<dl>` elements. AI systems extract structured data more reliably than free-form text."
- No meta description: "Add `<meta name=\"description\" content=\"...\">` summarizing this page in 150-160 characters."

---

#### C3. Noise Ratio (0-20 pts)

**Evidence fields:**
```typescript
{
  content_tokens: number;     // visible text tokens in bot HTML
  total_tokens: number;       // all tokens in bot HTML
  noise_ratio: number;        // 1 - (content / total)
  html_size_bytes: number;    // total bot HTML size
  estimated_content_bytes: number; // extractable content size
}
```

**Interpretation templates:**

| Noise | Template |
|---|---|
| < 0.60 | "Your HTML is clean: {content_tokens} content tokens out of {total_tokens} total ({noise_pct}% noise). AI crawlers parse your content efficiently." |
| 0.60-0.74 | "Moderate noise: {noise_pct}% of your HTML is scripts, styles, and navigation. AI crawlers extract content from {content_tokens} useful tokens out of {total_tokens}." |
| 0.75-0.89 | "Your HTML is noisy: {noise_pct}% is non-content markup. AI crawlers must filter through {total_tokens} tokens to find {content_tokens} tokens of actual content." |
| >= 0.90 | "Your content is buried: only {content_pct}% of your HTML ({content_tokens} tokens) is actual content. The remaining {noise_pct}% is scripts, styles, navigation, and tracking code." |

**Action templates:**

| Noise | Action |
|---|---|
| < 0.60 | null |
| 0.60-0.74 | "Consider deferring non-critical scripts and moving inline styles to external files to reduce HTML payload." |
| 0.75-0.89 | "Remove inline `<script>` and `<style>` blocks from your initial HTML. Load analytics, chat widgets, and tracking code asynchronously. Target under 60% noise." |
| >= 0.90 | "Your HTML payload ({html_size_bytes} bytes) contains only {estimated_content_bytes} bytes of content. Strip inline scripts, move CSS to external files, and defer non-essential elements. AI crawlers waste context window on your noise." |

---

#### C4. Schema.org Presence (0-20 pts)

**Evidence fields:**
```typescript
{
  json_ld_blocks: number;        // count of <script type="application/ld+json">
  valid_json_ld: boolean;        // parses as valid JSON with @type
  types_found: string[];         // e.g. ["Organization", "WebPage"]
  is_rich_type: boolean;         // Product, FAQPage, HowTo, etc.
  property_count: number;        // total properties across all blocks
  raw_json_ld: object[];         // the actual parsed JSON-LD (for preview)
}
```

**Interpretation templates:**

| State | Template |
|---|---|
| No JSON-LD | "No Schema.org markup detected. AI systems cannot extract structured facts (product type, pricing, organization) from your page." |
| Invalid JSON-LD | "{json_ld_blocks} JSON-LD block(s) found, but the markup is invalid and will be ignored by AI systems." |
| Valid, generic type | "Schema.org markup found: {types_joined}. This provides basic identity signals but lacks the attribute-rich data (pricing, FAQs, specs) that drives AI citations." |
| Valid, rich type | "Rich Schema.org markup found: {types_joined} with {property_count} properties. This gives AI systems structured, extractable data about your {type_description}." |

**Action templates:**

| State | Action |
|---|---|
| No JSON-LD | "Add Schema.org JSON-LD to your page. Start with {recommended_type} based on your content. CrawlReady detected patterns for: {generatable_types}." |
| Invalid JSON-LD | "Fix your existing JSON-LD markup: {validation_error}. Use Google's Rich Results Test to validate." |
| Generic only | "Upgrade your {types_found} Schema to include more properties. Add `offers` to Product, `mainEntity` to FAQPage, or `step` to HowTo. Attribute-rich Schema drives 62% citation rate vs. 42% for generic." |
| Rich type, < 5 props | "Your {types_found} Schema has {property_count} properties. Add more attributes to strengthen the signal: {missing_properties_hint}." |
| Rich type, >= 5 props | null |

---

### Agent Readiness Checks (A1-A4)

#### A1. Structured Data Completeness (0-25 pts)

**Evidence fields:**
```typescript
{
  og_basics: { title: boolean; description: boolean; image: boolean };
  og_type: boolean;
  schema_key_props: { present: boolean; count: number };
  product_pricing: { detected: boolean; format: 'schema' | 'table' | 'none' };
  twitter_card: { card: boolean; title: boolean };
  canonical_url: { present: boolean; url: string | null };
}
```

**Interpretation:** Build from sub-checks:
- OG tags: "OpenGraph metadata: {present_list} present{, missing: {missing_list}}."
- Schema with props: "{count} meaningful Schema.org properties found." or "No Schema.org properties beyond basic type."
- Product/pricing: "Pricing data is {in structured Schema.org format | in an HTML table | not in a machine-readable format}."
- Twitter Card: "Twitter Card metadata is {complete | incomplete | missing}."
- Canonical: "Canonical URL is {set to {url} | missing}."

**Action:** Address the highest-value missing item first:
1. Missing canonical → "Add `<link rel=\"canonical\" href=\"{current_url}\">` to prevent duplicate content in AI indexes."
2. Missing OG basics → "Add `og:title`, `og:description`, and `og:image` meta tags. AI search engines use these as content summaries."
3. No Schema key props → "Add Schema.org JSON-LD with at least 3 meaningful properties beyond `@type` and `name`."
4. Pricing not structured → "Move your pricing data into Schema.org `Product` markup with `offers` property, or structure it in an HTML `<table>`."
5. Missing Twitter Card → "Add `twitter:card` and `twitter:title` meta tags."

---

#### A2. Content Negotiation Readiness (0-25 pts)

**Evidence fields:**
```typescript
{
  markdown_probe: {
    status_code: number;
    content_type: string;
    is_markdown: boolean;        // detected as Markdown response
    response_size: number;
  };
  llms_txt: {
    found: boolean;
    url_tried: string[];         // /.well-known/llms.txt, /llms.txt
    content_size: number | null;
  };
  json_feed_or_api_docs: {
    found: boolean;
    type: 'api_link' | 'json_feed' | 'docs_link' | null;
    url: string | null;
  };
}
```

**Interpretation templates:**

- Markdown probe: "Your server {returns Markdown content | returns HTML regardless of format request | returns {status_code}} when AI agents request `Accept: text/markdown`."
- llms.txt: "llms.txt file {found at {url} ({content_size} bytes) | not found at /.well-known/llms.txt or /llms.txt}."
- API/JSON: "Machine-readable API or documentation link {found ({type}: {url}) | not detected}."

**Action templates:**
- No Markdown response: "Configure your server to respond with Markdown when clients send `Accept: text/markdown`. This is the emerging standard for AI agent content negotiation. {framework_hint}"
- No llms.txt: "Create an llms.txt file at `/.well-known/llms.txt` describing your site's content for AI systems. Keep it under 8,000 tokens for agent context windows."
- No API docs link: "Add a `<link rel=\"alternate\" type=\"application/json\" href=\"/api\">` tag or include a visible link to API documentation if your product has one."

---

#### A3. Machine-Actionable Data Availability (0-30 pts)

**Evidence fields:**
```typescript
{
  key_facts_structured: {
    found: boolean;
    types: ('pricing' | 'features' | 'contact')[];
    format: 'schema' | 'table' | 'dl' | 'text_only';
  };
  heading_hierarchy: {
    clean: boolean;
    max_skip: number;            // 0 = perfect, 1 = one level skipped
  };
  actionable_ctas: {
    found: string[];             // link texts detected: "sign up", "get started", etc.
    count: number;
    in_bot_html: boolean;        // present in non-JS HTML
  };
  js_gated_data: {
    has_pricing_in_rendered: boolean;
    has_pricing_in_bot: boolean;
    structured_visibility_ratio: number; // for structured elements specifically
  };
}
```

**Interpretation:**
- Key facts: "Key business information (pricing, features, contact) is {in {format} format | not in a machine-readable format}. AI agents {can | cannot} extract it without visual rendering."
- Heading hierarchy: "Content hierarchy is {clean | has gaps (skips {max_skip} level{s})}."
- CTAs: "{count} actionable links found ({found_joined}). {All are | Some are not} visible in the raw HTML."
- JS-gated data: "Your pricing data is {visible in both rendered and raw HTML | only visible after JavaScript renders, invisible to AI crawlers}."

**Action:** Prioritize by impact:
1. JS-gated pricing/features → "Your {type} section is only available after JavaScript runs. Move it to server-rendered HTML so AI agents can extract it. This is the single highest-impact fix for agent readiness."
2. Broken hierarchy → "Fix heading skip: use `<h2>` under `<h1>`, `<h3>` under `<h2>`. AI agents use heading hierarchy to understand content structure."
3. Key facts not structured → "Move your {types} into `<table>`, `<dl>`, or Schema.org markup. Free-form text is harder for agents to parse than structured elements."
4. CTAs not in bot HTML → "Your signup/pricing links are JavaScript-rendered. Add them as standard `<a>` tags in server-rendered HTML."

---

#### A4. Standards Adoption (0-20 pts, 6 sub-checks)

**Evidence fields:**
```typescript
{
  robots_txt: {
    found: boolean;
    has_ai_bot_rules: boolean;
    ai_bots_mentioned: string[];  // ["GPTBot", "ClaudeBot", ...]
    has_generic_only: boolean;
    raw_relevant_lines: string[]; // the actual rules found
  };
  content_signals: {
    found: boolean;
    parameters: string[];         // ["ai-train", "ai-input", "search"]
  };
  sitemap: {
    found: boolean;
    status_code: number;
    content_type: string;
  };
  link_headers: {
    found: boolean;
    rel_values: string[];         // ["canonical", "alternate", ...]
  };
  mcp_server_card: {
    found: boolean;
    status_code: number;
  };
  api_catalog: {
    found: boolean;
    status_code: number;
  };
}
```

**Interpretation:** One line per sub-check:
- robots.txt: "robots.txt {has explicit rules for {ai_bots_joined} | has only generic rules | not found}."
- Content Signals: "Content Signals directive {found ({parameters_joined}) | not found}. This declares your AI training and indexing preferences."
- Sitemap: "sitemap.xml {found | not found}."
- Link Headers: "HTTP Link headers {found ({rel_values_joined}) | not present}."
- MCP Server Card: "MCP Server Card at /.well-known/mcp/server-card.json: {found | not found}. {note: < 15 sites in top 200K support this}"
- API Catalog: "API Catalog at /.well-known/api-catalog: {found | not found}."

**Summary line:** "{n}/6 AI agent standards adopted. The typical B2B SaaS site supports 2-3."

**Actions** (only for missing items, ordered by effort/impact):
1. No sitemap → "Create a sitemap.xml at your site root. Most frameworks generate this automatically."
2. No AI bot rules → "Add explicit `User-agent` rules in robots.txt for AI crawlers (GPTBot, ClaudeBot, PerplexityBot). Specify what you allow and disallow."
3. No Content Signals → "Add a `Content-Signal: ai-train=yes, ai-input=yes, search=yes` directive to robots.txt to declare your AI preferences."
4. No Link Headers → "Add `Link` response headers with `rel=\"canonical\"` or `rel=\"alternate\"` to help agents discover related resources."
5. No MCP Server Card → "If your product has an API, expose an MCP Server Card at `/.well-known/mcp/server-card.json` to make it discoverable by AI agents."
6. No API Catalog → "If your product has multiple APIs, expose an API Catalog (RFC 9727) at `/.well-known/api-catalog`."

---

### Agent Interaction Checks (I1-I4)

#### I1. Semantic HTML Quality (0-25 pts)

**Evidence fields:**
```typescript
{
  semantic_elements: {
    found: string[];              // ["nav", "main", "header", "footer", ...]
    count: number;
  };
  clickable_div_ratio: {
    div_span_clickable: number;   // <div>/<span> with onclick, role="button", cursor:pointer
    button_anchor: number;        // <button> + <a> elements
    ratio: number;                // button_anchor / total clickable
  };
  forms_valid: {
    inputs_in_form: number;
    inputs_total: number;
    ratio: number;
  };
  landmarks: {
    has_main: boolean;
    has_nav: boolean;
  };
}
```

**Interpretation:**
- Semantic elements: "Found {count} semantic elements ({found_joined}). {Good variety | Missing key landmarks like <main> or <nav>}."
- Clickable divs: "{ratio}% of clickable elements use proper `<button>` or `<a>` tags. {remaining} use `<div>` or `<span>` with click handlers, which AI agents cannot reliably identify as interactive."
- Forms: "{forms_valid.ratio}% of input elements are inside `<form>` wrappers."
- Landmarks: "Page {has | is missing} `<main>` landmark. {has | is missing} `<nav>` landmark."

**Action (highest priority first):**
1. Clickable div ratio < 80% → "Replace `<div onclick>` and `<span role=\"button\">` elements with native `<button>` or `<a>` tags. AI agents identify interactive elements by their HTML tag, not by CSS or JavaScript behavior."
2. Missing `<main>` → "Wrap your primary content in a `<main>` element. This is the primary landmark AI agents use to locate page content."
3. Missing `<nav>` → "Wrap your navigation links in a `<nav>` element."
4. Low semantic count → "Replace generic `<div>` containers with semantic elements: `<header>`, `<footer>`, `<article>`, `<section>` where appropriate."

---

#### I2. Interactive Element Accessibility (0-30 pts)

**Evidence fields:**
```typescript
{
  labeled_interactive: {
    labeled: number;
    total: number;
    ratio: number;
  };
  form_labels: {
    labeled: number;
    total: number;
    ratio: number;
  };
  icon_only_buttons: {
    count: number;
    examples: string[];           // first 3 element descriptions
  };
  small_click_targets: {
    count: number;
    examples: string[];           // first 3 element descriptions
  };
}
```

**Interpretation:**
- Labeled interactive: "{ratio}% of buttons and links have accessible text or aria-label. {unlabeled} interactive elements have no label and are invisible to AI agents."
- Form labels: "{ratio}% of form inputs have associated labels."
- Icon-only buttons: "{count} button(s) contain only an icon with no text label. AI agents cannot determine their purpose. Examples: {examples_joined}."
- Small targets: "{count} interactive element(s) smaller than 24x24px. Visual AI agents may miss these."

**Action:**
1. Icon-only buttons → "Add `aria-label` to icon-only buttons. Example: `<button aria-label=\"Close menu\"><svg>...</svg></button>`."
2. Unlabeled interactive elements → "Add visible text or `aria-label` to all `<button>` and `<a>` elements. AI agents identify actions by reading button labels."
3. Unlabeled form inputs → "Associate `<label>` elements with form inputs using the `for` attribute, or add `aria-label` to each input."
4. Small click targets → "Increase the minimum size of interactive elements to 24x24px (CSS `min-width`, `min-height`, or `padding`)."

---

#### I3. Navigation & Content Structure (0-25 pts)

**Evidence fields:**
```typescript
{
  skip_link: boolean;
  hover_only_content: {
    detected: boolean;
    count: number;
  };
  infinite_scroll: {
    detected: boolean;
    pattern_count: number;
  };
  internal_nav_links: {
    count: number;
    in_nav_element: boolean;
  };
}
```

**Interpretation:**
- Skip link: "Skip navigation link {found | not found}."
- Hover-only: "{count} content section(s) {are only | No content is} accessible via CSS hover. AI agents cannot hover."
- Infinite scroll: "{pattern_count} infinite scroll or 'load more' pattern(s) detected. AI agents only see content in the initial page load."
- Nav links: "{count} internal navigation links found{', properly wrapped in <nav>' | ', but not inside a <nav> element'}."

**Action:**
1. Hover-only content → "Move content out of CSS `:hover` states. Make it visible by default or use a toggle button instead. AI agents cannot trigger hover effects."
2. Infinite scroll → "Ensure important content is in the initial HTML, not behind 'load more' buttons or infinite scroll. Link to dedicated pages instead of loading content dynamically."
3. No skip link → "Add a skip-to-content link: `<a href=\"#main-content\" class=\"sr-only\">Skip to content</a>` as the first focusable element."
4. Nav links not in `<nav>` → "Wrap your navigation links inside a `<nav>` element."

---

#### I4. Visual-Semantic Consistency (0-20 pts)

**Evidence fields:**
```typescript
{
  hidden_text: {
    count: number;
    total_chars: number;
    examples: string[];           // first 3 snippets
  };
  unlabeled_icons: {
    count: number;
    examples: string[];
  };
  image_alt_text: {
    with_alt: number;
    total: number;
    ratio: number;
  };
}
```

**Interpretation:**
- Hidden text: "{count} element(s) with {total_chars} characters of visually hidden text detected. This text may confuse AI agents about page content."
- Unlabeled icons: "{count} icon font element(s) without accessible labels. AI agents see these as empty elements."
- Image alt text: "{ratio}% of images have alt text ({with_alt}/{total})."

**Action:**
1. Hidden text → "Review visually hidden text elements. If the text is not relevant to page content, remove it. If it is (e.g., screen reader text), keep it but ensure it matches the visual content."
2. Unlabeled icons → "Add `aria-label` attributes to icon font elements (Font Awesome, Material Icons, etc.). Example: `<i class=\"fa fa-search\" aria-label=\"Search\"></i>`."
3. Low alt ratio → "Add descriptive `alt` attributes to images. Use `alt=\"\"` for purely decorative images."

---

## Visual Diff Specification

The side-by-side diff is the "aha moment" — the visual proof that makes the problem real.

### What is Compared

| Panel | Source | Content |
|---|---|---|
| **Left: Human View** | Rendered DOM (from crawl provider, JS-executed) | Extracted visible text, preserving heading levels and paragraph breaks |
| **Right: Bot View** | Bot HTML (direct HTTP GET with GPTBot UA, no JS) | Extracted visible text from raw HTML |

Both panels show **text content only** (not screenshots). Headings, paragraphs, lists, and tables are preserved as structural elements. Navigation, footers, and chrome are stripped from both views to focus on content.

### Diff Highlighting Rules

```
Color coding:
  Green  — text present in BOTH human and bot views (AI-visible)
  Red    — text present in human view ONLY (AI-invisible, JS-rendered)
  Yellow — text present in bot view ONLY (hidden from humans, potential SEO issue)
```

### Summary Line

"**{invisible_section_count} content sections visible to humans are invisible to AI crawlers**, accounting for {invisible_char_count} characters ({invisible_pct}% of page content)."

If invisible_section_count == 0: "All visible content is accessible to AI crawlers."

### Section Detection

Content is segmented into "sections" by heading boundaries or major structural elements (`<section>`, `<article>`, `<div>` with > 200 chars). Each section gets a label:
- Named sections use the heading text: "Pricing", "Features", "FAQ"
- Unnamed sections use a positional label: "Section 3 (below 'Features')"

### Missing Section Detail

For each red (AI-invisible) section, show:
```
❌ "Pricing" — 1,240 characters of content invisible to AI crawlers
   Contains: 3 pricing tiers, comparison table, CTA buttons
```

### Edge Cases

| Scenario | Display |
|---|---|
| Empty page (< 50 chars rendered) | "This page appears empty. No content detected for humans or AI crawlers." |
| Bot returns 403/429 | "Your server returned HTTP {status} to AI crawlers. The bot view shows the error page." Show error response in right panel. |
| Bot returns redirect to different domain | "AI crawlers are redirected to {redirect_domain}. The bot view shows what they see after redirect." |
| Page requires login | "This page requires authentication. Showing the logged-out version." |
| Non-HTML response | "This URL returns {content_type}, not HTML. The visual diff is not available for non-HTML content." |
| Both views identical | "Your content is fully visible to AI crawlers. No JavaScript-dependent sections detected." Show both panels (green only). |

---

## Recommendation Engine Logic

### Recommendation Object Shape

```typescript
interface Recommendation {
  id: string;                     // stable ID for dedup: "rec_c1_add_ssr"
  title: string;                  // "Make your pricing section visible to AI crawlers"
  why: string;                    // business impact (never "improves your score")
  evidence: string;               // what was found
  fix: string;                    // specific action with code if applicable
  code_snippet?: {
    language: string;
    framework: string;            // "next.js" | "react" | "vue" | "generic"
    code: string;
  };
  estimated_impact: string;       // "+15-25 points on Crawlability"
  effort: 'low' | 'medium' | 'high';
  verification: string;           // how to confirm the fix worked
  category: 'crawlability' | 'agent_readiness' | 'agent_interaction';
  depends_on?: string[];          // IDs of prerequisite recommendations
  blocked_reason?: string;        // why this is deprioritized
}
```

### Priority Ordering Rules

Recommendations are sorted by this priority chain:

1. **Unblocked before blocked.** If a recommendation has `blocked_reason`, it sorts after all unblocked recs.
2. **Critical before warning.** Group by severity of the originating check.
3. **Higher estimated point impact first** within the same severity.
4. **Lower effort first** within the same impact range.

### Dependency Graph (blocking rules)

These rules prevent recommending polish when fundamentals are broken:

```
IF C1 (visibility) points < 9 (< 25%):
  BLOCK all Schema recommendations (C4, A1)
  BLOCK content negotiation recommendations (A2)
  SET blocked_reason: "Fix content visibility first.
    These improvements add no value when AI crawlers
    cannot see your content."

IF C2 (structural clarity) points < 7 (< 25%):
  BLOCK A3 (machine-actionable data) recommendations
  SET blocked_reason: "Fix HTML structure first.
    Structured data checks depend on a parseable
    heading hierarchy."

IF C1 points < 9 AND A4 (standards) recommendations exist:
  DO NOT BLOCK A4 — standards adoption (robots.txt, sitemap)
    is always actionable regardless of content visibility.
  ADD note: "This improves how AI systems discover your site,
    but fixing content visibility (above) has higher impact."

Agent Interaction (I1-I4) recommendations are NEVER blocked.
  They are always independently actionable.
```

### Framework Detection Heuristics

The scan detects the site's framework from the rendered DOM and bot HTML to provide framework-specific fix code:

| Signal | Detected Framework |
|---|---|
| `__NEXT_DATA__` script tag or `_next/` in asset URLs | Next.js |
| `__NUXT__` global or `_nuxt/` in asset URLs | Nuxt.js (Vue) |
| `ng-version` attribute or `ng-app` attribute | Angular |
| `data-svelte` attributes or `__sveltekit` | SvelteKit |
| `<div id="root">` + React-specific data attributes | React (CRA/Vite) |
| `<div id="app">` + Vue-specific data attributes | Vue (Vite) |
| Generator meta tag containing framework name | As specified |
| None of the above | Generic |

**Rule:** If framework is detected with high confidence, show framework-specific code snippets. If detection is uncertain, show generic guidance with a note: "We detected this may be a {framework} site. If this is wrong, here's the generic approach."

### Framework-Specific Fix Examples (C1 — Content Visibility)

**Next.js (App Router):**
```typescript
// Convert client component to server component
// Before (client-rendered, invisible to AI crawlers):
'use client'
export default function Pricing() { /* ... */ }

// After (server-rendered, visible to AI crawlers):
// Remove 'use client' directive — component renders on server by default
export default async function Pricing() {
  const plans = await getPlans(); // server-side data fetch
  return <PricingTable plans={plans} />;
}
```

**React (CRA/Vite — no SSR):**
```
Your site uses client-side React without server rendering.
AI crawlers receive an empty <div id="root"></div>.

Options (ordered by effort):
1. Migrate to Next.js (recommended for new projects)
2. Add react-snap for static prerendering (quick fix)
3. Add a prerender service (e.g., Prerender.io) for bot requests
```

**Vue/Nuxt:**
```typescript
// Ensure data fetching happens server-side
// Before (client-only):
const { data } = useFetch('/api/pricing', { server: false })

// After (server-rendered):
const { data } = useFetch('/api/pricing') // server: true is default
```

**Generic:**
```
Options for making content visible to AI crawlers:
1. Server-side rendering (SSR): render HTML on the server before sending
2. Static site generation (SSG): pre-build pages at deploy time
3. Prerendering service: detect bot requests and serve pre-rendered HTML
```

---

## Schema Generation Preview Logic

### Pattern Detection Rules

The scan analyzes the rendered DOM for content patterns that map to Schema.org types:

| Schema Type | Detection Patterns | Confidence Threshold |
|---|---|---|
| **FAQPage** | Headings ending in `?` (>= 3), `<details>`/`<summary>` pairs (>= 2), "FAQ" in heading text | >= 3 patterns = high, 2 = medium |
| **Product** | Pricing tables, plan/tier comparison layouts, `$`/`€`/`£` in structured elements, "pricing" heading | >= 2 patterns = high, 1 = medium |
| **HowTo** | Numbered/ordered lists under instructional headings, "step" or "guide" in headings, sequential `<ol>` content | >= 3 steps = high, 2 = medium |
| **Organization** | Logo image, company name pattern, address/contact info, social media links | >= 3 signals = high, 2 = medium |

### Preview Output

```typescript
interface SchemaPreview {
  existing_types: string[];        // Schema types already on the page
  generatable: {
    type: string;                  // "FAQPage"
    confidence: 'high' | 'medium';
    items_detected: number;        // e.g. 5 Q&A pairs
    sample_json_ld: object;        // truncated preview
  }[];
  summary: string;                 // "0 types detected, 2 generatable"
}
```

### Display Rules

**Public (no email required):**
- Count of existing Schema types
- List of generatable types with confidence and item count
- Summary line: "{existing} Schema.org types found on your page. CrawlReady can generate: {generatable_list}."

**Email-gated:**
- Full JSON-LD preview for each generatable type (expandable)
- Validation notes (any quality concerns with generated markup)

### Messaging

- If existing types > 0 AND generatable = 0: "Your Schema.org markup is comprehensive. No additional types detected."
- If existing = 0 AND generatable > 0: "No Schema.org markup on your page. CrawlReady detected content patterns for {n} Schema types that could improve AI citation by up to 62%."
- If existing > 0 AND generatable > 0: "Found {existing_count} Schema types. {generatable_count} additional types could be generated from your content."

---

## EU AI Act Transparency Checklist Output

Four binary checks displayed separately from the numeric score. Does NOT affect the AI Readiness Score.

### Check Output Format

```typescript
interface EuAiActCheck {
  name: string;
  passed: boolean;
  evidence: string;               // what was found or missing
  fix: string;                    // how to pass this check
}
```

### Check Details

| Check | Pass Evidence | Fail Evidence | Fix |
|---|---|---|---|
| Content Provenance | "`<meta name=\"author\">` found: {value}" or "Schema.org `author` property found" | "No author metadata detected in HTML or Schema.org" | "Add `<meta name=\"author\" content=\"Your Name or Company\">` to your page `<head>`." |
| Content Transparency | "`<meta name=\"generator\">` found: {value}" or "About/Imprint link found" | "No generator meta tag or About/Imprint page link detected" | "Add `<meta name=\"generator\" content=\"Your CMS or Framework\">` or include a visible link to an About or Imprint page." |
| Machine-Readable Marking | "Schema.org JSON-LD found with `@type`: {type}" | "No Schema.org JSON-LD with `@type` property detected" | "Add any valid Schema.org JSON-LD block with an `@type` property." |
| Structured Data Provenance | "Schema.org JSON-LD includes `publisher`: {name}" or "Schema.org includes `creator`" | "Schema.org JSON-LD present but missing `publisher` or `creator` property" | "Add a `publisher` or `creator` property to your Schema.org JSON-LD." |

### Display

```
EU AI Act Transparency: {passed}/4 checks passed
Deadline: August 2, 2026

✓ Content Provenance — Author metadata found
✗ Content Transparency — No generator or About page detected
✓ Machine-Readable Marking — Schema.org WebPage found
✗ Structured Data Provenance — Missing publisher property
```

If all 4 pass: "Your page meets EU AI Act Article 50 transparency requirements."
If < 4 pass: "{4-passed} check(s) require attention before the August 2, 2026 deadline."

---

## Score Page Narrative Structure

The score page tells a story from headline to action. This is the reading order:

### 1. Headline (above the fold)

```
AI Readiness Score: {score}/100
"{band_message}"                    ← from scoring-algorithm.md bands
```

Three sub-score cards immediately below:
```
Crawlability: {score}   Agent Readiness: {score}   Agent Interaction: {score}
```

### 2. Visual Diff (the proof)

The side-by-side comparison. Summary line above:
"{n} sections visible to humans are invisible to AI crawlers"

### 3. Priority Action (single most impactful fix)

One highlighted card with the top recommendation:
```
🔴 Highest Impact Fix
{recommendation.title}
{recommendation.evidence}
{recommendation.fix}
Estimated impact: {recommendation.estimated_impact}
```

### 4. Sub-Score Drill-Down (expandable)

Three expandable sections, one per sub-score. Each shows:
- Sub-score with band
- Per-check results with evidence and severity indicator
- Per-check action (if not excellent)

### 5. Full Recommendations (ordered list)

All recommendations in priority order (section 4 logic). Public: top 3 shown. Email-gated: full list.

### 6. Schema Generation Preview

What CrawlReady detected and what it could generate.

### 7. EU AI Act Checklist (expandable, tertiary)

Binary checklist with deadline messaging.

### 8. CTAs

- "Track your AI crawler visits" → Clerk signup (analytics onboarding)
- "Get notified when score changes" → email capture
- "Share this score" → copy URL button + social share

---

## API Response Contract: `scoreBreakdown`

The `scoreBreakdown` JSONB column stores the complete evidence for all checks. This is the authoritative data source for both the score page UI and the `GET /api/v1/score/{domain}` API response.

### Shape

```typescript
interface ScoreBreakdown {
  version: number;                // scoring_version (2)
  computed_at: string;            // ISO 8601 timestamp
  framework_detected: string | null;

  crawlability: {
    score: number;
    checks: {
      c1_visibility: CheckOutput;
      c2_structural_clarity: CheckOutput;
      c3_noise_ratio: CheckOutput;
      c4_schema_presence: CheckOutput;
    };
  };

  agent_readiness: {
    score: number;
    checks: {
      a1_structured_data: CheckOutput;
      a2_content_negotiation: CheckOutput;
      a3_machine_actionable: CheckOutput;
      a4_standards_adoption: CheckOutput & {
        sub_checks: {
          robots_txt: SubCheckOutput;
          content_signals: SubCheckOutput;
          sitemap: SubCheckOutput;
          link_headers: SubCheckOutput;
          mcp_server_card: SubCheckOutput;
          api_catalog: SubCheckOutput;
        };
      };
    };
  };

  agent_interaction: {
    score: number;
    checks: {
      i1_semantic_html: CheckOutput;
      i2_accessibility: CheckOutput;
      i3_navigation: CheckOutput;
      i4_visual_semantic: CheckOutput;
    };
  };

  visual_diff: {
    rendered_text_length: number;
    bot_text_length: number;
    invisible_sections: {
      label: string;
      char_count: number;
      content_summary: string;
    }[];
    invisible_pct: number;
    summary: string;
  };
}

interface SubCheckOutput {
  id: string;
  name: string;
  points: number;
  maxPoints: number;
  evidence: Record<string, any>;
  interpretation: string;
}
```

### API Response Additions

The `GET /api/v1/score/{domain}` response (defined in `api-first.md`) is extended to include `score_breakdown` when requested via query parameter `?detail=full`:

```
GET /api/v1/score/example.com?detail=full
```

Default response (no `detail` param): scores + recommendations + schema_preview (current contract, unchanged).

Full response (`detail=full`): adds `score_breakdown` with all evidence fields above.

---

## Decisions

- **Evidence-first principle:** Every check output includes measured values and a plain-language interpretation. Numbers alone are never the output.
- **Framework detection:** Best-effort from HTML signals. Shows framework-specific code when detected with confidence. Falls back to generic guidance.
- **Recommendation blocking:** Prevents recommending Schema or structured data improvements when content is invisible. Standards adoption (A4) is never blocked.
- **Visual diff is text-based:** Shows extracted text, not screenshots. Cheaper to generate, easier to diff, works in API responses and CLI output.
- **Schema preview gating:** Detection + counts are public. Full JSON-LD preview is email-gated.
- **EU AI Act separate from score:** Binary checklist does not affect the numeric AI Readiness Score. Displayed as tertiary expandable section.
- **`scoreBreakdown` is the single source:** Both the UI and API consume the same JSONB structure. No separate data paths.
- **`detail=full` query param:** Avoids sending large evidence payloads by default. Full breakdown available on request.
- **Recommendation `depends_on`:** Enables the UI to show blocked recommendations with an explanation, not just hide them.

---

## Related Documents

- `scoring-detail.md` — check definitions and point allocations
- `scoring-algorithm.md` — composite score, bands, messaging
- `scan-workflow.md` — scan orchestration, state machine, partial failure strategy
- `api-first.md` — API contract, endpoint inventory
- `multi-format-serving.md` — Schema generation patterns
