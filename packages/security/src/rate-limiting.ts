/**
 * Centralized Rate Limiting Helper
 *
 * Note: This module requires @crawlready/cache for rate limit checks.
 * Import cache from @crawlready/cache and pass to these functions.
 */

/**
 * Get rate limit based on tier
 */
export function getTierLimit(tier: 'free' | 'pro' | 'enterprise' | undefined): number {
  switch (tier) {
    case 'free':
      return 100;
    case 'pro':
      return 1000;
    case 'enterprise':
      return 999999;
    default:
      return 100;
  }
}

/**
 * Generate rate limit key for API key
 */
export function getApiKeyRateLimitKey(apiKeyId: string, action: string = 'default'): string {
  return `ratelimit:${action}:apikey:${apiKeyId}`;
}

/**
 * Generate rate limit key for user
 */
export function getUserRateLimitKey(userId: string, action: string = 'default'): string {
  return `ratelimit:${action}:user:${userId}`;
}

/**
 * Generate rate limit key for admin
 */
export function getAdminRateLimitKey(userId: string, action: string = 'admin-api'): string {
  return `ratelimit:${action}:admin:${userId}`;
}
