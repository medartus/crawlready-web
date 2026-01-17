# Dashboard: Analytics - Functional Specification

## Overview

The Analytics page provides users with comprehensive insights into their CrawlReady API usage, including request counts, cache performance, rate limit consumption, top rendered URLs, and **contextual recommendations** to optimize their integration. This enables users to monitor their integration performance, identify issues, and take action based on data-driven insights.

> **Note:** This page was previously named "Usage Statistics" and has been enhanced with contextual insights.

## User Stories

### US-1: View Total Request Counts
**As a** logged-in user  
**I want to** see my total API requests  
**So that** I can monitor my usage against rate limits

**Acceptance Criteria:**
- Display total requests for time ranges: 24 hours, 7 days, 30 days
- Time range selector (tabs or dropdown)
- Request count prominently displayed as large number
- Comparison to previous period: "+12% vs last week"
- Color-coded indicator: green (under limit), yellow (approaching), red (exceeded)
- Updates automatically when time range changes

### US-2: View Cache Hit Rate
**As a** logged-in user  
**I want to** see my cache hit percentage  
**So that** I can understand how efficiently I'm using the service

**Acceptance Criteria:**
- Display cache hit rate as percentage (0-100%)
- Visual representation: donut/pie chart showing hits vs misses
- Breakdown:
  - Hot Cache Hits (Redis): XX%
  - Cold Cache Hits (Supabase): XX%
  - Cache Misses (New renders): XX%
- Historical trend: line chart showing hit rate over time
- Tooltip explains what each category means

### US-3: View Request Status Breakdown
**As a** logged-in user  
**I want to** see the distribution of request statuses  
**So that** I can identify if many requests are failing

**Acceptance Criteria:**
- Bar chart or stacked bar showing:
  - Completed: Green bars
  - Failed: Red bars
  - Queued: Yellow bars
- Counts displayed on bars
- Clickable bars filter to show details
- Failed requests show common error types:
  - SSRF blocked: X requests
  - Invalid URL: X requests
  - Timeout: X requests
  - Rate limit: X requests

### US-4: View Top Rendered URLs
**As a** logged-in user  
**I want to** see which URLs I render most frequently  
**So that** I can optimize my caching strategy

**Acceptance Criteria:**
- Table showing top 10 URLs by request count
- Columns:
  - URL (truncated with tooltip for full URL)
  - Request Count
  - Cache Hit Rate for this URL
  - Avg Response Time
- Sortable by any column
- Click URL to navigate to Rendered Pages Browser (filtered)
- Export button to download full list as CSV

### US-5: Monitor Rate Limit Consumption
**As a** logged-in user  
**I want to** see my rate limit usage  
**So that** I can avoid hitting my limits

**Acceptance Criteria:**
- Progress bar showing: "1,234 / 10,000 requests today"
- Percentage indicator
- Estimated time until reset (based on account tier)
- Historical chart showing daily usage over last 30 days
- Alert banner if > 90% of daily limit consumed:
  - "You've used 95% of your daily limit. Consider upgrading to Pro."
  - [Upgrade] button links to pricing page

### US-6: View Usage by API Key
**As a** logged-in user with multiple API keys  
**I want to** see usage broken down by key  
**So that** I can identify which integrations consume most resources

**Acceptance Criteria:**
- Table showing usage per API key:
  - Key Prefix
  - Requests (24h / 7d / 30d)
  - Cache Hit Rate
  - Error Rate
- Sortable columns
- Expandable rows show detailed stats for that key
- Filter by time range applies to all keys

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics                             [24h] [7d] [30d]          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   1,234     │  │    87%      │  │   456       │             │
│  │  Requests   │  │ Cache Hits  │  │  Failures   │             │
│  │ +12% ↑      │  │    🟢       │  │    🔴       │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Cache Performance                                       │   │
│  │ [Line Chart: Hit Rate over Time]                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌───────────────────────────────────┐ ┌─────────────────────┐ │
│  │ Top Rendered URLs               │ │ 💡 Insights         │ │
│  │ URL           │ Count│ Hit Rate │ │                     │ │
│  │ example/page1 │  234 │   92%    │ │ ⚠️ Cache hit rate   │ │
│  │ example/page2 │  189 │   85%    │ │    below 50%        │ │
│  └───────────────────────────────────┘ │ [Learn More]        │ │
│                                         └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoint Contracts

### GET /api/user/usage

**Request:**
Query params:
- `range`: '24h' | '7d' | '30d' (default: '24h')
- `keyId`: Optional UUID to filter by specific API key

**Response (Success - 200):**
```typescript
{
  range: '24h' | '7d' | '30d';
  period: {
    start: string;  // ISO 8601
    end: string;    // ISO 8601
  };
  summary: {
    totalRequests: number;
    requestsLimit: number;        // Daily limit based on tier
    requestsRemaining: number;
    cacheHitRate: number;         // 0-100
    avgResponseTime: number;      // milliseconds
    errorRate: number;            // 0-100
    comparisonPreviousPeriod: {
      requests: number;           // +12 or -5
      percentChange: number;      // +12.5 or -8.3
    };
  };
  cacheBreakdown: {
    hotCacheHits: number;         // Redis hits
    coldCacheHits: number;        // Supabase hits
    cacheMisses: number;          // New renders
  };
  statusBreakdown: {
    completed: number;
    failed: number;
    queued: number;
  };
  errorBreakdown: Array<{
    errorType: string;            // 'SSRF_BLOCKED', 'INVALID_URL', etc.
    count: number;
    percentage: number;
  }>;
  topUrls: Array<{
    url: string;
    requestCount: number;
    cacheHitRate: number;
    avgResponseTime: number;
  }>;
  dailyUsage: Array<{            // For chart
    date: string;                 // YYYY-MM-DD
    requests: number;
    cacheHitRate: number;
  }>;
  usageByKey?: Array<{           // If user has multiple keys
    keyId: string;
    keyPrefix: string;
    requests: number;
    cacheHitRate: number;
    errorRate: number;
  }>;
}
```

**Response (Error - 400):**
```typescript
{
  error: "Invalid range parameter";
  message: "Range must be one of: 24h, 7d, 30d";
}
```

### GET /api/user/usage/export

**Request:**
Query params:
- `range`: '24h' | '7d' | '30d'
- `format`: 'csv' | 'json' (default: 'csv')

**Response (Success - 200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="crawlready-usage-2025-01-15.csv"

Date,Requests,Cache Hit Rate,Failures,Avg Response Time
2025-01-15,234,87.5,12,1250
2025-01-14,189,92.1,8,1180
...
```

## Data Calculation Logic

### Cache Hit Rate Calculation
```typescript
cacheHitRate = ((hotCacheHits + coldCacheHits) / totalRequests) * 100
```

### Response Time Calculation
```typescript
avgResponseTime = sum(all response times) / totalRequests
// Excludes queued requests (not yet completed)
```

### Error Rate Calculation
```typescript
errorRate = (failedRequests / totalRequests) * 100
```

### Comparison to Previous Period
```typescript
// For 24h range, compare to previous 24h
// For 7d range, compare to previous 7 days
// For 30d range, compare to previous 30 days

percentChange = ((currentPeriod - previousPeriod) / previousPeriod) * 100
```

## Chart Specifications

### Cache Performance Line Chart
- **X-axis:** Time (hourly for 24h, daily for 7d/30d)
- **Y-axis:** Cache hit rate (0-100%)
- **Line:** Blue, 2px width, smooth curve
- **Tooltip:** Shows exact timestamp and hit rate
- **Grid:** Light grey horizontal lines every 20%

### Request Status Bar Chart
- **X-axis:** Status (Completed, Failed, Queued)
- **Y-axis:** Count
- **Colors:** 
  - Completed: #10B981 (green)
  - Failed: #EF4444 (red)
  - Queued: #F59E0B (yellow)
- **Labels:** Count displayed on top of each bar

### Daily Usage Area Chart
- **X-axis:** Date
- **Y-axis:** Request count
- **Fill:** Gradient from blue to transparent
- **Limit Line:** Dashed red line showing daily limit
- **Tooltip:** Date, requests, percentage of limit

## Validation Rules

### Time Range
- Must be one of: '24h', '7d', '30d'
- Defaults to '24h' if invalid

### Key ID Filter
- Must be valid UUID
- Must belong to authenticated user
- If invalid, return 404

### Export Format
- Must be 'csv' or 'json'
- Defaults to 'csv' if invalid

## Error States

### No Usage Data
**Display:**
```
┌─────────────────────────────────────────┐
│             📊                          │
│                                         │
│      No usage data yet                  │
│                                         │
│  Make your first API request to see     │
│         statistics here                 │
│                                         │
│    [View API Documentation]             │
└─────────────────────────────────────────┘
```

### Failed to Load Stats
**Display:**
```
┌─────────────────────────────────────────┐
│             ⚠️                          │
│                                         │
│  Failed to load usage statistics        │
│                                         │
│  Unable to fetch data from server.      │
│                                         │
│      [Try Again]  [Report Issue]        │
└─────────────────────────────────────────┘
```

### Rate Limit Warning
**Alert Banner (top of page):**
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️  You've used 95% of your daily limit (9,500 / 10,000) │
│     Consider upgrading to avoid service interruption.    │
│     [View Plans] [Dismiss]                               │
└─────────────────────────────────────────────────────────┘
```

## Success Flows

### Flow 1: View Daily Usage
1. User navigates to Usage Statistics page
2. Page loads with 24h data (default)
3. Shows loading skeletons for ~500ms
4. Data loads and displays:
   - 1,234 total requests
   - 87% cache hit rate
   - 12 failures
5. Charts render with smooth animations
6. User sees "+12% vs yesterday" comparison

### Flow 2: Export Usage Data
1. User clicks "Export" button
2. Modal opens with format selector (CSV/JSON)
3. User selects CSV
4. Click "Download"
5. File downloads: `crawlready-usage-2025-01-15.csv`
6. Success toast: "Usage data exported successfully"

### Flow 3: Investigate Failures
1. User sees 45 failed requests in summary
2. Clicks on "Failed" bar in status breakdown chart
3. Expandable section shows error types:
   - SSRF Blocked: 30 requests
   - Invalid URL: 10 requests
   - Timeout: 5 requests
4. User clicks "View Details" on SSRF Blocked
5. Navigates to Rendered Pages Browser filtered by error type

### Flow 4: Monitor Specific API Key
1. User has 3 API keys
2. Selects "Production Key (sk_live_abc...)" from dropdown
3. Stats refresh to show only that key's usage
4. User sees this key has 89% cache hit rate (better than average)
5. Identifies this integration is well-optimized

### Flow 5: Act on Contextual Insight
1. User views Analytics page
2. Insight panel shows: "Your cache hit rate dropped 15% this week"
3. Recommendation appears: "Consider increasing cache TTL for frequently accessed pages"
4. User clicks "Learn More" to see detailed documentation
5. User adjusts cache strategy based on recommendation

## Contextual Insights

### Overview

The Analytics page includes **contextual insights** - data-driven recommendations that help users optimize their integration based on their actual usage patterns.

### US-7: View Contextual Recommendations
**As a** logged-in user  
**I want to** see personalized recommendations based on my usage data  
**So that** I can optimize my CrawlReady integration without manual analysis

**Acceptance Criteria:**
- Insights panel displayed prominently on Analytics page
- Maximum 3 insights shown at a time (prioritized by impact)
- Each insight includes:
  - Clear problem statement
  - Recommendation for action
  - "Learn More" link to relevant documentation
  - Optional "Dismiss" to hide (remember preference)
- Insights refresh when data changes significantly

### Insight Types

| Insight ID | Trigger Condition | Message | Recommendation |
|------------|-------------------|---------|----------------|
| LOW_CACHE_HIT | Cache hit rate < 50% | "Your cache hit rate is below 50%" | "Enable longer cache TTL or pre-warm frequently accessed pages" |
| HIGH_ERROR_RATE | Error rate > 10% | "More than 10% of your requests are failing" | "Review error breakdown to identify root causes" |
| RATE_LIMIT_APPROACHING | Usage > 80% of limit | "You're approaching your daily rate limit" | "Consider upgrading your plan or optimizing request patterns" |
| CACHE_MISS_SPIKE | Cache misses increased >25% week-over-week | "Cache misses increased significantly" | "Check if new URLs are being rendered or if cache invalidation is too aggressive" |
| RESPONSE_TIME_DEGRADATION | Avg response time increased >30% | "Response times are slower than usual" | "Heavy pages may need optimization. Review slowest URLs below." |
| UNUSED_API_KEY | API key with 0 requests in 7+ days | "One of your API keys hasn't been used recently" | "Revoke unused keys to improve security" |
| PEAK_USAGE_PATTERN | Consistent peak hours detected | "Your traffic peaks between 2-4 PM" | "Consider pre-warming cache during off-peak hours" |

### API Response Extension

Add to `/api/user/usage` response:

```typescript
{
  // ... existing fields ...
  insights: Array<{
    id: string;                    // 'LOW_CACHE_HIT', 'HIGH_ERROR_RATE', etc.
    severity: 'info' | 'warning' | 'critical';
    title: string;                 // Human-readable title
    message: string;               // Detailed message
    recommendation: string;        // Action to take
    learnMoreUrl?: string;         // Link to documentation
    dismissible: boolean;          // Can user dismiss this?
    data?: {                       // Relevant data for the insight
      currentValue: number;
      threshold: number;
      trend?: 'up' | 'down' | 'stable';
    };
  }>;
  dismissedInsights: string[];     // IDs of insights user has dismissed
}
```

### Insights UI Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│  💡 Insights                                          [See All] │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ⚠️  Cache hit rate below 50%                        [×]  │  │
│  │     Your cache hit rate is 42%, below the optimal 80%.   │  │
│  │     → Enable longer cache TTL for frequently accessed    │  │
│  │       pages to improve performance.                      │  │
│  │     [Learn More]                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📈  Traffic peaks detected                          [×]  │  │
│  │     Your usage consistently peaks between 2-4 PM.        │  │
│  │     → Pre-warm cache during off-peak hours to ensure     │  │
│  │       fast responses during high-traffic periods.        │  │
│  │     [Configure Pre-warming]                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Dismiss Insight API

#### POST /api/user/insights/dismiss

**Request:**
```typescript
{
  insightId: string;   // ID of the insight to dismiss
}
```

**Response (Success - 200):**
```typescript
{
  success: true;
  dismissedAt: string;  // ISO 8601 timestamp
}
```

### Insight Priority Logic

Insights are prioritized for display:
1. **Critical** - Blocking issues (e.g., rate limit exceeded, >50% error rate)
2. **Warning** - Performance issues (e.g., cache degradation, slow responses)
3. **Info** - Optimization opportunities (e.g., unused keys, traffic patterns)

Within each priority level, sort by potential impact (calculated from user's data).

## Accessibility Requirements

- Chart data available as data table (toggle view)
- All charts have descriptive `<title>` elements
- Color-blind friendly palette (not relying solely on color)
- Screen reader announces stat changes when time range changes
- Keyboard navigation through chart data points
- Tooltips accessible via keyboard (focus)

## Localization

- Numbers formatted per locale (1,234 vs 1.234)
- Dates formatted per locale (MM/DD vs DD/MM)
- Time range labels: "24h" / "24 h", "7d" / "7 j", "30d" / "30 j"
- Chart axis labels translated
- Error messages translated

## Dependencies

- Chart library: Recharts or Chart.js
- Date library: date-fns
- Export library: papaparse (for CSV)
- `/api/user/usage` endpoint
- Loading skeleton components

## Future Enhancements (Out of Scope for MVP)

- Real-time updates (WebSocket)
- Custom date ranges
- Scheduled email reports
- Anomaly detection alerts
- Budget alerts (email when 80% consumed)
- Comparison between multiple API keys (side-by-side)
- Cost estimation based on usage
- Predictive usage forecasting
- Integration with analytics platforms

