import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteKeyCache } from '../site-key-cache';

describe('SiteKeyCache', () => {
  let cache: SiteKeyCache;

  beforeEach(() => {
    cache = new SiteKeyCache(3, 5000); // max 3 entries, 5s TTL
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns undefined on cache miss', () => {
    expect(cache.get('cr_live_missing')).toBeUndefined();
  });

  it('returns siteId on cache hit', () => {
    cache.set('cr_live_abc', 'site-1');

    expect(cache.get('cr_live_abc')).toEqual({ siteId: 'site-1' });
  });

  it('updates existing entry', () => {
    cache.set('cr_live_abc', 'site-1');
    cache.set('cr_live_abc', 'site-2');

    expect(cache.get('cr_live_abc')).toEqual({ siteId: 'site-2' });
    expect(cache.size).toBe(1);
  });

  it('evicts LRU entry when at max size', () => {
    cache.set('cr_live_a', 'site-a');
    cache.set('cr_live_b', 'site-b');
    cache.set('cr_live_c', 'site-c');

    // 'a' is LRU — should be evicted when 'd' is added
    cache.set('cr_live_d', 'site-d');

    expect(cache.get('cr_live_a')).toBeUndefined();
    expect(cache.get('cr_live_b')).toEqual({ siteId: 'site-b' });
    expect(cache.get('cr_live_d')).toEqual({ siteId: 'site-d' });
    expect(cache.size).toBe(3);
  });

  it('accessing an entry promotes it (prevents eviction)', () => {
    cache.set('cr_live_a', 'site-a');
    cache.set('cr_live_b', 'site-b');
    cache.set('cr_live_c', 'site-c');

    // Access 'a' to promote it — 'b' becomes LRU
    cache.get('cr_live_a');
    cache.set('cr_live_d', 'site-d');

    expect(cache.get('cr_live_a')).toEqual({ siteId: 'site-a' });
    expect(cache.get('cr_live_b')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    const now = Date.now();

    vi.spyOn(Date, 'now').mockReturnValue(now);
    cache.set('cr_live_abc', 'site-1');

    // Advance time past TTL
    vi.spyOn(Date, 'now').mockReturnValue(now + 6000);

    expect(cache.get('cr_live_abc')).toBeUndefined();
  });

  it('delete removes entry from cache', () => {
    cache.set('cr_live_abc', 'site-1');
    cache.delete('cr_live_abc');

    expect(cache.get('cr_live_abc')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('delete on non-existent key is no-op', () => {
    cache.delete('cr_live_missing');

    expect(cache.size).toBe(0);
  });
});
