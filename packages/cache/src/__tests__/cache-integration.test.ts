/**
 * Cache Integration Tests
 *
 * Tests the cache module at the highest level possible - testing real Redis operations
 * with actual URL normalization and cache key generation.
 */

import { afterAll, describe, expect, it } from 'vitest';

import { cache, getCacheKey, normalizeUrl } from '../index';

describe('Cache Integration Tests', () => {
  const testHtml = '<html><body><h1>Test Page</h1></body></html>';
  const testUrl = 'https://example.com/test-page?utm_source=test';

  afterAll(async () => {
    // Cleanup test data
    const normalizedUrl = normalizeUrl(testUrl);
    const cacheKey = getCacheKey(normalizedUrl);
    await cache.del(cacheKey);
  });

  describe('URL Normalization and Caching Flow', () => {
    it('should normalize URLs consistently and cache content', async () => {
      // Test URL normalization
      const url1 = 'https://example.com/page?b=2&a=1';
      const url2 = 'https://example.com/page?a=1&b=2';
      const url3 = 'https://example.com/page/?a=1&b=2';

      const normalized1 = normalizeUrl(url1);
      const normalized2 = normalizeUrl(url2);
      const normalized3 = normalizeUrl(url3);

      // All variations should normalize to the same URL
      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);

      // Generate cache key
      const cacheKey = getCacheKey(normalized1);

      expect(cacheKey).toMatch(/^cache:/);
      expect(cacheKey).toContain(normalized1);
    });

    it('should store and retrieve HTML from cache', async () => {
      const normalizedUrl = normalizeUrl(testUrl);
      const cacheKey = getCacheKey(normalizedUrl);

      // Store HTML in cache
      await cache.set(cacheKey, testHtml);

      // Retrieve HTML from cache
      const cachedHtml = await cache.get(cacheKey);

      expect(cachedHtml).toBe(testHtml);
    });

    it('should check cache existence', async () => {
      const normalizedUrl = normalizeUrl(testUrl);
      const cacheKey = getCacheKey(normalizedUrl);

      // Should exist after previous test
      const exists = await cache.exists(cacheKey);

      expect(exists).toBe(1);

      // Non-existent key
      const nonExistentKey = getCacheKey('https://nonexistent.example.com');
      const notExists = await cache.exists(nonExistentKey);

      expect(notExists).toBe(0);
    });

    it('should delete cached content', async () => {
      const normalizedUrl = normalizeUrl(testUrl);
      const cacheKey = getCacheKey(normalizedUrl);

      // Ensure it exists first
      await cache.set(cacheKey, testHtml);
      let exists = await cache.exists(cacheKey);

      expect(exists).toBe(1);

      // Delete it
      await cache.del(cacheKey);

      // Verify deletion
      exists = await cache.exists(cacheKey);

      expect(exists).toBe(0);

      const retrieved = await cache.get(cacheKey);

      expect(retrieved).toBeNull();
    });
  });

  describe('Real-world Cache Scenarios', () => {
    it('should handle cache miss gracefully', async () => {
      const nonExistentUrl = 'https://never-cached.example.com/page';
      const normalizedUrl = normalizeUrl(nonExistentUrl);
      const cacheKey = getCacheKey(normalizedUrl);

      const result = await cache.get(cacheKey);

      expect(result).toBeNull();
    });

    it('should handle multiple URLs being cached simultaneously', async () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3',
      ];

      // Cache multiple pages
      const cachePromises = urls.map((url, index) => {
        const normalizedUrl = normalizeUrl(url);
        const cacheKey = getCacheKey(normalizedUrl);
        const html = `<html><body><h1>Page ${index + 1}</h1></body></html>`;
        return cache.set(cacheKey, html);
      });

      await Promise.all(cachePromises);

      // Verify all are cached
      const retrievePromises = urls.map((url) => {
        const normalizedUrl = normalizeUrl(url);
        const cacheKey = getCacheKey(normalizedUrl);
        return cache.get(cacheKey);
      });

      const results = await Promise.all(retrievePromises);

      results.forEach((html, index) => {
        expect(html).toContain(`Page ${index + 1}`);
      });

      // Cleanup
      const cleanupPromises = urls.map((url) => {
        const normalizedUrl = normalizeUrl(url);
        const cacheKey = getCacheKey(normalizedUrl);
        return cache.del(cacheKey);
      });

      await Promise.all(cleanupPromises);
    });

    it('should normalize URLs with various edge cases', () => {
      // Trailing slashes
      expect(normalizeUrl('https://example.com/page/')).toBe('https://example.com/page');
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com');

      // Protocol normalization
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');

      // Fragment removal
      expect(normalizeUrl('https://example.com/page#section')).toBe('https://example.com/page');

      // Query parameter sorting
      const urlWithParams = 'https://example.com/page?z=3&a=1&m=2';
      const normalized = normalizeUrl(urlWithParams);

      expect(normalized).toContain('a=1');
      expect(normalized).toContain('m=2');
      expect(normalized).toContain('z=3');
    });
  });
});
