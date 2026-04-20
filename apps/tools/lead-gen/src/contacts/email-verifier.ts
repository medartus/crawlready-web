/**
 * Email Verification
 * Basic email validation, MX record checking, and SMTP verification
 */

import { promises as dnsPromises } from 'dns';
import * as dns from 'dns';
import * as net from 'net';
import type { Contact } from '../types.js';
import { logger } from '../utils/logger.js';
import { generateAllEmailCandidates, normalizeName } from './email-pattern.js';

interface VerificationResult {
  email: string;
  valid: boolean;
  hasMx: boolean;
  catchAll: boolean | null;
  reason: string;
}

export interface SmtpVerificationResult {
  email: string;
  valid: boolean;
  response: string;
  responseCode: number | null;
}

export interface FullVerificationReport {
  domain: string;
  mxRecords: string[];
  candidates: SmtpVerificationResult[];
  validEmails: string[];
  detectedPattern: string | null;
  timestamp: string;
}

// DNS resolver with timeout
const resolver = new dns.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']); // Google and Cloudflare DNS

/**
 * Basic email format validation
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email
 */
export function getDomainFromEmail(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Check if domain has MX records
 */
export async function hasMxRecords(domain: string): Promise<boolean> {
  const log = logger.child('email-verifier');

  try {
    const records = await resolver.resolveMx(domain);
    const hasMx = records && records.length > 0;
    log.debug(`MX check for ${domain}: ${hasMx ? 'found' : 'not found'}`);
    return hasMx;
  } catch (error) {
    const errorMessage = String(error);
    // ENODATA or ENOTFOUND means no MX records
    if (errorMessage.includes('ENODATA') || errorMessage.includes('ENOTFOUND')) {
      return false;
    }
    log.debug(`MX lookup error for ${domain}`, { error: errorMessage });
    return false;
  }
}

/**
 * Check if domain uses catch-all email
 * (Accepts all emails, making verification unreliable)
 */
export async function isCatchAllDomain(_domain: string): Promise<boolean | null> {
  // Note: True catch-all detection requires SMTP verification
  // which can be blocked by mail servers. Return null to indicate unknown.
  return null;
}

/**
 * Verify a single email address
 * Returns verification result with details
 */
export async function verifyEmail(email: string): Promise<VerificationResult> {
  const log = logger.child('email-verifier');

  // Basic format check
  if (!isValidEmailFormat(email)) {
    return {
      email,
      valid: false,
      hasMx: false,
      catchAll: null,
      reason: 'Invalid email format',
    };
  }

  const domain = getDomainFromEmail(email);
  if (!domain) {
    return {
      email,
      valid: false,
      hasMx: false,
      catchAll: null,
      reason: 'Could not extract domain',
    };
  }

  // Check MX records
  const hasMx = await hasMxRecords(domain);
  if (!hasMx) {
    return {
      email,
      valid: false,
      hasMx: false,
      catchAll: null,
      reason: 'Domain has no MX records',
    };
  }

  // Check for catch-all (optional)
  const catchAll = await isCatchAllDomain(domain);

  log.debug(`Email ${email}: MX found, catch-all: ${catchAll}`);

  return {
    email,
    valid: true,
    hasMx: true,
    catchAll,
    reason: catchAll ? 'Domain uses catch-all (verification uncertain)' : 'MX records found',
  };
}

/**
 * Verify multiple emails and return results
 */
export async function verifyEmails(emails: string[]): Promise<Map<string, VerificationResult>> {
  const results = new Map<string, VerificationResult>();

  // Cache MX lookups per domain
  const mxCache = new Map<string, boolean>();

  for (const email of emails) {
    const domain = getDomainFromEmail(email);

    if (domain && !mxCache.has(domain)) {
      mxCache.set(domain, await hasMxRecords(domain));
    }

    if (!isValidEmailFormat(email)) {
      results.set(email, {
        email,
        valid: false,
        hasMx: false,
        catchAll: null,
        reason: 'Invalid format',
      });
      continue;
    }

    const hasMx = domain ? (mxCache.get(domain) ?? false) : false;
    results.set(email, {
      email,
      valid: hasMx,
      hasMx,
      catchAll: null,
      reason: hasMx ? 'MX found' : 'No MX records',
    });
  }

  return results;
}

/**
 * Update contact with verification status
 */
export async function verifyContactEmail(contact: Contact): Promise<Contact> {
  if (!contact.email) {
    return contact;
  }

  const result = await verifyEmail(contact.email);

  return {
    ...contact,
    emailVerified: result.valid && result.hasMx,
    emailConfidence: result.valid ? contact.emailConfidence : 'guessed',
  };
}

/**
 * Batch verify contacts
 */
export async function verifyContactEmails(contacts: Contact[]): Promise<Contact[]> {
  const log = logger.child('email-verifier');
  const results: Contact[] = [];

  // Group by domain to minimize DNS lookups
  const domainMxCache = new Map<string, boolean>();

  for (const contact of contacts) {
    if (!contact.email) {
      results.push(contact);
      continue;
    }

    const domain = getDomainFromEmail(contact.email);
    if (!domain) {
      results.push({ ...contact, emailVerified: false });
      continue;
    }

    // Cache MX lookup
    if (!domainMxCache.has(domain)) {
      domainMxCache.set(domain, await hasMxRecords(domain));
    }

    const hasMx = domainMxCache.get(domain) ?? false;

    results.push({
      ...contact,
      emailVerified: hasMx,
    });
  }

  log.info(`Verified ${contacts.length} contacts`);
  return results;
}

/**
 * Get disposable email domain list
 * These should be flagged as likely invalid for B2B outreach
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'mailinator.com',
    'guerrillamail.com',
    'tempmail.com',
    '10minutemail.com',
    'throwaway.email',
    'temp-mail.org',
    'fakeinbox.com',
    'yopmail.com',
  ];

  const domain = getDomainFromEmail(email);
  return domain ? disposableDomains.includes(domain.toLowerCase()) : false;
}

/**
 * Check if email is likely a generic role-based email
 */
export function isGenericEmail(email: string): boolean {
  const genericPrefixes = [
    'info',
    'contact',
    'hello',
    'support',
    'sales',
    'admin',
    'help',
    'team',
    'office',
    'general',
    'enquiries',
    'noreply',
    'no-reply',
  ];

  const localPart = email.split('@')[0]?.toLowerCase();
  return genericPrefixes.some((prefix) => localPart === prefix);
}

// =============================================================================
// SMTP VERIFICATION (More accurate than MX-only checking)
// =============================================================================

/**
 * Get MX records for a domain (sorted by priority)
 */
export async function getMXRecords(domain: string): Promise<string[]> {
  const log = logger.child('email-verifier');

  return new Promise((resolve, reject) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err) {
        log.error(`Failed to resolve MX for ${domain}`, { error: err.message });
        reject(err);
      } else {
        const sorted = addresses
          .sort((a, b) => a.priority - b.priority)
          .map((a) => a.exchange);
        log.debug(`MX records for ${domain}`, { records: sorted });
        resolve(sorted);
      }
    });
  });
}

/**
 * Verify a single email via SMTP RCPT TO command
 * This checks if the mailbox actually exists
 */
export async function smtpVerifyEmail(
  email: string,
  mxHost: string,
  timeout = 10000
): Promise<SmtpVerificationResult> {
  const log = logger.child('email-verifier');

  return new Promise((resolve) => {
    const socket = net.createConnection(25, mxHost);
    let step = 0;
    let fullResponse = '';

    socket.setTimeout(timeout);

    socket.on('data', (data) => {
      const msg = data.toString();
      fullResponse += msg;

      if (step === 0 && msg.startsWith('220')) {
        socket.write('EHLO verify.local\r\n');
        step++;
      } else if (step === 1 && msg.includes('250')) {
        socket.write('MAIL FROM:<test@verify.local>\r\n');
        step++;
      } else if (step === 2 && msg.startsWith('250')) {
        socket.write(`RCPT TO:<${email}>\r\n`);
        step++;
      } else if (step === 3) {
        const responseCode = parseInt(msg.substring(0, 3), 10);
        const valid = msg.startsWith('250');

        // Send QUIT and close connection
        try {
          socket.write('QUIT\r\n');
        } catch {
          // Ignore write errors during cleanup
        }
        socket.end();
        step++; // Prevent processing further data

        log.debug(`SMTP verified ${email}`, { valid, responseCode });
        resolve({
          email,
          valid,
          response: msg.trim().split('\n')[0].substring(0, 150),
          responseCode,
        });
      }
    });

    socket.on('timeout', () => {
      socket.destroy();
      log.warn(`Timeout verifying ${email}`);
      resolve({ email, valid: false, response: 'Connection timeout', responseCode: null });
    });

    socket.on('error', (err) => {
      log.error(`Error verifying ${email}`, { error: err.message });
      resolve({ email, valid: false, response: err.message, responseCode: null });
    });
  });
}

/**
 * Verify multiple emails via SMTP (with concurrency control)
 */
export async function smtpVerifyEmails(
  emails: string[],
  mxHost: string,
  concurrency = 2
): Promise<SmtpVerificationResult[]> {
  const results: SmtpVerificationResult[] = [];

  for (let i = 0; i < emails.length; i += concurrency) {
    const batch = emails.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((email) => smtpVerifyEmail(email, mxHost))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Detect email pattern from verified emails
 */
function detectPatternFromVerified(
  validEmails: string[],
  firstName: string,
  lastName: string
): string | null {
  if (validEmails.length === 0) return null;

  const first = normalizeName(firstName);
  const last = normalizeName(lastName);
  const f = first.charAt(0);

  for (const email of validEmails) {
    const [localPart] = email.split('@');

    if (localPart === first) return '{first}@{domain}';
    if (localPart === `${first}.${last}`) return '{first}.{last}@{domain}';
    if (localPart === `${f}${last}`) return '{f}{last}@{domain}';
    if (localPart === `${first}${last}`) return '{first}{last}@{domain}';
    if (localPart === `${first}_${last}`) return '{first}_{last}@{domain}';
    if (localPart === `${last}.${first}`) return '{last}.{first}@{domain}';
    if (localPart === `${f}.${last}`) return '{f}.{last}@{domain}';
    if (localPart === last) return '{last}@{domain}';
  }

  return null;
}

/**
 * Full SMTP verification workflow for a contact
 * Generates all email candidates and verifies each one
 */
export async function findAndVerifyEmail(
  firstName: string,
  lastName: string,
  domain: string
): Promise<FullVerificationReport> {
  const log = logger.child('email-verifier');
  log.info(`Starting full email verification for ${firstName} ${lastName} @ ${domain}`);

  // Clean domain
  const cleanDomain = domain.replace(/^www\./, '').toLowerCase();

  // Get MX records
  let mxRecords: string[];
  try {
    mxRecords = await getMXRecords(cleanDomain);
  } catch {
    return {
      domain: cleanDomain,
      mxRecords: [],
      candidates: [],
      validEmails: [],
      detectedPattern: null,
      timestamp: new Date().toISOString(),
    };
  }

  if (mxRecords.length === 0) {
    log.warn(`No MX records found for ${cleanDomain}`);
    return {
      domain: cleanDomain,
      mxRecords: [],
      candidates: [],
      validEmails: [],
      detectedPattern: null,
      timestamp: new Date().toISOString(),
    };
  }

  // Generate candidates
  const emailCandidates = generateAllEmailCandidates(firstName, lastName, cleanDomain);
  log.info(`Generated ${emailCandidates.length} email candidates`);

  // Verify all candidates via SMTP
  const mxHost = mxRecords[0];
  const results = await smtpVerifyEmails(emailCandidates, mxHost);

  // Extract valid emails
  const validEmails = results.filter((r) => r.valid).map((r) => r.email);

  // Detect pattern
  const detectedPattern = detectPatternFromVerified(validEmails, firstName, lastName);

  log.info(`Verification complete`, {
    domain: cleanDomain,
    validCount: validEmails.length,
    pattern: detectedPattern,
  });

  return {
    domain: cleanDomain,
    mxRecords,
    candidates: results,
    validEmails,
    detectedPattern,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Quick SMTP verify a single email address
 */
export async function quickSmtpVerify(email: string): Promise<SmtpVerificationResult> {
  const [, domain] = email.split('@');
  if (!domain) {
    return { email, valid: false, response: 'Invalid email format', responseCode: null };
  }

  try {
    const mxRecords = await getMXRecords(domain);
    if (mxRecords.length === 0) {
      return { email, valid: false, response: 'No MX records found', responseCode: null };
    }
    return await smtpVerifyEmail(email, mxRecords[0]);
  } catch (err) {
    return { email, valid: false, response: String(err), responseCode: null };
  }
}

/**
 * Format verification report for console output
 */
export function formatVerificationReport(report: FullVerificationReport): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push(`📧 Email Verification Report for ${report.domain}`);
  lines.push(`${'='.repeat(60)}\n`);

  lines.push(`📬 MX Records: ${report.mxRecords.join(', ') || 'None found'}\n`);
  lines.push(`Tested ${report.candidates.length} candidates:\n`);

  for (const result of report.candidates) {
    const icon = result.valid ? '✅' : '❌';
    lines.push(`${icon} ${result.email}`);
    lines.push(`   └─ ${result.response}\n`);
  }

  lines.push(`${'─'.repeat(60)}`);
  lines.push(
    `✅ Valid emails: ${report.validEmails.length > 0 ? report.validEmails.join(', ') : 'None found'}`
  );
  lines.push(`🔍 Detected pattern: ${report.detectedPattern || 'Unknown'}`);
  lines.push(`⏱️  Verified at: ${report.timestamp}`);
  lines.push(`${'='.repeat(60)}\n`);

  return lines.join('\n');
}
