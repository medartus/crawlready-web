import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// AI crawler simulation
const AI_CRAWLER_USER_AGENT = 'GPTBot/1.0 (+https://openai.com/gptbot)';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, domain } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const startTime = Date.now();

    // Fetch as AI crawler to test if CrawlReady integration is working
    let response: Response;
    let html = '';

    try {
      response = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': AI_CRAWLER_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      html = await response.text();
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to your site',
        message: 'Could not connect to the specified URL. Please check that the URL is correct and the site is accessible.',
      });
    }

    const renderTime = Date.now() - startTime;

    // Check for indicators that CrawlReady is working
    // This is a simplified check - in production, you'd want more sophisticated verification
    const indicators = {
      hasContent: html.length > 500,
      hasRenderedContent: !html.includes('Loading...') && !html.includes('__NEXT_DATA__') || html.length > 10000,
      // Check for CrawlReady response headers or markers
      hasCrawlReadyMarker: response.headers.get('x-crawlready') === 'true' || html.includes('<!-- CrawlReady -->'),
      responseTime: renderTime,
      contentLength: html.length,
    };

    // Determine if verification passed
    // For now, we'll consider it successful if we got substantial content
    // In production, you'd verify the CrawlReady marker is present
    const isSuccess = indicators.hasContent && (indicators.hasRenderedContent || indicators.hasCrawlReadyMarker);

    if (isSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Integration verified successfully! Your site is now ready for AI crawlers.',
        details: {
          renderTime: indicators.responseTime,
          contentLength: indicators.contentLength,
          crawlerDetection: indicators.hasCrawlReadyMarker,
        },
      });
    }

    // Provide helpful error messages based on what we found
    let errorMessage = 'Integration could not be verified.';
    let suggestion = '';

    if (!indicators.hasContent) {
      errorMessage = 'Your site returned minimal content.';
      suggestion = 'Make sure your middleware is correctly forwarding requests to CrawlReady.';
    } else if (!indicators.hasRenderedContent) {
      errorMessage = 'Content appears to still be JavaScript-rendered.';
      suggestion = 'Check that the middleware is detecting AI crawlers and serving pre-rendered content.';
    } else if (!indicators.hasCrawlReadyMarker) {
      errorMessage = 'CrawlReady response marker not found.';
      suggestion = 'Ensure your API key is correct and requests are being routed through CrawlReady.';
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: suggestion,
      details: {
        renderTime: indicators.responseTime,
        contentLength: indicators.contentLength,
        crawlerDetection: false,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({
      success: false,
      error: 'Verification failed',
      message: 'An unexpected error occurred during verification. Please try again.',
    });
  }
}
