/**
 * Shared HTML analysis utilities for the scoring engine.
 *
 * All text extraction is server-side string parsing — no DOM APIs,
 * no headless browser.  Designed for Node.js API routes.
 */

/**
 * Strip HTML tags and return visible text, collapsed whitespace.
 */
export function extractVisibleText(html: string): string {
  let text = html;

  // Remove script/style/noscript blocks entirely
  text = text.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all remaining tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common entities
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/&lt;/gi, '<');
  text = text.replace(/&gt;/gi, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, '\'');

  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Tokenize text by splitting on whitespace and punctuation.
 * Returns an array of non-empty tokens.
 */
export function tokenize(text: string): string[] {
  return text.split(/[\s,.;:!?()[\]{}"'<>/\\|@#$%^&*~`+=_-]+/).filter(Boolean);
}

/**
 * Count occurrences of a tag in HTML (case-insensitive).
 * Returns opening tag count.
 */
export function countTag(html: string, tag: string): number {
  const regex = new RegExp(`<${tag}[\\s>/]`, 'gi');
  return (html.match(regex) || []).length;
}

/**
 * Extract all elements matching a tag, returning their outer HTML.
 */
export function extractElements(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
  return html.match(regex) || [];
}

/**
 * Extract all self-closing or void elements matching a tag.
 */
export function extractVoidElements(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
  return html.match(regex) || [];
}

/**
 * Get the value of an attribute from an HTML tag string.
 */
export function getAttr(element: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const match = element.match(regex);
  return match ? match[1]! : null;
}

/**
 * Extract all `<meta>` tags and return as name→content map.
 */
export function extractMetaTags(html: string): Map<string, string> {
  const metas = new Map<string, string>();
  const metaRegex = /<meta[^>]+>/gi;
  const matches = html.match(metaRegex) || [];

  for (const meta of matches) {
    const name = getAttr(meta, 'name') || getAttr(meta, 'property');
    const content = getAttr(meta, 'content');
    if (name && content) {
      metas.set(name.toLowerCase(), content);
    }
  }

  return metas;
}

/**
 * Extract all JSON-LD script blocks, parsed as objects.
 */
export function extractJsonLd(html: string): unknown[] {
  const regex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const results: unknown[] = [];
  for (const match of html.matchAll(regex)) {
    try {
      results.push(JSON.parse(match[1]!));
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return results;
}

/**
 * Extract text content from an element string (strip inner tags).
 */
export function innerText(element: string): string {
  return element.replace(/<[^>]+>/g, '').trim();
}
