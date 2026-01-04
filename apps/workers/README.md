# CrawlReady Workers

This directory contains all background workers for the CrawlReady platform.

## Current Workers

### 1. Render Worker (`render-worker/`)
**Purpose:** Processes render jobs using Puppeteer to generate pre-rendered HTML for AI crawlers

**Technologies:**
- BullMQ for job queue management
- Puppeteer for headless browser rendering
- Redis for job queue and caching

**Entry Point:** `render-worker/index.ts`

**Package Name:** `@crawlready/render-worker`

**Commands:**
```bash
# Development
pnpm dev:render-worker

# Build (tsx runtime - no compilation)
pnpm build:render-worker

# Type check
cd apps/workers/render-worker && pnpm type-check
```

**Deploy:**
```bash
cd apps/workers/render-worker
flyctl deploy
```

---

## Adding New Workers

### Structure Template

When adding a new worker, follow this structure:

```
apps/workers/
└── [worker-name]/
    ├── index.ts              # Main entry point
    ├── package.json          # Worker dependencies
    ├── tsconfig.json         # TypeScript config
    ├── Dockerfile            # Container build
    ├── fly.toml              # Fly.io config (if deploying there)
    └── README.md             # Worker-specific documentation
```

### Step-by-Step Guide

#### 1. Create Worker Directory
```bash
mkdir -p apps/workers/my-new-worker
cd apps/workers/my-new-worker
```

#### 2. Create `package.json`
```json
{
  "name": "@crawlready/my-new-worker",
  "type": "module",
  "version": "1.0.0",
  "description": "Description of your worker",
  "main": "index.ts",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts",
    "build": "echo 'Worker runs with tsx - no build needed'",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@crawlready/types": "workspace:*",
    "@crawlready/logger": "workspace:*",
    "@crawlready/database": "workspace:*",
    "@crawlready/queue": "workspace:*",
    "tsx": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

#### 3. Create `tsconfig.json`
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### 4. Create `index.ts` (Example)
```typescript
import { createLogger } from '@crawlready/logger';
import { REDIS_CONNECTION } from '@crawlready/queue';
import { Worker } from 'bullmq';

const logger = createLogger({ service: 'my-new-worker' });

const worker = new Worker(
  'my-queue-name',
  async (job) => {
    logger.info({ jobId: job.id }, 'Processing job');
    // Your worker logic here
    return { success: true };
  },
  {
    connection: REDIS_CONNECTION,
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});

logger.info('Worker started');
```

#### 5. Update Root `package.json`
Add scripts for your new worker:
```json
{
  "scripts": {
    "dev:my-new-worker": "pnpm --filter @crawlready/my-new-worker dev",
    "build:my-new-worker": "pnpm --filter @crawlready/my-new-worker build"
  }
}
```

#### 6. Install Dependencies
```bash
cd /path/to/repo/root
pnpm install
```

#### 7. Test Your Worker
```bash
pnpm dev:my-new-worker
```

---

## Available Shared Packages

All workers can use these shared packages:

### `@crawlready/types`
TypeScript types for the entire monorepo
```typescript
import type { ApiKey, RenderJobData } from '@crawlready/types';
```

### `@crawlready/logger`
Centralized Pino logging
```typescript
import { createLogger } from '@crawlready/logger';
const logger = createLogger({ service: 'my-worker' });
```

### `@crawlready/database`
Database access with Drizzle ORM
```typescript
import { createConnection, renderJobQueries } from '@crawlready/database';
const db = await createConnection(process.env.DATABASE_URL);
```

### `@crawlready/cache`
Redis caching and URL utilities
```typescript
import { cache, getCacheKey } from '@crawlready/cache';
await cache.set(key, value);
```

### `@crawlready/queue`
BullMQ queue configuration
```typescript
import { getRenderQueue, REDIS_CONNECTION } from '@crawlready/queue';
const queue = getRenderQueue();
```

### `@crawlready/storage`
Supabase Storage client
```typescript
import { uploadRenderedPage } from '@crawlready/storage';
await uploadRenderedPage(key, html);
```

### `@crawlready/security`
Security utilities (SSRF, rate limiting)
```typescript
import { validateUrlSecurity } from '@crawlready/security';
validateUrlSecurity(url);
```

---

## Deployment

### Fly.io Deployment

Each worker can be deployed independently to Fly.io:

1. **Create `fly.toml`** in worker directory
2. **Configure app name** and resources
3. **Deploy:**
```bash
cd apps/workers/[worker-name]
flyctl deploy
```

### Docker Deployment

Workers use optimized Dockerfiles that:
- Install only worker-specific dependencies
- Copy necessary workspace packages
- Run with tsx for TypeScript execution
- Include only required runtime dependencies

---

## Best Practices

### 1. **Use Shared Packages**
Don't duplicate code - use packages from `packages/` directory

### 2. **Consistent Naming**
- Package name: `@crawlready/[worker-name]-worker`
- Directory name: `[worker-name]/` (kebab-case)
- Service name in logs: `[worker-name]-worker`

### 3. **Error Handling**
```typescript
worker.on('failed', (job, err) => {
  logger.error({
    jobId: job?.id,
    error: err.message,
    stack: err.stack
  }, 'Job failed');
});
```

### 4. **Graceful Shutdown**
Always implement graceful shutdown:
```typescript
process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await worker.close();
  process.exit(0);
});
```

### 5. **Environment Variables**
Use clear, prefixed environment variables:
```typescript
const config = {
  concurrency: Number.parseInt(process.env.WORKER_CONCURRENCY || '5'),
  timeout: Number.parseInt(process.env.WORKER_TIMEOUT || '30000'),
};
```

### 6. **Logging**
Use structured logging with context:
```typescript
logger.info({ jobId, userId, duration }, 'Job completed');
```

### 7. **Type Safety**
Define job data types in `@crawlready/types`:
```typescript
// packages/types/src/my-job.ts
// worker
import type { MyJobData } from '@crawlready/types';

export type MyJobData = {
  jobId: string;
  payload: unknown;
};
const worker = new Worker<MyJobData>('queue-name', async (job) => {
  // job.data is fully typed
});
```

---

## Testing Workers

### Local Development
```bash
# Terminal 1: Run Redis (if not running)
docker run -p 6379:6379 redis:alpine

# Terminal 2: Run worker
pnpm dev:my-worker

# Terminal 3: Add test jobs
node scripts/add-test-job.js
```

### Type Checking
```bash
cd apps/workers/[worker-name]
pnpm type-check
```

---

## Monitoring

### Logs
Workers output structured JSON logs in production:
```json
{
  "level": "info",
  "service": "render-worker",
  "jobId": "123",
  "msg": "Job completed"
}
```

### Metrics
Monitor these key metrics:
- Jobs processed per minute
- Average job duration
- Error rate
- Queue depth

---

## Troubleshooting

### Worker not picking up jobs
1. Check Redis connection: `process.env.REDIS_URL`
2. Verify queue name matches producer
3. Check concurrency limits
4. Review logs for errors

### Memory issues
1. Reduce concurrency
2. Increase VM memory in `fly.toml`
3. Check for memory leaks in job handlers

### Build failures
1. Run `pnpm install` in root
2. Check `tsconfig.json` extends correct base
3. Verify all dependencies in `package.json`

---

## Future Workers

Ideas for additional workers:

- **Citation Tracker Worker** - Track citations in AI responses
- **Analytics Aggregation Worker** - Process usage analytics
- **Webhook Worker** - Handle outgoing webhooks
- **Email Worker** - Send transactional emails
- **Image Optimization Worker** - Optimize uploaded images
- **PDF Generation Worker** - Generate PDF reports

---

## Resources

- **Monorepo Guide:** [`README_MONOREPO.md`](../../README_MONOREPO.md)
- **BullMQ Docs:** https://docs.bullmq.io
- **Fly.io Docs:** https://fly.io/docs
- **Shared Packages:** [`packages/`](../../packages/)
