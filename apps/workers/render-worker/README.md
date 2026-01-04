# CrawlReady Render Worker

BullMQ worker that processes page rendering jobs using Puppeteer.

## Features

- **Puppeteer Rendering:** Full browser rendering with JavaScript execution
- **Resource Blocking:** Blocks images, fonts, analytics, and tracking scripts for faster rendering
- **Auto-Scroll:** Triggers lazy-loading by scrolling the page
- **HTML Optimization:** Removes scripts, styles, and comments while preserving content
- **Dual Storage:** Stores rendered HTML in both Redis (hot) and Supabase (cold)
- **Job Queue:** BullMQ for reliable job processing with retries
- **Graceful Shutdown:** Handles SIGTERM/SIGINT for zero-downtime deploys

## Architecture

```
┌─────────────────┐
│  Next.js API    │
│  /api/render    │
└────────┬────────┘
         │ Creates job
         ▼
┌─────────────────┐
│  BullMQ Queue   │
│  (Redis/Upstash)│
└────────┬────────┘
         │ Consumes job
         ▼
┌─────────────────┐
│  Render Worker  │  ◄─ This worker
│  (Puppeteer)    │
└────────┬────────┘
         │ Stores HTML
         ▼
┌─────────────────┬─────────────────┐
│  Redis (Hot)    │ Supabase (Cold) │
│  7-day cache    │ Permanent       │
└─────────────────┴─────────────────┘
```

## Local Development

### Prerequisites

- Node.js 20+
- Redis (or Upstash Redis)
- PostgreSQL (or Supabase)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql://..."
   export UPSTASH_REDIS_HOST="xxxxx.upstash.io"
   export UPSTASH_REDIS_PORT="6379"
   export UPSTASH_REDIS_PASSWORD="xxxxx"
   export UPSTASH_REDIS_TLS="true"
   export SUPABASE_URL="https://xxxxx.supabase.co"
   export SUPABASE_KEY="xxxxx"
   export WORKER_CONCURRENCY="5"
   ```

3. **Run worker:**
   ```bash
   npm run dev
   ```

   Or with tsx:
   ```bash
   npx tsx watch index.ts
   ```

## Production Deployment

### Fly.io (Recommended)

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Create app (first time only):**
   ```bash
   fly launch --no-deploy
   ```

   This creates `fly.toml` with the configuration.

4. **Set secrets:**
   ```bash
   fly secrets set \
     DATABASE_URL="postgresql://..." \
     UPSTASH_REDIS_HOST="xxxxx.upstash.io" \
     UPSTASH_REDIS_PORT="6379" \
     UPSTASH_REDIS_PASSWORD="xxxxx" \
     UPSTASH_REDIS_TLS="true" \
     SUPABASE_URL="https://xxxxx.supabase.co" \
     SUPABASE_KEY="xxxxx"
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

6. **Scale workers:**
   ```bash
   # Scale to 3 worker instances
   fly scale count 3

   # Scale resources (if needed)
   fly scale vm shared-cpu-2x --memory 512
   ```

7. **Monitor:**
   ```bash
   # Logs
   fly logs

   # Status
   fly status

   # SSH into machine
   fly ssh console
   ```

### Docker (Alternative)

Build and run locally with Docker:

```bash
# Build
docker build -t crawlready-worker .

# Run
docker run -e DATABASE_URL="..." -e UPSTASH_REDIS_HOST="..." crawlready-worker
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `UPSTASH_REDIS_HOST` | ✅ | - | Redis host (for BullMQ) |
| `UPSTASH_REDIS_PORT` | ✅ | `6379` | Redis port |
| `UPSTASH_REDIS_PASSWORD` | ✅ | - | Redis password |
| `UPSTASH_REDIS_TLS` | ✅ | `true` | Enable TLS for Redis |
| `SUPABASE_URL` | ⚠️ | - | Supabase URL (cold storage - not yet implemented) |
| `SUPABASE_KEY` | ⚠️ | - | Supabase anon key |
| `WORKER_CONCURRENCY` | ❌ | `5` | Number of concurrent jobs |
| `HEALTH_PORT` | ❌ | `8080` | Health check port |

### Worker Tuning

**Concurrency:** Adjust `WORKER_CONCURRENCY` based on available RAM:
- `shared-cpu-1x` (256MB): 2-3 concurrent jobs
- `shared-cpu-2x` (512MB): 5-7 concurrent jobs
- `performance-1x` (2GB): 15-20 concurrent jobs

**Rate Limiting:** Worker has built-in rate limiting (10 jobs per second max).

## Monitoring

### Health Check

Worker exposes a health check endpoint on port 8080:

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```

Fly.io automatically uses this for health checks (configured in `fly.toml`).

### Logs

Worker logs include:
- Job start/completion times
- Render duration and HTML size
- Errors and retries
- Cache hits/misses

Example log output:
```
[Worker] Processing job abc-123 for URL: https://example.com
[Worker] Rendering page: https://example.com
[Worker] Optimizing HTML (125000 bytes)
[Worker] HTML optimized: 125000 → 45000 bytes
[Worker] Stored in Redis cache: render:v1:https://example.com
[Worker] Job abc-123 completed in 2534ms
✓ Job abc-123 completed successfully
```

## Troubleshooting

### Worker not processing jobs

1. **Check Redis connection:**
   ```bash
   fly ssh console
   nc -zv $UPSTASH_REDIS_HOST $UPSTASH_REDIS_PORT
   ```

2. **Check BullMQ queue:**
   Use BullMQ Board or Redis CLI to inspect the queue:
   ```bash
   redis-cli -u redis://:$UPSTASH_REDIS_PASSWORD@$UPSTASH_REDIS_HOST:$UPSTASH_REDIS_PORT
   KEYS bull:render-queue:*
   ```

### Puppeteer crashes

- **Out of memory:** Reduce `WORKER_CONCURRENCY` or scale to a larger machine
- **Missing dependencies:** The Dockerfile includes all Chromium dependencies. If running locally, install them:
  ```bash
  # Ubuntu/Debian
  apt-get install -y chromium-browser
  ```

### Slow rendering

- Resource blocking is enabled by default (blocks images, fonts, analytics)
- Check if the target site has heavy JavaScript or long network idle times
- Adjust timeout in the render request: `{"timeout": 60000}` (60 seconds)

## Performance

**Typical render times:**
- Simple page (< 1MB HTML): 1-3 seconds
- Medium page (1-5MB HTML): 3-7 seconds
- Heavy page (> 5MB HTML): 7-15 seconds

**Resource blocking savings:**
- ~70% reduction in page load time
- ~60% reduction in HTML size after optimization

## Cost Estimates

### Fly.io

- **1 worker (shared-cpu-2x, 512MB):** ~$10/month
- **3 workers (auto-scaling):** ~$30/month
- **Bandwidth:** Free (up to 160GB/month)

### Upstash Redis

- **Free tier:** 10,000 commands/day, 1GB storage
- **Pro:** Starts at $10/month

### Supabase

- **Free tier:** 1GB storage, 2GB transfer/month
- **Pro:** Starts at $25/month

**Total MVP cost:** ~$45-55/month for 3 workers + Redis + Supabase

## Development

### File Structure

```
workers/render-worker/
├── index.ts              # Main worker entry point
├── renderer.ts           # Puppeteer page rendering
├── html-optimizer.ts     # HTML optimization utils
├── package.json          # Dependencies
├── Dockerfile            # Production Docker image
├── fly.toml              # Fly.io configuration
└── README.md             # This file
```

### Testing Locally

1. Start the worker:
   ```bash
   npm run dev
   ```

2. In another terminal, add a test job to the queue:
   ```bash
   # Use the Next.js API to create a job
   curl -X POST http://localhost:3000/api/render \
     -H "Authorization: Bearer sk_test_xxxxx" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ```

3. Watch the worker logs to see it process the job.

## License

MIT
