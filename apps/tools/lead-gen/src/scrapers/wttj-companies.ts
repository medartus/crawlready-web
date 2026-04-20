/**
 * WTTJ (Welcome to the Jungle) Company Listings Scraper
 * Scrapes tech companies from WTTJ with their basic profile data
 */

import { load } from 'cheerio';
import type { WTTJCompany } from '../types.js';
import {
  getBrowser,
  createPage,
  closeBrowser,
} from '../utils/puppeteer.js';
import { logger } from '../utils/logger.js';
import { createWTTJRateLimiter, withRetry } from '../utils/rate-limiter.js';

const WTTJ_BASE_URL = 'https://www.welcometothejungle.com';

// Tech sectors to filter for
const TECH_SECTORS = [
  'Software',
  'SaaS / Cloud Services',
  'Mobile Apps',
  'E-commerce',
  'EdTech',
  'FinTech / InsurTech',
  'HealthTech',
  'Artificial Intelligence / Machine Learning',
];

interface ScrapeOptions {
  region?: string;
  pages?: number;
  sectors?: string[];
}

/**
 * Build the WTTJ company listings URL with filters
 */
function buildListingUrl(page: number, region?: string, sectors?: string[]): string {
  const baseUrl = `${WTTJ_BASE_URL}/en/companies`;
  const params = new URLSearchParams();

  params.set('page', page.toString());

  // Add sector filters
  const sectorList = sectors || TECH_SECTORS;
  sectorList.forEach((sector) => {
    params.append('refinementList[sectors_name.en.Tech][]', sector);
  });

  // Add region filter if specified
  if (region) {
    params.set('aroundLatLng', ''); // Clear geographic search
    params.append('refinementList[offices.country_code][]', region.toUpperCase());
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Extract company data from a listing page
 */
async function extractCompaniesFromPage(html: string): Promise<Partial<WTTJCompany>[]> {
  const $ = load(html);
  const companies: Partial<WTTJCompany>[] = [];

  // WTTJ uses a card-based layout for company listings
  // The exact selectors may need adjustment based on WTTJ's current HTML structure
  $('a[data-testid="companies-directory-link"], a[href*="/en/companies/"]').each((_, element) => {
    const $el = $(element);
    const href = $el.attr('href');

    // Only process company profile links
    if (!href || !href.includes('/en/companies/') || href.includes('/jobs')) {
      return;
    }

    // Extract slug from URL
    const slugMatch = href.match(/\/en\/companies\/([^\/]+)/);
    if (!slugMatch) return;

    const slug = slugMatch[1];

    // Try to extract company name from various possible elements
    const name =
      $el.find('h3, h4, [data-testid="company-name"]').first().text().trim() ||
      $el.find('span').first().text().trim() ||
      slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    if (name && slug) {
      companies.push({
        name,
        slug,
        wttjUrl: `${WTTJ_BASE_URL}${href}`,
      });
    }
  });

  // Deduplicate by slug
  const seen = new Set<string>();
  return companies.filter((c) => {
    if (seen.has(c.slug!)) return false;
    seen.add(c.slug!);
    return true;
  });
}

/**
 * Scrape detailed company profile
 */
async function scrapeCompanyProfile(
  slug: string,
  rateLimiter: ReturnType<typeof createWTTJRateLimiter>
): Promise<WTTJCompany | null> {
  const log = logger.child('scraper');
  const browser = await getBrowser();
  const page = await createPage(browser);

  try {
    await rateLimiter.wait();

    const profileUrl = `${WTTJ_BASE_URL}/en/companies/${slug}`;
    log.debug(`Scraping profile: ${profileUrl}`);

    await page.goto(profileUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const html = await page.content();
    const $ = load(html);

    // Extract company data
    const company: WTTJCompany = {
      name: $('h1').first().text().trim() || slug.replace(/-/g, ' '),
      slug,
      wttjUrl: profileUrl,
      websiteUrl: null,
      linkedinUrl: null,
      twitterUrl: null,
      sector: [],
      employeeCount: null,
      location: null,
      description: null,
      scrapedAt: new Date().toISOString(),
    };

    // Extract website URL - look for external links that are company websites
    $('a[href]').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      const text = $link.text().toLowerCase();

      if (!href) return;

      // Must be an absolute URL starting with http
      if (!href.startsWith('http')) return;

      // Skip WTTJ's own links
      if (href.includes('welcometothejungle')) return;

      // LinkedIn company page (not WTTJ's LinkedIn)
      if (href.includes('linkedin.com/company') && !href.includes('/wttj')) {
        company.linkedinUrl = href;
        return;
      }

      // Twitter/X (not WTTJ's Twitter)
      if ((href.includes('twitter.com/') || href.includes('x.com/')) && !href.includes('/wttj')) {
        company.twitterUrl = href;
        return;
      }

      // Skip other social media and non-website links
      if (
        href.includes('facebook.com') ||
        href.includes('instagram.com') ||
        href.includes('youtube.com') ||
        href.includes('github.com') ||
        href.includes('vimeo.com') ||
        href.includes('maps.google') ||
        href.includes('google.com/maps') ||
        href.includes('apple.com/maps') ||
        href.includes('play.google.com') ||
        href.includes('apps.apple.com') ||
        href.includes('medium.com')
      ) {
        return;
      }

      // External website link - prefer links with "website" or "site" text
      if (
        !company.websiteUrl &&
        (text.includes('website') || text.includes('site') || text.includes('visiter'))
      ) {
        company.websiteUrl = href;
      }
    });

    // Second pass: if no website found, look for any external http link
    if (!company.websiteUrl) {
      $('a[href^="http"]').each((_, el) => {
        const href = $(el).attr('href');
        if (
          href &&
          !href.includes('welcometothejungle') &&
          !href.includes('linkedin') &&
          !href.includes('twitter') &&
          !href.includes('facebook') &&
          !href.includes('instagram') &&
          !href.includes('youtube') &&
          !href.includes('x.com') &&
          !href.includes('vimeo.com') &&
          !href.includes('medium.com') &&
          !href.includes('maps.google') &&
          !href.includes('google.com/maps') &&
          !href.includes('play.google.com') &&
          !href.includes('apps.apple.com')
        ) {
          // Likely a company website
          company.websiteUrl = href;
          return false; // break
        }
      });
    }

    // Extract sectors/tags
    $('[data-testid="tag"], .sc-bqyKva, .tag, [class*="Tag"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50) {
        company.sector.push(text);
      }
    });

    // Extract employee count
    const employeeText = $('body').text();
    const employeeMatch = employeeText.match(/(\d+[-–]\d+|\d+\+?)\s*(employees|salariés|collaborateurs)/i);
    if (employeeMatch) {
      company.employeeCount = employeeMatch[1];
    }

    // Extract location
    $('[data-testid="location"], [class*="Location"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100) {
        company.location = text;
      }
    });

    // Extract description
    const description = $('[data-testid="company-description"], [class*="Description"] p')
      .first()
      .text()
      .trim();
    if (description) {
      company.description = description.substring(0, 500);
    }

    return company;
  } catch (error) {
    log.error(`Failed to scrape profile for ${slug}`, { error: String(error) });
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Main scraping function - scrapes WTTJ company listings
 */
export async function scrapeWTTJCompanies(options: ScrapeOptions = {}): Promise<WTTJCompany[]> {
  const log = logger.child('wttj-scraper');
  const { region = 'FR', pages = 10, sectors } = options;

  log.info(`Starting WTTJ scrape`, { region, pages, sectors: sectors?.length || TECH_SECTORS.length });

  const browser = await getBrowser();
  const rateLimiter = createWTTJRateLimiter();
  const allCompanies: WTTJCompany[] = [];
  const seenSlugs = new Set<string>();

  try {
    // First, collect company slugs from listing pages
    const slugsToScrape: string[] = [];

    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const page = await createPage(browser);

      try {
        await rateLimiter.wait();

        const url = buildListingUrl(pageNum, region, sectors);
        log.info(`Scraping listing page ${pageNum}/${pages}`);

        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Wait for content to load
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Scroll to load lazy content
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const html = await page.content();
        const pageCompanies = await extractCompaniesFromPage(html);

        log.info(`Found ${pageCompanies.length} companies on page ${pageNum}`);

        for (const company of pageCompanies) {
          if (company.slug && !seenSlugs.has(company.slug)) {
            seenSlugs.add(company.slug);
            slugsToScrape.push(company.slug);
          }
        }

        // Check if we've reached the last page (no new companies)
        if (pageCompanies.length === 0) {
          log.info(`No more companies found, stopping at page ${pageNum}`);
          break;
        }
      } catch (error) {
        log.error(`Error scraping page ${pageNum}`, { error: String(error) });
      } finally {
        await page.close();
      }
    }

    log.info(`Collected ${slugsToScrape.length} unique company slugs`);

    // Now scrape individual profiles
    for (let i = 0; i < slugsToScrape.length; i++) {
      const slug = slugsToScrape[i];
      logger.progress(i + 1, slugsToScrape.length, `Scraping ${slug}`);

      const company = await withRetry(
        () => scrapeCompanyProfile(slug, rateLimiter),
        { maxRetries: 2 }
      );

      if (company) {
        allCompanies.push(company);
      }
    }

    log.info(`Successfully scraped ${allCompanies.length} companies`);
    return allCompanies;
  } finally {
    await closeBrowser();
  }
}

/**
 * Scrape a single company by slug
 */
export async function scrapeCompany(slug: string): Promise<WTTJCompany | null> {
  const rateLimiter = createWTTJRateLimiter();
  try {
    return await scrapeCompanyProfile(slug, rateLimiter);
  } finally {
    await closeBrowser();
  }
}
