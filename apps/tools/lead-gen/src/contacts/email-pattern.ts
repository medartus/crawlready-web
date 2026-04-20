/**
 * Email Pattern Detection and Generation
 * Detects company email patterns and generates candidate emails
 */

import type { EmailPattern, Contact } from '../types.js';
import { logger } from '../utils/logger.js';

// Common email patterns in order of popularity
const EMAIL_PATTERNS = [
  { pattern: '{first}.{last}@{domain}', name: 'first.last' },
  { pattern: '{first}@{domain}', name: 'first' },
  { pattern: '{f}{last}@{domain}', name: 'flast' },
  { pattern: '{first}{last}@{domain}', name: 'firstlast' },
  { pattern: '{first}_{last}@{domain}', name: 'first_last' },
  { pattern: '{last}.{first}@{domain}', name: 'last.first' },
  { pattern: '{f}.{last}@{domain}', name: 'f.last' },
  { pattern: '{first}-{last}@{domain}', name: 'first-last' },
  { pattern: '{last}@{domain}', name: 'last' },
  { pattern: '{f}_{last}@{domain}', name: 'f_last' },
];

// Pattern detection heuristics by country
const COUNTRY_PATTERNS: Record<string, string[]> = {
  FR: ['{first}.{last}@{domain}', '{first}@{domain}'],
  US: ['{first}.{last}@{domain}', '{f}{last}@{domain}'],
  UK: ['{first}.{last}@{domain}', '{first}{last}@{domain}'],
  DE: ['{first}.{last}@{domain}', '{f}.{last}@{domain}'],
};

/**
 * Normalize name for email generation
 * Handles accents, special characters, compound names
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .trim();
}

/**
 * Parse first and last name from full name
 */
export function parseFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }

  // Handle common French compound first names
  const compoundFirstNames = ['jean', 'marie', 'pierre', 'anne'];
  if (
    parts.length >= 3 &&
    compoundFirstNames.includes(parts[0].toLowerCase()) &&
    parts[1].startsWith('-')
  ) {
    return {
      first: `${parts[0]}${parts[1]}`,
      last: parts.slice(2).join(' '),
    };
  }

  return {
    first: parts[0],
    last: parts.slice(1).join(' '),
  };
}

/**
 * Generate email from pattern and name
 */
export function generateEmail(
  firstName: string,
  lastName: string,
  domain: string,
  pattern: string
): string {
  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const f = first.charAt(0);

  // If no last name, use first-name only pattern
  if (!last) {
    return `${first}@${domain}`;
  }

  const email = pattern
    .replace('{first}', first)
    .replace('{last}', last)
    .replace('{f}', f)
    .replace('{domain}', domain);

  // Clean up any double dots or trailing dots before @
  return email.replace(/\.+@/, '@').replace(/\.{2,}/g, '.');
}

/**
 * Generate all possible emails for a contact
 */
export function generateAllEmailCandidates(
  firstName: string,
  lastName: string,
  domain: string
): string[] {
  const emails: string[] = [];

  for (const { pattern } of EMAIL_PATTERNS) {
    const email = generateEmail(firstName, lastName, domain, pattern);
    if (email && !emails.includes(email) && email.includes('@')) {
      emails.push(email);
    }
  }

  return emails;
}

/**
 * Detect email pattern from a known email
 */
export function detectPatternFromEmail(
  email: string,
  firstName: string,
  lastName: string
): EmailPattern | null {
  const log = logger.child('email-pattern');

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return null;

  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const f = first.charAt(0);

  // Try to match against known patterns
  for (const { pattern, name } of EMAIL_PATTERNS) {
    const expectedLocal = pattern
      .replace('{first}', first)
      .replace('{last}', last)
      .replace('{f}', f)
      .replace('@{domain}', '');

    if (localPart.toLowerCase() === expectedLocal.toLowerCase()) {
      log.debug(`Detected pattern: ${name} from ${email}`);
      return {
        pattern,
        confidence: 'high',
        source: `Matched from known email: ${email}`,
      };
    }
  }

  // Partial match - try to infer pattern
  if (localPart.includes(first) && localPart.includes(last)) {
    if (localPart === `${first}.${last}`) {
      return { pattern: '{first}.{last}@{domain}', confidence: 'high', source: email };
    }
    if (localPart === `${first}${last}`) {
      return { pattern: '{first}{last}@{domain}', confidence: 'high', source: email };
    }
    if (localPart === `${last}.${first}`) {
      return { pattern: '{last}.{first}@{domain}', confidence: 'high', source: email };
    }
  }

  if (localPart.includes(first)) {
    return { pattern: '{first}@{domain}', confidence: 'medium', source: email };
  }

  return null;
}

/**
 * Guess most likely email pattern for a domain
 * Based on domain TLD and common conventions
 */
export function guessPatternForDomain(domain: string): EmailPattern {
  const tld = domain.split('.').pop()?.toLowerCase();

  // French domains often use first.last
  if (tld === 'fr' || domain.includes('.fr')) {
    return {
      pattern: '{first}.{last}@{domain}',
      confidence: 'medium',
      source: 'French domain convention',
    };
  }

  // Tech companies often use first@domain
  if (domain.includes('tech') || domain.includes('io') || domain.includes('app')) {
    return {
      pattern: '{first}@{domain}',
      confidence: 'low',
      source: 'Tech domain convention',
    };
  }

  // Default to most common pattern
  return {
    pattern: '{first}.{last}@{domain}',
    confidence: 'low',
    source: 'Default pattern (most common)',
  };
}

/**
 * Apply detected pattern to generate email for a contact
 */
export function applyPatternToContact(
  contact: Contact,
  pattern: EmailPattern
): Contact {
  if (!contact.firstName || !contact.domain) {
    return contact;
  }

  const email = generateEmail(
    contact.firstName,
    contact.lastName,
    contact.domain,
    pattern.pattern
  );

  return {
    ...contact,
    email,
    emailConfidence: pattern.confidence === 'high' ? 'pattern-based' : 'guessed',
  };
}

/**
 * Try to find a real email for pattern detection
 * Looks in common places: GitHub, npm, press releases
 */
export async function findKnownEmailForDomain(domain: string): Promise<string | null> {
  const log = logger.child('email-pattern');

  try {
    // Check for common contact page patterns
    const contactUrls = [
      `https://${domain}/contact`,
      `https://${domain}/about`,
      `https://${domain}/team`,
      `https://www.${domain}/contact`,
    ];

    for (const url of contactUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          // Page exists, could scrape for emails
          // For now, just return null and use guessing
          log.debug(`Contact page found at ${url}`);
        }
      } catch {
        // Ignore fetch errors
      }
    }

    return null;
  } catch (error) {
    log.debug(`Failed to find known email for ${domain}`, { error: String(error) });
    return null;
  }
}
