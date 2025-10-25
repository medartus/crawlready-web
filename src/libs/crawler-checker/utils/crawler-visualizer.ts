/**
 * Secure Crawler View Visualizer
 * Shows users what AI crawlers see (without executing JS)
 * Client-side only - no server vulnerabilities
 */

export type CrawlerViewComparison = {
  userViewUrl: string;
  crawlerViewHtml: string;
  differences: Array<{
    type: 'javascript' | 'lazy-loading' | 'hidden-content' | 'dynamic-content';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>;
  statistics: {
    jsScriptsRemoved: number;
    eventHandlersRemoved: number;
    lazyImagesDetected: number;
    hiddenContentDetected: number;
    dynamicContentDetected: number;
  };
};

export class CrawlerVisualizer {
  /**
   * Generate safe comparison between user view and crawler view
   * SECURITY: All processing is client-side, no code execution
   */
  static generateComparison(html: string, url: string): CrawlerViewComparison {
    const crawlerHtml = this.stripJavaScript(html);
    const differences = this.analyzeDifferences(html, crawlerHtml);
    const statistics = this.generateStatistics(html, crawlerHtml);

    return {
      userViewUrl: url, // Use actual URL to show styled version
      crawlerViewHtml: this.createCrawlerIframe(crawlerHtml),
      differences,
      statistics,
    };
  }

  /**
   * Create iframe for crawler view (stripped HTML, no styling)
   * SECURITY: No scripts, only basic rendering
   */
  private static createCrawlerIframe(html: string): string {
    // Inject basic styling to make it readable
    const styledHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
              color: #333;
              background: #fff;
            }
            img { max-width: 100%; height: auto; }
            a { color: #0066cc; text-decoration: underline; }
            h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
            p { margin-bottom: 1em; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    const escapedHtml = this.escapeForSrcdoc(styledHtml);

    return `
      <iframe
        sandbox="allow-same-origin"
        srcdoc="${escapedHtml}"
        style="width: 100%; height: 100%; border: none; background: white;"
        title="Crawler View"
      ></iframe>
    `;
  }

  /**
   * Strip all JavaScript to simulate crawler view
   * SECURITY: Removes all JS execution vectors
   */
  private static stripJavaScript(html: string): string {
    let cleaned = html;

    // Remove <script> tags
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove inline event handlers
    cleaned = cleaned.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/\son\w+\s*=\s*[^"\s>]*/gi, '');

    // Remove javascript: protocols
    cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    cleaned = cleaned.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

    // Remove type="module" scripts
    cleaned = cleaned.replace(/<script[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>/gi, '');

    return cleaned;
  }

  /**
   * Escape HTML for safe use in srcdoc
   */
  private static escapeForSrcdoc(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Analyze differences between user and crawler view
   */
  private static analyzeDifferences(originalHtml: string, _crawlerHtml: string): Array<{
    type: 'javascript' | 'lazy-loading' | 'hidden-content' | 'dynamic-content';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }> {
    const differences = [];

    // Check for JS frameworks (React, Vue, Angular)
    if (this.hasJSFramework(originalHtml)) {
      differences.push({
        type: 'javascript' as const,
        severity: 'critical' as const,
        description: 'Content rendered by JavaScript framework',
        impact: 'AI crawlers may see empty page or loading spinner',
      });
    }

    // Check for lazy-loaded images
    const lazyImagesCount = (originalHtml.match(/loading=["']lazy["']/gi) || []).length;
    if (lazyImagesCount > 0) {
      differences.push({
        type: 'lazy-loading' as const,
        severity: 'medium' as const,
        description: `${lazyImagesCount} images use lazy loading`,
        impact: 'Images may not load for crawlers without JavaScript',
      });
    }

    // Check for hidden content (display:none, hidden attribute)
    if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(originalHtml)) {
      differences.push({
        type: 'hidden-content' as const,
        severity: 'low' as const,
        description: 'Hidden content detected',
        impact: 'Crawlers skip hidden content',
      });
    }

    // Check for dynamic content loading
    if (/data-src|data-lazy|skeleton|placeholder/i.test(originalHtml)) {
      differences.push({
        type: 'dynamic-content' as const,
        severity: 'high' as const,
        description: 'Dynamic content loading detected',
        impact: 'Content may not be visible to crawlers',
      });
    }

    // Check for empty containers that need JS
    const emptyRootPattern = /<div[^>]+id=["'](root|app|__next)["'][^>]*>\s*<\/div>/i;
    if (emptyRootPattern.test(originalHtml)) {
      differences.push({
        type: 'javascript' as const,
        severity: 'critical' as const,
        description: 'Empty root container (requires JavaScript)',
        impact: 'AI crawlers see no content',
      });
    }

    return differences;
  }

  /**
   * Check if HTML uses JS framework
   */
  private static hasJSFramework(html: string): boolean {
    const frameworks = [
      /\breact\b/i,
      /\bvue\b/i,
      /\bangular\b/i,
      /<div[^>]+id=["']root["']/i,
      /<div[^>]+id=["']app["']/i,
      /<div[^>]+id=["']__next["']/i,
      /next\/script/i,
      /_next\/static/i,
    ];

    return frameworks.some((pattern) => pattern.test(html));
  }

  /**
   * Generate statistics about differences
   */
  private static generateStatistics(originalHtml: string, _crawlerHtml: string) {
    return {
      jsScriptsRemoved: (originalHtml.match(/<script/gi) || []).length,
      eventHandlersRemoved: (originalHtml.match(/\son\w+\s*=/gi) || []).length,
      lazyImagesDetected: (originalHtml.match(/loading=["']lazy["']/gi) || []).length,
      hiddenContentDetected: (originalHtml.match(/display\s*:\s*none/gi) || []).length,
      dynamicContentDetected: (originalHtml.match(/data-src|data-lazy/gi) || []).length,
    };
  }
}
