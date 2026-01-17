# Dashboard: Rendered Pages Browser - Functional Specification

## Overview

The Rendered Pages Browser allows users to view, search, and manage all pages that have been rendered through their API keys. Users can preview rendered HTML, invalidate cache entries, and analyze which pages are cached where (hot vs cold storage).

## User Stories

### US-1: View Rendered Pages List
**As a** logged-in user  
**I want to** see all pages I've rendered  
**So that** I can monitor my rendered content

**Acceptance Criteria:**
- Table displays all user's rendered pages with columns:
  - URL (truncated, full URL in tooltip)
  - Rendered Date/Time
  - Cache Location (Hot/Cold/None)
  - Status (Cached/Expired/Failed)
  - Size (HTML byte size)
  - **Crawler Name** (e.g., "Googlebot", "GPTBot", "Claude-Web") - NEW
  - **Crawler Type** (e.g., "search", "ai", "social", "monitoring") - NEW
  - Actions (Preview, Invalidate)
- Default sort: Newest first (by rendered date)
- Pagination: 50 items per page
- Total count shown: "Showing 1-50 of 1,234 pages"
- Empty state if no pages rendered
- **Site selector dropdown** to filter pages by site (links to Sites management)

### US-2: Search/Filter Pages
**As a** logged-in user  
**I want to** search for specific pages  
**So that** I can quickly find rendered content

**Acceptance Criteria:**
- Search box at top of table
- Search by URL (partial match, case-insensitive)
- Debounced search (300ms)
- Filter dropdowns:
  - **Site:** All Sites / [Site Name] (links to Sites management) - NEW
  - Cache Location: All / Hot / Cold / None
  - Status: All / Cached / Expired / Failed
  - Date Range: Last 24h / 7d / 30d / All time
  - **Crawler Type:** All / Search Engines / AI Crawlers / Social / Monitoring - NEW
  - **Crawler Name:** All / Googlebot / GPTBot / Claude-Web / etc. - NEW
- Filters are combinable (AND logic)
- Clear all filters button
- Search persists in URL query params (shareable/bookmarkable)

### US-3: Preview Rendered HTML
**As a** logged-in user  
**I want to** preview the rendered HTML  
**So that** I can verify the content looks correct

**Acceptance Criteria:**
- "Preview" button opens modal with iframe
- Modal shows:
  - URL at top
  - Rendered date
  - Size (e.g., "125 KB")
  - [View Raw HTML] [Copy HTML] buttons
- Iframe displays rendered HTML (sandboxed)
- Sandbox attributes:
  - `sandbox="allow-same-origin"` (for rendering)
  - No JavaScript execution
  - No form submission
  - No external requests
- Modal is full-screen on mobile, centered (80% width) on desktop
- Close button (X) and ESC key to close

### US-4: View Raw HTML Source
**As a** logged-in user  
**I want to** see the raw HTML source  
**So that** I can inspect or copy the optimized HTML

**Acceptance Criteria:**
- "View Raw HTML" button in preview modal
- Opens code viewer with:
  - Syntax highlighting
  - Line numbers
  - Copy button (copies all HTML)
  - Download button (saves as .html file)
- Code viewer is read-only
- Search within code (Ctrl+F works)
- Collapsible sections for large HTML

### US-5: Invalidate Cache Entry
**As a** logged-in user  
**I want to** remove a page from cache  
**So that** the next request will re-render fresh content

**Acceptance Criteria:**
- "Invalidate" button in Actions column
- Confirmation dialog:
  - Title: "Invalidate Cache?"
  - Message: "This will remove the cached version. The next request will trigger a fresh render."
  - URL shown
  - Buttons: "Cancel" | "Invalidate"
- Upon confirmation:
  - Remove from Redis (hot cache)
  - Mark as invalidated in Supabase (metadata update)
  - Row updates to show "None" cache location
  - Success toast: "Cache invalidated for {url}"
- Failed invalidation shows error toast with retry option

### US-6: Copy Rendered HTML
**As a** logged-in user  
**I want to** quickly copy rendered HTML  
**So that** I can use it elsewhere

**Acceptance Criteria:**
- "Copy HTML" button in preview modal
- Copies full HTML to clipboard
- Success feedback: Button shows checkmark, text changes to "Copied!"
- Fallback for browsers without Clipboard API
- Works with large HTML (tested up to 1MB)

### US-7: Filter by API Key
**As a** logged-in user with multiple API keys  
**I want to** filter pages by which key rendered them  
**So that** I can see renders from specific integrations

**Acceptance Criteria:**
- Dropdown: "All Keys" or specific key prefix
- Updates table to show only pages rendered with that key
- Combined with other filters (URL search, date range)
- Shows count: "234 pages from sk_live_abc..."

### US-8: View Crawler Attribution
**As a** logged-in user  
**I want to** see which crawler accessed each rendered page  
**So that** I can understand my AI and search engine visibility

**Acceptance Criteria:**
- Each row shows crawler name and type (when available)
- Crawler name displayed with recognizable icon:
  - 🔍 Search Engines: Googlebot, Bingbot, etc.
  - 🤖 AI Crawlers: GPTBot, Claude-Web, Anthropic-AI, PerplexityBot, etc.
  - 📱 Social: TwitterBot, FacebookBot, LinkedInBot
  - 📊 Monitoring: UptimeRobot, Pingdom
  - ❓ Unknown: Unrecognized user agents
- Crawler type badge: "Search", "AI", "Social", "Monitoring", "Unknown"
- Hover tooltip shows full user-agent string
- Filter by crawler type or specific crawler name
- "Direct" shown when page was rendered via direct API call (no crawler)

### US-9: Filter by Site
**As a** logged-in user with multiple sites  
**I want to** filter pages by site  
**So that** I can focus on renders for a specific domain

**Acceptance Criteria:**
- Site selector dropdown at top of filters
- Shows all registered sites plus "All Sites" option
- Updates table to show only pages from selected site
- Site name displayed with domain and optional favicon
- Quick link: "[Manage Sites]" navigates to Sites management page
- Combined with other filters (crawler, date range, etc.)

## UI Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Rendered Pages                                            [Manage Sites →]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  [Site: All Sites ▼]  [🔍 Search by URL...]  [Cache: All ▼]  [Status: All ▼]│
│  [Crawler Type: All ▼]  [Crawler: All ▼]  [Key: All ▼]  [Date: 7d ▼]        │
│  [Clear Filters]                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│  Showing 1-50 of 1,234 pages                                                 │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ URL             │ Crawler        │ Type   │ Rendered  │ Cache │ Actions │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ example.com/p1  │ 🤖 GPTBot      │ AI     │ 2 min ago │  🔴   │ [👁][🗑]│ │
│  │ example.com/p2  │ 🔍 Googlebot   │ Search │ 5 min ago │  🟢   │ [👁][🗑]│ │
│  │ test.com/page   │ 📱 TwitterBot  │ Social │ 1 hr ago  │  🟡   │ [👁][🗑]│ │
│  │ mysite.com/blog │ — Direct       │ API    │ 2 hr ago  │  🟢   │ [👁][🗑]│ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  [← Previous]  Page 1 of 25  [Next →]                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Preview Modal Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Preview: example.com/page1                              [✕]    │
├─────────────────────────────────────────────────────────────────┤
│  Rendered: 2 minutes ago  •  Size: 125 KB                       │
│  [View Raw HTML]  [Copy HTML]  [Download]                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │   [Rendered page content in sandboxed iframe]            │ │
│  │                                                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoint Contracts

### GET /api/user/pages

**Request:**
Query params:
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 100)
- `search`: string (URL search term)
- `siteId`: UUID (filter by site) - NEW
- `cacheLocation`: 'hot' | 'cold' | 'none' | 'all' (default: 'all')
- `status`: 'cached' | 'expired' | 'failed' | 'all' (default: 'all')
- `dateRange`: '24h' | '7d' | '30d' | 'all' (default: 'all')
- `keyId`: UUID (filter by API key)
- `crawlerType`: 'search' | 'ai' | 'social' | 'monitoring' | 'unknown' | 'direct' | 'all' (default: 'all') - NEW
- `crawlerName`: string (e.g., 'Googlebot', 'GPTBot') - NEW

**Response (Success - 200):**
```typescript
{
  pages: Array<{
    id: string;
    url: string;
    renderedAt: string;         // ISO 8601
    cacheLocation: 'hot' | 'cold' | 'none';
    status: 'cached' | 'expired' | 'failed';
    htmlSize: number;            // bytes
    apiKeyPrefix: string;        // Which key rendered it
    jobId: string;               // Reference to render job
    siteId?: string;             // Site ID if associated - NEW
    siteName?: string;           // Site display name - NEW
    crawler: {                   // Crawler attribution - NEW
      name: string | null;       // e.g., 'GPTBot', 'Googlebot', null for direct API
      type: 'search' | 'ai' | 'social' | 'monitoring' | 'unknown' | 'direct';
      userAgent?: string;        // Full user-agent string (for tooltip)
    };
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  sites: Array<{                // Available sites for filter dropdown - NEW
    id: string;
    name: string;
    domain: string;
  }>;
  crawlerTypes: string[];       // Available crawler types for filter - NEW
  crawlerNames: string[];       // Available crawler names for filter - NEW
}
```

### GET /api/user/pages/:pageId/html

**Request:** Page ID in URL

**Response (Success - 200):**
```typescript
{
  id: string;
  url: string;
  html: string;                  // Full rendered HTML
  renderedAt: string;
  htmlSize: number;
  cacheLocation: 'hot' | 'cold';
}
```

**Response (Error - 404):**
```typescript
{
  error: "Not found";
  message: "Rendered page not found or does not belong to you";
}
```

### DELETE /api/user/pages/:pageId

**Request:** Page ID in URL

**Response (Success - 200):**
```typescript
{
  message: "Cache invalidated successfully";
  url: string;
  pageId: string;
}
```

**Response (Error - 404):**
```typescript
{
  error: "Not found";
  message: "Rendered page not found or cannot be invalidated";
}
```

### POST /api/user/pages/bulk-invalidate

**Request:**
```typescript
{
  pageIds: string[];            // Array of page IDs
}
```

**Response (Success - 200):**
```typescript
{
  message: "Bulk invalidation completed";
  invalidated: number;          // Count of successfully invalidated
  failed: number;               // Count of failures
  errors?: Array<{
    pageId: string;
    error: string;
  }>;
}
```

## Cache Location Indicators

Visual badges for cache locations:

- **Hot (Redis):** 🔴 Red badge, "Hot" label, tooltip: "In Redis cache (fastest)"
- **Cold (Supabase):** 🟡 Yellow badge, "Cold" label, tooltip: "In Supabase storage (fast)"
- **None:** 🔵 Gray badge, "None" label, tooltip: "Not cached, will re-render"

## Crawler Attribution

### Crawler Type Categories

| Type | Icon | Examples | Description |
|------|------|----------|-------------|
| Search | 🔍 | Googlebot, Bingbot, DuckDuckBot | Traditional search engine crawlers |
| AI | 🤖 | GPTBot, Claude-Web, PerplexityBot, Anthropic-AI | AI/LLM training and retrieval crawlers |
| Social | 📱 | TwitterBot, FacebookBot, LinkedInBot | Social media preview generators |
| Monitoring | 📊 | UptimeRobot, Pingdom, DatadogSynthetics | Uptime and performance monitors |
| Unknown | ❓ | (unrecognized user agents) | Unidentified crawlers |
| Direct | — | (no user agent / API call) | Direct API requests, not from crawler |

### Known AI Crawlers

The system recognizes these AI-related crawlers:

| Crawler Name | User-Agent Pattern | Organization |
|--------------|-------------------|--------------|
| GPTBot | `GPTBot/1.0` | OpenAI |
| ChatGPT-User | `ChatGPT-User` | OpenAI |
| Claude-Web | `Claude-Web` | Anthropic |
| Anthropic-AI | `anthropic-ai` | Anthropic |
| PerplexityBot | `PerplexityBot` | Perplexity |
| Google-Extended | `Google-Extended` | Google |
| Bytespider | `Bytespider` | ByteDance |
| CCBot | `CCBot` | Common Crawl |
| cohere-ai | `cohere-ai` | Cohere |

### Crawler Detection Logic

```typescript
function detectCrawler(userAgent: string | null): CrawlerInfo {
  if (!userAgent) {
    return { name: null, type: 'direct' };
  }
  
  // AI Crawlers (check first - more specific)
  if (userAgent.includes('GPTBot')) return { name: 'GPTBot', type: 'ai' };
  if (userAgent.includes('Claude-Web')) return { name: 'Claude-Web', type: 'ai' };
  // ... etc.
  
  // Search Engines
  if (userAgent.includes('Googlebot')) return { name: 'Googlebot', type: 'search' };
  if (userAgent.includes('Bingbot')) return { name: 'Bingbot', type: 'search' };
  // ... etc.
  
  return { name: null, type: 'unknown' };
}
```

## Validation Rules

### Search
- **Min Length:** 3 characters to trigger search
- **Max Length:** 500 characters
- **Debounce:** 300ms delay after last keystroke

### Pagination
- **Page:** Must be >= 1, <= totalPages
- **Limit:** Must be between 1-100
- **Default:** Page 1, limit 50

### Filters
- **Site ID:** Must be valid UUID and belong to user's organization
- **Cache Location:** Must be valid enum value
- **Status:** Must be valid enum value
- **Date Range:** Must be valid time range
- **Key ID:** Must be valid UUID and belong to user
- **Crawler Type:** Must be valid enum: 'search', 'ai', 'social', 'monitoring', 'unknown', 'direct', 'all'
- **Crawler Name:** Free text, matched against known crawler names

### Invalidation
- **Ownership:** Can only invalidate own pages
- **Bulk Limit:** Max 100 pages per bulk invalidation request
- **Idempotency:** Invalidating already-invalidated page returns success

## Error States

### No Pages Rendered
**Display:**
```
┌─────────────────────────────────────────┐
│             📄                          │
│                                         │
│   No rendered pages yet                 │
│                                         │
│  Make your first API request to         │
│     CrawlReady to see pages here       │
│                                         │
│   [View API Documentation]              │
└─────────────────────────────────────────┘
```

### No Search Results
**Display:**
```
┌─────────────────────────────────────────┐
│             🔍                          │
│                                         │
│  No pages found matching "example"      │
│                                         │
│  Try adjusting your search or filters   │
│                                         │
│        [Clear Filters]                  │
└─────────────────────────────────────────┘
```

### Failed to Load HTML Preview
**Modal Display:**
```
┌─────────────────────────────────────────┐
│             ⚠️                          │
│                                         │
│  Failed to load HTML preview            │
│                                         │
│  The page may have been deleted or      │
│    moved to cold storage.               │
│                                         │
│    [Try Again]  [Close]                 │
└─────────────────────────────────────────┘
```

### Invalidation Failed
**Toast Message:** "Failed to invalidate cache. Please try again or contact support."

## Success Flows

### Flow 1: Search and Preview Page
1. User navigates to Rendered Pages Browser
2. Table loads with 50 most recent pages
3. User types "example.com" in search box
4. After 300ms, table filters to matching URLs (12 results)
5. User clicks preview icon on first result
6. Modal opens, shows loading skeleton
7. HTML loads and displays in iframe (< 1 second)
8. User sees rendered page content
9. User clicks "View Raw HTML"
10. Code viewer opens with syntax highlighting
11. User clicks "Copy HTML"
12. Success feedback: "Copied!"
13. User closes modal (ESC key)

### Flow 2: Invalidate Stale Cache
1. User sees a page cached 2 days ago
2. Clicks invalidate icon (trash)
3. Confirmation dialog appears
4. User clicks "Invalidate"
5. Loading spinner on row (< 500ms)
6. Row updates: Cache location changes to "None"
7. Success toast: "Cache invalidated for example.com/page1"
8. Page stays in list but shows as uncached

### Flow 3: Filter by API Key
1. User has 3 API keys
2. Selects "Production Key (sk_live_abc...)" from dropdown
3. Table refreshes to show only pages from that key (89 results)
4. User sees which pages their production app is rendering
5. User clears filter to see all keys again

### Flow 4: Bulk Invalidate
1. User wants to invalidate multiple pages from same domain
2. Searches for "test.com"
3. Results show 15 pages from test.com
4. User clicks "Select All" checkbox (top of table)
5. Clicks "Bulk Actions" → "Invalidate Selected"
6. Confirmation dialog shows count: "Invalidate 15 pages?"
7. User confirms
8. Progress indicator: "Invalidating 5 of 15..."
9. Success toast: "Successfully invalidated 15 pages"
10. Table refreshes to show updated cache status

## Accessibility Requirements

- Table sortable via keyboard (Space/Enter on headers)
- Preview modal focus trapped, ESC to close
- All actions have aria-labels
- Cache location badges have accessible text
- Loading states announced to screen readers
- Error messages have role="alert"
- Pagination keyboard navigable
- Search box has clear label and placeholder

## Localization

- Date/time formatted per locale
- File sizes: "125 KB" (en), "125 Ko" (fr)
- Status labels translated
- Search placeholder translated
- Pagination text translated: "Page 1 of 25" / "Page 1 sur 25"

## Dependencies

- `/api/user/pages` endpoints
- Modal/Dialog component
- Syntax highlighter: Prism.js or Shiki
- Clipboard API with fallback
- Table component with sorting/pagination
- Debounce utility (lodash.debounce or custom)

## Future Enhancements (Out of Scope for MVP)

- Bulk operations (invalidate multiple pages)
- Compare rendered versions (before/after)
- Screenshot thumbnail preview
- Page diff viewer (show changes)
- Download as PDF
- Share rendered page (temporary public link)
- Auto-refresh on new renders
- Export list as CSV
- Favorite/bookmark pages
- Add notes/tags to pages

