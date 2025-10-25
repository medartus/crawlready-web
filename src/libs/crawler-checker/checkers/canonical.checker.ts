/**
 * Canonical URL Checker
 */

import type { CanonicalCheck } from '../types';
import { HTMLParser } from '../utils/html-parser';

export class CanonicalChecker {
  /**
   * Check canonical URL
   */
  static check(html: string, requestUrl: string): CanonicalCheck {
    const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    const canonicalUrl = canonicalMatch ? canonicalMatch[1] : null;

    if (!canonicalUrl) {
      return {
        hasCanonical: false,
        canonicalUrl: null,
        matchesRequestUrl: false,
        isValid: false,
      };
    }

    // Validate URL format
    let isValid = false;
    try {
      new URL(canonicalUrl);
      isValid = true;
    } catch {
      isValid = false;
    }

    const matchesRequestUrl = HTMLParser.normalizeUrl(canonicalUrl) === HTMLParser.normalizeUrl(requestUrl);

    return {
      hasCanonical: true,
      canonicalUrl,
      matchesRequestUrl,
      isValid,
    };
  }
}
