/**
 * Supabase Storage Service Client
 *
 * CDN-First Architecture:
 * - Rendered HTML stored in public Supabase bucket
 * - Serves directly from Supabase CDN (no API call needed)
 * - Deterministic public URLs based on URL hash
 *
 * Public URL Format:
 * https://{project}.supabase.co/storage/v1/object/public/{bucket}/{hash}.html
 */

import crypto from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let storageClient: SupabaseClient | null = null;

/**
 * Get Supabase storage client (singleton)
 */
export function getStorageClient(): SupabaseClient {
  if (!storageClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error(
        'Supabase storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
      );
    }

    storageClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return storageClient;
}

/**
 * Hash length for storage keys (must match @crawlready/cache)
 * 32 chars = 128 bits = virtually no collision risk
 */
const HASH_LENGTH = 32;

/**
 * Generate consistent storage key from normalized URL
 */
export function getStorageKey(normalizedUrl: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(normalizedUrl)
    .digest('hex')
    .substring(0, HASH_LENGTH);

  return `rendered/${hash}.html`;
}

/**
 * Upload rendered HTML to Supabase Storage
 */
export async function uploadRenderedPage(
  storageKey: string,
  html: string,
): Promise<{ success: boolean; storageKey: string; error?: string }> {
  try {
    const client = getStorageClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'rendered-pages';

    const { error } = await client.storage
      .from(bucket)
      .upload(storageKey, html, {
        contentType: 'text/html',
        upsert: true,
      });

    if (error) {
      return {
        success: false,
        storageKey,
        error: error.message,
      };
    }

    return {
      success: true,
      storageKey,
    };
  } catch (error) {
    return {
      success: false,
      storageKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download rendered HTML from Supabase Storage
 */
export async function downloadRenderedPage(
  storageKey: string,
): Promise<{ html: string | null; error?: string }> {
  try {
    const client = getStorageClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'rendered-pages';

    const { data, error } = await client.storage
      .from(bucket)
      .download(storageKey);

    if (error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return { html: null };
      }

      return {
        html: null,
        error: error.message,
      };
    }

    if (!data) {
      return { html: null };
    }

    const html = await data.text();
    return { html };
  } catch (error) {
    return {
      html: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.SUPABASE_URL
    && process.env.SUPABASE_SERVICE_KEY
    && process.env.SUPABASE_STORAGE_BUCKET
  );
}

/**
 * Delete rendered page from storage
 */
export async function deleteRenderedPage(
  storageKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getStorageClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'rendered-pages';

    const { error } = await client.storage.from(bucket).remove([storageKey]);

    if (error) {
      return {
        success: false,
        error: `${error.message} (key: ${storageKey})`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Supabase project ID from environment
 */
export function getSupabaseProjectId(): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }

  const url = new URL(supabaseUrl);
  // Format: {project-id}.supabase.co
  const projectId = url.hostname.split('.')[0];
  if (!projectId) {
    throw new Error('Invalid SUPABASE_URL format');
  }
  return projectId;
}

/**
 * Generate public CDN URL for a storage key
 *
 * This URL can be accessed directly without authentication
 * (requires bucket to have public access enabled)
 *
 * @param storageKey - Storage key (e.g., 'rendered/abc123.html')
 * @returns Public CDN URL
 */
export function getPublicUrl(storageKey: string): string {
  const projectId = getSupabaseProjectId();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'rendered-pages';

  // Remove 'rendered/' prefix if present (it's part of the path in the bucket)
  const path = storageKey.startsWith('rendered/')
    ? storageKey.substring('rendered/'.length)
    : storageKey;

  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Generate public CDN URL from normalized URL
 *
 * Combines URL normalization + hashing + public URL generation
 *
 * @param normalizedUrl - Already normalized URL
 * @returns Public CDN URL for the rendered page
 */
export function getPublicUrlFromNormalizedUrl(normalizedUrl: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(normalizedUrl)
    .digest('hex')
    .substring(0, HASH_LENGTH);

  const projectId = getSupabaseProjectId();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'rendered-pages';

  return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${hash}.html`;
}

/**
 * Check if a public URL exists (HEAD request)
 *
 * Use this for cache hit detection without downloading full content
 *
 * @param publicUrl - Public CDN URL to check
 * @param timeoutMs - Timeout in milliseconds (default: 500ms for fail-fast)
 * @returns true if exists, false otherwise
 */
export async function checkPublicUrlExists(
  publicUrl: string,
  timeoutMs = 500,
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(publicUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    // Timeout or network error - treat as cache miss
    return false;
  }
}
