/**
 * URL Normalization and Cache Key Utilities
 *
 * CDN-First Architecture:
 * - Redis stores metadata only (not HTML)
 * - HTML served directly from Supabase Storage public URLs
 * - Deterministic URL hashing enables fail-safe CDN access
 */

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'msclkid',
  '_ga',
  '_gid',
  '_gac',
  'mc_cid',
  'mc_eid',
  'ref',
  'source',
];

/**
 * Normalize URL for consistent cache key generation
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove trailing slashes from pathname (including root /)
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    const params = new URLSearchParams(parsed.search);
    const filteredParams = new URLSearchParams();

    for (const [key, value] of params.entries()) {
      if (!TRACKING_PARAMS.includes(key.toLowerCase())) {
        filteredParams.append(key, value);
      }
    }

    filteredParams.sort();
    parsed.search = filteredParams.toString();
    parsed.hash = '';

    // Build the URL string, removing trailing slash for root paths
    let result = parsed.toString();
    // If the URL ends with just a trailing slash (root path), remove it
    if (result.endsWith('/') && !result.endsWith('://')) {
      result = result.slice(0, -1);
    }

    return result;
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate cache key from normalized URL
 * @deprecated Use getMetadataCacheKey for CDN-first architecture
 */
export function getCacheKey(url: string): string {
  const normalized = normalizeUrl(url);
  return `render:v1:${normalized}`;
}

/**
 * Generate metadata cache key from normalized URL
 * Used for CDN-first architecture where Redis stores metadata only
 */
export function getMetadataCacheKey(url: string): string {
  const normalized = normalizeUrl(url);
  return `render:meta:v1:${normalized}`;
}

/**
 * Hash length for storage keys
 * 32 chars = 128 bits = virtually no collision risk (birthday problem: ~2^64 URLs before 50% collision)
 * 16 chars = 64 bits = safe for <10M URLs
 */
const HASH_LENGTH = 32; // Increased from 16 to 32 for production safety

/**
 * Hash URL for storage key generation
 */
export async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, HASH_LENGTH);
}

/**
 * Generate storage key for Supabase Storage
 */
export async function getStorageKey(url: string): Promise<string> {
  const normalized = normalizeUrl(url);
  const hash = await hashUrl(normalized);
  return `rendered/${hash}.html`;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate deterministic CDN public URL from page URL
 *
 * This enables fail-safe CDN access: customer middleware can compute
 * the public URL directly without calling CrawlReady API
 *
 * @param pageUrl - The original page URL
 * @param supabaseProjectId - Supabase project ID (from SUPABASE_URL)
 * @param bucket - Storage bucket name (default: 'rendered-pages')
 * @returns Public CDN URL for the rendered page
 */
export async function getCdnUrl(
  pageUrl: string,
  supabaseProjectId: string,
  bucket = 'rendered-pages',
): Promise<string> {
  const normalized = normalizeUrl(pageUrl);
  const hash = await hashUrl(normalized);
  return `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/${bucket}/${hash}.html`;
}

/**
 * Synchronous version of getCdnUrl using Node.js crypto
 * Use this in server-side code where crypto.subtle is not needed
 */
export function getCdnUrlSync(
  pageUrl: string,
  supabaseProjectId: string,
  bucket = 'rendered-pages',
): string {
  const normalized = normalizeUrl(pageUrl);
  const hash = hashUrlSync(normalized);
  return `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/${bucket}/${hash}.html`;
}

/**
 * Synchronous URL hashing using Node.js crypto module
 */
export function hashUrlSync(url: string): string {
  // Use dynamic import pattern that works with bundlers
  // eslint-disable-next-line ts/no-require-imports
  const nodeCrypto = require('node:crypto') as typeof import('node:crypto');
  return nodeCrypto.createHash('sha256').update(url).digest('hex').slice(0, HASH_LENGTH);
}

/**
 * Extract Supabase project ID from SUPABASE_URL
 * @param supabaseUrl - Full Supabase URL (e.g., https://abcdefgh.supabase.co)
 * @returns Project ID (e.g., 'abcdefgh')
 */
export function extractSupabaseProjectId(supabaseUrl: string): string {
  try {
    const url = new URL(supabaseUrl);
    // Format: {project-id}.supabase.co
    const hostname = url.hostname;
    const projectId = hostname.split('.')[0];
    if (!projectId) {
      throw new Error('Invalid Supabase URL format');
    }
    return projectId;
  } catch {
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
  }
}
