/**
 * Schema.org Checker
 * Deep analysis for AI optimization - checks for author, datePublished, publisher
 */

import type { EnhancedSchemaCheck } from '../types';

export class SchemaChecker {
  /**
   * Analyze schema depth for AI optimization
   */
  static check(html: string): EnhancedSchemaCheck {
    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    let hasAuthor = false;
    let hasDatePublished = false;
    let hasPublisher = false;
    const schemaTypes: string[] = [];

    if (jsonLdMatches) {
      jsonLdMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const schema = JSON.parse(jsonStr);

          const type = schema['@type'];
          if (type && !schemaTypes.includes(type)) {
            schemaTypes.push(type);
          }

          // Check for AI-critical fields (Article, BlogPosting, NewsArticle)
          if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
            hasAuthor = Boolean(schema.author);
            hasDatePublished = Boolean(schema.datePublished);
            hasPublisher = Boolean(schema.publisher);
          }
        } catch {
          // Invalid JSON, skip
        }
      });
    }

    const aiOptimized = hasAuthor && hasDatePublished && hasPublisher;

    return {
      hasSchema: jsonLdMatches !== null && jsonLdMatches.length > 0,
      schemaTypes,
      hasAuthor,
      hasDatePublished,
      hasPublisher,
      isJSONLD: jsonLdMatches !== null,
      aiOptimized,
    };
  }

  /**
   * Basic schema presence check
   */
  static hasSchemaMarkup(html: string): boolean {
    return (
      html.includes('application/ld+json')
      || html.includes('schema.org')
      || html.includes('itemtype=')
    );
  }
}
