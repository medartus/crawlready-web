/**
 * Supabase Storage Service Client
 *
 * Service-level client for Supabase Storage operations.
 * Uses service role key for background worker access.
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
 * Generate consistent storage key from normalized URL
 */
export function getStorageKey(normalizedUrl: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(normalizedUrl)
    .digest('hex')
    .substring(0, 16);

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
