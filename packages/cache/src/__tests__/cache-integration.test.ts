/**
 * Cache Integration Tests
 *
 * Tests the cache module at the highest level possible - testing real Redis operations
 * with actual URL normalization and cache key generation.
 *
 * CDN-First Architecture Tests:
 * - Tests metadata caching (not HTML storage)
 * - Tests CDN URL generation
 */

import { afterAll, describe, expect, it } from 'vitest';

import {
  cache,
  cacheMetadata,
  extractSupabaseProjectId,
  getCacheKey,
  getCdnUrlSync,
  getMetadataCacheKey,
  hashUrlSync,
  normalizeUrl,
} from '../index';

describe('cache Integration Tests', () => {
  const testHtml = '<html><body><h1>Test Page</h1></body></html>';
  const testUrl = 'https://example.com/test-page?utm_source=test';

  afterAll(async () => {
    // Cleanup test data
    const normalizedUrl = normalizeUrl(testUrl);
    const cacheKey = getCacheKey(normalizedUrl);
    await cache.del(cacheKey);
  });

  describe('uRL Normalization and Caching Flow', () => {
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

      expect(cacheKey).toMatch(/^render:v1:/);
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

  describe('real-world Cache Scenarios', () => {
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

      // Protocol normalization (always upgrades to https)
      expect(normalizeUrl('http://example.com')).toBe('https://example.com');
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

describe('cDN-First Architecture Tests', () => {
  const testUrl = 'https://example.com/cdn-test-page';
  const testProjectId = 'testproject';

  afterAll(async () => {
    // Cleanup test metadata
    const normalizedUrl = normalizeUrl(testUrl);
    const metadataKey = getMetadataCacheKey(normalizedUrl);
    await cacheMetadata.del(metadataKey);
  });

  describe('uRL Hashing and CDN URL Generation', () => {
    it('should generate consistent URL hashes', () => {
      const url = 'https://example.com/page';
      const hash1 = hashUrlSync(url);
      const hash2 = hashUrlSync(url);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(32); // 32 hex characters (128 bits)
    });

    it('should generate different hashes for different URLs', () => {
      const hash1 = hashUrlSync('https://example.com/page1');
      const hash2 = hashUrlSync('https://example.com/page2');

      expect(hash1).not.toBe(hash2);
    });

    it('should generate deterministic CDN URLs', () => {
      const pageUrl = 'https://example.com/my-page';
      const cdnUrl1 = getCdnUrlSync(pageUrl, testProjectId);
      const cdnUrl2 = getCdnUrlSync(pageUrl, testProjectId);

      expect(cdnUrl1).toBe(cdnUrl2);
      expect(cdnUrl1).toMatch(
        /^https:\/\/testproject\.supabase\.co\/storage\/v1\/object\/public\/rendered-pages\/[a-f0-9]{32}\.html$/,
      );
    });

    it('should generate different CDN URLs for different pages', () => {
      const cdnUrl1 = getCdnUrlSync('https://example.com/page1', testProjectId);
      const cdnUrl2 = getCdnUrlSync('https://example.com/page2', testProjectId);

      expect(cdnUrl1).not.toBe(cdnUrl2);
    });

    it('should normalize URL before generating CDN URL', () => {
      // Different URL variations should produce the same CDN URL
      const cdnUrl1 = getCdnUrlSync('https://example.com/page?utm_source=test', testProjectId);
      const cdnUrl2 = getCdnUrlSync('https://example.com/page', testProjectId);

      expect(cdnUrl1).toBe(cdnUrl2);
    });

    it('should extract Supabase project ID from URL', () => {
      const projectId = extractSupabaseProjectId('https://myproject.supabase.co');

      expect(projectId).toBe('myproject');
    });

    it('should throw for invalid Supabase URL', () => {
      expect(() => extractSupabaseProjectId('not-a-valid-url')).toThrow();
    });
  });

  describe('metadata Cache Key Generation', () => {
    it('should generate metadata cache key with correct prefix', () => {
      const url = 'https://example.com/page';
      const metadataKey = getMetadataCacheKey(url);

      expect(metadataKey).toMatch(/^render:meta:v1:/);
    });

    it('should generate different key than legacy cache key', () => {
      const url = 'https://example.com/page';
      const metadataKey = getMetadataCacheKey(url);
      const legacyKey = getCacheKey(url);

      expect(metadataKey).not.toBe(legacyKey);
      expect(metadataKey).toContain('meta');
      expect(legacyKey).not.toContain('meta');
    });

    it('should normalize URL before generating metadata key', () => {
      const key1 = getMetadataCacheKey('https://example.com/page?utm_source=test');
      const key2 = getMetadataCacheKey('https://example.com/page');

      expect(key1).toBe(key2);
    });
  });

  describe('cache Metadata Operations', () => {
    it('should store and retrieve cache metadata', async () => {
      const normalizedUrl = normalizeUrl(testUrl);
      const metadataKey = getMetadataCacheKey(normalizedUrl);
      const publicUrl = getCdnUrlSync(testUrl, testProjectId);

      // Set as ready
      await cacheMetadata.setReady(metadataKey, publicUrl, 'rendered/test.html', 1024);

      // Retrieve
      const metadata = await cacheMetadata.get(metadataKey);

      expect(metadata).not.toBeNull();
      expect(metadata?.status).toBe('ready');
      expect(metadata?.publicUrl).toBe(publicUrl);
      expect(metadata?.storageKey).toBe('rendered/test.html');
      expect(metadata?.sizeBytes).toBe(1024);
      expect(metadata?.renderedAt).toBeGreaterThan(0);
    });

    it('should track rendering status', async () => {
      const url = 'https://example.com/rendering-test';
      const normalizedUrl = normalizeUrl(url);
      const metadataKey = getMetadataCacheKey(normalizedUrl);
      const publicUrl = getCdnUrlSync(url, testProjectId);

      // Set as rendering
      await cacheMetadata.setRendering(metadataKey, 'rendered/rendering.html', publicUrl);

      // Check status
      const metadata = await cacheMetadata.get(metadataKey);

      expect(metadata?.status).toBe('rendering');
      expect(metadata?.sizeBytes).toBe(0);

      // Cleanup
      await cacheMetadata.del(metadataKey);
    });

    it('should track failed status', async () => {
      const url = 'https://example.com/failed-test';
      const normalizedUrl = normalizeUrl(url);
      const metadataKey = getMetadataCacheKey(normalizedUrl);
      const publicUrl = getCdnUrlSync(url, testProjectId);

      // Set as rendering first
      await cacheMetadata.setRendering(metadataKey, 'rendered/failed.html', publicUrl);

      // Mark as failed
      await cacheMetadata.setFailed(metadataKey, 'Test error message');

      // Check status
      const metadata = await cacheMetadata.get(metadataKey);

      expect(metadata?.status).toBe('failed');
      expect(metadata?.errorMessage).toBe('Test error message');

      // Cleanup
      await cacheMetadata.del(metadataKey);
    });

    it('should update status', async () => {
      const url = 'https://example.com/status-update-test';
      const normalizedUrl = normalizeUrl(url);
      const metadataKey = getMetadataCacheKey(normalizedUrl);
      const publicUrl = getCdnUrlSync(url, testProjectId);

      // Set as rendering
      await cacheMetadata.setRendering(metadataKey, 'rendered/update.html', publicUrl);

      // Update to ready
      const updated = await cacheMetadata.updateStatus(metadataKey, 'ready', { sizeBytes: 2048 });

      expect(updated).toBe(true);

      // Verify update
      const metadata = await cacheMetadata.get(metadataKey);

      expect(metadata?.status).toBe('ready');
      expect(metadata?.sizeBytes).toBe(2048);

      // Cleanup
      await cacheMetadata.del(metadataKey);
    });

    it('should return false when updating non-existent key', async () => {
      const updated = await cacheMetadata.updateStatus('non-existent-key', 'ready');

      expect(updated).toBe(false);
    });

    it('should delete cache metadata', async () => {
      const url = 'https://example.com/delete-test';
      const normalizedUrl = normalizeUrl(url);
      const metadataKey = getMetadataCacheKey(normalizedUrl);
      const publicUrl = getCdnUrlSync(url, testProjectId);

      // Create
      await cacheMetadata.setReady(metadataKey, publicUrl, 'rendered/delete.html', 512);

      // Verify exists
      let exists = await cacheMetadata.exists(metadataKey);

      expect(exists).toBe(true);

      // Delete
      await cacheMetadata.del(metadataKey);

      // Verify deleted
      exists = await cacheMetadata.exists(metadataKey);

      expect(exists).toBe(false);
    });

    it('should return null for non-existent metadata', async () => {
      const metadata = await cacheMetadata.get('non-existent-metadata-key');

      expect(metadata).toBeNull();
    });
  });
});
