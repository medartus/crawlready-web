import { describe, expect, it, vi } from 'vitest';

import { dedupCache } from '../dedup-cache';

describe('DedupCache', () => {
  it('allows first beacon through', () => {
    expect(dedupCache.isDuplicate('key1', '/page', 'GPTBot')).toBe(false);
  });

  it('rejects duplicate within 1s window', () => {
    dedupCache.isDuplicate('key2', '/page', 'GPTBot');

    expect(dedupCache.isDuplicate('key2', '/page', 'GPTBot')).toBe(true);
  });

  it('allows different paths for same key', () => {
    dedupCache.isDuplicate('key3', '/a', 'GPTBot');

    expect(dedupCache.isDuplicate('key3', '/b', 'GPTBot')).toBe(false);
  });

  it('allows different bots for same key+path', () => {
    dedupCache.isDuplicate('key4', '/page', 'GPTBot');

    expect(dedupCache.isDuplicate('key4', '/page', 'ClaudeBot')).toBe(false);
  });

  it('allows beacon after dedup window expires', () => {
    dedupCache.isDuplicate('key5', '/page', 'GPTBot');

    // Fast-forward past dedup window
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1_100);

    expect(dedupCache.isDuplicate('key5', '/page', 'GPTBot')).toBe(false);

    vi.restoreAllMocks();
  });
});
