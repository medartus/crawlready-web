import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  discoverSitemap,
  ensureHomepage,
  filterByDomain,
  parseSitemap,
  sortByPriority,
} from '@/libs/sitemap';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sitemapUrl, domain } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // If no sitemap URL provided, try to discover one
    let resolvedSitemapUrl = sitemapUrl;
    if (!resolvedSitemapUrl) {
      resolvedSitemapUrl = await discoverSitemap(domain);
      if (!resolvedSitemapUrl) {
        // No sitemap found - return just homepage
        return NextResponse.json({
          pages: [{ url: `https://${domain}/`, priority: 1.0 }],
          count: 1,
          sitemapUrl: null,
          discovered: false,
          errors: [],
        });
      }
    }

    // Validate sitemap URL format
    let parsedSitemapUrl: URL;
    try {
      parsedSitemapUrl = new URL(resolvedSitemapUrl);
    } catch {
      return NextResponse.json({
        error: 'Invalid sitemap URL format',
      }, { status: 400 });
    }

    // Parse the sitemap
    const result = await parseSitemap(parsedSitemapUrl.href);

    if (result.count === 0 && result.errors.length > 0) {
      return NextResponse.json({
        error: 'Failed to parse sitemap',
        details: result.errors,
      }, { status: 400 });
    }

    // Filter to only include pages from the target domain
    let pages = filterByDomain(result.pages, domain);

    // Sort by priority (highest first)
    pages = sortByPriority(pages);

    // Ensure homepage is included and at top
    pages = ensureHomepage(pages, domain);

    return NextResponse.json({
      pages,
      count: pages.length,
      sitemapUrl: resolvedSitemapUrl,
      discovered: !sitemapUrl, // True if we discovered the sitemap
      isSitemapIndex: result.isSitemapIndex,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Parse sitemap error:', error);
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 });
  }
}
