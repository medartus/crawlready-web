import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Framework detection patterns
const FRAMEWORK_PATTERNS = [
  { name: 'Next.js', patterns: ['__NEXT_DATA__', '_next/', 'next/'], confidence: 'high' as const },
  { name: 'Nuxt.js', patterns: ['__NUXT__', '_nuxt/', 'nuxt/'], confidence: 'high' as const },
  { name: 'React', patterns: ['react', 'reactDOM', '_reactRootContainer'], confidence: 'medium' as const },
  { name: 'Vue.js', patterns: ['__vue__', 'Vue.', 'v-cloak'], confidence: 'medium' as const },
  { name: 'Angular', patterns: ['ng-version', 'ng-app', 'angular'], confidence: 'medium' as const },
  { name: 'Svelte', patterns: ['svelte', '__svelte'], confidence: 'medium' as const },
  { name: 'Gatsby', patterns: ['___gatsby', 'gatsby-'], confidence: 'high' as const },
  { name: 'Remix', patterns: ['__remix', 'remix-'], confidence: 'high' as const },
];

// AI crawler simulation
const AI_CRAWLER_USER_AGENT = 'GPTBot/1.0 (+https://openai.com/gptbot)';

function detectFramework(html: string): { name: string | null; version: string | null; confidence: 'high' | 'medium' | 'low' | null } {
  const htmlLower = html.toLowerCase();

  for (const framework of FRAMEWORK_PATTERNS) {
    for (const pattern of framework.patterns) {
      if (htmlLower.includes(pattern.toLowerCase())) {
        // Try to extract version from common patterns
        let version: string | null = null;

        // Next.js version detection
        if (framework.name === 'Next.js') {
          const versionMatch = html.match(/next@(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            version = versionMatch[1] || null;
          }
        }

        // React version detection
        if (framework.name === 'React') {
          const versionMatch = html.match(/react@(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            version = versionMatch[1] || null;
          }
        }

        return { name: framework.name, version, confidence: framework.confidence };
      }
    }
  }

  return { name: null, version: null, confidence: null };
}

function analyzeVisibility(userHtml: string, crawlerHtml: string): {
  problems: Array<{ type: 'critical' | 'warning' | 'info'; title: string; description: string }>;
  scores: { aiVisibility: number; contentAccessibility: number; structuredData: number };
  contentDifference: number;
} {
  const problems: Array<{ type: 'critical' | 'warning' | 'info'; title: string; description: string }> = [];

  // Calculate content sizes (text content only)
  const getTextContent = (html: string): string => {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const userText = getTextContent(userHtml);
  const crawlerText = getTextContent(crawlerHtml);

  // Calculate content difference
  const contentDifference = userText.length > 0
    ? Math.round(((userText.length - crawlerText.length) / userText.length) * 100)
    : 0;

  // Critical: Major content missing
  if (contentDifference > 50) {
    problems.push({
      type: 'critical',
      title: 'Most content is invisible to AI crawlers',
      description: `${contentDifference}% of your content is rendered via JavaScript and not visible to AI crawlers. This significantly impacts your AI search visibility.`,
    });
  } else if (contentDifference > 20) {
    problems.push({
      type: 'warning',
      title: 'Some content is JavaScript-rendered',
      description: `${contentDifference}% of your content requires JavaScript to render. AI crawlers may miss this content.`,
    });
  }

  // Check for common issues
  if (!crawlerHtml.includes('<title>') || crawlerHtml.match(/<title>\s*<\/title>/)) {
    problems.push({
      type: 'warning',
      title: 'Missing or empty title tag',
      description: 'AI crawlers rely on title tags to understand page content. Add a descriptive title.',
    });
  }

  if (!crawlerHtml.includes('<meta name="description"')) {
    problems.push({
      type: 'info',
      title: 'Missing meta description',
      description: 'Adding a meta description helps AI understand your page content.',
    });
  }

  // Check for structured data
  const hasStructuredData = crawlerHtml.includes('application/ld+json') || crawlerHtml.includes('itemtype=');
  if (!hasStructuredData) {
    problems.push({
      type: 'info',
      title: 'No structured data found',
      description: 'Adding JSON-LD structured data helps AI crawlers understand your content better.',
    });
  }

  // Calculate scores
  const aiVisibility = Math.max(0, 100 - contentDifference);
  const contentAccessibility = crawlerText.length > 100 ? Math.min(100, Math.round((crawlerText.length / Math.max(userText.length, 1)) * 100)) : 20;
  const structuredData = hasStructuredData ? 80 : 20;

  return { problems, scores: { aiVisibility, contentAccessibility, structuredData }, contentDifference };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
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

    // Fetch as regular user
    let userHtml = '';
    let crawlerHtml = '';

    try {
      const userResponse = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      userHtml = await userResponse.text();
    } catch {
      return NextResponse.json({
        error: 'Failed to fetch URL',
        message: 'Could not connect to the specified URL. Please check that the URL is correct and the site is accessible.',
      }, { status: 400 });
    }

    // Fetch as AI crawler
    try {
      const crawlerResponse = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': AI_CRAWLER_USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      crawlerHtml = await crawlerResponse.text();
    } catch {
      // If crawler fetch fails, use same as user (no special handling)
      crawlerHtml = userHtml;
    }

    // Detect framework
    const framework = detectFramework(userHtml);

    // Analyze visibility
    const analysis = analyzeVisibility(userHtml, crawlerHtml);

    return NextResponse.json({
      url,
      domain,
      framework,
      problems: analysis.problems,
      scores: analysis.scores,
      rendering: {
        userViewHtml: userHtml.substring(0, 5000), // Truncate for response
        crawlerViewHtml: crawlerHtml.substring(0, 5000),
        contentDifference: analysis.contentDifference,
      },
    });
  } catch (error) {
    console.error('Analyze URL error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
