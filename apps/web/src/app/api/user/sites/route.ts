import { createHash, randomBytes } from 'node:crypto';

import { auth } from '@clerk/nextjs/server';
import { siteApiKeys, sites, siteStatusHistory } from '@crawlready/database';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';

// Generate a secure API key
function generateApiKey(): { key: string; hash: string; prefix: string; suffix: string } {
  const keyBytes = randomBytes(32);
  const key = `cr_live_${keyBytes.toString('base64url')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 16);
  const suffix = key.substring(key.length - 4);
  return { key, hash, prefix, suffix };
}

// Normalize domain
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .split('/')[0] || '';
}

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSites = await db
      .select({
        id: sites.id,
        domain: sites.domain,
        displayName: sites.displayName,
        status: sites.status,
        statusReason: sites.statusReason,
        frameworkDetected: sites.frameworkDetected,
        frameworkVersion: sites.frameworkVersion,
        rendersCount: sites.rendersCount,
        rendersThisMonth: sites.rendersThisMonth,
        lastRenderAt: sites.lastRenderAt,
        lastCrawlerVisitAt: sites.lastCrawlerVisitAt,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .where(
        and(
          orgId ? eq(sites.orgId, orgId) : eq(sites.userId, userId),
          isNull(sites.deletedAt),
        ),
      )
      .orderBy(desc(sites.createdAt));

    // Get API key prefixes for each site
    const sitesWithKeys = await Promise.all(
      userSites.map(async (site) => {
        const apiKey = await db
          .select({ keyPrefix: siteApiKeys.keyPrefix })
          .from(siteApiKeys)
          .where(
            and(eq(siteApiKeys.siteId, site.id), eq(siteApiKeys.isActive, true)),
          )
          .limit(1);

        return {
          ...site,
          apiKeyPrefix: apiKey[0]?.keyPrefix || null,
        };
      }),
    );

    return NextResponse.json({ sites: sitesWithKeys });
  } catch (error) {
    console.error('Get sites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, displayName, frameworkDetected, frameworkVersion, frameworkConfidence } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const normalizedDomain = normalizeDomain(domain);

    if (!normalizedDomain) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Check if domain already exists for this org
    const existing = await db
      .select({ id: sites.id })
      .from(sites)
      .where(
        and(
          orgId ? eq(sites.orgId, orgId) : eq(sites.userId, userId),
          eq(sites.domain, normalizedDomain),
          isNull(sites.deletedAt),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    }

    // Create the site
    const [newSite] = await db
      .insert(sites)
      .values({
        orgId: orgId || userId,
        userId,
        domain: normalizedDomain,
        displayName: displayName || normalizedDomain,
        status: 'pending',
        frameworkDetected,
        frameworkVersion,
        frameworkConfidence,
        settings: JSON.stringify({
          cacheTtl: 21600,
          enabledCrawlers: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
          excludedPaths: [],
          notifications: {
            emailOnError: true,
            emailOnFirstCrawler: true,
            emailWeeklyDigest: true,
          },
          rendering: {
            waitForSelector: null,
            timeout: 30000,
            blockResources: ['image', 'font'],
          },
        }),
      })
      .returning();

    // Generate API key for the site
    const { key, hash, prefix, suffix } = generateApiKey();

    await db.insert(siteApiKeys).values({
      siteId: newSite!.id,
      keyHash: hash,
      keyPrefix: prefix,
      keySuffix: suffix,
      name: `API Key for ${normalizedDomain}`,
      isActive: true,
    });

    // Record status history
    await db.insert(siteStatusHistory).values({
      siteId: newSite!.id,
      toStatus: 'pending',
      changedBy: userId,
      changeType: 'created',
    });

    return NextResponse.json({
      site: newSite,
      apiKey: key, // Return the full key only once
      message: 'Site created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Create site error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
