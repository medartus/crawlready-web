/**
 * URL Normalization and Cache Key Utilities
 *
 * Provides consistent URL normalization to ensure cache hits
 * and prevent duplicate renders for semantically identical URLs.
 */

/**
 * Tracking parameters that should be ignored when normalizing URLs
 * These parameters don't affect page content
 */
const TRACKING_PARAMS = [
  // Google Analytics
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  // Social media tracking
  'fbclid',
  'gclid',
  'msclkid',
  // Analytics tracking
  '_ga',
  '_gid',
  '_gac',
  'mc_cid',
  'mc_eid',
  // Other common tracking
  'ref',
  'source',
];

/**
 * Normalize URL for consistent cache key generation
 *
 * Rules:
 * 1. Force HTTPS protocol
 * 2. Lowercase hostname
 * 3. Remove trailing slash (except root)
 * 4. Filter tracking query params
 * 5. Sort remaining query params
 * 6. Remove hash fragment
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // 1. Normalize protocol (always https)
    parsed.protocol = 'https:';

    // 2. Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // 3. Remove trailing slash from pathname (except root)
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // 4. Filter query params (remove tracking params)
    const params = new URLSearchParams(parsed.search);
    const filteredParams = new URLSearchParams();

    for (const [key, value] of params.entries()) {
      if (!TRACKING_PARAMS.includes(key.toLowerCase())) {
        filteredParams.append(key, value);
      }
    }

    // 5. Sort query params alphabetically
    filteredParams.sort();
    parsed.search = filteredParams.toString();

    // 6. Remove fragment (hash)
    parsed.hash = '';

    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate cache key from normalized URL
 * Format: render:v1:{normalizedUrl}
 */
export function getCacheKey(url: string): string {
  const normalized = normalizeUrl(url);
  return `render:v1:${normalized}`;
}

/**
 * Hash URL for storage key generation
 * Returns first 16 characters of SHA-256 hash
 */
export async function hashUrl(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 16);
}

/**
 * Generate storage key for Supabase Storage
 * Format: rendered/{hash}.html
 */
export async function getStorageKey(url: string): Promise<string> {
  const normalized = normalizeUrl(url);
  const hash = await hashUrl(normalized);
  return `rendered/${hash}.html`;
}

/**
 * Validate URL format
 * Basic validation before normalization
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
