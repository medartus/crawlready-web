/**
 * CrawlReady Crawler Checker - Main Entry Point
 * Enhanced with 25+ checks based on AI Crawler Research
 */

import type { CompatibilityReport } from '@/types/crawler-checker';

import { CanonicalChecker } from './checkers/canonical.checker';
import { ContentQualityChecker } from './checkers/content-quality.checker';
import { EEATChecker } from './checkers/eeat.checker';
import { FreshnessChecker } from './checkers/freshness.checker';
import { JavaScriptChecker } from './checkers/javascript.checker';
import { MediaChecker } from './checkers/media.checker';
import { MetaRobotsChecker } from './checkers/meta-robots.checker';
import { MetaTagsChecker } from './checkers/meta-tags.checker';
import { NavigationChecker } from './checkers/navigation.checker';
import { PerformanceChecker } from './checkers/performance.checker';
import { RobotsTxtChecker } from './checkers/robots-txt.checker';
import { SchemaChecker } from './checkers/schema.checker';
import { SecurityChecker } from './checkers/security.checker';
import { SemanticHTMLChecker } from './checkers/semantic-html.checker';
import { type AllChecks, ScoreCalculator } from './scoring/score-calculator';
import { CrawlerVisualizer } from './utils/crawler-visualizer';
import { HTMLParser } from './utils/html-parser';
import { analyzeSchema } from './utils/schema-analyzer';
import { URLFetcher } from './utils/url-fetcher';

export class CrawlerCheckerService {
  async checkUrl(url: string): Promise<CompatibilityReport> {
    URLFetcher.validateUrl(url);
    const { html, ok, headers, responseTime } = await URLFetcher.fetch(url);
    if (!ok) {
      throw new Error('Failed to fetch URL');
    }

    const textContent = HTMLParser.extractTextContent(html);
    const baseUrl = URLFetcher.getBaseUrl(url);

    // Run all checkers in parallel for performance
    const [robotsTxt, schema, metaTags, semanticHTML, contentQuality, javascript, navigation, freshness, media, eeat] = await Promise.all([
      RobotsTxtChecker.check(baseUrl),
      Promise.resolve(SchemaChecker.check(html)),
      Promise.resolve(MetaTagsChecker.check(html)),
      Promise.resolve(SemanticHTMLChecker.check(html)),
      Promise.resolve(ContentQualityChecker.check(html, textContent)),
      Promise.resolve(JavaScriptChecker.check(html, textContent)),
      Promise.resolve(NavigationChecker.check(html)),
      Promise.resolve(FreshnessChecker.check(html, headers)),
      Promise.resolve(MediaChecker.check(html)),
      Promise.resolve(EEATChecker.check(html)),
    ]);

    // Synchronous checkers
    const metaRobots = MetaRobotsChecker.check(html, headers);
    const canonical = CanonicalChecker.check(html, url);
    const performance = PerformanceChecker.check(html, headers, responseTime);
    const security = SecurityChecker.check(url, html, headers);

    const checks: AllChecks = {
      robotsTxt,
      metaRobots,
      canonical,
      schema,
      metaTags,
      semanticHTML,
      contentQuality,
      navigation,
      javascript,
      performance,
      freshness,
      media,
      security,
      eeat,
    };

    const { score, issues, categoryScores } = ScoreCalculator.calculate(checks);

    // Analyze schema markup in detail
    const schemaAnalysis = analyzeSchema(html, url);

    // Update category scores with detailed schema score
    const updatedCategoryScores = {
      ...categoryScores,
      schemaMarkup: schemaAnalysis.overallScore,
    };

    // Generate visual comparison between user and crawler view
    const visualComparison = CrawlerVisualizer.generateComparison(html, url);

    return {
      score,
      issues,
      recommendations: [],
      crawlerCompatibility: {
        GPTBot: score >= 80 ? 'full' : score >= 50 ? 'partial' : 'poor',
        ClaudeBot: score >= 80 ? 'full' : score >= 50 ? 'partial' : 'poor',
        PerplexityBot: score >= 90 ? 'full' : score >= 70 ? 'partial' : 'poor',
        GoogleBot: score >= 70 ? 'full' : score >= 40 ? 'partial' : 'poor',
      },
      categoryScores: updatedCategoryScores,
      visualComparison,
      schemaAnalysis,
      userView: { html, textContent, contentLength: textContent.length, hasSchema: schema.hasSchema, renderTime: responseTime },
      crawlerView: { html, textContent, contentLength: textContent.length, hasSchema: schema.hasSchema, renderTime: responseTime },
      limitedJSView: { html, textContent, contentLength: textContent.length, hasSchema: schema.hasSchema, renderTime: responseTime },
      checkedAt: new Date().toISOString(),
      url,
    };
  }
}

export const crawlerCheckerService = new CrawlerCheckerService();
