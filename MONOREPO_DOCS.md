# CrawlReady Monorepo Documentation

**Quick Reference Guide**

## Essential Documentation (3 Files)

### 1. [`README_MONOREPO.md`](README_MONOREPO.md) - START HERE
**Purpose:** Developer quick start guide  
**Use this for:**
- Getting started with the monorepo
- Understanding package structure
- Running dev, build, and test commands
- Adding new packages or apps
- Troubleshooting

### 2. [`ARCHITECTURE_UPDATE.md`](ARCHITECTURE_UPDATE.md)
**Purpose:** Architecture overview and rationale  
**Use this for:**
- Understanding the monorepo structure
- Package details and responsibilities
- Configuration files and their purposes
- Migration benefits and impact
- Docker optimization details

### 3. [`MONOREPO_IMPLEMENTATION_COMPLETE.md`](MONOREPO_IMPLEMENTATION_COMPLETE.md)
**Purpose:** Comprehensive implementation summary  
**Use this for:**
- Complete migration history
- What was accomplished in each phase
- Final structure and metrics
- Verification status
- Testing approach and coverage

## What Was Migrated

✅ **Foundation** - pnpm workspaces + Turborepo  
✅ **7 Packages** - types, logger, database, cache, queue, storage, security  
✅ **Web App** - Moved to `apps/web/` with all imports updated  
✅ **Render Worker** - Moved to `apps/workers/render-worker/`  
✅ **Tests** - 750+ lines of integration tests for 3 packages  
✅ **Documentation** - Consolidated into 3 essential files

## Key Metrics

- **Code Duplication:** 0% (eliminated ~1,500 lines)
- **Packages:** 7 shared packages
- **Tests:** 750+ lines of integration tests
- **Worker Dependencies:** Reduced by 44%
- **Type-check:** ✅ Passing
- **Build:** ✅ Working

## Structure Overview

```
crawlready-web/
├── apps/
│   ├── web/                    # Next.js web application
│   └── workers/
│       └── render-worker/      # Puppeteer rendering service
├── packages/
│   ├── types/                  # TypeScript types
│   ├── logger/                 # Pino logging
│   ├── database/               # Drizzle ORM + queries (+ tests)
│   ├── cache/                  # Redis + URL utils (+ tests)
│   ├── queue/                  # BullMQ configuration
│   ├── storage/                # Supabase storage
│   └── security/               # SSRF protection (+ tests)
├── README_MONOREPO.md          # ← Quick start guide
├── ARCHITECTURE_UPDATE.md      # ← Architecture details
└── MONOREPO_IMPLEMENTATION_COMPLETE.md  # ← Full summary
```

## Common Commands

```bash
# Development
pnpm dev:web              # Run web app
pnpm dev:render-worker    # Run worker
pnpm dev                  # Run all in parallel

# Building
pnpm build                # Build everything
pnpm check-types          # Type-check all
pnpm lint                 # Lint all

# Testing
pnpm test                 # Run all tests
pnpm test:packages        # Test packages only
pnpm test:web             # Test web app
```

## Deployment

### Vercel (Web App)
See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for monorepo-specific Vercel configuration.

**Quick setup:**
1. Set Root Directory to `apps/web` in Vercel Dashboard
2. Add environment variables (DATABASE_URL, Redis, Clerk, etc.)
3. Deploy - the `vercel.json` handles monorepo build automatically

### Fly.io (Render Worker)
See [DEPLOYMENT.md](DEPLOYMENT.md) for worker deployment.

## Quick Links

- **Quick Start:** [README_MONOREPO.md](README_MONOREPO.md)
- **Architecture:** [ARCHITECTURE_UPDATE.md](ARCHITECTURE_UPDATE.md)
- **Full Summary:** [MONOREPO_IMPLEMENTATION_COMPLETE.md](MONOREPO_IMPLEMENTATION_COMPLETE.md)
- **Vercel Deployment:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Full Deployment Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Original Plan:** [documentation/architecture/monorepo-refactor-plan.md](documentation/architecture/monorepo-refactor-plan.md)

---

**Note:** Previous migration documentation (8 files) has been consolidated into these 3 essential documents for long-term maintenance.

**Last Updated:** January 2, 2026

