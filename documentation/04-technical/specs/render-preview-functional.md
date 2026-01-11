# Test Render / Preview Tool - Functional Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Dependencies:** Sites Management, Render API

---

## 1. Overview

### 1.1 Purpose

The Test Render tool allows users to instantly preview what AI crawlers will see for any URL on their site. This provides immediate value by letting users:

1. Verify their integration works correctly
2. Preview rendered content before crawlers visit
3. Debug issues with specific pages
4. Compare user view vs crawler view

### 1.2 Key Value Proposition

> "See exactly what GPTBot sees when it visits any page on your site."

This is the fastest way for users to verify CrawlReady is working without waiting for actual crawler visits.

### 1.3 Access Points

| Location | Trigger | Context |
|----------|---------|---------|
| Dashboard Overview | "Test Render" button | Quick access |
| Onboarding Step 4 | "Test Your Integration" | Verification |
| Pages list | "Test" action on row | Debug specific page |
| Standalone page | `/dashboard/test-render` | Dedicated tool |
| Empty crawler activity | "Test Render Now" CTA | No activity yet |

---

## 2. User Stories

### US-1: Test Any URL

**As a** logged-in user
**I want to** test any URL on my site
**So that** I can see what AI crawlers will receive

**Acceptance Criteria:**
- [ ] Input field accepts full URLs or paths
- [ ] Auto-prepends domain if path only
- [ ] Validates URL is on registered domain
- [ ] Shows loading state during render
- [ ] Displays rendered HTML preview

### US-2: Compare User vs Crawler View

**As a** logged-in user
**I want to** see side-by-side comparison
**So that** I can verify content is rendering correctly

**Acceptance Criteria:**
- [ ] Split view: User sees vs Crawler sees
- [ ] Left: Live iframe or screenshot of page
- [ ] Right: CrawlReady rendered version
- [ ] Highlight differences (optional)
- [ ] Toggle between split and full view

### US-3: View Raw HTML

**As a** developer
**I want to** see the raw HTML source
**So that** I can inspect the rendered content

**Acceptance Criteria:**
- [ ] Tab to switch to raw HTML view
- [ ] Syntax highlighting
- [ ] Line numbers
- [ ] Copy button
- [ ] Download as .html file
- [ ] Search within HTML (Ctrl+F)

### US-4: See Performance Metrics

**As a** logged-in user
**I want to** see render performance metrics
**So that** I can verify speed meets expectations

**Acceptance Criteria:**
- [ ] Response time displayed (ms)
- [ ] HTML size (KB)
- [ ] Cache status (hit/miss)
- [ ] Cache location (hot/cold)
- [ ] Timestamp of render

### US-5: Test with Different Crawlers

**As a** logged-in user
**I want to** simulate different AI crawlers
**So that** I can verify compatibility across platforms

**Acceptance Criteria:**
- [ ] Dropdown to select crawler type
- [ ] Options: GPTBot, ClaudeBot, PerplexityBot, etc.
- [ ] User agent string displayed
- [ ] Results may vary by crawler (future)

### US-6: Invalidate and Re-render

**As a** logged-in user
**I want to** force a fresh render
**So that** I can test after making changes

**Acceptance Criteria:**
- [ ] "Clear Cache & Re-render" button
- [ ] Invalidates cached version
- [ ] Triggers new render
- [ ] Shows before/after comparison

---

## 3. UI Specification

### 3.1 Main Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Test Render                                                             │
│  See what AI crawlers see when they visit your pages                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Site: mysite.com ▼                                                  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  URL: │ https://mysite.com/pricing                        │ [Test]  ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  Advanced Options ▼                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Simulate Crawler: │ GPTBot ▼ │                                      ││
│  │  ☐ Force fresh render (bypass cache)                                 ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RESULTS                                                                 │
│                                                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │    45ms     │ │  125.4 KB   │ │  Cache HIT  │ │    Hot      │        │
│  │  Response   │ │    Size     │ │   Status    │ │  Location   │        │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
│                                                                          │
│  [Preview] [Raw HTML] [Headers]                                          │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │   [Rendered HTML preview in sandboxed iframe]                        ││
│  │                                                                      ││
│  │   This is what GPTBot sees when visiting /pricing                    ││
│  │                                                                      ││
│  │                                                                      ││
│  │                                                                      ││
│  │                                                                      ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  [Copy HTML] [Download .html] [Clear Cache & Re-render]                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Side-by-Side Comparison View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Test Render                                        [Split] [Full View]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │  Original Page              │   │  CrawlReady Rendered            │  │
│  │  (What users see)           │   │  (What AI crawlers see)         │  │
│  ├─────────────────────────────┤   ├─────────────────────────────────┤  │
│  │                             │   │                                 │  │
│  │  [Live page in iframe]      │   │  [Rendered HTML in iframe]      │  │
│  │                             │   │                                 │  │
│  │                             │   │                                 │  │
│  │                             │   │                                 │  │
│  │                             │   │                                 │  │
│  │                             │   │                                 │  │
│  └─────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Raw HTML View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Preview] [Raw HTML] [Headers]                           [Copy] [Download]│
├─────────────────────────────────────────────────────────────────────────┤
│  1  │ <!DOCTYPE html>                                                    │
│  2  │ <html lang="en">                                                   │
│  3  │ <head>                                                             │
│  4  │   <meta charset="UTF-8">                                           │
│  5  │   <meta name="viewport" content="width=device-width">              │
│  6  │   <title>Pricing - MyApp</title>                                   │
│  7  │   <meta name="description" content="Simple, transparent pricing">  │
│  8  │   <script type="application/ld+json">                              │
│  9  │   {                                                                │
│ 10  │     "@context": "https://schema.org",                              │
│ 11  │     "@type": "WebPage",                                            │
│ 12  │     ...                                                            │
│ ... │                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Headers View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Preview] [Raw HTML] [Headers]                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Response Headers                                                        │
│  ─────────────────────────────────────────────────────────────────────  │
│  content-type:        text/html; charset=utf-8                           │
│  x-served-by:         CrawlReady                                         │
│  x-cache:             HIT                                                │
│  x-cache-location:    hot                                                │
│  x-response-time:     45ms                                               │
│  content-length:      128456                                             │
│  cache-control:       public, max-age=3600                               │
│                                                                          │
│  Request Details                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│  URL:                 https://mysite.com/pricing                         │
│  Simulated Crawler:   GPTBot                                             │
│  User-Agent:          Mozilla/5.0 (compatible; GPTBot/1.2; ...)          │
│  Timestamp:           2026-01-11T14:34:56Z                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Loading State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RESULTS                                                                 │
│                                                                          │
│                              ⏳                                          │
│                                                                          │
│                    Rendering your page...                                │
│                                                                          │
│                    ████████████░░░░░░░░░░░░                              │
│                                                                          │
│                    This usually takes 2-5 seconds                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Error State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RESULTS                                                                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  ⚠️ Render Failed                                                    ││
│  │                                                                      ││
│  │  Error: TIMEOUT - Page took too long to render                       ││
│  │                                                                      ││
│  │  Possible causes:                                                    ││
│  │  • Page has slow-loading resources                                   ││
│  │  • Infinite loops in JavaScript                                      ││
│  │  • Network issues reaching your site                                 ││
│  │                                                                      ││
│  │  [Try Again] [Report Issue]                                          ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. API Endpoints

### 4.1 POST /api/user/test-render

**Description:** Render a URL and return preview data.

**Authentication:** Clerk session required

**Request:**
```typescript
{
  siteId: string;
  url: string;                     // Full URL or path
  crawler?: string;                // 'GPTBot' | 'ClaudeBot' | etc.
  bypassCache?: boolean;           // Force fresh render
}
```

**Response (200 - Success):**
```typescript
{
  success: true;
  result: {
    url: string;
    html: string;
    metrics: {
      responseTime: number;        // ms
      htmlSize: number;            // bytes
      cacheStatus: 'hit' | 'miss';
      cacheLocation: 'hot' | 'cold' | 'none';
      renderedAt: string;          // ISO timestamp
    };
    headers: Record<string, string>;
    crawler: {
      name: string;
      userAgent: string;
    };
  };
}
```

**Response (200 - Render Failed):**
```typescript
{
  success: false;
  error: {
    code: 'TIMEOUT' | 'NETWORK_ERROR' | 'RENDER_ERROR' | 'INVALID_URL';
    message: string;
    details?: string;
  };
}
```

**Response (400):**
```typescript
{
  error: 'VALIDATION_ERROR';
  message: string;
  details: {
    field: string;
    issue: string;
  };
}
```

### 4.2 POST /api/user/test-render/invalidate

**Description:** Clear cache and re-render a URL.

**Request:**
```typescript
{
  siteId: string;
  url: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  invalidated: true;
  message: 'Cache cleared. Re-render triggered.';
}
```

### 4.3 GET /api/user/test-render/history

**Description:** Get recent test renders for a site.

**Query Parameters:**
- `siteId` (required)
- `limit` (default: 10)

**Response (200):**
```typescript
{
  history: Array<{
    id: string;
    url: string;
    crawler: string;
    responseTime: number;
    cacheStatus: string;
    testedAt: string;
  }>;
}
```

---

## 5. Component Specifications

### 5.1 URL Input

| Property | Specification |
|----------|---------------|
| Type | Text input with site domain prefix |
| Placeholder | "/page-path or full URL" |
| Validation | Must be valid URL on registered domain |
| Auto-complete | Recent URLs from history |
| Submit | Enter key or Test button |

### 5.2 Crawler Selector

| Property | Specification |
|----------|---------------|
| Type | Dropdown select |
| Default | GPTBot |
| Options | GPTBot, ClaudeBot, PerplexityBot, Google-Extended |
| Display | Crawler name + icon |

### 5.3 Preview Iframe

| Property | Specification |
|----------|---------------|
| Type | Sandboxed iframe |
| Sandbox | `allow-same-origin` only |
| Size | Full width, 600px height (resizable) |
| Scrolling | Auto |
| Security | No script execution, no forms |

### 5.4 Code Viewer

| Property | Specification |
|----------|---------------|
| Library | Prism.js or Monaco (read-only) |
| Theme | Match app theme (light/dark) |
| Features | Line numbers, syntax highlighting |
| Max lines | Virtualized for performance |
| Search | Ctrl+F support |

### 5.5 Metrics Cards

| Metric | Format | Good | Bad |
|--------|--------|------|-----|
| Response Time | `{ms}ms` | < 200ms green | > 500ms red |
| Size | `{KB} KB` | < 500KB green | > 1MB red |
| Cache Status | HIT/MISS | HIT green | MISS yellow |
| Location | Hot/Cold | Hot green | Cold yellow |

---

## 6. URL Validation

### 6.1 Validation Rules

```typescript
function validateTestUrl(input: string, site: Site): ValidationResult {
  // Handle path-only input
  if (input.startsWith('/')) {
    input = `https://${site.domain}${input}`;
  }
  
  // Parse URL
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Must match site domain
  if (url.hostname !== site.domain && url.hostname !== `www.${site.domain}`) {
    return { 
      valid: false, 
      error: `URL must be on ${site.domain}` 
    };
  }
  
  // Must be HTTPS in production
  if (url.protocol !== 'https:') {
    return { valid: false, error: 'HTTPS required' };
  }
  
  return { valid: true, url: url.toString() };
}
```

### 6.2 Auto-Complete

Show recent URLs from:
1. Test render history (last 10)
2. Crawler activity (top 10 by visits)
3. Rendered pages (top 10 by access)

---

## 7. Security Considerations

### 7.1 Iframe Sandboxing

```html
<iframe
  sandbox="allow-same-origin"
  src="about:blank"
  title="Rendered HTML Preview"
  referrerpolicy="no-referrer"
></iframe>
```

**Blocked:**
- JavaScript execution
- Form submission
- Popups and new windows
- Top-level navigation
- External requests (images, scripts, etc.)

### 7.2 Content Injection

```typescript
// Write HTML to iframe safely
const iframe = document.querySelector('iframe');
const doc = iframe.contentDocument;
doc.open();
doc.write(sanitizedHtml);
doc.close();

// Prevent click navigation
doc.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
});
```

### 7.3 Rate Limiting

| Limit | Value |
|-------|-------|
| Test renders per minute | 10 |
| Test renders per hour | 100 |
| Bypass cache per hour | 20 |

---

## 8. Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `test_render_started` | siteId, url, crawler | Test button clicked |
| `test_render_completed` | siteId, url, responseTime, cacheStatus | Render successful |
| `test_render_failed` | siteId, url, errorCode | Render failed |
| `test_render_html_copied` | siteId, url | Copy button clicked |
| `test_render_html_downloaded` | siteId, url | Download clicked |
| `test_render_cache_cleared` | siteId, url | Clear cache clicked |
| `test_render_view_changed` | siteId, view | Tab changed |

---

## 9. Accessibility

- [ ] URL input has label and placeholder
- [ ] Tab navigation through all controls
- [ ] Results announced to screen readers
- [ ] Error messages linked to input
- [ ] Keyboard shortcuts documented
- [ ] Color contrast meets WCAG AA

---

## 10. Mobile Responsiveness

### 10.1 Mobile Layout

- Single column layout
- URL input full width
- Preview/HTML tabs (not side-by-side)
- Metrics as horizontal scroll
- Copy/Download buttons in toolbar

### 10.2 Touch Considerations

- Touch-friendly button sizes (44x44 min)
- Swipe between preview tabs
- Long-press for copy on code

---

## 11. Error Handling

### 11.1 Error Messages

| Error Code | User Message | Suggestion |
|------------|--------------|------------|
| `TIMEOUT` | "Page took too long to render" | "Check for slow resources" |
| `NETWORK_ERROR` | "Couldn't reach your site" | "Verify site is accessible" |
| `RENDER_ERROR` | "Error rendering page" | "Check browser console for JS errors" |
| `INVALID_URL` | "Invalid URL" | "Enter a valid page path" |
| `DOMAIN_MISMATCH` | "URL must be on your registered domain" | "Select correct site or add domain" |
| `RATE_LIMITED` | "Too many requests" | "Wait a moment and try again" |

### 11.2 Retry Logic

- Auto-retry once on timeout
- Show retry button on failure
- Max 3 manual retries before cooldown

---

## 12. Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| Visual diff | P2 | Highlight differences between versions |
| Screenshot comparison | P2 | Side-by-side screenshots |
| Batch testing | P3 | Test multiple URLs at once |
| Scheduled tests | P3 | Automatic periodic testing |
| Share results | P3 | Generate shareable link |
| History export | P3 | Export test history as CSV |
| Custom headers | P3 | Test with custom request headers |

---

*This specification defines the Test Render tool. It's the primary way users verify CrawlReady is working without waiting for real crawler visits.*
