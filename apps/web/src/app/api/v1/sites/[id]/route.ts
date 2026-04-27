import { auth } from '@clerk/nextjs/server';
import { schema } from '@crawlready/database';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/utils/api-helpers';
import { getSnippets } from '@/lib/utils/snippets';
import { db } from '@/libs/DB';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/sites/[id] — Get a single site's details
 */
export async function GET(_request: Request, routeParams: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { id } = await routeParams.params;

  const rows = await db
    .select()
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, id),
        eq(schema.sites.clerkUserId, userId),
      ),
    )
    .limit(1);

  const site = rows[0];
  if (!site) {
    return apiError('NOT_FOUND', 'Site not found.', 404);
  }

  return NextResponse.json({
    id: site.id,
    domain: site.domain,
    site_key: site.siteKey,
    tier: site.tier,
    created_at: site.createdAt.toISOString(),
    snippet: getSnippets(site.siteKey),
  });
}

/**
 * DELETE /api/v1/sites/[id] — Delete a site (cascades to crawler_visits)
 */
export async function DELETE(_request: Request, routeParams: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { id } = await routeParams.params;

  // Verify ownership before deleting
  const rows = await db
    .select({ id: schema.sites.id })
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, id),
        eq(schema.sites.clerkUserId, userId),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    return apiError('NOT_FOUND', 'Site not found.', 404);
  }

  await db
    .delete(schema.sites)
    .where(eq(schema.sites.id, id));

  return new NextResponse(null, { status: 204 });
}
