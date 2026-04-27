import { SSRFError } from '@crawlready/security';
import { NextResponse } from 'next/server';

import { createFirecrawlProvider } from '@/lib/crawl/firecrawl';
import { CrawlProviderError } from '@/lib/crawl/provider';
import { runScan } from '@/lib/scan/orchestrator';
import { apiError, getClientIp, rateLimitError } from '@/lib/utils/api-helpers';
import { scanRateLimiter } from '@/lib/utils/rate-limit';
import { getBaseUrl } from '@/utils/Helpers';

export async function POST(request: Request) {
  // Rate limit (bypass for local pre-seed scripts)
  const bypassHeader = request.headers.get('x-preseed-key');
  const isPreseedBypass = bypassHeader === 'crawlready-dev-seed' && process.env.NODE_ENV !== 'production';

  let rateLimitRemaining = 0;
  if (!isPreseedBypass) {
    const ip = getClientIp(request);
    const limit = scanRateLimiter.check(ip);
    if (!limit.allowed) {
      return rateLimitError(limit);
    }
    rateLimitRemaining = limit.remaining;
  }

  // Parse body
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_REQUEST', 'Request body must be valid JSON.', 400);
  }

  const { url } = body;
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return apiError('INVALID_REQUEST', 'Missing or empty "url" field.', 400);
  }

  // Run scan
  try {
    const provider = createFirecrawlProvider();
    const result = await runScan(url, provider);

    const baseUrl = getBaseUrl();
    const response = {
      ...result,
      scoreUrl: `${baseUrl}/score/${result.domain}`,
    };

    const res = NextResponse.json(response, {
      status: result.cached ? 200 : 201,
    });
    res.headers.set('X-RateLimit-Remaining', String(rateLimitRemaining));
    res.headers.set('X-RateLimit-Limit', '3');
    return res;
  } catch (error) {
    if (error instanceof CrawlProviderError) {
      return apiError('PROVIDER_ERROR', error.message, 502);
    }

    if (error instanceof SSRFError) {
      return apiError('BLOCKED_URL', 'This URL cannot be scanned for security reasons.', 400);
    }

    if (error instanceof Error && error.message.startsWith('Invalid URL')) {
      return apiError('INVALID_URL', error.message, 400);
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error('Scan error:', error);
    return apiError('INTERNAL_ERROR', errMsg || 'An unexpected error occurred.', 500, {
      ...(process.env.NODE_ENV !== 'production' && { stack: errStack }),
    });
  }
}
