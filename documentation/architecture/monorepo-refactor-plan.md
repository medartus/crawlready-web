# Monorepo Refactoring Plan

## Executive Summary

This document outlines a comprehensive plan to refactor the CrawlReady codebase from a monolithic Next.js application with a separate worker into a well-structured monorepo with shared packages. This refactoring will improve code organization, reduce duplication, simplify dependencies, and make the codebase more maintainable and scalable.

## Current Architecture Issues

### 1. **Tight Coupling Between Worker and Web App**
- Worker imports directly from `../../src/libs/*`
- Creates unnecessary dependencies (e.g., PGlite, Next.js internals)
- Changes to web app can break worker
- Complex Docker builds requiring entire `src/` directory

### 2. **Code Duplication**
- Database connection logic duplicated
- Redis client configuration duplicated
- Shared utilities scattered across codebase

### 3. **Dependency Management**
- Worker needs to install packages it doesn't use
- Unclear which dependencies are for what purpose
- Larger Docker images than necessary

### 4. **Testing Challenges**
- Hard to test shared code in isolation
- Integration tests require full app setup
- Mocking is complicated due to tight coupling

## Proposed Architecture

### Directory Structure

```
crawlready-web/                    # Root monorepo
├── package.json                   # Root workspace config
├── pnpm-workspace.yaml            # Workspace definition
├── tsconfig.base.json             # Shared TypeScript config
├── .eslintrc.js                   # Shared linting rules
│
├── packages/                      # Shared packages
│   │
│   ├── database/                  # @crawlready/database
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts           # Main exports
│   │   │   ├── connection.ts      # Database connection
│   │   │   ├── schema/            # Drizzle schema
│   │   │   │   └── index.ts
│   │   │   └── queries/           # Database queries
│   │   │       ├── index.ts
│   │   │       ├── render-jobs.ts
│   │   │       ├── rendered-pages.ts
│   │   │       ├── api-keys.ts
│   │   │       └── users.ts
│   │   └── migrations/            # Database migrations
│   │
│   ├── cache/                     # @crawlready/cache
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── redis-client.ts    # Redis connection
│   │       └── cache-utils.ts     # Cache key generation, etc.
│   │
│   ├── queue/                     # @crawlready/queue
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── render-queue.ts    # BullMQ queue definition
│   │       └── types.ts           # Job data types
│   │
│   ├── storage/                   # @crawlready/storage
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── supabase-storage.ts
│   │
│   ├── security/                  # @crawlready/security
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── ssrf-protection.ts
│   │       └── rate-limiting.ts
│   │
│   ├── logger/                    # @crawlready/logger
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── logger.ts
│   │
│   └── types/                     # @crawlready/types
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── render-job.ts
│           ├── api.ts
│           └── common.ts
│
├── apps/                          # Applications
│   │
│   ├── web/                       # Next.js web application
│   │   ├── package.json           # Depends on shared packages
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── src/
│   │       ├── app/               # Next.js App Router
│   │       ├── components/
│   │       ├── libs/              # Web-specific utilities
│   │       └── middleware.ts
│   │
│   └── worker/                    # Render worker
│       ├── package.json           # Depends on shared packages
│       ├── tsconfig.json
│       ├── Dockerfile
│       ├── fly.toml
│       └── src/
│           ├── index.ts           # Worker entry point
│           ├── renderer.ts        # Puppeteer logic
│           └── html-optimizer.ts
│
└── tooling/                       # Development tools
    ├── eslint-config/
    └── tsconfig/
```

## Benefits

### 1. **Clear Separation of Concerns**
- Each package has a single, well-defined purpose
- Easy to understand what code belongs where
- Reduces cognitive load when working on specific features

### 2. **Reduced Duplication**
- Shared code lives in one place
- Changes propagate automatically to all consumers
- Single source of truth for business logic

### 3. **Independent Versioning**
- Packages can be versioned independently
- Breaking changes are explicit and controllable
- Better change management

### 4. **Optimized Dependencies**
- Worker only installs what it needs
- Smaller Docker images (faster deploys)
- Clearer dependency tree

### 5. **Better Testing**
- Packages can be tested in isolation
- Unit tests are simpler and faster
- Integration tests are more focused

### 6. **Improved Developer Experience**
- TypeScript imports are cleaner (`@crawlready/database` vs `../../src/libs/DB`)
- IDE autocomplete works better
- Easier onboarding for new developers

### 7. **Scalability**
- Easy to add new apps (e.g., admin dashboard, mobile API)
- Shared packages can be extracted to separate repos if needed
- Foundation for microservices architecture

## Migration Strategy

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Initialize Monorepo
```bash
# Create workspace configuration
echo "packages:
  - 'packages/*'
  - 'apps/*'" > pnpm-workspace.yaml

# Update root package.json
{
  "name": "crawlready-monorepo",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

#### 1.2 Create Base Configurations
- `tsconfig.base.json` - Shared TypeScript config
- `.eslintrc.js` - Shared linting rules
- `jest.config.js` - Shared test configuration

#### 1.3 Set Up Build Tooling
- Configure Turborepo or Nx for build orchestration
- Set up dependency graph visualization
- Configure CI/CD for monorepo

### Phase 2: Extract Shared Packages (Week 2-3)

#### Priority Order (based on dependencies):
1. **@crawlready/types** - No dependencies, used by everything
2. **@crawlready/logger** - Minimal dependencies
3. **@crawlready/database** - Core functionality
4. **@crawlready/cache** - Used by web and worker
5. **@crawlready/queue** - Used by web and worker
6. **@crawlready/storage** - Used by web and worker
7. **@crawlready/security** - Used by web

#### 2.1 Extract @crawlready/types
```bash
# Create package structure
mkdir -p packages/types/src
cd packages/types

# Initialize package
npm init -y

# Update package.json
{
  "name": "@crawlready/types",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}

# Move and consolidate types
# - src/models/Schema.ts types
# - API request/response types
# - Job data types
```

#### 2.2 Extract @crawlready/database
```bash
mkdir -p packages/database/src/{schema,queries}
cd packages/database

# Move database code
# - src/models/Schema.ts -> src/schema/index.ts
# - src/libs/db-queries.ts -> src/queries/
# - migrations/ -> migrations/

# Create connection factory
# src/connection.ts - single, clean DB connection
# - No PGlite (move that to web app only)
# - No Next.js-specific logic
# - Environment-based configuration
```

#### 2.3 Extract Other Packages
Follow similar pattern for cache, queue, storage, security, logger

### Phase 3: Migrate Applications (Week 4)

#### 3.1 Migrate Worker
```bash
# Move worker to apps/worker
mv workers/render-worker apps/worker

# Update imports
# Before: import { db } from '../../src/libs/DB'
# After:  import { db } from '@crawlready/database'

# Update package.json dependencies
{
  "dependencies": {
    "@crawlready/database": "workspace:*",
    "@crawlready/cache": "workspace:*",
    "@crawlready/queue": "workspace:*",
    "@crawlready/storage": "workspace:*",
    "@crawlready/logger": "workspace:*",
    "@crawlready/types": "workspace:*",
    // ... other dependencies
  }
}
```

#### 3.2 Migrate Web App
```bash
# Move web app to apps/web
# This is trickier because it's the main app

# Strategy:
# 1. Copy current app to apps/web
# 2. Update all imports to use shared packages
# 3. Remove code that's been extracted
# 4. Test thoroughly
# 5. Switch root to use apps/web
```

### Phase 4: Docker & Deployment (Week 5)

#### 4.1 Update Worker Dockerfile
```dockerfile
# Multi-stage build
FROM node:20-slim AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json packages/database/
COPY packages/cache/package.json packages/cache/
COPY packages/queue/package.json packages/queue/
COPY packages/storage/package.json packages/storage/
COPY packages/logger/package.json packages/logger/
COPY packages/types/package.json packages/types/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile --filter @crawlready/worker...

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @crawlready/worker build

FROM node:20-slim AS runner
# Install Puppeteer dependencies
RUN apt-get update && apt-get install -y chromium ...
WORKDIR /app
COPY --from=builder /app/apps/worker/dist ./
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
CMD ["node", "index.js"]
```

#### 4.2 Update CI/CD
```yaml
# .github/workflows/deploy-worker.yml
- name: Install dependencies
  run: pnpm install --frozen-lockfile

- name: Build packages
  run: pnpm --filter @crawlready/worker^... build

- name: Deploy to Fly.io
  run: flyctl deploy --config apps/worker/fly.toml
```

### Phase 5: Testing & Optimization (Week 6)

#### 5.1 Add Package Tests
```bash
# Each package gets its own test suite
packages/database/
  ├── src/
  │   └── __tests__/
  │       ├── connection.test.ts
  │       └── queries.test.ts
  └── jest.config.js
```

#### 5.2 Integration Tests
```bash
# Test interactions between packages
apps/worker/src/__tests__/
  └── integration/
      ├── render-pipeline.test.ts
      └── db-cache-integration.test.ts
```

#### 5.3 Performance Optimization
- Measure build times before/after
- Optimize Docker layer caching
- Profile application startup time
- Monitor bundle sizes

## Technical Considerations

### TypeScript Configuration

**Base Config** (`tsconfig.base.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "@crawlready/database": ["./packages/database/src"],
      "@crawlready/cache": ["./packages/cache/src"],
      "@crawlready/queue": ["./packages/queue/src"],
      "@crawlready/storage": ["./packages/storage/src"],
      "@crawlready/security": ["./packages/security/src"],
      "@crawlready/logger": ["./packages/logger/src"],
      "@crawlready/types": ["./packages/types/src"]
    }
  }
}
```

**Package Config** (extends base):
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Package Exports

Each package should have clean exports:

```typescript
// packages/database/src/index.ts
export { db, createConnection } from './connection';
export * from './queries';
export * from './schema';
export type * from './types';
```

### Version Management

**Option 1: Changesets** (Recommended)
```bash
pnpm add -Dw @changesets/cli
pnpm changeset init

# When making changes:
pnpm changeset
pnpm changeset version
pnpm changeset publish
```

**Option 2: Workspace Protocol**
- Use `workspace:*` in package.json
- All packages version together
- Simpler but less flexible

## Migration Checklist

### Pre-Migration
- [ ] Back up current codebase
- [ ] Document current dependencies
- [ ] Create feature freeze for duration of migration
- [ ] Set up test environment
- [ ] Communicate plan to team

### Phase 1: Foundation
- [ ] Initialize monorepo structure
- [ ] Set up pnpm/npm workspaces
- [ ] Create base configurations
- [ ] Set up build orchestration (Turborepo/Nx)
- [ ] Configure CI/CD for monorepo

### Phase 2: Extract Packages
- [ ] Extract @crawlready/types
- [ ] Extract @crawlready/logger
- [ ] Extract @crawlready/database
- [ ] Extract @crawlready/cache
- [ ] Extract @crawlready/queue
- [ ] Extract @crawlready/storage
- [ ] Extract @crawlready/security
- [ ] Add tests for each package
- [ ] Document each package API

### Phase 3: Migrate Apps
- [ ] Migrate worker to apps/worker
- [ ] Update worker imports
- [ ] Test worker independently
- [ ] Migrate web app to apps/web
- [ ] Update web app imports
- [ ] Test web app independently
- [ ] Integration testing

### Phase 4: Docker & Deployment
- [ ] Update worker Dockerfile
- [ ] Optimize Docker build
- [ ] Update fly.toml
- [ ] Test deployment to staging
- [ ] Update CI/CD workflows
- [ ] Deploy to production

### Phase 5: Testing & Cleanup
- [ ] Add comprehensive tests
- [ ] Performance testing
- [ ] Security audit
- [ ] Documentation update
- [ ] Remove old code
- [ ] Clean up dependencies

### Post-Migration
- [ ] Monitor production
- [ ] Gather team feedback
- [ ] Document lessons learned
- [ ] Plan next improvements

## Rollback Plan

If issues arise during migration:

1. **Keep old structure parallel** during migration
2. **Feature flags** to switch between old/new code
3. **Git branches** for each phase
4. **Backup databases** before schema changes
5. **Deployment rollback** procedures documented

## Success Metrics

### Performance
- Docker build time: < 5 minutes (currently ~8 minutes)
- Worker startup time: < 5 seconds (currently ~8 seconds)
- CI/CD pipeline: < 10 minutes (currently ~15 minutes)

### Code Quality
- Test coverage: > 80% (currently ~40%)
- Bundle size reduction: 30% for worker
- Dependency count: Reduce by 40%

### Developer Experience
- Time to onboard new developer: < 1 day
- Time to add new feature: Reduce by 25%
- Bug fix time: Reduce by 30%

## Resources & Tools

### Package Management
- **pnpm** - Fast, disk-space efficient
- **npm workspaces** - Simple, built-in
- **yarn workspaces** - Popular alternative

### Build Orchestration
- **Turborepo** - Fast, simple, great caching
- **Nx** - Powerful, more features, steeper learning curve
- **Lerna** - Older, still maintained

### Testing
- **Jest** - Unit testing
- **Vitest** - Fast, modern alternative
- **Playwright** - E2E testing

### CI/CD
- **GitHub Actions** - Current choice
- **Buildkite** - Faster builds
- **CircleCI** - Good caching

## Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1 | Foundation | Monorepo setup, base configs |
| 2-3 | Extract Packages | All shared packages extracted and tested |
| 4 | Migrate Apps | Worker and web app using shared packages |
| 5 | Docker & Deployment | Optimized Docker, updated CI/CD |
| 6 | Testing & Cleanup | Tests, docs, cleanup |

**Total Estimated Time:** 6 weeks

## Conclusion

This refactoring will transform the CrawlReady codebase from a tightly coupled monolith into a well-organized, scalable monorepo. While it requires significant upfront effort, the long-term benefits in maintainability, developer experience, and scalability make it a worthwhile investment.

The phased approach allows for incremental progress, reducing risk and allowing the team to learn and adjust as we go. Each phase has clear deliverables and can be completed independently, providing value even if the full migration takes longer than expected.

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-01  
**Author:** AI Assistant  
**Status:** Planning / Not Started

