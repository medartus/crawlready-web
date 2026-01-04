/**
 * Semantic HTML Checker
 * Validates HTML5 semantic structure
 */

import type { SemanticHTMLCheck } from '../types';
import { HTMLParser } from '../utils/html-parser';

export class SemanticHTMLChecker {
  /**
   * Check semantic HTML structure
   */
  static check(html: string): SemanticHTMLCheck {
    const h1Count = HTMLParser.countElements(html, 'h1');
    const hasMain = HTMLParser.hasPattern(html, /<main/i);
    const hasArticle = HTMLParser.hasPattern(html, /<article/i);
    const hasNav = HTMLParser.hasPattern(html, /<nav/i);
    const hasHeader = HTMLParser.hasPattern(html, /<header/i);
    const hasFooter = HTMLParser.hasPattern(html, /<footer/i);

    const issues: string[] = [];
    if (h1Count === 0) {
      issues.push('Missing H1 heading');
    }
    if (h1Count > 1) {
      issues.push(`Multiple H1 headings (${h1Count})`);
    }
    if (!hasMain) {
      issues.push('Missing <main> tag');
    }

    return {
      h1Count,
      hasMain,
      hasArticle,
      hasNav,
      hasHeader,
      hasFooter,
      issues,
    };
  }
}
