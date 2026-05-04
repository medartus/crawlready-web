import { describe, expect, it } from 'vitest';

import {
  AI_BOTS_REGEX,
  AI_BOTS_REGEX_STRING,
  BOT_REGISTRY,
  KNOWN_BOTS,
} from '../bot-registry';

describe('bot-registry', () => {
  const expectedBots = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'Meta-ExternalAgent',
    'Bytespider',
  ];

  it('should contain all 10 expected bots', () => {
    expect(BOT_REGISTRY).toHaveLength(10);

    for (const name of expectedBots) {
      expect(KNOWN_BOTS.has(name)).toBe(true);
    }
  });

  it('KNOWN_BOTS Set matches BOT_REGISTRY length', () => {
    expect(KNOWN_BOTS.size).toBe(BOT_REGISTRY.length);
  });

  it('AI_BOTS_REGEX matches all known bots (case-insensitive)', () => {
    for (const name of expectedBots) {
      expect(AI_BOTS_REGEX.test(name)).toBe(true);
      expect(AI_BOTS_REGEX.test(name.toLowerCase())).toBe(true);
    }
  });

  it('AI_BOTS_REGEX does not match random user agents', () => {
    expect(AI_BOTS_REGEX.test('Mozilla/5.0')).toBe(false);
    expect(AI_BOTS_REGEX.test('Googlebot')).toBe(false);
    expect(AI_BOTS_REGEX.test('curl/7.68')).toBe(false);
  });

  it('AI_BOTS_REGEX extracts bot name from full UA string', () => {
    const ua = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) ChatGPT-User/1.0';
    const match = AI_BOTS_REGEX.exec(ua);

    expect(match).not.toBeNull();
    expect(match?.[0]).toBe('ChatGPT-User');
  });

  it('AI_BOTS_REGEX_STRING contains all bot names joined by pipe', () => {
    for (const name of expectedBots) {
      expect(AI_BOTS_REGEX_STRING).toContain(name);
    }

    expect(AI_BOTS_REGEX_STRING.split('|')).toHaveLength(10);
  });

  it('every bot has valid metadata', () => {
    for (const bot of BOT_REGISTRY) {
      expect(bot.name).toBeTruthy();
      expect(bot.org).toBeTruthy();
      expect(['search', 'training', 'agent']).toContain(bot.category);
    }
  });
});
