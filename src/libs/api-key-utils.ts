/**
 * API Key Generation and Verification Utilities
 *
 * Provides secure API key generation, hashing, and verification.
 */

import crypto from 'node:crypto';

/**
 * API key format: sk_{live|test}_{32_base64url_chars}
 * Example: sk_live_abc123def456...
 */
export type ApiKeyResult = {
  /** Full API key (show once, never store) */
  key: string;
  /** SHA-256 hash (store in database) */
  hash: string;
  /** Display prefix (e.g., "sk_live_abc123...") */
  prefix: string;
};

/**
 * Generate a new API key
 *
 * @param tier - 'free', 'pro', or 'enterprise'
 * @returns API key, hash, and display prefix
 */
export function generateApiKey(tier: 'free' | 'pro' | 'enterprise'): ApiKeyResult {
  // Generate 192 bits (24 bytes) of randomness
  const random = crypto.randomBytes(24);

  // Determine key type based on tier
  const keyType = tier === 'free' ? 'test' : 'live';

  // Create key: sk_{type}_{base64url}
  const key = `sk_${keyType}_${random.toString('base64url')}`;

  // Hash key with SHA-256
  const hash = hashApiKey(key);

  // Create display prefix
  const prefix = `${key.slice(0, 15)}...`;

  return { key, hash, prefix };
}

/**
 * Hash API key with SHA-256
 *
 * @param key - The API key to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key against stored hash (timing-safe)
 *
 * @param providedKey - API key provided by client
 * @param storedHash - SHA-256 hash stored in database
 * @returns True if key matches hash
 */
export function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const computedHash = hashApiKey(providedKey);
  // eslint-disable-next-line ts/no-require-imports
  const { Buffer: NodeBuffer } = require('node:buffer');

  try {
    return crypto.timingSafeEqual(
      NodeBuffer.from(computedHash, 'hex'),
      NodeBuffer.from(storedHash, 'hex'),
    );
  } catch {
    // If hashes are different lengths, timingSafeEqual throws
    return false;
  }
}

/**
 * Validate API key format (without checking database)
 *
 * @param key - API key to validate
 * @returns True if format is valid
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Pattern: sk_(live|test)_[32 base64url chars]
  const pattern = /^sk_(?:live|test)_[\w-]{32}$/;
  return pattern.test(key);
}

/**
 * Extract API key from Authorization header
 *
 * @param header - Authorization header value
 * @returns API key or null if invalid
 */
export function extractApiKey(header: string | null): string | null {
  if (!header) {
    return null;
  }

  // Expected format: "Bearer sk_live_..."
  const match = header.match(/^Bearer\s+(sk_(?:live|test)_[\w-]{32})$/);

  if (!match || !match[1]) {
    return null;
  }

  const key = match[1];

  if (!isValidApiKeyFormat(key)) {
    return null;
  }

  return key;
}
