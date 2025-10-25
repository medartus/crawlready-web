/**
 * Meta Tags Checker
 * Checks title, description, Open Graph, lang attribute
 */

import type { MetaTagsCheck } from '../types';

export class MetaTagsChecker {
  /**
   * Check meta tags
   */
  static check(html: string): MetaTagsCheck {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;

    const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const description = descriptionMatch ? descriptionMatch[1] : null;

    const hasOpenGraph = html.includes('property="og:');
    const langMatch = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
    const hasLangAttribute = Boolean(langMatch);

    return {
      title,
      titleLength: title?.length || 0,
      description,
      descriptionLength: description?.length || 0,
      hasOpenGraph,
      hasLangAttribute,
    };
  }
}
