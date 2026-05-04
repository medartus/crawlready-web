import { auth } from '@clerk/nextjs/server';
import { schema } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { siteKeyCache } from '@/lib/cache/site-key-cache';
import { apiError } from '@/lib/utils/api-helpers';
import { getSnippets } from '@/lib/utils/snippets';
import { updateSiteSchema } from '@/lib/validations/sites';
import { db } from '@/libs/DB';

const _log = createLogger({ service: 'sites-detail' });

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
    .select({
      id: schema.sites.id,
      domain: schema.sites.domain,
      siteKey: schema.sites.siteKey,
      tier: schema.sites.tier,
      createdAt: schema.sites.createdAt,
      lastBeaconAt: sql<string | null>`(
        SELECT MAX(visited_at)::text FROM crawler_visits
        WHERE site_id = ${schema.sites.id}
      )`,
      totalVisits: sql<number>`COALESCE((
        SELECT COUNT(*)::int FROM crawler_visits
        WHERE site_id = ${schema.sites.id}
      ), 0)`,
    })
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
    last_beacon_at: site.lastBeaconAt ?? null,
    total_visits: site.totalVisits,
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

  // Get site key for cache invalidation before deleting
  const siteToDelete = await db
    .select({ siteKey: schema.sites.siteKey })
    .from(schema.sites)
    .where(eq(schema.sites.id, id))
    .limit(1);

  await db
    .delete(schema.sites)
    .where(eq(schema.sites.id, id));

  // Invalidate LRU cache
  if (siteToDelete[0]?.siteKey) {
    siteKeyCache.delete(siteToDelete[0].siteKey);
  }

  return new NextResponse(null, { status: 204 });
}

/**
 * PATCH /api/v1/sites/[id] — Update a site's settings
 */
export async function PATCH(request: Request, routeParams: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { id } = await routeParams.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const parsed = updateSiteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.', 400);
  }

  // Build update fields
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (parsed.data.integration_method) {
    updates.integrationMethod = parsed.data.integration_method;
  }

  // Verify ownership and update
  const rows = await db
    .update(schema.sites)
    .set(updates)
    .where(
      and(
        eq(schema.sites.id, id),
        eq(schema.sites.clerkUserId, userId),
      ),
    )
    .returning({
      id: schema.sites.id,
      domain: schema.sites.domain,
      siteKey: schema.sites.siteKey,
      tier: schema.sites.tier,
      integrationMethod: schema.sites.integrationMethod,
      createdAt: schema.sites.createdAt,
      updatedAt: schema.sites.updatedAt,
    });

  const site = rows[0];
  if (!site) {
    return apiError('NOT_FOUND', 'Site not found.', 404);
  }

  return NextResponse.json({
    id: site.id,
    domain: site.domain,
    site_key: site.siteKey,
    tier: site.tier,
    integration_method: site.integrationMethod,
    created_at: site.createdAt.toISOString(),
    updated_at: site.updatedAt.toISOString(),
    snippet: getSnippets(site.siteKey),
  });
}
