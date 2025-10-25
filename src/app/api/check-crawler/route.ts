import { NextResponse } from 'next/server';

import { crawlerCheckerService } from '@/libs/CrawlerCheckerService';
import type { CheckCrawlerRequest, CheckCrawlerResponse } from '@/types/crawler-checker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Add CORS headers for development
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json() as CheckCrawlerRequest;
    const { url } = body;

    // Validate input
    if (!url) {
      return NextResponse.json<CheckCrawlerResponse>(
        {
          success: false,
          error: 'URL is required',
        },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json<CheckCrawlerResponse>(
          {
            success: false,
            error: 'URL must use HTTP or HTTPS protocol',
          },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json<CheckCrawlerResponse>(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 },
      );
    }

    // Check the URL
    const report = await crawlerCheckerService.checkUrl(url);

    return NextResponse.json<CheckCrawlerResponse>({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Crawler check error:', error);
    return NextResponse.json<CheckCrawlerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
