import { auth } from '@clerk/nextjs/server';
import { schema } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { and, desc, eq, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError } from '@/lib/utils/api-helpers';
import { db } from '@/libs/DB';

const log = createLogger({ service: 'verify-integration' });

const MAX_POLL_MS = 15_000; // 15 seconds total
const POLL_INTERVAL_MS = 2_000; // Check every 2s
const OUTGOING_TIMEOUT_MS = 5_000; // 5s per synthetic request
const BEACON_LOOKBACK_MS = 30_000; // Look for beacons in last 30s

const verifySchema = z.object({
  site_id: z.string().uuid(),
});

/**
 * POST /api/v1/verify-integration — Send synthetic bot requests to verify integration.
 *
 * 1. Verify site ownership
 * 2. Send HTTP GET with GPTBot UA to user's site
 * 3. Poll crawler_visits for matching beacon within 15s
 * 4. Return success/failure with timing
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
    return apiError('VALIDATION_ERROR', 'Invalid JSON body.', 400);
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid input.', 400);
  }

  const { site_id: siteId } = parsed.data;

  // Verify ownership
  const sites = await db
    .select({
      id: schema.sites.id,
      domain: schema.sites.domain,
      siteKey: schema.sites.siteKey,
    })
    .from(schema.sites)
    .where(
      and(
        eq(schema.sites.id, siteId),
        eq(schema.sites.clerkUserId, userId),
      ),
    )
    .limit(1);

  const site = sites[0];
  if (!site) {
    return apiError('NOT_FOUND', 'Site not found.', 404);
  }

  const startTime = Date.now();
  const testPaths = ['/', '/about'];

  // Send synthetic bot requests (fire and forget — we just need to trigger the middleware)
  const botUserAgent = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)';

  for (const path of testPaths) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OUTGOING_TIMEOUT_MS);

      await fetch(`https://${site.domain}${path}`, {
        method: 'GET',
        headers: { 'User-Agent': botUserAgent },
        signal: controller.signal,
        redirect: 'follow',
      }).catch(() => {
        // Ignore fetch errors — site may be down or firewall-blocked
      }).finally(() => clearTimeout(timeout));
    } catch {
      // Ignore — we'll check for beacons regardless
    }
  }

  log.info({ siteId, domain: site.domain }, 'Synthetic bot requests sent');

  // Poll for beacon
  const cutoff = new Date(startTime - BEACON_LOOKBACK_MS);
  const pollStart = Date.now();

  while (Date.now() - pollStart < MAX_POLL_MS) {
    const visits = await db
      .select({
        bot: schema.crawlerVisits.bot,
        visitedAt: schema.crawlerVisits.visitedAt,
      })
      .from(schema.crawlerVisits)
      .where(
        and(
          eq(schema.crawlerVisits.siteId, siteId),
          gte(schema.crawlerVisits.visitedAt, cutoff),
        ),
      )
      .orderBy(desc(schema.crawlerVisits.visitedAt))
      .limit(1);

    if (visits.length > 0) {
      const latencyMs = Date.now() - startTime;
      const visit = visits[0]!;

      return NextResponse.json({
        verified: true,
        latency_ms: latencyMs,
        bot_detected: visit.bot,
        message: `Integration verified! We received a beacon from ${visit.bot} in ${(latencyMs / 1000).toFixed(1)}s.`,
      });
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  // Timeout — no beacon received
  return NextResponse.json({
    verified: false,
    latency_ms: Date.now() - startTime,
    bot_detected: null,
    message: 'No beacon received within 15 seconds. Check that your integration is deployed and your domain matches.',
  });
}
