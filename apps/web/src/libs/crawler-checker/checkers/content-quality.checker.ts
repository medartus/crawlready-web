/**
 * Content Quality Checker
 * Analyzes content depth, E-E-A-T signals
 */

import type { ContentQualityCheck } from '../types';

export class ContentQualityChecker {
  /**
   * Analyze content quality
   */
  static check(html: string, textContent: string): ContentQualityCheck {
    const words = textContent.trim().split(/\s+/);
    const wordCount = words.length;
    const paragraphCount = (html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || []).length;

    // Check for author information
    const hasAuthorInfo = /author|by\s+[A-Z]/i.test(html);

    // Check for date information
    const hasDateInfo = /<time|datetime|datePublished|published/i.test(html);

    const issues: string[] = [];
    if (wordCount < 300) {
      issues.push(`Thin content (${wordCount} words, need 500+)`);
    }
    if (paragraphCount < 3) {
      issues.push('Very few paragraphs');
    }
    if (!hasAuthorInfo) {
      issues.push('No clear author attribution');
    }
    if (!hasDateInfo) {
      issues.push('No publication date found');
    }

    return {
      wordCount,
      paragraphCount,
      hasAuthorInfo,
      hasDateInfo,
      issues,
    };
  }
}
