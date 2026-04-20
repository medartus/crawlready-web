/**
 * Template Renderer
 * Renders Handlebars templates with company and contact data
 */

import Handlebars from 'handlebars';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { CompanyAnalysis, Contact } from '../types.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '../../templates');

// Register Handlebars helpers
Handlebars.registerHelper('round', (value: number) => Math.round(value));
Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
Handlebars.registerHelper('capitalize', (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''
);
Handlebars.registerHelper('truncate', (str: string, len: number) =>
  str && str.length > len ? str.substring(0, len) + '...' : str
);
Handlebars.registerHelper('ifEquals', function(this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);

interface TemplateContext {
  contact: {
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    email: string | null;
  };
  company: {
    name: string;
    website: string | null;
    domain: string;
  };
  analysis: {
    jsScore: number;
    jsScoreCategory: 'high' | 'medium' | 'low';
    framework: string;
    priority: string;
    reasons: string[];
    metaTagsJsInjected: boolean;
    contentLost: number;
  };
  sender: {
    name: string;
    email: string;
    title: string;
    company: string;
  };
}

// Default sender info (should be configured per user)
const DEFAULT_SENDER = {
  name: 'Your Name',
  email: 'your@email.com',
  title: 'Founder',
  company: 'CrawlReady',
};

/**
 * Build template context from analysis and contact data
 */
export function buildTemplateContext(
  contact: Contact,
  analysis: CompanyAnalysis,
  sender: typeof DEFAULT_SENDER = DEFAULT_SENDER
): TemplateContext {
  const jsScore = analysis.jsAnalysis?.jsScore ?? 0;
  let jsScoreCategory: 'high' | 'medium' | 'low' = 'low';
  if (jsScore >= 70) jsScoreCategory = 'high';
  else if (jsScore >= 40) jsScoreCategory = 'medium';

  return {
    contact: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.name,
      role: contact.role,
      email: contact.email,
    },
    company: {
      name: analysis.company.name,
      website: analysis.company.websiteUrl,
      domain: contact.domain,
    },
    analysis: {
      jsScore,
      jsScoreCategory,
      framework: analysis.frameworkDetection?.framework ?? 'unknown',
      priority: analysis.priority,
      reasons: analysis.reasons,
      metaTagsJsInjected: analysis.metaTags?.issues.metaTagsJsInjected ?? false,
      contentLost: analysis.contentDiff?.diff.percentageLost ?? 0,
    },
    sender,
  };
}

/**
 * Load and compile a template from file
 */
export function loadTemplate(templateName: string): Handlebars.TemplateDelegate {
  const templatePath = join(TEMPLATES_DIR, `${templateName}.hbs`);

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const templateSource = readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateSource);
}

/**
 * Render a template with context
 */
export function renderTemplate(
  templateName: string,
  context: TemplateContext
): string {
  const log = logger.child('template-renderer');

  try {
    const template = loadTemplate(templateName);
    return template(context);
  } catch (error) {
    log.error(`Failed to render template ${templateName}`, { error: String(error) });
    throw error;
  }
}

/**
 * Render inline template string
 */
export function renderInlineTemplate(
  templateSource: string,
  context: TemplateContext
): string {
  const template = Handlebars.compile(templateSource);
  return template(context);
}

/**
 * Get all available templates
 */
export function getAvailableTemplates(): string[] {
  return ['email-initial', 'email-followup-1', 'email-followup-2', 'linkedin-request'];
}

/**
 * Validate template syntax
 */
export function validateTemplate(templateSource: string): { valid: boolean; error?: string } {
  try {
    Handlebars.compile(templateSource);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}
