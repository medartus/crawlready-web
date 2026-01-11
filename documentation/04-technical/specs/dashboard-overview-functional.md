# Dashboard: Overview (Home) - Functional Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Dependencies:** Sites Management, Crawler Activity Feed

---

## 1. Overview

### 1.1 Purpose

The Overview page is the primary dashboard view, replacing the current empty state. It provides at-a-glance health of the user's AI crawler visibility with actionable insights. This is the first thing users see after login and should immediately communicate value.

### 1.2 Design Principles

1. **Value-First:** Show proof the service is working before anything else
2. **Actionable:** Every metric should lead to an action
3. **Contextual:** Numbers include context (good/bad, trend)
4. **Responsive:** Works on mobile for quick checks

### 1.3 User Mental Model

Users think: "Is CrawlReady working? Are AI crawlers seeing my site?"

The Overview answers these questions in < 3 seconds.

---

## 2. User Stories

### US-1: View Site Health At-a-Glance

**As a** logged-in user
**I want to** see my site's AI visibility status immediately
**So that** I know if everything is working

**Acceptance Criteria:**
- [ ] Health score displayed prominently (0-100)
- [ ] Color coding: Green (80-100), Yellow (50-79), Red (0-49)
- [ ] Last checked timestamp
- [ ] "Refresh" button for manual check
- [ ] Trend indicator: "↑ +5 from last week" or "↓ -3 from last week"
- [ ] Score updates automatically every 24 hours
- [ ] Click score → Navigate to detailed health breakdown

### US-2: See Crawler Activity Feed

**As a** logged-in user
**I want to** see which AI crawlers visited my site
**So that** I know my integration is working

**Acceptance Criteria:**
- [ ] Real-time feed of crawler visits (last 10)
- [ ] Each entry shows:
  - Crawler name + icon (GPTBot, ClaudeBot, etc.)
  - URL visited (truncated with tooltip)
  - Timestamp (relative: "2 min ago")
  - Response status (✓ Served, ⚠ Error)
- [ ] Empty state: "No crawler visits yet. They typically visit within 7 days."
- [ ] "View All" link → Navigate to full activity page
- [ ] Auto-refresh every 30 seconds (configurable)

### US-3: View Integration Status

**As a** logged-in user
**I want to** know if my integration is properly configured
**So that** I can fix issues before they impact visibility

**Acceptance Criteria:**
- [ ] Status indicator: Connected (green) / Issues (yellow) / Not Connected (red)
- [ ] Last successful response timestamp
- [ ] Quick diagnostic display:
  - API key valid: ✓ or ✗
  - Recent activity: ✓ or "No activity in 7 days"
  - Response time: "Avg 45ms"
- [ ] "Test Connection" button → Triggers test render
- [ ] Click status → Navigate to integration troubleshooting

### US-4: View Quick Stats

**As a** logged-in user
**I want to** see key metrics without navigating
**So that** I can quickly assess performance

**Acceptance Criteria:**
- [ ] Card layout with 4 key metrics:
  - Total Renders (this month) + trend
  - Cache Hit Rate (percentage) + indicator (good/bad)
  - Avg Response Time (ms) + indicator
  - Active Pages (cached count)
- [ ] Click any card → Navigate to detailed Analytics
- [ ] Tooltips explain each metric
- [ ] Loading skeletons while data fetches

### US-5: See Alerts and Recommendations

**As a** logged-in user
**I want to** be notified of issues and opportunities
**So that** I can take action

**Acceptance Criteria:**
- [ ] Alert banner for critical issues:
  - "Integration not detected in 7 days" (red)
  - "High error rate (>5%)" (red)
  - "Approaching rate limit (>80%)" (yellow)
  - "New feature available" (blue)
- [ ] Recommendation cards for improvements
- [ ] Dismissible alerts (don't show same alert twice)
- [ ] Alerts stored in user preferences
- [ ] Critical alerts cannot be dismissed permanently

### US-6: Switch Between Sites

**As a** logged-in user with multiple sites
**I want to** switch between my sites easily
**So that** I can monitor all my properties

**Acceptance Criteria:**
- [ ] Site selector dropdown in header
- [ ] Shows current site domain
- [ ] Dropdown lists all sites with status indicators
- [ ] "Add Site" option in dropdown
- [ ] Switching site updates all dashboard data
- [ ] Last selected site remembered in localStorage

---

## 3. UI Specifications

### 3.1 Page Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER                                                                  │
│  ┌─────────────────────────────┐                    ┌─────────────────┐ │
│  │ 🌐 mysite.com           ▼   │                    │ [+ Add Site]    │ │
│  └─────────────────────────────┘                    └─────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ALERT BANNER (if any)                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ ⚠️ Your cache hit rate dropped to 45%. This may indicate...   [Fix] ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌──────────────────────────────────┐  ┌────────────────────────────┐   │
│  │  AI VISIBILITY SCORE             │  │  INTEGRATION STATUS        │   │
│  │                                  │  │                            │   │
│  │         🟢 87                    │  │  ● Connected               │   │
│  │        ████████████░░░░          │  │                            │   │
│  │                                  │  │  Last response: 2m ago     │   │
│  │   ↑ +5 from last week           │  │  Avg latency: 45ms         │   │
│  │   Last checked: 2 hours ago     │  │                            │   │
│  │                                  │  │  [Test Connection]         │   │
│  │         [Refresh]               │  │                            │   │
│  └──────────────────────────────────┘  └────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  RECENT CRAWLER ACTIVITY                                 [View All] ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │  🤖 GPTBot       │ /pricing         │ 2 min ago   │ ✓ Served       ││
│  │  🤖 ClaudeBot    │ /features        │ 15 min ago  │ ✓ Served       ││
│  │  🤖 PerplexityBot│ /blog/post-1     │ 1 hour ago  │ ✓ Served       ││
│  │  🤖 GPTBot       │ /about           │ 3 hours ago │ ✓ Served       ││
│  │  🤖 ClaudeBot    │ /                │ 5 hours ago │ ⚠ Cache Miss   ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  QUICK STATS                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐│
│  │    12,456     │ │     72%       │ │     45ms      │ │     234       ││
│  │   Renders     │ │  Cache Hit    │ │  Avg Time     │ │    Pages      ││
│  │  this month   │ │    Rate       │ │               │ │   Cached      ││
│  │  ↑ +15%       │ │   🟢 Good     │ │  🟢 Fast      │ │   ↑ +12       ││
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Specifications

#### Site Selector

| Property | Specification |
|----------|---------------|
| Type | Dropdown with search |
| Width | 200px min, auto-expand |
| Items | Site domain + status indicator |
| Actions | Select site, Add new site |
| Persistence | localStorage for last selected |

#### Visibility Score Card

| Property | Specification |
|----------|---------------|
| Score Display | Large number (48px font) |
| Progress Bar | Gradient from red (0) to green (100) |
| Color Coding | Red < 50, Yellow 50-79, Green 80+ |
| Trend | Arrow + percentage change vs last week |
| Actions | Refresh button, click for details |

#### Integration Status Card

| Property | Specification |
|----------|---------------|
| Status Colors | Green = Connected, Yellow = Issues, Red = Not Connected |
| Metrics | Last response time, avg latency |
| Actions | Test Connection button |
| Loading | Spinner on test, timeout after 10s |

#### Crawler Activity Feed

| Property | Specification |
|----------|---------------|
| Items Shown | Last 10 entries |
| Crawler Icons | GPTBot (🤖), ClaudeBot (🔵), PerplexityBot (🟣) |
| URL Truncation | Max 30 chars, full URL in tooltip |
| Timestamps | Relative (2m ago), absolute on hover |
| Status Icons | ✓ green (served), ⚠ yellow (cache miss), ✗ red (error) |
| Auto-refresh | Every 30 seconds |

#### Quick Stats Cards

| Metric | Format | Good Indicator | Bad Indicator |
|--------|--------|----------------|---------------|
| Renders | Number + trend | ↑ Any increase | ↓ >20% decrease |
| Cache Hit Rate | Percentage | > 70% | < 50% |
| Avg Time | Milliseconds | < 100ms | > 500ms |
| Pages Cached | Number + change | Increasing | Decreasing |

---

## 4. Empty States

### 4.1 New User (No Sites)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              🚀                                          │
│                                                                          │
│                    Welcome to CrawlReady!                                │
│                                                                          │
│         Let's make your website visible to AI crawlers.                  │
│              Setup takes less than 5 minutes.                            │
│                                                                          │
│                      [Add Your First Site]                               │
│                                                                          │
│   ─────────────────────────────────────────────────────────────────     │
│                                                                          │
│   ✓ Works with React, Vue, Next.js, Angular, and more                    │
│   ✓ See results in real-time                                             │
│   ✓ No code changes required (middleware approach)                       │
│                                                                          │
│   Already have questions? [View Documentation] [Watch Demo]              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Site Added, Setup Incomplete

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Complete Your Setup                                          [✕]    │
│                                                                          │
│  Your site "mysite.com" was added but integration isn't complete.        │
│  AI crawlers can't see your optimized content yet.                       │
│                                                                          │
│  [Complete Setup →]                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  INTEGRATION STATUS                                                      │
│                                                                          │
│  ● Not Connected                                                         │
│                                                                          │
│  Your integration hasn't been verified yet.                              │
│  Complete the setup wizard to start serving AI crawlers.                 │
│                                                                          │
│  What's missing:                                                         │
│  ☐ Add middleware to your project                                        │
│  ☐ Set environment variable                                              │
│  ☐ Deploy changes                                                        │
│                                                                          │
│  [Continue Setup]                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Integrated, No Activity Yet

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RECENT CRAWLER ACTIVITY                                     [View All]  │
│                                                                          │
│                              🕐                                          │
│                                                                          │
│              Waiting for your first crawler visit                        │
│                                                                          │
│  Your integration is working! AI crawlers typically visit within         │
│  7 days of a site being indexed. Here's what you can do:                 │
│                                                                          │
│  • Submit your sitemap to search engines                                 │
│  • Share content on social media to attract crawlers                     │
│  • Use our Test Render tool to verify your setup works                   │
│                                                                          │
│              [Test Render Now]    [Learn More]                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API Endpoint Contracts

### 5.1 GET /api/user/dashboard/overview

**Description:** Fetch all data needed for the Overview page.

**Authentication:** Clerk session required

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| siteId | UUID | No | User's default site | Which site to load data for |

**Response (200 - Success):**

```typescript
interface OverviewResponse {
  site: {
    id: string;
    domain: string;
    displayName: string | null;
    status: 'connected' | 'issues' | 'not_connected' | 'pending';
    healthScore: number;           // 0-100
    healthTrend: number;           // Change from last week (+5, -3)
    lastChecked: string;           // ISO timestamp
  };
  integration: {
    status: 'active' | 'inactive' | 'error';
    lastSuccessfulResponse: string | null;  // ISO timestamp
    avgResponseTime: number;       // milliseconds
    apiKeyValid: boolean;
    recentActivity: boolean;       // Activity in last 7 days
    errorRate: number;             // 0-100 percentage
  };
  quickStats: {
    rendersThisMonth: number;
    rendersTrend: number;          // Percentage change
    cacheHitRate: number;          // 0-100
    cacheHitRateStatus: 'good' | 'warning' | 'bad';
    avgResponseTime: number;       // milliseconds
    responseTimeStatus: 'good' | 'warning' | 'bad';
    cachedPagesCount: number;
    cachedPagesChange: number;     // Change from last week
  };
  recentActivity: Array<{
    id: string;
    crawlerName: string;           // 'GPTBot', 'ClaudeBot', etc.
    crawlerType: 'openai' | 'anthropic' | 'perplexity' | 'google' | 'other';
    url: string;
    timestamp: string;             // ISO timestamp
    status: 'served' | 'cache_miss' | 'error';
    responseTime: number;          // milliseconds
    cacheLocation: 'hot' | 'cold' | 'none';
  }>;
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    action?: {
      label: string;
      href: string;
    };
    dismissible: boolean;
    createdAt: string;
  }>;
  setupComplete: boolean;
  setupStep?: number;              // 1-4 if setup incomplete
}
```

**Response (404 - No Sites):**

```typescript
{
  error: "NO_SITES";
  message: "User has no sites configured";
  action: {
    label: "Add Your First Site";
    href: "/onboarding/add-site";
  };
}
```

### 5.2 POST /api/user/dashboard/test-connection

**Description:** Test the integration by making a render request.

**Authentication:** Clerk session required

**Request Body:**

```typescript
{
  siteId: string;                  // UUID of site to test
  testUrl?: string;                // Optional specific URL to test
}
```

**Response (200 - Success):**

```typescript
{
  success: true;
  testUrl: string;
  responseTime: number;            // milliseconds
  cacheStatus: 'hit' | 'miss';
  headers: {
    'x-served-by': string;
    'x-cache': string;
    'x-cache-location': string;
  };
  htmlSize: number;                // bytes
  hasContent: boolean;
}
```

**Response (200 - Failure):**

```typescript
{
  success: false;
  testUrl: string;
  error: {
    code: 'INTEGRATION_NOT_DETECTED' | 'SITE_UNREACHABLE' | 'API_KEY_INVALID' | 'TIMEOUT';
    message: string;
    suggestion: string;
  };
}
```

### 5.3 POST /api/user/dashboard/refresh-health

**Description:** Trigger a fresh health score calculation.

**Authentication:** Clerk session required

**Request Body:**

```typescript
{
  siteId: string;
}
```

**Response (200):**

```typescript
{
  healthScore: number;
  previousScore: number;
  change: number;
  checkedAt: string;
  issues: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}
```

### 5.4 POST /api/user/dashboard/dismiss-alert

**Description:** Dismiss an alert.

**Authentication:** Clerk session required

**Request Body:**

```typescript
{
  alertId: string;
}
```

**Response (200):**

```typescript
{
  success: true;
  alertId: string;
}
```

---

## 6. Alert System

### 6.1 Alert Types

| Alert ID | Type | Trigger | Message | Action |
|----------|------|---------|---------|--------|
| `no_activity_7d` | warning | No crawler activity for 7 days | "No AI crawler visits in the last 7 days" | Test Connection |
| `high_error_rate` | error | Error rate > 5% | "High error rate detected ({rate}%)" | View Errors |
| `rate_limit_warning` | warning | Usage > 80% of limit | "Approaching rate limit ({used}/{limit})" | Upgrade Plan |
| `rate_limit_exceeded` | error | Usage = 100% | "Rate limit reached" | Upgrade Plan |
| `integration_broken` | error | Test fails 3x | "Integration appears broken" | Troubleshoot |
| `low_cache_hit` | warning | Cache hit < 50% | "Cache hit rate is low ({rate}%)" | Optimize |
| `setup_incomplete` | warning | Setup not finished | "Complete your setup" | Continue Setup |

### 6.2 Alert Priority

1. **Error alerts** always show first
2. **Warning alerts** show below errors
3. **Info alerts** show below warnings
4. Maximum 3 alerts visible at once
5. "Show all alerts" link if more exist

### 6.3 Alert Persistence

- Non-dismissible: `integration_broken`, `rate_limit_exceeded`, `setup_incomplete`
- Dismissible: All others
- Dismissed alerts stored in user preferences
- Dismissed alerts reappear after 7 days if condition persists

---

## 7. Real-Time Updates

### 7.1 Polling Strategy

| Data | Refresh Interval | Trigger |
|------|------------------|---------|
| Crawler Activity | 30 seconds | Automatic |
| Quick Stats | 5 minutes | Automatic |
| Integration Status | On page load | Manual (Test button) |
| Health Score | 24 hours | Manual (Refresh button) |
| Alerts | 5 minutes | Automatic |

### 7.2 Implementation

```typescript
// React Query configuration
const { data: overview } = useQuery({
  queryKey: ['dashboard', 'overview', siteId],
  queryFn: () => fetchOverview(siteId),
  refetchInterval: 30 * 1000,      // 30 seconds for activity
  staleTime: 10 * 1000,            // Consider fresh for 10s
});
```

---

## 8. Mobile Responsiveness

### 8.1 Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (> 1024px) | Two columns for cards |
| Tablet (768-1024px) | Single column, cards full width |
| Mobile (< 768px) | Stacked, simplified stats |

### 8.2 Mobile-Specific Changes

- Site selector becomes full-width
- Visibility score and integration status stack vertically
- Quick stats become 2x2 grid
- Activity feed shows last 5 items (not 10)
- Horizontal scroll for activity table if needed

---

## 9. Accessibility

### 9.1 Requirements

- [ ] All interactive elements keyboard accessible
- [ ] Color is not sole indicator of status (icons + text)
- [ ] Screen reader announces alerts
- [ ] Focus management for modals and dropdowns
- [ ] ARIA labels for all icons
- [ ] Contrast ratio meets WCAG AA (4.5:1)

### 9.2 Screen Reader Announcements

```html
<div role="status" aria-live="polite">
  New crawler activity: GPTBot visited /pricing
</div>

<div role="alert" aria-live="assertive">
  Warning: High error rate detected
</div>
```

---

## 10. Error States

### 10.1 API Error

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ⚠️                                          │
│                                                                          │
│                   Failed to load dashboard data                          │
│                                                                          │
│         We're having trouble connecting to our servers.                  │
│                     Please try again.                                    │
│                                                                          │
│                        [Try Again]                                       │
│                                                                          │
│              If the problem persists, check our status page.             │
│                       status.crawlready.com                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Partial Load Failure

- Show what data loaded successfully
- Show error inline for failed sections
- Retry button for failed sections only

---

## 11. Analytics Events

### 11.1 Page Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `dashboard_viewed` | siteId, setupComplete | Page load |
| `site_switched` | fromSiteId, toSiteId | Site selector change |
| `test_connection_clicked` | siteId | Test button clicked |
| `test_connection_result` | siteId, success, error | Test completed |
| `alert_dismissed` | alertId, alertType | Alert dismissed |
| `health_refresh_clicked` | siteId | Refresh button clicked |
| `activity_view_all_clicked` | siteId | View All clicked |
| `stat_card_clicked` | siteId, stat | Quick stat clicked |

---

## 12. Dependencies

- Clerk authentication
- React Query for data fetching
- date-fns for timestamp formatting
- Chart.js or Recharts for progress bars
- `/api/user/dashboard/*` endpoints
- Sites database table

---

## 13. Future Enhancements

| Enhancement | Priority | Effort |
|-------------|----------|--------|
| Real-time WebSocket updates | P2 | High |
| Custom dashboard layouts | P3 | Medium |
| Health score history chart | P2 | Medium |
| Crawler heatmap (by time) | P3 | High |
| Comparison mode (2 sites) | P3 | High |
| Export dashboard as PDF | P3 | Medium |

---

*This specification defines the Overview page MVP. Iterate based on user feedback and analytics.*
