# Dashboard: Crawler Activity Feed - Functional Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Dependencies:** Sites Management, Cache Access Logging

---

## 1. Overview

### 1.1 Purpose

The Crawler Activity Feed provides real-time visibility into AI crawler visits to the user's site. This is the primary proof that CrawlReady is working—users can see exactly which AI bots visited, what pages they accessed, and whether they received pre-rendered content.

### 1.2 Key Value Proposition

> "See exactly which AI crawlers are visiting your site and confirm they're getting the right content."

This feature answers the user's core question: **"Is CrawlReady actually working?"**

### 1.3 Design Principles

1. **Real-time:** Updates should appear within seconds of a crawler visit
2. **Filterable:** Users can focus on specific crawlers or time periods
3. **Actionable:** Each entry provides context and links to relevant pages
4. **Scannable:** Quick visual indicators for status at a glance

---

## 2. User Stories

### US-1: View Recent Crawler Activity

**As a** logged-in user
**I want to** see recent AI crawler visits to my site
**So that** I know my integration is working

**Acceptance Criteria:**
- [ ] Feed shows crawler visits in reverse chronological order
- [ ] Each entry displays: crawler name, URL, timestamp, status
- [ ] Auto-refresh every 30 seconds
- [ ] Manual refresh button available
- [ ] Shows "No activity yet" for new sites

### US-2: Filter Activity by Crawler

**As a** logged-in user
**I want to** filter activity by specific AI crawler
**So that** I can see which platforms are indexing my content

**Acceptance Criteria:**
- [ ] Dropdown to select specific crawler or "All Crawlers"
- [ ] Filter persists during session
- [ ] Shows count of results after filtering
- [ ] Quick filter buttons for top 3 crawlers

### US-3: Filter Activity by Time Period

**As a** logged-in user
**I want to** filter activity by time period
**So that** I can analyze patterns over time

**Acceptance Criteria:**
- [ ] Time filter options: Last hour, Today, 7 days, 30 days, Custom
- [ ] Custom date range picker
- [ ] Time filter combines with crawler filter
- [ ] Shows date range in results header

### US-4: View Activity Details

**As a** logged-in user
**I want to** see detailed information about a crawler visit
**So that** I can troubleshoot issues

**Acceptance Criteria:**
- [ ] Click row to expand details panel
- [ ] Details show:
  - Full URL (not truncated)
  - Exact timestamp
  - Response time (ms)
  - Cache status (hit/miss, hot/cold)
  - Response size (bytes)
  - User agent string
- [ ] "View rendered page" link (if cached)
- [ ] "Test this URL" button

### US-5: Export Activity Data

**As a** logged-in user
**I want to** export activity data
**So that** I can analyze it in external tools

**Acceptance Criteria:**
- [ ] Export button visible when results exist
- [ ] Export formats: CSV, JSON
- [ ] Exports current filtered view
- [ ] Includes all detail fields
- [ ] Filename includes site and date range

### US-6: View Activity Statistics

**As a** logged-in user
**I want to** see summary statistics for crawler activity
**So that** I can understand patterns at a glance

**Acceptance Criteria:**
- [ ] Stats bar showing:
  - Total visits in period
  - Unique pages visited
  - Top crawler
  - Success rate
- [ ] Stats update with filter changes
- [ ] Trend indicators vs previous period

---

## 3. UI Specifications

### 3.1 Full Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Crawler Activity                                                        │
│  See which AI crawlers are visiting your site                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FILTERS                                                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────────┐│
│  │ All Crawlers  ▼  │ │ Last 7 days   ▼  │ │ 🔍 Search URLs...         ││
│  └──────────────────┘ └──────────────────┘ └────────────────────────────┘│
│                                                                          │
│  QUICK STATS                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │   1,234    │ │    89      │ │  GPTBot    │ │   98.2%    │            │
│  │  Visits    │ │   Pages    │ │ Top Crawler│ │ Success    │            │
│  │  ↑ +15%    │ │  ↑ +5      │ │  (456)     │ │   Rate     │            │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
│                                                                          │
│  ACTIVITY FEED                                              [🔄] [Export]│
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Crawler      │ URL                      │ Time      │ Status        ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │ 🤖 GPTBot    │ /pricing                 │ 2 min ago │ ✓ Served 45ms ││
│  │ 🔵 ClaudeBot │ /features                │ 15 min ago│ ✓ Served 52ms ││
│  │ 🟣 Perplexity│ /blog/ai-search-guide    │ 1 hr ago  │ ✓ Served 38ms ││
│  │ 🤖 GPTBot    │ /about                   │ 2 hr ago  │ ✓ Served 41ms ││
│  │ 🔵 ClaudeBot │ /                        │ 3 hr ago  │ ⚠ Cache Miss  ││
│  │ 🤖 GPTBot    │ /products/widget         │ 5 hr ago  │ ✓ Served 55ms ││
│  │ 🟢 Google-Ex │ /docs/getting-started    │ 6 hr ago  │ ✓ Served 42ms ││
│  │ ...                                                                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Showing 1-50 of 1,234 visits                    [← Prev] Page 1 [Next →]│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Expanded Row Detail

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🤖 GPTBot visited /pricing                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Full URL:     https://mysite.com/pricing                                │
│  Timestamp:    January 11, 2026 at 2:34:56 PM UTC                        │
│  Response:     ✓ Served from hot cache                                   │
│  Latency:      45ms                                                      │
│  Size:         125.4 KB                                                  │
│                                                                          │
│  User Agent:                                                             │
│  Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)        │
│                                                                          │
│  [View Rendered Page]    [Test This URL]    [Invalidate Cache]           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component: Activity Row

| Element | Specification |
|---------|---------------|
| Crawler Icon | Color-coded by platform (see 3.4) |
| Crawler Name | Truncated to 12 chars on mobile |
| URL | Truncated with tooltip, path only (no domain) |
| Timestamp | Relative (< 24h) or date (> 24h) |
| Status Badge | Color + icon + text |

### 3.4 Crawler Icons and Colors

| Crawler | Icon | Color | Hex |
|---------|------|-------|-----|
| GPTBot, ChatGPT-User, OAI-SearchBot | 🤖 | Green | #10B981 |
| ClaudeBot, Claude-Web | 🔵 | Blue | #3B82F6 |
| PerplexityBot | 🟣 | Purple | #8B5CF6 |
| Google-Extended | 🟢 | Teal | #14B8A6 |
| Applebot-Extended | ⚪ | Gray | #6B7280 |
| Meta-ExternalAgent | 🔷 | Navy | #1E40AF |
| Other | ⚫ | Gray | #9CA3AF |

### 3.5 Status Badges

| Status | Badge | Color | Description |
|--------|-------|-------|-------------|
| Served (Hot) | ✓ Served | Green | From Redis cache |
| Served (Cold) | ✓ Served | Yellow | From Supabase storage |
| Cache Miss | ⚠ Miss | Orange | Triggered new render |
| Error | ✗ Error | Red | Render failed |
| Queued | ⏳ Queued | Gray | Waiting for render |

---

## 4. Empty States

### 4.1 No Activity Yet (New Site)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              🕐                                          │
│                                                                          │
│              Waiting for your first crawler visit                        │
│                                                                          │
│  Your site is set up and ready! AI crawlers typically visit new          │
│  sites within 7 days. Here's what you can do while waiting:              │
│                                                                          │
│  • Submit your sitemap to search engines                                 │
│  • Share your content on social media                                    │
│  • Test your integration with our Test Render tool                       │
│                                                                          │
│  [Test Render Now]    [Submit Sitemap Guide]                             │
│                                                                          │
│  We'll email you when your first crawler visits!                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 No Results for Filter

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              🔍                                          │
│                                                                          │
│              No activity matches your filters                            │
│                                                                          │
│  Try adjusting your filters or time range to see more results.           │
│                                                                          │
│  [Clear Filters]                                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Integration Not Working

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ⚠️ No crawler activity detected in 14 days                              │
│                                                                          │
│  This might indicate an integration issue. Let's troubleshoot:           │
│                                                                          │
│  1. Test your integration                                                │
│  2. Verify your middleware is deployed                                   │
│  3. Check your API key is correct                                        │
│                                                                          │
│  [Test Integration]    [View Troubleshooting Guide]                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Endpoint Contracts

### 5.1 GET /api/user/activity

**Description:** Fetch crawler activity for a site.

**Authentication:** Clerk session required

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| siteId | UUID | Yes | - | Site to fetch activity for |
| crawler | string | No | all | Filter by crawler type |
| status | string | No | all | Filter by status |
| startDate | ISO date | No | 7 days ago | Start of date range |
| endDate | ISO date | No | now | End of date range |
| search | string | No | - | Search URLs |
| page | number | No | 1 | Page number |
| limit | number | No | 50 | Items per page |

**Response (200):**

```typescript
interface ActivityResponse {
  stats: {
    totalVisits: number;
    uniquePages: number;
    topCrawler: {
      name: string;
      count: number;
    };
    successRate: number;
    trends: {
      visitsChange: number;        // Percentage vs previous period
      pagesChange: number;
    };
  };
  activity: Array<{
    id: string;
    crawlerName: string;
    crawlerType: 'openai' | 'anthropic' | 'perplexity' | 'google' | 'meta' | 'apple' | 'other';
    url: string;
    fullUrl: string;
    timestamp: string;
    status: 'served_hot' | 'served_cold' | 'cache_miss' | 'error' | 'queued';
    responseTime: number | null;   // ms, null if error/queued
    responseSize: number | null;   // bytes
    userAgent: string;
    errorMessage?: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasMore: boolean;
  };
  filters: {
    crawler: string;
    status: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
}
```

### 5.2 GET /api/user/activity/:activityId

**Description:** Get detailed information about a specific activity entry.

**Response (200):**

```typescript
{
  id: string;
  crawlerName: string;
  crawlerType: string;
  url: string;
  fullUrl: string;
  timestamp: string;
  status: string;
  responseTime: number | null;
  responseSize: number | null;
  cacheLocation: 'hot' | 'cold' | 'none';
  userAgent: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  errorMessage?: string;
  errorCode?: string;
  relatedJobId?: string;
  renderedPageId?: string;
}
```

### 5.3 GET /api/user/activity/export

**Description:** Export activity data.

**Query Parameters:**

| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| siteId | UUID | Yes | - |
| format | string | No | csv |
| startDate | ISO date | No | 7 days ago |
| endDate | ISO date | No | now |
| crawler | string | No | all |

**Response (200):**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="crawlready-activity-2026-01-11.csv"

timestamp,crawler,url,status,response_time_ms,response_size_bytes,cache_location
2026-01-11T14:34:56Z,GPTBot,/pricing,served_hot,45,128456,hot
2026-01-11T14:19:23Z,ClaudeBot,/features,served_hot,52,98234,hot
...
```

### 5.4 GET /api/user/activity/realtime

**Description:** Server-Sent Events endpoint for real-time updates.

**Response:** SSE stream

```typescript
// Event format
event: activity
data: {"id":"uuid","crawlerName":"GPTBot","url":"/pricing","timestamp":"...","status":"served_hot"}

event: activity
data: {"id":"uuid","crawlerName":"ClaudeBot","url":"/about","timestamp":"...","status":"cache_miss"}
```

---

## 6. Data Model

### 6.1 Crawler Activity Table

This builds on the existing `cache_accesses` table but adds crawler identification:

```sql
-- Add crawler fields to cache_accesses or create new table
ALTER TABLE cache_accesses ADD COLUMN IF NOT EXISTS crawler_name VARCHAR(100);
ALTER TABLE cache_accesses ADD COLUMN IF NOT EXISTS crawler_type VARCHAR(50);
ALTER TABLE cache_accesses ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE cache_accesses ADD COLUMN IF NOT EXISTS response_size_bytes INTEGER;

-- Index for efficient queries
CREATE INDEX idx_cache_accesses_site_timestamp 
ON cache_accesses(site_id, accessed_at DESC)
WHERE site_id IS NOT NULL;

CREATE INDEX idx_cache_accesses_crawler 
ON cache_accesses(crawler_type, accessed_at DESC);
```

### 6.2 Crawler Detection Logic

```typescript
const CRAWLER_PATTERNS: Record<string, { type: string; patterns: RegExp[] }> = {
  'GPTBot': {
    type: 'openai',
    patterns: [/GPTBot/i, /ChatGPT-User/i, /OAI-SearchBot/i],
  },
  'ClaudeBot': {
    type: 'anthropic',
    patterns: [/ClaudeBot/i, /Claude-Web/i, /anthropic-ai/i],
  },
  'PerplexityBot': {
    type: 'perplexity',
    patterns: [/PerplexityBot/i],
  },
  'Google-Extended': {
    type: 'google',
    patterns: [/Google-Extended/i, /Googlebot/i],
  },
  'Applebot-Extended': {
    type: 'apple',
    patterns: [/Applebot-Extended/i, /Applebot/i],
  },
  'Meta-ExternalAgent': {
    type: 'meta',
    patterns: [/Meta-ExternalAgent/i, /FacebookBot/i],
  },
};

function identifyCrawler(userAgent: string): { name: string; type: string } {
  for (const [name, { type, patterns }] of Object.entries(CRAWLER_PATTERNS)) {
    if (patterns.some(p => p.test(userAgent))) {
      return { name, type };
    }
  }
  return { name: 'Unknown Crawler', type: 'other' };
}
```

---

## 7. Real-Time Updates

### 7.1 Polling (MVP)

```typescript
// React Query polling
const { data: activity } = useQuery({
  queryKey: ['activity', siteId, filters],
  queryFn: () => fetchActivity(siteId, filters),
  refetchInterval: 30_000, // 30 seconds
});
```

### 7.2 Server-Sent Events (Future)

```typescript
// Client-side SSE
useEffect(() => {
  const eventSource = new EventSource(`/api/user/activity/realtime?siteId=${siteId}`);
  
  eventSource.addEventListener('activity', (event) => {
    const newActivity = JSON.parse(event.data);
    // Prepend to activity list
    setActivity(prev => [newActivity, ...prev.slice(0, 99)]);
  });
  
  return () => eventSource.close();
}, [siteId]);
```

### 7.3 Optimistic Updates

When user triggers test render, immediately show pending entry:

```typescript
// Add optimistic entry
const optimisticEntry = {
  id: `temp-${Date.now()}`,
  crawlerName: 'Test Request',
  url: testUrl,
  timestamp: new Date().toISOString(),
  status: 'queued',
};
setActivity(prev => [optimisticEntry, ...prev]);

// Replace with real entry when complete
onTestComplete((result) => {
  setActivity(prev => prev.map(a => 
    a.id === optimisticEntry.id ? result : a
  ));
});
```

---

## 8. Performance Considerations

### 8.1 Pagination

- Default page size: 50 items
- Max page size: 100 items
- Use cursor-based pagination for real-time feeds
- Cache page results for 30 seconds

### 8.2 Data Retention

| Plan | Activity Retention | Export Limit |
|------|-------------------|--------------|
| Free | 7 days | 100 rows |
| Pro | 90 days | 10,000 rows |
| Enterprise | 1 year | Unlimited |

### 8.3 Query Optimization

```sql
-- Efficient query with indexes
SELECT 
  id, crawler_name, crawler_type, normalized_url, 
  accessed_at, cache_location, response_time_ms
FROM cache_accesses
WHERE site_id = $1
  AND accessed_at >= $2
  AND accessed_at <= $3
  AND ($4 = 'all' OR crawler_type = $4)
ORDER BY accessed_at DESC
LIMIT $5 OFFSET $6;
```

---

## 9. Accessibility

- [ ] Table is keyboard navigable
- [ ] Row expansion uses aria-expanded
- [ ] Status icons have text alternatives
- [ ] Time values have title attributes with full timestamp
- [ ] Filter changes are announced
- [ ] Export completion is announced

---

## 10. Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `activity_viewed` | siteId, filter | Page load |
| `activity_filtered` | siteId, crawler, dateRange | Filter change |
| `activity_detail_viewed` | activityId | Row expanded |
| `activity_exported` | siteId, format, count | Export clicked |
| `activity_url_tested` | siteId, url | Test URL clicked |
| `activity_page_viewed` | siteId, pageId | View rendered page |

---

## 11. Mobile Responsiveness

### 11.1 Mobile Layout

- Filters collapse to expandable section
- Stats become horizontal scroll
- Table becomes card view
- Row details open in sheet/drawer
- Export available in overflow menu

### 11.2 Card View (Mobile)

```
┌─────────────────────────────────────┐
│ 🤖 GPTBot                    2m ago │
│                                     │
│ /pricing                            │
│ ✓ Served • 45ms                     │
│                                     │
│ [Details]                           │
└─────────────────────────────────────┘
```

---

## 12. Error Handling

### 12.1 API Error

Show inline error with retry:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Failed to load activity data                                         │
│                                                                          │
│  We're having trouble fetching your crawler activity.                    │
│  [Try Again]                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Export Error

Show toast notification:

```
Export failed: Too many records. Try a shorter date range.
```

---

## 13. Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| WebSocket real-time | P1 | True real-time without polling |
| Activity heatmap | P2 | Visual showing peak activity times |
| Crawler comparison | P2 | Side-by-side crawler analytics |
| Alert rules | P2 | Notify on specific patterns |
| Aggregate views | P2 | Group by URL, crawler, day |
| GraphQL subscription | P3 | Alternative to SSE |

---

*This specification defines the Crawler Activity Feed. The real-time feed is the core proof of value for CrawlReady users.*
