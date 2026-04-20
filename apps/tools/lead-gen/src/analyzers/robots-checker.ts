/**
 * robots.txt Analyzer
 * Checks if AI crawlers are allowed to crawl the site
 */

import type { RobotsTxtResult, RobotsTxtRule, AICrawler } from '../types.js';
import { logger } from '../utils/logger.js';

// AI crawlers to check
const AI_CRAWLERS: AICrawler[] = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
];

// Additional crawlers that might be relevant
const ADDITIONAL_CRAWLERS = [
  'Anthropic-AI',
  'anthropic-ai',
  'CCBot', // Common Crawl (used for AI training)
  'Bytespider', // ByteDance
];

interface RobotRule {
  userAgent: string;
  rules: { type: 'allow' | 'disallow'; path: string }[];
}

/**
 * Parse robots.txt content into rules
 */
function parseRobotsTxt(content: string): RobotRule[] {
  const rules: RobotRule[] = [];
  let currentUserAgent: string | null = null;
  let currentRules: { type: 'allow' | 'disallow'; path: string }[] = [];

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // Parse directive
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const directive = trimmed.substring(0, colonIndex).toLowerCase().trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (directive === 'user-agent') {
      // Save previous user-agent block
      if (currentUserAgent !== null) {
        rules.push({ userAgent: currentUserAgent, rules: currentRules });
      }
      currentUserAgent = value;
      currentRules = [];
    } else if (directive === 'disallow' && currentUserAgent !== null) {
      currentRules.push({ type: 'disallow', path: value || '/' });
    } else if (directive === 'allow' && currentUserAgent !== null) {
      currentRules.push({ type: 'allow', path: value });
    }
  }

  // Save last user-agent block
  if (currentUserAgent !== null) {
    rules.push({ userAgent: currentUserAgent, rules: currentRules });
  }

  return rules;
}

/**
 * Check if a crawler is blocked
 */
function checkCrawlerStatus(
  crawler: AICrawler,
  robotRules: RobotRule[]
): { status: 'allowed' | 'disallowed' | 'not-specified'; directive: string | null } {
  // First, look for specific rules for this crawler
  const specificRule = robotRules.find(
    (r) => r.userAgent.toLowerCase() === crawler.toLowerCase()
  );

  if (specificRule) {
    // Check if there's a disallow for root
    const hasRootDisallow = specificRule.rules.some(
      (r) => r.type === 'disallow' && (r.path === '/' || r.path === '')
    );

    if (hasRootDisallow) {
      const directive = specificRule.rules.find(
        (r) => r.type === 'disallow' && (r.path === '/' || r.path === '')
      );
      return {
        status: 'disallowed',
        directive: `User-agent: ${crawler}\nDisallow: ${directive?.path || '/'}`,
      };
    }

    // Has specific rules but not blocking root
    return { status: 'allowed', directive: `User-agent: ${crawler}` };
  }

  // Check wildcard (*) rules
  const wildcardRule = robotRules.find((r) => r.userAgent === '*');
  if (wildcardRule) {
    const hasRootDisallow = wildcardRule.rules.some(
      (r) => r.type === 'disallow' && (r.path === '/' || r.path === '')
    );

    if (hasRootDisallow) {
      return {
        status: 'disallowed',
        directive: `User-agent: *\nDisallow: /`,
      };
    }
  }

  // No specific rules - defaults to allowed
  return { status: 'not-specified', directive: null };
}

/**
 * Fetch and analyze robots.txt for a URL
 */
export async function checkRobotsTxt(url: string): Promise<RobotsTxtResult> {
  const log = logger.child('robots-checker');

  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    log.debug(`Fetching robots.txt from ${robotsUrl}`);

    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CrawlReady/1.0)',
      },
    });

    // If robots.txt doesn't exist, all crawlers are allowed
    if (response.status === 404) {
      log.debug('No robots.txt found - all crawlers allowed');
      return {
        url,
        robotsTxtExists: false,
        rawContent: null,
        rules: AI_CRAWLERS.map((crawler) => ({
          crawler,
          status: 'allowed' as const,
          directive: 'No robots.txt',
        })),
        overallStatus: 'allowed',
        analyzedAt: new Date().toISOString(),
      };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch robots.txt: ${response.status}`);
    }

    const content = await response.text();
    const parsedRules = parseRobotsTxt(content);

    // Check each AI crawler
    const rules: RobotsTxtRule[] = AI_CRAWLERS.map((crawler) => {
      const { status, directive } = checkCrawlerStatus(crawler, parsedRules);
      return { crawler, status, directive };
    });

    // Determine overall status
    const blockedCount = rules.filter((r) => r.status === 'disallowed').length;
    const allowedCount = rules.filter((r) => r.status === 'allowed').length;

    let overallStatus: 'allowed' | 'blocked' | 'partial';
    if (blockedCount === rules.length) {
      overallStatus = 'blocked';
    } else if (blockedCount > 0) {
      overallStatus = 'partial';
    } else {
      overallStatus = 'allowed';
    }

    log.info(`robots.txt analysis for ${url}`, {
      overallStatus,
      blocked: blockedCount,
      allowed: allowedCount,
    });

    return {
      url,
      robotsTxtExists: true,
      rawContent: content,
      rules,
      overallStatus,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    log.error(`Failed to check robots.txt for ${url}`, { error: String(error) });

    // Return optimistic result on error (assume allowed)
    return {
      url,
      robotsTxtExists: false,
      rawContent: null,
      rules: AI_CRAWLERS.map((crawler) => ({
        crawler,
        status: 'not-specified' as const,
        directive: 'Error fetching robots.txt',
      })),
      overallStatus: 'allowed',
      analyzedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get human-readable interpretation of robots.txt status
 */
export function interpretRobotsTxt(result: RobotsTxtResult): string[] {
  const insights: string[] = [];

  if (!result.robotsTxtExists) {
    insights.push('No robots.txt file - all AI crawlers are allowed by default');
    return insights;
  }

  const blockedCrawlers = result.rules.filter((r) => r.status === 'disallowed');
  const allowedCrawlers = result.rules.filter((r) => r.status === 'allowed');

  if (blockedCrawlers.length > 0) {
    insights.push(
      `Blocked AI crawlers: ${blockedCrawlers.map((r) => r.crawler).join(', ')}`
    );

    // Check for specific important crawlers
    if (blockedCrawlers.some((r) => r.crawler === 'GPTBot')) {
      insights.push(
        'GPTBot is blocked - content will not appear in ChatGPT responses'
      );
    }
    if (blockedCrawlers.some((r) => r.crawler === 'ClaudeBot')) {
      insights.push('ClaudeBot is blocked - content will not appear in Claude responses');
    }
    if (blockedCrawlers.some((r) => r.crawler === 'PerplexityBot')) {
      insights.push(
        'PerplexityBot is blocked - content will not appear in Perplexity answers'
      );
    }
  }

  if (allowedCrawlers.length > 0 && blockedCrawlers.length > 0) {
    insights.push(
      `Allowed AI crawlers: ${allowedCrawlers.map((r) => r.crawler).join(', ')}`
    );
  }

  if (result.overallStatus === 'allowed') {
    insights.push('All major AI crawlers are allowed');
  }

  return insights;
}

/**
 * Check if CrawlReady would be useful given robots.txt status
 */
export function crawlReadyRelevant(result: RobotsTxtResult): boolean {
  // If all AI crawlers are blocked, CrawlReady won't help (they can't even try to crawl)
  return result.overallStatus !== 'blocked';
}
