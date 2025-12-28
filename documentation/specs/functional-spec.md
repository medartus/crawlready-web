# CrawlReady: Functional Specification

**Version**: 1.0  
**Date**: December 28, 2024  
**Status**: Draft - Pending Approval  
**Dependencies**: Business Requirements Specification v1.0

---

## 1. Overview

### 1.1 Purpose

This document specifies the functional behavior of the CrawlReady pre-rendering proxy service, including:
- API endpoint specifications (request/response formats)
- User stories and acceptance criteria
- Cache key normalization logic
- Two-tier storage architecture
- Error handling and edge cases

### 1.2 Scope

**In Scope**:
- All customer-facing API endpoints
- Cache management logic
- URL normalization algorithm
- Storage tier promotion rules

**Out of Scope**:
- Internal worker implementation details (see Worker Specification)
- Database schema (see Database Schema Specification)
- Infrastructure setup (see Implementation Plan)

---

## 2. User Stories

### 2.1 Story 1: API Key Generation (Admin)

**As an** administrator  
**I want to** generate API keys for new customers  
**So that** they can authenticate render requests

**Acceptance Criteria**:
1. Enter customer email address in admin form
2. Click "Generate API Key" button
3. System generates key in format `sk_live_{32_random_chars}`
4. System hashes key with SHA-256 and stores in database
5. Display full key once (cannot be retrieved later)
6. Provide "Copy to Clipboard" button
7. Key is immediately active (no activation step)

**Edge Cases**:
- Duplicate email: Allow (customers can have multiple keys)
- Invalid email format: Show validation error
- Key generation fails: Retry automatically, show error if 3 attempts fail

**Technical Notes**:
- Use `crypto.randomBytes(24).toString('base64url')` for key generation
- Store only SHA-256 hash, never plaintext
- Log key creation event for audit trail

---

### 2.2 Story 2: Render Request (Developer)

**As a** developer integrating CrawlReady  
**I want to** request a pre-rendered page  
**So that** I can serve optimized HTML to AI bots

**Acceptance Criteria**:
1. Make POST request to `/api/render` with URL and API key
2. If page is cached (hot or cold), receive HTML immediately (200)
3. If page is not cached, receive job ID (202) for polling
4. Response headers indicate cache status (X-Cache: HIT/MISS/COLD)
5. Invalid URL returns 400 with descriptive error
6. Rate limit exceeded returns 429 with retry time

**Edge Cases**:
- URL with tracking params: Normalized (params removed) before cache lookup
- URL with hash fragment: Fragment removed before cache lookup
- URL is customer's own site: Allowed (no same-origin policy)
- URL is down/404: Return 202, render worker handles error

**Technical Notes**:
- URL validation must prevent SSRF attacks
- Cache check hits Redis first, then Supabase Storage
- Response streams HTML (don't buffer entire response in memory)

---

### 2.3 Story 3: Cache Status Check (Developer)

**As a** developer  
**I want to** check if a page is already cached  
**So that** I can decide whether to request a render

**Acceptance Criteria**:
1. Make GET request to `/api/cache/status?url={encoded_url}`
2. Receive JSON with cache status: `{cached: true/false, location: 'hot'/'cold'/'none'}`
3. If cached, include metadata: last rendered time, size, access count
4. Response time <100ms (no heavy computation)
5. Works for both hot and cold cached pages

**Edge Cases**:
- URL not cached: Return `{cached: false, location: 'none'}`
- URL in flight (currently rendering): Return `{cached: false, rendering: true, jobId: '...'}`
- Invalid URL: Return 400 with error message

---

### 2.4 Story 4: Cache Invalidation (Developer)

**As a** developer  
**I want to** purge cached pages after site updates  
**So that** bots get fresh content on next request

**Acceptance Criteria**:
1. Make DELETE request to `/api/cache?url={encoded_url}`
2. System removes entry from Redis (hot cache)
3. System deletes file from Supabase Storage (cold storage)
4. System deletes metadata from PostgreSQL
5. Receive confirmation: `{success: true, freedSpace: 245678}`
6. Next render request will re-render the page

**Edge Cases**:
- URL not cached: Return success anyway (idempotent operation)
- URL currently being rendered: Cancel job if queued, let complete if processing
- Partial deletion failure: Mark for retry, return 207 Multi-Status

---

### 2.5 Story 5: Usage Monitoring (Customer)

**As a** customer  
**I want to** see my API usage stats  
**So that** I can track costs and optimize usage

**Acceptance Criteria**:
1. Navigate to admin page (provided via email)
2. Enter API key to view stats (or pre-authenticated link)
3. See dashboard with:
   - Renders today / this month / all time
   - Cache hit rate (percentage)
   - Storage used (GB)
   - Top 10 rendered URLs
4. Data updates every 5 minutes (not real-time)

**Edge Cases**:
- No usage yet: Show "0" with helpful onboarding message
- Multiple API keys: Show aggregate stats (future: per-key breakdown)

---

## 3. API Specifications

### 3.1 Endpoint: Render Page

#### Request

```http
POST /api/render HTTP/1.1
Host: api.crawlready.com
Authorization: Bearer sk_live_abc123...
Content-Type: application/json

{
  "url": "https://example.com/product/123",
  "waitForSelector": "#content",
  "timeout": 30000
}
```

**Headers**:
- `Authorization` (required): Bearer token with API key
- `Content-Type` (required): `application/json`

**Body Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | Full URL to render (must start with http:// or https://) |
| `waitForSelector` | string | No | null | CSS selector to wait for before capturing HTML |
| `timeout` | integer | No | 30000 | Max time to wait for page load (ms), max 60000 |

**URL Validation Rules**:
1. Must be valid URL (parseable by URL API)
2. Protocol must be `http:` or `https:`
3. Hostname cannot be private IP (10.x, 172.16-31.x, 192.168.x, 127.0.0.1, localhost)
4. Hostname cannot be cloud metadata endpoints (169.254.169.254, metadata.google.internal)

---

#### Response (200 - Cache Hit from Hot Cache)

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Cache: HIT
X-Cache-Age: 3600
X-Cache-Location: hot
Content-Length: 245678

<!DOCTYPE html>
<html>
  <head>...</head>
  <body>...</body>
</html>
```

**Headers**:
- `X-Cache: HIT` - Page served from cache
- `X-Cache-Age` - Seconds since page was rendered
- `X-Cache-Location: hot` - Served from Redis hot cache
- `Content-Length` - Size of HTML in bytes

---

#### Response (200 - Cache Hit from Cold Storage)

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Cache: COLD
X-Cache-Age: 86400
X-Cache-Location: cold
X-Promotion: async
Content-Length: 245678

<!DOCTYPE html>...
```

**Headers**:
- `X-Cache: COLD` - Page retrieved from cold storage
- `X-Cache-Location: cold` - Served from Supabase Storage
- `X-Promotion: async` - Page is being promoted to hot cache (future requests will be faster)

---

#### Response (202 - Queued for Rendering)

```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "status": "queued",
  "jobId": "01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "statusUrl": "/api/status/01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "estimatedTime": 5000,
  "message": "Page is being rendered. Poll statusUrl for completion."
}
```

**Body Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "queued" for 202 responses |
| `jobId` | string | Unique job identifier (ULID format) |
| `statusUrl` | string | Endpoint to check job status |
| `estimatedTime` | integer | Estimated completion time in milliseconds |
| `message` | string | Human-readable explanation |

---

#### Response (400 - Invalid URL)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid URL",
  "message": "Private IPs and localhost are not allowed",
  "details": {
    "url": "http://localhost:3000/api",
    "reason": "hostname_blocked"
  }
}
```

**Error Codes**:
| Reason | Description |
|--------|-------------|
| `invalid_url_format` | URL cannot be parsed |
| `invalid_protocol` | Must be http or https |
| `hostname_blocked` | Private IP or cloud metadata endpoint |
| `url_too_long` | URL exceeds 2048 characters |

---

#### Response (401 - Unauthorized)

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Invalid or missing API key",
  "hint": "Provide API key in Authorization header: Bearer sk_live_..."
}
```

---

#### Response (429 - Rate Limited)

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 3600

{
  "error": "Rate limit exceeded",
  "message": "Daily render limit reached",
  "limit": 100,
  "used": 100,
  "resetAt": "2024-12-29T00:00:00Z",
  "upgradeUrl": "https://crawlready.com/pricing"
}
```

---

### 3.2 Endpoint: Job Status

#### Request

```http
GET /api/status/01HQTX5K3G7YZ8VWXR9NQM2PF4 HTTP/1.1
Host: api.crawlready.com
Authorization: Bearer sk_live_abc123...
```

**Path Parameters**:
- `jobId`: Job identifier returned from POST /api/render (202 response)

---

#### Response (Processing)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "processing",
  "jobId": "01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "progress": 60,
  "message": "Waiting for page JavaScript to execute...",
  "startedAt": "2024-12-28T10:00:00Z",
  "estimatedCompletion": "2024-12-28T10:00:05Z"
}
```

**Status Values**:
- `queued`: Job is in queue, not yet started
- `processing`: Worker is actively rendering the page
- `completed`: Rendering successful, HTML cached
- `failed`: Rendering failed after retries

---

#### Response (Completed)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "completed",
  "jobId": "01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "url": "https://example.com/product/123",
  "cachedUrl": "/api/render",
  "size": 245678,
  "renderTime": 2340,
  "completedAt": "2024-12-28T10:00:03Z",
  "message": "Page rendered successfully. Subsequent requests will be served from cache."
}
```

**Next Steps for Customer**:
1. Make same POST /api/render request again
2. This time will receive 200 with cached HTML (not 202)

---

#### Response (Failed)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "failed",
  "jobId": "01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "error": "Timeout after 30s",
  "errorCode": "render_timeout",
  "retriesLeft": 0,
  "failedAt": "2024-12-28T10:00:30Z",
  "suggestion": "Increase timeout parameter or check if site is accessible"
}
```

**Error Codes**:
| Code | Description | Customer Action |
|------|-------------|-----------------|
| `render_timeout` | Page didn't load within timeout | Increase timeout or optimize site |
| `network_error` | Cannot connect to URL | Check URL is accessible publicly |
| `page_error` | Page returned 4xx/5xx status | Fix origin site error |
| `worker_error` | Internal worker failure | Retry, contact support if persists |

---

### 3.3 Endpoint: Cache Status

#### Request

```http
GET /api/cache/status?url=https%3A%2F%2Fexample.com%2Fproduct%2F123 HTTP/1.1
Host: api.crawlready.com
Authorization: Bearer sk_live_abc123...
```

**Query Parameters**:
- `url` (required): URL-encoded URL to check

---

#### Response (Cached)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "cached": true,
  "location": "hot",
  "normalizedUrl": "https://example.com/product/123",
  "lastRendered": "2024-12-28T08:30:00Z",
  "age": 5400,
  "size": 245678,
  "accessCount": 42,
  "rendering": false
}
```

**Location Values**:
- `hot`: In Redis hot cache (fastest access)
- `cold`: In Supabase Storage (will be promoted on next access)
- `none`: Not cached (will trigger render on request)

---

#### Response (Not Cached)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "cached": false,
  "location": "none",
  "normalizedUrl": "https://example.com/product/123",
  "rendering": false,
  "message": "URL has not been rendered yet"
}
```

---

#### Response (Currently Rendering)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "cached": false,
  "location": "none",
  "normalizedUrl": "https://example.com/product/123",
  "rendering": true,
  "jobId": "01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "statusUrl": "/api/status/01HQTX5K3G7YZ8VWXR9NQM2PF4",
  "message": "Render job in progress"
}
```

---

### 3.4 Endpoint: Cache Invalidation

#### Request

```http
DELETE /api/cache?url=https%3A%2F%2Fexample.com%2Fproduct%2F123 HTTP/1.1
Host: api.crawlready.com
Authorization: Bearer sk_live_abc123...
```

**Query Parameters**:
- `url` (required): URL-encoded URL to invalidate

---

#### Response (Success)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "normalizedUrl": "https://example.com/product/123",
  "clearedFrom": ["hot", "cold"],
  "freedSpace": 245678,
  "message": "Cache cleared for URL. Next render request will re-render the page."
}
```

---

#### Response (Not Cached - Still Success)

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "normalizedUrl": "https://example.com/product/123",
  "clearedFrom": [],
  "freedSpace": 0,
  "message": "URL was not cached"
}
```

**Note**: Idempotent operation - always returns success even if nothing to delete.

---

## 4. Cache Key Logic

### 4.1 URL Normalization Algorithm

**Purpose**: Ensure consistent cache keys across different URL variations.

**Algorithm**:

```typescript
function normalizeUrl(url: string): string {
  // 1. Parse URL
  const parsed = new URL(url);
  
  // 2. Normalize protocol (always https)
  // Reason: Most sites redirect http → https anyway
  parsed.protocol = 'https:';
  
  // 3. Lowercase hostname
  // Reason: DNS is case-insensitive
  parsed.hostname = parsed.hostname.toLowerCase();
  
  // 4. Remove trailing slash from pathname
  // Reason: /page and /page/ are usually same content
  if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }
  
  // 5. Filter query parameters
  const trackingParams = [
    // Google Analytics
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    // Social media tracking
    'fbclid', 'gclid', 'msclkid', 
    // Analytics tracking
    '_ga', '_gid', '_gac', 'mc_cid', 'mc_eid',
    // Other common tracking
    'ref', 'source'
  ];
  
  const params = new URLSearchParams(parsed.search);
  const filteredParams = new URLSearchParams();
  
  for (const [key, value] of params.entries()) {
    if (!trackingParams.includes(key.toLowerCase())) {
      filteredParams.append(key, value);
    }
  }
  
  // 6. Sort query params alphabetically
  // Reason: ?a=1&b=2 and ?b=2&a=1 should have same cache key
  filteredParams.sort();
  parsed.search = filteredParams.toString();
  
  // 7. Remove fragment (hash)
  // Reason: Fragments are client-side only, don't affect server rendering
  parsed.hash = '';
  
  return parsed.toString();
}

function getCacheKey(url: string): string {
  const normalized = normalizeUrl(url);
  return `render:v1:${normalized}`;
}
```

---

### 4.2 Normalization Examples

| Original URL | Normalized URL | Cache Key |
|-------------|----------------|-----------|
| `http://Example.com/Page` | `https://example.com/Page` | `render:v1:https://example.com/Page` |
| `https://example.com/page/` | `https://example.com/page` | `render:v1:https://example.com/page` |
| `https://example.com/page?utm_source=google&id=5` | `https://example.com/page?id=5` | `render:v1:https://example.com/page?id=5` |
| `https://example.com/page?b=2&a=1` | `https://example.com/page?a=1&b=2` | `render:v1:https://example.com/page?a=1&b=2` |
| `https://example.com/page#section` | `https://example.com/page` | `render:v1:https://example.com/page` |
| `https://example.com/page?fbclid=abc&ref=twitter` | `https://example.com/page` | `render:v1:https://example.com/page` |

---

### 4.3 Why NO User-Agent in Cache Key

**Decision**: Same HTML served to all AI bots (ChatGPT, Claude, Perplexity, Gemini, etc.)

**Rationale**:
1. **Reduced Cache Entries**: One entry per URL vs one per (URL × bot) = 5x reduction
2. **Simpler Invalidation**: Purge URL once, affects all bots
3. **Cost Savings**: Less storage, fewer renders
4. **Customer Simplicity**: Most customers (95%) serve identical content to all bots

**Trade-off**: Cannot customize content per bot (e.g., Claude prefers different schema structure)

**Mitigation** (Phase 2): Add opt-in bot-specific rendering for customers who need it:
- Cache key becomes: `render:v1:{botType}:{normalizedUrl}`
- `botType` values: `chatgpt`, `claude`, `perplexity`, `gemini`, `default`
- Increases costs by ~3-5x for customers who opt in

---

## 5. Two-Tier Storage Architecture

### 5.1 Storage Tiers

#### Hot Cache (Redis)

**Technology**: Upstash Redis  
**Capacity**: 1000 most recently accessed pages  
**Eviction**: LRU (Least Recently Used)  
**TTL**: None (evicted by LRU only, not time-based)  
**Access Time**: <50ms (p95)  
**Purpose**: Ultra-fast serving for frequently accessed pages

**Implementation**:
```typescript
// Redis key: render:v1:{normalizedUrl}
// Redis value: Full HTML string
await redis.set(cacheKey, html, {
  // No EXAT (expiration time)
  // Evicted by LRU when cache reaches 1000 entries
});
```

---

#### Cold Storage (Supabase Storage)

**Technology**: Supabase Storage (S3-compatible)  
**Capacity**: Unlimited (pay per GB)  
**Retention**: Permanent (until customer deletes)  
**Access Time**: <300ms (p95)  
**Purpose**: Long-term storage, no re-rendering needed

**Implementation**:
```typescript
// Storage path: rendered/{hash}.html
// hash = first 16 chars of SHA-256(normalizedUrl)
const storageKey = `rendered/${hashUrl(normalizedUrl)}.html`;
await supabase.storage
  .from('rendered-pages')
  .upload(storageKey, html, {
    contentType: 'text/html',
    cacheControl: 'private, max-age=31536000'
  });
```

---

### 5.2 Cache Lookup Flow

```typescript
async function getRenderedPage(url: string, apiKeyId: string): Promise<CacheResult> {
  const normalizedUrl = normalizeUrl(url);
  const cacheKey = getCacheKey(normalizedUrl);
  
  // STEP 1: Try hot cache (Redis)
  const startTime = Date.now();
  let html = await redis.get(cacheKey);
  
  if (html) {
    const responseTime = Date.now() - startTime;
    await trackCacheAccess(apiKeyId, normalizedUrl, 'hot', responseTime);
    
    return {
      html,
      cacheStatus: 'HIT',
      location: 'hot',
      age: await getCacheAge(normalizedUrl),
      responseTime
    };
  }
  
  // STEP 2: Try cold storage (Supabase)
  const storageKey = `rendered/${hashUrl(normalizedUrl)}.html`;
  const { data, error } = await supabase.storage
    .from('rendered-pages')
    .download(storageKey);
  
  if (data && !error) {
    html = await data.text();
    const responseTime = Date.now() - startTime;
    
    // STEP 3: Promote to hot cache (async, don't block response)
    promoteToHotCache(cacheKey, html).catch(err => 
      logger.error('Cache promotion failed', { cacheKey, error: err })
    );
    
    await trackCacheAccess(apiKeyId, normalizedUrl, 'cold', responseTime);
    
    return {
      html,
      cacheStatus: 'COLD',
      location: 'cold',
      age: await getCacheAge(normalizedUrl),
      responseTime
    };
  }
  
  // STEP 4: Not found anywhere
  return {
    html: null,
    cacheStatus: 'MISS',
    location: 'none',
    age: null,
    responseTime: Date.now() - startTime
  };
}
```

---

### 5.3 Cache Promotion Logic

**When**: Page is accessed from cold storage  
**Goal**: Move to hot cache for faster future access  
**Implementation**: Async (don't block response to customer)

```typescript
async function promoteToHotCache(cacheKey: string, html: string): Promise<void> {
  try {
    // Redis will auto-evict least recently used if at capacity
    await redis.set(cacheKey, html);
    
    // Update metadata in PostgreSQL
    await db.update(renderedPages)
      .set({ inRedis: true })
      .where(eq(renderedPages.cacheKey, cacheKey));
    
    logger.info('Cache promoted', { cacheKey, size: html.length });
  } catch (error) {
    // Non-critical failure, just log
    logger.error('Promotion failed', { cacheKey, error });
  }
}
```

---

### 5.4 Storage After Render

**When**: Render worker completes a job  
**Goal**: Store in both tiers simultaneously  
**Implementation**: Parallel writes (don't wait for both)

```typescript
async function storeRenderedPage(
  normalizedUrl: string,
  html: string,
  metadata: RenderMetadata
): Promise<void> {
  const cacheKey = getCacheKey(normalizedUrl);
  const storageKey = `rendered/${hashUrl(normalizedUrl)}.html`;
  
  // Write to both tiers in parallel
  const [redisResult, storageResult] = await Promise.allSettled([
    // Hot cache (Redis)
    redis.set(cacheKey, html),
    
    // Cold storage (Supabase)
    supabase.storage
      .from('rendered-pages')
      .upload(storageKey, html, { upsert: true })
  ]);
  
  // Log any failures (but don't throw)
  if (redisResult.status === 'rejected') {
    logger.error('Redis write failed', { cacheKey, error: redisResult.reason });
  }
  if (storageResult.status === 'rejected') {
    logger.error('Storage write failed', { storageKey, error: storageResult.reason });
  }
  
  // Update metadata in PostgreSQL
  await db.insert(renderedPages).values({
    normalizedUrl,
    storageKey,
    htmlSizeBytes: html.length,
    inRedis: redisResult.status === 'fulfilled',
    firstRenderedAt: new Date(),
    lastAccessedAt: new Date(),
    accessCount: 0
  }).onConflictDoUpdate({
    target: renderedPages.normalizedUrl,
    set: {
      storageKey,
      htmlSizeBytes: html.length,
      inRedis: redisResult.status === 'fulfilled',
      lastAccessedAt: new Date()
    }
  });
}
```

---

### 5.5 Storage Costs Calculation

**Assumptions**:
- Average page size: 500KB (after HTML optimization)
- Hot cache: 1000 pages max
- Cold storage: All rendered pages

**Cost Breakdown**:

| Scale | Pages Rendered | Hot Cache | Cold Storage | Monthly Cost |
|-------|----------------|-----------|--------------|--------------|
| MVP (3 months) | 10,000 | 500MB (1000 pages) | 5GB | $0.11 |
| Post-MVP (6 months) | 100,000 | 500MB | 50GB | $1.05 |
| Scale (12 months) | 500,000 | 500MB | 250GB | $5.25 |

**Formula**:
- Hot cache cost: $0 (included in Upstash plan up to 1GB)
- Cold storage cost: `(total_pages * 500KB / 1GB) * $0.021 per GB`

**Storage per Customer** (estimate):
- Small customer: 100 pages = 50MB = $0.001/mo
- Medium customer: 1,000 pages = 500MB = $0.01/mo
- Large customer: 10,000 pages = 5GB = $0.11/mo

---

## 6. Error Handling

### 6.1 Error Response Format

All error responses follow this structure:

```json
{
  "error": "Short error code",
  "message": "Human-readable explanation",
  "details": {
    // Optional: Additional context
  },
  "hint": "Suggested action for customer",
  "docsUrl": "https://docs.crawlready.com/errors/{errorCode}"
}
```

---

### 6.2 HTTP Status Codes

| Status | Meaning | When to Use |
|--------|---------|-------------|
| 200 | Success | Cached HTML returned |
| 202 | Accepted | Job queued for async processing |
| 400 | Bad Request | Invalid URL, missing parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | API key exists but is disabled |
| 404 | Not Found | Job ID doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error (auto-reported to Sentry) |
| 503 | Service Unavailable | System overloaded, try again later |

---

### 6.3 Retry Behavior

**Customer Retries** (recommended):
- 4xx errors: Don't retry (fix request first)
- 429 (rate limit): Retry after `Retry-After` header
- 5xx errors: Retry with exponential backoff (1s, 2s, 4s, 8s)
- Network errors: Retry up to 3 times

**Server-Side Retries** (automatic):
- Render timeouts: Retry once with 2x timeout
- Network errors during render: Retry 3x with exponential backoff
- Storage write failures: Retry 2x immediately

---

## 7. Performance Requirements

### 7.1 Response Time Targets

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| Cache hit (hot) | 30ms | 100ms | 200ms |
| Cache hit (cold) | 150ms | 300ms | 500ms |
| Cache miss (202 response) | 50ms | 150ms | 300ms |
| Job status check | 20ms | 50ms | 100ms |
| Cache invalidation | 100ms | 300ms | 500ms |

**Fresh Render** (async):
- p50: 3s
- p95: 5s
- p99: 10s
- Timeout: 30s (default), 60s (extended)

---

### 7.2 Throughput Targets

**MVP Scale**:
- 1,000 renders/day (0.7 renders/minute avg)
- Peak: 10 concurrent requests
- Single worker can handle load

**Post-MVP Scale**:
- 50,000 renders/day (35 renders/minute avg)
- Peak: 100 concurrent requests
- 3 workers needed

---

### 7.3 Availability Targets

**MVP**: 99% uptime (7.2 hours downtime/month acceptable)  
**Post-MVP**: 99.5% uptime (3.6 hours/month)  
**Enterprise**: 99.9% uptime (43 minutes/month) with SLA

**Monitoring**: Alert if downtime >5 minutes or error rate >5%

---

## 8. Security Requirements

### 8.1 SSRF Protection

**Threat**: Attacker provides internal URL (e.g., `http://localhost/admin`) to access internal services.

**Mitigation**:
```typescript
const BLOCKED_HOSTS = [
  // Loopback
  'localhost', '127.0.0.1', '::1', '0.0.0.0',
  
  // Private IPv4
  '10.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
  '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
  '172.30.', '172.31.', '192.168.', '169.254.',
  
  // Cloud metadata endpoints
  '169.254.169.254', // AWS, Azure, GCP
  'metadata.google.internal', // GCP
  'metadata.google.com', // GCP
  'metadata', // Generic
];

function validateUrl(url: string): void {
  const parsed = new URL(url); // Throws if invalid format
  
  // Check protocol
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) protocols allowed');
  }
  
  // Check hostname against blocklist
  const hostname = parsed.hostname.toLowerCase();
  for (const blocked of BLOCKED_HOSTS) {
    if (hostname.includes(blocked)) {
      throw new Error(`Hostname '${hostname}' is blocked`);
    }
  }
  
  // Additional check: Resolve DNS and verify IP is public
  // (Implemented in worker, not edge API for performance)
}
```

---

### 8.2 API Key Security

**Storage**: SHA-256 hash only (never plaintext)

```typescript
import crypto from 'crypto';

function generateApiKey(tier: 'free' | 'pro' | 'enterprise'): { key: string, hash: string, prefix: string } {
  const random = crypto.randomBytes(24); // 192 bits
  const key = `sk_${tier === 'free' ? 'test' : 'live'}_${random.toString('base64url')}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 15) + '...'; // For display: "sk_live_abc123..."
  
  return { key, hash, prefix };
}

function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const hash = crypto.createHash('sha256').update(providedKey).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}
```

**Transmission**: Always over HTTPS, Bearer token format

---

### 8.3 Rate Limiting

**Algorithm**: Sliding window counter (Redis)

```typescript
async function checkRateLimit(apiKeyId: string, limit: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - (24 * 60 * 60 * 1000); // 24 hours ago
  
  const key = `ratelimit:${apiKeyId}`;
  
  // Add current request timestamp
  await redis.zadd(key, now, `${now}`);
  
  // Remove timestamps older than 24 hours
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count requests in window
  const count = await redis.zcard(key);
  
  // Set expiry on key (cleanup)
  await redis.expire(key, 25 * 60 * 60); // 25 hours
  
  const allowed = count <= limit;
  const resetAt = new Date(windowStart + (24 * 60 * 60 * 1000));
  
  return {
    allowed,
    limit,
    used: count,
    remaining: Math.max(0, limit - count),
    resetAt
  };
}
```

---

## 9. Appendix

### 9.1 Example Integration Code

#### Next.js Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOT_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /ClaudeBot/i,
  /Claude-Web/i,
  /PerplexityBot/i,
  /Google-Extended/i,
];

function isAIBot(userAgent: string): boolean {
  return AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  
  if (isAIBot(userAgent)) {
    const url = req.nextUrl.toString();
    
    // Request pre-rendered HTML from CrawlReady
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      // Return pre-rendered HTML
      return new NextResponse(await response.text(), {
        headers: {
          'Content-Type': 'text/html',
          'X-Served-By': 'CrawlReady',
        },
      });
    }
    
    // If 202 or error, let request through to origin
  }
  
  return NextResponse.next();
}
```

---

### 9.2 Reference Documents

- Business Requirements: `documentation/specs/business-requirements.md`
- Non-Functional Requirements: `documentation/specs/non-functional-requirements.md` (to be written)
- Database Schema: `documentation/specs/database-schema.md` (to be written)
- Integration Guide: `documentation/specs/integration-guide.md` (to be written)
- Render Worker Specification: `documentation/specs/render-worker-spec.md` (to be written)

---

**Document Status**: DRAFT - Pending stakeholder review

