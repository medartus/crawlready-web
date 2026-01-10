import { cacheAccesses, renderJobs } from '@crawlready/database';
import { sql } from 'drizzle-orm';

import { withErrorHandler } from '@/libs/api-error-handler';
import { success } from '@/libs/api-response-helpers';
import { requireAdminRole } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';

// Force dynamic rendering - this route uses headers for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 *
 * Get aggregate usage statistics (Admin only)
 */
export const GET = withErrorHandler(async () => {
  // Verify admin role
  await requireAdminRole();

  // Get total renders (completed jobs)
  const totalRendersResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(renderJobs)
    .where(sql`${renderJobs.status} = 'completed'`);

  const totalRenders = totalRendersResult[0]?.count || 0;

  // Get cache hits and misses
  const cacheStatsResult = await db
    .select({
      location: cacheAccesses.cacheLocation,
      count: sql<number>`count(*)::int`,
    })
    .from(cacheAccesses)
    .groupBy(cacheAccesses.cacheLocation);

  let totalCacheHits = 0;
  let totalCacheMisses = 0;

  for (const stat of cacheStatsResult) {
    if (stat.location === 'hot' || stat.location === 'cold') {
      totalCacheHits += stat.count;
    } else if (stat.location === 'none') {
      totalCacheMisses += stat.count;
    }
  }

  const cacheHitRate
      = totalCacheHits + totalCacheMisses > 0
        ? (totalCacheHits / (totalCacheHits + totalCacheMisses)) * 100
        : 0;

  // Get average render time (completed jobs only)
  const avgRenderTimeResult = await db
    .select({
      avg: sql<number>`avg(${renderJobs.renderDurationMs})::int`,
    })
    .from(renderJobs)
    .where(sql`${renderJobs.status} = 'completed' AND ${renderJobs.renderDurationMs} IS NOT NULL`);

  const averageRenderTime = avgRenderTimeResult[0]?.avg || 0;

  // Get last 24 hours stats
  const last24HoursRendersResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(renderJobs)
    .where(
      sql`${renderJobs.status} = 'completed' AND ${renderJobs.completedAt} > NOW() - INTERVAL '24 hours'`,
    );

  const last24HoursCacheResult = await db
    .select({
      location: cacheAccesses.cacheLocation,
      count: sql<number>`count(*)::int`,
    })
    .from(cacheAccesses)
    .where(sql`${cacheAccesses.accessedAt} > NOW() - INTERVAL '24 hours'`)
    .groupBy(cacheAccesses.cacheLocation);

  let last24HoursCacheHits = 0;
  let last24HoursCacheMisses = 0;

  for (const stat of last24HoursCacheResult) {
    if (stat.location === 'hot' || stat.location === 'cold') {
      last24HoursCacheHits += stat.count;
    } else if (stat.location === 'none') {
      last24HoursCacheMisses += stat.count;
    }
  }

  // Get daily stats for last 7 days
  const dailyStatsResult = await db.execute(sql`
      SELECT
        DATE(accessed_at) as date,
        COUNT(*) as total_accesses,
        SUM(CASE WHEN cache_location IN ('hot', 'cold') THEN 1 ELSE 0 END) as cache_hits,
        SUM(CASE WHEN cache_location = 'none' THEN 1 ELSE 0 END) as cache_misses
      FROM ${cacheAccesses}
      WHERE accessed_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(accessed_at)
      ORDER BY DATE(accessed_at) DESC
    `);

  const dailyStats = (dailyStatsResult.rows as any[]).map(row => ({
    date: row.date,
    renders: Number.parseInt(row.total_accesses, 10),
    cacheHits: Number.parseInt(row.cache_hits, 10),
    cacheMisses: Number.parseInt(row.cache_misses, 10),
  }));

  return success({
    totalRenders,
    totalCacheHits,
    totalCacheMisses,
    cacheHitRate,
    averageRenderTime,
    last24Hours: {
      renders: last24HoursRendersResult[0]?.count || 0,
      cacheHits: last24HoursCacheHits,
      cacheMisses: last24HoursCacheMisses,
    },
    dailyStats,
  });
});
