import { auth } from '@clerk/nextjs/server';
import { apiKeys, cacheAccesses, renderJobs, sites } from '@crawlready/database';
import { and, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get user's sites
    let userSites: Array<{
      id: string;
      domain: string;
      status: 'active' | 'pending' | 'error' | 'suspended';
      displayName: string | null;
    }> = [];

    try {
      userSites = await db
        .select({
          id: sites.id,
          domain: sites.domain,
          status: sites.status,
          displayName: sites.displayName,
        })
        .from(sites)
        .where(
          and(
            orgId ? eq(sites.orgId, orgId) : eq(sites.userId, userId),
            isNull(sites.deletedAt),
          ),
        )
        .orderBy(desc(sites.createdAt));
    } catch {
      // Sites table may not exist yet
      userSites = [];
    }

    // Get user's API keys
    const userApiKeys = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(
        and(
          orgId ? eq(apiKeys.orgId, orgId) : eq(apiKeys.userId, userId),
          eq(apiKeys.isActive, true),
        ),
      );

    const apiKeyIds = userApiKeys.map(k => k.id);

    // Calculate stats
    let rendersToday = 0;
    let rendersYesterday = 0;
    let cacheHits = 0;
    let totalAccesses = 0;
    let aiCrawlersToday = 0;

    if (apiKeyIds.length > 0) {
      // Renders today
      const todayRenders = await db
        .select({ count: sql<number>`count(*)` })
        .from(renderJobs)
        .where(
          and(
            inArray(renderJobs.apiKeyId, apiKeyIds),
            gte(renderJobs.queuedAt, todayStart),
          ),
        );
      rendersToday = Number(todayRenders[0]?.count || 0);

      // Renders yesterday (for comparison)
      const yesterdayRenders = await db
        .select({ count: sql<number>`count(*)` })
        .from(renderJobs)
        .where(
          and(
            inArray(renderJobs.apiKeyId, apiKeyIds),
            gte(renderJobs.queuedAt, yesterdayStart),
            sql`${renderJobs.queuedAt} < ${todayStart}`,
          ),
        );
      rendersYesterday = Number(yesterdayRenders[0]?.count || 0);

      // Cache stats
      const cacheStats = await db
        .select({
          total: sql<number>`count(*)`,
          hits: sql<number>`count(*) FILTER (WHERE ${cacheAccesses.cacheLocation} != 'none')`,
        })
        .from(cacheAccesses)
        .where(
          and(
            inArray(cacheAccesses.apiKeyId, apiKeyIds),
            gte(cacheAccesses.accessedAt, todayStart),
          ),
        );
      totalAccesses = Number(cacheStats[0]?.total || 0);
      cacheHits = Number(cacheStats[0]?.hits || 0);

      // AI crawler visits today (from cache_accesses with crawler_type)
      try {
        const crawlerVisits = await db
          .select({ count: sql<number>`count(DISTINCT ${cacheAccesses.id})` })
          .from(cacheAccesses)
          .where(
            and(
              inArray(cacheAccesses.apiKeyId, apiKeyIds),
              gte(cacheAccesses.accessedAt, todayStart),
              sql`${cacheAccesses.crawlerType} IS NOT NULL AND ${cacheAccesses.crawlerType} != 'direct'`,
            ),
          );
        aiCrawlersToday = Number(crawlerVisits[0]?.count || 0);
      } catch {
        // crawler_type column may not exist yet
        aiCrawlersToday = 0;
      }
    }

    // Calculate health score based on activity
    let healthScore = 0;
    if (userSites.length > 0) {
      const activeSites = userSites.filter(s => s.status === 'active').length;
      const siteScore = (activeSites / userSites.length) * 40;
      const cacheScore = totalAccesses > 0 ? ((cacheHits / totalAccesses) * 30) : 0;
      const activityScore = rendersToday > 0 ? Math.min(30, rendersToday) : 0;
      healthScore = Math.round(siteScore + cacheScore + activityScore);
    }

    // Calculate renders change percentage
    const rendersChange = rendersYesterday > 0
      ? Math.round(((rendersToday - rendersYesterday) / rendersYesterday) * 100)
      : 0;

    // Cache hit rate
    const cacheHitRate = totalAccesses > 0 ? Math.round((cacheHits / totalAccesses) * 100) : 0;

    // Get recent activity (limited to 10)
    let recentActivity: Array<{
      id: string;
      type: 'crawler_visit' | 'render' | 'error' | 'cache_hit';
      crawlerName?: string;
      url: string;
      timestamp: string;
    }> = [];

    if (apiKeyIds.length > 0) {
      const recentRenders = await db
        .select({
          id: renderJobs.id,
          url: renderJobs.url,
          status: renderJobs.status,
          queuedAt: renderJobs.queuedAt,
        })
        .from(renderJobs)
        .where(inArray(renderJobs.apiKeyId, apiKeyIds))
        .orderBy(desc(renderJobs.queuedAt))
        .limit(10);

      recentActivity = recentRenders.map(r => ({
        id: r.id,
        type: r.status === 'failed' ? 'error' : 'render' as const,
        url: r.url,
        timestamp: r.queuedAt.toISOString(),
      }));
    }

    // Integration status
    const isConnected = apiKeyIds.length > 0 && rendersToday > 0;
    const rendersThisWeek = apiKeyIds.length > 0
      ? Number(
          (await db
            .select({ count: sql<number>`count(*)` })
            .from(renderJobs)
            .where(
              and(
                inArray(renderJobs.apiKeyId, apiKeyIds),
                gte(renderJobs.queuedAt, weekAgo),
              ),
            ))[0]?.count || 0,
        )
      : 0;

    // Generate alerts
    const alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      title: string;
      message: string;
      dismissible: boolean;
    }> = [];

    if (apiKeyIds.length === 0) {
      alerts.push({
        id: 'no-api-key',
        type: 'warning',
        title: 'No API Key',
        message: 'Generate an API key to start using CrawlReady.',
        dismissible: false,
      });
    }

    if (cacheHitRate < 50 && totalAccesses > 10) {
      alerts.push({
        id: 'low-cache-rate',
        type: 'info',
        title: 'Low Cache Hit Rate',
        message: `Your cache hit rate is ${cacheHitRate}%. Consider increasing cache TTL.`,
        dismissible: true,
      });
    }

    return NextResponse.json({
      healthScore,
      sites: userSites.map(s => ({
        id: s.id,
        domain: s.domain,
        status: s.status,
        healthScore: s.status === 'active' ? 85 : s.status === 'pending' ? 50 : 20,
      })),
      stats: {
        rendersToday,
        rendersChange,
        cacheHitRate,
        aiCrawlersToday,
        activeAlerts: alerts.length,
      },
      recentActivity,
      alerts,
      integrationStatus: {
        isConnected,
        lastCheck: isConnected ? new Date().toISOString() : null,
        rendersThisWeek,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
