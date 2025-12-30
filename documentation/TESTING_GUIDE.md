# CrawlReady Testing Guide

Comprehensive testing checklist for the Clerk + Supabase integration.

## Pre-Testing Setup

### 1. Database Migration

```bash
# Apply pending migrations
pnpm run db:migrate

# Or push schema directly (development only)
pnpm run db:push
```

### 2. Environment Variables

Verify all required variables are set in `.env.local`:

```bash
# Database
DATABASE_URL=your-postgres-url

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Redis (Upstash)
REDIS_URL=redis://...
REDIS_TOKEN=your-token

# Supabase (Optional for cold storage)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### 3. Start Development Server

```bash
pnpm run dev
```

## Testing Checklist

### ✅ Phase 1: Authentication & Middleware

#### 1.1 Clerk Authentication

- [ ] Sign up with new account works
- [ ] Sign in with existing account works  
- [ ] Sign out works
- [ ] Dashboard is accessible after sign-in
- [ ] Dashboard redirects to sign-in when not authenticated

#### 1.2 Middleware Protection

- [ ] `/dashboard/*` routes require authentication
- [ ] `/api/admin/*` routes require authentication
- [ ] `/api/user/*` routes require authentication
- [ ] `/api/render` is accessible without Clerk session (API key OR Clerk)
- [ ] `/api/status/*` is accessible without Clerk session
- [ ] `/api/cache/*` is accessible without Clerk session

### ✅ Phase 2: Admin Functionality

#### 2.1 Admin Role Verification

- [ ] Set admin role in Clerk Dashboard:
  - Go to Users → Select your user
  - Public Metadata → Add: `{"role": "admin"}`
- [ ] Access `/api/admin/keys` returns 200
- [ ] Access `/api/admin/stats` returns 200
- [ ] Non-admin user gets 403 Forbidden

#### 2.2 Admin API Key Management

```bash
# Generate admin API key
curl -X POST http://localhost:3000/api/admin/keys \
  -H "Cookie: __session=<your-clerk-session>" \
  -H "Content-Type: application/json" \
  -d '{"customerEmail": "test@example.com", "tier": "free"}'
```

- [ ] Admin can generate API keys
- [ ] Generated key starts with `sk_live_` or `sk_test_`
- [ ] Key is shown only once
- [ ] Key is associated with admin's `userId` and `orgId`

#### 2.3 Admin Stats

```bash
# Get admin stats
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Cookie: __session=<your-clerk-session>"
```

- [ ] Admin can view aggregate statistics
- [ ] Stats include all users' data (not just admin's)

### ✅ Phase 3: User API Keys Management

#### 3.1 Generate User API Key

Navigate to: `http://localhost:3000/dashboard/api-keys`

- [ ] Page loads without errors
- [ ] "Generate Key" button is visible
- [ ] Click "Generate Key" creates new key
- [ ] Modal shows generated key with show/hide toggle
- [ ] Copy button works
- [ ] Key list refreshes automatically
- [ ] Maximum 10 keys enforced

#### 3.2 List API Keys

```bash
# Via API
curl -X GET http://localhost:3000/api/user/keys \
  -H "Cookie: __session=<your-clerk-session>"
```

- [ ] User sees only their own keys
- [ ] Keys show correct tier, created date, last used
- [ ] Inactive keys are marked as "REVOKED"

#### 3.3 Revoke API Key

- [ ] Click trash icon on a key
- [ ] Confirmation dialog appears
- [ ] After confirmation, key is revoked
- [ ] Key shows as "REVOKED" in list
- [ ] Revoked key cannot be used for API requests

### ✅ Phase 4: Dual Authentication

#### 4.1 API Key Authentication

```bash
# Test render endpoint with API key
curl -X POST http://localhost:3000/api/render \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

- [ ] Request with valid API key succeeds (200 or 202)
- [ ] Request without API key and without session returns 401
- [ ] Request with invalid API key returns 401
- [ ] Request with revoked key returns 401

#### 4.2 Clerk Session Authentication

```bash
# Test render endpoint with Clerk session
curl -X POST http://localhost:3000/api/render \
  -H "Cookie: __session=<your-clerk-session>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

- [ ] Request with valid Clerk session succeeds
- [ ] Session-based request works even without API key
- [ ] Rate limiting applies to Clerk users

#### 4.3 Rate Limiting

```bash
# Make multiple requests rapidly
for i in {1..110}; do
  curl -X POST http://localhost:3000/api/render \
    -H "Authorization: Bearer <your-api-key>" \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com/'$i'"}'
done
```

- [ ] Free tier (100 req/day) enforced
- [ ] After limit, returns 429 Rate Limit Exceeded
- [ ] Response includes rate limit headers
- [ ] Rate limit resets after 24 hours

### ✅ Phase 5: Usage Statistics

#### 5.1 View Usage Dashboard

Navigate to: `http://localhost:3000/dashboard/usage`

- [ ] Page loads without errors
- [ ] Stats cards show correct data:
  - Total Renders
  - Cache Hit Rate
  - Average Render Time
  - Total Requests
- [ ] Last 7 days table displays
- [ ] Bar chart visualization works
- [ ] Empty state shows when no data

#### 5.2 Usage API

```bash
curl -X GET http://localhost:3000/api/user/usage \
  -H "Cookie: __session=<your-clerk-session>"
```

- [ ] Returns user's usage statistics
- [ ] Includes daily breakdown
- [ ] Cache hit/miss stats are accurate
- [ ] User sees only their own data

### ✅ Phase 6: Rendered Pages Management

#### 6.1 View Pages Dashboard

Navigate to: `http://localhost:3000/dashboard/pages`

- [ ] Page loads without errors
- [ ] Search bar works
- [ ] Pages table displays with columns:
  - URL
  - Size
  - Accesses
  - First Rendered
  - Last Accessed
- [ ] External link icon works

#### 6.2 Invalidate Cache

- [ ] Click trash icon on a page
- [ ] Confirmation dialog shows URL
- [ ] After confirmation, page is removed
- [ ] Page list refreshes
- [ ] Next request re-renders the page

#### 6.3 Pages API

```bash
# List pages
curl -X GET http://localhost:3000/api/user/pages \
  -H "Cookie: __session=<your-clerk-session>"

# Get specific page
curl -X GET http://localhost:3000/api/user/pages/<page-id> \
  -H "Cookie: __session=<your-clerk-session>"

# Delete page
curl -X DELETE http://localhost:3000/api/user/pages/<page-id> \
  -H "Cookie: __session=<your-clerk-session>"
```

- [ ] User sees only their own pages
- [ ] Cannot access other users' pages (403)
- [ ] Can delete own pages
- [ ] Cannot delete other users' pages

### ✅ Phase 7: Cache Behavior

#### 7.1 Hot Cache (Redis)

```bash
# First request (cache miss)
curl -X POST http://localhost:3000/api/render \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Wait for job to complete, then request again
curl -X POST http://localhost:3000/api/render \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

- [ ] First request returns 202 (job queued)
- [ ] Second request returns 200 with `X-Cache: HIT`
- [ ] Response header shows `X-Cache-Location: hot`
- [ ] Response time is faster on cache hit

#### 7.2 Cache Status

```bash
curl -X GET "http://localhost:3000/api/cache/status?url=https%3A%2F%2Fexample.com" \
  -H "Authorization: Bearer <your-api-key>"
```

- [ ] Returns cache status (hot/cold/none)
- [ ] Shows last rendered timestamp
- [ ] Shows access count
- [ ] Indicates if currently rendering

### ✅ Phase 8: Error Handling

#### 8.1 Validation Errors

```bash
# Invalid URL
curl -X POST http://localhost:3000/api/render \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-url"}'
```

- [ ] Returns 400 Bad Request
- [ ] Error message is clear
- [ ] Zod validation details included

#### 8.2 SSRF Protection

```bash
# Try to access private IP
curl -X POST http://localhost:3000/api/render \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000"}'
```

- [ ] Returns 400 Bad Request
- [ ] Error indicates hostname is blocked
- [ ] Private IPs are rejected (127.0.0.1, 10.x, 192.168.x, etc.)

#### 8.3 Authorization Errors

```bash
# Access admin endpoint as regular user
curl -X GET http://localhost:3000/api/admin/keys \
  -H "Cookie: __session=<non-admin-session>"
```

- [ ] Returns 403 Forbidden
- [ ] Error message indicates admin role required

### ✅ Phase 9: Database Queries

#### 9.1 User Scoping

Execute in your database console:

```sql
-- Check API keys are scoped to users
SELECT id, user_id, org_id, key_prefix, tier, is_active
FROM api_keys
WHERE user_id IS NOT NULL;

-- Check rendered pages ownership
SELECT id, user_id, normalized_url, access_count
FROM rendered_pages
WHERE api_key_id IN (
  SELECT id FROM api_keys WHERE user_id IS NOT NULL
);
```

- [ ] All API keys have `user_id` and `org_id`
- [ ] Rendered pages are associated with user API keys
- [ ] No orphaned data

### ✅ Phase 10: UI/UX Testing

#### 10.1 Dashboard Navigation

- [ ] Navigation menu shows: Home, API Keys, Usage, Pages, Members, Settings
- [ ] All links work correctly
- [ ] Active page is highlighted
- [ ] Mobile navigation works (if responsive)

#### 10.2 Loading States

- [ ] API keys page shows loading spinner
- [ ] Usage page shows loading spinner
- [ ] Pages page shows loading spinner
- [ ] Error states display properly

#### 10.3 Empty States

- [ ] API keys: "No API keys yet" message with CTA
- [ ] Usage: "No usage data yet" message
- [ ] Pages: "No pages rendered yet" message

## Post-Testing

### Cleanup Test Data

```sql
-- Delete test API keys
DELETE FROM api_keys WHERE customer_email LIKE '%test%';

-- Delete test rendered pages
DELETE FROM rendered_pages WHERE normalized_url LIKE '%test%';

-- Delete test cache accesses
DELETE FROM cache_accesses WHERE api_key_id IN (
  SELECT id FROM api_keys WHERE customer_email LIKE '%test%'
);
```

### Check Logs

```bash
# Check for errors in logs
grep "ERROR" .next/trace
grep "[ERROR]" logs/*.log
```

## Known Issues / Future Improvements

- [ ] Worker deployment (Fly.io) not yet configured
- [ ] Cold storage (Supabase) not yet integrated
- [ ] Email notifications not implemented
- [ ] Advanced analytics/charts (consider Recharts library)
- [ ] Bulk operations (e.g., delete multiple pages)
- [ ] Export usage data (CSV/JSON)

## Success Criteria

All Phase 1-9 tests passing indicates the integration is working correctly and ready for production deployment.

---

**Testing Status**: Ready for manual testing
**Next Steps**: Follow checklist systematically, document any issues found

