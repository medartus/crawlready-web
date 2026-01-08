# Deploying Render Worker to Fly.io

## Important Notes

### Monorepo Structure
This worker is part of a pnpm monorepo. The Dockerfile needs access to:
- Workspace root files (`pnpm-workspace.yaml`, `package.json`, `tsconfig.base.json`)
- Shared packages (`packages/types`, `packages/database`, etc.)
- Worker code (`apps/workers/render-worker/`)

### Build Context
- **CLI Deployment:** Run from workspace root with `-c apps/workers/render-worker/fly.toml`
- **Build context is always the workspace root** (for monorepo access)

### Optimized Docker Image
The Dockerfile uses **minimal dependencies** (7 packages) for headless Chromium:
- ✅ 33% smaller than full desktop Chrome dependencies
- ✅ Faster builds and deploys
- ✅ Puppeteer skips Chrome download (uses system Chromium)

### Deployment Method
**Use the CLI** for reliable deployments.

## Prerequisites

1. **Install Fly.io CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly.io:**
   ```bash
   flyctl auth login
   ```

## Deployment Steps

### First Time Deployment

1. **Navigate to workspace root:**
   ```bash
   cd /path/to/crawlready-web  # Workspace root (monorepo root)
   ```

2. **Set environment secrets:**
   ```bash
   # Database
   flyctl secrets set -a crawlready-worker DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"

   # Redis (Upstash)
   flyctl secrets set -a crawlready-worker UPSTASH_REDIS_HOST="xxx.upstash.io"
   flyctl secrets set -a crawlready-worker UPSTASH_REDIS_PORT="6379"
   flyctl secrets set -a crawlready-worker UPSTASH_REDIS_PASSWORD="xxx"
   flyctl secrets set -a crawlready-worker UPSTASH_REDIS_TLS="true"

   # Supabase Storage (optional)
   flyctl secrets set -a crawlready-worker SUPABASE_URL="https://xxx.supabase.co"
   flyctl secrets set -a crawlready-worker SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   flyctl secrets set -a crawlready-worker SUPABASE_STORAGE_BUCKET="rendered-pages"
   ```

3. **Deploy (from workspace root):**
   ```bash
   flyctl deploy -c apps/workers/render-worker/fly.toml --dockerfile apps/workers/render-worker/Dockerfile
   ```

### Updating Deployment

After making code changes:

```bash
# From workspace root
cd /path/to/crawlready-web
flyctl deploy -c apps/workers/render-worker/fly.toml --dockerfile apps/workers/render-worker/Dockerfile
```

**Note:** The `-c` flag specifies the config, `--dockerfile` specifies the Dockerfile path. Build context is always the workspace root.

## Verify Deployment

1. **Check status:**
   ```bash
   flyctl status
   ```

2. **View logs:**
   ```bash
   flyctl logs
   ```

3. **Check health:**
   ```bash
   curl https://crawlready-worker.fly.dev/health
   ```

## Scaling

**Increase worker instances:**
```bash
flyctl scale count 2  # Run 2 instances
```

**Increase memory:**
```bash
flyctl scale memory 1024  # 1GB RAM
```

**Change VM size:**
```bash
flyctl scale vm shared-cpu-4x  # 4 vCPUs
```

## Monitoring

**View metrics:**
```bash
flyctl dashboard
```

**SSH into container:**
```bash
flyctl ssh console
```

## Troubleshooting

### Build fails with "Dockerfile not found"
Make sure you're in the **workspace root** and specify both config and dockerfile:
```bash
cd /path/to/crawlready-web  # Workspace root
flyctl deploy -c apps/workers/render-worker/fly.toml --dockerfile apps/workers/render-worker/Dockerfile
```

### Worker can't connect to Redis
- Verify `UPSTASH_REDIS_*` secrets are set correctly
- Check that `UPSTASH_REDIS_TLS="true"` is set
- Test Redis connection from local machine first

### Puppeteer fails to launch
- The Dockerfile includes all required Chromium dependencies
- If issues persist, check logs: `flyctl logs`

### Out of memory
- Increase memory: `flyctl scale memory 1024`
- Or reduce concurrency in `fly.toml`: `WORKER_CONCURRENCY = '2'`

## Cost Optimization

**Hobby Plan (~$5/month):**
- 1 shared-cpu-2x instance
- 512MB RAM
- Perfect for development/low traffic

**Production (~$20-50/month):**
- 2-3 shared-cpu-4x instances
- 1GB RAM each
- Auto-scaling enabled

## GitHub Actions (Optional)

Add this to `.github/workflows/deploy-worker.yml`:

```yaml
name: Deploy Worker to Fly.io

on:
  push:
    branches: [main]
    paths:
      - 'workers/render-worker/**'

jobs:
  deploy:
    name: Deploy to Fly.io
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --config workers/render-worker/fly.toml
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Add `FLY_API_TOKEN` to your GitHub repository secrets.
