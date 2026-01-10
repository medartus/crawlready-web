/**
 * User Usage Statistics
 *
 * GET /api/user/usage - Get aggregate usage statistics for the authenticated user
 */

import { apiKeys, cacheAccesses, renderJobs } from '@crawlready/database';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import { withErrorHandler } from '@/libs/api-error-handler';
import { success } from '@/libs/api-response-helpers';
import { requireAuth } from '@/libs/clerk-auth';
import { db } from '@/libs/DB';

// Force dynamic rendering - this route uses headers for authentication
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/usage
 * Get usage statistics for the authenticated user
 */
export const GET = withErrorHandler(async () => {
  // Require authentication
  const { userId } = await requireAuth();

  // Get user's API keys
  const userApiKeys = await db
    .select({ id: apiKeys.id })
    .from(apiKeys)
    .where(sql`${apiKeys.userId} = ${userId}`);

  const apiKeyIds = userApiKeys.map(k => k.id);

  if (apiKeyIds.length === 0) {
    // User has no API keys yet
    return success({
      totalRenders: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      cacheHitRate: 0,
      averageRenderTime: 0,
      last24Hours: {
        renders: 0,
        cacheHits: 0,
        cacheMisses: 0,
      },
      dailyStats: [],
    });
  }

  // Get total renders (completed jobs)
  const totalRendersResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(renderJobs)
    .where(
      and(
        eq(renderJobs.status, 'completed'),
        inArray(renderJobs.apiKeyId, apiKeyIds),
      ),
    );

  const totalRenders = totalRendersResult[0]?.count || 0;

  // Get cache hits and misses
  const cacheStatsResult = await db
    .select({
      location: cacheAccesses.cacheLocation,
      count: sql<number>`count(*)::int`,
    })
    .from(cacheAccesses)
    .where(inArray(cacheAccesses.apiKeyId, apiKeyIds))
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
    .where(
      and(
        eq(renderJobs.status, 'completed'),
        isNotNull(renderJobs.renderDurationMs),
        inArray(renderJobs.apiKeyId, apiKeyIds),
      ),
    );

  const averageRenderTime = avgRenderTimeResult[0]?.avg || 0;

  // Get last 24 hours stats
  const last24HoursRendersResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(renderJobs)
    .where(
      and(
        eq(renderJobs.status, 'completed'),
        sql`${renderJobs.completedAt} > NOW() - INTERVAL '24 hours'`,
        inArray(renderJobs.apiKeyId, apiKeyIds),
      ),
    );

  const last24HoursCacheResult = await db
    .select({
      location: cacheAccesses.cacheLocation,
      count: sql<number>`count(*)::int`,
    })
    .from(cacheAccesses)
    .where(
      and(
        sql`${cacheAccesses.accessedAt} > NOW() - INTERVAL '24 hours'`,
        inArray(cacheAccesses.apiKeyId, apiKeyIds),
      ),
    )
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
  // Format array for PostgreSQL ANY() - need to use ARRAY constructor
  const dailyStatsResult = await db.execute(sql`
    SELECT
      DATE(accessed_at) as date,
      COUNT(*) as total_accesses,
      SUM(CASE WHEN cache_location IN ('hot', 'cold') THEN 1 ELSE 0 END) as cache_hits,
      SUM(CASE WHEN cache_location = 'none' THEN 1 ELSE 0 END) as cache_misses
    FROM ${cacheAccesses}
    WHERE accessed_at > NOW() - INTERVAL '7 days'
      AND api_key_id = ANY(${sql.raw(`ARRAY['${apiKeyIds.join('\',\'')}']::uuid[]`)})
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
