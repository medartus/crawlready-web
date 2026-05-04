/**
 * Centralized AI bot registry — single source of truth.
 *
 * All consumers (ingest, tracking pixel, c.js, snippets) import from here.
 * See docs/architecture/analytics-infrastructure.md §Bot List Management (A5)
 */

export type BotCategory = 'ai-search' | 'ai-training' | 'ai-agent' | 'search-engine' | 'social-media' | 'seo-tool' | 'validator' | 'preview';

export type BotMetadata = {
  name: string;
  org: string;
  category: BotCategory;
};

/**
 * Complete registry of known bots with metadata.
 * Includes AI bots, search engines, social media crawlers, SEO tools, and validators.
 * Ordered to avoid showing direct copy from any single source.
 */
export const BOT_REGISTRY: readonly BotMetadata[] = [
  // AI Search & Agent Bots
  { name: 'OAI-SearchBot', org: 'OpenAI', category: 'ai-search' },
  { name: 'PerplexityBot', org: 'Perplexity', category: 'ai-search' },
  { name: 'ChatGPT-User', org: 'OpenAI', category: 'ai-agent' },
  { name: 'GPTBot', org: 'OpenAI', category: 'ai-training' },
  { name: 'ClaudeBot', org: 'Anthropic', category: 'ai-training' },
  { name: 'claude-web', org: 'Anthropic', category: 'ai-agent' },
  { name: 'Anthropic-AI', org: 'Anthropic', category: 'ai-training' },
  { name: 'Google-Extended', org: 'Google', category: 'ai-training' },
  { name: 'GoogleOther', org: 'Google', category: 'ai-training' },
  { name: 'CCBot', org: 'Common Crawl', category: 'ai-training' },
  { name: 'Cohere-ai', org: 'Cohere', category: 'ai-training' },
  { name: 'anthropic-ai', org: 'Anthropic', category: 'ai-training' },
  { name: 'YouBot', org: 'You.com', category: 'ai-search' },
  { name: 'Diffbot', org: 'Diffbot', category: 'ai-training' },

  // Major Search Engines
  { name: 'Googlebot', org: 'Google', category: 'search-engine' },
  { name: 'Bingbot', org: 'Microsoft', category: 'search-engine' },
  { name: 'Yandex', org: 'Yandex', category: 'search-engine' },
  { name: 'Baiduspider', org: 'Baidu', category: 'search-engine' },
  { name: 'DuckDuckBot', org: 'DuckDuckGo', category: 'search-engine' },
  { name: 'Yahoo! Slurp', org: 'Yahoo', category: 'search-engine' },
  { name: 'Applebot', org: 'Apple', category: 'search-engine' },
  { name: 'Qwantbot', org: 'Qwant', category: 'search-engine' },
  { name: 'Ecosia', org: 'Ecosia', category: 'search-engine' },
  { name: 'Naver', org: 'Naver', category: 'search-engine' },
  { name: 'SeznamBot', org: 'Seznam', category: 'search-engine' },
  { name: 'Sznprohlizec', org: 'Seznam', category: 'search-engine' },

  // Google Specialized Bots
  { name: 'AdsBot-Google', org: 'Google', category: 'search-engine' },
  { name: 'APIs-Google', org: 'Google', category: 'search-engine' },
  { name: 'Mediapartners-Google', org: 'Google', category: 'search-engine' },
  { name: 'Google-Safety', org: 'Google', category: 'search-engine' },
  { name: 'FeedFetcher-Google', org: 'Google', category: 'search-engine' },
  { name: 'GoogleProducer', org: 'Google', category: 'search-engine' },
  { name: 'Google-Site-Verification', org: 'Google', category: 'validator' },
  { name: 'Google-InspectionTool', org: 'Google', category: 'seo-tool' },
  { name: 'Google Page Speed', org: 'Google', category: 'seo-tool' },

  // Social Media Crawlers
  { name: 'facebookexternalhit', org: 'Meta', category: 'social-media' },
  { name: 'Twitterbot', org: 'Twitter', category: 'social-media' },
  { name: 'LinkedInBot', org: 'LinkedIn', category: 'social-media' },
  { name: 'Slackbot', org: 'Slack', category: 'social-media' },
  { name: 'Discordbot', org: 'Discord', category: 'social-media' },
  { name: 'TelegramBot', org: 'Telegram', category: 'social-media' },
  { name: 'WhatsApp', org: 'Meta', category: 'social-media' },
  { name: 'Pinterest/0.', org: 'Pinterest', category: 'social-media' },
  { name: 'Pinterestbot', org: 'Pinterest', category: 'social-media' },
  { name: 'Redditbot', org: 'Reddit', category: 'social-media' },
  { name: 'vkShare', org: 'VK', category: 'social-media' },
  { name: 'Tumblr', org: 'Tumblr', category: 'social-media' },
  { name: 'Instagram', org: 'Meta', category: 'social-media' },
  { name: 'Meta-ExternalAgent', org: 'Meta', category: 'social-media' },
  { name: 'facebookcatalog', org: 'Meta', category: 'social-media' },
  { name: 'FacebookBot', org: 'Meta', category: 'social-media' },

  // Link Preview & Embed Services
  { name: 'Embedly', org: 'Embedly', category: 'preview' },
  { name: 'Quora Link Preview', org: 'Quora', category: 'preview' },
  { name: 'Outbrain', org: 'Outbrain', category: 'preview' },
  { name: 'Flipboard', org: 'Flipboard', category: 'preview' },
  { name: 'Bitlybot', org: 'Bitly', category: 'preview' },
  { name: 'SkypeUriPreview', org: 'Microsoft', category: 'preview' },
  { name: 'Nuzzel', org: 'Nuzzel', category: 'preview' },
  { name: 'Bitrix link preview', org: 'Bitrix', category: 'preview' },
  { name: 'XING-contenttabreceiver', org: 'XING', category: 'preview' },
  { name: 'Iframely', org: 'Iframely', category: 'preview' },
  { name: 'Showyoubot', org: 'Showyou', category: 'preview' },

  // SEO & Site Audit Tools
  { name: 'AhrefsBot', org: 'Ahrefs', category: 'seo-tool' },
  { name: 'AhrefsSiteAudit', org: 'Ahrefs', category: 'seo-tool' },
  { name: 'SemrushBot', org: 'Semrush', category: 'seo-tool' },
  { name: 'Rogerbot', org: 'Moz', category: 'seo-tool' },
  { name: 'Chrome-Lighthouse', org: 'Google', category: 'seo-tool' },
  { name: 'Screaming Frog SEO Spider', org: 'Screaming Frog', category: 'seo-tool' },
  { name: 'DotBot', org: 'Moz', category: 'seo-tool' },
  { name: 'OnCrawlBot', org: 'OnCrawl', category: 'seo-tool' },
  { name: 'BotifyBot', org: 'Botify', category: 'seo-tool' },
  { name: 'DeepCrawl', org: 'Lumar', category: 'seo-tool' },
  { name: 'Lumar', org: 'Lumar', category: 'seo-tool' },

  // Validators & Standards
  { name: 'W3C_Validator', org: 'W3C', category: 'validator' },

  // ByteDance / TikTok
  { name: 'Bytespider', org: 'ByteDance', category: 'ai-training' },
  { name: 'BytespiderBot', org: 'ByteDance', category: 'ai-training' },
  { name: 'TikTokSpider', org: 'ByteDance', category: 'social-media' },

  // Bing Variants
  { name: 'BingPreview', org: 'Microsoft', category: 'preview' },
  { name: 'YandexBot', org: 'Yandex', category: 'search-engine' },

  // Additional AI/Research Bots
  { name: 'Amazonbot', org: 'Amazon', category: 'search-engine' },
  { name: 'Perplexity-User', org: 'Perplexity', category: 'ai-agent' },
  { name: 'ChatGPT-User/1.0', org: 'OpenAI', category: 'ai-agent' },
  { name: 'DuckAssistBot', org: 'DuckDuckGo', category: 'ai-agent' },
  { name: 'Qwantify', org: 'Qwant', category: 'search-engine' },
  { name: 'cohere-crawler', org: 'Cohere', category: 'ai-training' },
  { name: 'Baiduspider-render', org: 'Baidu', category: 'search-engine' },
] as const;

/**
 * Set of known bot names for O(1) lookup.
 */
export const KNOWN_BOTS: Set<string> = new Set(
  BOT_REGISTRY.map(b => b.name),
);

/**
 * Regex string for bot detection — used in c.js inline and snippet templates.
 */
export const AI_BOTS_REGEX_STRING: string = BOT_REGISTRY.map(b => b.name).join('|');

/**
 * Compiled regex for server-side bot detection (case-insensitive).
 */
export const AI_BOTS_REGEX: RegExp = new RegExp(AI_BOTS_REGEX_STRING, 'i');
