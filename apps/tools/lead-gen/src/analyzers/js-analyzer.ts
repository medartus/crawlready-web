/**
 * JavaScript Dependency Analyzer
 * Compares raw HTML (no JS) vs rendered HTML (with JS) to calculate JS dependency score
 *
 * Detection strategy focuses on COMMON PATTERNS, not specific messages:
 * - Content ratio: How much content is JS-rendered vs server-rendered
 * - Hidden content: CSS that makes content invisible without JS (opacity:0, etc.)
 * - Empty containers: React/Vue root divs that are empty in raw HTML
 * - Meaningful content: Distinguishes boilerplate (nav/footer) from actual page content
 */

import { load, type CheerioAPI } from 'cheerio';
import type { JSAnalysisResult, MultiPageAnalysisResult } from '../types.js';
import { getBrowser, createPage, fetchRawHtml, renderPage } from '../utils/puppeteer.js';
import { logger } from '../utils/logger.js';
import { withRetry } from '../utils/rate-limiter.js';

// Common content page paths to analyze beyond homepage
const CONTENT_PAGE_PATHS = [
  '/blog',
  '/resources',
  '/docs',
  '/documentation',
  '/articles',
  '/news',
  '/insights',
  '/learn',
  '/guides',
  '/tutorials',
  '/case-studies',
  '/use-cases',
];

/**
 * Extract visible text content from HTML
 * Strips scripts, styles, and extracts meaningful text
 */
function extractTextContent(html: string): string {
  const $ = load(html);

  // Remove non-visible elements
  $('script, style, noscript, iframe, svg, path').remove();

  // Remove hidden elements
  $('[style*="display: none"], [style*="display:none"]').remove();
  $('[hidden], [aria-hidden="true"]').remove();

  // Get text from body
  const text = $('body')
    .text()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return text;
}

/**
 * Extract MAIN content text, excluding navigation/footer boilerplate
 * This gives a more accurate picture of actual page content
 */
function extractMainContent(html: string): string {
  const $ = load(html);

  // Remove non-visible elements
  $('script, style, noscript, iframe, svg, path').remove();

  // Remove navigation and footer boilerplate
  $('header, nav, footer, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();
  $('.nav, .navbar, .navigation, .header, .footer, .menu').remove();

  // Remove hidden elements
  $('[style*="display: none"], [style*="display:none"]').remove();
  $('[hidden], [aria-hidden="true"]').remove();

  // Try to get main content area first
  let mainContent = $('main, [role="main"], article, .content, .main-content, #content, #main')
    .text()
    .replace(/\s+/g, ' ')
    .trim();

  // Fall back to body if no main content found
  if (!mainContent || mainContent.length < 50) {
    mainContent = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
  }

  return mainContent;
}

/**
 * Detect if raw HTML has MAIN CONTENT that's hidden by CSS until JS runs
 * Only flags true positives - ignores animation elements, form inputs, modals
 *
 * False positive patterns to IGNORE:
 * - opacity:0 + transform (animation start states)
 * - opacity:0 on input/checkbox (custom form styling)
 * - visibility:hidden on modals/dropdowns
 *
 * True positive patterns to DETECT:
 * - Major content wrappers (main, article, section) with opacity:0/visibility:hidden
 * - Elements with substantial text (>200 chars) that are hidden
 */
function detectHiddenByCSS(html: string): { isHidden: boolean; reason: string | null } {
  const $ = load(html);

  // Major content container selectors that would indicate real content is hidden
  const contentContainers = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.page-content',
    '.content-wrapper',
    '#content',
    '#main',
  ];

  // Check if any major content container is hidden
  for (const selector of contentContainers) {
    const el = $(selector);
    if (el.length > 0) {
      const style = el.attr('style') || '';
      const hasOpacity = /opacity\s*:\s*0(?!\.)/.test(style); // opacity:0 but not opacity:0.5
      const hasVisibility = /visibility\s*:\s*hidden/.test(style);
      const hasTransform = style.includes('transform'); // Animation start state - ignore

      if ((hasOpacity || hasVisibility) && !hasTransform) {
        const textContent = el.text().trim();
        if (textContent.length > 200) {
          return {
            isHidden: true,
            reason: `Main content container (${selector}) is hidden with ${textContent.length} chars of text`,
          };
        }
      }
    }
  }

  // Check first-level body children for hidden content wrappers
  // But exclude common false positives
  const bodyChildren = $('body').children();
  for (let i = 0; i < Math.min(bodyChildren.length, 3); i++) {
    const el = bodyChildren.eq(i);
    const tagName = el.prop('tagName')?.toLowerCase() || '';

    // Skip scripts, noscript, style tags
    if (['script', 'noscript', 'style', 'link', 'meta'].includes(tagName)) {
      continue;
    }

    const style = el.attr('style') || '';
    const hasOpacity = /opacity\s*:\s*0(?!\.)/.test(style);
    const hasVisibility = /visibility\s*:\s*hidden/.test(style);
    const hasTransform = style.includes('transform'); // Animation - ignore

    if ((hasOpacity || hasVisibility) && !hasTransform) {
      const textContent = el.text().trim();
      // Only flag if this wrapper contains substantial content
      if (textContent.length > 500) {
        return {
          isHidden: true,
          reason: `Top-level content wrapper is hidden with ${textContent.length} chars of text`,
        };
      }
    }
  }

  return { isHidden: false, reason: null };
}

/**
 * Detect if page uses SPA framework patterns (empty root containers)
 * React: <div id="root"></div> or <div id="app"></div>
 * Vue: <div id="app"></div>
 * These are typically empty in raw HTML
 */
function detectEmptySPAContainers(html: string): boolean {
  const $ = load(html);

  // Common SPA root selectors
  const spaRoots = ['#root', '#app', '#__next', '#__nuxt', '[data-reactroot]'];

  for (const selector of spaRoots) {
    const el = $(selector);
    if (el.length > 0) {
      const content = el.text().trim();
      // If SPA root exists but has very little content, it's likely JS-rendered
      if (content.length < 100) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect if page uses Web Components / Custom Elements that require JavaScript
 * These elements contain content but browsers won't render them without JS:
 * - astro-island (Astro framework)
 * - lit-element, sl-* (Lit/Shoelace)
 * - stencil components
 * - Any custom element with hyphen in tag name containing substantial content
 *
 * This is a critical pattern: Cheerio extracts text from these elements,
 * but real browsers show nothing without JS to hydrate them.
 */
function detectWebComponents(html: string): { hasWebComponents: boolean; componentTypes: string[] } {
  const $ = load(html);
  const componentTypes: string[] = [];

  // Known web component patterns
  const knownComponents = [
    { selector: 'astro-island', name: 'Astro Islands' },
    { selector: 'astro-slot', name: 'Astro Slots' },
    { selector: '[is]', name: 'Custom Built-in Elements' }, // <button is="fancy-button">
    { selector: 'lit-element, [lit-element]', name: 'Lit Element' },
    { selector: '[data-lit-stable]', name: 'Lit' },
    { selector: 'sl-button, sl-input, sl-dialog, [class^="sl-"]', name: 'Shoelace' },
  ];

  for (const { selector, name } of knownComponents) {
    const elements = $(selector);
    if (elements.length > 0) {
      // Check if these elements contain substantial text
      const textContent = elements.text().trim();
      if (textContent.length > 100) {
        componentTypes.push(name);
      }
    }
  }

  // Detect any custom elements (tags with hyphens) that contain substantial text
  // Custom elements are defined by having a hyphen in the tag name (per spec)
  const bodyHtml = $('body').html() || '';
  const customElementMatches = bodyHtml.match(/<([a-z]+-[a-z0-9-]+)[^>]*>([^<]*(?:<(?!\/\1>)[^<]*)*)<\/\1>/gi);

  if (customElementMatches) {
    for (const match of customElementMatches) {
      // Extract tag name
      const tagMatch = match.match(/<([a-z]+-[a-z0-9-]+)/i);
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        // Skip known non-content elements
        if (!['font-face', 'font-family', 'clip-path', 'color-profile'].includes(tagName)) {
          // Check if it contains substantial text (not just whitespace/attributes)
          const textOnly = match.replace(/<[^>]*>/g, '').trim();
          if (textOnly.length > 50 && !componentTypes.some(t => t.toLowerCase().includes(tagName))) {
            componentTypes.push(`Custom Element: <${tagName}>`);
          }
        }
      }
    }
  }

  return {
    hasWebComponents: componentTypes.length > 0,
    componentTypes: [...new Set(componentTypes)], // Dedupe
  };
}

/**
 * Detect if page has substantial noscript fallback content
 * This is a pattern where sites show warning content when JS is disabled
 * Indicator: noscript with substantial text, OR raw text > rendered text
 */
function detectNoscriptFallback(rawHtml: string, rawTextLength: number, renderedTextLength: number): boolean {
  const $ = load(rawHtml);

  // Check if noscript has substantial content
  const noscriptContent = $('noscript').text().trim();
  const hasSubstantialNoscript = noscriptContent.length > 100;

  // Pattern: raw HTML has MORE content than rendered (unusual)
  // This happens when noscript warnings/fallback content inflate raw HTML
  const rawExceedsRendered = rawTextLength > renderedTextLength * 1.5;

  // If noscript has content AND raw exceeds rendered, it's a strong signal
  if (hasSubstantialNoscript && rawExceedsRendered) {
    return true;
  }

  // Also check if body content (excluding noscript) is very minimal
  // This indicates the actual page content is JS-dependent
  const $clone = load(rawHtml);
  $clone('noscript, script, style, svg').remove();
  const bodyWithoutNoscript = $clone('body').text().replace(/\s+/g, ' ').trim();

  // If body without noscript is minimal but rendered has content
  if (bodyWithoutNoscript.length < 500 && renderedTextLength > 1000) {
    return true;
  }

  return false;
}

/**
 * Check if page is essentially blank or has minimal content without JavaScript
 * Uses multiple signals:
 * - Raw text length vs rendered
 * - Main content specifically (excluding nav/footer)
 * - Hidden content patterns
 */
function isBlankWithoutJs(
  rawText: string,
  renderedText: string,
  rawHtml: string
): { isBlank: boolean; reason: string | null } {
  const rawLength = rawText.length;
  const renderedLength = renderedText.length;

  // Threshold 1: Almost no raw content but substantial rendered content
  if (rawLength < 200 && renderedLength > 1000) {
    return { isBlank: true, reason: 'Page has almost no content without JavaScript' };
  }

  // Threshold 2: Raw content is mostly boilerplate (nav/footer)
  const rawMainContent = extractMainContent(rawHtml);
  if (rawMainContent.length < 100 && renderedLength > 500) {
    return { isBlank: true, reason: 'Main content area is empty without JavaScript' };
  }

  // Threshold 3: Content hidden by CSS (major content containers only)
  const hiddenCheck = detectHiddenByCSS(rawHtml);
  if (hiddenCheck.isHidden && renderedLength > rawLength * 1.5) {
    return { isBlank: true, reason: hiddenCheck.reason || 'Content is hidden by CSS until JavaScript runs' };
  }

  // Threshold 4: Empty SPA containers
  if (detectEmptySPAContainers(rawHtml) && renderedLength > rawLength * 2) {
    return { isBlank: true, reason: 'SPA framework detected with empty root container' };
  }

  // Threshold 5: Significant content difference (>60% of content is JS-rendered)
  const contentDiff = renderedLength - rawLength;
  const contentRatio = renderedLength > 0 ? (contentDiff / renderedLength) * 100 : 0;
  if (contentRatio > 60 && contentDiff > 2000) {
    return { isBlank: true, reason: `${Math.round(contentRatio)}% of content is JS-rendered` };
  }

  // Threshold 6: Noscript fallback pattern (raw > rendered due to warning content)
  if (detectNoscriptFallback(rawHtml, rawLength, renderedLength)) {
    return { isBlank: true, reason: 'Page shows fallback/warning content without JavaScript' };
  }

  // Threshold 7: Web Components / Custom Elements that require JS to render
  // Cheerio extracts text from these, but browsers won't render them without JS
  const webComponents = detectWebComponents(rawHtml);
  if (webComponents.hasWebComponents) {
    return {
      isBlank: true,
      reason: `Content is inside Web Components that require JavaScript: ${webComponents.componentTypes.join(', ')}`,
    };
  }

  return { isBlank: false, reason: null };
}

/**
 * Calculate JS dependency score
 * Score = (renderedTextLength - rawTextLength) / renderedTextLength * 100
 *
 * Higher score = more content is JS-rendered
 * - >70%: Heavily JS-dependent (SPA)
 * - 40-70%: Moderate JS usage
 * - <40%: Mostly static
 */
function calculateJSScore(rawTextLength: number, renderedTextLength: number): number {
  // Special case: if rendered page is blank too, score is 0
  if (renderedTextLength === 0) return 0;

  // Special case: if raw is blank but rendered has content = 100% JS dependent
  if (rawTextLength < 50 && renderedTextLength > 200) {
    return 100;
  }

  const diff = renderedTextLength - rawTextLength;
  const score = (diff / renderedTextLength) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine page type from URL path
 */
function getPageType(url: string): JSAnalysisResult['pageType'] {
  try {
    const path = new URL(url).pathname.toLowerCase();

    if (path === '/' || path === '') return 'homepage';
    if (path.includes('/blog') || path.includes('/article')) return 'blog';
    if (path.includes('/docs') || path.includes('/documentation')) return 'docs';
    if (path.includes('/resource') || path.includes('/guide') || path.includes('/learn')) return 'resources';

    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Analyze JS dependency for a single URL
 */
export async function analyzeJSDependency(url: string): Promise<JSAnalysisResult> {
  const log = logger.child('js-analyzer');
  log.info(`Analyzing JS dependency for ${url}`);

  const browser = await getBrowser();
  const page = await createPage(browser);

  try {
    // Step 1: Fetch raw HTML (no JS execution)
    const rawHtml = await withRetry(() => fetchRawHtml(url), { maxRetries: 2 });

    // Step 2: Render with Puppeteer (full JS execution)
    const renderedHtml = await withRetry(() => renderPage(page, url, { waitTime: 5000 }), { maxRetries: 2 });

    // Step 3: Extract text content from both
    const rawText = extractTextContent(rawHtml);
    const renderedText = extractTextContent(renderedHtml);

    // Step 4: Pattern-based detection (no specific message matching)
    // Check for hidden content, empty SPA containers, web components, significant content gaps
    const blankCheck = isBlankWithoutJs(rawText, renderedText, rawHtml);
    const hiddenContentCheck = detectHiddenByCSS(rawHtml);
    const hasHiddenContent = hiddenContentCheck.isHidden;
    const hasEmptySPA = detectEmptySPAContainers(rawHtml);
    const hasNoscriptFallback = detectNoscriptFallback(rawHtml, rawText.length, renderedText.length);
    const webComponents = detectWebComponents(rawHtml);

    // Step 5: Calculate base score
    let jsScore = calculateJSScore(rawText.length, renderedText.length);

    // Boost score if page is effectively blank/hidden without JS
    if (blankCheck.isBlank && jsScore < 80) {
      jsScore = 80;
    }

    // Further boost if MAJOR content is hidden by CSS (not just animation elements)
    if (hasHiddenContent && jsScore < 70) {
      jsScore = 70;
    }

    // Further boost if empty SPA container detected
    if (hasEmptySPA && jsScore < 75) {
      jsScore = 75;
    }

    // Boost if noscript fallback pattern detected (page shows warnings without JS)
    if (hasNoscriptFallback && jsScore < 85) {
      jsScore = 85;
    }

    // Boost if content is inside web components that require JS
    if (webComponents.hasWebComponents && jsScore < 85) {
      jsScore = 85;
    }

    log.info(`JS Score for ${url}: ${jsScore}%`, {
      rawLength: rawText.length,
      renderedLength: renderedText.length,
      isBlank: blankCheck.isBlank,
      blankReason: blankCheck.reason,
      hasHiddenContent,
      hasEmptySPA,
      hasNoscriptFallback,
      hasWebComponents: webComponents.hasWebComponents,
      webComponentTypes: webComponents.componentTypes,
    });

    return {
      url,
      rawTextLength: rawText.length,
      renderedTextLength: renderedText.length,
      jsScore,
      rawHtml,
      renderedHtml,
      isBlankWithoutJs: blankCheck.isBlank,
      blankReason: blankCheck.reason,
      hasHiddenContent,
      hasEmptySPA,
      hasWebComponents: webComponents.hasWebComponents,
      webComponentTypes: webComponents.componentTypes,
      pageType: getPageType(url),
      analyzedAt: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

/**
 * Discover content pages from a base URL
 * Tries sitemap.xml and common content paths
 */
export async function discoverContentPages(baseUrl: string): Promise<string[]> {
  const log = logger.child('js-analyzer');
  const pages: Set<string> = new Set();

  try {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;

    // Always include the provided URL first (even if it's a deep link)
    pages.add(baseUrl);

    // Add homepage if different from provided URL
    const homepage = origin + '/';
    if (homepage !== baseUrl && !baseUrl.endsWith('/')) {
      pages.add(homepage);
    }

    // Try to fetch sitemap.xml (best effort, skip on error)
    try {
      const sitemapUrl = origin + '/sitemap.xml';
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'CrawlReady-Analyzer/1.0' },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const sitemapXml = await response.text();
        const $ = load(sitemapXml, { xmlMode: true });

        // Extract URLs from sitemap
        $('loc').each((_, el) => {
          const loc = $(el).text().trim();
          if (loc) {
            // Prioritize content pages
            if (CONTENT_PAGE_PATHS.some((path) => loc.toLowerCase().includes(path))) {
              pages.add(loc);
            }
          }
        });

        log.debug(`Found ${pages.size} pages from sitemap`);
      }
    } catch (e) {
      log.debug('No sitemap.xml found or error parsing');
    }

    // Add common content paths
    for (const path of CONTENT_PAGE_PATHS) {
      pages.add(origin + path);
    }

    // Limit to 5 pages max (homepage + 4 content pages)
    const pageArray = Array.from(pages).slice(0, 5);
    log.info(`Discovered ${pageArray.length} pages to analyze for ${baseUrl}`);

    return pageArray;
  } catch (e) {
    log.error(`Failed to discover pages for ${baseUrl}`, { error: String(e) });
    return [baseUrl];
  }
}

/**
 * Analyze multiple pages and return aggregated result
 * This is the main function to use for comprehensive analysis
 */
export async function analyzeWebsite(baseUrl: string): Promise<MultiPageAnalysisResult> {
  const log = logger.child('js-analyzer');
  log.info(`Starting multi-page analysis for ${baseUrl}`);

  // Discover pages to analyze
  const pagesToAnalyze = await discoverContentPages(baseUrl);
  const results: JSAnalysisResult[] = [];

  // Analyze each page (directly, no HEAD check to avoid SSL issues)
  for (const pageUrl of pagesToAnalyze) {
    try {
      const result = await analyzeJSDependency(pageUrl);
      // Only include if we got meaningful content
      if (result.renderedTextLength > 0) {
        results.push(result);
        log.info(`Analyzed ${pageUrl}: JS Score ${result.jsScore}%`);
      } else {
        log.debug(`Skipping ${pageUrl} - no content found`);
      }
    } catch (e) {
      // Log errors at info level for visibility (not debug)
      const errorMsg = e instanceof Error ? e.message : String(e);
      log.info(`Failed to analyze ${pageUrl}: ${errorMsg}`);
    }
  }

  // Find worst page (highest JS score) and aggregate detection results
  let worstPage: JSAnalysisResult | null = null;
  let overallJsScore = 0;
  let hasBlankPages = false;
  let hasHiddenContent = false;
  const blankReasons: string[] = [];

  for (const result of results) {
    if (result.jsScore > overallJsScore) {
      overallJsScore = result.jsScore;
      worstPage = result;
    }
    if (result.isBlankWithoutJs) {
      hasBlankPages = true;
      if (result.blankReason) {
        blankReasons.push(`${result.url}: ${result.blankReason}`);
      }
    }
    if (result.hasHiddenContent) {
      hasHiddenContent = true;
    }
  }

  log.info(`Multi-page analysis complete for ${baseUrl}`, {
    pagesAnalyzed: results.length,
    overallJsScore,
    hasBlankPages,
    hasHiddenContent,
    blankReasons: blankReasons.length,
    worstPageUrl: worstPage?.url,
  });

  return {
    baseUrl,
    pages: results,
    worstPage,
    overallJsScore,
    hasBlankPages,
    hasHiddenContent,
    blankReasons,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Analyze multiple URLs (legacy function for backward compatibility)
 */
export async function analyzeMultipleUrls(urls: string[]): Promise<Map<string, JSAnalysisResult>> {
  const results = new Map<string, JSAnalysisResult>();

  for (const url of urls) {
    try {
      const result = await analyzeJSDependency(url);
      results.set(url, result);
    } catch (error) {
      logger.error(`Failed to analyze ${url}`, { error: String(error) });
    }
  }

  return results;
}

/**
 * Get JS score category
 */
export function getJSScoreCategory(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get human-readable interpretation of JS score
 */
export function interpretJSScore(score: number): string {
  if (score >= 70) {
    return 'Heavily JS-dependent (SPA). Most content requires JavaScript to render. HIGH priority for CrawlReady.';
  }
  if (score >= 40) {
    return 'Moderate JS usage. Significant content is JS-rendered. MEDIUM priority for CrawlReady.';
  }
  return 'Mostly static content. Limited JS dependency. LOW priority for CrawlReady.';
}
