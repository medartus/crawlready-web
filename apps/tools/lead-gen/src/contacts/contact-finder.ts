/**
 * Contact Finder
 * Aggregates contact discovery from multiple sources
 */

import type {
  WTTJCompany,
  WTTJTeamData,
  CompanyContacts,
  Contact,
  EmailPattern,
} from '../types.js';
import {
  guessPatternForDomain,
  generateEmail,
  parseFullName,
  applyPatternToContact,
} from './email-pattern.js';
import { verifyContactEmails, isGenericEmail } from './email-verifier.js';
import { logger } from '../utils/logger.js';

// Priority roles for outreach (ordered by preference)
const PRIORITY_ROLES: Record<string, number> = {
  // Technical (highest priority for CrawlReady)
  cto: 100,
  'chief technology officer': 100,
  'vp engineering': 95,
  'head of engineering': 90,
  'engineering manager': 85,
  'tech lead': 80,
  'lead developer': 75,
  'head of platform': 75,

  // Growth/Marketing
  'head of seo': 90,
  'head of growth': 85,
  'growth manager': 80,
  'vp marketing': 75,
  cmo: 75,
  'head of marketing': 70,

  // Founders (for smaller companies)
  'co-founder': 70,
  'co-fondateur': 70,
  'co-fondatrice': 70,
  founder: 70,
  ceo: 65,
  'chief executive officer': 65,
  président: 65,
  présidente: 65,
  'directeur général': 60,
  'directrice générale': 60,
  dg: 60,
};

/**
 * Calculate priority score for a role
 */
function getRolePriority(role: string): number {
  const normalizedRole = role.toLowerCase().trim();

  // Check direct match
  if (PRIORITY_ROLES[normalizedRole]) {
    return PRIORITY_ROLES[normalizedRole];
  }

  // Check partial matches
  for (const [key, score] of Object.entries(PRIORITY_ROLES)) {
    if (normalizedRole.includes(key) || key.includes(normalizedRole)) {
      return score;
    }
  }

  return 0;
}

/**
 * Extract domain from URL
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
 * Build contacts from WTTJ team data
 */
export function buildContactsFromTeam(
  company: WTTJCompany,
  teamData: WTTJTeamData | null,
  emailPattern: EmailPattern
): Contact[] {
  const log = logger.child('contact-finder');
  const contacts: Contact[] = [];

  if (!teamData || !company.websiteUrl) {
    return contacts;
  }

  const domain = extractDomain(company.websiteUrl);
  if (!domain) {
    return contacts;
  }

  for (const member of teamData.members) {
    const priority = getRolePriority(member.role);

    // Only include high-priority roles
    if (priority === 0) {
      log.debug(`Skipping non-priority role: ${member.role}`);
      continue;
    }

    const { first, last } = parseFullName(member.name);

    const contact: Contact = {
      name: member.name,
      firstName: first,
      lastName: last,
      role: member.role,
      company: company.name,
      domain,
      source: 'wttj-team',
      linkedinUrl: null,
      email: null,
      emailVerified: false,
      emailConfidence: 'guessed',
    };

    // Generate email from pattern
    const contactWithEmail = applyPatternToContact(contact, emailPattern);

    contacts.push(contactWithEmail);
  }

  // Sort by role priority
  contacts.sort((a, b) => getRolePriority(b.role) - getRolePriority(a.role));

  log.info(`Built ${contacts.length} contacts for ${company.name}`);
  return contacts;
}

/**
 * Find contacts for a company
 */
export async function findContactsForCompany(
  company: WTTJCompany,
  teamData: WTTJTeamData | null,
  options: { verifyEmails?: boolean } = {}
): Promise<CompanyContacts> {
  const log = logger.child('contact-finder');
  const { verifyEmails = true } = options;

  // Extract domain
  const domain = company.websiteUrl ? extractDomain(company.websiteUrl) : null;

  if (!domain) {
    log.info(`No domain found for ${company.name}`);
    return {
      company,
      domain: '',
      emailPattern: null,
      contacts: [],
      teamPageFound: false,
      discoveredAt: new Date().toISOString(),
    };
  }

  // Guess email pattern (could be enhanced with actual pattern detection)
  const emailPattern = guessPatternForDomain(domain);

  // Build contacts from team data
  let contacts = buildContactsFromTeam(company, teamData, emailPattern);

  // Verify emails if requested
  if (verifyEmails && contacts.length > 0) {
    contacts = await verifyContactEmails(contacts);
  }

  // Filter out generic emails
  contacts = contacts.filter((c) => !c.email || !isGenericEmail(c.email));

  return {
    company,
    domain,
    emailPattern,
    contacts,
    teamPageFound: teamData !== null,
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Enrich contact with LinkedIn URL
 */
export function enrichContactWithLinkedIn(
  contact: Contact,
  linkedinUrl: string
): Contact {
  return {
    ...contact,
    linkedinUrl,
  };
}

/**
 * Generate contact summary for outreach
 */
export function getContactSummary(contact: Contact): string {
  const parts = [contact.name, contact.role, `@ ${contact.company}`];

  if (contact.email) {
    parts.push(`<${contact.email}>`);
  }

  if (contact.linkedinUrl) {
    parts.push(`[LinkedIn]`);
  }

  return parts.join(' | ');
}

/**
 * Prioritize contacts for outreach
 * Returns top N contacts sorted by priority
 */
export function prioritizeContacts(contacts: Contact[], maxContacts: number = 3): Contact[] {
  // Sort by role priority
  const sorted = [...contacts].sort(
    (a, b) => getRolePriority(b.role) - getRolePriority(a.role)
  );

  // Prefer contacts with verified emails
  const withEmail = sorted.filter((c) => c.email && c.emailVerified);
  const withUnverifiedEmail = sorted.filter((c) => c.email && !c.emailVerified);
  const withoutEmail = sorted.filter((c) => !c.email);

  const prioritized = [...withEmail, ...withUnverifiedEmail, ...withoutEmail];

  return prioritized.slice(0, maxContacts);
}

/**
 * Check if company has sufficient contacts for outreach
 */
export function hasValidContacts(companyContacts: CompanyContacts): boolean {
  return companyContacts.contacts.some(
    (c) => c.email && (c.emailVerified || c.emailConfidence === 'pattern-based')
  );
}
