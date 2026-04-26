import { NextResponse } from 'next/server';

import { createFirecrawlProvider } from '@/lib/crawl/firecrawl';
import { CrawlProviderError } from '@/lib/crawl/provider';
import { runScan } from '@/lib/scan/orchestrator';
import { scanRateLimiter } from '@/lib/utils/rate-limit';

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return '127.0.0.1';
}

export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIp(request);
  const limit = scanRateLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        code: 'RATE_LIMITED',
        message: 'Too many scan requests. Please try again later.',
        retry_after: limit.retryAfterSeconds,
      },
      { status: 429 },
    );
  }

  // Parse body
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_REQUEST', message: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  const { url } = body;
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return NextResponse.json(
      { code: 'INVALID_REQUEST', message: 'Missing or empty "url" field.' },
      { status: 400 },
    );
  }

  // Run scan
  try {
    const provider = createFirecrawlProvider();
    const result = await runScan(url, provider);

    return NextResponse.json(result, {
      status: result.cached ? 200 : 201,
    });
  } catch (error) {
    if (error instanceof CrawlProviderError) {
      return NextResponse.json(
        { code: 'PROVIDER_ERROR', message: error.message },
        { status: 502 },
      );
    }

    if (error instanceof Error && error.message.startsWith('Invalid URL')) {
      return NextResponse.json(
        { code: 'INVALID_URL', message: error.message },
        { status: 400 },
      );
    }

    console.error('Scan error:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
