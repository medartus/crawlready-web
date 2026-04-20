# Architecture: Crawling SaaS Provider Selection

Comparison of crawling SaaS providers for CrawlReady's diagnostic engine. The product requires JS rendering, structured output, and ideally custom User-Agent support to simulate how different AI bots see a page. Compiled April 2026.

---

## Requirements

CrawlReady's diagnostic needs a crawling provider that can:

1. **Render JavaScript** — CSR/SPA pages must be fully rendered to compare "what humans see" vs. "what bots see"
2. **Support custom User-Agent** — fetch as GPTBot, ClaudeBot, Googlebot to produce the per-bot diff
3. **Return structured output** — HTML + Markdown + metadata (title, description, links, images)
4. **Cost under $0.03/page** at scale — the free diagnostic must be sustainable at 3 scans/hr/IP
5. **Respond under 15 seconds** — user waits for the diagnostic result
6. **Handle bursts** — Show HN traffic could spike to dozens of concurrent scans
7. **Provide async support** — webhook or polling for long-running scrapes, needed for Vercel's function timeout

---

## Candidate Providers

### Firecrawl (firecrawl.dev)

**What it does:** Scrape, crawl, and extract web content. Returns Markdown, HTML, structured data. JS rendering via headless browser.

**Pricing (credit-based):**
- Free: 500 one-time credits
- Hobby: $16/mo (3,000 credits)
- Standard: $83/mo (100,000 credits)
- Growth: $333/mo (500,000 credits)
- 1 credit = 1 page scrape (base). JS rendering included at base cost.

**Effective cost:** ~$0.0008/page at Standard tier. Extremely competitive.

**Custom UA:** Supports `headers` parameter including `User-Agent`. Known bug in v2.0.8 where Playwright ignores custom UA — verify fix status before committing. Fallback: use the raw HTTP fetch for bot-view (no JS rendering, which is actually what bots see).

**Output:** Markdown, HTML, structured metadata, screenshots.

**Latency:** Typically 3-10s per page with JS rendering.

**Async:** Supports async scrape with webhook callback.

**Rate limits:** Free: 10 req/min. Standard: 500 req/min.

**Strengths:** Purpose-built for AI data extraction. Markdown output quality is high. Active development. Good SDK (TypeScript, Python).

**Weaknesses:** Custom UA bug needs verification. Startup (VC-funded) — long-term pricing stability unknown.

---

### Scrape.do

**What it does:** Proxy-based scraping API with JS rendering, anti-bot bypass, residential proxies.

**Pricing (credit-based):**
- Free: 1,000 credits/mo
- Hobby: $29/mo (250,000 credits)
- Pro: $99/mo (1,250,000 credits)
- Normal request: 1 credit. JS rendering: 5 credits. Residential + JS: 25 credits.

**Effective cost:** ~$0.0002/page (datacenter, no JS) to ~$0.001/page (JS rendering) at Hobby tier. Very cheap.

**Custom UA:** Full custom header support via `customHeaders=True`. Pass any User-Agent directly to the target. Reliable — this is a core proxy feature.

**Output:** Returns raw HTML response from the target. No built-in Markdown conversion. CrawlReady would need its own HTML-to-Markdown pipeline.

**Latency:** Varies. Datacenter: 1-5s. JS rendering: 5-15s.

**Async:** Supports async API with callback URL.

**Rate limits:** 5-200 concurrent requests depending on plan.

**Strengths:** Cheapest option. Reliable custom UA. Anti-bot bypass (Cloudflare, Akamai). 99.98% success rate claimed. Residential proxies available.

**Weaknesses:** Returns raw HTML only — no Markdown conversion, no metadata extraction. CrawlReady must build its own transformation layer. More of a proxy than a content extraction tool.

---

### Tavily (tavily.com)

**What it does:** AI-optimized search and extract API. Built for LLM applications. Returns structured content chunks.

**Pricing (credit-based):**
- Free: 1,000 credits/mo
- Project: $30/mo (4,000 credits)
- Bootstrap: $100/mo (15,000 credits)
- Basic extract: 1 credit per 5 URLs.

**Effective cost:** ~$0.006/page at Bootstrap tier. Moderate.

**Custom UA:** Not supported. Tavily abstracts away the request layer — no access to HTTP headers, UA, or request customization. This is a fundamental limitation for CrawlReady's per-bot diff feature.

**Output:** Extracted text content, chunked and ranked. Optional images. Not full HTML or Markdown.

**Latency:** 2-5s for extract.

**Async:** Not documented.

**Rate limits:** Credit-based throttling.

**Strengths:** AI-native API design. Good for content extraction and search. Chunk-based output with relevance ranking.

**Weaknesses:** No custom UA — cannot simulate bot-specific views. No raw HTML access. Not designed for page-level diagnostic analysis. Output is AI-optimized chunks, not the full page structure CrawlReady needs for scoring.

**Verdict:** Not suitable for CrawlReady's core diagnostic use case due to lack of custom UA and full-page output.

---

### Jina Reader API (jina.ai)

**What it does:** Convert any URL to LLM-friendly Markdown via `r.jina.ai/{url}`. Token-metered pricing.

**Pricing:**
- Free: 10M tokens
- Paid: ~$0.02 per million tokens

**Effective cost:** Extremely cheap for text-heavy pages. Cost varies by page size.

**Custom UA:** Not documented. The API is a URL-prefix service (`r.jina.ai/url`) — limited request customization.

**Output:** Markdown, JSON. CSS selector filtering available.

**Latency:** 1-5s typical.

**Async:** Not available.

**Rate limits:** 20-5,000 req/min depending on tier.

**Strengths:** Very cheap. Good Markdown quality. Simple API (URL prefix). Fast.

**Weaknesses:** No custom UA support. No raw HTML return option. No screenshot capability. Limited request customization. Cannot simulate bot-specific views.

**Verdict:** Useful as a secondary tool for Markdown conversion quality, but cannot be the primary provider due to lack of custom UA and HTML access.

---

## Comparison Matrix

| Criterion | Firecrawl | Scrape.do | Tavily | Jina Reader |
|---|---|---|---|---|
| **JS rendering** | Yes (headless browser) | Yes (`render=true`) | Partial | Yes |
| **Custom User-Agent** | Yes (verify bug fix) | Yes (full control) | No | No |
| **Output: HTML** | Yes | Yes (raw) | No | No |
| **Output: Markdown** | Yes (built-in) | No (DIY) | Chunks only | Yes |
| **Output: metadata** | Yes | No | Partial | Partial |
| **Output: screenshot** | Yes | No | No | No |
| **Cost/page (JS)** | ~$0.001 | ~$0.001 | ~$0.006 | ~$0.001 |
| **Latency (JS)** | 3-10s | 5-15s | 2-5s | 1-5s |
| **Async/webhook** | Yes | Yes | No | No |
| **Burst capacity** | 500 req/min (Standard) | 10-200 concurrent | Limited | 20-5k req/min |
| **Anti-bot bypass** | Basic | Advanced | N/A | Basic |

---

## CrawlReady's Scan Call Pattern

Each diagnostic scan requires:

1. **Rendered view** (what humans see): One JS-rendered scrape of the target URL. Returns full HTML + Markdown + metadata.
2. **Bot view** (what GPTBot sees): One HTTP fetch with `User-Agent: GPTBot/1.0` and no JS rendering. Returns raw HTML.
3. **Content negotiation probe:** One HTTP request with `Accept: text/markdown` header. Returns whatever the server sends.
4. **llms.txt check:** One HTTP GET to `{origin}/llms.txt`. Returns 200 or 404.

Calls 3 and 4 are lightweight HTTP requests — no JS rendering, no crawling provider needed. They can be made directly from the API route.

Call 1 requires the crawling provider (JS rendering).
Call 2 can use the crawling provider with custom UA and JS rendering disabled, OR a direct HTTP fetch from the API route.

**Minimum provider calls per scan:** 1 (rendered view only). The bot-view, content negotiation probe, and llms.txt check are direct HTTP requests from the backend — no provider cost.

---

## Recommendation

### Primary: Firecrawl

Firecrawl is the best fit for Phase 0:

- **Markdown + HTML + metadata + screenshots in one call** — exactly what the diagnostic needs
- **Custom UA support** (pending bug verification) for the bot-specific view
- **Async/webhook** support for Vercel function timeout management
- **Purpose-built for AI content extraction** — aligned with CrawlReady's use case
- **Active development** with SDK support
- **Competitive pricing** at $0.001/page

### Secondary consideration: Scrape.do

If Firecrawl's custom UA bug is not fixed, or if costs exceed expectations:

- **Reliable custom UA** is scrape.do's core strength
- **Cheapest option** at scale
- **Trade-off:** CrawlReady must build its own HTML-to-Markdown conversion and metadata extraction. This adds ~2-3 days of development but creates independence from any single provider's output format.

### Not recommended: Tavily, Jina Reader

Both lack custom UA support, which is essential for the per-bot diff feature. They could serve as supplementary tools (e.g., Markdown quality comparison) but not as the primary crawling provider.

---

## Abstraction Layer

Regardless of provider choice, CrawlReady's codebase must depend on a `CrawlProvider` interface, not a specific SDK. This enables:

- Swapping providers without changing scoring or UI code
- Using different providers for different scan steps (e.g., Firecrawl for rendered view, direct HTTP for bot view)
- Testing with a mock provider in development

```typescript
interface CrawlResult {
  url: string;
  html: string;
  markdown: string;
  metadata: {
    title: string;
    description: string;
    language: string;
    statusCode: number;
  };
  screenshot?: string; // base64 or URL
  timing: {
    totalMs: number;
    renderMs?: number;
  };
}

interface CrawlProvider {
  scrape(url: string, options?: {
    renderJs?: boolean;
    userAgent?: string;
    headers?: Record<string, string>;
    timeout?: number;
    screenshot?: boolean;
  }): Promise<CrawlResult>;
}
```

Phase 0 ships with `FirecrawlProvider` implementing this interface. If a switch is needed, only the adapter changes.

---

## Pre-Build Validation

Before committing to a provider, run the 100-crawl test described in `docs/research/validation-experiment.md`:

1. 25 CSR SPAs (React, Vue, Angular without SSR)
2. 25 SSR sites (Next.js, Nuxt, Remix)
3. 25 documentation sites (Docusaurus, ReadTheDocs, GitBook)
4. 25 SaaS marketing sites (mixed rendering)

Record per provider: time per crawl, cost per crawl, HTML quality, Markdown quality, failure rate, custom UA behavior.

If Firecrawl's custom UA bug persists, test Scrape.do as the fallback with CrawlReady's own Markdown conversion.

---

## Decisions

- **Primary provider:** Firecrawl for Phase 0 (best feature fit, competitive pricing, async support).
- **Abstraction layer:** Ship a `CrawlProvider` interface from day one. Provider-specific code lives in adapter modules only.
- **Bot-view strategy:** Use a direct HTTP fetch (no provider) for the bot-specific view. This is cheaper and more accurate — it shows exactly what a non-rendering bot receives. The provider is only needed for the JS-rendered view.
- **Validation gate:** Run 100-crawl test on Firecrawl before writing scoring code. If cost > $0.03/page or custom UA is broken, evaluate Scrape.do as primary.
- **Tavily and Jina:** Not suitable as primary providers. May be useful as reference tools for Markdown quality benchmarking.
