# User API Endpoints Specification

## Overview

User API endpoints (`/api/user/*`) provide self-service functionality for authenticated users to manage their own API keys, view usage statistics, and browse rendered pages. All endpoints require Clerk authentication and enforce user-scoped data access.

## Authentication

### Method
- **Clerk Session:** Required via cookies (browser) or Authorization header (programmatic)
- **Rate Limiting:** 100 requests/minute per user
- **Scope:** All operations scoped to authenticated user ID

### Authorization Header (Optional)
```
Authorization: Bearer <clerk_session_token>
```

## Common Response Patterns

### Success Response
```typescript
{
  // Response data varies by endpoint
}
```

### Error Responses

**401 Unauthorized:**
```typescript
{
  error: "Unauthorized";
  message: "Authentication required";
}
```

**403 Forbidden:**
```typescript
{
  error: "Forbidden";
  message: "You don't have permission to access this resource";
}
```

**404 Not Found:**
```typescript
{
  error: "Not found";
  message: "Resource not found or does not belong to you";
}
```

**429 Rate Limit:**
```typescript
{
  error: "Rate limit exceeded";
  message: "Too many requests. Please try again later.";
  retryAfter: number;  // seconds
}
```

**500 Server Error:**
```typescript
{
  error: "Internal server error";
  message: string;
}
```

## API Keys Management

### POST /api/user/keys
Generate a new API key for the authenticated user.

**Rate Limit:** 10 keys per user maximum

**Request Body:**
```typescript
{
  name?: string;                              // Optional key description (max 100 chars)
  tier: 'free' | 'pro' | 'enterprise';       // Defaults to user's account tier
}
```

**Validation:**
- `name`: Optional, alphanumeric + spaces/hyphens, max 100 characters
- `tier`: Must match or be lower than user's account tier

**Response (201 Created):**
```typescript
{
  key: string;              // Full API key (shown only once!)
  keyPrefix: string;        // First 16 characters for display
  id: string;               // UUID
  userId: string;           // Clerk user ID
  orgId: string | null;     // Clerk org ID (if applicable)
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;        // ISO 8601
  rateLimitDaily: number;   // Based on tier
  message: "API key generated successfully. Save it now - you won't see it again!";
}
```

**Response (400 Bad Request):**
```typescript
{
  error: "Validation failed";
  details: Array<{
    field: string;
    message: string;
  }>;
}
```

**Response (403 Forbidden):**
```typescript
{
  error: "Key limit reached";
  message: "Maximum 10 keys per user. Revoke unused keys to create new ones.";
}
```

### GET /api/user/keys
List all API keys belonging to the authenticated user.

**Query Parameters:** None

**Response (200 OK):**
```typescript
{
  keys: Array<{
    id: string;
    keyPrefix: string;       // e.g., "sk_live_abc123..."
    name?: string;
    tier: 'free' | 'pro' | 'enterprise';
    createdAt: string;
    lastUsedAt?: string;
    isActive: boolean;
    rateLimitDaily: number;
    usageToday: number;      // Requests made today
  }>;
  total: number;
}
```

### DELETE /api/user/keys/:keyId
Revoke an API key (soft delete - sets `isActive` to false).

**Path Parameters:**
- `keyId`: UUID of the key to revoke

**Response (200 OK):**
```typescript
{
  message: "API key revoked successfully";
  keyId: string;
}
```

**Response (404 Not Found):**
```typescript
{
  error: "Not found";
  message: "API key not found or does not belong to you";
}
```

**Notes:**
- Revocation is idempotent (revoking already-revoked key returns success)
- Revoked keys cannot be reactivated (must generate new key)
- All active requests using this key will fail after revocation

### GET /api/user/keys/:keyId/usage
Get usage statistics for a specific API key.

**Path Parameters:**
- `keyId`: UUID of the key

**Query Parameters:**
- `range`: '24h' | '7d' | '30d' (default: '24h')

**Response (200 OK):**
```typescript
{
  keyId: string;
  keyPrefix: string;
  range: string;
  stats: {
    totalRequests: number;
    requestsRemaining: number;
    cacheHitRate: number;         // 0-100
    requestsByStatus: {
      completed: number;
      failed: number;
      queued: number;
    };
    topUrls: Array<{
      url: string;
      count: number;
    }>;
  };
}
```

## Usage Statistics

### GET /api/user/usage
Get comprehensive usage statistics for the authenticated user.

**Query Parameters:**
- `range`: '24h' | '7d' | '30d' (default: '24h')
- `keyId`: Optional UUID to filter by specific API key

**Response (200 OK):**
```typescript
{
  range: '24h' | '7d' | '30d';
  period: {
    start: string;           // ISO 8601
    end: string;             // ISO 8601
  };
  summary: {
    totalRequests: number;
    requestsLimit: number;
    requestsRemaining: number;
    cacheHitRate: number;    // 0-100
    avgResponseTime: number; // milliseconds
    errorRate: number;       // 0-100
    comparisonPreviousPeriod: {
      requests: number;      // +12 or -5
      percentChange: number; // +12.5 or -8.3
    };
  };
  cacheBreakdown: {
    hotCacheHits: number;
    coldCacheHits: number;
    cacheMisses: number;
  };
  statusBreakdown: {
    completed: number;
    failed: number;
    queued: number;
  };
  errorBreakdown: Array<{
    errorType: string;       // 'SSRF_BLOCKED', 'INVALID_URL', etc.
    count: number;
    percentage: number;
  }>;
  topUrls: Array<{
    url: string;
    requestCount: number;
    cacheHitRate: number;
    avgResponseTime: number;
  }>;
  dailyUsage: Array<{
    date: string;            // YYYY-MM-DD
    requests: number;
    cacheHitRate: number;
  }>;
  usageByKey?: Array<{     // If user has multiple keys
    keyId: string;
    keyPrefix: string;
    requests: number;
    cacheHitRate: number;
    errorRate: number;
  }>;
}
```

### GET /api/user/usage/export
Export usage data as CSV or JSON.

**Query Parameters:**
- `range`: '24h' | '7d' | '30d' (default: '24h')
- `format`: 'csv' | 'json' (default: 'csv')

**Response (200 OK - CSV):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="crawlready-usage-2025-01-15.csv"

Date,Requests,Cache Hit Rate,Failures,Avg Response Time
2025-01-15,234,87.5,12,1250
2025-01-14,189,92.1,8,1180
...
```

**Response (200 OK - JSON):**
```typescript
{
  exportDate: string;      // ISO 8601
  range: string;
  data: Array<{
    date: string;
    requests: number;
    cacheHitRate: number;
    failures: number;
    avgResponseTime: number;
  }>;
}
```

## Rendered Pages Management

### GET /api/user/pages
List rendered pages belonging to the authenticated user.

**Query Parameters:**
- `page`: number (default: 1, min: 1)
- `limit`: number (default: 50, min: 1, max: 100)
- `search`: string (URL search term, min 3 chars)
- `cacheLocation`: 'hot' | 'cold' | 'none' | 'all' (default: 'all')
- `status`: 'cached' | 'expired' | 'failed' | 'all' (default: 'all')
- `dateRange`: '24h' | '7d' | '30d' | 'all' (default: 'all')
- `keyId`: UUID (filter by specific API key)
- `sortBy`: 'renderedAt' | 'url' | 'htmlSize' (default: 'renderedAt')
- `sortOrder`: 'asc' | 'desc' (default: 'desc')

**Response (200 OK):**
```typescript
{
  pages: Array<{
    id: string;
    url: string;
    renderedAt: string;         // ISO 8601
    cacheLocation: 'hot' | 'cold' | 'none';
    status: 'cached' | 'expired' | 'failed';
    htmlSize: number;            // bytes
    apiKeyPrefix: string;
    jobId: string;
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {                     // Echo back applied filters
    search?: string;
    cacheLocation: string;
    status: string;
    dateRange: string;
    keyId?: string;
  };
}
```

### GET /api/user/pages/:pageId
Get details for a specific rendered page.

**Path Parameters:**
- `pageId`: UUID of the rendered page

**Response (200 OK):**
```typescript
{
  id: string;
  url: string;
  renderedAt: string;
  cacheLocation: 'hot' | 'cold' | 'none';
  status: 'cached' | 'expired' | 'failed';
  htmlSize: number;
  apiKeyPrefix: string;
  jobId: string;
  metadata: {
    userAgent: string;
    waitForSelector?: string;
    timeout: number;
  };
}
```

### GET /api/user/pages/:pageId/html
Get the rendered HTML content for a specific page.

**Path Parameters:**
- `pageId`: UUID of the rendered page

**Response (200 OK):**
```typescript
{
  id: string;
  url: string;
  html: string;                   // Full rendered HTML
  renderedAt: string;
  htmlSize: number;
  cacheLocation: 'hot' | 'cold';
}
```

**Response (410 Gone):**
```typescript
{
  error: "Content unavailable";
  message: "HTML content has been purged or moved to archive";
}
```

**Notes:**
- Large HTML may be compressed (check Content-Encoding header)
- HTML is sanitized (scripts removed, event handlers stripped)
- Maximum response size: 5MB

### DELETE /api/user/pages/:pageId
Invalidate cache for a specific rendered page.

**Path Parameters:**
- `pageId`: UUID of the rendered page

**Response (200 OK):**
```typescript
{
  message: "Cache invalidated successfully";
  url: string;
  pageId: string;
}
```

**Notes:**
- Removes from Redis hot cache
- Marks as invalidated in database
- Next request will trigger fresh render
- Idempotent operation

### POST /api/user/pages/bulk-invalidate
Invalidate multiple pages in a single request.

**Request Body:**
```typescript
{
  pageIds: string[];              // Array of UUIDs (max 100)
}
```

**Response (200 OK):**
```typescript
{
  message: "Bulk invalidation completed";
  invalidated: number;            // Count of successful invalidations
  failed: number;                 // Count of failures
  results: Array<{
    pageId: string;
    url: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
}
```

**Response (400 Bad Request):**
```typescript
{
  error: "Invalid request";
  message: "Maximum 100 pages per bulk operation";
}
```

## Rate Limiting

All `/api/user/*` endpoints share a common rate limit per user:

- **Limit:** 100 requests per minute
- **Window:** Sliding window (not fixed intervals)
- **Headers:** Response includes rate limit headers:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 87
  - `X-RateLimit-Reset`: 1642344000 (Unix timestamp)

**Rate Limit Exceeded (429):**
```typescript
{
  error: "Rate limit exceeded";
  message: "Too many requests. Please try again in 45 seconds.";
  retryAfter: 45;                 // seconds
}
```

## Error Codes Summary

| Code | Error Type | Description |
|------|-----------|-------------|
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Not authenticated (no session) |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist or doesn't belong to user |
| 409 | Conflict | Resource already exists or conflict |
| 410 | Gone | Resource was deleted or archived |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Request/Response Headers

### Required Request Headers
```
Content-Type: application/json
```

### Optional Request Headers
```
Authorization: Bearer <clerk_session_token>  // If not using cookies
```

### Response Headers
```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642344000
Cache-Control: no-store                      // Don't cache API responses
```

## Validation Rules

### Common Validations
- **UUIDs:** Must be valid v4 UUIDs
- **Dates:** ISO 8601 format
- **Enums:** Must be one of specified values
- **Strings:** Max length enforced (varies by field)
- **Arrays:** Max items enforced (e.g., 100 for bulk operations)

### API Key Name
- **Type:** String
- **Required:** No
- **Min Length:** 1
- **Max Length:** 100
- **Pattern:** Alphanumeric, spaces, hyphens, underscores only
- **Example:** "Production API Key"

### Search Query
- **Type:** String
- **Required:** No
- **Min Length:** 3 (to trigger search)
- **Max Length:** 500
- **Debounce:** 300ms client-side

### Pagination
- **Page:** Integer >= 1
- **Limit:** Integer between 1-100
- **Default:** page=1, limit=50

## Zod Schemas

All endpoints use Zod for validation. Example schemas:

```typescript
// POST /api/user/keys
const createKeySchema = z.object({
  name: z.string().max(100).regex(/^[a-zA-Z0-9\s\-_]+$/).optional(),
  tier: z.enum(['free', 'pro', 'enterprise']),
});

// GET /api/user/pages
const listPagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().min(3).max(500).optional(),
  cacheLocation: z.enum(['hot', 'cold', 'none', 'all']).default('all'),
  status: z.enum(['cached', 'expired', 'failed', 'all']).default('all'),
  dateRange: z.enum(['24h', '7d', '30d', 'all']).default('all'),
  keyId: z.string().uuid().optional(),
  sortBy: z.enum(['renderedAt', 'url', 'htmlSize']).default('renderedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// POST /api/user/pages/bulk-invalidate
const bulkInvalidateSchema = z.object({
  pageIds: z.array(z.string().uuid()).min(1).max(100),
});
```

## Security Considerations

### Data Scoping
- All queries automatically scoped to `userId` from Clerk session
- No way for users to access other users' data
- Database row-level security as additional layer

### Input Sanitization
- All input validated with Zod schemas
- URL parameters sanitized to prevent injection
- HTML content already sanitized at render time

### Rate Limiting
- Per-user rate limits prevent abuse
- Stricter limits on expensive operations (key generation, bulk invalidation)
- Rate limit state stored in Redis

### Audit Logging
- All destructive operations logged (key generation, revocation, invalidation)
- Logs include userId, timestamp, action, resource ID
- Logs retained for compliance/debugging

## Testing

### Test Cases
1. **Authentication:** Unauthenticated requests return 401
2. **Authorization:** Users can only access their own resources
3. **Validation:** Invalid input returns 400 with details
4. **Rate Limiting:** Exceeding limits returns 429
5. **Pagination:** Correct page/limit handling
6. **Filtering:** All filter combinations work correctly
7. **Idempotency:** DELETE operations are idempotent
8. **Error Handling:** Graceful error responses

### Example Tests
```typescript
describe('POST /api/user/keys', () => {
  it('requires authentication', async () => {
    const response = await request(app)
      .post('/api/user/keys')
      .send({ tier: 'free' });
    expect(response.status).toBe(401);
  });

  it('enforces key limit', async () => {
    // Generate 10 keys
    for (let i = 0; i < 10; i++) {
      await createKey(user);
    }
    // 11th key should fail
    const response = await createKey(user);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Key limit reached');
  });

  it('returns full key only once', async () => {
    const response = await createKey(user);
    expect(response.body.key).toMatch(/^sk_(live|test)_/);
    
    // Subsequent GET should not return full key
    const keys = await getKeys(user);
    expect(keys[0].key).toBeUndefined();
    expect(keys[0].keyPrefix).toBeDefined();
  });
});
```

## Future Enhancements (Out of Scope for MVP)

- WebSocket support for real-time updates
- Webhooks for render completion
- Custom rate limits per user
- API key scopes/permissions
- API key expiration dates
- Scheduled reports (email summaries)
- Cost estimation/billing integration

