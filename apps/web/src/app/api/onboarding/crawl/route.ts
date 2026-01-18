/**
 * POST /api/onboarding/crawl
 *
 * Queues selected pages for pre-rendering during onboarding.
 * Creates site and API key if not already present.
 */

import crypto from 'node:crypto';

import { auth } from '@clerk/nextjs/server';
import { normalizeUrl } from '@crawlready/cache';
import { renderJobQueries } from '@crawlready/database';
import { getRenderQueue } from '@crawlready/queue';
import { validateUrlSecurity } from '@crawlready/security';
import { and, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db, schema } from '@/libs/DB';

export const dynamic = 'force-dynamic';

// Tier limits for onboarding pre-caching
const TIER_LIMITS = {
  free: 5,
  pro: 50,
  enterprise: 500,
} as const;

type Tier = keyof typeof TIER_LIMITS;

/**
 * Get user's tier based on organization subscription
 * For now, default to free tier
 */
function getUserTier(_orgId: string | null): Tier {
  // TODO: Check Stripe subscription for actual tier
  return 'free';
}

/**
 * Generate a secure API key
 */
function generateApiKey(): { fullKey: string; hash: string; prefix: string; suffix: string } {
  const randomBytes = crypto.randomBytes(24);
  const keyBase = randomBytes.toString('base64url');
  const fullKey = `cr_live_${keyBase}`;
  const hash = crypto.createHash('sha256').update(fullKey).digest('hex');
  const prefix = fullKey.substring(0, 15);
  const suffix = fullKey.substring(fullKey.length - 4);

  return { fullKey, hash, prefix, suffix };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, urls, siteId: existingSiteId } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'At least one URL is required' }, { status: 400 });
    }

    // Normalize domain
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '').replace(/\/$/, '');

    // Get user's tier and check limits
    const tier = getUserTier(orgId ?? null);
    const maxPages = TIER_LIMITS[tier];

    if (urls.length > maxPages) {
      return NextResponse.json({
        error: `Your ${tier} tier allows pre-caching up to ${maxPages} pages during onboarding`,
        tier,
        limit: maxPages,
        requested: urls.length,
      }, { status: 400 });
    }

    // Validate all URLs for security
    const validUrls: string[] = [];
    const invalidUrls: string[] = [];

    for (const url of urls) {
      try {
        validateUrlSecurity(url);
        validUrls.push(url);
      } catch {
        invalidUrls.push(url);
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json({
        error: 'No valid URLs provided',
        invalidUrls,
      }, { status: 400 });
    }

    // Get or create site
    let siteId = existingSiteId;
    let _apiKeyId: string;
    let apiKeyFull: string | null = null;

    if (siteId) {
      // Verify site exists and belongs to user
      const existingSite = await db.query.sites.findFirst({
        where: and(
          eq(schema.sites.id, siteId),
          eq(schema.sites.orgId, orgId ?? userId),
          isNull(schema.sites.deletedAt),
        ),
      });

      if (!existingSite) {
        return NextResponse.json({ error: 'Site not found' }, { status: 404 });
      }

      // Get existing API key for this site
      const existingApiKey = await db.query.siteApiKeys.findFirst({
        where: and(
          eq(schema.siteApiKeys.siteId, siteId),
          eq(schema.siteApiKeys.isActive, true),
        ),
      });

      if (!existingApiKey) {
        // Create API key for existing site
        const keyData = generateApiKey();
        apiKeyFull = keyData.fullKey;

        const [newApiKey] = await db
          .insert(schema.siteApiKeys)
          .values({
            siteId,
            keyHash: keyData.hash,
            keyPrefix: keyData.prefix,
            keySuffix: keyData.suffix,
            name: 'Default API Key',
          })
          .returning();

        _apiKeyId = newApiKey!.id;
      } else {
        _apiKeyId = existingApiKey.id;
      }
    } else {
      // Check if site already exists for this domain
      const existingSite = await db.query.sites.findFirst({
        where: and(
          eq(schema.sites.domain, normalizedDomain),
          eq(schema.sites.orgId, orgId ?? userId),
          isNull(schema.sites.deletedAt),
        ),
      });

      if (existingSite) {
        siteId = existingSite.id;

        // Get API key for existing site
        const existingApiKey = await db.query.siteApiKeys.findFirst({
          where: and(
            eq(schema.siteApiKeys.siteId, siteId),
            eq(schema.siteApiKeys.isActive, true),
          ),
        });

        if (existingApiKey) {
          _apiKeyId = existingApiKey.id;
        } else {
          // Create API key
          const keyData = generateApiKey();
          apiKeyFull = keyData.fullKey;

          const [newApiKey] = await db
            .insert(schema.siteApiKeys)
            .values({
              siteId,
              keyHash: keyData.hash,
              keyPrefix: keyData.prefix,
              keySuffix: keyData.suffix,
              name: 'Default API Key',
            })
            .returning();

          _apiKeyId = newApiKey!.id;
        }
      } else {
        // Create new site with API key
        const keyData = generateApiKey();
        apiKeyFull = keyData.fullKey;

        const [newSite] = await db
          .insert(schema.sites)
          .values({
            orgId: orgId ?? userId,
            userId,
            domain: normalizedDomain,
            displayName: normalizedDomain,
            status: 'pending',
            statusReason: 'Onboarding in progress',
          })
          .returning();

        siteId = newSite!.id;

        // Create API key for new site
        const [newApiKey] = await db
          .insert(schema.siteApiKeys)
          .values({
            siteId,
            keyHash: keyData.hash,
            keyPrefix: keyData.prefix,
            keySuffix: keyData.suffix,
            name: 'Default API Key',
          })
          .returning();

        _apiKeyId = newApiKey!.id;

        // Record initial status history
        await db.insert(schema.siteStatusHistory).values({
          siteId,
          toStatus: 'pending',
          reason: 'Site created during onboarding',
          changedBy: userId,
          changeType: 'created',
        });
      }
    }

    // For render jobs, we need an API key in the main api_keys table
    // Create or find one linked to this user
    let renderApiKeyId: string;

    const existingUserApiKey = await db.query.apiKeys.findFirst({
      where: and(
        eq(schema.apiKeys.userId, userId),
        eq(schema.apiKeys.isActive, true),
        orgId ? eq(schema.apiKeys.orgId, orgId) : undefined,
      ),
    });

    if (existingUserApiKey) {
      renderApiKeyId = existingUserApiKey.id;
    } else {
      // Create user-level API key for render jobs
      const keyData = generateApiKey();

      const [newUserApiKey] = await db
        .insert(schema.apiKeys)
        .values({
          userId,
          orgId: orgId ?? null,
          customerEmail: 'onboarding@crawlready.ai', // Placeholder
          keyHash: keyData.hash,
          keyPrefix: keyData.prefix,
          tier,
          rateLimitDaily: TIER_LIMITS[tier] * 10, // Allow some headroom
        })
        .returning();

      renderApiKeyId = newUserApiKey!.id;
    }

    // Queue render jobs for each valid URL
    const renderQueue = getRenderQueue();
    const jobs: Array<{ url: string; jobId: string; status: string }> = [];

    for (const url of validUrls) {
      const normalized = normalizeUrl(url);

      // Check if job already exists for this URL
      const existingJob = await renderJobQueries.findInProgressByUrl(db, normalized);

      if (existingJob) {
        jobs.push({
          url,
          jobId: existingJob.id,
          status: existingJob.status,
        });
        continue;
      }

      // Create new render job
      const job = await renderJobQueries.create(db, {
        apiKeyId: renderApiKeyId,
        url,
        normalizedUrl: normalized,
        status: 'queued',
      });

      // Add to BullMQ queue
      await renderQueue.add('render', {
        jobId: job.id,
        url,
        normalizedUrl: normalized,
        apiKeyId: renderApiKeyId,
        timeout: 30000,
      });

      jobs.push({
        url,
        jobId: job.id,
        status: 'queued',
      });
    }

    return NextResponse.json({
      success: true,
      siteId,
      apiKey: apiKeyFull, // Only returned when newly created
      tier,
      jobs,
      invalidUrls: invalidUrls.length > 0 ? invalidUrls : undefined,
    });
  } catch (error) {
    console.error('Crawl API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}
