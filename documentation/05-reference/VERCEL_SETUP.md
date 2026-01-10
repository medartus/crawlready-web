# Vercel Deployment Setup for Monorepo

## ✅ Correct Configuration

### Vercel Project Settings

**IMPORTANT:** Set the following in your Vercel project settings:

1. **Root Directory:** `/` (repository root, NOT `apps/web`)
2. **Framework Preset:** Next.js
3. **Build Command:** (leave empty, uses `vercel.json`)
4. **Output Directory:** (leave empty, uses `vercel.json`)
5. **Install Command:** (leave empty, uses `vercel.json`)

### Why Root Directory Must Be `/`

When the Root Directory is set to `apps/web`, Vercel changes the working directory, which breaks:
- TypeScript path aliases (`@/*` mappings)
- Monorepo workspace resolution
- Relative imports between packages

By keeping the Root Directory at `/`, all paths resolve correctly from the monorepo root.

### How It Works

The `apps/web/vercel.json` configuration handles the build:

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

- `pnpm install` runs from the root and installs all workspace dependencies
- `pnpm build` runs the build script in `apps/web/package.json` which executes `next build`
- Vercel auto-detects the Next.js output directory (`.next`)

### Required Environment Variables

Set these in Vercel → Settings → Environment Variables:

**Server (Secret):**
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `BILLING_PLAN_ENV` (values: `dev`, `test`, or `prod`)

**Client (Public):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Optional:**
- `DATABASE_URL`
- `LOGTAIL_SOURCE_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_STORAGE_BUCKET` (defaults to `rendered-pages`)
- `NEXT_PUBLIC_APP_URL`

### Build Performance

The `.vercelignore` file excludes:
- `apps/workers/*` - Worker code (not needed for web deployment)
- `packages/*/dist` - Compiled package artifacts
- Test files and fixtures

This keeps the build fast by only uploading necessary files.

### Troubleshooting

**If you see "Module not found" errors for `@/*` imports:**
- ✅ Verify Root Directory is set to `/` (not `apps/web`)
- ✅ Check that `apps/web/tsconfig.json` has correct `baseUrl` and `paths`
- ✅ Ensure `pnpm install` completes successfully

**If you see "Cannot find package '@crawlready/*'" errors:**
- ✅ Verify `pnpm install` is running from the repository root
- ✅ Check that all workspace packages are listed in `pnpm-workspace.yaml`
- ✅ Ensure `pnpm-lock.yaml` is committed

**If the build is slow:**
- ✅ Verify `.vercelignore` is excluding `apps/workers` and heavy dependencies
- ✅ Consider using Vercel's build cache (enabled by default)

**If you see database connection errors (`ENOTFOUND db.xxx.supabase.co`):**
- ✅ **Use connection pooler URL** for Vercel: `pooler.xxx.supabase.co:6543` (not `db.xxx.supabase.co:5432`)
- ✅ Ensure `DATABASE_URL` is set correctly in Vercel environment variables
- ✅ The connection pooler is **required** for serverless functions to avoid connection limits
- ✅ Direct connections will fail in Vercel's serverless environment
- ✅ Get pooler URL from Supabase Dashboard → Settings → Database → Connection String → Connection Pooling

## Summary

✅ **Root Directory:** `/`  
✅ **Build Command:** Defined in `apps/web/vercel.json`  
✅ **Framework:** Next.js (auto-detected)  
✅ **Environment Variables:** Set in Vercel dashboard  

This configuration ensures fast builds with proper module resolution in the monorepo structure.

