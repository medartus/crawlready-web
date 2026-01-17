import { auth } from '@clerk/nextjs/server';
import { apiKeys, cacheAccesses } from '@crawlready/database';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));
    const crawlerType = searchParams.get('crawlerType');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

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

    if (apiKeyIds.length === 0) {
      return NextResponse.json({
        activity: [],
        pagination: { currentPage: page, totalPages: 0, totalItems: 0, itemsPerPage: limit },
      });
    }

    // Build where conditions for cache_accesses
    const conditions = [sql`${cacheAccesses.apiKeyId} = ANY(${apiKeyIds})`];

    if (crawlerType && crawlerType !== 'all') {
      conditions.push(sql`${cacheAccesses.crawlerType} = ${crawlerType}`);
    }

    if (search) {
      conditions.push(ilike(cacheAccesses.normalizedUrl, `%${search}%`));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cacheAccesses)
      .where(and(...conditions));

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Get activity with pagination
    const offset = (page - 1) * limit;

    const activity = await db
      .select({
        id: cacheAccesses.id,
        url: cacheAccesses.normalizedUrl,
        cacheLocation: cacheAccesses.cacheLocation,
        responseTimeMs: cacheAccesses.responseTimeMs,
        timestamp: cacheAccesses.accessedAt,
        crawlerName: sql<string | null>`${cacheAccesses.crawlerName}`,
        crawlerType: sql<string | null>`${cacheAccesses.crawlerType}`,
      })
      .from(cacheAccesses)
      .where(and(...conditions))
      .orderBy(desc(cacheAccesses.accessedAt))
      .limit(limit)
      .offset(offset);

    // Transform to activity items
    const activityItems = activity.map((item) => {
      let activityType: 'crawler_visit' | 'render' | 'cache_hit' | 'cache_miss' | 'error' = 'cache_hit';

      if (item.crawlerType && item.crawlerType !== 'direct') {
        activityType = 'crawler_visit';
      } else if (item.cacheLocation === 'none') {
        activityType = 'cache_miss';
      }

      return {
        id: item.id,
        type: activityType,
        crawlerName: item.crawlerName,
        crawlerType: item.crawlerType,
        url: item.url,
        siteId: null,
        siteDomain: null,
        responseTimeMs: item.responseTimeMs,
        timestamp: item.timestamp.toISOString(),
        status: 'success' as const,
        errorMessage: null,
      };
    });

    // Filter by activity type if specified
    let filteredActivity = activityItems;
    if (type && type !== 'all') {
      filteredActivity = activityItems.filter(a => a.type === type);
    }

    return NextResponse.json({
      activity: filteredActivity,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
