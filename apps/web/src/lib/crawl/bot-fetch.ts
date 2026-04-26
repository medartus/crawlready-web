/**
 * Bot-fetch module — direct HTTP requests that simulate AI crawler behaviour.
 *
 * These are made from the API route (no provider cost):
 *   1. GPTBot UA fetch — what non-rendering bots see
 *   2. Content-negotiation probe — Accept: text/markdown
 *   3. llms.txt check — GET {origin}/llms.txt
 */

import { validateUrlSecurity } from '@crawlready/security';

export type BotFetchResult = {
  /** Raw HTML returned when fetched with GPTBot User-Agent */
  botHtml: string;
  /** HTTP status from the bot fetch */
  botStatusCode: number;
  /** Whether the server returned markdown for Accept: text/markdown */
  supportsMarkdownNegotiation: boolean;
  /** Markdown body if content negotiation succeeded, null otherwise */
  negotiatedMarkdown: string | null;
  /** Whether /llms.txt exists and is non-empty */
  hasLlmsTxt: boolean;
  /** Contents of /llms.txt if it exists */
  llmsTxtContent: string | null;
  /** Response headers from the bot fetch (for Link header analysis) */
  responseHeaders: Record<string, string>;
};

const BOT_USER_AGENT = 'GPTBot/1.0 (+https://openai.com/gptbot)';
const CRAWLREADY_USER_AGENT = 'CrawlReady/1.0 (+https://crawlready.app)';
const FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  validateUrlSecurity(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch a URL as GPTBot (no JS rendering — raw HTTP GET).
 */
async function fetchAsBotRaw(url: string): Promise<{ html: string; statusCode: number; headers: Record<string, string> }> {
  try {
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'User-Agent': BOT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return { html, statusCode: res.status, headers };
  } catch {
    return { html: '', statusCode: 0, headers: {} };
  }
}

/**
 * Probe content negotiation — does the server serve markdown when asked?
 */
async function probeMarkdownNegotiation(url: string): Promise<{
  supports: boolean;
  markdown: string | null;
}> {
  try {
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'User-Agent': CRAWLREADY_USER_AGENT,
        'Accept': 'text/markdown, text/plain;q=0.9, text/html;q=0.8',
      },
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') ?? '';
    const body = await res.text();

    if (contentType.includes('text/markdown') || contentType.includes('text/plain')) {
      // Heuristic: if the response doesn't look like HTML, treat it as markdown
      const looksLikeHtml = body.trimStart().startsWith('<!') || body.trimStart().startsWith('<html');
      if (!looksLikeHtml) {
        return { supports: true, markdown: body };
      }
    }

    return { supports: false, markdown: null };
  } catch {
    return { supports: false, markdown: null };
  }
}

/**
 * Check if /llms.txt exists at the origin.
 */
async function checkLlmsTxt(url: string): Promise<{
  exists: boolean;
  content: string | null;
}> {
  try {
    const origin = new URL(url).origin;
    const res = await fetchWithTimeout(`${origin}/llms.txt`, {
      method: 'GET',
      headers: { 'User-Agent': BOT_USER_AGENT },
      redirect: 'follow',
    });

    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        return { exists: true, content: trimmed };
      }
    }

    return { exists: false, content: null };
  } catch {
    return { exists: false, content: null };
  }
}

/**
 * Run all bot-fetch operations for a URL in parallel.
 */
export async function botFetch(url: string): Promise<BotFetchResult> {
  validateUrlSecurity(url);

  const [botResult, mdResult, llmsResult] = await Promise.all([
    fetchAsBotRaw(url),
    probeMarkdownNegotiation(url),
    checkLlmsTxt(url),
  ]);

  return {
    botHtml: botResult.html,
    botStatusCode: botResult.statusCode,
    supportsMarkdownNegotiation: mdResult.supports,
    negotiatedMarkdown: mdResult.markdown,
    hasLlmsTxt: llmsResult.exists,
    llmsTxtContent: llmsResult.content,
    responseHeaders: botResult.headers,
  };
}
