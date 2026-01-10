# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CrawlReady** is an AI Crawler Optimization SaaS that makes JavaScript-heavy websites visible to AI search engines like ChatGPT, Perplexity, and Claude.

**The Problem:** Only 31% of AI crawlers (GPTBot, ClaudeBot, PerplexityBot) can render JavaScript, while 98.9% of websites use React/Vue/Angular. This means most websites are invisible to AI search engines.

**The Solution:** CrawlReady automatically detects AI bots, pre-renders JavaScript pages using Puppeteer, and serves optimized HTML in <200ms. Customers integrate via a simple API or middleware, and CrawlReady handles the rendering infrastructure.

**Target Customers:**
- JavaScript SaaS platforms (React/Vue/Angular SPAs)
- E-commerce stores with headless commerce
- Technical content publishers and documentation sites

**Value Proposition:**
- 5-minute integration (API or Next.js middleware)
- 46% cheaper than Prerender.io ($49/mo vs $90/mo)
- Sub-200ms response time for cached pages
- No infrastructure to maintain

**Unique Features:**
- AI citation tracking (monitor when ChatGPT/Perplexity cite your content)
- Real-time AI crawler analytics (GPTBot, ClaudeBot, PerplexityBot)
- LLM-optimized schema injection for answer engines
- Two-tier caching (hot Redis + cold Supabase storage)

**Supported AI Crawlers:**
- GPTBot / ChatGPT-User (OpenAI)
- OAI-SearchBot (ChatGPT Search)
- ClaudeBot / Claude-Web (Anthropic)
- PerplexityBot (Perplexity)
- Google-Extended (Gemini)
- Plus ~10 other AI/ML crawlers

**Product Status:** MVP in development (Target: Q1 2026). Core rendering engine functional. Citation tracking and schema injection features planned for Phase 2.

**Architecture:** Built as a **pnpm monorepo** with Turborepo orchestration, featuring a Next.js web application (API + dashboard) and a Puppeteer-based render worker that processes pages asynchronously via BullMQ.

**Key Technologies:**
- Next.js 14 (App Router) with TypeScript
- Clerk for authentication (multi-tenancy, RBAC)
- Drizzle ORM with PostgreSQL (Supabase) / PGlite (local dev)
- BullMQ + Upstash Redis for job queuing
- Puppeteer for headless rendering
- Tailwind CSS + Shadcn UI
- Vitest + Playwright for testing

## Monorepo Structure

```
crawlready-web/
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router (routes, API)
│   │   │   ├── components/           # Reusable UI components
│   │   │   ├── features/             # Feature-specific components
│   │   │   ├── libs/                 # App-specific utilities
│   │   │   ├── templates/            # Page templates
│   │   │   └── utils/                # Helper functions
│   │   ├── migrations/               # Database migrations
│   │   ├── tests/                    # E2E and integration tests
│   │   └── public/                   # Static assets
│   └── workers/
│       └── render-worker/            # Puppeteer rendering service
│           ├── index.ts              # BullMQ worker entrypoint
│           ├── renderer.ts           # Puppeteer page rendering
│           ├── html-optimizer.ts     # HTML optimization
│           └── Dockerfile            # Multi-stage Docker build
├── packages/                         # Shared workspace packages
│   ├── types/                        # @crawlready/types - TypeScript types
│   ├── logger/                       # @crawlready/logger - Pino logging
│   ├── database/                     # @crawlready/database - Drizzle ORM + queries
│   ├── cache/                        # @crawlready/cache - Redis + URL utils
│   ├── queue/                        # @crawlready/queue - BullMQ configuration
│   ├── storage/                      # @crawlready/storage - Supabase storage
│   └── security/                     # @crawlready/security - SSRF protection
└── documentation/                    # Architecture and specs
```

### Workspace Packages

All shared packages use TypeScript path aliases (`@crawlready/*`) defined in `tsconfig.base.json`:

- **@crawlready/types** - Shared TypeScript types (database, API, render jobs)
- **@crawlready/logger** - Centralized Pino logger with `createLogger()` helper
- **@crawlready/database** - Drizzle ORM schema + domain-specific queries (API keys, render jobs, rendered pages, cache accesses) + connection utilities
- **@crawlready/cache** - Upstash Redis client, cache operations, URL normalization (`normalizeUrl`, `getCacheKey`)
- **@crawlready/queue** - BullMQ render queue singleton with Redis connection config
- **@crawlready/storage** - Supabase cold storage (upload/download rendered pages)
- **@crawlready/security** - SSRF protection (`validateUrlSecurity`), rate limiting helpers

**Important:** Packages are tested in isolation with comprehensive integration tests (~750+ lines across database, cache, and security packages).

## Common Development Commands

### Development
```bash
pnpm dev                    # Run all apps in parallel
pnpm dev:web                # Run web app only (localhost:3000)
pnpm dev:render-worker      # Run render worker only

# Individual package development
pnpm --filter @crawlready/web dev
pnpm --filter @crawlready/render-worker dev
```

### Building
```bash
pnpm build                  # Build everything (Turbo orchestration)
pnpm build:web              # Build web app only
pnpm build:render-worker    # Build render worker only

pnpm check-types            # Type-check all packages (Turbo)
pnpm lint                   # Lint all packages (Turbo)
pnpm lint:fix               # Fix linting issues
```

### Testing
```bash
pnpm test                   # Run all tests (unit + integration)
pnpm test:web               # Run web app tests (Vitest)
pnpm test:packages          # Test workspace packages only
pnpm test:e2e               # Run Playwright E2E tests

# Single test file
pnpm --filter @crawlready/web test -- path/to/test.test.ts
```

### Database
```bash
pnpm db:generate            # Generate Drizzle migrations from schema changes
pnpm db:push                # Push schema to database (development)
pnpm db:migrate             # Run migrations (production)
pnpm db:studio              # Open Drizzle Studio (localhost:5555)
```

### Other
```bash
pnpm commit                 # Interactive commit with Commitizen
pnpm clean                  # Clean build artifacts and caches
pnpm storybook              # Run Storybook UI development
```

## Architecture Highlights

### Database Layer

**Web App (`apps/web/src/libs/DB.ts`):**
- Uses **PGlite** (in-memory Postgres) for local development when `DATABASE_URL` is not set
- Uses **PostgreSQL** (connection pooled) for Vercel/production
- **Important:** Validates Supabase connection string format for Vercel - must use connection pooler (`pooler.xxx.supabase.co:6543`) not direct connection (`db.xxx.supabase.co:5432`)
- Auto-migration controlled by `AUTO_MIGRATE` env var (default: true for dev, false for production)

**Render Worker:**
- Uses clean PostgreSQL connection from `@crawlready/database`
- No PGlite or Next.js dependencies

**Schema Location:** `packages/database/src/schema/` (Drizzle ORM)
**Migrations:** `apps/web/migrations/` (generated by `pnpm db:generate`)

### API Routes (`apps/web/src/app/api/`)

All API routes use `force-dynamic` export for authentication via request headers.

**Core Render API:**
- **POST /api/render** - Main endpoint: queues render jobs (202) or returns cached HTML (200)
- **GET /api/status/:jobId** - Poll render job status (queued, processing, completed, failed)
- **GET /api/cache/status** - Check if URL is cached (hot/cold/none)
- **DELETE /api/cache** - Invalidate cached pages (purge hot + cold storage)

**Admin & User Management:**
- **POST /api/admin/generate-key** - Generate API keys for customers (returns `sk_live_*` or `sk_free_*`)
- **GET /api/user/*** - User profile and subscription management

**Utilities:**
- **GET /api/check-crawler** - Detect if request is from an AI bot (GPTBot, ClaudeBot, etc.)
- **GET /api/check-schema** - Validate schema.org markup on pages
- **POST /api/waitlist** - Early access waitlist signup

**Authentication:**
- Dual authentication: API key (Bearer token) OR Clerk session
- Helper: `apps/web/src/libs/dual-auth.ts`
- API keys stored hashed (SHA-256) in database
- Rate limiting via Redis sliding window (100/day free, 1000/day pro)

### Render Worker Flow

**Purpose:** Pre-render JavaScript pages for AI bots that can't execute JavaScript (GPTBot, ClaudeBot, PerplexityBot).

**Flow:**
1. Customer makes POST /api/render request with URL
2. API checks cache (Redis hot → Supabase cold)
   - **Cache HIT:** Return HTML immediately (200)
   - **Cache MISS:** Queue job and return 202 with jobId
3. Worker picks up job from BullMQ queue
4. **SSRF protection** validates URL (no localhost, private IPs, cloud metadata endpoints)
5. **Puppeteer rendering:**
   - Launch headless Chrome
   - Navigate to URL with configurable timeout (default 30s)
   - Wait for optional selector (`waitForSelector`)
   - Execute all JavaScript
   - Capture final HTML
6. **HTML optimization:**
   - Remove script tags (AI bots don't execute JS)
   - Remove tracking pixels and analytics
   - Minify HTML
   - Inject schema.org markup (future)
7. **Store in dual-tier cache:**
   - **Hot cache** (Redis) - 1000 most recent, <50ms access, LRU eviction
   - **Cold storage** (Supabase) - unlimited, <300ms access, permanent
8. **Update database:**
   - `rendered_pages` table with metadata (size, render time, access count)
   - `cache_accesses` table for analytics
9. Job marked complete, customer polls `/api/status/:jobId` to check

**Cache Promotion:** When cold storage is accessed, page is asynchronously promoted to hot cache for faster future access.

### URL Normalization & Caching

**Purpose:** Ensure consistent cache keys across URL variations (tracking params, trailing slashes, etc.)

**Normalization Rules** (`@crawlready/cache`):
1. Protocol normalized to `https://` (most sites redirect http → https)
2. Hostname lowercased (DNS is case-insensitive)
3. Trailing slashes removed from pathname (`/page/` → `/page`)
4. Tracking parameters stripped (utm_*, fbclid, gclid, _ga, etc.)
5. Query parameters sorted alphabetically (`?b=2&a=1` → `?a=1&b=2`)
6. URL fragments removed (`#section`)

**Cache Key Format:** `render:v1:{normalizedUrl}`

**Examples:**
- `http://Example.com/Page?utm_source=google` → `https://example.com/Page`
- `https://site.com/page/?fbclid=abc&id=5` → `https://site.com/page?id=5`

**Two-Tier Storage:**
- **Hot Cache (Redis):** 1000 most recent pages, LRU eviction, <50ms access
- **Cold Storage (Supabase):** All rendered pages, permanent, <300ms access
- **Promotion:** Cold → hot on access (async, doesn't block response)

### Rate Limiting

- Implemented via Upstash Redis sliding window (24-hour window)
- Tiers: free (100/day), pro (1000/day), enterprise (10000/day)
- Helper: `apps/web/src/libs/rate-limit-helper.ts`
- Returns 429 with `Retry-After` header when limit exceeded

### Error Handling

- **Sentry** for production error monitoring
- **Spotlight** for local development debugging
- **Pino** structured logging across all services

## Configuration Files

- **pnpm-workspace.yaml** - Workspace package definitions
- **turbo.json** - Turborepo task orchestration (build dependencies, caching)
- **tsconfig.base.json** - Shared TypeScript config with path mappings
- **apps/web/tsconfig.json** - Web app extends base config
- **apps/web/next.config.mjs** - Next.js configuration (Sentry, PostHog rewrites)
- **apps/web/vercel.json** - Vercel build configuration for monorepo
- **apps/workers/render-worker/fly.toml** - Fly.io deployment config

## Deployment

### Vercel (Web App)

**Critical:** Root Directory must be `/` (repository root) not `apps/web`
- Build command: Defined in `apps/web/vercel.json` (`pnpm build`)
- Framework: Next.js (auto-detected)
- Environment variables: Set in Vercel dashboard (see `VERCEL_SETUP.md`)
- **Database:** Must use Supabase connection pooler URL for serverless

### Fly.io (Render Worker)

- Docker multi-stage build optimized for monorepo
- Uses `tsx` for TypeScript execution (no compilation needed)
- Chromium installed for Puppeteer
- Scale via `fly scale count <n>`
- See `apps/workers/render-worker/DEPLOYMENT.md`

## Environment Variables

### Required (Web App)
- `DATABASE_URL` - PostgreSQL connection string (use connection pooler for Vercel)
- `CLERK_SECRET_KEY` - Clerk authentication
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Redis (REST API for Next.js)

### Required (Render Worker)
- `DATABASE_URL` - PostgreSQL connection string
- `UPSTASH_REDIS_HOST` / `UPSTASH_REDIS_PORT` / `UPSTASH_REDIS_PASSWORD` - Redis (standard connection)
- `UPSTASH_REDIS_TLS=true`

### Optional
- `SUPABASE_URL` / `SUPABASE_KEY` - Cold storage
- `AUTO_MIGRATE` - Auto-run migrations on startup (default: true, set false in production)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payments (not fully implemented)
- `LOGTAIL_SOURCE_TOKEN` - Better Stack logging

See `documentation/` for complete environment variable reference.

## Code Guidelines

### Imports

- Use workspace package imports: `import { logger } from '@crawlready/logger';`
- Use app-relative imports: `import { db } from '@/libs/DB';` (web app only)
- Path aliases are resolved via `tsconfig.base.json` and Next.js webpack config

### Database Queries

- Use domain-specific query modules from `@crawlready/database`:
  - `apiKeyQueries` - API key operations
  - `renderJobQueries` - Render job management
  - `renderedPageQueries` - Rendered page metadata
  - `cacheAccessQueries` - Cache access logging

Example:
```typescript
import { createConnection, renderJobQueries } from '@crawlready/database';

const db = await createConnection(process.env.DATABASE_URL);
await renderJobQueries.create(db, { url, apiKeyId });
```

### API Route Pattern

All API routes should:
1. Export `dynamic = 'force-dynamic'` for header-based authentication
2. Use `withErrorHandler()` wrapper for consistent error handling
3. Authenticate via `authenticateRequest()` helper
4. Check rate limits with `checkRateLimit()`
5. Return responses via helpers: `success()`, `badRequest()`, `unauthorized()`, `rateLimitExceeded()`

### Testing

- **Unit tests:** Co-located with source files (`*.test.ts`)
- **Integration tests:** In `packages/*/src/__tests__/` (use PGlite for database tests)
- **E2E tests:** In `apps/web/tests/e2e/` (Playwright)
- Run `pnpm test` before committing

## Migration Context

This project was recently migrated from a single-app structure to a monorepo (January 2026). Key outcomes:
- **Zero code duplication** (eliminated ~1,500 lines)
- **44% reduction** in worker dependencies
- **750+ lines** of integration tests added
- All imports updated to use `@crawlready/*` packages

See `ARCHITECTURE_UPDATE.md` and `MONOREPO_DOCS.md` for detailed migration history.

## Documentation

- **Quick Start:** `README_MONOREPO.md`
- **Architecture:** `ARCHITECTURE_UPDATE.md`
- **Deployment:** `DEPLOYMENT.md`
- **Vercel Setup:** `VERCEL_SETUP.md`
- **Full Specs:** `documentation/specs/`
- **Technical Architecture:** `documentation/technical-architecture.md`

## Key Decisions & Constraints

### Architecture Decisions

1. **Two-tier caching strategy:** Hot (Redis, 1000 pages) + Cold (Supabase, unlimited) for cost optimization. Customers never wait for re-renders.

2. **URL normalization:** Aggressive normalization (strip tracking params, normalize protocol/slashes) reduces cache entries and costs. Same HTML served to all AI bots (no per-bot customization in MVP).

3. **Async rendering (202 pattern):** First request returns job ID (202), subsequent requests hit cache (200). Prevents timeout issues and provides better UX for long renders.

4. **SSRF protection required:** All customer-provided URLs validated against blocklist (localhost, private IPs, cloud metadata endpoints) before rendering.

5. **Dual authentication:** API routes support both API keys (for programmatic access) and Clerk sessions (for dashboard users). API keys stored hashed (SHA-256) only.

6. **LRU eviction for hot cache:** Redis limited to 1000 entries with LRU eviction. Cold storage is unlimited. Most accessed pages stay hot.

### Technical Constraints

7. **PGlite for local dev:** Web app uses in-memory Postgres when `DATABASE_URL` not set. Simplifies onboarding but requires migration on first DB connection.

8. **Connection pooler required for Vercel:** Must use Supabase connection pooler (`pooler.xxx.supabase.co:6543`) not direct connection for serverless functions. Direct connections will fail.

9. **tsx for worker:** Render worker uses `tsx` runtime (no build step). Simplifies deployment but means TypeScript compiled at runtime.

10. **Auto-migration:** Controlled by `AUTO_MIGRATE` env var (default true for dev, false for production). Production migrations run via `pnpm db:migrate` before deployment.

11. **Rate limiting:** Redis-based sliding window per API key/user. 24-hour window, resets at UTC midnight.

12. **Schema.org injection (future):** Planned feature to auto-inject AI-friendly structured data (FAQ, HowTo, Article schemas) during rendering.

### Business Rules

13. **Same HTML for all bots:** MVP serves identical HTML to GPTBot, ClaudeBot, PerplexityBot, etc. Future: opt-in per-bot customization for enterprise customers.

14. **Free tier limits:** 100 renders/day, 24hr cache TTL. Designed for viral growth (1K free users → 100 paying conversions).
