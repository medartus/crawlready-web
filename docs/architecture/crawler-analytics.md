# Research: AI Crawler Analytics — Feature Design Specification

Design specification for CrawlReady's AI Crawler Analytics feature — a permanently free, sticky tool that shows developers which AI crawlers visit their site, how often, and what pages they crawl. Deployed via ultra-light middleware snippets (3-5 lines, copy-paste, no npm install). Compiled April 2026 as part of the VP Innovation Strategic Analysis.

---

## Why This Feature Exists

CrawlReady's Phase 0 diagnostic is a one-time scan: enter a URL, see your score. The AI Crawler Analytics feature adds **continuous monitoring** — a daily-engagement tool that keeps developers coming back and creates a natural upsell path to the paid optimization tier.

### The Gap in the Market

- **MAIO** (WordPress plugin) tracks AI crawler visits — but nothing equivalent exists for JavaScript/React/Next.js/Express sites
- GPTBot makes ~569M requests/month; ClaudeBot ~370M/month; Meta-ExternalAgent traffic doubled in 2 months
- AI bot traffic averages 4.2% of HTML requests (Cloudflare Radar 2025)
- No developer tool answers: "Which AI crawlers are visiting my site, how often, and what pages are they looking at?"

### Strategic Value to CrawlReady

1. **Daily engagement** vs. one-time diagnostic — "who crawled me today?" keeps users returning
2. **Natural upsell** — "GPTBot visited /pricing 312 times but received an empty `<div>`. Fix this." The data itself creates urgency.
3. **Aggregate market intelligence** — anonymized crawler behavior data across all customers creates proprietary insights no competitor has
4. **Retention hook** — the snippet runs continuously; removing it means losing visibility
5. **Conversion bridge** — connects the diagnostic ("here's your score") to ongoing monitoring ("here's who's crawling you and what they see")

---

## Deployment: Ultra-Light Middleware Snippets

### Design Principles

- **3-5 lines of code** per framework — copy-paste into an existing file
- **No npm install required** — zero dependencies, no package to manage
- **Non-blocking** — the beacon is fire-and-forget; does not delay the response to the visitor
- **Minimal payload** — sends ~200 bytes per AI crawler request (timestamp, path, crawler ID, site key)
- **AI crawlers only** — does not log human traffic; no privacy concerns

### Why Middleware (Not a JS Script Tag)

AI crawlers do not execute JavaScript. A client-side `<script>` tag would never fire when GPTBot or ClaudeBot visits. Detection must happen server-side, at the HTTP request level, by reading the User-Agent header before any response is sent.

### Framework Snippets

#### Next.js Middleware (`middleware.ts`)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: 'SITE_KEY', p: request.nextUrl.pathname, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  return NextResponse.next();
}
```

#### Express / Hono Middleware

```typescript
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: 'SITE_KEY', p: req.path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  next();
});
```

#### Cloudflare Workers (Fetch Handler Wrapper)

```typescript
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

export default {
  async fetch(request, env) {
    const ua = request.headers.get('user-agent') || '';
    if (AI_BOTS.test(ua)) {
      const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
      const url = new URL(request.url);
      env.waitUntil(fetch('https://crawlready.app/api/v1/ingest', {
        method: 'POST',
        body: JSON.stringify({ s: env.CRAWLREADY_KEY, p: url.pathname, b: bot, t: Date.now() }),
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {}));
    }
    return fetch(request);
  }
};
```

#### Vercel Edge Middleware (`middleware.ts`)

The Next.js middleware snippet above works directly in Vercel deployments. For non-Next.js Vercel projects, the same pattern applies in `middleware.ts` at the project root using `@vercel/edge` or the standard Web API `Request` object.

### Hidden Backlink (Free Tier)

In addition to the analytics beacon, the middleware injects a single `<link>` tag into the HTML `<head>` on every response for free-tier users:

```html
<link rel="ai-analytics" href="https://crawlready.app/score/example.com" />
```

This tag is:
- Invisible to human visitors (in `<head>`, never rendered)
- Discoverable by all crawlers (Google, AI crawlers) that parse raw HTML
- A real, indexable backlink to CrawlReady's score pages
- Removable by upgrading to a paid tier

The injection requires the middleware to modify the HTML response. For frameworks where middleware can modify the response body (Next.js, Express, Cloudflare Workers with HTMLRewriter), this is straightforward. For frameworks where middleware runs before the response (Vercel Edge), the injection may need to happen via a layout component or server plugin instead.

**Implementation priority:** The analytics beacon ships first (pure logging, no response modification). The hidden backlink injection ships as a follow-up, since it requires response body modification which adds complexity.

---

## Ingest API

### Endpoint: `POST /api/v1/ingest`

Receives beacon payloads from middleware snippets.

**Request body (JSON):**

```json
{
  "s": "site_abc123",
  "p": "/pricing",
  "b": "GPTBot",
  "t": 1712419200000
}
```

| Field | Type | Description |
|---|---|---|
| `s` | string | Site key (issued when user registers their domain) |
| `p` | string | URL path that was crawled |
| `b` | string | Bot identifier (matched from User-Agent) |
| `t` | number | Unix timestamp in milliseconds |

**Response:** `204 No Content` (fire-and-forget, no response body needed)

**Rate limiting:** 100 requests/second per site key (generous for AI crawler traffic, which is typically single-digit requests per second).

**Validation:**
- Reject payloads where `s` is not a registered site key (prevents abuse)
- Reject payloads where `b` is not in the known bot list (prevents noise)
- Reject payloads older than 5 minutes (prevents replay)

### Infrastructure

- **Phase 0-1:** Supabase table with simple INSERT. At the expected scale (hundreds of free users, each seeing a few hundred AI crawler requests per month), a single Postgres table handles the load.
- **Phase 2+ (if scale demands):** Move to a time-series store or Cloudflare Analytics Engine for higher throughput.

### Data Model

```sql
CREATE TABLE crawler_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id),
  path TEXT NOT NULL,
  bot TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawler_visits_site_bot ON crawler_visits(site_id, bot, visited_at);
CREATE INDEX idx_crawler_visits_site_path ON crawler_visits(site_id, path, visited_at);
```

Estimated storage: ~100 bytes per row. 1,000 AI crawler visits/month per site x 500 sites = 500K rows/month = ~50MB/month. Well within Supabase free tier for Phase 0.

---

## Dashboard

### Access

- Available at `crawlready.app/analytics/{domain}` (authenticated — requires the site owner to be logged in)
- The public score page (`crawlready.app/score/{domain}`) is separate and un-gated
- Dashboard requires email signup (the analytics feature is the email capture mechanism)

### Dashboard Views

#### Overview (Default)

```
AI Crawler Activity — example.com
Last 30 days | Last 7 days | Last 24 hours

Total AI crawler visits: 5,024
Unique pages crawled: 67
Active crawlers: 5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

By Crawler:
  Google-Extended    2,891 visits  67 pages  ████████████████████ 58%
  Meta-ExternalAgent 1,653 visits  52 pages  ██████████████       33%
  GPTBot               312 visits  45 pages  ████                  6%
  ClaudeBot             127 visits  32 pages  █                     3%
  PerplexityBot          41 visits  18 pages  ▏                     1%

Top Pages:
  /docs/getting-started    1,247 visits
  /pricing                   891 visits
  /api-reference             634 visits
  /blog/latest-post          412 visits
  /features                  340 visits
```

#### Per-Crawler Detail

Click on any crawler to see its specific activity:

```
GPTBot Activity — example.com
Last 30 days

312 total visits across 45 pages

Most crawled pages:
  /pricing            89 visits  ⚠️ Page is CSR — GPTBot receives empty <div>
  /docs/api-auth      67 visits  ✓ Server-rendered content visible
  /features           45 visits  ⚠️ 3 sections are client-rendered
  /blog/ai-guide      38 visits  ✓ Server-rendered content visible

Crawl frequency:
  [sparkline chart showing daily visit count over 30 days]
```

#### Alerts and Upsell Integration

The dashboard highlights the intersection of crawler activity and crawlability issues:

```
⚠️ ALERT: Invisible Content Being Crawled

GPTBot visited /pricing 89 times this month.
Your Crawlability Score for /pricing is 12/100.

GPTBot receives an empty <div> — your pricing page is invisible to AI search.
89 opportunities to be cited in ChatGPT were wasted.

[Run full diagnostic →]  [Fix this with CrawlReady Pro →]
```

This is the natural upsell: the analytics data proves the problem exists in real-time. The diagnostic showed the problem once; the analytics show it happening continuously.

---

## Upsell Flow

The AI Crawler Analytics dashboard creates three conversion opportunities:

### 1. Diagnostic Upsell (Free → Free Engaged)

When the dashboard detects a crawler visiting a page with low crawlability:

```
GPTBot crawled /pricing 89 times but received an empty page.
[Run full diagnostic on /pricing →]
```

This drives the user from the analytics dashboard to the diagnostic, deepening engagement.

### 2. Optimization Upsell (Free → Paid)

When the diagnostic confirms the problem:

```
Your /pricing page scores 12/100 for AI Crawlability.
GPTBot visits it 89 times/month and gets nothing.

CrawlReady Pro fixes this automatically:
- Serves AI-optimized content to GPTBot, ClaudeBot, and 8+ crawlers
- Your pricing data becomes visible and structured
- Dynamic Schema.org generation for citation boost

[Start free trial →] $49/mo Pro
```

### 3. Volume Upsell (Starter → Pro)

For paying customers, the analytics dashboard shows the business impact:

```
Since enabling CrawlReady:
- 2,891 AI crawler requests served optimized content
- Average content visibility: 12% → 94%
- Pages with Schema.org: 0 → 12 (auto-generated)

Your 500 fresh crawl limit is at 78% usage.
[Upgrade to Pro for 2,500 crawls/mo →]
```

---

## Privacy and Compliance

- **AI crawler requests only** — the middleware only logs requests from known AI crawler User-Agents. Human traffic is never logged.
- **Minimal data** — each beacon contains: site key, URL path, bot identity, timestamp. No IP addresses, no cookies, no request bodies, no response content.
- **No PII** — AI crawlers do not have personal data. The beacons contain no information about human visitors.
- **GDPR-compatible** — no personal data is collected from site visitors. The crawlers are automated systems, not data subjects.
- **Data retention** — 90 days by default. Aggregate counts preserved indefinitely. Raw visit logs purged after 90 days.
- **User data ownership** — users can export their crawler visit data via API or CSV download. Users can delete all their data by removing their site from CrawlReady.

---

## Implementation Timeline

| Deliverable | Effort | Phase |
|---|---|---|
| Ingest API endpoint (`/v1/ingest`) | 1 day | Phase 0 (can ship with diagnostic) |
| Data model (Supabase table + indexes) | 0.5 day | Phase 0 |
| Next.js middleware snippet + docs | 0.5 day | Phase 0/1 |
| Express/Hono middleware snippet + docs | 0.5 day | Phase 0/1 |
| Cloudflare Workers snippet + docs | 0.5 day | Phase 0/1 |
| Dashboard UI (overview + per-crawler) | 3-4 days | Phase 1 |
| Alert system (invisible content detection) | 1-2 days | Phase 1 |
| Hidden backlink injection (meta tag) | 1 day | Phase 1 |
| Opt-in badge snippet | 0.5 day | Phase 1 |
| **Total** | **~8-10 days** | **Phase 0/1** |

The ingest API and middleware snippets can ship alongside or immediately after the Phase 0 diagnostic. The dashboard and alerts are Phase 1 deliverables that build on the accumulated data.

---

## Bot Detection Pattern

The middleware uses a single regex pattern matching the AI Crawler Verification Matrix from `docs/product/solution.md`:

```
/GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i
```

This covers the top AI crawlers by traffic share:
- Googlebot (34.6-38.7% — via Google-Extended)
- Meta-ExternalAgent (15.6%)
- GPTBot (12.1-12.8%)
- ClaudeBot (11.1-11.4%)
- PerplexityBot (growing)
- Applebot-Extended (Apple Intelligence)
- Bytespider (ByteDance/Doubao)

The regex is intentionally simple and embedded directly in the snippet (no external dependency). Updates to the bot list require updating the snippet — but new major AI crawlers appear infrequently (months apart), and the existing list covers 73-74% of all AI bot traffic.

---

## Competitive Positioning

No developer tool in the AI optimization space offers continuous AI crawler monitoring for JavaScript-stack sites:

- **MAIO** — WordPress only, no React/Next.js/Express support
- **MachineContext** — has a URL test tool, no crawler analytics
- **Prerender.io** — shows render counts, not per-crawler breakdowns
- **Mersel AI** — shows bot detection stats, but only for their own edge layer (not installable on customer sites)
- **Cloudflare Bot Management** — shows bot traffic, but enterprise-only ($$$) and not AI-specific
- **Server log analysis** — requires access to raw server logs, manual parsing, no dashboard

CrawlReady's AI Crawler Analytics would be a first: a free, easy-to-install, developer-focused tool showing AI crawler activity with actionable insights.

---

## Decisions

- **Phase 0 scope:** Ship the ingest API and middleware snippets alongside the diagnostic. The dashboard ships in Phase 1 using accumulated Phase 0 data.
- **Email gating:** The analytics dashboard requires email signup (the site key is issued upon registration). The diagnostic score page remains un-gated.
- **Snippet distribution:** Publish snippets in the CrawlReady docs with copy-paste instructions. Do not create npm packages for the snippets — the point is zero dependencies.
- **Hidden backlink:** Ships as a follow-up to the analytics beacon, since response body modification adds complexity. The beacon (pure logging) is the priority.
- **Opt-in badge:** Available as a separate JS snippet users can add voluntarily. Two variants: clean (unbranded score) and branded ("Powered by CrawlReady"). Never auto-injected.
- **Data model:** Start with Supabase Postgres. Migrate to time-series store only if scale demands it (unlikely before Phase 2).
