import { KNOWN_BOTS } from '@crawlready/core';
import { schema } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { siteKeyCache } from '@/lib/cache/site-key-cache';
import { ingestRateLimiter } from '@/lib/utils/rate-limit';
import { ingestSchema } from '@/lib/validations/ingest';
import { db } from '@/libs/DB';

const log = createLogger({ service: 'ingest' });

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

// Silent 204 — per analytics-infrastructure.md, never leak info on invalid inputs
const SILENT_204 = new NextResponse(null, { status: 204 });

/**
 * Normalize a URL path per analytics-infrastructure.md Step 6:
 * - Lowercase
 * - Strip trailing slash (except root)
 * - Remove query params and fragments
 * - Truncate to 2048 chars
 */
function normalizePath(raw: string): string {
  let p = raw;
  // Remove fragment
  const hashIdx = p.indexOf('#');
  if (hashIdx !== -1) {
    p = p.slice(0, hashIdx);
  }
  // Remove query params
  const qIdx = p.indexOf('?');
  if (qIdx !== -1) {
    p = p.slice(0, qIdx);
  }
  // Lowercase
  p = p.toLowerCase();
  // Strip trailing slash (keep root /)
  if (p.length > 1 && p.endsWith('/')) {
    p = p.slice(0, -1);
  }
  // Truncate
  return p.slice(0, 2048);
}

/**
 * POST /api/v1/ingest — Receive AI crawler visit beacons.
 *
 * Payload: { s: site_key, p: path, b: bot_name, t: timestamp_ms, src?: source }
 * Auth: site_key (not Clerk)
 * Rate limit: 100 req/s per site key
 * Response: 204 No Content (always — silent reject on errors per spec)
 *
 * See docs/architecture/analytics-infrastructure.md §Shared Processing Pipeline
 */
export async function POST(request: Request) {
  // Step 1: Parse & normalize input
  let body: { s?: string; p?: string; b?: string; t?: number; src?: string };
  try {
    body = await request.json();
  } catch {
    return SILENT_204; // Malformed JSON — silent reject
  }

  // Step 1: Zod validation
  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return SILENT_204;
  }

  const { s: siteKey, p: rawPath, b: bot, t: timestamp, src: source } = parsed.data;

  // Step 2: Validate bot — accept unknown bots as unverified
  const isKnownBot = KNOWN_BOTS.has(bot);
  // Sanitize bot name (prevent injection, limit length)
  const sanitizedBot = bot.replace(/[^\w.\-/]/g, '').slice(0, 64);
  if (!sanitizedBot) {
    return SILENT_204;
  }

  // Step 3: Validate timestamp (replay protection)
  const drift = Math.abs(Date.now() - timestamp);
  if (drift > MAX_TIMESTAMP_DRIFT_MS) {
    return SILENT_204;
  }

  // Step 5: Rate limit by site key
  const limit = ingestRateLimiter.check(siteKey);
  if (!limit.allowed) {
    return SILENT_204; // Silent rate limit per spec
  }

  // Step 4: Site key lookup (LRU cache → DB fallback)
  let siteId: string;
  const cached = siteKeyCache.get(siteKey);
  if (cached) {
    siteId = cached.siteId;
  } else {
    try {
      const rows = await db
        .select({ id: schema.sites.id })
        .from(schema.sites)
        .where(eq(schema.sites.siteKey, siteKey))
        .limit(1);

      if (rows.length === 0) {
        return SILENT_204; // Invalid key — silent reject per spec
      }
      siteId = rows[0]!.id;
      siteKeyCache.set(siteKey, siteId);
    } catch (err) {
      log.warn({ err, siteKey: siteKey.slice(0, 12) }, 'Site key lookup failed');
      return SILENT_204;
    }
  }

  // Step 6: Path normalization
  const path = normalizePath(rawPath);

  // Validate source field
  const validSources = new Set(['middleware', 'js', 'pixel']);
  const normalizedSource = source && validSources.has(source) ? source : 'middleware';

  // Step 8: Return response BEFORE database write (per spec)
  // Step 9: Async DB write (best-effort, at-most-once, fire-and-forget)
  // Read correlation ID from request header (injected by middleware)
  const correlationId = request.headers.get('x-correlation-id') ?? 'unknown';

  void db.insert(schema.crawlerVisits).values({
    siteId,
    path,
    bot: sanitizedBot,
    source: normalizedSource,
    verified: isKnownBot,
    visitedAt: new Date(timestamp),
  }).catch((err) => {
    log.error({ err, siteId, bot: sanitizedBot, path, correlationId }, 'Ingest DB write failed');
  });

  return SILENT_204;
}
