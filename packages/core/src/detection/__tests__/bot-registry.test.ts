import { describe, expect, it } from 'vitest';

import {
  AI_BOTS_REGEX,
  AI_BOTS_REGEX_STRING,
  BOT_REGISTRY,
  KNOWN_BOTS,
} from '../bot-registry';

describe('bot-registry', () => {
  // Sample of critical bots across all categories
  const criticalAIBots = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
    'Google-Extended',
  ];

  const criticalSearchBots = [
    'Googlebot',
    'Bingbot',
    'Yandex',
    'Baiduspider',
  ];

  const criticalSocialBots = [
    'facebookexternalhit',
    'Twitterbot',
    'LinkedInBot',
    'Slackbot',
  ];

  const criticalSEOTools = [
    'AhrefsBot',
    'SemrushBot',
    'Chrome-Lighthouse',
  ];

  it('should contain comprehensive bot list (80+ bots)', () => {
    // We now have 86 bots covering all categories (AI, search, social, SEO, etc.)
    expect(BOT_REGISTRY.length).toBeGreaterThanOrEqual(80);
    expect(BOT_REGISTRY.length).toBe(86);
  });

  it('should contain all critical AI bots', () => {
    for (const name of criticalAIBots) {
      expect(KNOWN_BOTS.has(name)).toBe(true);
    }
  });

  it('should contain all critical search engine bots', () => {
    for (const name of criticalSearchBots) {
      expect(KNOWN_BOTS.has(name)).toBe(true);
    }
  });

  it('should contain all critical social media bots', () => {
    for (const name of criticalSocialBots) {
      expect(KNOWN_BOTS.has(name)).toBe(true);
    }
  });

  it('should contain all critical SEO tool bots', () => {
    for (const name of criticalSEOTools) {
      expect(KNOWN_BOTS.has(name)).toBe(true);
    }
  });

  it('KNOWN_BOTS Set matches BOT_REGISTRY length', () => {
    expect(KNOWN_BOTS.size).toBe(BOT_REGISTRY.length);
  });

  it('AI_BOTS_REGEX matches all known bots (case-insensitive)', () => {
    const allCriticalBots = [
      ...criticalAIBots,
      ...criticalSearchBots,
      ...criticalSocialBots,
      ...criticalSEOTools,
    ];

    for (const name of allCriticalBots) {
      expect(AI_BOTS_REGEX.test(name)).toBe(true);
      expect(AI_BOTS_REGEX.test(name.toLowerCase())).toBe(true);
    }
  });

  it('AI_BOTS_REGEX does not match random user agents', () => {
    expect(AI_BOTS_REGEX.test('Mozilla/5.0')).toBe(false);
    expect(AI_BOTS_REGEX.test('curl/7.68')).toBe(false);
    expect(AI_BOTS_REGEX.test('wget/1.20')).toBe(false);
    expect(AI_BOTS_REGEX.test('PostmanRuntime/7.26.8')).toBe(false);
  });

  it('AI_BOTS_REGEX_STRING contains all bot names joined by pipe', () => {
    const allCriticalBots = [
      ...criticalAIBots,
      ...criticalSearchBots,
      ...criticalSocialBots,
      ...criticalSEOTools,
    ];

    for (const name of allCriticalBots) {
      expect(AI_BOTS_REGEX_STRING).toContain(name);
    }

    expect(AI_BOTS_REGEX_STRING.split('|').length).toBe(BOT_REGISTRY.length);
  });

  it('every bot has valid metadata', () => {
    const validCategories = [
      'ai-search',
      'ai-training',
      'ai-agent',
      'search-engine',
      'social-media',
      'seo-tool',
      'validator',
      'preview',
    ];

    for (const bot of BOT_REGISTRY) {
      expect(bot.name).toBeTruthy();
      expect(bot.org).toBeTruthy();
      expect(validCategories).toContain(bot.category);
    }
  });

  it('should have proper category distribution', () => {
    const categoryCounts = BOT_REGISTRY.reduce<Record<string, number>>(
      (acc, bot) => {
        acc[bot.category] = (acc[bot.category] || 0) + 1;
        return acc;
      },
      {},
    );

    // Verify we have bots in all major categories
    expect(categoryCounts['ai-search']).toBeGreaterThan(0);
    expect(categoryCounts['ai-training']).toBeGreaterThan(0);
    expect(categoryCounts['search-engine']).toBeGreaterThan(0);
    expect(categoryCounts['social-media']).toBeGreaterThan(0);
    expect(categoryCounts['seo-tool']).toBeGreaterThan(0);
  });

  it('should handle special characters in bot names', () => {
    // Test bots with special characters
    expect(KNOWN_BOTS.has('Yahoo! Slurp')).toBe(true);
    expect(KNOWN_BOTS.has('Pinterest/0.')).toBe(true);
    expect(KNOWN_BOTS.has('W3C_Validator')).toBe(true);
  });

  it('should match bots in realistic User-Agent strings', () => {
    const testCases = [
      {
        ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        expected: 'Googlebot',
      },
      {
        ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        expected: 'facebookexternalhit',
      },
      {
        ua: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) ChatGPT-User/1.0',
        expected: 'ChatGPT-User',
      },
      {
        ua: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
        expected: 'AhrefsBot',
      },
    ];

    for (const { ua, expected } of testCases) {
      const match = AI_BOTS_REGEX.exec(ua);

      expect(match).not.toBeNull();
      expect(match?.[0].toLowerCase()).toBe(expected.toLowerCase());
    }
  });
});
