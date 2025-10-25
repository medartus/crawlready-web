import { NextResponse } from 'next/server';

import { analyzeSchema } from '@/libs/crawler-checker/utils/schema-analyzer';

// Configure route to run on Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 },
      );
    }

    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 },
      );
    }

    // Fetch the HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(validUrl.toString(), {
      headers: {
        'User-Agent': 'CrawlReady Schema Checker Bot/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 },
      );
    }

    const html = await response.text();

    // Analyze schema
    const analysis = analyzeSchema(html, validUrl.toString());

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Schema check error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - website took too long to respond' },
          { status: 408 },
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
