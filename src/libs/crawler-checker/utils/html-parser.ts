/**
 * HTML parsing utilities
 */

export class HTMLParser {
  /**
   * Extract text content from HTML
   */
  static extractTextContent(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Extract meta tag content
   */
  static extractMetaTag(html: string, name: string): string | null {
    const pattern = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']+)["']`, 'i');
    const match = html.match(pattern);
    return match && match[1] ? match[1] : null;
  }

  /**
   * Extract link tag href
   */
  static extractLinkTag(html: string, rel: string): string | null {
    const pattern = new RegExp(`<link\\s+rel=["']${rel}["']\\s+href=["']([^"']+)["']`, 'i');
    const match = html.match(pattern);
    return match && match[1] ? match[1] : null;
  }

  /**
   * Count HTML elements
   */
  static countElements(html: string, tagName: string): number {
    const pattern = new RegExp(`<${tagName}[^>]*>`, 'gi');
    return (html.match(pattern) || []).length;
  }

  /**
   * Check if HTML contains pattern
   */
  static hasPattern(html: string, pattern: RegExp): boolean {
    return pattern.test(html);
  }

  /**
   * Extract all links from HTML
   */
  static extractLinks(html: string): string[] {
    const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["']/gi) || [];
    return linkMatches.map((link) => {
      const match = link.match(/href=["']([^"']+)["']/i);
      return match && match[1] ? match[1] : '';
    }).filter(Boolean);
  }

  /**
   * Normalize URL for comparison
   */
  static normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '');
    } catch {
      return url;
    }
  }
}
