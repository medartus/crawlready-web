import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CRAWLER_USER_AGENTS: Record<string, string> = {
  'GPTBot': 'GPTBot/1.0 (+https://openai.com/gptbot)',
  'ClaudeBot': 'ClaudeBot/1.0 (+https://anthropic.com/bot)',
  'PerplexityBot': 'PerplexityBot/1.0',
  'Google-Extended': 'Google-Extended',
  'Googlebot': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Bingbot': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url, crawler = 'GPTBot' } = body;

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

    const userAgent = CRAWLER_USER_AGENTS[crawler] || CRAWLER_USER_AGENTS.GPTBot;
    const startTime = Date.now();

    // Fetch the URL as the specified crawler
    let html = '';
    try {
      const response = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      html = await response.text();
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to fetch URL',
        message: 'Could not connect to the specified URL. Please check that the URL is correct and the site is accessible.',
      }, { status: 400 });
    }

    const renderTimeMs = Date.now() - startTime;

    // Check if this looks like a cached CrawlReady response
    const cached = html.includes('<!-- CrawlReady -->') || html.includes('x-crawlready');

    return NextResponse.json({
      url: parsedUrl.href,
      html,
      renderTimeMs,
      htmlSizeBytes: new TextEncoder().encode(html).length,
      cached,
      crawlerUsed: crawler,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test render error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
