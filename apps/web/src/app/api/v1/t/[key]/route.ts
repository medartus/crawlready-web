/**
 * GET /api/v1/t/[key] — Tracking pixel endpoint for script-tag integration.
 *
 * Returns a 1×1 transparent GIF. When an AI bot loads this <noscript><img>,
 * the request is logged as a crawler visit with source='pixel'.
 *
 * See docs/architecture/analytics-infrastructure.md §Script-Tag Path
 */

import { Buffer } from 'node:buffer';

import { schema } from '@crawlready/database';
import { createLogger } from '@crawlready/logger';
import { eq } from 'drizzle-orm';

import { ingestRateLimiter } from '@/lib/utils/rate-limit';
import { db } from '@/libs/DB';

const log = createLogger({ service: 'tracking-pixel' });

// 1×1 transparent GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const GIF_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': String(TRANSPARENT_GIF.byteLength),
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Expires': '0',
};

// Known AI bots — same list as ingest route
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

const AI_BOTS_REGEX = /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider/i;

type RouteParams = { params: Promise<{ key: string }> };

export async function GET(request: Request, routeParams: RouteParams) {
  const { key: siteKey } = await routeParams.params;
  const gifResponse = new Response(TRANSPARENT_GIF, { headers: GIF_HEADERS });

  // Extract bot from User-Agent
  const ua = request.headers.get('user-agent') ?? '';
  const botMatch = AI_BOTS_REGEX.exec(ua);

  // Only log if this looks like an AI bot
  if (!botMatch) {
    return gifResponse;
  }

  const bot = botMatch[0];
  const isKnownBot = KNOWN_BOTS.has(bot);

  // Rate limit by site key
  const limit = ingestRateLimiter.check(siteKey);
  if (!limit.allowed) {
    return gifResponse;
  }

  // Best-effort async DB write
  void (async () => {
    try {
      const rows = await db
        .select({ id: schema.sites.id })
        .from(schema.sites)
        .where(eq(schema.sites.siteKey, siteKey))
        .limit(1);

      if (rows.length === 0) {
        return; // Invalid key — silently ignore
      }

      const siteId = rows[0]!.id;
      const referer = request.headers.get('referer') ?? '';
      let path = '/';
      try {
        path = new URL(referer).pathname.toLowerCase();
      } catch {
        // Can't parse referer — use root
      }

      await db.insert(schema.crawlerVisits).values({
        siteId,
        path,
        bot,
        source: 'pixel',
        verified: isKnownBot,
        visitedAt: new Date(),
      });
    } catch (err) {
      log.error({ err, siteKey: siteKey.slice(0, 12) }, 'Tracking pixel DB write failed');
    }
  })();

  return gifResponse;
}
