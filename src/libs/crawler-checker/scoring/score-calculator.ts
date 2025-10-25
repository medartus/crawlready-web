/**
 * Enhanced Score Calculator
 * Implements weighted scoring based on AI Crawler Research
 */

import type { Issue } from '@/types/crawler-checker';

import { CATEGORY_WEIGHTS } from '../config/weights';
import type {
  CanonicalCheck,
  CategoryScores,
  ContentQualityCheck,
  EEATCheck,
  EnhancedSchemaCheck,
  FreshnessCheck,
  JavaScriptCheck,
  MediaCheck,
  MetaRobotsCheck,
  MetaTagsCheck,
  NavigationCheck,
  PerformanceCheck,
  RobotsTxtCheck,
  SecurityCheck,
  SemanticHTMLCheck,
} from '../types';

export type AllChecks = {
  robotsTxt: RobotsTxtCheck;
  metaRobots: MetaRobotsCheck;
  canonical: CanonicalCheck;
  schema: EnhancedSchemaCheck;
  metaTags: MetaTagsCheck;
  semanticHTML: SemanticHTMLCheck;
  contentQuality: ContentQualityCheck;
  navigation: NavigationCheck;
  javascript: JavaScriptCheck;
  performance: PerformanceCheck;
  freshness: FreshnessCheck;
  media: MediaCheck;
  security: SecurityCheck;
  eeat: EEATCheck;
};

export class ScoreCalculator {
  static calculate(checks: AllChecks): { score: number; issues: Issue[]; categoryScores: CategoryScores } {
    const issues: Issue[] = [];

    // Category 1: JavaScript Accessibility (25% weight)
    let jsScore = 100;
    if (checks.javascript.requiresJS) {
      jsScore -= 50;
      issues.push({
        severity: 'critical',
        crawler: 'GPTBot, ClaudeBot, PerplexityBot',
        description: 'Page requires JavaScript - invisible to 69% of AI crawlers',
        fix: 'Implement SSR with Next.js/Nuxt.js or use CrawlReady rendering service',
      });
    }
    if (checks.contentQuality.wordCount < 300) {
      jsScore -= 30;
      issues.push({
        severity: 'critical',
        crawler: 'All AI crawlers',
        description: `Thin content (${checks.contentQuality.wordCount} words)`,
        fix: 'Add more valuable content (aim for 500+ words)',
      });
    } else if (checks.contentQuality.wordCount < 500) {
      jsScore -= 15;
    }

    // Category 2: Technical SEO (20% weight)
    let techSeoScore = 100;
    if (checks.robotsTxt.blocksAllBots) {
      techSeoScore -= 50;
      issues.push({
        severity: 'critical',
        crawler: 'All crawlers',
        description: 'robots.txt blocks ALL bots',
        fix: 'Remove or modify robots.txt Disallow: /',
      });
    }
    if (!checks.robotsTxt.allowsGPTBot || !checks.robotsTxt.allowsClaudeBot || !checks.robotsTxt.allowsPerplexityBot) {
      techSeoScore -= 40;
      issues.push({
        severity: 'critical',
        crawler: checks.robotsTxt.issues.join(', '),
        description: 'AI crawlers blocked in robots.txt',
        fix: 'Allow GPTBot, ClaudeBot, PerplexityBot in robots.txt',
      });
    }
    if (checks.metaRobots.hasNoIndex) {
      techSeoScore -= 50;
      issues.push({
        severity: 'critical',
        crawler: 'All crawlers',
        description: `Page has noindex (${checks.metaRobots.blockedBy.join(', ')})`,
        fix: 'Remove noindex directive',
      });
    }
    if (!checks.canonical.hasCanonical) {
      techSeoScore -= 10;
      issues.push({
        severity: 'medium',
        crawler: 'All crawlers',
        description: 'Missing canonical URL',
        fix: 'Add canonical link tag',
      });
    }

    // Category 3: Schema & Metadata (20% weight)
    let schemaScore = 100;
    if (!checks.schema.hasSchema) {
      schemaScore -= 30;
      issues.push({
        severity: 'high',
        crawler: 'All AI crawlers',
        description: 'Missing Schema.org structured data',
        fix: 'Add JSON-LD schema (Article, Organization, etc.)',
      });
    } else if (!checks.schema.aiOptimized) {
      schemaScore -= 15;
      issues.push({
        severity: 'high',
        crawler: 'All AI crawlers',
        description: 'Schema missing author/datePublished/publisher',
        fix: 'Add AI-critical fields to schema',
      });
    }
    if (!checks.metaTags.title) {
      schemaScore -= 30;
      issues.push({
        severity: 'critical',
        crawler: 'All crawlers',
        description: 'Missing title tag',
        fix: 'Add unique title (50-60 chars)',
      });
    }
    if (!checks.metaTags.description) {
      schemaScore -= 20;
      issues.push({
        severity: 'high',
        crawler: 'All crawlers',
        description: 'Missing meta description',
        fix: 'Add description (155-160 chars)',
      });
    }
    if (!checks.metaTags.hasLangAttribute) {
      schemaScore -= 10;
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: 'Missing lang attribute',
        fix: 'Add lang="en" to <html> tag',
      });
    }

    // Category 4: Content Quality (15% weight) - Enhanced with E-E-A-T
    let contentScore = 100;
    if (checks.semanticHTML.h1Count === 0) {
      contentScore -= 15;
      issues.push({
        severity: 'high',
        crawler: 'All AI crawlers',
        description: 'Missing H1 heading',
        fix: 'Add H1 tag with page topic',
      });
    } else if (checks.semanticHTML.h1Count > 1) {
      contentScore -= 10;
    }
    if (!checks.semanticHTML.hasMain) {
      contentScore -= 15;
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: 'Missing <main> tag',
        fix: 'Wrap main content in <main> tag',
      });
    }
    // E-E-A-T signals (critical for AI citations)
    if (!checks.eeat.hasAuthorBio) {
      contentScore -= 20;
      issues.push({
        severity: 'high',
        crawler: 'All AI crawlers',
        description: 'No author bio - critical for E-E-A-T',
        fix: 'Add author bio with credentials',
      });
    }
    if (!checks.eeat.hasSourceCitations) {
      contentScore -= 15;
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: 'No source citations detected',
        fix: 'Add references for factual claims',
      });
    }
    // Freshness signals
    if (checks.freshness.isStale) {
      contentScore -= 10;
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: `Content is stale (${checks.freshness.ageInDays} days old)`,
        fix: 'Update content with recent information',
      });
    }

    // Category 5: Performance (10% weight) - Enhanced
    let performanceScore = 100;
    if (!checks.performance.isHTML) {
      performanceScore -= 40;
      issues.push({
        severity: 'critical',
        crawler: 'All crawlers',
        description: `Wrong Content-Type: ${checks.performance.contentType}`,
        fix: 'Set Content-Type to text/html',
      });
    }
    if (checks.performance.responseTime > 5000) {
      performanceScore -= 20;
      issues.push({
        severity: 'high',
        crawler: 'All crawlers',
        description: `Slow response (${checks.performance.responseTime}ms)`,
        fix: 'Optimize server response to < 3s',
      });
    }
    if (checks.performance.htmlSize > 500) {
      performanceScore -= 15;
      issues.push({
        severity: 'medium',
        crawler: 'All crawlers',
        description: `Large HTML size (${checks.performance.htmlSize}KB)`,
        fix: 'Reduce HTML size to < 500KB',
      });
    }
    if (!checks.performance.hasCompression) {
      performanceScore -= 10;
      issues.push({
        severity: 'medium',
        crawler: 'All crawlers',
        description: 'No compression detected',
        fix: 'Enable Gzip or Brotli compression',
      });
    }
    if (checks.performance.scriptCount > 20) {
      performanceScore -= 10;
      issues.push({
        severity: 'medium',
        crawler: 'All crawlers',
        description: `Too many scripts (${checks.performance.scriptCount})`,
        fix: 'Reduce scripts to < 20',
      });
    }

    // Category 6: Navigation (5% weight)
    let navScore = 100;
    if (!checks.navigation.hasGoodStructure) {
      navScore -= 30;
      issues.push({
        severity: 'medium',
        crawler: 'All crawlers',
        description: 'Weak navigation structure',
        fix: 'Add <nav> with clear site navigation',
      });
    }
    if (checks.navigation.linkCount < 5) {
      navScore -= 20;
    }
    // Media optimization impact on navigation/discoverability
    if (checks.media.imagesWithoutAlt > 0) {
      navScore -= 10;
      issues.push({
        severity: 'medium',
        crawler: 'All AI crawlers',
        description: `${checks.media.imagesWithoutAlt} images missing alt text`,
        fix: 'Add descriptive alt text to all images',
      });
    }

    // Category 7: Security (5% weight) - Enhanced
    const securityScore = checks.security.securityScore;
    if (!checks.security.isHTTPS) {
      issues.push({
        severity: 'critical',
        crawler: 'All crawlers',
        description: 'Site not using HTTPS',
        fix: 'Install SSL certificate',
      });
    }
    if (!checks.security.hasHSTS && checks.security.isHTTPS) {
      issues.push({
        severity: 'high',
        crawler: 'All crawlers',
        description: 'Missing HSTS header',
        fix: 'Add Strict-Transport-Security header',
      });
    }
    if (checks.security.mixedContentDetected) {
      issues.push({
        severity: 'high',
        crawler: 'All crawlers',
        description: 'Mixed content detected',
        fix: 'Use HTTPS for all resources',
      });
    }
    // Trust signals
    if (!checks.security.trustSignals.hasPrivacyPolicy) {
      issues.push({
        severity: 'medium',
        crawler: 'All crawlers',
        description: 'No privacy policy detected',
        fix: 'Add privacy policy page',
      });
    }

    const categoryScores: CategoryScores = {
      javascript: Math.max(0, jsScore),
      technicalSEO: Math.max(0, techSeoScore),
      schemaMetadata: Math.max(0, schemaScore),
      contentQuality: Math.max(0, contentScore),
      performance: Math.max(0, performanceScore),
      navigation: Math.max(0, navScore),
      security: Math.max(0, securityScore),
    };

    const finalScore = Math.round(
      categoryScores.javascript * CATEGORY_WEIGHTS.javascript
      + categoryScores.technicalSEO * CATEGORY_WEIGHTS.technicalSEO
      + categoryScores.schemaMetadata * CATEGORY_WEIGHTS.schemaMetadata
      + categoryScores.contentQuality * CATEGORY_WEIGHTS.contentQuality
      + categoryScores.performance * CATEGORY_WEIGHTS.performance
      + categoryScores.navigation * CATEGORY_WEIGHTS.navigation
      + categoryScores.security * CATEGORY_WEIGHTS.security,
    );

    return {
      score: Math.max(0, Math.min(100, finalScore)),
      issues,
      categoryScores,
    };
  }
}
