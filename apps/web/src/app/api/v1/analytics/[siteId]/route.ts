import { auth } from '@clerk/nextjs/server';
import { schema } from '@crawlready/database';
import { and, count, countDistinct, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/utils/api-helpers';
import { db } from '@/libs/DB';

type RouteParams = { params: Promise<{ siteId: string }> };

/**
 * GET /api/v1/analytics/[siteId] — Basic visit analytics for a site.
 *
 * Returns: visit_count, unique_pages, breakdown by bot, top pages.
 * Auth: Clerk JWT, user must own the site.
 * Query params: ?days=30 (default 30, max 90)
 */
export async function GET(request: Request, routeParams: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { siteId } = await routeParams.params;

  // Verify site ownership
  const siteRows = await db
    .select({ id: schema.sites.id, domain: schema.sites.domain })
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, siteId),
        eq(schema.sites.clerkUserId, userId),
      ),
    )
    .limit(1);

  if (siteRows.length === 0) {
    return apiError('NOT_FOUND', 'Site not found.', 404);
  }

  const site = siteRows[0]!;

  // Parse days param
  const url = new URL(request.url);
  const daysParam = Number.parseInt(url.searchParams.get('days') ?? '30', 10);
  const days = Math.min(Math.max(daysParam || 30, 1), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const siteIdFilter = and(
    eq(schema.crawlerVisits.siteId, site.id),
    gte(schema.crawlerVisits.visitedAt, since),
  );

  // Total visit count + unique pages
  const [totals] = await db
    .select({
      visitCount: count(),
      uniquePages: countDistinct(schema.crawlerVisits.path),
    })
    .from(schema.crawlerVisits)
    .where(siteIdFilter);

  // Breakdown by bot
  const botBreakdown = await db
    .select({
      bot: schema.crawlerVisits.bot,
      visits: count(),
    })
    .from(schema.crawlerVisits)
    .where(siteIdFilter)
    .groupBy(schema.crawlerVisits.bot)
    .orderBy(sql`count(*) DESC`);

  // Top 10 pages
  const topPages = await db
    .select({
      path: schema.crawlerVisits.path,
      visits: count(),
    })
    .from(schema.crawlerVisits)
    .where(siteIdFilter)
    .groupBy(schema.crawlerVisits.path)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  return NextResponse.json({
    site_id: site.id,
    domain: site.domain,
    period_days: days,
    visit_count: totals?.visitCount ?? 0,
    unique_pages: totals?.uniquePages ?? 0,
    by_bot: botBreakdown.map(r => ({
      bot: r.bot,
      visits: r.visits,
    })),
    top_pages: topPages.map(r => ({
      path: r.path,
      visits: r.visits,
    })),
  });
}
