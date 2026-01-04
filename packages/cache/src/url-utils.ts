/**
 * URL Normalization and Cache Key Utilities
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

    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate cache key from normalized URL
 */
export function getCacheKey(url: string): string {
  const normalized = normalizeUrl(url);
  return `render:v1:${normalized}`;
}

/**
 * Hash URL for storage key generation
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
