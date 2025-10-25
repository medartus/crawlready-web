/**
 * Robots.txt Checker
 * Critical for Phase 0 - blocks = invisible to AI
 */

import type { RobotsTxtCheck } from '../types';

export class RobotsTxtChecker {
  /**
   * Check robots.txt for AI crawler access
   */
  static async check(baseUrl: string): Promise<RobotsTxtCheck> {
    try {
      const robotsUrl = new URL('/robots.txt', baseUrl).href;
      const response = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        return {
          exists: false,
          allowsGPTBot: true,
          allowsClaudeBot: true,
          allowsPerplexityBot: true,
          blocksAllBots: false,
          hasSitemap: false,
          issues: [],
        };
      }

      const content = await response.text();
      const issues: string[] = [];

      // Check for AI crawler blocking
      const blocksGPTBot = /User-agent:\s*GPTBot[\s\S]{0,200}Disallow:\s*\//i.test(content);
      const blocksClaudeBot = /User-agent:\s*ClaudeBot[\s\S]{0,200}Disallow:\s*\//i.test(content);
      const blocksPerplexityBot = /User-agent:\s*PerplexityBot[\s\S]{0,200}Disallow:\s*\//i.test(content);
      const blocksAllBots = /User-agent:\s*\*[\s\S]{0,50}Disallow:\s*\//i.test(content);
      const hasSitemap = /Sitemap:/i.test(content);

      if (blocksGPTBot) {
        issues.push('Blocks GPTBot (ChatGPT) - invisible to OpenAI');
      }
      if (blocksClaudeBot) {
        issues.push('Blocks ClaudeBot - invisible to Anthropic');
      }
      if (blocksPerplexityBot) {
        issues.push('Blocks PerplexityBot - invisible to Perplexity');
      }
      if (blocksAllBots) {
        issues.push('Disallow: / for all bots - blocks ALL crawlers');
      }
      if (!hasSitemap) {
        issues.push('No sitemap declared in robots.txt');
      }

      return {
        exists: true,
        allowsGPTBot: !blocksGPTBot && !blocksAllBots,
        allowsClaudeBot: !blocksClaudeBot && !blocksAllBots,
        allowsPerplexityBot: !blocksPerplexityBot && !blocksAllBots,
        blocksAllBots,
        hasSitemap,
        issues,
      };
    } catch {
      // robots.txt not found is not critical
      return {
        exists: false,
        allowsGPTBot: true,
        allowsClaudeBot: true,
        allowsPerplexityBot: true,
        blocksAllBots: false,
        hasSitemap: false,
        issues: [],
      };
    }
  }
}
