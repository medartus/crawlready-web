/**
 * HTML Optimizer for CrawlReady
 *
 * Optimizes rendered HTML for AI bot consumption:
 * - Removes comments
 * - Removes inline scripts (analytics, tracking)
 * - Removes unnecessary whitespace
 * - Preserves semantic HTML structure
 * - Keeps structured data (JSON-LD, microdata)
 */

/**
 * Optimize HTML for AI bot consumption
 */
export function optimizeHtml(html: string): string {
  let optimized = html;

  // 1. Remove HTML comments (except IE conditionals)
  optimized = optimized.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');

  // 2. Remove inline scripts (but keep JSON-LD structured data)
  // Keep scripts with type="application/ld+json", remove others
  const scripts = optimized.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scripts) {
    const scriptTag = match[0];
    // Check if it's a JSON-LD script
    if (!/type=["']application\/ld\+json["']/i.test(scriptTag)) {
      optimized = optimized.replace(scriptTag, '');
    }
  }

  // 3. Remove inline styles (keep external stylesheets)
  optimized = optimized.replace(/<style(?:\s[^>]+)?>[\s\S]*?<\/style>/gi, '');

  // 4. Remove event handlers
  optimized = optimized.replace(/\s+on\w+="[^"]*"/gi, '');
  optimized = optimized.replace(/\s+on\w+='[^']*'/gi, '');

  // 5. Remove tracking pixels and iframes
  optimized = optimized.replace(
    /<iframe(?:\s[^>]+)?src=["'][^"']*(?:doubleclick|google-analytics|facebook|twitter)[^"']*["'](?:\s[^>]+)?>[\s\S]*?<\/iframe>/gi,
    '',
  );

  // 6. Remove noscript tags (not needed for bots)
  optimized = optimized.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // 7. Collapse excessive whitespace
  optimized = optimized.replace(/\s+/g, ' ');
  optimized = optimized.replace(/>\s+</g, '><');

  // 8. Trim
  optimized = optimized.trim();

  return optimized;
}

/**
 * Extract structured data from HTML (for future use)
 */
export function extractStructuredData(html: string): Record<string, unknown>[] {
  const jsonLdMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  const structuredData: Record<string, unknown>[] = [];

  for (const match of jsonLdMatches) {
    try {
      const jsonContent = match[1];
      if (jsonContent) {
        const data = JSON.parse(jsonContent);
        structuredData.push(data);
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return structuredData;
}

/**
 * Extract main content (remove headers, footers, sidebars) - advanced feature
 */
export function extractMainContent(html: string): string {
  // This is a simplified version. Production would use a library like Mozilla's Readability.js
  // or a custom ML model to extract the main content.

  // For now, just try to find <main> or <article> tags
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1]) {
    return mainMatch[1];
  }

  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1]) {
    return articleMatch[1];
  }

  // Fallback: return body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }

  return html;
}
