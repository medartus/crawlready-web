/**
 * Content Freshness Checker
 * AI systems prioritize recent, verified, and contextually updated content
 */

import type { FreshnessCheck } from '../types';

export class FreshnessChecker {
  static check(html: string, headers: Headers): FreshnessCheck {
    const issues: string[] = [];
    const currentYear = new Date().getFullYear();

    // Check schema.org dates
    let publishedDate: string | undefined;
    let modifiedDate: string | undefined;

    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    if (jsonLdMatches) {
      jsonLdMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const schema = JSON.parse(jsonStr) as { datePublished?: string; dateModified?: string };

          if (schema.datePublished) {
            publishedDate = schema.datePublished;
          }
          if (schema.dateModified) {
            modifiedDate = schema.dateModified;
          }
        } catch {
          // Invalid JSON, skip
        }
      });
    }

    // Check Open Graph dates
    if (!publishedDate) {
      const ogPublished = html.match(/<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i);
      if (ogPublished && ogPublished[1]) {
        publishedDate = ogPublished[1];
      }
    }

    if (!modifiedDate) {
      const ogModified = html.match(/<meta[^>]+property=["']article:modified_time["'][^>]+content=["']([^"']+)["']/i);
      if (ogModified && ogModified[1]) {
        modifiedDate = ogModified[1];
      }
    }

    // Check meta tags
    if (!publishedDate) {
      const metaDate = html.match(/<meta[^>]+name=["']date["'][^>]+content=["']([^"']+)["']/i);
      if (metaDate && metaDate[1]) {
        publishedDate = metaDate[1];
      }
    }

    // Check Last-Modified header
    const lastModifiedHeader = headers.get('last-modified');
    const hasLastModifiedHeader = Boolean(lastModifiedHeader);

    // Calculate age
    let ageInDays: number | null = null;
    let isStale = false;

    if (publishedDate) {
      try {
        const pubDate = new Date(publishedDate);
        const now = new Date();
        ageInDays = Math.floor((now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));

        // Content decay thresholds (from AI crawler criteria)
        // Tech/AI/SEO: 90 days, Finance/SaaS: 180 days, Health/Legal: 180 days
        if (ageInDays > 90) {
          isStale = true;
          issues.push(`Content is ${ageInDays} days old (consider updating for tech content)`);
        }
      } catch {
        // Invalid date format
      }
    }

    // Check for current year references
    const hasCurrentYearReference = html.includes(currentYear.toString());

    // Validation
    if (!publishedDate) {
      issues.push('No publication date found (datePublished, article:published_time, or meta date)');
    }

    if (!modifiedDate && publishedDate) {
      issues.push('No modification date (dateModified) - signals content may be outdated');
    }

    if (!hasLastModifiedHeader) {
      issues.push('No Last-Modified HTTP header');
    }

    if (publishedDate && !hasCurrentYearReference && ageInDays && ageInDays > 365) {
      issues.push('Old content without current year reference - may appear outdated to AI');
    }

    return {
      hasDatePublished: Boolean(publishedDate),
      hasDateModified: Boolean(modifiedDate),
      publishedDate,
      modifiedDate,
      ageInDays,
      isStale,
      hasLastModifiedHeader,
      hasCurrentYearReference,
      issues,
    };
  }

  /**
   * Get recommended update frequency by topic category
   */
  static getUpdateRecommendation(topic: string): number {
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('ai') || topicLower.includes('tech') || topicLower.includes('seo')) {
      return 90; // 3 months
    }

    if (topicLower.includes('finance') || topicLower.includes('saas')) {
      return 180; // 6 months
    }

    if (topicLower.includes('health') || topicLower.includes('legal') || topicLower.includes('medical')) {
      return 180; // 6 months
    }

    if (topicLower.includes('education') || topicLower.includes('real estate')) {
      return 365; // 12 months
    }

    return 545; // 18 months for evergreen content
  }
}
