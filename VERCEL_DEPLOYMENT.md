# Vercel Deployment Guide - Monorepo

## Configuration

### Project Settings in Vercel Dashboard

**Important:** Set these correctly in your Vercel project settings:

1. **Root Directory:** `apps/web`
2. **Framework Preset:** Next.js
3. **Build Command:** (leave default - uses vercel.json)
4. **Install Command:** (leave default - uses vercel.json)
5. **Output Directory:** `.next`

### Files Created for Vercel

- **`apps/web/vercel.json`** - Build configuration for monorepo
- **`.vercelignore`** - Ignore patterns to reduce upload size

## How It Works

The `vercel.json` configuration in `apps/web/` instructs Vercel to:

1. **Install:** Navigate to monorepo root and run `pnpm install`
   - This installs all workspace dependencies
   - Automatically links `@crawlready/*` packages

2. **Build:** Navigate to root and run `pnpm build:web`
   - Uses Turborepo to build the web app
   - Automatically builds dependent packages first

3. **Output:** Uses `.next` directory from `apps/web/`

## Environment Variables Required

Add these in Vercel Dashboard → Project Settings → Environment Variables:

### Database
```env
DATABASE_URL=postgresql://...
```

### Redis (Upstash)
```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Clerk (Authentication)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Supabase (Optional - Cold Storage)
```env
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_STORAGE_BUCKET=rendered-pages
```

### App Configuration
```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
```

## Troubleshooting

### Issue: "husky: command not found"

**Solution:** Already fixed in root `package.json` - the prepare script now skips husky in CI environments.

### Issue: "Module not found: Can't resolve '@crawlready/...'"

**Solution:** Ensure `vercel.json` is using the correct install command that runs from the monorepo root.

### Issue: Build fails with TypeScript errors

**Solution:** 
1. Run `pnpm check-types` locally to verify no errors
2. Ensure all `@crawlready/*` packages are building correctly
3. Check that `tsconfig.base.json` path mappings are correct

### Issue: Deployment successful but app crashes

**Solution:** Check environment variables are set correctly in Vercel Dashboard.

## Deployment Commands

### Automatic (Recommended)
```bash
git push origin main
```
Vercel automatically deploys on push to main branch.

### Manual via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from monorepo root
cd /path/to/crawlready-web
vercel --cwd apps/web

# Deploy to production
vercel --cwd apps/web --prod
```

## Post-Deployment

### 1. Run Database Migrations

After first deployment:
```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm db:migrate
```

### 2. Test the Deployment

```bash
# Check health
curl https://your-domain.vercel.app/api/health

# Test render endpoint
curl -X POST https://your-domain.vercel.app/api/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. Monitor Logs

View logs in:
- Vercel Dashboard → Your Project → Logs
- Or via CLI: `vercel logs`

## Monorepo Benefits on Vercel

✅ **Automatic Package Building** - Turbo builds dependencies first  
✅ **Shared Code** - Web app uses `@crawlready/*` packages  
✅ **Fast Builds** - Turbo caching reduces build times  
✅ **Type Safety** - Full TypeScript support across packages  

## Related Documentation

- [README_MONOREPO.md](README_MONOREPO.md) - Monorepo structure
- [ARCHITECTURE_UPDATE.md](ARCHITECTURE_UPDATE.md) - Architecture details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide (web + worker)

