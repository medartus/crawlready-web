/**
 * API Key Generation and Verification Utilities
 */

import crypto from 'node:crypto';

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
 */
export function generateApiKey(tier: 'free' | 'pro' | 'enterprise'): ApiKeyResult {
  const random = crypto.randomBytes(24);
  const keyType = tier === 'free' ? 'test' : 'live';
  const key = `sk_${keyType}_${random.toString('base64url')}`;
  const hash = hashApiKey(key);
  const prefix = `${key.slice(0, 15)}...`;

  return { key, hash, prefix };
}

/**
 * Hash API key with SHA-256
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key against stored hash (timing-safe)
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
    return false;
  }
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  const pattern = /^sk_(?:live|test)_[\w-]{32}$/;
  return pattern.test(key);
}

/**
 * Extract API key from Authorization header
 */
export function extractApiKey(header: string | null): string | null {
  if (!header) {
    return null;
  }

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
