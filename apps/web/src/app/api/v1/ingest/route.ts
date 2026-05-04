import { KNOWN_BOTS } from '@crawlready/core';
import { schema } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { eq } from 'drizzle-orm';
import { after, NextResponse } from 'next/server';

import { dedupCache } from '@/lib/cache/dedup-cache';
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
 * 9-step pipeline — see docs/architecture/analytics-infrastructure.md
 *   1. Parse & validate input (Zod)
 *   2. Validate bot name
 *   3. Timestamp replay protection
 *   4. Site key lookup (LRU cache → DB)
 *   5. Rate limit by site key
 *   6. Path normalization
 *   7. Dedup check (1s window)
 *   8. Return 204 immediately
 *   9. Async DB write via after()
 */
export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') ?? 'unknown';

  // ── Step 1: Parse & validate input ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    log.debug({ correlationId, step: 'parse' }, 'Rejected: malformed JSON');
    return SILENT_204;
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    log.debug({ correlationId, step: 'validate' }, 'Rejected: schema validation failed');
    return SILENT_204;
  }

  const { s: siteKey, p: rawPath, b: bot, t: timestamp, src: source } = parsed.data;

  // ── Step 2: Validate bot name ──
  const sanitizedBot = bot.replace(/[^\w.\-/]/g, '').slice(0, 64);
  if (!sanitizedBot) {
    log.debug({ correlationId, step: 'bot' }, 'Rejected: empty bot name after sanitization');
    return SILENT_204;
  }
  const isKnownBot = KNOWN_BOTS.has(bot);

  // ── Step 3: Timestamp replay protection ──
  const drift = Math.abs(Date.now() - timestamp);
  if (drift > MAX_TIMESTAMP_DRIFT_MS) {
    log.debug({ correlationId, step: 'timestamp', drift }, 'Rejected: timestamp drift');
    return SILENT_204;
  }

  // ── Step 4: Site key lookup (LRU cache → DB fallback) ──
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
        log.debug({ correlationId, step: 'site-key' }, 'Rejected: unknown site key');
        return SILENT_204;
      }
      siteId = rows[0]!.id;
      siteKeyCache.set(siteKey, siteId);
    } catch (err) {
      log.warn({ err, correlationId, step: 'site-key', siteKey: siteKey.slice(0, 12) }, 'Site key lookup failed');
      return SILENT_204;
    }
  }

  // ── Step 5: Rate limit by site key ──
  const limit = ingestRateLimiter.check(siteKey);
  if (!limit.allowed) {
    log.debug({ correlationId, step: 'rate-limit', siteKey: siteKey.slice(0, 12) }, 'Rejected: rate limited');
    return SILENT_204;
  }

  // ── Step 6: Path normalization ──
  const path = normalizePath(rawPath);
  const validSources = new Set(['middleware', 'js', 'pixel']);
  const normalizedSource = source && validSources.has(source) ? source : 'middleware';

  // ── Step 7: Dedup check (1s window) ──
  if (dedupCache.isDuplicate(siteKey, path, sanitizedBot)) {
    log.debug({ correlationId, step: 'dedup', siteKey: siteKey.slice(0, 12) }, 'Rejected: duplicate beacon');
    return SILENT_204;
  }

  // ── Step 8: Return 204 immediately ──
  // ── Step 9: Async DB write via after() ──
  after(async () => {
    try {
      await db.insert(schema.crawlerVisits).values({
        siteId,
        path,
        bot: sanitizedBot,
        source: normalizedSource,
        verified: isKnownBot,
        visitedAt: new Date(timestamp),
      });
    } catch (err) {
      log.error({ err, correlationId, step: 'db-write', siteId, bot: sanitizedBot, path }, 'Ingest DB write failed');
    }
  });

  return SILENT_204;
}
