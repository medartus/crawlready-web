/**
 * AI Crawler Detection Library
 * Detects and categorizes various AI crawlers and bots
 */

export interface CrawlerInfo {
  name: string;
  type: 'ai' | 'search' | 'social' | 'seo';
  vendor: string;
  supportsJS: boolean;
  priority: number;
}

export const AI_CRAWLERS: Record<string, { pattern: RegExp; info: Omit<CrawlerInfo, 'name'> }> = {
  GPTBot: {
    pattern: /GPTBot/i,
    info: { type: 'ai', vendor: 'OpenAI', supportsJS: true, priority: 10 },
  },
  OAI_SearchBot: {
    pattern: /OAI-SearchBot/i,
    info: { type: 'ai', vendor: 'OpenAI', supportsJS: true, priority: 10 },
  },
  ChatGPT_User: {
    pattern: /ChatGPT-User/i,
    info: { type: 'ai', vendor: 'OpenAI', supportsJS: true, priority: 10 },
  },
  ClaudeBot: {
    pattern: /ClaudeBot|Claude-Web/i,
    info: { type: 'ai', vendor: 'Anthropic', supportsJS: true, priority: 9 },
  },
  PerplexityBot: {
    pattern: /PerplexityBot/i,
    info: { type: 'ai', vendor: 'Perplexity', supportsJS: false, priority: 9 },
  },
  Google_Extended: {
    pattern: /Google-Extended/i,
    info: { type: 'ai', vendor: 'Google', supportsJS: true, priority: 8 },
  },
  GoogleOther: {
    pattern: /GoogleOther/i,
    info: { type: 'ai', vendor: 'Google', supportsJS: true, priority: 7 },
  },
  FacebookBot: {
    pattern: /FacebookBot/i,
    info: { type: 'social', vendor: 'Meta', supportsJS: false, priority: 6 },
  },
  Meta_ExternalAgent: {
    pattern: /Meta-ExternalAgent/i,
    info: { type: 'ai', vendor: 'Meta', supportsJS: true, priority: 7 },
  },
  BingBot: {
    pattern: /bingbot/i,
    info: { type: 'search', vendor: 'Microsoft', supportsJS: true, priority: 7 },
  },
  YouBot: {
    pattern: /YouBot/i,
    info: { type: 'ai', vendor: 'You.com', supportsJS: false, priority: 6 },
  },
  DuckDuckBot: {
    pattern: /DuckDuckBot/i,
    info: { type: 'search', vendor: 'DuckDuckGo', supportsJS: false, priority: 5 },
  },
  Googlebot: {
    pattern: /Googlebot/i,
    info: { type: 'search', vendor: 'Google', supportsJS: true, priority: 8 },
  },
};

export function detectCrawler(userAgent: string): CrawlerInfo | null {
  if (!userAgent) return null;

  for (const [name, { pattern, info }] of Object.entries(AI_CRAWLERS)) {
    if (pattern.test(userAgent)) {
      return { name, ...info };
    }
  }

  return null;
}

export function getAllCrawlers(): CrawlerInfo[] {
  return Object.entries(AI_CRAWLERS).map(([name, { info }]) => ({
    name,
    ...info,
  }));
}
