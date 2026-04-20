#!/usr/bin/env tsx
/**
 * Lead Generation Pipeline CLI
 * Main entry point for all lead-gen commands
 */

import { Command } from 'commander';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: join(dirname(fileURLToPath(import.meta.url)), '..', '.env') });

import type {
  WTTJCompany,
  CompanyAnalysis,
  CompanyContacts,
  OutreachQueueItem,
  Priority,
} from './types.js';

// Scrapers
import { scrapeWTTJCompanies, scrapeCompany } from './scrapers/wttj-companies.js';
import { scrapeTeamsForCompanies, scrapeTeamForCompany } from './scrapers/wttj-team.js';

// Analyzers
import { analyzeWebsite } from './analyzers/js-analyzer.js';
import { detectFramework, getFrameworkFit } from './analyzers/framework-detector.js';
import { fetchCruxData, interpretCruxMetrics } from './analyzers/crux-fetcher.js';
import { checkRobotsTxt, interpretRobotsTxt, crawlReadyRelevant } from './analyzers/robots-checker.js';
import { analyzeMetaTags, interpretMetaTagIssues } from './analyzers/meta-analyzer.js';
import { analyzeContentDiff, interpretContentDiff } from './analyzers/content-differ.js';

// Contacts
import { findContactsForCompany, prioritizeContacts } from './contacts/contact-finder.js';
import { guessPatternForDomain } from './contacts/email-pattern.js';
import {
  findAndVerifyEmail,
  quickSmtpVerify,
  formatVerificationReport,
} from './contacts/email-verifier.js';

// Outreach
import { generateBatchOutreach, exportOutreachToCSV } from './outreach/email-generator.js';

// Utils
import { logger } from './utils/logger.js';
import { closeBrowser } from './utils/puppeteer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const program = new Command();

program
  .name('lead-gen')
  .description('Lead generation pipeline for CrawlReady co-creators')
  .version('0.1.0');

// =============================================================================
// SCRAPE WTTJ COMPANIES
// =============================================================================
program
  .command('scrape-wttj')
  .description('Scrape tech companies from Welcome to the Jungle')
  .option('-s, --sector <sector>', 'Filter by sector', 'tech')
  .option('-r, --region <region>', 'Filter by region (country code)', 'FR')
  .option('-p, --pages <pages>', 'Number of pages to scrape', '10')
  .option('-o, --output <path>', 'Output file path', join(DATA_DIR, 'companies.json'))
  .action(async (options) => {
    const log = logger.child('cli');
    log.info('Starting WTTJ scrape', options);

    try {
      const companies = await scrapeWTTJCompanies({
        region: options.region,
        pages: parseInt(options.pages),
      });

      writeFileSync(options.output, JSON.stringify(companies, null, 2));
      log.info(`Saved ${companies.length} companies to ${options.output}`);
    } catch (error) {
      log.error('Scrape failed', { error: String(error) });
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

// =============================================================================
// ANALYZE WEBSITES
// =============================================================================
program
  .command('analyze')
  .description('Run full website analysis on scraped companies')
  .option('-i, --input <path>', 'Input companies JSON file', join(DATA_DIR, 'companies.json'))
  .option('-o, --output <path>', 'Output analysis JSON file', join(DATA_DIR, 'analysis-results.json'))
  .option('-c, --concurrent <n>', 'Concurrent analyses', '1')
  .option('--crux-key <key>', 'CrUX API key (optional)')
  .option('--limit <n>', 'Limit number of companies to analyze')
  .action(async (options) => {
    const log = logger.child('cli');
    log.info('Starting website analysis', options);

    try {
      // Load companies
      if (!existsSync(options.input)) {
        log.error(`Input file not found: ${options.input}`);
        process.exit(1);
      }

      const companies: WTTJCompany[] = JSON.parse(readFileSync(options.input, 'utf-8'));
      const limit = options.limit ? parseInt(options.limit) : companies.length;
      const toAnalyze = companies.slice(0, limit).filter((c) => c.websiteUrl);

      log.info(`Analyzing ${toAnalyze.length} companies`);

      const results: CompanyAnalysis[] = [];

      for (let i = 0; i < toAnalyze.length; i++) {
        const company = toAnalyze[i];
        logger.progress(i + 1, toAnalyze.length, `Analyzing ${company.name}`);

        try {
          const analysis = await analyzeCompany(company, options.cruxKey);
          results.push(analysis);

          // Save incrementally
          writeFileSync(options.output, JSON.stringify(results, null, 2));
        } catch (error) {
          log.error(`Failed to analyze ${company.name}`, { error: String(error) });
        }
      }

      log.info(`Analysis complete. Saved ${results.length} results to ${options.output}`);
    } catch (error) {
      log.error('Analysis failed', { error: String(error) });
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

// =============================================================================
// ANALYZE SINGLE URL
// =============================================================================
program
  .command('analyze-single')
  .description('Analyze a single website URL')
  .argument('<url>', 'URL to analyze')
  .option('-o, --output <path>', 'Output JSON file (optional)')
  .option('--crux-key <key>', 'CrUX API key (optional)')
  .action(async (url, options) => {
    const log = logger.child('cli');
    log.info(`Analyzing ${url}`);

    try {
      // Create a minimal company object
      const company: WTTJCompany = {
        name: new URL(url).hostname,
        slug: new URL(url).hostname.replace(/\./g, '-'),
        wttjUrl: '',
        websiteUrl: url,
        linkedinUrl: null,
        twitterUrl: null,
        sector: [],
        employeeCount: null,
        location: null,
        description: null,
        scrapedAt: new Date().toISOString(),
      };

      const analysis = await analyzeCompany(company, options.cruxKey);

      // Print results to console
      console.log('\n=== Analysis Results ===\n');
      console.log(`URL: ${url}`);
      console.log(`JS Score: ${analysis.jsAnalysis?.jsScore ?? 'N/A'}%`);
      console.log(`Framework: ${analysis.frameworkDetection?.framework ?? 'unknown'}`);
      console.log(`Priority: ${analysis.priority}`);
      console.log('\nReasons:');
      analysis.reasons.forEach((r) => console.log(`  - ${r}`));

      if (analysis.robotsTxt) {
        console.log('\nrobots.txt:');
        interpretRobotsTxt(analysis.robotsTxt).forEach((r) => console.log(`  - ${r}`));
      }

      if (analysis.metaTags) {
        console.log('\nMeta Tags:');
        interpretMetaTagIssues(analysis.metaTags).forEach((r) => console.log(`  - ${r}`));
      }

      if (analysis.contentDiff) {
        console.log('\nContent Diff:');
        interpretContentDiff(analysis.contentDiff).forEach((r) => console.log(`  - ${r}`));
      }

      if (analysis.cruxResult?.hasData) {
        console.log('\nCrUX Metrics:');
        interpretCruxMetrics(analysis.cruxResult).forEach((r) => console.log(`  - ${r}`));
      }

      // Save if output specified
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(analysis, null, 2));
        log.info(`Saved analysis to ${options.output}`);
      }
    } catch (error) {
      log.error('Analysis failed', { error: String(error) });
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

// =============================================================================
// SCRAPE TEAM PAGES
// =============================================================================
program
  .command('scrape-teams')
  .description('Scrape WTTJ team pages for contacts')
  .option('-i, --input <path>', 'Input analysis JSON file', join(DATA_DIR, 'analysis-results.json'))
  .option('-o, --output <path>', 'Output contacts JSON file', join(DATA_DIR, 'contacts.json'))
  .action(async (options) => {
    const log = logger.child('cli');
    log.info('Starting team page scrape', options);

    try {
      if (!existsSync(options.input)) {
        log.error(`Input file not found: ${options.input}`);
        process.exit(1);
      }

      const analyses: CompanyAnalysis[] = JSON.parse(readFileSync(options.input, 'utf-8'));
      const companies = analyses.map((a) => a.company);

      log.info(`Scraping team pages for ${companies.length} companies`);

      const teamResults = await scrapeTeamsForCompanies(companies);

      // Find contacts for each company
      const contactResults: CompanyContacts[] = [];

      for (const result of teamResults) {
        const teamData = result.contacts.length > 0
          ? {
              companySlug: result.company.slug,
              teamPageUrl: result.company.wttjUrl + '/team',
              members: result.contacts.map((c) => ({
                name: c.name,
                role: c.role,
                description: null,
                videoUrl: null,
              })),
              scrapedAt: new Date().toISOString(),
            }
          : null;

        const contacts = await findContactsForCompany(result.company, teamData);
        contactResults.push(contacts);
      }

      writeFileSync(options.output, JSON.stringify(contactResults, null, 2));
      log.info(`Saved ${contactResults.length} contact results to ${options.output}`);

      // Summary
      const withContacts = contactResults.filter((c) => c.contacts.length > 0);
      log.info(`Found contacts for ${withContacts.length}/${contactResults.length} companies`);
    } catch (error) {
      log.error('Team scrape failed', { error: String(error) });
      process.exit(1);
    } finally {
      await closeBrowser();
    }
  });

// =============================================================================
// FILTER LEADS
// =============================================================================
program
  .command('filter')
  .description('Filter high-priority leads')
  .option('-i, --input <path>', 'Input analysis JSON file', join(DATA_DIR, 'analysis-results.json'))
  .option('-o, --output <path>', 'Output filtered JSON file', join(DATA_DIR, 'filtered-leads.json'))
  .option('--min-score <n>', 'Minimum JS score', '50')
  .option('--max-results <n>', 'Maximum results', '50')
  .action(async (options) => {
    const log = logger.child('cli');
    log.info('Filtering leads', options);

    try {
      if (!existsSync(options.input)) {
        log.error(`Input file not found: ${options.input}`);
        process.exit(1);
      }

      const analyses: CompanyAnalysis[] = JSON.parse(readFileSync(options.input, 'utf-8'));
      const minScore = parseInt(options.minScore);
      const maxResults = parseInt(options.maxResults);

      // Filter by JS score and priority
      const filtered = analyses
        .filter((a) => {
          const jsScore = a.jsAnalysis?.jsScore ?? 0;
          return jsScore >= minScore || a.priority === 'HIGH';
        })
        .sort((a, b) => {
          // Sort by priority then JS score
          const priorityOrder: Record<Priority, number> = {
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
            NOT_APPLICABLE: 0,
          };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;

          const scoreA = a.jsAnalysis?.jsScore ?? 0;
          const scoreB = b.jsAnalysis?.jsScore ?? 0;
          return scoreB - scoreA;
        })
        .slice(0, maxResults);

      writeFileSync(options.output, JSON.stringify(filtered, null, 2));
      log.info(`Filtered to ${filtered.length} leads, saved to ${options.output}`);

      // Print summary
      console.log('\n=== Filtered Leads Summary ===\n');
      filtered.forEach((a, i) => {
        console.log(
          `${i + 1}. ${a.company.name} | JS: ${a.jsAnalysis?.jsScore ?? 'N/A'}% | Priority: ${a.priority}`
        );
      });
    } catch (error) {
      log.error('Filter failed', { error: String(error) });
      process.exit(1);
    }
  });

// =============================================================================
// GENERATE EMAILS
// =============================================================================
program
  .command('generate-emails')
  .description('Generate personalized outreach emails')
  .option('-a, --analysis <path>', 'Analysis JSON file', join(DATA_DIR, 'filtered-leads.json'))
  .option('-c, --contacts <path>', 'Contacts JSON file', join(DATA_DIR, 'contacts.json'))
  .option('-o, --output <path>', 'Output outreach queue JSON', join(DATA_DIR, 'outreach-queue.json'))
  .option('--csv <path>', 'Also export as CSV')
  .action(async (options) => {
    const log = logger.child('cli');
    log.info('Generating outreach emails', options);

    try {
      if (!existsSync(options.analysis)) {
        log.error(`Analysis file not found: ${options.analysis}`);
        process.exit(1);
      }

      const analyses: CompanyAnalysis[] = JSON.parse(readFileSync(options.analysis, 'utf-8'));

      let contactsMap = new Map<string, CompanyContacts>();
      if (existsSync(options.contacts)) {
        const contacts: CompanyContacts[] = JSON.parse(readFileSync(options.contacts, 'utf-8'));
        contacts.forEach((c) => contactsMap.set(c.company.slug, c));
      }

      // Build contact-analysis pairs
      const pairs: Array<{ contact: import('./types.js').Contact; analysis: CompanyAnalysis }> = [];

      for (const analysis of analyses) {
        const companyContacts = contactsMap.get(analysis.company.slug);

        if (companyContacts && companyContacts.contacts.length > 0) {
          // Use top contact
          const topContact = prioritizeContacts(companyContacts.contacts, 1)[0];
          if (topContact) {
            pairs.push({ contact: topContact, analysis });
          }
        } else if (analysis.company.websiteUrl) {
          // Create a placeholder contact (for manual enrichment)
          const domain = new URL(analysis.company.websiteUrl).hostname.replace(/^www\./, '');
          pairs.push({
            contact: {
              name: 'TBD',
              firstName: 'TBD',
              lastName: '',
              role: 'Decision Maker',
              company: analysis.company.name,
              domain,
              source: 'manual',
              linkedinUrl: analysis.company.linkedinUrl,
              email: null,
              emailVerified: false,
              emailConfidence: 'guessed',
            },
            analysis,
          });
        }
      }

      log.info(`Generating emails for ${pairs.length} leads`);

      const outreachQueue = generateBatchOutreach(pairs);

      writeFileSync(options.output, JSON.stringify(outreachQueue, null, 2));
      log.info(`Saved ${outreachQueue.length} outreach items to ${options.output}`);

      // Export CSV if requested
      if (options.csv) {
        const csv = exportOutreachToCSV(outreachQueue);
        writeFileSync(options.csv, csv);
        log.info(`Exported CSV to ${options.csv}`);
      }

      // Print summary
      console.log('\n=== Outreach Queue Summary ===\n');
      outreachQueue.slice(0, 10).forEach((item, i) => {
        console.log(
          `${i + 1}. ${item.contact.company} | ${item.contact.name} (${item.contact.role}) | ${item.contact.email || 'No email'}`
        );
      });
      if (outreachQueue.length > 10) {
        console.log(`... and ${outreachQueue.length - 10} more`);
      }
    } catch (error) {
      log.error('Email generation failed', { error: String(error) });
      process.exit(1);
    }
  });

// =============================================================================
// VERIFY EMAIL
// =============================================================================
program
  .command('verify-email')
  .description('Find and verify email for a contact via SMTP')
  .argument('<first-name>', 'First name of the contact')
  .argument('<last-name>', 'Last name of the contact')
  .argument('<domain>', 'Company domain (e.g., fleetiz.com)')
  .option('-o, --output <path>', 'Save results to JSON file')
  .action(async (firstName, lastName, domain, options) => {
    const log = logger.child('cli');
    log.info(`Verifying email for ${firstName} ${lastName} @ ${domain}`);

    try {
      const report = await findAndVerifyEmail(firstName, lastName, domain);

      // Print formatted report
      console.log(formatVerificationReport(report));

      // Save to file if requested
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(report, null, 2));
        log.info(`Saved report to ${options.output}`);
      }

      // Exit with appropriate code
      if (report.validEmails.length === 0) {
        process.exit(1);
      }
    } catch (error) {
      log.error('Email verification failed', { error: String(error) });
      process.exit(1);
    }
  });

// =============================================================================
// QUICK VERIFY (single email)
// =============================================================================
program
  .command('quick-verify')
  .description('Quickly verify a single email address via SMTP')
  .argument('<email>', 'Email address to verify')
  .action(async (email) => {
    const log = logger.child('cli');
    log.info(`Quick verifying ${email}`);

    try {
      const result = await quickSmtpVerify(email);

      const icon = result.valid ? '✅' : '❌';
      console.log(`\n${icon} ${result.email}`);
      console.log(`   Response: ${result.response}`);
      console.log(`   Code: ${result.responseCode}\n`);

      if (!result.valid) {
        process.exit(1);
      }
    } catch (error) {
      log.error('Quick verification failed', { error: String(error) });
      process.exit(1);
    }
  });

// =============================================================================
// HELPER: Full company analysis (multi-page)
// =============================================================================
async function analyzeCompany(
  company: WTTJCompany,
  cruxApiKey?: string
): Promise<CompanyAnalysis> {
  const log = logger.child('analyzer');

  if (!company.websiteUrl) {
    return createEmptyAnalysis(company, 'NOT_APPLICABLE', ['No website URL']);
  }

  const url = company.websiteUrl;
  const reasons: string[] = [];

  // Use CrUX API key from env if not provided
  const effectiveCruxKey = cruxApiKey || process.env.CRUX_API_KEY;

  // Run multi-page JS analysis (homepage + blog/resources)
  log.debug(`Running multi-page JS analysis for ${url}`);
  const multiPageResult = await analyzeWebsite(url).catch((e) => {
    log.error(`Multi-page JS analysis failed for ${url}`, { error: String(e) });
    return null;
  });

  // Get the worst page result for backward compatibility
  const jsAnalysis = multiPageResult?.worstPage || null;
  const overallJsScore = multiPageResult?.overallJsScore ?? 0;
  const hasBlankPages = multiPageResult?.hasBlankPages ?? false;
  const hasHiddenContent = multiPageResult?.hasHiddenContent ?? false;
  const blankReasons = multiPageResult?.blankReasons ?? [];

  // Framework detection (from rendered HTML of worst page)
  let frameworkDetection = null;
  if (jsAnalysis?.renderedHtml) {
    frameworkDetection = detectFramework(jsAnalysis.renderedHtml);
    frameworkDetection.url = jsAnalysis.url;
  }

  // CrUX data
  log.debug(`Fetching CrUX data for ${url}`);
  const cruxResult = await fetchCruxData(url, effectiveCruxKey);

  // robots.txt
  log.debug(`Checking robots.txt for ${url}`);
  const robotsTxt = await checkRobotsTxt(url);

  // Meta tags and content diff (requires both raw and rendered HTML)
  let metaTags = null;
  let contentDiff = null;
  if (jsAnalysis?.rawHtml && jsAnalysis?.renderedHtml) {
    metaTags = analyzeMetaTags(jsAnalysis.rawHtml, jsAnalysis.renderedHtml);
    metaTags.url = jsAnalysis.url;

    contentDiff = analyzeContentDiff(jsAnalysis.rawHtml, jsAnalysis.renderedHtml);
    contentDiff.url = jsAnalysis.url;
  }

  // Determine priority based on multi-page analysis
  let priority: Priority = 'LOW';

  // Check if AI crawlers are blocked
  if (robotsTxt && !crawlReadyRelevant(robotsTxt)) {
    priority = 'NOT_APPLICABLE';
    reasons.push('AI crawlers are blocked by robots.txt');
  } else {
    // Use overall score from multi-page analysis
    if (overallJsScore >= 70) {
      priority = 'HIGH';
      reasons.push(`High JS dependency (${overallJsScore}%) - SPA detected`);
    } else if (overallJsScore >= 40) {
      priority = 'MEDIUM';
      reasons.push(`Moderate JS dependency (${overallJsScore}%)`);
    } else {
      reasons.push(`Low JS dependency (${overallJsScore}%)`);
    }

    // Boost priority if content is hidden by CSS until JS runs
    if (hasHiddenContent) {
      if (priority === 'LOW') {
        priority = 'HIGH';
      }
      if (priority === 'MEDIUM') {
        priority = 'HIGH';
      }
      reasons.push('Content is hidden by CSS until JavaScript runs');
    }

    // Boost priority if blank pages detected
    if (hasBlankPages) {
      if (priority === 'LOW') {
        priority = 'HIGH';
      }
      if (priority === 'MEDIUM') {
        priority = 'HIGH';
      }
      // Add specific reasons for blank pages
      if (blankReasons.length > 0) {
        reasons.push(...blankReasons.slice(0, 2)); // Limit to first 2 reasons
      } else {
        reasons.push('Content pages are blank or hidden without JavaScript');
      }
    }

    // Add info about which page was worst
    if (multiPageResult?.worstPage && multiPageResult.worstPage.url !== url) {
      reasons.push(`Worst page: ${multiPageResult.worstPage.url} (${multiPageResult.worstPage.jsScore}% JS)`);
    }

    // Framework bonus
    if (frameworkDetection) {
      const fit = getFrameworkFit(frameworkDetection.framework);
      if (fit.fit === 'excellent') {
        if (priority === 'MEDIUM') priority = 'HIGH';
        reasons.push(`${frameworkDetection.framework} detected - ${fit.reason}`);
      } else if (fit.fit === 'good') {
        reasons.push(`${frameworkDetection.framework} detected - ${fit.reason}`);
      }
    }

    // Meta tags issue
    if (metaTags?.issues.metaTagsJsInjected) {
      if (priority === 'LOW') priority = 'MEDIUM';
      if (priority === 'MEDIUM') priority = 'HIGH';
      reasons.push('Meta tags are JS-injected - invisible to AI bots');
    }
  }

  return {
    company,
    jsAnalysis,
    frameworkDetection,
    cruxResult,
    robotsTxt,
    metaTags,
    contentDiff,
    screenshotRaw: null,
    screenshotRendered: null,
    priority,
    reasons,
    analyzedAt: new Date().toISOString(),
  };
}

function createEmptyAnalysis(
  company: WTTJCompany,
  priority: Priority,
  reasons: string[]
): CompanyAnalysis {
  return {
    company,
    jsAnalysis: null,
    frameworkDetection: null,
    cruxResult: null,
    robotsTxt: null,
    metaTags: null,
    contentDiff: null,
    screenshotRaw: null,
    screenshotRendered: null,
    priority,
    reasons,
    analyzedAt: new Date().toISOString(),
  };
}

// Parse and execute
program.parse();
