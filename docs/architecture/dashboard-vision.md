# Dashboard Architecture: Long-Term Vision

Comprehensive dashboard architecture for CrawlReady. Defines all pages, navigation, layouts, interaction patterns, and infrastructure decisions for a coherent, future-proof product experience spanning Phase 0 through Phase 4+.

**Design decisions sourced from:** Brainstorming session (May 2026), DESIGN.md, PRODUCT.md, all architecture docs.

---

## Design Decisions (Inputs)

| Decision | Choice | Rationale |
|---|---|---|
| Site model | Adaptive (auto single-site, portfolio at 2+) | Most users start with 1 site; grow into multi-site |
| Onboarding | Separate flow, dashboard empty states redirect to it | Streamlined adaptive experience; incomplete onboarding loops back |
| Onboarding verification | Synthetic AI bot request to user's site | Instant integration verification — don't wait for real crawlers |
| Multi-tenancy | Org-scoped from day 1 (Clerk Organizations) | Avoids migration; every user auto-creates a personal org |
| Diagnostic integration | Separate public tool; dashboard links out | Keeps zero-friction public entry point independent |
| Optimization availability | All tiers including free (free = with backlink) | Optimization is THE hero feature. Free tier includes CrawlReady backlink on optimized pages; paid tiers remove it. |
| Issue display model | Auto-fixed vs. Needs Your Attention | CrawlReady auto-fixes Schema, content, ARIA. Only surface issues the user must fix (robots.txt, server config, CSR). |
| Configuration depth | Progressive disclosure (plug-and-play default) | Zero-config works out of the box. Advanced panel for deep customization. |
| Analytics | Queryable and prominent | Search, filter, segment, export. First-class data exploration, not just charts. |
| Notifications | In-app + email + webhooks | Covers internal awareness + external integrations |
| Mobile | Full responsive | Sidebar becomes mobile nav; every feature has a mobile layout |

---

## Navigation Architecture

### Primary Navigation Model: Collapsible Sidebar + Site Selector Header

The dashboard uses a **persistent collapsible sidebar** (left) with a **top header bar** containing the site/org selector. This is the Vercel/Linear model adapted for CrawlReady's domain.

```
 ┌──────────────────────────────────────────────────────────────┐
 │ [CR Logo] [Org: Acme Inc ▼]  [Site: acme.com ▼]  [🔔] [👤] │  ← Header
 ├──────┬───────────────────────────────────────────────────────┤
 │      │                                                       │
 │  N   │                                                       │
 │  A   │              Main Content Area                        │
 │  V   │              (scrollable)                             │
 │      │                                                       │
 │  B   │                                                       │
 │  A   │                                                       │
 │  R   │                                                       │
 │      │                                                       │
 ├──────┤                                                       │
 │ [⚙]  │                                                       │
 └──────┴───────────────────────────────────────────────────────┘
```

### Header Bar (Persistent)

| Element | Position | Behavior |
|---|---|---|
| CrawlReady wordmark | Left | Links to dashboard home. Collapses to "CR" when sidebar is collapsed. |
| Org selector | Left-center | Dropdown. Shows current org name + plan badge. Switch between personal and team orgs. |
| Site selector | Center | Dropdown. Shows domain + score badge (colored dot) + last beacon time. "All Sites" option at top for portfolio view. "+ Add site" at bottom. Only visible when user has 1+ sites. |
| Notification bell | Right | Badge count for unread. Opens notification panel (slide-out or dropdown). |
| User avatar | Right | Dropdown: Profile, Settings, Billing, Sign out. |

### Sidebar Navigation (Collapsible)

The sidebar collapses to icon-only on narrow viewports or user toggle. Sections are grouped by function. Items that require a higher tier show a subtle lock icon but remain visible.

**When a site is selected:**

```
── Overview                    [LayoutDashboard icon]
── Optimization                [Zap icon]           ★ Hero feature, all tiers
   ├── Pipeline Status
   ├── What We Fixed
   ├── Configuration
   └── Cache & Budget
── Analytics                   [BarChart3 icon]
   ├── Crawler Activity
   ├── Top Pages
   ├── Bot Breakdown
   ├── Query Explorer
   └── Alerts
── AI Readiness                [Target icon]
   ├── Current Score
   ├── Score History
   └── Needs Your Attention
── Citations                   [Quote icon]         (Phase 3+ / tier-gated)
   ├── Citation Tracker
   ├── Competitor Analysis
   └── Query Coverage
── Integration                 [Plug icon]
   ├── Setup & Snippets
   ├── Verification Status
   └── API Keys
── divider ──
── Settings                    [Settings icon]
```

**Navigation priority rationale:** Optimization is #2 (right after Overview) because it's the hero feature — the automated pipeline that fixes websites. Analytics is #3 because it's the primary read-heavy surface users check daily. AI Readiness is #4 because CrawlReady auto-fixes most issues; this section only shows what the user must address manually.

**When "All Sites" is selected (portfolio view):**

```
── Portfolio Overview           [Grid icon]
── Add New Site                [Plus icon]
── divider ──
── Organization Settings       [Building icon]
── Billing & Plans             [CreditCard icon]
── Team Members                [Users icon]         (Phase 4 / tier-gated)
── Notification Preferences    [Bell icon]
── Webhooks                    [Webhook icon]
```

### Mobile Navigation

On viewports < 768px:
- Sidebar collapses entirely
- Bottom navigation bar with 5 items: Overview, Optimize, Analytics, Setup, More (hamburger for remaining items)
- Site selector moves to a full-width bar below the header
- Org selector available via the "More" menu

On viewports 768px-1024px:
- Sidebar collapses to icon-only by default
- Hover/tap to expand with labels
- Header remains full

---

## Page Map

### Route Structure

All dashboard routes are under `/(auth)/dashboard/`. Site-scoped routes use `[orgSlug]/[siteId]` segments for deep-linkability and URL clarity.

```
/dashboard
  → Adaptive landing: single-site overview OR portfolio grid

/dashboard/sites
  → Portfolio grid (all sites for current org)

/dashboard/sites/new
  → Redirects to onboarding flow (or inline if onboarding complete for other sites)

/dashboard/[orgSlug]/[siteId]
  → Site overview (home for a selected site)

/dashboard/[orgSlug]/[siteId]/analytics
  → Analytics overview (default: last 30 days)

/dashboard/[orgSlug]/[siteId]/analytics/bots
  → Per-bot breakdown

/dashboard/[orgSlug]/[siteId]/analytics/pages
  → Top pages crawled (paginated, searchable)

/dashboard/[orgSlug]/[siteId]/analytics/alerts
  → Alert feed (actionable insights)

/dashboard/[orgSlug]/[siteId]/analytics/explorer
  → Query explorer: search, filter, segment analytics data

/dashboard/[orgSlug]/[siteId]/optimization
  → Optimization overview (★ hero feature, all tiers)

/dashboard/[orgSlug]/[siteId]/optimization/fixed
  → What CrawlReady auto-fixed (Schema, content, ARIA)

/dashboard/[orgSlug]/[siteId]/optimization/config
  → Advanced configuration (format routing, bot rules, Schema overrides)

/dashboard/[orgSlug]/[siteId]/optimization/cache
  → Cache management: TTL, invalidation, fresh crawl budget

/dashboard/[orgSlug]/[siteId]/readiness
  → Current score + history chart

/dashboard/[orgSlug]/[siteId]/readiness/issues
  → Issues only the user can fix (not auto-fixable)

/dashboard/[orgSlug]/[siteId]/citations
  → Citation monitoring (Phase 3+)

/dashboard/[orgSlug]/[siteId]/citations/competitors
  → Competitor citation comparison

/dashboard/[orgSlug]/[siteId]/integration
  → Integration setup: snippets, verification, beacon status

/dashboard/[orgSlug]/[siteId]/integration/api-keys
  → API key management for this site

/dashboard/[orgSlug]/[siteId]/settings
  → Site-level settings: domain, TTL overrides, bot rules, danger zone (delete)

/dashboard/settings
  → Account settings (profile, password, connected accounts)

/dashboard/settings/billing
  → Subscription management, usage meters, invoices

/dashboard/settings/team
  → Team member management (Phase 4)

/dashboard/settings/notifications
  → Notification preferences (email digest frequency, alert types)

/dashboard/settings/webhooks
  → Webhook endpoint management

/dashboard/settings/org
  → Organization settings (name, slug, plan)
```

---

## Page Specifications

### 1. Adaptive Dashboard Home (`/dashboard`)

**Logic:**
- If user has 0 sites → Empty state with CTA to onboarding flow
- If user has 1 site → Redirect to `/dashboard/[orgSlug]/[siteId]` (single-site overview)
- If user has 2+ sites → Show portfolio grid

**Portfolio Grid Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Your Sites                              [+ Add Site]   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ acme.com     │  │ docs.acme.io │  │ blog.acme.co │ │
│  │              │  │              │  │              │ │
│  │   [72]       │  │   [45]       │  │   [--]       │ │
│  │  Score ●     │  │  Score ●     │  │  No scan     │ │
│  │              │  │              │  │              │ │
│  │ 2.4K visits  │  │ 891 visits   │  │ Awaiting     │ │
│  │ 5 bots       │  │ 3 bots       │  │ first beacon │ │
│  │ Last: 2h ago │  │ Last: 1d ago │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  Cross-Site Summary (last 30 days)                      │
│  ─────────────────────────────────                      │
│  Total AI crawler visits: 12,847                        │
│  Average AI Readiness Score: 56/100                     │
│  Most active bot: Google-Extended (58%)                 │
└─────────────────────────────────────────────────────────┘
```

Each site card shows:
- Domain name (Geist Mono)
- Score gauge (sm size) with band color
- Total crawler visits (30d)
- Active bot count
- Last beacon timestamp
- Integration status indicator (green dot = active, yellow = stale snippet, gray = no beacons)

**Empty State:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          [Plug icon, 24px, muted]                       │
│                                                         │
│     No sites registered yet                             │
│                                                         │
│     Register your first site to start tracking          │
│     AI crawler activity.                                │
│                                                         │
│     [Add your first site →]                             │
│     (links to onboarding flow)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Loading State:**
- Skeleton cards (3 placeholders) with pulsing animation matching card dimensions.

---

### 2. Site Overview (`/dashboard/[orgSlug]/[siteId]`)

The site overview is the "home" for a single site. It surfaces the most important signals from all subsystems at a glance. Think of it as an executive summary.

**Layout:** 2-column grid on desktop, single column on mobile.

```
┌─────────────────────────────────────────────────────────────────┐
│  acme.com                                    [View score page ↗] │
│  Integration: Active ● Middleware  │  Last beacon: 2 min ago    │
├─────────────────────────────┬───────────────────────────────────┤
│                             │                                   │
│  AI Readiness Score         │  Crawler Activity (7d)            │
│                             │                                   │
│        [72]                 │  ┌─────────────────────────┐     │
│       ─────                 │  │  ▁▂▃▅▇█▇▅▃▂▁▂▃▅▇       │     │
│        100                  │  │  Sparkline chart         │     │
│                             │  └─────────────────────────┘     │
│  "Mostly AI-ready"          │                                   │
│                             │  1,247 visits │ 45 pages │ 5 bots│
│  Crawl: 65  Agent: 70       │                                   │
│  Interact: 85               │  [View analytics →]               │
│                             │                                   │
│  Last scanned: Apr 28       │                                   │
│  [View on score page ↗]     │                                   │
│                             │                                   │
├─────────────────────────────┴───────────────────────────────────┤
│                                                                 │
│  Optimization Pipeline                          [Active ●]      │
│  ─────────────────────                                              │
│  12 pages optimized · Schema injected on 4 · 98% cache hit      │
│  [View pipeline →]                                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Needs Your Attention (2)                                       │
│  ─────────────────────────                                        │
│  Only issues CrawlReady cannot auto-fix.                        │
│                                                                 │
│  ⚠ Critical: robots.txt blocks GPTBot and ClaudeBot             │
│    Your robots.txt disallows these User-Agents.                 │
│    CrawlReady cannot override this — you must update it.        │
│    [View fix instructions →]                                     │
│                                                                 │
│  ⚠ Warning: /app/* requires authentication                      │
│    AI crawlers receive a login redirect for 12 pages.           │
│    CrawlReady cannot optimize auth-gated content.               │
│    [View affected pages →]                                      │
│                                                                 │
│  ✓ Auto-fixed: Schema.org generated for 4 pages (FAQPage,       │
│    Product). Content optimized for 12 pages. ARIA enriched.     │
│    [View what we fixed →]                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Quick Stats (30d)                                              │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 1,247    │  │ 45       │  │ 5        │  │ 72/100   │      │
│  │ AI visits│  │ Pages    │  │ Bots     │  │ Score    │      │
│  │ +12% ▲   │  │ +3 new   │  │ steady   │  │ +5 ▲    │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  Top Crawlers             │  Top Pages                          │
│  Google-Extended  58%     │  /docs/getting-started  1,247       │
│  Meta-External   33%     │  /pricing                 891       │
│  GPTBot           6%     │  /api-reference           634       │
│  ClaudeBot        3%     │  /blog/latest             412       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key behaviors:**
- Score gauge uses the signature 700ms fill animation on first render
- Optimization Pipeline section is the most prominent after the score — it's the hero
- "Needs Your Attention" only shows issues CrawlReady cannot auto-fix (robots.txt, auth-gated pages, server config, etc.)
- Auto-fixed items are summarized in one line with a link to the full "What We Fixed" page
- Quick stats show 30d trend (▲/▼/steady) with percentage or absolute delta
- All sections link to their detail pages
- Free tier: optimization active, backlink badge shown ("Powered by CrawlReady" on optimized pages)
- Paid tier: no backlink badge

**Loading state:** Skeleton layout matching the exact grid proportions. Score gauge shows empty ring. Stat cards show gray placeholder bars.

**Error state:** If the analytics API fails, show the most recent cached data with a banner: "Analytics data may be delayed. Last updated: [timestamp]."

---

### 3. Analytics — Crawler Activity (`/dashboard/[orgSlug]/[siteId]/analytics`)

**Layout:** Full-width with filter bar at top.

**Filter Bar:**
```
[Last 24h] [Last 7d] [Last 30d ●] [Custom ▼]  │  [Export ▼]
```

**Content sections (scrollable, top to bottom):**

**3a. Headline Metrics (4 stat cards)**
- Total AI crawler visits (with trend)
- Unique pages crawled (with trend)
- Active crawlers (count)
- Average visits/day (with trend)

**3b. Time-Series Chart**
- Area chart showing daily visit volume, stacked by bot
- Hover tooltip: date + per-bot counts
- Toggle: stacked vs. individual bot lines
- Granularity toggle: hourly (for 24h/7d) or daily (for 30d+)
- Empty state: "No crawler visits recorded yet. Install the middleware snippet to start tracking."

**3c. Bot Breakdown Table**
```
Bot                    Visits    Pages    Share    Trend (7d)
─────────────────────────────────────────────────────────────
Google-Extended        2,891     67       58%      ▁▂▃▅▇ +12%
Meta-ExternalAgent     1,653     52       33%      ▇▅▃▂▁ -8%
GPTBot                   312     45        6%      ▁▂▃▃▃ steady
ClaudeBot                127     32        3%      ▁▁▂▂▃ +24%
PerplexityBot             41     18        1%      ▁▁▁▁▂ new
```
- Each row is clickable → navigates to per-bot detail page
- Sparkline shows 7d trend
- Sort by any column

**3d. Top Pages Table**
```
Page                        Visits   Bots   Score   Status
────────────────────────────────────────────────────────────
/docs/getting-started       1,247    5      85/100  ✓ Visible
/pricing                      891    4      12/100  ⚠ CSR invisible
/api-reference                634    3      78/100  ✓ Visible
/features                     340    3      45/100  ⚠ Partial
```
- Paginated (20 per page)
- Search bar for filtering by path
- Status column cross-references crawlability score for that URL
- Score column links to the public score page

**3e. Query Explorer (`/dashboard/[orgSlug]/[siteId]/analytics/explorer`)**

A powerful search and filter interface for all analytics data. Designed for developers who want to answer specific questions about their AI crawler traffic.

```
┌─────────────────────────────────────────────────────────────────┐
│  Query Explorer                                                 │
│                                                                 │
│  [Search pages, bots, or paths...           ]  [Filter ▼]      │
│                                                                 │
│  Filters:                                                       │
│  [Bot: All ▼] [Status: All ▼] [Path: contains ▼] [Date: 30d ▼]│
│                                                                 │
│  Showing 847 matching visits                    [Export CSV ▼]  │
│                                                                 │
│  Page              Bot              Time         Status          │
│  ─────────────────────────────────────────────────────────────  │
│  /docs/auth        GPTBot           2h ago       ✓ Optimized    │
│  /pricing          ClaudeBot        3h ago       ✓ Optimized    │
│  /app/settings     Google-Extended  5h ago       ⚠ Auth-gated   │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

- Full-text search across page paths
- Combinable filters: bot, date range, optimization status, HTTP status, page path pattern
- Saved filter presets (e.g., "Unoptimized pages visited this week")
- Export filtered results as CSV or JSON
- Pagination with configurable page size (20/50/100)
- Status column reflects optimization pipeline state, not just crawlability

**Loading state:** Skeleton chart (rectangle with faded gradient) + skeleton table rows.

---

### 4. Analytics — Alerts (`/dashboard/[orgSlug]/[siteId]/analytics/alerts`)

**Purpose:** Actionable insights generated by correlating crawler activity with scan data.

**Alert Types:**

| Type | Trigger | Severity |
|---|---|---|
| Invisible content crawled | Bot visits page with crawlability < 25 | Critical |
| New bot detected | First-time bot appears in visits | Info |
| Traffic spike | >3x average daily visits from any bot | Warning |
| Stale snippet | Beacon version < current bot registry version | Warning |
| No beacons (24h+) | Site was receiving beacons but stopped | Warning |
| Score drop | AI Readiness Score decreased by 10+ points | Critical |

**Layout:** Feed-style list, newest first. Each alert card:
```
┌─────────────────────────────────────────────────────────┐
│ ⚠ Critical · 2 hours ago                    [Dismiss]  │
│                                                         │
│ Invisible Content Being Crawled                         │
│                                                         │
│ GPTBot visited /pricing 89 times this month.            │
│ Your Crawlability Score for /pricing is 12/100.         │
│ GPTBot receives an empty <div>.                         │
│                                                         │
│ [View diagnostic for /pricing →]  [Fix with Pro →]      │
└─────────────────────────────────────────────────────────┘
```

**Filters:** All | Critical | Warning | Info | Dismissed

**Empty state:** "No alerts yet. CrawlReady will notify you when something needs attention."

---

### 5. AI Readiness (`/dashboard/[orgSlug]/[siteId]/readiness`)

**Layout:** Score gauge (lg) at top, auto-fixed summary, then "needs attention" list, then history chart.

**Core principle:** CrawlReady auto-fixes most issues (Schema generation, content optimization, ARIA enrichment). This page celebrates what was fixed automatically and only asks the user to act on things CrawlReady cannot fix.

**5a. Current Score + Auto-Fix Summary**
- Large score gauge (180px) with band label and color
- Three sub-score gauges (sm, 80px) in a row: Crawlability, Agent Readiness, Agent Interaction
- EU AI Act compliance badge: "X/4 checks passed" (expandable)
- **Auto-fix summary banner:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✓ CrawlReady auto-fixed 8 issues                          │
│                                                             │
│  Schema.org generated: 4 pages (FAQPage, Product, HowTo)   │
│  Content optimized: 12 pages (Markdown + enriched HTML)     │
│  ARIA enrichment: 12 pages (landmarks, labels, roles)       │
│                                                             │
│  [View all auto-fixes →]                                    │
└─────────────────────────────────────────────────────────────┘
```

**5b. Needs Your Attention (`/dashboard/[orgSlug]/[siteId]/readiness/issues`)**

Only issues CrawlReady cannot auto-fix. These are things that require the site owner to change their own infrastructure:

| Issue Category | Example | Why CrawlReady Can't Fix It |
|---|---|---|
| robots.txt blocking | `Disallow: / # GPTBot` | Server-level config, user must edit |
| Auth-gated pages | `/app/*` returns 302 to login | CrawlReady has no credentials |
| Server-side redirects | Redirect loops, 5xx errors | Origin server problem |
| CSR-only with no SSR | React SPA with no server rendering | Requires framework migration |
| Content behind JS interactions | Tab content, accordion, infinite scroll | Requires code changes |
| Rate limiting / IP blocking | Origin blocks CrawlReady's crawler | Firewall / CDN config |

Each needs-attention card:
- Severity badge (critical / warning)
- Issue title + evidence (what was measured)
- Why CrawlReady can't auto-fix this (one sentence)
- Framework-specific fix instructions (expandable code block)
- Affected pages list

**When there are zero needs-attention issues:**
```
┌─────────────────────────────────────────────────────────────┐
│  ✓ Nothing needs your attention                             │
│                                                             │
│  CrawlReady is handling all optimizations automatically.    │
│  Your AI Readiness Score is 85/100.                         │
│  Keep monitoring analytics for new crawler activity.        │
└─────────────────────────────────────────────────────────────┘
```

**5c. Score History Chart**
- Line chart showing AI Readiness Score over time (one point per scan)
- Sub-score lines togglable
- X-axis: dates of scans
- Y-axis: 0-100
- Band color zones as horizontal background stripes (Critical/Poor/Fair/Good/Excellent)
- Annotation markers on chart for "CrawlReady auto-fix deployed" events
- Empty state: "Only one scan recorded. Score history will appear after your site is scanned again."

---

### 6. Optimization — Pipeline Overview (`/dashboard/[orgSlug]/[siteId]/optimization`)

**★ Hero feature. Available to ALL tiers.** Free tier includes a CrawlReady backlink on optimized pages; paid tiers remove it. This is the automated pipeline that fixes websites for AI crawlers — the core value proposition.

**Design principle: plug-and-play.** The pipeline works with zero configuration. Users see what's happening and can customize deeply, but they never *have* to.

**6a. Pipeline Status (top of page)**
```
┌─────────────────────────────────────────────────────────────────┐
│  Optimization Pipeline                            [Active ●]    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ 12       │  │ 98.2%    │  │ 4        │  │ 312/500  │      │
│  │ Pages    │  │ Cache    │  │ Schema   │  │ Crawls   │      │
│  │ optimized│  │ hit rate │  │ types    │  │ used     │      │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│  Free plan: Optimized pages include "Powered by CrawlReady"    │
│  backlink visible to AI crawlers. [Remove with Starter →]       │
│  (only shown for free tier)                                     │
└─────────────────────────────────────────────────────────────────┘
```

**6b. Page-Level Pipeline Table**
```
Page                   What We Did                    Cache    Status
──────────────────────────────────────────────────────────────────────────
/pricing               HTML+Schema (Product, FAQ)      Hit     ✓ Fresh
/docs/getting-started  Markdown + ARIA                 Hit     ✓ Fresh
/features              HTML+Schema (FAQ)               Miss    ⏳ Queued
/about                 Markdown + ARIA                 Stale   ⚠ Refresh
/app/settings          ✗ Auth-gated (cannot optimize)  —       ⚠ Blocked
```
- Sort/filter by status, format, staleness
- Row click → opens content preview (slide-out panel)
- "What We Did" column shows exactly which optimizations were applied
- Blocked rows explain *why* with link to "Needs Your Attention"
- Bulk actions: select multiple → refresh
- Search bar for filtering by path

**6c. Content Preview (slide-out panel)**
- Side-by-side: Origin HTML vs. Optimized output
- Format tabs: Markdown | Enriched HTML + ARIA
- Content parity indicator: "98.2% content match" (green if > 90%, yellow if 85-90%, red if < 85%)
- Generated Schema.org preview (collapsible JSON-LD with syntax highlighting)
- "This is what [BotName] sees when it visits this page"

**6d. What We Fixed (`/dashboard/[orgSlug]/[siteId]/optimization/fixed`)**

Transparency page showing everything CrawlReady auto-fixed. Builds trust.

```
┌─────────────────────────────────────────────────────────────────┐
│  What CrawlReady Auto-Fixed                                     │
│                                                                 │
│  Schema.org Generation                                          │
│  ───────────────────────                                        │
│  FAQPage on /pricing         — 8 Q&A pairs extracted            │
│  Product on /pricing         — 3 tiers, pricing, features       │
│  HowTo on /docs/quickstart   — 6 steps extracted                │
│  Organization on /about      — name, logo, social links         │
│                                                                 │
│  Content Optimization                                           │
│  ─────────────────────                                          │
│  12 pages cleaned: nav/footer/sidebar removed, content focused  │
│  Markdown versions generated for text-preferring bots           │
│                                                                 │
│  ARIA Enrichment                                                │
│  ────────────────                                               │
│  12 pages enriched: landmark roles, aria-labels, heading tree   │
│  0 existing ARIA attributes overwritten                         │
│                                                                 │
│  [Preview any page →]                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7. Optimization — Configuration (`/dashboard/[orgSlug]/[siteId]/optimization/config`)

**Progressive disclosure pattern.** Default: zero-config. Advanced: full control.

**Default view (plug-and-play):**
```
┌─────────────────────────────────────────────────────────────────┐
│  Pipeline Configuration                                         │
│                                                                 │
│  Mode: Automatic (recommended)                                  │
│                                                                 │
│  CrawlReady automatically:                                      │
│  ✓ Detects your page types and generates Schema.org             │
│  ✓ Serves optimal format per AI client                          │
│  ✓ Enriches HTML with ARIA landmarks and labels                 │
│  ✓ Caches optimized content for fast delivery                   │
│                                                                 │
│  Everything is working. No configuration needed.                │
│                                                                 │
│  [Show advanced settings →]                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Advanced view (after clicking "Show advanced settings"):**

**7a. Format Routing**
```
Bot / Client              Format                 Override
─────────────────────────────────────────────────────────
GPTBot                    [Markdown ▼]           [Reset to default]
ClaudeBot                 [Markdown ▼]           [Reset to default]
Google-Extended           [Enriched HTML ▼]      [Reset to default]
Visual Agents             [Original + ARIA ▼]    [Reset to default]
...

[+ Add custom User-Agent rule]
```

**7b. Schema.org Overrides**
- Per-page schema type override (e.g., force Product instead of auto-detected FAQ)
- Custom JSON-LD injection (expert mode, validated)
- Confidence threshold slider: "Auto-apply when confidence > [80%]" (default)
- Low-confidence schema → queued for user review

**7c. Content Rules**
- Exclude paths: patterns like `/admin/*`, `/api/*` that should never be optimized
- Include-only paths: only optimize specific paths (e.g., `/docs/*`, `/blog/*`)
- Custom CSS selectors to strip (beyond default nav/footer/sidebar removal)

**7d. Bot Rules** (Business+ tier)
- Block specific bots from receiving optimized content
- Custom response headers per bot
- A/B testing: serve original vs. optimized to measure impact

Each advanced setting shows:
- Current value (what CrawlReady chose automatically)
- Why it was chosen (one sentence explanation)
- Override control
- [Reset to default] button

---

### 8. Optimization — Cache & Budget (`/dashboard/[orgSlug]/[siteId]/optimization/cache`)

**Sections:**

**8a. Usage Meter**
```
Fresh Crawls This Month
████████████░░░░░░░░░░░░░░ 312 / 500 (62%)
Resets: May 15, 2026

[Upgrade for more crawls →]  (if approaching limit)
```

**8b. Default TTL Configuration**
- Current TTL: [7 days] (dropdown: 3d, 7d, 14d based on tier)
- "Your plan allows: 3d minimum, 14d maximum"
- Per-page TTL overrides (advanced, expandable table)

**8c. Cache Invalidation**
- Manual: Enter URL → [Invalidate]
- Webhook: Display webhook URL for automated cache busting (e.g., trigger on deploy)
- Bulk: [Invalidate all] (confirmation dialog, counts against fresh crawl budget)
- CI/CD integration: code snippet for invalidating on deploy (GitHub Actions, Vercel hooks)

---

### 9. Citations (`/dashboard/[orgSlug]/[siteId]/citations`)

**Phase 3+ feature.** Teaser for lower tiers.

**Active state:**

**9a. Citation Rate**
- Big number: "Your domain was cited in X AI answers this month"
- Trend chart: citation count over time
- Breakdown by AI engine: ChatGPT, Perplexity, Claude, Gemini

**9b. Cited Pages**
```
Page                     Citations   Engine          Query Example
────────────────────────────────────────────────────────────────────
/docs/authentication     47          ChatGPT (32)    "how to authenticate with Acme API"
                                     Perplexity (15)
/pricing                 23          ChatGPT (18)    "Acme pricing plans"
                                     Claude (5)
```

**9c. Competitor Comparison**
```
Domain          Citations (30d)   Overlap Queries   Your Advantage
───────────────────────────────────────────────────────────────────
competitor1.com    89              12 shared         They lead by 34
competitor2.com    45              8 shared          You lead by 12
```

**9d. Uncited Opportunities**
- Queries where competitors are cited but you are not
- Suggested content improvements

---

### 10. Integration (`/dashboard/[orgSlug]/[siteId]/integration`)

**Purpose:** Integration setup, health monitoring, and snippet management.

**Layout:** Status banner at top + tabbed content below.

**Status Banner:**
```
✓ Integration Active — Middleware — Last beacon: 2 minutes ago — Beacon v3 (current)
```
or
```
⚠ No beacons received — Install the middleware snippet to start tracking.
  [View setup instructions →]
```
or
```
⚠ Stale snippet detected — Your snippet uses bot registry v1, current is v3.
  [Copy updated snippet →]
```

**Tabs:**

**Tab 1: Setup**
- Integration type toggle: [Middleware (recommended)] | [Script Tag]
- Framework selector: [Next.js] [Express] [Cloudflare Workers] [Generic]
- Code block with pre-filled site key (copy button)
- "Test your integration" button → makes a test ingest call and confirms receipt

**Tab 2: Status**
- Beacon activity timeline (last 24h): sparkline showing beacon frequency
- Total beacons received (all time, 30d, 7d, 24h)
- Source breakdown: middleware vs. js vs. pixel (pie chart)
- Beacon version distribution (if multiple versions detected)

**Tab 3: Domain Verification** (Phase 1+)
- Verification method: [Meta Tag] | [DNS TXT Record]
- Status: Verified ✓ | Pending (checking hourly for 72h) | Not started
- Instructions with copy-paste snippets

**Tab 4: Site Key**
- Current key display (masked by default, click to reveal)
- Copy button
- [Rotate Key] button (Phase 1+, with 24h grace period explanation)
- Key history (previous keys with expiry dates)

---

### 11. Settings — Account (`/dashboard/settings`)

**Sections:**
- Profile (name, email — read from Clerk)
- Connected accounts (Google, GitHub via Clerk)
- [Manage account →] (links to Clerk's account portal)

---

### 12. Settings — Billing (`/dashboard/settings/billing`)

**Sections:**

**12a. Current Plan**
```
┌─────────────────────────────────────────────┐
│  Pro Plan · $49/month                       │
│  Billed monthly · Next charge: Jun 1, 2026  │
│                                             │
│  [Change plan]  [Cancel subscription]       │
└─────────────────────────────────────────────┘
```

**12b. Usage This Period**
- Fresh crawls: 312/2,500 (progress bar)
- Cached responses: 45,678 (unlimited)
- Sites registered: 3/unlimited

**12c. Plan Comparison** (expandable)
- Tier comparison table showing feature differences
- Highlight current plan
- Upgrade CTAs on higher tiers

**12d. Invoice History**
- Table: Date, Amount, Status (Paid/Pending), [Download PDF]

---

### 13. Settings — Notifications (`/dashboard/settings/notifications`)

**Sections:**

**13a. In-App Notifications**
- Toggle per alert type (invisible content, new bot, traffic spike, stale snippet, score drop, no beacons)
- All on by default

**13b. Email Digest**
- Frequency: [Off] [Daily] [Weekly ●] [Monthly]
- Delivery time: [9:00 AM ▼] [UTC ▼]
- Content: checkboxes for what to include (summary stats, alerts, score changes)

**13c. Webhook Endpoints** (links to /dashboard/settings/webhooks)

---

### 14. Settings — Webhooks (`/dashboard/settings/webhooks`)

**Layout:** Endpoint list + add form.

```
┌─────────────────────────────────────────────────────────┐
│  Webhook Endpoints                         [+ Add]      │
│                                                         │
│  https://hooks.slack.com/services/T.../B.../xxx...      │
│  Events: alert.critical, score.changed                  │
│  Status: ✓ Active · Last delivery: 2h ago               │
│  [Edit] [Test] [Delete]                                 │
│                                                         │
│  https://my-api.com/crawlready-webhook                  │
│  Events: all                                            │
│  Status: ⚠ Last delivery failed (403) · 1d ago          │
│  [Edit] [Test] [Delete]                                 │
└─────────────────────────────────────────────────────────┘
```

**Add/Edit Form:**
- URL input
- Secret (auto-generated, used for HMAC signature verification)
- Event selection: checkboxes per event type
- [Test] button sends a test payload

**Webhook Event Types:**
- `alert.critical` — critical alert generated
- `alert.warning` — warning alert generated
- `score.changed` — AI Readiness Score changed by 5+ points
- `citation.new` — new citation detected (Phase 3)
- `cache.invalidated` — cache entry invalidated (Phase 2)
- `beacon.stale` — snippet version outdated

---

### 15. Settings — Team Members (`/dashboard/settings/team`)

**Phase 4 / Business+ tier.**

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Team Members (3 of 3 seats)              [Invite]      │
│                                                         │
│  Name              Email              Role    Actions   │
│  ─────────────────────────────────────────────────────  │
│  Alice Chen        alice@acme.com     Owner   —         │
│  Bob Smith         bob@acme.com       Admin   [Edit]    │
│  Carol Jones       carol@acme.com     Viewer  [Edit]    │
│                                                         │
│  Pending Invitations                                    │
│  dave@acme.com     Invited 2d ago     Admin   [Resend]  │
└─────────────────────────────────────────────────────────┘
```

**Roles:**
- **Owner:** Full access, billing, can delete org
- **Admin:** Full access except billing and org deletion
- **Viewer:** Read-only access to all dashboards, no configuration changes

---

## Onboarding Flow (Separate from Dashboard)

The onboarding flow is a dedicated full-screen experience that runs after account creation or when a user with no sites clicks "Add site" from the dashboard empty state.

### Flow Steps

```
Step 1: Organization Setup
  → Auto-created personal org, or select existing
  → Skip if already has an org

Step 2: Add Site
  → Domain input (validated, normalized)
  → Brief explanation of what happens next

Step 3: Choose Integration
  → Middleware (recommended) vs. Script Tag toggle
  → Framework selector (if middleware)
  → Code snippet with pre-filled site key
  → Copy button
  → "I've installed the snippet" confirmation

Step 4: Verify Integration (Synthetic Bot Request)
  → User clicks "Verify my integration"
  → CrawlReady sends a synthetic HTTP request to the user's site
    using AI bot User-Agents (GPTBot, ClaudeBot, etc.)
  → This triggers the user's middleware/script tag to send a beacon
  → CrawlReady listens for the beacon (poll for 15s — fast feedback)
  → Success: "✓ Integration verified! We sent a GPTBot request to
    /pricing and received your beacon in 1.2s."
  → Failure: "We sent a test request but didn't receive a beacon.
    Common fixes: [check middleware placement] [verify site key]
    [check CORS if using script tag]"
  → [Try again] + [Skip for now] always available

Step 5: Optimization Activation
  → CrawlReady runs an initial scan + optimization pass
  → Progress indicator: "Scanning your site..."
    → "Found 14 pages"
    → "Generating Schema.org for 4 pages..."
    → "Optimizing content for AI crawlers..."
    → "Done! 12 pages optimized, 2 need your attention."
  → Quick preview: before/after for one page
  → Free tier notice: "Your optimized pages include a
    'Powered by CrawlReady' backlink. [Remove with Starter →]"

Step 6: Done
  → Success state with summary:
    "Your site is live on CrawlReady:
     · 12 pages optimized for AI crawlers
     · Schema.org generated for 4 pages
     · AI crawler visits are being tracked
     · 2 issues need your attention (robots.txt, auth pages)"
  → [Go to dashboard →]
```

**Why synthetic bot verification:** Real AI crawlers visit sites periodically (hours to days). Waiting for a real visit during onboarding would mean users leave the flow without knowing if their integration works. The synthetic request gives instant, deterministic feedback — the user knows within seconds if their snippet is installed correctly.

**Implementation:** `POST /api/v1/verify-integration` sends requests from CrawlReady's servers with AI bot User-Agent strings to the user's domain, then checks for a matching beacon on the ingest endpoint within a 15-second window.

**Incomplete onboarding:** If the user abandons at any step, next login redirects them back to the step they left off. Dashboard empty state also links back to the onboarding flow.

**Adding subsequent sites:** When a user already has sites and clicks "+ Add site", they get a streamlined version (Steps 2-5 only, skip org setup).

---

## Infrastructure Patterns

### Data Fetching Strategy

| Data Type | Freshness | Pattern | Implementation |
|---|---|---|---|
| Site list | Near-real-time | Server component + revalidate | `revalidate: 60` in RSC |
| Analytics overview | 5-min staleness OK | Server component + ISR | `revalidate: 300` |
| Time-series chart data | Request-time | Client-side fetch with SWR | `useSWR` with `refreshInterval: 60000` |
| Score data | Static until rescan | Server component + on-demand revalidation | `revalidateTag('score-{siteId}')` |
| Alert feed | Real-time preferred | Client-side polling | `useSWR` with `refreshInterval: 30000` |
| Optimization status | Request-time | Server component + client refresh | RSC + manual refresh button |
| Notification count | Real-time | Client-side polling | `useSWR` with `refreshInterval: 15000` |

### Loading States

Every page implements three states:

1. **Skeleton:** Structural placeholder matching the final layout dimensions. Uses `animate-pulse` on gray rectangles. Never use spinners for full-page loads.

2. **Partial data:** When some API calls succeed and others fail, show available data immediately. Failed sections show inline error with retry button: "Failed to load crawler activity. [Retry]"

3. **Empty:** Designed empty state per component (icon + message + CTA). Never show a blank container.

### Error Handling

| Error Type | User Experience |
|---|---|
| API timeout | Show cached data (if available) + stale data banner |
| 401/403 | Redirect to sign-in (Clerk handles) |
| 404 (site not found) | "Site not found" page with link to site list |
| 429 (rate limited) | Toast: "Too many requests. Retrying in [X]s." Auto-retry. |
| 500 (server error) | Inline error in affected section. Other sections continue working. |
| Network offline | Banner: "You're offline. Showing cached data." |

### Caching & Revalidation

```
Client (SWR)  →  Next.js RSC (ISR)  →  API Routes  →  Supabase / Redis
     ↑                  ↑                     ↑              ↑
  60s poll        300s revalidate        rate-limited     connection pool
  stale-while-    on-demand via          per-user         max 10 connections
  revalidate      revalidateTag()        per-endpoint     per serverless fn
```

### Security Patterns

| Concern | Implementation |
|---|---|
| Auth | Clerk JWT verified server-side on every API route via `auth()` |
| Tenant isolation | Every query includes `WHERE org_id = ?` (repository pattern Phase 0, RLS Phase 1) |
| Site ownership | `sites.org_id` must match current org from Clerk session |
| CSRF | Clerk handles via SameSite cookies |
| Rate limiting | Upstash Redis sliding window per user per endpoint |
| Webhook secrets | HMAC-SHA256 signature on all outbound webhooks |
| API keys | Hashed in DB, displayed once on creation, prefixed `cr_api_` |
| Input validation | Zod schemas on all API route inputs |

### Feature Gating

```typescript
// Feature gate configuration (Vercel Edge Config or local config)
const FEATURE_GATES: Record<Feature, Tier[]> = {
  'optimization.pipeline': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'optimization.fixed': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'optimization.config': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'optimization.cache': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'optimization.bot_rules': ['business', 'enterprise'],
  'optimization.ab_testing': ['business', 'enterprise'],
  'optimization.no_backlink': ['starter', 'pro', 'business', 'enterprise'],
  // Analytics
  'analytics.overview': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'analytics.explorer': ['starter', 'pro', 'business', 'enterprise'],
  'analytics.export': ['starter', 'pro', 'business', 'enterprise'],
  'analytics.alerts': ['starter', 'pro', 'business', 'enterprise'],
  // AI Readiness
  'readiness.score': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'readiness.attention': ['free', 'starter', 'pro', 'business', 'enterprise'],
  'readiness.history': ['starter', 'pro', 'business', 'enterprise'],
  // Citations
  'citations.tracker': ['business', 'enterprise'],
  'citations.competitors': ['business', 'enterprise'],
  // Settings
  'settings.team': ['business', 'enterprise'],
  'settings.webhooks': ['pro', 'business', 'enterprise'],
  'integration.key_rotation': ['starter', 'pro', 'business', 'enterprise'],
  'integration.verification': ['starter', 'pro', 'business', 'enterprise'],
};
```

**Tier differentiation for optimization:**
- **Free:** Full pipeline, backlink on optimized pages ("Powered by CrawlReady"), basic config
- **Starter ($29):** No backlink, full config, score history
- **Pro ($49):** Webhooks, analytics export, higher crawl budget
- **Business ($199):** Custom bot rules, A/B testing, citations, team seats
- **Enterprise:** DNS proxy, SLA, dedicated support

Locked features are always **visible but gated.** The component renders with reduced opacity, a lock icon, and a tooltip: "Available on [Tier] plan. [Upgrade →]". This is the primary upsell surface.

---

## Responsive Breakpoints
| Breakpoint | Viewport | Layout Behavior |
|---|---|---|
| `sm` | < 640px | Single column. Bottom nav (5 items). Site selector full-width below header. Stat cards stack vertically. Tables scroll horizontally. |
| `md` | 640-1024px | Icon-only sidebar (expandable on hover). 2-column grid for stat cards. Tables show key columns, rest in expandable row. |
| `lg` | 1024-1280px | Full sidebar (collapsible). 3-4 column stat cards. Full tables. |
| `xl` | > 1280px | Full sidebar. 4-column stat cards. Side-by-side panels where applicable. |

### Mobile Bottom Navigation

```
┌────────────────────────────────────────────────┐
│ [Overview] [Optimize] [Analytics] [Setup] [More ⋯] │
└────────────────────────────────────────────────┘
```

"More" opens a slide-up sheet with: AI Readiness, Citations, Settings, Sign out.

---

## Phase Rollout Plan

| Phase | Dashboard Surfaces Shipped |
|---|---|
| **Phase 0** | Dashboard shell, site management, integration setup (snippets + key), **optimization pipeline (hero feature, all tiers)**, "What We Fixed" page, "Needs Your Attention", AI Readiness score, onboarding with synthetic bot verification + optimization activation, settings (account, billing placeholder) |
| **Phase 1** | Analytics (overview, bots, pages, alerts, query explorer), score history chart, data export, domain verification, key rotation, notification preferences, webhook settings |
| **Phase 1.5** | Partner attribution tracking in analytics (source column), referral link display |
| **Phase 2** | Advanced optimization config (format routing, Schema overrides, content rules), content preview side-by-side, cache management UI, CI/CD cache invalidation |
| **Phase 3** | Citations (tracker, competitor comparison, query coverage) |
| **Phase 4** | Team management, custom bot rules, A/B testing UI, DNS proxy management, enterprise admin |

Each phase ships with:
- Feature pages for that phase's capabilities
- Teaser/locked states for next phase features
- Updated empty states and onboarding steps
- Loading skeletons and error boundaries for new data sources

---

## Component Library Requirements

The dashboard requires these components beyond what exists in `src/components/ui/`:

| Component | Purpose | Priority |
|---|---|---|
| `SiteSelector` | Header dropdown with domain + score + status | Phase 0 |
| `OrgSelector` | Header dropdown with org name + plan badge | Phase 0 |
| `StatCard` | Metric + trend + label card | Phase 0 |
| `ScoreGauge` | SVG ring gauge (sm/md/lg) with animation | Phase 0 (exists) |
| `PipelineStatusBar` | Pipeline health summary (pages, cache, schema, budget) | Phase 0 |
| `PipelineTable` | Page-level optimization status with "What We Did" column | Phase 0 |
| `AutoFixBanner` | Summary of auto-fixed issues with link to detail | Phase 0 |
| `NeedsAttentionCard` | Non-auto-fixable issue with evidence + why + fix | Phase 0 |
| `ContentPreview` | Side-by-side origin vs. optimized content panel | Phase 0 |
| `BacklinkNotice` | Free tier backlink notice with upgrade CTA | Phase 0 |
| `FeatureGate` | Wrapper that gates content by tier | Phase 0 |
| `EmptyState` | Icon + message + CTA placeholder | Phase 0 |
| `SkeletonLayout` | Page-level skeleton matching layout | Phase 0 |
| `CodeSnippet` | Syntax-highlighted code with copy + framework tabs | Phase 0 |
| `StatusBanner` | Full-width integration status indicator | Phase 0 |
| `SparklineChart` | Inline trend mini-chart | Phase 1 |
| `TimeSeriesChart` | Full analytics area/line chart | Phase 1 |
| `DataTable` | Sortable, paginated, searchable table with filters | Phase 1 |
| `QueryExplorer` | Search + combinable filters + saved presets | Phase 1 |
| `AlertCard` | Severity-colored alert with actions | Phase 1 |
| `FilterBar` | Date range + export controls | Phase 1 |
| `NotificationPanel` | Slide-out or dropdown notification list | Phase 1 |
| `UsageMeter` | Progress bar with limit label | Phase 1 |
| `PlanComparison` | Tier comparison table with current plan highlight | Phase 1 |

---

## Decisions

- **Optimization is the hero feature.** Available to ALL tiers including free. Free tier includes CrawlReady backlink on optimized pages; paid tiers remove it. This is the #1 value proposition.
- **Auto-fix vs. Needs Your Attention.** CrawlReady auto-fixes Schema, content optimization, ARIA. Dashboard only surfaces issues the user must fix (robots.txt, auth-gated pages, server config). Don't show auto-fixable issues as problems.
- **Plug-and-play default.** The optimization pipeline works with zero configuration. Advanced settings available via progressive disclosure. Users never *have* to configure anything.
- **Synthetic bot verification in onboarding.** CrawlReady sends fake AI bot requests to the user's site to instantly verify integration. Don't wait for real crawlers.
- **Navigation model:** Collapsible sidebar + header with site/org selectors. Optimization is #2 nav item (right after Overview). Analytics is #3.
- **Site scoping:** URL contains `[orgSlug]/[siteId]`. Enables deep-linking and multi-org support.
- **Adaptive landing:** 0 sites → empty state, 1 site → auto-redirect, 2+ sites → portfolio grid.
- **Onboarding:** Separate flow with 6 steps (including verification + optimization activation). Loops back on incomplete.
- **Feature gating:** Locked features are visible but gated with upgrade CTAs. Never hide features.
- **Analytics queryability:** Query explorer with full-text search, combinable filters, saved presets, and export. Not just charts.
- **Loading strategy:** Skeletons matching layout, partial data shown immediately, inline error recovery.
- **Mobile:** Full responsive with bottom nav (Overview, Optimize, Analytics, Setup, More).
- **Data fetching:** RSC + ISR for page loads, SWR for real-time data, polling for notifications/alerts.
- **Org-scoped from day 1:** Uses Clerk Organizations. Personal org auto-created. Sites belong to orgs.
- **Diagnostic stays separate:** Public /scan tool is independent. Dashboard links to score pages, does not embed rescan.
- **Notifications:** In-app bell + email digests + webhook endpoints. Event-driven architecture.
- **Free tier backlink model:** Backlink injected in the optimized AI page generated by CrawlReady's content pipeline. CrawlReady controls the optimized page. Zero customer action required.
