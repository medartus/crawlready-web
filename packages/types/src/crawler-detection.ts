import type { CrawlerInfo, CrawlerType } from './render-job';

// Known AI crawlers
const AI_CRAWLERS: Array<{ pattern: string; name: string }> = [
  { pattern: 'gptbot', name: 'GPTBot' },
  { pattern: 'chatgpt-user', name: 'ChatGPT-User' },
  { pattern: 'oai-searchbot', name: 'OAI-SearchBot' },
  { pattern: 'claudebot', name: 'ClaudeBot' },
  { pattern: 'claude-web', name: 'Claude-Web' },
  { pattern: 'anthropic-ai', name: 'Anthropic-AI' },
  { pattern: 'perplexitybot', name: 'PerplexityBot' },
  { pattern: 'google-extended', name: 'Google-Extended' },
  { pattern: 'bytespider', name: 'Bytespider' },
  { pattern: 'ccbot', name: 'CCBot' },
  { pattern: 'cohere-ai', name: 'cohere-ai' },
  { pattern: 'meta-externalagent', name: 'Meta-ExternalAgent' },
];

// Known search engine crawlers
const SEARCH_CRAWLERS: Array<{ pattern: string; name: string }> = [
  { pattern: 'googlebot', name: 'Googlebot' },
  { pattern: 'bingbot', name: 'Bingbot' },
  { pattern: 'duckduckbot', name: 'DuckDuckBot' },
  { pattern: 'slurp', name: 'Yahoo! Slurp' },
  { pattern: 'yandexbot', name: 'YandexBot' },
  { pattern: 'baiduspider', name: 'Baiduspider' },
  { pattern: 'applebot', name: 'Applebot' },
];

// Known social media crawlers
const SOCIAL_CRAWLERS: Array<{ pattern: string; name: string }> = [
  { pattern: 'twitterbot', name: 'TwitterBot' },
  { pattern: 'facebookexternalhit', name: 'FacebookBot' },
  { pattern: 'linkedinbot', name: 'LinkedInBot' },
  { pattern: 'slackbot', name: 'Slackbot' },
  { pattern: 'discordbot', name: 'Discordbot' },
  { pattern: 'telegrambot', name: 'TelegramBot' },
  { pattern: 'whatsapp', name: 'WhatsApp' },
];

// Known monitoring bots
const MONITORING_CRAWLERS: Array<{ pattern: string; name: string }> = [
  { pattern: 'uptimerobot', name: 'UptimeRobot' },
  { pattern: 'pingdom', name: 'Pingdom' },
  { pattern: 'datadogsynthetics', name: 'DatadogSynthetics' },
  { pattern: 'site24x7', name: 'Site24x7' },
  { pattern: 'newrelic', name: 'NewRelic' },
  { pattern: 'statuspage', name: 'StatusPage' },
];

/**
 * Detect crawler information from user agent string
 */
export function detectCrawler(userAgent: string | null | undefined): CrawlerInfo {
  if (!userAgent) {
    return { name: null, type: 'direct', userAgent: null };
  }

  const ua = userAgent.toLowerCase();

  // Check AI crawlers first (more specific)
  for (const crawler of AI_CRAWLERS) {
    if (ua.includes(crawler.pattern)) {
      return { name: crawler.name, type: 'ai', userAgent };
    }
  }

  // Check search engines
  for (const crawler of SEARCH_CRAWLERS) {
    if (ua.includes(crawler.pattern)) {
      return { name: crawler.name, type: 'search', userAgent };
    }
  }

  // Check social media
  for (const crawler of SOCIAL_CRAWLERS) {
    if (ua.includes(crawler.pattern)) {
      return { name: crawler.name, type: 'social', userAgent };
    }
  }

  // Check monitoring bots
  for (const crawler of MONITORING_CRAWLERS) {
    if (ua.includes(crawler.pattern)) {
      return { name: crawler.name, type: 'monitoring', userAgent };
    }
  }

  // Check for generic bot patterns
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
    return { name: null, type: 'unknown', userAgent };
  }

  // No bot detected - likely direct API access or regular user
  return { name: null, type: 'direct', userAgent };
}

/**
 * Check if a user agent is an AI crawler
 */
export function isAICrawler(userAgent: string | null | undefined): boolean {
  const info = detectCrawler(userAgent);
  return info.type === 'ai';
}

/**
 * Check if a user agent is any kind of crawler/bot
 */
export function isCrawler(userAgent: string | null | undefined): boolean {
  const info = detectCrawler(userAgent);
  return info.type !== 'direct';
}

/**
 * Get list of all known AI crawler names
 */
export function getKnownAICrawlers(): string[] {
  return AI_CRAWLERS.map(c => c.name);
}

/**
 * Get list of all known crawler names by type
 */
export function getKnownCrawlers(): Record<CrawlerType, string[]> {
  return {
    ai: AI_CRAWLERS.map(c => c.name),
    search: SEARCH_CRAWLERS.map(c => c.name),
    social: SOCIAL_CRAWLERS.map(c => c.name),
    monitoring: MONITORING_CRAWLERS.map(c => c.name),
    unknown: [],
    direct: [],
  };
}
