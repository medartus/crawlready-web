import { randomBytes } from 'node:crypto';

import { auth } from '@clerk/nextjs/server';
import { schema } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { and, count, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { apiError } from '@/lib/utils/api-helpers';
import { getSnippets } from '@/lib/utils/snippets';
import { createSiteSchema } from '@/lib/validations/sites';
import { db } from '@/libs/DB';

const _log = createLogger({ service: 'sites' });

const MAX_SITES_PER_USER = 10;

function generateSiteKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(12);
  let key = 'cr_live_';
  for (let i = 0; i < 12; i++) {
    key += chars[bytes[i]! % chars.length];
  }
  return key;
}

function normalizeDomain(input: string): string | null {
  let raw = input.trim().toLowerCase();

  // Strip protocol if present
  raw = raw.replace(/^https?:\/\//, '');
  // Strip path, query, hash
  raw = raw.split('/')[0]!.split('?')[0]!.split('#')[0]!;
  // Strip www. prefix
  raw = raw.replace(/^www\./, '');
  // Strip trailing dots
  raw = raw.replace(/\.+$/, '');

  // Basic domain validation: at least one dot, no spaces
  if (!raw || !raw.includes('.') || /\s/.test(raw) || raw.length > 253) {
    return null;
  }

  return raw;
}

/**
 * POST /api/v1/sites — Register a new site
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('INVALID_DOMAIN', parsed.error.issues[0]?.message ?? 'Invalid input.', 400);
  }

  const domain = normalizeDomain(parsed.data.domain);
  if (!domain) {
    return apiError('INVALID_DOMAIN', 'Please enter a valid domain (e.g. example.com).', 400);
  }

  // Check per-user site limit
  const [countResult] = await db
    .select({ count: count() })
    .from(schema.sites)
    .where(eq(schema.sites.clerkUserId, userId));

  if ((countResult?.count ?? 0) >= MAX_SITES_PER_USER) {
    return apiError('LIMIT_REACHED', `You can register up to ${MAX_SITES_PER_USER} sites.`, 409);
  }

  // Check duplicate domain for this user
  const existing = await db
    .select({ id: schema.sites.id })
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.clerkUserId, userId),
        eq(schema.sites.domain, domain),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return apiError('ALREADY_EXISTS', `${domain} is already registered.`, 409);
  }

  const siteKey = generateSiteKey();

  const [site] = await db
    .insert(schema.sites)
    .values({
      clerkUserId: userId,
      domain,
      siteKey,
    })
    .returning();

  return NextResponse.json(
    {
      id: site!.id,
      domain: site!.domain,
      site_key: site!.siteKey,
      created_at: site!.createdAt.toISOString(),
      snippet: getSnippets(site!.siteKey),
    },
    { status: 201 },
  );
}

/**
 * GET /api/v1/sites — List the current user's registered sites
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return apiError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: schema.sites.id,
      domain: schema.sites.domain,
      siteKey: schema.sites.siteKey,
      createdAt: schema.sites.createdAt,
      visitCount30d: sql<number>`COALESCE((
        SELECT COUNT(*)::int FROM crawler_visits
        WHERE site_id = ${schema.sites.id}
        AND visited_at >= ${thirtyDaysAgo.toISOString()}
      ), 0)`,
      lastBeaconAt: sql<string | null>`(
        SELECT MAX(visited_at)::text FROM crawler_visits
        WHERE site_id = ${schema.sites.id}
      )`,
    })
    .from(schema.sites)
    .where(eq(schema.sites.clerkUserId, userId))
    .orderBy(schema.sites.createdAt);

  return NextResponse.json({
    sites: rows.map(r => ({
      id: r.id,
      domain: r.domain,
      site_key: r.siteKey,
      created_at: r.createdAt.toISOString(),
      visit_count_30d: r.visitCount30d,
      last_beacon_at: r.lastBeaconAt ?? null,
    })),
  });
}
