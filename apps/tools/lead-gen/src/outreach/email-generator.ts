/**
 * Email Generator
 * Generates personalized outreach emails from templates and analysis data
 */

import type {
  CompanyAnalysis,
  Contact,
  PersonalizedOutreach,
  OutreachQueueItem,
} from '../types.js';
import { buildTemplateContext, renderTemplate, renderInlineTemplate } from './template-renderer.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

// Inline templates (fallback if files don't exist)
const INLINE_TEMPLATES = {
  'email-initial-subject':
    "{{company.name}}'s website is {{analysis.jsScore}}% invisible to ChatGPT",

  'email-initial-body': `Hi {{contact.firstName}},

I was analyzing how AI search engines see {{company.name}}'s website, and found something concerning.

When GPTBot (ChatGPT's crawler) visits {{company.website}}, it only sees {{round (subtract 100 analysis.jsScore)}}% of your content. The rest requires JavaScript to render - which most AI crawlers can't execute.

{{#if analysis.metaTagsJsInjected}}
Even worse: your meta tags (title, description) are JavaScript-injected, so AI bots miss your SEO metadata entirely.
{{/if}}

I'm building CrawlReady, a pre-rendering solution specifically for AI crawlers. We're looking for 5-10 co-creation partners to shape the product.

As a partner, you'd get:
- Free early access
- Direct input on features
- Priority support

Would you be open to a 15-minute call this week to see if this is relevant for {{company.name}}?

Best,
{{sender.name}}`,

  'email-followup-1-subject':
    'Re: {{company.name}}\'s website is {{analysis.jsScore}}% invisible to ChatGPT',

  'email-followup-1-body': `Hi {{contact.firstName}},

Quick follow-up on my previous email. I've put together a detailed analysis for {{company.website}}:

- JS dependency score: {{analysis.jsScore}}%
- Framework detected: {{analysis.framework}}
- Content lost to AI bots: {{analysis.contentLost}}%
{{#each analysis.reasons}}
- {{this}}
{{/each}}

This is becoming critical as AI search grows - Gartner predicts 25% of searches will be AI-powered by 2026.

Would a 15-minute call work this week?

Best,
{{sender.name}}`,

  'email-followup-2-subject': 'Last note - AI visibility analysis for {{company.name}}',

  'email-followup-2-body': `Hi {{contact.firstName}},

Final follow-up. If AI search visibility isn't a priority right now, totally understand.

If it becomes relevant in the future, the analysis I created for {{company.name}} remains valid. Happy to share it whenever useful.

Best,
{{sender.name}}`,

  'linkedin-request':
    'Hi {{contact.firstName}}, I analyzed {{company.name}}\'s website from an AI crawler perspective - found that ~{{analysis.jsScore}}% of your content is invisible to ChatGPT/Perplexity. Building a solution and looking for co-creation partners. Happy to share the analysis!',
};

// Handlebars helper for subtraction
import Handlebars from 'handlebars';
Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);

interface SenderConfig {
  name: string;
  email: string;
  title: string;
  company: string;
}

const DEFAULT_SENDER: SenderConfig = {
  name: 'Your Name',
  email: 'your@email.com',
  title: 'Founder',
  company: 'CrawlReady',
};

/**
 * Generate all outreach emails for a contact
 */
export function generateOutreachEmails(
  contact: Contact,
  analysis: CompanyAnalysis,
  sender: SenderConfig = DEFAULT_SENDER
): PersonalizedOutreach {
  const log = logger.child('email-generator');
  const context = buildTemplateContext(contact, analysis, sender);

  // Try to load templates from files, fall back to inline
  let initialSubject: string;
  let initialBody: string;
  let followup1Subject: string;
  let followup1Body: string;
  let followup2Subject: string;
  let followup2Body: string;
  let linkedinRequest: string;

  try {
    initialSubject = renderTemplate('email-initial-subject', context);
    initialBody = renderTemplate('email-initial-body', context);
  } catch {
    log.debug('Using inline template for initial email');
    initialSubject = renderInlineTemplate(INLINE_TEMPLATES['email-initial-subject'], context);
    initialBody = renderInlineTemplate(INLINE_TEMPLATES['email-initial-body'], context);
  }

  try {
    followup1Subject = renderTemplate('email-followup-1-subject', context);
    followup1Body = renderTemplate('email-followup-1-body', context);
  } catch {
    log.debug('Using inline template for followup 1');
    followup1Subject = renderInlineTemplate(INLINE_TEMPLATES['email-followup-1-subject'], context);
    followup1Body = renderInlineTemplate(INLINE_TEMPLATES['email-followup-1-body'], context);
  }

  try {
    followup2Subject = renderTemplate('email-followup-2-subject', context);
    followup2Body = renderTemplate('email-followup-2-body', context);
  } catch {
    log.debug('Using inline template for followup 2');
    followup2Subject = renderInlineTemplate(INLINE_TEMPLATES['email-followup-2-subject'], context);
    followup2Body = renderInlineTemplate(INLINE_TEMPLATES['email-followup-2-body'], context);
  }

  try {
    linkedinRequest = renderTemplate('linkedin-request', context);
  } catch {
    log.debug('Using inline template for linkedin');
    linkedinRequest = renderInlineTemplate(INLINE_TEMPLATES['linkedin-request'], context);
  }

  // Truncate LinkedIn request to 300 chars
  if (linkedinRequest.length > 300) {
    linkedinRequest = linkedinRequest.substring(0, 297) + '...';
  }

  return {
    contact,
    analysis,
    emails: {
      initial: { subject: initialSubject.trim(), body: initialBody.trim() },
      followup1: { subject: followup1Subject.trim(), body: followup1Body.trim() },
      followup2: { subject: followup2Subject.trim(), body: followup2Body.trim() },
    },
    linkedinRequest: linkedinRequest.trim(),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Create outreach queue item
 */
export function createOutreachQueueItem(
  contact: Contact,
  analysis: CompanyAnalysis,
  sender?: SenderConfig
): OutreachQueueItem {
  const outreach = generateOutreachEmails(contact, analysis, sender);

  return {
    id: randomUUID(),
    contact,
    analysis,
    outreach,
    status: 'pending',
    emailsSent: {
      initial: null,
      followup1: null,
      followup2: null,
    },
    linkedinSent: null,
    notes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate outreach for multiple contacts
 */
export function generateBatchOutreach(
  contacts: Array<{ contact: Contact; analysis: CompanyAnalysis }>,
  sender?: SenderConfig
): OutreachQueueItem[] {
  const log = logger.child('email-generator');
  const items: OutreachQueueItem[] = [];

  for (const { contact, analysis } of contacts) {
    try {
      const item = createOutreachQueueItem(contact, analysis, sender);
      items.push(item);
    } catch (error) {
      log.error(`Failed to generate outreach for ${contact.name}`, { error: String(error) });
    }
  }

  log.info(`Generated ${items.length} outreach items`);
  return items;
}

/**
 * Format email for display/copy
 */
export function formatEmailForDisplay(
  email: { subject: string; body: string },
  to?: string
): string {
  const parts = [];

  if (to) {
    parts.push(`To: ${to}`);
  }
  parts.push(`Subject: ${email.subject}`);
  parts.push('---');
  parts.push(email.body);

  return parts.join('\n');
}

/**
 * Export outreach queue to CSV format
 */
export function exportOutreachToCSV(items: OutreachQueueItem[]): string {
  const headers = [
    'Company',
    'Contact Name',
    'Contact Role',
    'Email',
    'LinkedIn',
    'JS Score',
    'Priority',
    'Initial Subject',
    'Status',
  ];

  const rows = items.map((item) => [
    item.contact.company,
    item.contact.name,
    item.contact.role,
    item.contact.email || '',
    item.contact.linkedinUrl || '',
    item.analysis.jsAnalysis?.jsScore?.toString() || '',
    item.analysis.priority,
    item.outreach.emails.initial.subject,
    item.status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}
