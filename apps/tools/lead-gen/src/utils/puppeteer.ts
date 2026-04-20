/**
 * Shared Puppeteer browser instance management
 * Reuses browser across multiple operations for efficiency
 */

import puppeteer, { Browser, Page } from 'puppeteer';

let browserInstance: Browser | null = null;

/**
 * Get or create a shared browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });
  }
  return browserInstance;
}

/**
 * Close the shared browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Create a new page with common settings
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });

  // Set user agent to avoid bot detection
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Block unnecessary resources for faster loading
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    // Block heavy resources when not needed
    if (['media', 'font'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return page;
}

/**
 * Create a page that doesn't block any resources (for screenshots)
 */
export async function createFullPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  return page;
}

/**
 * Fetch raw HTML without JavaScript execution
 */
export async function fetchRawHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Render a page with Puppeteer and return the HTML
 */
export async function renderPage(
  page: Page,
  url: string,
  options: { waitTime?: number; waitForSelector?: string } = {}
): Promise<string> {
  const { waitTime = 3000, waitForSelector } = options;

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Additional wait for JS to execute
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
  }
  await new Promise((resolve) => setTimeout(resolve, waitTime));

  return page.content();
}

/**
 * Take a screenshot of a page
 */
export async function takeScreenshot(
  page: Page,
  url: string,
  outputPath: string,
  options: { fullPage?: boolean; waitTime?: number } = {}
): Promise<void> {
  const { fullPage = false, waitTime = 3000 } = options;

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  await new Promise((resolve) => setTimeout(resolve, waitTime));

  await page.screenshot({
    path: outputPath,
    fullPage,
  });
}
