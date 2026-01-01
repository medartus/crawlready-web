// NOTE: This is a temporary copy from src/libs/supabase-storage.ts
// TODO: Move to shared package when implementing monorepo (see documentation/architecture/monorepo-refactor-plan.md)

/**
 * Supabase Storage Service Client
 *
 * Service-level client for Supabase Storage operations.
 * Uses service role key (not Clerk tokens) for background worker access.
 *
 * This client is used by:
 * - Render worker (uploads rendered HTML)
 * - API routes (downloads from cold storage)
 */

import crypto from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Env } from './env';

let storageClient: SupabaseClient | null = null;

/**
 * Get Supabase storage client (singleton)
 * Uses service role key for admin-level access
 */
export function getStorageClient(): SupabaseClient {
  if (!storageClient) {
    const supabaseUrl = Env.SUPABASE_URL;
    const serviceKey = Env.SUPABASE_SERVICE_KEY;

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
 * Generate consistent storage key from normalized URL
 * Format: rendered/<hash>.html
 *
 * @param normalizedUrl - Normalized URL
 * @returns Storage key for Supabase Storage
 */
export function getStorageKey(normalizedUrl: string): string {
  // Use SHA-256 hash for consistent, collision-resistant keys
  const hash = crypto
    .createHash('sha256')
    .update(normalizedUrl)
    .digest('hex')
    .substring(0, 16);

  return `rendered/${hash}.html`;
}

/**
 * Upload rendered HTML to Supabase Storage
 *
 * @param storageKey - Storage key (from getStorageKey)
 * @param html - Rendered HTML content
 * @returns Success status and storage key
 */
export async function uploadRenderedPage(
  storageKey: string,
  html: string,
): Promise<{ success: boolean; storageKey: string; error?: string }> {
  try {
    const client = getStorageClient();
    const bucket = Env.SUPABASE_STORAGE_BUCKET;

    const { error } = await client.storage
      .from(bucket)
      .upload(storageKey, html, {
        contentType: 'text/html',
        upsert: true, // Overwrite if exists
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
 *
 * @param storageKey - Storage key (from getStorageKey)
 * @returns HTML content or null if not found
 */
export async function downloadRenderedPage(
  storageKey: string,
): Promise<{ html: string | null; error?: string }> {
  try {
    const client = getStorageClient();
    const bucket = Env.SUPABASE_STORAGE_BUCKET;

    const { data, error } = await client.storage
      .from(bucket)
      .download(storageKey);

    if (error) {
      // Not found is expected, don't treat as error
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
 * Useful for graceful degradation
 */
export function isStorageConfigured(): boolean {
  return !!(Env.SUPABASE_URL && Env.SUPABASE_SERVICE_KEY);
}

/**
 * Delete rendered page from storage
 * Used for cache invalidation
 *
 * @param storageKey - Storage key to delete
 * @returns Success status
 */
export async function deleteRenderedPage(
  storageKey: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getStorageClient();
    const bucket = Env.SUPABASE_STORAGE_BUCKET;

    const { error } = await client.storage.from(bucket).remove([storageKey]);

    if (error) {
      return {
        success: false,
        error: error.message,
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
