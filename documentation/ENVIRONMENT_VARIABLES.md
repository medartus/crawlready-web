# Environment Variables

Complete guide to configuring CrawlReady's environment variables for local development and production deployment.

## Required Variables

### Database (Supabase PostgreSQL)

```bash
DATABASE_URL=postgresql://postgres:password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

**Get from:** [Supabase Dashboard](https://app.supabase.com/project/_/settings/database) → Settings → Database → Connection String

**Used for:**
- Storing API keys, render jobs, and metadata
- Drizzle ORM connection

---

### Redis (Upstash Redis)

#### REST API (for Next.js API routes)

```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxx==
```

**Get from:** [Upstash Console](https://console.upstash.com/redis) → Select Database → REST API

**Used for:**
- Hot cache (rendered HTML storage)
- Rate limiting (sliding window counters)
- Cache operations from Next.js API routes

#### Standard Redis (for BullMQ worker)

```bash
UPSTASH_REDIS_HOST=xxxxx.upstash.io
UPSTASH_REDIS_PORT=6379
UPSTASH_REDIS_PASSWORD=AXXXxxxxxx==
UPSTASH_REDIS_TLS=true
```

**Get from:** [Upstash Console](https://console.upstash.com/redis) → Select Database → Details

**Used for:**
- BullMQ job queue
- Worker communication

---

### Supabase Storage (Cold Storage)

```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_BUCKET=rendered-pages
```

**Get from:** [Supabase Dashboard](https://app.supabase.com/project/_/settings/api) → Settings → API

**Used for:**
- Permanent storage of rendered HTML
- Signed URLs for cold cache downloads

**Setup:**
1. Create a storage bucket named `rendered-pages`
2. Set bucket to **private** (accessed via signed URLs)

---

## Optional Variables

### Worker Configuration

```bash
WORKER_CONCURRENCY=5  # Number of concurrent render jobs per worker
HEALTH_PORT=8080      # Port for health check endpoint
```

**Defaults:**
- `WORKER_CONCURRENCY`: 5
- `HEALTH_PORT`: 8080

---

### Next.js Configuration

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://crawlready.com
```

**Used for:**
- Environment detection
- Public URL generation

---

### Monitoring & Observability (Optional)

#### PostHog (Product Analytics)

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Get from:** [PostHog](https://posthog.com/) → Project Settings

#### Sentry (Error Tracking)

```bash
SENTRY_DSN=https://xxxxxxxxxxxxx@o123456.ingest.sentry.io/123456
```

**Get from:** [Sentry](https://sentry.io/) → Project Settings → Client Keys (DSN)

#### Axiom (Structured Logging)

```bash
AXIOM_TOKEN=xaat-xxxxxxxxxxxxx
AXIOM_DATASET=crawlready-logs
```

**Get from:** [Axiom](https://axiom.co/) → Settings → API Tokens

---

## Infrastructure Setup Guide

### 1. Supabase Setup

1. Create a new project at [app.supabase.com](https://app.supabase.com/)
2. **Database:**
   - Copy `DATABASE_URL` from Settings → Database
   - Run migrations: `npm run db:push`
3. **Storage:**
   - Create bucket: `rendered-pages` (private)
   - Enable RLS policies if needed

### 2. Upstash Redis Setup

1. Create a new database at [console.upstash.com](https://console.upstash.com/)
2. **Configuration:**
   - Select **Global** for low latency
   - Enable **TLS** for security
3. **Copy credentials:**
   - REST API: URL + Token
   - Standard Redis: Host + Port + Password

### 3. Fly.io Setup (Worker Deployment)

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Deploy worker:
   ```bash
   cd workers/render-worker
   fly launch --no-deploy
   fly secrets set DATABASE_URL="..." UPSTASH_REDIS_HOST="..." ...
   fly deploy
   ```

---

## Local Development

Create a `.env.local` file in the project root:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env.local
```

**Minimal setup for local development:**

```bash
# Use local PostgreSQL or Supabase free tier
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crawlready

# Use Upstash free tier (1GB storage)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Use Supabase free tier (1GB storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=rendered-pages
```

---

## Production Deployment

### Vercel (Next.js App)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel Dashboard → Settings → Environment Variables
3. Deploy

### Fly.io (Render Worker)

1. Set secrets:
   ```bash
   fly secrets set \
     DATABASE_URL="postgresql://..." \
     UPSTASH_REDIS_HOST="..." \
     UPSTASH_REDIS_PASSWORD="..." \
     SUPABASE_URL="..." \
     SUPABASE_KEY="..."
   ```
2. Deploy: `fly deploy`

---

## Security Best Practices

- ✅ **Never commit** `.env` or `.env.local` files
- ✅ **Use different credentials** for development and production
- ✅ **Rotate keys** regularly (every 90 days recommended)
- ✅ **Use Vercel/Fly secrets** instead of plain text in CI/CD
- ✅ **Restrict Supabase RLS** policies for storage bucket access
- ✅ **Enable Upstash TLS** for Redis connections

