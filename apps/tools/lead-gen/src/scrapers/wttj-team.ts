/**
 * WTTJ Team Page Scraper
 * Extracts team member information from WTTJ company team pages
 */

import { load } from 'cheerio';
import type { WTTJCompany, WTTJTeamData, WTTJTeamMember, CompanyContacts, Contact } from '../types.js';
import { getBrowser, createPage, closeBrowser } from '../utils/puppeteer.js';
import { logger } from '../utils/logger.js';
import { createWTTJRateLimiter, withRetry } from '../utils/rate-limiter.js';

const WTTJ_BASE_URL = 'https://www.welcometothejungle.com';

// Team page URL patterns to try
const TEAM_PAGE_PATTERNS = ['/team', '/team-1', '/team-2', '/team-3'];

// Target roles for outreach (priority order)
const TARGET_ROLES = [
  // Technical
  'cto',
  'chief technology officer',
  'vp engineering',
  'head of engineering',
  'tech lead',
  'lead developer',
  'head of platform',
  'engineering manager',
  // Growth/Marketing
  'cmo',
  'chief marketing officer',
  'vp marketing',
  'head of marketing',
  'head of seo',
  'head of growth',
  'growth manager',
  // Founders (for small companies)
  'ceo',
  'chief executive officer',
  'founder',
  'co-founder',
  'co-fondateur',
  'co-fondatrice',
  'président',
  'présidente',
  'directeur général',
  'directrice générale',
  'dg',
];

/**
 * Clean up a role string - remove description text, limit length
 */
function cleanRole(role: string): string {
  // Take only the first line or sentence
  let cleaned = role.split(/[\n\r]/)[0].trim();

  // If role contains a name followed by description, extract just the role
  // Pattern: "CTOName est..." or "CEOName is..."
  const roleOnly = cleaned.match(/^(CTO|CEO|COO|CFO|CMO|CRO|VP|Head|Director|Manager|Lead|Co-?founder|Co-?fondateur|Co-?fondatrice|DG|Président|Présidente|Directeur|Directrice)(\s+\w+)?/i);
  if (roleOnly) {
    cleaned = roleOnly[0].trim();
  }

  // Limit to 50 chars and cut at sentence/description boundary
  if (cleaned.length > 50) {
    const cutPoint = cleaned.indexOf(' est ');
    if (cutPoint > 0 && cutPoint < 50) {
      cleaned = cleaned.substring(0, cutPoint);
    } else {
      cleaned = cleaned.substring(0, 50);
    }
  }

  cleaned = cleaned.trim();

  // Expand abbreviated roles
  // "Co" alone should become "Co-founder"
  if (cleaned.toLowerCase() === 'co') {
    return 'Co-founder';
  }

  return cleaned;
}

/**
 * Clean up a name - remove quotes, special chars
 * Handles WTTJ patterns like: "Quote text here"Name or "Quote"Name
 */
function cleanName(name: string): string {
  let cleaned = name.trim();

  // Normalize all types of quotes to a standard character for easier matching
  // U+201C " left double, U+201D " right double, U+2018 ' left single, U+2019 ' right single
  const normalizedForMatch = cleaned
    .replace(/[\u201C\u201D\u00AB\u00BB"]/g, '"')
    .replace(/[\u2018\u2019']/g, "'");

  // Pattern 1: Text ending with a quote character followed by a name
  // e.g., "On aime tellement l'agilité..."Cyril" → "Cyril"
  // e.g., "Le Sales intelligent évite l'effort inutile"Vincent" → "Vincent"
  const quoteNameMatch = normalizedForMatch.match(/["']([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)$/);
  if (quoteNameMatch) {
    return quoteNameMatch[1].trim();
  }

  // Pattern 2: Description text followed by a name at the end
  // e.g., "J'ai eu la chance..."Marie" → "Marie"
  const descNameMatch = normalizedForMatch.match(/[.!?]["']?([A-ZÀ-Ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ]+)*)$/);
  if (descNameMatch) {
    return descNameMatch[1].trim();
  }

  // Remove all quote characters
  cleaned = cleaned.replace(/[\u201C\u201D\u2018\u2019\u00AB\u00BB"']/g, '').trim();

  // Remove any leading/trailing punctuation
  cleaned = cleaned.replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ]+$/g, '');

  return cleaned.trim();
}

/**
 * Parse name from WTTJ team video title format
 * Format: "Rencontrez {Name}, {Role} - {Company}"
 * or: "Meet {Name}, {Role}"
 */
function parseTeamMemberTitle(title: string): { name: string; role: string } | null {
  // Try French format first
  const frenchMatch = title.match(/Rencontrez\s+([^,]+),\s*([^-–]+)/i);
  if (frenchMatch) {
    return {
      name: cleanName(frenchMatch[1]),
      role: cleanRole(frenchMatch[2]),
    };
  }

  // Try English format
  const englishMatch = title.match(/Meet\s+([^,]+),\s*([^-–]+)/i);
  if (englishMatch) {
    return {
      name: cleanName(englishMatch[1]),
      role: cleanRole(englishMatch[2]),
    };
  }

  // Try simple "Name, Role" format
  const simpleMatch = title.match(/^([^,]+),\s*(.+)$/);
  if (simpleMatch) {
    return {
      name: cleanName(simpleMatch[1]),
      role: cleanRole(simpleMatch[2]),
    };
  }

  return null;
}

/**
 * Extract team members from a WTTJ team page
 */
async function extractTeamMembers(html: string): Promise<WTTJTeamMember[]> {
  const $ = load(html);
  const members: WTTJTeamMember[] = [];
  const seenNames = new Set<string>();

  // Look for video cards with team member info
  // Common patterns in WTTJ:
  // - Video titles contain "Rencontrez X, Role"
  // - Cards with member photos and captions

  // Method 1: Video titles
  $('video, [data-testid="video"], [class*="Video"]').each((_, el) => {
    const $video = $(el);
    const title = $video.attr('title') || $video.attr('aria-label') || '';
    const parsed = parseTeamMemberTitle(title);

    if (parsed && !seenNames.has(parsed.name.toLowerCase())) {
      seenNames.add(parsed.name.toLowerCase());
      members.push({
        name: parsed.name,
        role: parsed.role,
        description: null,
        videoUrl: $video.attr('src') || null,
      });
    }
  });

  // Method 2: Team member cards/sections
  $('[data-testid="team-member"], [class*="TeamMember"], article').each((_, el) => {
    const $card = $(el);
    const text = $card.text();

    // Try to parse from card content
    const parsed = parseTeamMemberTitle(text);
    if (parsed && !seenNames.has(parsed.name.toLowerCase())) {
      seenNames.add(parsed.name.toLowerCase());

      // Look for description text
      const description = $card.find('p').text().trim() || null;

      members.push({
        name: parsed.name,
        role: parsed.role,
        description: description && description.length > 20 ? description.substring(0, 500) : null,
        videoUrl: $card.find('video').attr('src') || null,
      });
    }
  });

  // Method 3: Look for structured data in script tags
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      if (json.employee || json.member) {
        const employees = json.employee || json.member || [];
        for (const emp of Array.isArray(employees) ? employees : [employees]) {
          const name = emp.name || '';
          const role = emp.jobTitle || emp.roleName || '';
          if (name && !seenNames.has(name.toLowerCase())) {
            seenNames.add(name.toLowerCase());
            members.push({
              name,
              role,
              description: emp.description || null,
              videoUrl: null,
            });
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  });

  // Method 4: Look for heading + role patterns in general content
  $('h3, h4, [class*="name"], [class*="Name"]').each((_, el) => {
    const $el = $(el);
    const name = $el.text().trim();

    // Check if it looks like a name (2-4 words, capitalized)
    if (!/^[A-Z][a-zà-ü]+(\s+[A-Z][a-zà-ü]+){0,3}$/.test(name)) return;

    // Look for role in next sibling or parent context
    const roleEl = $el.next('p, span, [class*="role"], [class*="Role"]');
    const role = roleEl.text().trim();

    if (name && role && !seenNames.has(name.toLowerCase())) {
      seenNames.add(name.toLowerCase());
      members.push({
        name,
        role,
        description: null,
        videoUrl: null,
      });
    }
  });

  return members;
}

/**
 * Scrape team page for a company
 */
async function scrapeTeamPage(
  company: WTTJCompany,
  rateLimiter: ReturnType<typeof createWTTJRateLimiter>
): Promise<WTTJTeamData | null> {
  const log = logger.child('team-scraper');
  const browser = await getBrowser();
  const page = await createPage(browser);

  try {
    // Try different team page URL patterns
    for (const pattern of TEAM_PAGE_PATTERNS) {
      await rateLimiter.wait();

      const teamUrl = `${company.wttjUrl}${pattern}`;
      log.debug(`Trying team URL: ${teamUrl}`);

      try {
        const response = await page.goto(teamUrl, {
          waitUntil: 'networkidle2',
          timeout: 20000,
        });

        // Check if page exists (not 404)
        if (!response || response.status() === 404) {
          continue;
        }

        // Wait for content to load
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if we're on a team page (not redirected to main profile)
        const currentUrl = page.url();
        if (!currentUrl.includes('/team')) {
          continue;
        }

        const html = await page.content();
        const members = await extractTeamMembers(html);

        if (members.length > 0) {
          log.info(`Found ${members.length} team members for ${company.name}`);
          return {
            companySlug: company.slug,
            teamPageUrl: teamUrl,
            members,
            scrapedAt: new Date().toISOString(),
          };
        }
      } catch (error) {
        log.debug(`Team page not found at ${pattern}`, { error: String(error) });
      }
    }

    log.info(`No team page found for ${company.name}`);
    return null;
  } finally {
    await page.close();
  }
}

/**
 * Check if a role matches our target roles
 */
function isTargetRole(role: string): boolean {
  const normalizedRole = role.toLowerCase().trim();
  return TARGET_ROLES.some(
    (target) => normalizedRole.includes(target) || target.includes(normalizedRole)
  );
}

/**
 * Split name into first and last name
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

// Known non-company domains to skip
const INVALID_COMPANY_DOMAINS = [
  'vimeo.com',
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'medium.com',
  'github.com',
  'google.com',
  'apple.com',
];

/**
 * Check if domain is a valid company domain
 */
function isValidCompanyDomain(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();
  return !INVALID_COMPANY_DOMAINS.some((invalid) => lowerDomain.includes(invalid));
}

/**
 * Extract domain from website URL
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Scrape team pages and build contact list for companies
 */
export async function scrapeTeamsForCompanies(
  companies: WTTJCompany[],
  options: { concurrent?: number } = {}
): Promise<CompanyContacts[]> {
  const log = logger.child('team-scraper');
  const { concurrent = 1 } = options;

  log.info(`Scraping team pages for ${companies.length} companies`);

  const rateLimiter = createWTTJRateLimiter();
  const results: CompanyContacts[] = [];

  try {
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      logger.progress(i + 1, companies.length, `Scraping team for ${company.name}`);

      // Skip companies without a website URL
      if (!company.websiteUrl) {
        log.debug(`Skipping ${company.name} - no website URL`);
        results.push({
          company,
          domain: '',
          emailPattern: null,
          contacts: [],
          teamPageFound: false,
          discoveredAt: new Date().toISOString(),
        });
        continue;
      }

      const domain = extractDomain(company.websiteUrl);
      if (!domain) {
        log.debug(`Skipping ${company.name} - invalid website URL`);
        results.push({
          company,
          domain: '',
          emailPattern: null,
          contacts: [],
          teamPageFound: false,
          discoveredAt: new Date().toISOString(),
        });
        continue;
      }

      // Skip companies with non-company domains (social media, etc.)
      if (!isValidCompanyDomain(domain)) {
        log.debug(`Skipping ${company.name} - invalid domain: ${domain}`);
        results.push({
          company,
          domain: '',
          emailPattern: null,
          contacts: [],
          teamPageFound: false,
          discoveredAt: new Date().toISOString(),
        });
        continue;
      }

      // Scrape team page
      const teamData = await withRetry(
        () => scrapeTeamPage(company, rateLimiter),
        { maxRetries: 2 }
      );

      const contacts: Contact[] = [];

      if (teamData) {
        // Filter to target roles and create contacts
        for (const member of teamData.members) {
          if (isTargetRole(member.role)) {
            const { firstName, lastName } = splitName(member.name);

            contacts.push({
              name: member.name,
              firstName,
              lastName,
              role: member.role,
              company: company.name,
              domain,
              source: 'wttj-team',
              linkedinUrl: null, // Will be enriched later
              email: null, // Will be generated from pattern
              emailVerified: false,
              emailConfidence: 'guessed',
            });
          }
        }

        log.info(`Found ${contacts.length} target contacts for ${company.name}`);
      }

      results.push({
        company,
        domain,
        emailPattern: null, // Will be detected in contact discovery phase
        contacts,
        teamPageFound: teamData !== null,
        discoveredAt: new Date().toISOString(),
      });
    }

    return results;
  } finally {
    await closeBrowser();
  }
}

/**
 * Scrape team page for a single company
 */
export async function scrapeTeamForCompany(company: WTTJCompany): Promise<WTTJTeamData | null> {
  const rateLimiter = createWTTJRateLimiter();
  try {
    return await scrapeTeamPage(company, rateLimiter);
  } finally {
    await closeBrowser();
  }
}
