# Architecture: Analytics Onboarding with Clerk

Design specification for CrawlReady's site registration and AI Crawler Analytics onboarding flow. Uses Clerk for authentication. Open to any site — not limited to pre-seeded domains. Compiled April 2026.

---

## Auth Model Overview

CrawlReady uses a split auth model:

| Surface | Auth Method | Why |
|---|---|---|
| Diagnostic scan | None (rate-limited by IP) | Zero-friction entry point |
| Public score page | None | Shareable, viral |
| Email-gated features (PDF, alerts) | Lightweight email capture | Lead gen, no account needed |
| Site registration + analytics | **Clerk** (sign-up/sign-in) | Real users managing real sites |
| Future dashboard | **Clerk** | Same session |

**Supabase is database-only.** No Supabase Auth. Clerk handles all user identity.

---

## Clerk Integration

### Features Used (Phase 0)

- **Sign-up:** Email/password + Google OAuth + GitHub OAuth
- **Sign-in:** Same providers
- **Session management:** Clerk's JWT-based sessions
- **User metadata:** Store Clerk `userId` as the foreign key in Supabase tables

### Features NOT Used (Phase 0)

- Organizations / multi-tenancy (Phase 1+ if team seats are needed)
- Webhooks (Phase 1 — useful for syncing Clerk user data to Supabase)
- Custom claims / roles
- MFA

### Clerk Components in Next.js

Use Clerk's Next.js SDK (`@clerk/nextjs`):

- `<SignIn />` and `<SignUp />` components at `/sign-in` and `/sign-up`
- `clerkMiddleware()` in Next.js middleware to protect `/dashboard/*` routes
- `auth()` helper in API routes to get the current user's `userId`
- `currentUser()` for server components that need user data

### Clerk + Supabase Connection

Clerk users are linked to Supabase data via `clerk_user_id`:

```
Clerk (identity)          Supabase (data)
┌──────────┐              ┌──────────┐
│  User     │──clerk_id──▶│  sites    │
│  - email  │              │  - domain │
│  - name   │              │  - key    │
│  - avatar │              └──────────┘
└──────────┘                    │
                                ▼
                          ┌──────────────┐
                          │ crawler_visits │
                          └──────────────┘
```

No user data is duplicated in Supabase. The `sites` table stores `clerk_user_id` as a text foreign key. User profile data (name, email, avatar) is always read from Clerk at render time.

---

## Onboarding Flow

### Step 1: User Arrives

User reaches CrawlReady via one of:
- Show HN → landing page → runs diagnostic → sees "Track your AI crawler visits" CTA
- Direct link to `/dashboard/sites`

### Step 2: Sign Up (Clerk)

- User clicks "Sign up" → Clerk sign-up component
- Options: email/password, Google, GitHub
- After sign-up, Clerk redirects to `/dashboard/sites`

### Step 3: Register a Site

```
┌─────────────────────────────────────────────┐
│  Register a New Site                         │
│                                              │
│  Domain: [example.com          ]             │
│                                              │
│  [Register Site →]                           │
└─────────────────────────────────────────────┘
```

- User enters a domain (validated: must be a valid domain, no scheme/path)
- System creates a `sites` row with a generated `site_key`
- System normalizes the domain (lowercase, strip www)

### Step 4: Get Snippet

After registration, the user sees their site key and a framework-specific snippet:

```
┌─────────────────────────────────────────────┐
│  ✓ example.com registered                    │
│                                              │
│  Site Key: cr_live_a1b2c3d4e5f6              │
│                                              │
│  Add this to your middleware:                │
│                                              │
│  [Next.js] [Express] [Cloudflare] [Generic] │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │ // middleware.ts                         │ │
│  │ const AI_BOTS = /GPTBot|ClaudeBot|.../; │ │
│  │ ...                                     │ │
│  │ { s: 'cr_live_a1b2c3d4e5f6', ... }     │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  [Copy to clipboard]                         │
│                                              │
│  Once installed, AI crawler visits will      │
│  appear in your dashboard (coming soon).     │
└─────────────────────────────────────────────┘
```

The snippet templates are the same as defined in `docs/architecture/crawler-analytics.md`, with the ingest URL corrected to `https://crawlready.app/api/v1/ingest`.

---

## Site Key Format

Site keys use a prefixed format for easy identification:

- **Format:** `cr_live_{12 random alphanumeric chars}`
- **Example:** `cr_live_a1b2c3d4e5f6`
- **Generation:** `crypto.randomUUID()` truncated, or `nanoid(12)` with prefix
- **Uniqueness:** Enforced at database level (UNIQUE constraint)

The `cr_live_` prefix:
- Makes keys visually identifiable in code
- Allows future `cr_test_` keys for development mode
- Prevents accidental use of other IDs as site keys

---

## Data Model Changes

### Updated `sites` Table

```sql
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  site_key TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(clerk_user_id, domain)
);

CREATE INDEX idx_sites_clerk_user ON sites(clerk_user_id);
CREATE INDEX idx_sites_domain ON sites(domain);
CREATE INDEX idx_sites_key ON sites(site_key);
```

Changes from the original `api-first.md` schema:
- `id` is now UUID (not TEXT)
- `owner_email` removed — user data lives in Clerk
- `clerk_user_id` added — links to Clerk identity
- `UNIQUE(clerk_user_id, domain)` — one user cannot register the same domain twice
- `updated_at` added for future use

### `crawler_visits` Table (Unchanged)

```sql
CREATE TABLE crawler_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES sites(id),
  path TEXT NOT NULL,
  bot TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawler_visits_site_bot ON crawler_visits(site_id, bot, visited_at);
CREATE INDEX idx_crawler_visits_site_path ON crawler_visits(site_id, path, visited_at);
```

---

## Pages and Routes (Phase 0)

### Public Routes (No Auth)

| Route | Purpose |
|---|---|
| `/` | Landing page with URL input |
| `/scan` | Diagnostic result page |
| `/score/{domain}` | Public score page (SSR for SEO) |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

### Protected Routes (Clerk Auth Required)

| Route | Purpose |
|---|---|
| `/dashboard/sites` | List user's registered sites |
| `/dashboard/sites/new` | Register a new site |

### Phase 1 Protected Routes (Not Built in Phase 0)

| Route | Purpose |
|---|---|
| `/dashboard/analytics/{domain}` | Per-site analytics dashboard |
| `/dashboard/settings` | Account settings |

---

## API Endpoints

### Site Management (Clerk Auth Required)

#### `POST /api/v1/sites`

Create a new site registration.

**Auth:** Clerk JWT (via `auth()` helper)

**Request:**
```json
{
  "domain": "example.com"
}
```

**Response (201):**
```json
{
  "id": "uuid-here",
  "domain": "example.com",
  "site_key": "cr_live_a1b2c3d4e5f6",
  "created_at": "2026-04-07T10:00:00Z",
  "snippet": {
    "nextjs": "// middleware.ts\n...",
    "express": "// app.js\n...",
    "cloudflare": "// worker.js\n...",
    "generic": "// any JS runtime\n..."
  }
}
```

**Validation:**
- Domain must be a valid hostname (no scheme, no path, no query)
- Domain is normalized (lowercase, strip www prefix)
- User cannot register the same domain twice
- Limit: 10 sites per user (Phase 0)

#### `GET /api/v1/sites`

List the current user's registered sites.

**Auth:** Clerk JWT

**Response (200):**
```json
{
  "sites": [
    {
      "id": "uuid-here",
      "domain": "example.com",
      "site_key": "cr_live_a1b2c3d4e5f6",
      "created_at": "2026-04-07T10:00:00Z",
      "visit_count_30d": 1247
    }
  ]
}
```

#### `DELETE /api/v1/sites/{id}`

Remove a site registration. Also deletes associated `crawler_visits`.

**Auth:** Clerk JWT. User must own the site.

**Response:** `204 No Content`

### Ingest (Site Key Auth — No Clerk)

#### `POST /api/v1/ingest`

Unchanged from `docs/architecture/crawler-analytics.md`. Uses `site_key` in the request body (`s` field), not Clerk auth. This endpoint is called from customer middleware running on their servers.

**Request:**
```json
{
  "s": "cr_live_a1b2c3d4e5f6",
  "p": "/pricing",
  "b": "GPTBot",
  "t": 1712419200000
}
```

**Response:** `204 No Content`

**Validation:**
- `s` must match a registered `site_key`
- `b` must be in the known bot list
- `t` must be within 5 minutes of server time
- Rate limit: 100 req/s per site key

---

## Snippet Templates

All snippets use the canonical ingest URL: `https://crawlready.app/api/v1/ingest`

### Next.js Middleware

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
      body: JSON.stringify({ s: 'YOUR_SITE_KEY', p: request.nextUrl.pathname, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  return NextResponse.next();
}
```

### Express / Hono

```typescript
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: 'YOUR_SITE_KEY', p: req.path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  next();
});
```

### Cloudflare Workers

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

### Generic (Any JS Runtime)

```typescript
const AI_BOTS = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

function reportAiCrawler(userAgent, path) {
  if (AI_BOTS.test(userAgent)) {
    const bot = userAgent.match(AI_BOTS)?.[0] || 'unknown';
    fetch('https://crawlready.app/api/v1/ingest', {
      method: 'POST',
      body: JSON.stringify({ s: 'YOUR_SITE_KEY', p: path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
}
```

---

## Security Considerations

### Site Key Trust Model

The `site_key` is embedded in customer middleware code running on their servers. It is **semi-public** — not secret like an API key, but not advertised either. This is acceptable because:

- The ingest endpoint only accepts crawler visit data (path, bot name, timestamp)
- Spoofing a site key produces junk data in that site's analytics — it does not expose or modify any other data
- Phase 1 can add domain validation (reject ingest from mismatched origins) if abuse appears
- Rate limiting (100 req/s per key) bounds the damage from any single key

### Clerk Security

- Clerk handles password hashing, session tokens, OAuth flows
- API routes verify Clerk JWTs server-side via `auth()` — no client-side trust
- Protected routes use `clerkMiddleware()` for automatic redirect to sign-in

---

## Decisions

- **Auth provider:** Clerk (not Supabase Auth). Supabase is database-only.
- **Clerk features used:** Sign-up, sign-in, session management, `userId` as foreign key. No organizations, roles, or MFA in Phase 0.
- **Site key format:** `cr_live_` prefix + 12 random alphanumeric characters.
- **Sites per user:** 10 maximum in Phase 0. Increase in paid tiers.
- **Domain uniqueness:** One user cannot register the same domain twice. Different users CAN register the same domain (this enables agencies and multi-team setups in the future).
- **Ingest URL:** `https://crawlready.app/api/v1/ingest` (canonical — no subdomain).
- **No dashboard in Phase 0:** Site management only. The analytics dashboard (charts, per-crawler views, alerts) ships in Phase 1 using data accumulated during Phase 0.
- **No site key rotation in Phase 0:** If a key is compromised, user deletes the site and re-registers. Rotation UI is Phase 1.
