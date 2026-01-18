/**
 * GET /api/user/sites/[siteId]/cached-pages
 *
 * Returns cached pages for a specific site.
 */

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull, like } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db, schema } from '@/libs/DB';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;

    // Verify site belongs to user/org
    const site = await db.query.sites.findFirst({
      where: and(
        eq(schema.sites.id, siteId),
        eq(schema.sites.orgId, orgId ?? userId),
        isNull(schema.sites.deletedAt),
      ),
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Get cached pages for this site's domain
    const domain = site.domain;
    const pages = await db
      .select({
        id: schema.renderedPages.id,
        normalizedUrl: schema.renderedPages.normalizedUrl,
        htmlSizeBytes: schema.renderedPages.htmlSizeBytes,
        lastAccessedAt: schema.renderedPages.lastAccessedAt,
        accessCount: schema.renderedPages.accessCount,
        inRedis: schema.renderedPages.inRedis,
      })
      .from(schema.renderedPages)
      .where(like(schema.renderedPages.normalizedUrl, `%${domain}%`))
      .orderBy(schema.renderedPages.accessCount)
      .limit(100);

    return NextResponse.json({
      pages,
      count: pages.length,
    });
  } catch (error) {
    console.error('Get cached pages error:', error);
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}
