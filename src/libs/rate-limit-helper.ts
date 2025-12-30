import type { AuthContext } from './dual-auth';
import { rateLimit } from './redis-client';

/**
 * Centralized Rate Limiting Helper
 *
 * Provides consistent rate limiting logic across all API endpoints,
 * with tier-based limits and proper key formatting.
 */

/**
 * Check rate limit for an authenticated request
 *
 * @param authContext - Authentication context from dual-auth
 * @param action - Action identifier for separate rate limit buckets (default: 'default')
 * @param customLimit - Optional custom limit override
 * @returns Rate limit result with allowed status and counts
 */
export async function checkRateLimit(
  authContext: AuthContext,
  action: string = 'default',
  customLimit?: number,
) {
  // Construct rate limit key based on auth method
  const key = authContext.authMethod === 'api_key'
    ? `ratelimit:${action}:apikey:${authContext.apiKeyId}`
    : `ratelimit:${action}:user:${authContext.userId}`;

  // Determine limit based on tier (unless custom limit provided)
  const limit = customLimit ?? getTierLimit(authContext.tier);

  // Check rate limit (24-hour sliding window)
  const result = await rateLimit.check(key, limit);

  return result;
}

/**
 * Get rate limit based on tier
 */
function getTierLimit(tier: 'free' | 'pro' | 'enterprise' | undefined): number {
  switch (tier) {
    case 'free':
      return 100; // 100 requests per day
    case 'pro':
      return 1000; // 1,000 requests per day
    case 'enterprise':
      return 999999; // Essentially unlimited
    default:
      return 100; // Default to free tier
  }
}

/**
 * Check rate limit for a specific user (without auth context)
 * Used for user API endpoints
 */
export async function checkUserRateLimit(
  userId: string,
  action: string = 'user-api',
  limit: number = 100,
) {
  const key = `ratelimit:${action}:user:${userId}`;
  const result = await rateLimit.check(key, limit, 60 * 1000); // 1 minute window for user APIs

  return result;
}

/**
 * Check rate limit for admin operations
 */
export async function checkAdminRateLimit(
  userId: string,
  action: string = 'admin-api',
  limit: number = 1000,
) {
  const key = `ratelimit:${action}:admin:${userId}`;
  const result = await rateLimit.check(key, limit, 60 * 1000); // 1 minute window

  return result;
}

/**
 * Get remaining rate limit for display purposes
 */
export async function getRateLimitStatus(authContext: AuthContext, action: string = 'default') {
  const key = authContext.authMethod === 'api_key'
    ? `ratelimit:${action}:apikey:${authContext.apiKeyId}`
    : `ratelimit:${action}:user:${authContext.userId}`;

  const limit = getTierLimit(authContext.tier);

  // Get current count without incrementing
  const result = await rateLimit.check(key, limit);

  return {
    limit,
    used: result.used,
    remaining: result.remaining,
    allowed: result.allowed,
  };
}
