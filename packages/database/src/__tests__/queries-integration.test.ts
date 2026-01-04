/**
 * Database Queries Integration Tests
 *
 * Tests database queries at the highest level using PGlite (in-memory Postgres)
 * to simulate real database operations without external dependencies.
 */

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { apiKeyQueries, renderedPageQueries, renderJobQueries } from '../queries';
import * as schema from '../schema';

describe('Database Queries Integration Tests', () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // Create in-memory database
    client = new PGlite();
    await client.waitReady;
    db = drizzle(client, { schema });

    // Create tables
    await client.exec(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key_hash TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        user_id TEXT,
        customer_email TEXT,
        tier TEXT NOT NULL DEFAULT 'free',
        daily_limit INTEGER NOT NULL DEFAULT 100,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS render_jobs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        normalized_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        render_duration_ms INTEGER
      );

      CREATE TABLE IF NOT EXISTS rendered_pages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        normalized_url TEXT NOT NULL UNIQUE,
        storage_key TEXT NOT NULL,
        storage_location TEXT NOT NULL DEFAULT 'hot',
        api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
        html_size_bytes INTEGER NOT NULL,
        first_rendered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        last_accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        access_count INTEGER NOT NULL DEFAULT 0,
        in_redis BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS cache_accesses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
        normalized_url TEXT NOT NULL,
        cache_location TEXT NOT NULL,
        response_time_ms INTEGER NOT NULL,
        accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
  });

  afterAll(async () => {
    await client.close();
  });

  describe('API Key Operations', () => {
    it('should find API keys by user ID', async () => {
      // Insert a test API key directly
      await client.exec(`
        INSERT INTO api_keys (key_hash, key_prefix, user_id, tier, daily_limit)
        VALUES ('test_hash_123', 'cr_test', 'user_123', 'free', 100);
      `);

      const keys = await apiKeyQueries.findByUserId(db, 'user_123');

      expect(keys).toBeDefined();
      expect(keys.length).toBeGreaterThan(0);
      expect(keys[0].userId).toBe('user_123');
    });

    it('should update last used timestamp', async () => {
      // Insert a test API key
      const result = await client.query(`
        INSERT INTO api_keys (key_hash, key_prefix, user_id, tier, daily_limit)
        VALUES ('test_hash_456', 'cr_test2', 'user_456', 'pro', 1000)
        RETURNING id;
      `);
      const apiKeyId = (result.rows[0] as any).id;

      await apiKeyQueries.updateLastUsed(db, apiKeyId);

      const updated = await client.query(`
        SELECT last_used_at FROM api_keys WHERE id = $1
      `, [apiKeyId]);

      expect((updated.rows[0] as any).last_used_at).not.toBeNull();
    });

    it('should revoke an API key', async () => {
      // Insert a test API key
      const result = await client.query(`
        INSERT INTO api_keys (key_hash, key_prefix, user_id, tier, daily_limit)
        VALUES ('test_hash_789', 'cr_test3', 'user_789', 'free', 100)
        RETURNING id;
      `);
      const apiKeyId = (result.rows[0] as any).id;
      const userId = 'user_789';

      await apiKeyQueries.revoke(db, apiKeyId, userId);

      const revoked = await client.query(`
        SELECT is_active FROM api_keys WHERE id = $1
      `, [apiKeyId]);

      expect((revoked.rows[0] as any).is_active).toBe(false);
    });
  });

  describe('Render Job Operations', () => {
    let testApiKeyId: string;

    beforeAll(async () => {
      const result = await client.query(`
        INSERT INTO api_keys (key_hash, key_prefix, user_id, tier, daily_limit)
        VALUES ('render_job_key', 'cr_rj', 'user_rj', 'free', 100)
        RETURNING id;
      `);
      testApiKeyId = (result.rows[0] as any).id;
    });

    it('should create a render job', async () => {
      const job = await renderJobQueries.create(db, {
        apiKeyId: testApiKeyId,
        url: 'https://example.com/test',
        normalizedUrl: 'https://example.com/test',
        status: 'queued',
      });

      expect(job).toBeDefined();
      expect(job.status).toBe('queued');
      expect(job.url).toBe('https://example.com/test');
      expect(job.apiKeyId).toBe(testApiKeyId);
    });

    it('should find in-progress jobs by URL', async () => {
      await renderJobQueries.create(db, {
        apiKeyId: testApiKeyId,
        url: 'https://example.com/in-progress',
        normalizedUrl: 'https://example.com/in-progress',
        status: 'processing',
      });

      const found = await renderJobQueries.findInProgressByUrl(
        db,
        'https://example.com/in-progress',
      );

      expect(found).toBeDefined();
      expect(found?.status).toBe('processing');
    });

    it('should update job status', async () => {
      const job = await renderJobQueries.create(db, {
        apiKeyId: testApiKeyId,
        url: 'https://example.com/status-test',
        normalizedUrl: 'https://example.com/status-test',
        status: 'queued',
      });

      await renderJobQueries.updateStatus(db, job.id, 'completed', {
        htmlSizeBytes: 5000,
        renderDurationMs: 1500,
      });

      const updated = await renderJobQueries.findById(db, job.id);

      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should handle job failures', async () => {
      const job = await renderJobQueries.create(db, {
        apiKeyId: testApiKeyId,
        url: 'https://example.com/fail-test',
        normalizedUrl: 'https://example.com/fail-test',
        status: 'queued',
      });

      await renderJobQueries.updateStatus(db, job.id, 'failed', {
        errorMessage: 'Timeout error',
      });

      const failed = await renderJobQueries.findById(db, job.id);

      expect(failed?.status).toBe('failed');
      expect(failed?.errorMessage).toBe('Timeout error');
    });
  });

  describe('Rendered Page Operations', () => {
    let testApiKeyId: string;

    beforeAll(async () => {
      const result = await client.query(`
        INSERT INTO api_keys (key_hash, key_prefix, user_id, tier, daily_limit)
        VALUES ('rendered_page_key', 'cr_rp', 'user_rp', 'free', 100)
        RETURNING id;
      `);
      testApiKeyId = (result.rows[0] as any).id;
    });

    it('should upsert a rendered page', async () => {
      await renderedPageQueries.upsert(db, {
        normalizedUrl: 'https://example.com/page1',
        storageKey: 'pages/page1.html',
        htmlSizeBytes: 10000,
        apiKeyId: testApiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true,
        accessCount: 0,
      });

      const page = await renderedPageQueries.findByUrl(db, 'https://example.com/page1');

      expect(page).toBeDefined();
      expect(page?.normalizedUrl).toBe('https://example.com/page1');
      expect(page?.htmlSizeBytes).toBe(10000);
      expect(page?.inRedis).toBe(true);
    });

    it('should find page by URL', async () => {
      await renderedPageQueries.upsert(db, {
        normalizedUrl: 'https://example.com/page2',
        storageKey: 'pages/page2.html',
        htmlSizeBytes: 8000,
        apiKeyId: testApiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true,
        accessCount: 0,
      });

      const found = await renderedPageQueries.findByUrl(
        db,
        'https://example.com/page2',
      );

      expect(found).toBeDefined();
      expect(found?.normalizedUrl).toBe('https://example.com/page2');
      expect(found?.htmlSizeBytes).toBe(8000);
    });

    it('should increment access count', async () => {
      await renderedPageQueries.upsert(db, {
        normalizedUrl: 'https://example.com/page3',
        storageKey: 'pages/page3.html',
        htmlSizeBytes: 12000,
        apiKeyId: testApiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true,
        accessCount: 0,
      });

      const initial = await renderedPageQueries.findByUrl(db, 'https://example.com/page3');
      const initialAccessCount = initial?.accessCount || 0;

      await renderedPageQueries.incrementAccess(db, 'https://example.com/page3');

      const updated = await renderedPageQueries.findByUrl(db, 'https://example.com/page3');

      expect(updated?.accessCount).toBe(initialAccessCount + 1);
    });

    it('should delete a rendered page', async () => {
      await renderedPageQueries.upsert(db, {
        normalizedUrl: 'https://example.com/page-to-delete',
        storageKey: 'pages/delete.html',
        htmlSizeBytes: 5000,
        apiKeyId: testApiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true,
        accessCount: 0,
      });

      let found = await renderedPageQueries.findByUrl(
        db,
        'https://example.com/page-to-delete',
      );

      expect(found).toBeDefined();

      await renderedPageQueries.delete(db, 'https://example.com/page-to-delete');

      found = await renderedPageQueries.findByUrl(
        db,
        'https://example.com/page-to-delete',
      );

      expect(found).toBeUndefined();
    });
  });

  describe('Real-world Workflow Tests', () => {
    it('should handle complete render workflow', async () => {
      // 1. Create API key
      const result = await client.query(`
        INSERT INTO api_keys (key_hash, key_prefix, user_id, tier, daily_limit)
        VALUES ('workflow_key', 'cr_wf', 'user_workflow', 'pro', 1000)
        RETURNING id;
      `);
      const apiKeyId = (result.rows[0] as any).id;

      // 2. Create render job
      const job = await renderJobQueries.create(db, {
        apiKeyId,
        url: 'https://example.com/workflow',
        normalizedUrl: 'https://example.com/workflow',
        status: 'queued',
      });

      // 3. Update job to processing
      await renderJobQueries.updateStatus(db, job.id, 'processing', {});

      // 4. Complete job and create rendered page
      await renderJobQueries.updateStatus(db, job.id, 'completed', {
        htmlSizeBytes: 15000,
        renderDurationMs: 2000,
      });

      await renderedPageQueries.upsert(db, {
        normalizedUrl: 'https://example.com/workflow',
        storageKey: 'pages/workflow.html',
        htmlSizeBytes: 15000,
        apiKeyId,
        firstRenderedAt: new Date(),
        inRedis: true,
        accessCount: 0,
      });

      // 5. Verify everything
      const finalJob = await renderJobQueries.findById(db, job.id);
      const page = await renderedPageQueries.findByUrl(db, 'https://example.com/workflow');

      expect(finalJob?.status).toBe('completed');
      expect(page?.normalizedUrl).toBe('https://example.com/workflow');
      expect(page?.htmlSizeBytes).toBe(15000);
    });
  });
});
