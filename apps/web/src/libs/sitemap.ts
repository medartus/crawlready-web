/**
 * Sitemap XML Parser
 *
 * Parses standard sitemap.xml format and sitemap index files.
 * Extracts URLs with optional priority and lastmod metadata.
 */

export type SitemapEntry = {
  url: string;
  priority?: number;
  lastmod?: string;
};

export type ParseSitemapResult = {
  pages: SitemapEntry[];
  count: number;
  isSitemapIndex: boolean;
  errors: string[];
};

const SITEMAP_FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_SITEMAP_SIZE = 50 * 1024 * 1024; // 50MB max
const MAX_URLS_PER_SITEMAP = 50000; // Standard sitemap limit

/**
 * Fetches content from a URL with timeout and size limits
 */
async function fetchWithLimits(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SITEMAP_FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CrawlReady-Bot/1.0 (sitemap parser)',
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_SITEMAP_SIZE) {
      throw new Error('Sitemap too large (max 50MB)');
    }

    const text = await response.text();
    if (text.length > MAX_SITEMAP_SIZE) {
      throw new Error('Sitemap content too large (max 50MB)');
    }

    return text;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Sitemap fetch timeout (10s limit)');
    }
    throw error;
  }
}

/**
 * Extract text content between XML tags using regex
 * This avoids needing a full XML parser dependency
 */
function extractTagContent(xml: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : undefined;
}

/**
 * Parse a standard sitemap (urlset format)
 */
function parseUrlset(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  // Match all <url> blocks
  const urlBlockRegex = /<url[^>]*>([\s\S]*?)<\/url>/gi;
  let urlMatch = urlBlockRegex.exec(xml);

  while (urlMatch !== null) {
    if (entries.length >= MAX_URLS_PER_SITEMAP) {
      break; // Respect standard sitemap limits
    }

    const urlBlock = urlMatch[1];
    const loc = extractTagContent(urlBlock, 'loc');

    if (loc) {
      const entry: SitemapEntry = { url: loc };

      const priority = extractTagContent(urlBlock, 'priority');
      if (priority) {
        const priorityNum = Number.parseFloat(priority);
        if (!Number.isNaN(priorityNum) && priorityNum >= 0 && priorityNum <= 1) {
          entry.priority = priorityNum;
        }
      }

      const lastmod = extractTagContent(urlBlock, 'lastmod');
      if (lastmod) {
        entry.lastmod = lastmod;
      }

      entries.push(entry);
    }
    urlMatch = urlBlockRegex.exec(xml);
  }

  return entries;
}

/**
 * Parse a sitemap index file (sitemapindex format)
 * Returns URLs of sub-sitemaps
 */
function parseSitemapIndex(xml: string): string[] {
  const sitemapUrls: string[] = [];

  // Match all <sitemap> blocks
  const sitemapBlockRegex = /<sitemap[^>]*>([\s\S]*?)<\/sitemap>/gi;
  let sitemapMatch = sitemapBlockRegex.exec(xml);

  while (sitemapMatch !== null) {
    const sitemapBlock = sitemapMatch[1];
    const loc = extractTagContent(sitemapBlock, 'loc');

    if (loc) {
      sitemapUrls.push(loc);
    }
    sitemapMatch = sitemapBlockRegex.exec(xml);
  }

  return sitemapUrls;
}

/**
 * Detect if XML is a sitemap index
 */
function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex/i.test(xml);
}

/**
 * Parse a sitemap URL, handling both regular sitemaps and sitemap indexes
 *
 * @param sitemapUrl - URL of the sitemap to parse
 * @param maxDepth - Maximum recursion depth for sitemap indexes (default: 2)
 * @returns ParseSitemapResult with pages and metadata
 */
export async function parseSitemap(
  sitemapUrl: string,
  maxDepth = 2,
): Promise<ParseSitemapResult> {
  const result: ParseSitemapResult = {
    pages: [],
    count: 0,
    isSitemapIndex: false,
    errors: [],
  };

  try {
    const xml = await fetchWithLimits(sitemapUrl);

    if (isSitemapIndex(xml)) {
      result.isSitemapIndex = true;

      if (maxDepth <= 0) {
        result.errors.push('Sitemap index nesting too deep');
        return result;
      }

      const subSitemapUrls = parseSitemapIndex(xml);

      // Fetch sub-sitemaps in parallel (limit to 10 concurrent)
      const batchSize = 10;
      for (let i = 0; i < subSitemapUrls.length; i += batchSize) {
        const batch = subSitemapUrls.slice(i, i + batchSize);
        const subResults = await Promise.allSettled(
          batch.map(url => parseSitemap(url, maxDepth - 1)),
        );

        for (const subResult of subResults) {
          if (subResult.status === 'fulfilled') {
            result.pages.push(...subResult.value.pages);
            result.errors.push(...subResult.value.errors);
          } else {
            result.errors.push(`Failed to fetch sub-sitemap: ${subResult.reason}`);
          }
        }
      }
    } else {
      // Regular sitemap
      result.pages = parseUrlset(xml);
    }

    result.count = result.pages.length;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error parsing sitemap',
    );
  }

  return result;
}

/**
 * Try to discover sitemap URL for a domain
 * Checks common locations: /sitemap.xml, /sitemap_index.xml, robots.txt
 *
 * @param domain - Domain to check (e.g., "example.com")
 * @returns Discovered sitemap URL or null
 */
export async function discoverSitemap(domain: string): Promise<string | null> {
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const normalizedBase = baseUrl.replace(/\/$/, '');

  // Common sitemap locations
  const locations = [
    `${normalizedBase}/sitemap.xml`,
    `${normalizedBase}/sitemap_index.xml`,
    `${normalizedBase}/sitemap/sitemap.xml`,
  ];

  // Try common locations first
  for (const location of locations) {
    try {
      const response = await fetch(location, {
        method: 'HEAD',
        headers: { 'User-Agent': 'CrawlReady-Bot/1.0' },
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('xml') || contentType.includes('text')) {
          return location;
        }
      }
    } catch {
      // Continue to next location
    }
  }

  // Try robots.txt as fallback
  try {
    const robotsUrl = `${normalizedBase}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'CrawlReady-Bot/1.0' },
    });

    if (response.ok) {
      const robotsTxt = await response.text();
      const sitemapMatch = robotsTxt.match(/Sitemap:\s*(\S+)/i);
      if (sitemapMatch) {
        return sitemapMatch[1];
      }
    }
  } catch {
    // robots.txt not available
  }

  return null;
}

/**
 * Sort sitemap entries by priority (highest first), then by lastmod (newest first)
 */
export function sortByPriority(entries: SitemapEntry[]): SitemapEntry[] {
  return [...entries].sort((a, b) => {
    // Priority comparison (higher is better)
    const priorityA = a.priority ?? 0.5; // Default priority per sitemap spec
    const priorityB = b.priority ?? 0.5;
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }

    // Lastmod comparison (newer is better)
    if (a.lastmod && b.lastmod) {
      return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
    }
    if (a.lastmod) {
      return -1;
    }
    if (b.lastmod) {
      return 1;
    }

    // Alphabetical as tiebreaker
    return a.url.localeCompare(b.url);
  });
}

/**
 * Filter sitemap entries to only include pages from a specific domain
 */
export function filterByDomain(entries: SitemapEntry[], domain: string): SitemapEntry[] {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  return entries.filter((entry) => {
    try {
      const url = new URL(entry.url);
      const entryDomain = url.hostname.toLowerCase().replace(/^www\./, '');
      return entryDomain === normalizedDomain;
    } catch {
      return false;
    }
  });
}

/**
 * Ensure homepage is included and at the top of the list
 */
export function ensureHomepage(entries: SitemapEntry[], domain: string): SitemapEntry[] {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
  const homeUrls = [
    `https://${normalizedDomain}`,
    `https://${normalizedDomain}/`,
    `https://www.${normalizedDomain}`,
    `https://www.${normalizedDomain}/`,
  ];

  const homepageIndex = entries.findIndex(e =>
    homeUrls.includes(e.url.toLowerCase()),
  );

  if (homepageIndex > 0) {
    // Move homepage to front
    const [homepage] = entries.splice(homepageIndex, 1);
    return [homepage, ...entries];
  } else if (homepageIndex === -1) {
    // Add homepage if not present
    return [{ url: `https://${normalizedDomain}/`, priority: 1.0 }, ...entries];
  }

  return entries;
}
