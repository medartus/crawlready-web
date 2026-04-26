# Vercel Production Deployment Checklist

## Pre-deployment

- [ ] Run DB migration to add new columns (`visual_diff`, `warnings` on `scans` table)
- [ ] Run Firecrawl 100-crawl validation script and confirm PASS
- [ ] Run pre-seed script against staging to verify 20 sites populate correctly

## Vercel Configuration

- [ ] Import project from GitHub (`crawlready-web`)
- [ ] Set root directory: `apps/web`
- [ ] Framework: Next.js
- [ ] Build command: `turbo run build --filter=@crawlready/web`
- [ ] Install command: `pnpm install --prod=false`

## Environment Variables (Vercel Dashboard)

Required for Phase 0:

| Variable | Source | Required |
|---|---|---|
| `DATABASE_URL` | Supabase > Settings > Database | ✅ |
| `AUTO_MIGRATE` | Set to `false` | ✅ |
| `CLERK_SECRET_KEY` | Clerk Dashboard | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard | ✅ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | ✅ |
| `FIRECRAWL_API_KEY` | Firecrawl Dashboard | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://crawlready.app` | ✅ |
| `NODE_ENV` | `production` | ✅ |

Optional:

| Variable | Source | Required |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog | Optional |
| `LOGTAIL_SOURCE_TOKEN` | Logtail | Optional |

## Domain Configuration

- [ ] Add `crawlready.app` domain in Vercel project settings
- [ ] Add DNS records at registrar:
  - `A` record → `76.76.21.21`
  - `CNAME` for `www` → `cname.vercel-dns.com`
- [ ] Wait for SSL certificate provisioning
- [ ] Verify domain resolves correctly

## Post-deployment Smoke Test

- [ ] Landing page loads at `https://crawlready.app`
- [ ] Scan form submits and returns results
- [ ] `/scan/[id]` page renders with score, visual diff, EU checklist
- [ ] `/score/[domain]` page renders for a pre-seeded domain
- [ ] OG image generates at `/score/[domain]/opengraph-image`
- [ ] Share button copies correct URL
- [ ] Sign-up/sign-in works via Clerk
- [ ] `/dashboard/sites` loads after auth
- [ ] Site registration creates a site key
- [ ] Rate limiting returns 429 after 3 scans/hour
- [ ] robots.txt accessible and correct
- [ ] sitemap.xml accessible

## Run Pre-seed on Production

```bash
npx tsx apps/web/scripts/pre-seed-sites.ts --base-url https://crawlready.app
```

## Launch

- [ ] Post Show HN (see `docs/launch/show-hn-post.md`)
- [ ] Monitor error logs for first 2 hours
- [ ] Check Vercel analytics for traffic
