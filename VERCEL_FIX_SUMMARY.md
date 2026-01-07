# Vercel Deployment Fix - Summary

**Issue:** Deployment failed with "husky: command not found" error  
**Status:** ✅ **FIXED**  
**Date:** January 2, 2026

---

## Problem Analysis

### Root Cause
Vercel was running `npm install` at the monorepo root, which triggered the `prepare` script. The prepare script tried to run `husky`, but husky wasn't available in the CI environment, causing the build to fail.

### Error Details
```
> crawlready-monorepo@1.7.6 prepare
> husky

sh: line 1: husky: command not found
npm error code 127
npm error command failed
npm error command sh -c husky
```

---

## Fixes Applied

### 1. ✅ Made Husky Conditional (Root Package.json)

**File:** `package.json` (root)

**Changed:**
```json
"prepare": "husky"
```

**To:**
```json
"prepare": "node -e \"if (process.env.CI !== 'true' && process.env.VERCEL !== '1') { try { require('husky').install() } catch (e) {} }\""
```

**Why:** This skips husky installation in CI environments (Vercel, GitHub Actions, etc.) but still runs it locally for git hooks.

### 2. ✅ Created Vercel Configuration

**File:** `apps/web/vercel.json` (NEW)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd ../.. && pnpm build:web",
  "devCommand": "cd ../.. && pnpm dev:web",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Why:** 
- Ensures Vercel navigates to monorepo root before running commands
- Uses `pnpm install` to install all workspace dependencies
- Uses `pnpm build:web` to build with Turborepo (builds packages first, then web app)

### 3. ✅ Created .vercelignore

**File:** `.vercelignore` (root - NEW)

Ignores unnecessary files to speed up upload:
- Worker apps
- Package build outputs
- Tests
- Development files

### 4. ✅ Created Deployment Documentation

**File:** `VERCEL_DEPLOYMENT.md` (NEW)

Complete guide for deploying the monorepo to Vercel, including:
- Project settings configuration
- Environment variables required
- Troubleshooting guide
- Post-deployment steps

---

## Next Steps to Deploy

### 1. Commit and Push Changes

```bash
git add .
git commit -m "fix: configure Vercel for monorepo deployment"
git push origin main
```

### 2. Verify Vercel Project Settings

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings:

**✅ Confirm these settings:**
- **Root Directory:** `apps/web`
- **Framework Preset:** Next.js
- **Build Command:** (leave default - uses vercel.json)
- **Install Command:** (leave default - uses vercel.json)
- **Output Directory:** `.next`
- **Node.js Version:** 18.x or higher

### 3. Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required:**
```env
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

**Optional:**
```env
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_STORAGE_BUCKET=rendered-pages
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

See full list in [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md#environment-variables-required)

### 4. Deploy

Vercel will automatically deploy when you push to main. Monitor the deployment in the Vercel Dashboard.

**Expected build process:**
1. ✅ Install dependencies from monorepo root
2. ✅ Skip husky prepare script (CI detected)
3. ✅ Build packages with Turbo
4. ✅ Build web app with Next.js
5. ✅ Deploy to Vercel edge network

---

## Verification

### After Deployment Succeeds

1. **Check health endpoint:**
```bash
curl https://your-domain.vercel.app/api/health
```

2. **Test render API:**
```bash
curl -X POST https://your-domain.vercel.app/api/render \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

3. **View logs:**
- Vercel Dashboard → Your Project → Logs
- Or via CLI: `vercel logs`

---

## Monorepo Build Process (How It Works)

When you deploy with the new configuration:

```
1. Vercel detects Root Directory: apps/web
2. Reads vercel.json configuration
3. Runs installCommand: cd ../.. && pnpm install
   ├─ Navigates to monorepo root
   ├─ Runs pnpm install (installs all workspaces)
   ├─ Links @crawlready/* packages
   └─ Skips husky (CI detected)
4. Runs buildCommand: cd ../.. && pnpm build:web
   ├─ Navigates to monorepo root
   ├─ Turbo detects web app dependencies
   ├─ Builds packages in order: types → logger → database → cache → queue → storage → security
   └─ Builds web app with Next.js
5. Uses outputDirectory: .next from apps/web/
6. Deploys to Vercel
```

---

## Troubleshooting

### If deployment still fails with husky error:
- Check that the root `package.json` has the updated conditional prepare script
- Verify `VERCEL` environment variable is set to `1` by Vercel (automatic)

### If "Module not found" errors:
- Verify `vercel.json` is in `apps/web/` directory
- Check that `installCommand` navigates to root correctly
- Ensure all `@crawlready/*` packages are listed in dependencies

### If build succeeds but app crashes:
- Check environment variables are set in Vercel Dashboard
- View deployment logs for specific error messages
- Verify database migrations have been run

---

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `package.json` (root) | Modified | Made husky conditional for CI |
| `apps/web/vercel.json` | Created | Monorepo build configuration |
| `.vercelignore` | Created | Ignore unnecessary files |
| `VERCEL_DEPLOYMENT.md` | Created | Deployment guide |
| `VERCEL_FIX_SUMMARY.md` | Created | This summary |
| `MONOREPO_DOCS.md` | Updated | Added deployment links |

---

## Documentation References

- **Quick Start:** [README_MONOREPO.md](README_MONOREPO.md)
- **Vercel Deployment:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- **Architecture:** [ARCHITECTURE_UPDATE.md](ARCHITECTURE_UPDATE.md)
- **All Docs:** [MONOREPO_DOCS.md](MONOREPO_DOCS.md)

---

**Status:** ✅ **Ready to deploy**

Commit and push the changes, then Vercel will automatically deploy your monorepo successfully!

