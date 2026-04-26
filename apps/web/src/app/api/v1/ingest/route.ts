import { schema } from '@crawlready/database';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { apiError, rateLimitError } from '@/lib/utils/api-helpers';
import { ingestRateLimiter } from '@/lib/utils/rate-limit';
import { db } from '@/libs/DB';

// Known AI bots allowlist — must match the snippet regex
const KNOWN_BOTS = new Set([
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'Bytespider',
]);

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/v1/ingest — Receive AI crawler visit beacons from customer middleware.
 *
 * Payload: { s: site_key, p: path, b: bot_name, t: timestamp_ms }
 * Auth: site_key (not Clerk)
 * Rate limit: 100 req/s per site key
 * Response: 204 No Content
 */
export async function POST(request: Request) {
  let body: { s?: string; p?: string; b?: string; t?: number };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const { s: siteKey, p: path, b: bot, t: timestamp } = body;

  // Validate required fields
  if (!siteKey || typeof siteKey !== 'string') {
    return apiError('INVALID_SITE_KEY', 'Site key (s) is required.', 400);
  }
  if (!path || typeof path !== 'string') {
    return apiError('INVALID_PATH', 'Path (p) is required.', 400);
  }
  if (!bot || typeof bot !== 'string') {
    return apiError('INVALID_BOT', 'Bot name (b) is required.', 400);
  }
  if (!timestamp || typeof timestamp !== 'number') {
    return apiError('INVALID_TIMESTAMP', 'Timestamp (t) is required.', 400);
  }

  // Validate bot is in the allowlist
  if (!KNOWN_BOTS.has(bot)) {
    return apiError('UNKNOWN_BOT', `Bot "${bot}" is not in the known bot list.`, 400);
  }

  // Validate timestamp drift (replay protection)
  const drift = Math.abs(Date.now() - timestamp);
  if (drift > MAX_TIMESTAMP_DRIFT_MS) {
    return apiError('TIMESTAMP_EXPIRED', 'Timestamp is too far from server time.', 400);
  }

  // Rate limit by site key
  const limit = ingestRateLimiter.check(siteKey);
  if (!limit.allowed) {
    return rateLimitError(limit);
  }

  // Look up site by key
  const rows = await db
    .select({ id: schema.sites.id })
    .from(schema.sites)
    .where(eq(schema.sites.siteKey, siteKey))
    .limit(1);

  if (rows.length === 0) {
    return apiError('INVALID_SITE_KEY', 'Site key not found.', 404);
  }

  const siteId = rows[0]!.id;

  // Insert crawler visit
  await db.insert(schema.crawlerVisits).values({
    siteId,
    path: path.slice(0, 2048), // Truncate long paths
    bot,
    visitedAt: new Date(timestamp),
  });

  return new NextResponse(null, { status: 204 });
}
