/**
 * Breadcrumb Navigation Checker
 * Validates BreadcrumbList schema and visual breadcrumbs
 */

export type BreadcrumbCheckResult = {
  hasBreadcrumbSchema: boolean;
  breadcrumbItems: number;
  hasVisualBreadcrumbs: boolean;
  hasProperHierarchy: boolean;
  schemaValid: boolean;
  issues: string[];
};

export class BreadcrumbChecker {
  static check(html: string): BreadcrumbCheckResult {
    const issues: string[] = [];

    // Check for BreadcrumbList schema
    const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

    let hasBreadcrumbSchema = false;
    let breadcrumbItems = 0;
    let schemaValid = true;

    if (jsonLdMatches) {
      jsonLdMatches.forEach((match) => {
        try {
          const jsonStr = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
          const schema = JSON.parse(jsonStr);

          if (schema['@type'] === 'BreadcrumbList') {
            hasBreadcrumbSchema = true;

            // Validate structure
            if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
              schemaValid = false;
              issues.push('BreadcrumbList missing itemListElement array');
            } else {
              breadcrumbItems = schema.itemListElement.length;

              // Validate each item
              schema.itemListElement.forEach((item: any, index: number) => {
                if (!item['@type'] || item['@type'] !== 'ListItem') {
                  schemaValid = false;
                  issues.push(`Breadcrumb item ${index + 1} missing @type: ListItem`);
                }
                if (!item.position || item.position !== index + 1) {
                  schemaValid = false;
                  issues.push(`Breadcrumb item ${index + 1} has incorrect position`);
                }
                if (!item.item || !item.item['@id']) {
                  schemaValid = false;
                  issues.push(`Breadcrumb item ${index + 1} missing item.@id (URL)`);
                }
                if (!item.name && !item.item?.name) {
                  schemaValid = false;
                  issues.push(`Breadcrumb item ${index + 1} missing name`);
                }
              });

              // Validate hierarchy (should have at least 2 items: Home + Current)
              if (breadcrumbItems < 2) {
                issues.push('BreadcrumbList should have at least 2 items (Home + Current page)');
              }
            }
          }
        } catch {
          // Invalid JSON, skip
        }
      });
    }

    // Check for visual breadcrumbs (common patterns)
    const visualBreadcrumbPatterns = [
      /<nav[^>]*aria-label=["']breadcrumb["'][^>]*>/i,
      /<ol[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>/i,
      /<ul[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>/i,
      /<div[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>/i,
      /<nav[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>/i,
    ];

    const hasVisualBreadcrumbs = visualBreadcrumbPatterns.some(pattern => pattern.test(html));

    // Check for proper hierarchy
    let hasProperHierarchy = false;

    if (hasVisualBreadcrumbs) {
      // Look for breadcrumb separators (>, /, →, etc.)
      const hasSeparators = /[>/→›]/.test(html);

      // Look for Home link
      const hasHomeLink = /home|accueil|inicio|startseite/i.test(html);

      hasProperHierarchy = hasSeparators && hasHomeLink;
    }

    // Report issues
    if (!hasBreadcrumbSchema && hasVisualBreadcrumbs) {
      issues.push('Visual breadcrumbs found but missing BreadcrumbList schema');
    }

    if (hasBreadcrumbSchema && !hasVisualBreadcrumbs) {
      issues.push('BreadcrumbList schema found but no visual breadcrumbs detected');
    }

    if (!hasBreadcrumbSchema && !hasVisualBreadcrumbs) {
      // Not an issue if the page is a homepage or doesn't need breadcrumbs
      // issues.push('No breadcrumbs detected (consider adding for deep pages)');
    }

    return {
      hasBreadcrumbSchema,
      breadcrumbItems,
      hasVisualBreadcrumbs,
      hasProperHierarchy,
      schemaValid,
      issues,
    };
  }

  /**
   * Generate example BreadcrumbList schema
   */
  static generateExampleSchema(pages: Array<{ name: string; url: string }>): string {
    const itemListElement = pages.map((page, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': page.name,
      'item': page.url,
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement,
    };

    return JSON.stringify(schema, null, 2);
  }
}
