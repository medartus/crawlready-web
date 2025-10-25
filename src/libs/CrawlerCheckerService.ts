import type { CompatibilityReport, Issue, RenderResult } from '@/types/crawler-checker';

/**
 * Simple Crawler Checker Service (MVP Version)
 * Uses fetch instead of Puppeteer for initial implementation
 */

export class CrawlerCheckerService {
  /**
   * Fetch URL and extract content
   */
  private async fetchUrl(url: string): Promise<{ html: string; ok: boolean }> {
    try {
      console.log(`[CrawlerChecker] Fetching URL: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(20000), // 20s timeout
        redirect: 'follow',
      });

      console.log(`[CrawlerChecker] Response status: ${response.status} ${response.statusText}`);
      console.log(`[CrawlerChecker] Content-Type: ${response.headers.get('content-type')}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`[CrawlerChecker] Received ${html.length} bytes`);

      // Validate we got HTML, not JSON or other content
      const trimmedHtml = html.trim();
      if (!trimmedHtml.startsWith('<')) {
        console.error(`[CrawlerChecker] Response is not HTML. First 100 chars: ${trimmedHtml.substring(0, 100)}`);
        throw new Error('Response does not appear to be HTML. The website may be returning JSON or plain text.');
      }

      return { html, ok: response.ok };
    } catch (error) {
      console.error(`[CrawlerChecker] Fetch error:`, error);

      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('Request timed out - the website took too long to respond (>20s)');
        }

        // Network errors
        if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
          throw new Error('Unable to connect to the website. Please check the URL is correct and accessible.');
        }

        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Connection refused - the website is not accepting connections.');
        }

        if (error.message.includes('ETIMEDOUT')) {
          throw new Error('Connection timed out - the website is not responding.');
        }

        if (error.message.includes('certificate') || error.message.includes('SSL')) {
          throw new Error('SSL/Certificate error - the website has an invalid security certificate.');
        }

        // Re-throw with original message if it's already descriptive
        throw error;
      }
      throw new Error('Failed to fetch URL: Unknown error');
    }
  }

  /**
   * Extract text content from HTML
   */
  private extractTextContent(html: string): string {
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
   * Check if HTML contains Schema.org structured data
   */
  private hasSchemaMarkup(html: string): boolean {
    return (
      html.includes('application/ld+json')
      || html.includes('schema.org')
      || html.includes('itemtype=')
    );
  }

  /**
   * Detect if page requires JavaScript (CRITICAL for AI crawlers)
   * Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do NOT execute JavaScript
   */
  private requiresJavaScript(html: string, textContent: string): boolean {
    // Check for empty or near-empty root containers (React/Vue/Angular)
    const emptyRootPatterns = [
      /<div id="root">\s*<\/div>/i,
      /<div id="__next">\s*<\/div>/i,
      /<div id="app">\s*<\/div>/i,
      /<app-root>\s*<\/app-root>/i,
      /<div id="root"><noscript>.*?<\/noscript><\/div>/i,
    ];

    const hasEmptyRoot = emptyRootPatterns.some(pattern => pattern.test(html));

    // Check for JavaScript requirement messages
    const jsRequiredPatterns = [
      /javascript is required/i,
      /please enable javascript/i,
      /you need to enable javascript/i,
      /this site requires javascript/i,
      /enable js to view/i,
    ];

    const hasJsMessage = jsRequiredPatterns.some(pattern => pattern.test(html));

    // Check if content is suspiciously low (< 200 chars suggests JS-rendered content)
    const hasLowContent = textContent.length < 200;

    // Check for heavy JavaScript frameworks without SSR
    const hasFrameworkWithoutContent = (
      (html.includes('react') || html.includes('_next') || html.includes('__NEXT_DATA__'))
      && textContent.length < 500
    );

    return hasEmptyRoot || hasJsMessage || (hasLowContent && hasFrameworkWithoutContent);
  }

  /**
   * Detect lazy loading or infinite scroll (invisible to AI crawlers)
   */
  private hasLazyLoadingIssues(html: string): boolean {
    const lazyLoadPatterns = [
      /loading="lazy"/i,
      /data-src=/i,
      /class="[^"]*lazy[^"]*"/i,
      /intersection.*observer/i,
    ];

    return lazyLoadPatterns.some(pattern => pattern.test(html));
  }

  /**
   * Check for client-side routing (problematic for crawlers)
   */
  private hasClientSideRouting(html: string): boolean {
    return (
      html.includes('react-router')
      || html.includes('vue-router')
      || html.includes('@angular/router')
      || (html.includes('history.pushState') && html.includes('popstate'))
    );
  }

  /**
   * Analyze navigation structure and crawl depth
   */
  private analyzeNavigation(html: string): { linkCount: number; hasGoodStructure: boolean } {
    // Count internal links
    const linkMatches = html.match(/<a[^>]+href=["'][^"']+["'][^>]*>/gi) || [];
    const linkCount = linkMatches.length;

    // Check for proper navigation structure
    const hasNav = /<nav/i.test(html);
    const hasSitemap = /sitemap/i.test(html);
    const hasGoodStructure = hasNav && linkCount > 5;

    return { linkCount, hasGoodStructure };
  }

  /**
   * Calculate realistic AI crawler compatibility score
   * Based on actual crawler capabilities (GPTBot, ClaudeBot, PerplexityBot don't execute JS)
   */
  private calculateContentScore(html: string, textContent: string): number {
    let score = 100;
    const navigation = this.analyzeNavigation(html);

    // CRITICAL: JavaScript dependency (most AI crawlers don't execute JS)
    // GPTBot, ClaudeBot, PerplexityBot, Meta-ExternalAgent, Bytespider all fetch but don't execute JS
    if (this.requiresJavaScript(html, textContent)) {
      score -= 50; // Massive penalty - invisible to 69% of AI crawlers
    }

    // CRITICAL: Very low content (< 200 chars suggests JS-rendered)
    if (textContent.length < 200) {
      score -= 30;
    } else if (textContent.length < 500) {
      score -= 15;
    } else if (textContent.length < 1000) {
      score -= 5;
    }

    // HIGH: Missing structured data (critical for AI understanding)
    if (!this.hasSchemaMarkup(html)) {
      score -= 20;
    }

    // MEDIUM: Lazy loading issues (content invisible to crawlers)
    if (this.hasLazyLoadingIssues(html)) {
      score -= 15;
    }

    // MEDIUM: Client-side routing (navigation issues for crawlers)
    if (this.hasClientSideRouting(html)) {
      score -= 10;
    }

    // LOW: Poor navigation structure (affects crawl depth)
    if (!navigation.hasGoodStructure) {
      score -= 10;
    }

    // LOW: Very few links (limits discoverability)
    if (navigation.linkCount < 5) {
      score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze compatibility with realistic AI crawler capabilities
   */
  private analyzeCompatibility(result: RenderResult): {
    score: number;
    issues: Issue[];
    recommendations: string[];
  } {
    const issues: Issue[] = [];
    const score = this.calculateContentScore(result.html, result.textContent);
    const navigation = this.analyzeNavigation(result.html);

    // CRITICAL: JavaScript dependency (69% of AI crawlers affected)
    if (this.requiresJavaScript(result.html, result.textContent)) {
      issues.push({
        severity: 'critical',
        crawler: 'GPTBot, ClaudeBot, PerplexityBot, Meta-ExternalAgent, Bytespider',
        description: 'Page requires JavaScript for content rendering - invisible to 69% of AI crawlers',
        fix: 'Implement server-side rendering (SSR) with Next.js/Nuxt.js, use static site generation (SSG), or use CrawlReady to automatically render for AI crawlers.',
      });
    }

    // CRITICAL: Very low content
    if (result.contentLength < 200) {
      issues.push({
        severity: 'critical',
        crawler: 'All AI crawlers',
        description: `Extremely low text content detected (${result.contentLength} characters) - likely JavaScript-rendered`,
        fix: 'Ensure critical content is in the initial HTML response. AI crawlers cannot execute JavaScript to load your content.',
      });
    } else if (result.contentLength < 500) {
      issues.push({
        severity: 'high',
        crawler: 'All AI crawlers',
        description: `Limited text content detected (${result.contentLength} characters)`,
        fix: 'Verify that your main content is accessible without JavaScript. Consider adding more descriptive text.',
      });
    }

    // HIGH: Missing structured data
    if (!result.hasSchema) {
      issues.push({
        severity: 'high',
        crawler: 'All AI crawlers',
        description: 'Missing Schema.org structured data (JSON-LD, Microdata, or RDFa)',
        fix: 'Add JSON-LD structured data using appropriate schema types (Article, Product, FAQ, HowTo, etc.) to help AI understand and cite your content.',
      });
    }

    // MEDIUM: Lazy loading
    if (this.hasLazyLoadingIssues(result.html)) {
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: 'Lazy loading detected - images and content may be invisible to crawlers',
        fix: 'AI crawlers cannot trigger scroll events or intersection observers. Use eager loading for important content or implement noscript fallbacks.',
      });
    }

    // MEDIUM: Client-side routing
    if (this.hasClientSideRouting(result.html)) {
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: 'Client-side routing detected (React Router, Vue Router, etc.)',
        fix: 'AI crawlers cannot navigate client-side routes. Ensure all important pages are accessible via direct URLs with server-side rendering.',
      });
    }

    // LOW: Poor navigation
    if (!navigation.hasGoodStructure) {
      issues.push({
        severity: 'low',
        crawler: 'All AI crawlers',
        description: 'Weak navigation structure - may limit crawl depth',
        fix: 'Add a clear <nav> element with links to important pages. AI crawlers typically limit depth to 2-3 levels from seed URLs.',
      });
    }

    // LOW: Few links
    if (navigation.linkCount < 5) {
      issues.push({
        severity: 'low',
        crawler: 'All AI crawlers',
        description: `Only ${navigation.linkCount} links found - limits content discoverability`,
        fix: 'Add more internal links to help AI crawlers discover your content. Include links to related articles, categories, and important pages.',
      });
    }

    const recommendations = this.generateRecommendations(issues);

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  /**
   * Generate actionable recommendations based on detected issues
   */
  private generateRecommendations(issues: Issue[]): string[] {
    const recommendations: string[] = [];

    const hasJSIssue = issues.some(i => i.description.includes('JavaScript'));
    const hasSchemaIssue = issues.some(i => i.description.includes('Schema'));
    const hasContentIssue = issues.some(i => i.description.includes('content'));
    const hasLazyLoadIssue = issues.some(i => i.description.includes('Lazy loading'));
    const hasRoutingIssue = issues.some(i => i.description.includes('routing'));
    const hasNavigationIssue = issues.some(i => i.description.includes('navigation') || i.description.includes('links'));

    // Priority 1: JavaScript issues (CRITICAL - affects 69% of AI crawlers)
    if (hasJSIssue) {
      recommendations.push('🚨 CRITICAL: Implement server-side rendering (SSR) with Next.js, Nuxt.js, SvelteKit, or Remix');
      recommendations.push('🚨 CRITICAL: Use static site generation (SSG) with Astro, Gatsby, or Next.js for content-heavy pages');
      recommendations.push('💡 Quick Fix: Use CrawlReady to automatically render JavaScript for AI crawlers without code changes');
      recommendations.push('⚙️ Alternative: Implement dynamic rendering - serve pre-rendered HTML to bots, interactive version to users');
    }

    // Priority 2: Structured data (HIGH - affects AI understanding and citations)
    if (hasSchemaIssue) {
      recommendations.push('📊 Add JSON-LD structured data in <head> using Schema.org vocabulary');
      recommendations.push('📝 Use appropriate schema types: Article (blog posts), Product (e-commerce), FAQ, HowTo, Recipe, etc.');
      recommendations.push('🔗 Include author, datePublished, dateModified, and organization information for better attribution');
      recommendations.push('✅ Validate your structured data with Google\'s Rich Results Test');
    }

    // Priority 3: Content issues
    if (hasContentIssue) {
      recommendations.push('📄 Ensure main content is in the initial HTML response, not loaded via JavaScript');
      recommendations.push('✍️ Add descriptive text content (aim for 1000+ characters for important pages)');
      recommendations.push('🎯 Use semantic HTML tags (<article>, <section>, <h1>-<h6>) for better content structure');
    }

    // Priority 4: Lazy loading issues
    if (hasLazyLoadIssue) {
      recommendations.push('🖼️ Use eager loading (loading="eager") for above-the-fold images');
      recommendations.push('🔄 Provide <noscript> fallbacks for lazy-loaded content');
      recommendations.push('⚡ Consider using native lazy loading only for below-the-fold content');
    }

    // Priority 5: Client-side routing issues
    if (hasRoutingIssue) {
      recommendations.push('🔗 Ensure all important pages have direct URLs accessible via server-side routing');
      recommendations.push('🗺️ Create an XML sitemap listing all important pages');
      recommendations.push('🌐 Use Next.js App Router, Nuxt.js, or SvelteKit for proper SSR with routing');
    }

    // Priority 6: Navigation issues
    if (hasNavigationIssue) {
      recommendations.push('🧭 Add a clear <nav> element with links to main sections');
      recommendations.push('📍 Keep important pages within 2-3 clicks from homepage (AI crawlers limit depth)');
      recommendations.push('🔗 Add internal links between related content to improve discoverability');
      recommendations.push('🗺️ Create and submit an XML sitemap to help crawlers discover all pages');
    }

    // Success case
    if (recommendations.length === 0) {
      recommendations.push('✅ Excellent! Your site is well-optimized for AI crawlers');
      recommendations.push('📊 Consider monitoring AI crawler traffic with CrawlReady Analytics');
      recommendations.push('🔄 Keep your structured data updated as your content changes');
      recommendations.push('📈 Test regularly as you add new features to maintain compatibility');
    }

    return recommendations;
  }

  /**
   * Main check function
   */
  async checkUrl(url: string): Promise<CompatibilityReport> {
    const startTime = Date.now();

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    // Fetch the URL
    const { html, ok } = await this.fetchUrl(url);

    if (!ok) {
      throw new Error('Failed to fetch URL - site returned error status');
    }

    // Extract content
    const textContent = this.extractTextContent(html);
    const hasSchema = this.hasSchemaMarkup(html);
    const renderTime = Date.now() - startTime;

    const result: RenderResult = {
      html,
      textContent,
      contentLength: textContent.length,
      hasSchema,
      renderTime,
    };

    // Analyze compatibility
    const { score, issues, recommendations } = this.analyzeCompatibility(result);

    // Determine crawler compatibility
    const crawlerCompatibility = {
      GPTBot: score >= 80 ? 'full' : score >= 50 ? 'partial' : 'poor',
      ClaudeBot: score >= 80 ? 'full' : score >= 50 ? 'partial' : 'poor',
      PerplexityBot: score >= 90 ? 'full' : score >= 70 ? 'partial' : 'poor', // Stricter (no JS support)
      GoogleBot: score >= 70 ? 'full' : score >= 40 ? 'partial' : 'poor',
    } as const;

    return {
      score,
      issues,
      recommendations,
      crawlerCompatibility,
      userView: result, // In MVP, same as crawlerView
      crawlerView: result,
      limitedJSView: result,
      checkedAt: new Date().toISOString(),
      url,
    };
  }
}

export const crawlerCheckerService = new CrawlerCheckerService();
