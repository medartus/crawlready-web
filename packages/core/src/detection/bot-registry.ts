/**
 * Centralized AI bot registry — single source of truth.
 *
 * All consumers (ingest, tracking pixel, c.js, snippets) import from here.
 * See docs/architecture/analytics-infrastructure.md §Bot List Management (A5)
 */

export type BotCategory = 'search' | 'training' | 'agent';

export type BotMetadata = {
  name: string;
  org: string;
  category: BotCategory;
};

/**
 * Complete registry of known AI bots with metadata.
 */
export const BOT_REGISTRY: readonly BotMetadata[] = [
  { name: 'GPTBot', org: 'OpenAI', category: 'training' },
  { name: 'ChatGPT-User', org: 'OpenAI', category: 'agent' },
  { name: 'OAI-SearchBot', org: 'OpenAI', category: 'search' },
  { name: 'ClaudeBot', org: 'Anthropic', category: 'training' },
  { name: 'PerplexityBot', org: 'Perplexity', category: 'search' },
  { name: 'Perplexity-User', org: 'Perplexity', category: 'agent' },
  { name: 'Google-Extended', org: 'Google', category: 'training' },
  { name: 'Applebot-Extended', org: 'Apple', category: 'search' },
  { name: 'Meta-ExternalAgent', org: 'Meta', category: 'agent' },
  { name: 'Bytespider', org: 'ByteDance', category: 'training' },
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
