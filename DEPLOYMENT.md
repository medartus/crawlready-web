# CrawlReady Deployment Guide

Quick guide to deploying CrawlReady MVP to production.

## Prerequisites

- Vercel account (free tier works)
- Supabase account (free tier: 500MB database, 1GB storage)
- Upstash account (free tier: 10K commands/day, 1GB)
- Fly.io account (free trial: $5 credit)

---

## 1. Database Setup (Supabase)

### Create Project

1. Go to [app.supabase.com](https://app.supabase.com/)
2. Click "New project"
3. Choose organization, name, password, and region
4. Wait ~2 minutes for project provisioning

### Run Migrations

```bash
# Copy database URL from Supabase Dashboard → Settings → Database
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migrations
npm run db:push
```

### Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Click "New bucket"
3. Name: `rendered-pages`
4. **Make it private** (accessed via signed URLs)
5. Click "Create bucket"

### Get API Keys

From Settings → API:
- Copy `URL` → This is `SUPABASE_URL`
- Copy `anon public` key → This is `SUPABASE_KEY`

---

## 2. Redis Setup (Upstash)

### Create Database

1. Go to [console.upstash.com](https://console.upstash.com/)
2. Click "Create database"
3. Name: `crawlready-cache`
4. Type: **Global** (for multi-region low latency)
5. Enable **TLS**
6. Click "Create"

### Get Credentials

From database details page:

**REST API** (for Next.js):
- Copy `UPSTASH_REDIS_REST_URL`
- Copy `UPSTASH_REDIS_REST_TOKEN`

**Standard Redis** (for Worker):
- Copy `Endpoint` → This is `UPSTASH_REDIS_HOST`
- Copy `Port` → This is `UPSTASH_REDIS_PORT` (usually 6379)
- Copy `Password` → This is `UPSTASH_REDIS_PASSWORD`
- Set `UPSTASH_REDIS_TLS=true`

---

## 3. Deploy Next.js App (Vercel)

### Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework preset: **Next.js**
4. Root directory: `./`
5. Don't deploy yet!

### Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```bash
# Database
DATABASE_URL=postgresql://postgres:...@db....supabase.co:5432/postgres

# Redis (REST API for Next.js)
UPSTASH_REDIS_REST_URL=https://....upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# Redis (Standard for Worker)
UPSTASH_REDIS_HOST=....upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=...
UPSTASH_REDIS_TLS=true

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
SUPABASE_STORAGE_BUCKET=rendered-pages

# App config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Deploy

Click "Deploy" and wait ~2 minutes.

---

## 4. Deploy Render Worker (Fly.io)

### Install Fly CLI

```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### Login

```bash
fly auth login
```

### Create App

```bash
cd workers/render-worker

# Launch (creates app but doesn't deploy yet)
fly launch --no-deploy --name crawlready-worker
```

This creates `fly.toml` (already exists in repo).

### Set Secrets

```bash
fly secrets set \
  DATABASE_URL="postgresql://postgres:...@db....supabase.co:5432/postgres" \
  UPSTASH_REDIS_HOST="....upstash.io" \
  UPSTASH_REDIS_PORT="6379" \
  UPSTASH_REDIS_PASSWORD="..." \
  UPSTASH_REDIS_TLS="true" \
  SUPABASE_URL="https://....supabase.co" \
  SUPABASE_KEY="eyJhbGci..." \
  WORKER_CONCURRENCY="3"
```

### Deploy

```bash
fly deploy
```

Wait ~3-5 minutes for Docker build and deployment.

### Verify

```bash
# Check status
fly status

# View logs
fly logs

# Should see:
# 🚀 CrawlReady render worker started
#    Concurrency: 3
#    Redis: ....upstash.io
```

### Scale (Optional)

```bash
# Scale to 3 worker instances for redundancy
fly scale count 3

# Scale resources (if needed for higher concurrency)
fly scale vm performance-1x --memory 2048
```

---

## 5. Test End-to-End

### Generate Test API Key

1. Go to `https://your-app.vercel.app/admin`
2. Fill in:
   - Customer Email: `test@example.com`
   - Tier: `free`
3. Click "Generate API Key"
4. **Copy the key immediately** (shown only once!)

### Test Render Request

```bash
# Replace with your API key and Vercel URL
curl -X POST https://your-app.vercel.app/api/render \
  -H "Authorization: Bearer sk_free_xxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Expected response:**
```json
{
  "status": "queued",
  "jobId": "abc-123-...",
  "statusUrl": "/api/status/abc-123-...",
  "estimatedTime": 5000,
  "message": "Page is being rendered. Poll statusUrl for completion."
}
```

### Check Job Status

```bash
curl https://your-app.vercel.app/api/status/abc-123-... \
  -H "Authorization: Bearer sk_free_xxxxxxxxxx"
```

**When processing:**
```json
{
  "status": "processing",
  "jobId": "abc-123-...",
  "progress": 45,
  "message": "Worker is rendering the page...",
  ...
}
```

**When complete:**
```json
{
  "status": "completed",
  "jobId": "abc-123-...",
  "url": "https://example.com",
  "cachedUrl": "/api/render",
  "size": 45231,
  "renderTime": 2534,
  ...
}
```

### Test Cache Hit

Make the same render request again:

```bash
curl -X POST https://your-app.vercel.app/api/render \
  -H "Authorization: Bearer sk_free_xxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Expected:** Instant 200 response with HTML (from hot cache)

---

## 6. Monitor

### Vercel Logs

```bash
vercel logs --follow
```

Or view in [Vercel Dashboard](https://vercel.com/dashboard) → Project → Logs

### Fly.io Logs

```bash
fly logs --follow
```

Or view in [Fly.io Dashboard](https://fly.io/dashboard) → App → Logs

### Usage Stats

Go to `https://your-app.vercel.app/admin/stats` to view:
- Total renders
- Cache hit rate
- Daily usage trends

---

## Cost Estimates

### Free Tier (MVP Testing)

- **Vercel:** Free (100GB bandwidth/month, unlimited functions)
- **Supabase:** Free (500MB database, 1GB storage, 2GB egress)
- **Upstash:** Free (10K commands/day, 1GB storage)
- **Fly.io:** $5 credit (1 shared-cpu-1x worker)

**Total:** $0/month (for first month with Fly credits)

### Production (Low Volume)

- **Vercel:** $20/month (Pro plan for team + analytics)
- **Supabase:** $25/month (Pro - 8GB database, 100GB storage)
- **Upstash:** $10/month (paid tier - 100K commands/day)
- **Fly.io:** $30/month (3x shared-cpu-2x workers with 512MB RAM)

**Total:** ~$85/month for production-ready infrastructure

---

## Troubleshooting

### Worker not processing jobs

1. Check Fly.io logs: `fly logs`
2. Verify Redis connection:
   ```bash
   fly ssh console
   nc -zv $UPSTASH_REDIS_HOST $UPSTASH_REDIS_PORT
   ```
3. Check BullMQ queue (use Redis CLI or Upstash dashboard)

### API returning 500 errors

1. Check Vercel logs for error details
2. Verify all environment variables are set
3. Test database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Rate limit issues

- Free tier: 100 renders/day
- Check usage: `/admin/stats`
- Upgrade to Pro tier for 1,000/day

---

## Next Steps

1. ✅ **Infrastructure deployed** - All services running
2. ⏳ **Integration testing** - Test all features end-to-end
3. ⏳ **Beta launch** - Onboard 5 beta customers
4. ⏳ **Monitoring setup** - Add PostHog, Sentry, Axiom (optional)
5. ⏳ **Custom domain** - Point your domain to Vercel
6. ⏳ **SSL certificates** - Vercel handles this automatically

---

## Support

- **Documentation:** `/documentation/specs/`
- **Worker README:** `/workers/render-worker/README.md`
- **Environment variables:** `/documentation/ENVIRONMENT_VARIABLES.md`

---

**Ready to go live!** 🚀

