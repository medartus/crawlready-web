/**
 * Middleware snippet templates for AI crawler tracking.
 * Each snippet embeds the user's site_key and sends visit data
 * to the CrawlReady ingest endpoint.
 */

const INGEST_URL = 'https://crawlready.app/api/v1/ingest';

const AI_BOTS_REGEX = 'GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|Meta-ExternalAgent|Bytespider';

export function getSnippets(siteKey: string): Record<string, string> {
  return {
    nextjs: `// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOTS = /${AI_BOTS_REGEX}/i;

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('${INGEST_URL}', {
      method: 'POST',
      body: JSON.stringify({ s: '${siteKey}', p: request.nextUrl.pathname, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  return NextResponse.next();
}`,

    express: `// app.js
const AI_BOTS = /${AI_BOTS_REGEX}/i;

app.use((req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (AI_BOTS.test(ua)) {
    const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
    fetch('${INGEST_URL}', {
      method: 'POST',
      body: JSON.stringify({ s: '${siteKey}', p: req.path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
  next();
});`,

    cloudflare: `// worker.js
const AI_BOTS = /${AI_BOTS_REGEX}/i;

export default {
  async fetch(request, env) {
    const ua = request.headers.get('user-agent') || '';
    if (AI_BOTS.test(ua)) {
      const bot = ua.match(AI_BOTS)?.[0] || 'unknown';
      const url = new URL(request.url);
      env.waitUntil(fetch('${INGEST_URL}', {
        method: 'POST',
        body: JSON.stringify({ s: '${siteKey}', p: url.pathname, b: bot, t: Date.now() }),
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {}));
    }
    return fetch(request);
  }
};`,

    generic: `// Any JS runtime
const AI_BOTS = /${AI_BOTS_REGEX}/i;

function reportAiCrawler(userAgent, path) {
  if (AI_BOTS.test(userAgent)) {
    const bot = userAgent.match(AI_BOTS)?.[0] || 'unknown';
    fetch('${INGEST_URL}', {
      method: 'POST',
      body: JSON.stringify({ s: '${siteKey}', p: path, b: bot, t: Date.now() }),
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  }
}`,
  };
}
