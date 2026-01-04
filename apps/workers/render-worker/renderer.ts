import type { Browser, HTTPRequest, Page } from 'puppeteer';
import puppeteer from 'puppeteer';

/**
 * Puppeteer page renderer with optimizations for AI bot crawling:
 * - Resource blocking (images, fonts, media, analytics)
 * - Auto-scrolling to trigger lazy-loading
 * - Wait for network idle
 * - Extract final rendered HTML
 */

type RenderOptions = {
  waitForSelector?: string;
  timeout?: number;
  blockResources?: boolean;
  autoScroll?: boolean;
};

type RenderMetrics = {
  loadTime: number;
  totalRequests: number;
  blockedRequests: number;
};

type RenderResult = {
  html: string;
  metrics: RenderMetrics;
};

// Resources to block for faster rendering
const BLOCKED_RESOURCE_TYPES = [
  'image',
  'media',
  'font',
  'texttrack',
  'object',
  'beacon',
  'csp_report',
  'imageset',
];

const BLOCKED_URL_PATTERNS = [
  // Analytics
  'google-analytics.com',
  'googletagmanager.com',
  'analytics.google.com',
  'mixpanel.com',
  'segment.com',
  'amplitude.com',
  'hotjar.com',
  'fullstory.com',
  // Ads
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'facebook.com/tr',
  // Social widgets
  'facebook.net',
  'twitter.com/widgets',
  'platform.twitter.com',
  // Other trackers
  'intercom.io',
  'drift.com',
];

let browserInstance: Browser | null = null;

/**
 * Get or create browser instance (reuse for performance)
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,

    protocolTimeout: 180000, // 3 minutes for CDP protocol

    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-extensions-with-background-pages',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
    ],
  });

  return browserInstance;
}

/**
 * Auto-scroll page to trigger lazy-loading
 */
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          // Scroll back to top
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * Render a page and return the HTML + metrics
 */
export async function renderPage(
  url: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const {
    waitForSelector,
    timeout = 60000, // Increased from 30s to 60s for Fly.io
    blockResources = true,
    autoScroll: shouldScroll = true,
  } = options;

  let retries = 0;
  const maxRetries = 2;

  while (retries <= maxRetries) {
    try {
      return await renderPageInternal(url, options, timeout, blockResources, shouldScroll, waitForSelector);
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error;
      }

      // Log retry attempt
      console.error(`Render attempt ${retries} failed, retrying... Error:`, error instanceof Error ? error.message : 'Unknown error');

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));

      // Close and recreate browser on protocol timeout errors
      if (error instanceof Error && error.message.includes('timed out')) {
        await closeBrowser();
      }
    }
  }

  throw new Error('Render failed after max retries');
}

/**
 * Internal render implementation (wrapped with retry logic)
 */
async function renderPageInternal(
  url: string,
  options: RenderOptions,
  timeout: number,
  blockResources: boolean,
  shouldScroll: boolean,
  waitForSelector?: string,
): Promise<RenderResult> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  let totalRequests = 0;
  let blockedRequests = 0;
  const startTime = Date.now();

  try {
    // Set viewport
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    // Set user agent (mimic real browser)
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );

    // Enable request interception for resource blocking
    if (blockResources) {
      await page.setRequestInterception(true);

      page.on('request', (req: HTTPRequest) => {
        totalRequests++;

        const resourceType = req.resourceType();
        const url = req.url();

        // Block images, fonts, media, etc.
        if (BLOCKED_RESOURCE_TYPES.includes(resourceType)) {
          blockedRequests++;
          req.abort();
          return;
        }

        // Block analytics and tracking scripts
        if (BLOCKED_URL_PATTERNS.some(pattern => url.includes(pattern))) {
          blockedRequests++;
          req.abort();
          return;
        }

        req.continue();
      });
    }

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout,
    });

    // Wait for custom selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 5000 });
    }

    // Auto-scroll to trigger lazy loading
    if (shouldScroll) {
      await autoScroll(page);
      // Wait a bit for any lazy-loaded content
      await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {
        // Ignore timeout, best effort
      });
    }

    // Extract HTML
    const html = await page.content();

    const loadTime = Date.now() - startTime;

    return {
      html,
      metrics: {
        loadTime,
        totalRequests,
        blockedRequests,
      },
    };
  } finally {
    await page.close();
  }
}

/**
 * Clean up browser instance (call on shutdown)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Graceful shutdown
process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);
