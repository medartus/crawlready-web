/**
 * Lead Generation Pipeline Types
 * Types for WTTJ scraping, website analysis, contact discovery, and outreach
 */

// =============================================================================
// WTTJ Company Data
// =============================================================================

export interface WTTJCompany {
  name: string;
  slug: string;
  wttjUrl: string;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  sector: string[];
  employeeCount: string | null;
  location: string | null;
  description: string | null;
  scrapedAt: string;
}

export interface WTTJTeamMember {
  name: string;
  role: string;
  description: string | null;
  videoUrl: string | null;
}

export interface WTTJTeamData {
  companySlug: string;
  teamPageUrl: string;
  members: WTTJTeamMember[];
  scrapedAt: string;
}

// =============================================================================
// Website Analysis
// =============================================================================

export interface JSAnalysisResult {
  url: string;
  rawTextLength: number;
  renderedTextLength: number;
  jsScore: number; // Percentage: (rendered - raw) / rendered * 100
  rawHtml: string;
  renderedHtml: string;
  analyzedAt: string;
  // Pattern-based detection (no specific message matching)
  isBlankWithoutJs?: boolean; // Page is effectively blank/hidden without JS
  blankReason?: string | null; // Why the page was flagged as blank
  hasHiddenContent?: boolean; // Content hidden by CSS (opacity:0, etc.)
  hasEmptySPA?: boolean; // Empty SPA root container detected
  hasWebComponents?: boolean; // Content inside web components that require JS
  webComponentTypes?: string[]; // Types of web components detected (e.g., "Astro Islands")
  pageType?: 'homepage' | 'blog' | 'resources' | 'docs' | 'other';
}

export interface MultiPageAnalysisResult {
  baseUrl: string;
  pages: JSAnalysisResult[];
  worstPage: JSAnalysisResult | null; // Page with highest JS score
  overallJsScore: number; // Highest score across all pages
  hasBlankPages: boolean; // Any page is blank without JS
  hasHiddenContent: boolean; // Any page has CSS-hidden content
  blankReasons: string[]; // Reasons why pages were flagged
  analyzedAt: string;
}

export type FrameworkType =
  | 'react'
  | 'next.js'
  | 'vue'
  | 'nuxt'
  | 'angular'
  | 'svelte'
  | 'gatsby'
  | 'remix'
  | 'unknown';

export interface FrameworkDetectionResult {
  url: string;
  framework: FrameworkType;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

export interface CruxMetrics {
  LCP: number | null; // Largest Contentful Paint (ms)
  FID: number | null; // First Input Delay (ms)
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte (ms)
  INP: number | null; // Interaction to Next Paint (ms)
}

export interface CruxResult {
  url: string;
  hasData: boolean;
  metrics: CruxMetrics;
  overallScore: 'good' | 'needs-improvement' | 'poor' | 'no-data';
  fetchedAt: string;
}

export type AICrawler =
  | 'GPTBot'
  | 'ChatGPT-User'
  | 'OAI-SearchBot'
  | 'ClaudeBot'
  | 'Claude-Web'
  | 'PerplexityBot'
  | 'Google-Extended';

export interface RobotsTxtRule {
  crawler: AICrawler;
  status: 'allowed' | 'disallowed' | 'not-specified';
  directive: string | null;
}

export interface RobotsTxtResult {
  url: string;
  robotsTxtExists: boolean;
  rawContent: string | null;
  rules: RobotsTxtRule[];
  overallStatus: 'allowed' | 'blocked' | 'partial';
  analyzedAt: string;
}

export interface MetaTagsResult {
  url: string;
  raw: {
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    schemaOrg: object[] | null;
  };
  rendered: {
    title: string | null;
    description: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    schemaOrg: object[] | null;
  };
  issues: {
    titleMissing: boolean;
    descriptionMissing: boolean;
    ogTagsMissing: boolean;
    schemaOrgMissing: boolean;
    metaTagsJsInjected: boolean; // True if meta tags only appear in rendered
  };
  analyzedAt: string;
}

export interface ContentDiffResult {
  url: string;
  raw: {
    headings: string[];
    paragraphCount: number;
    linkCount: number;
    imageCount: number;
    textLength: number;
  };
  rendered: {
    headings: string[];
    paragraphCount: number;
    linkCount: number;
    imageCount: number;
    textLength: number;
  };
  diff: {
    headingsMissing: string[];
    paragraphsDiff: number;
    linksDiff: number;
    imagesDiff: number;
    textDiff: number;
    percentageLost: number;
  };
  analyzedAt: string;
}

// =============================================================================
// Combined Analysis Result
// =============================================================================

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';

export interface CompanyAnalysis {
  company: WTTJCompany;
  jsAnalysis: JSAnalysisResult | null;
  frameworkDetection: FrameworkDetectionResult | null;
  cruxResult: CruxResult | null;
  robotsTxt: RobotsTxtResult | null;
  metaTags: MetaTagsResult | null;
  contentDiff: ContentDiffResult | null;
  screenshotRaw: string | null; // Path to screenshot without JS
  screenshotRendered: string | null; // Path to screenshot with JS
  priority: Priority;
  reasons: string[];
  analyzedAt: string;
}

// =============================================================================
// Contact Discovery
// =============================================================================

export type EmailConfidence = 'verified' | 'pattern-based' | 'guessed';

export interface EmailPattern {
  pattern: string; // e.g., "{first}.{last}@{domain}"
  confidence: 'high' | 'medium' | 'low';
  source: string; // How the pattern was detected
}

export interface Contact {
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string;
  domain: string;
  source: 'wttj-team' | 'linkedin' | 'github' | 'manual';
  linkedinUrl: string | null;
  email: string | null;
  emailVerified: boolean;
  emailConfidence: EmailConfidence;
}

export interface CompanyContacts {
  company: WTTJCompany;
  domain: string;
  emailPattern: EmailPattern | null;
  contacts: Contact[];
  teamPageFound: boolean;
  discoveredAt: string;
}

// =============================================================================
// Outreach
// =============================================================================

export interface OutreachTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  channel: 'email' | 'linkedin';
}

export interface PersonalizedOutreach {
  contact: Contact;
  analysis: CompanyAnalysis;
  emails: {
    initial: { subject: string; body: string };
    followup1: { subject: string; body: string };
    followup2: { subject: string; body: string };
  };
  linkedinRequest: string;
  generatedAt: string;
}

export interface OutreachQueueItem {
  id: string;
  contact: Contact;
  analysis: CompanyAnalysis;
  outreach: PersonalizedOutreach;
  status: 'pending' | 'sent' | 'replied' | 'meeting-booked' | 'converted' | 'no-response';
  emailsSent: {
    initial: string | null; // ISO date
    followup1: string | null;
    followup2: string | null;
  };
  linkedinSent: string | null;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// CLI Options
// =============================================================================

export interface ScrapeWTTJOptions {
  sector: string;
  region: string;
  pages: number;
  output: string;
}

export interface AnalyzeOptions {
  input: string;
  output: string;
  concurrent: number;
  screenshots: boolean;
  cruxApiKey?: string;
}

export interface AnalyzeSingleOptions {
  url: string;
  output?: string;
  screenshots: boolean;
  cruxApiKey?: string;
}

export interface ScrapeTeamsOptions {
  input: string;
  output: string;
  concurrent: number;
}

export interface FilterOptions {
  input: string;
  output: string;
  minScore: number;
  maxResults: number;
}

export interface GenerateEmailsOptions {
  input: string;
  output: string;
}
