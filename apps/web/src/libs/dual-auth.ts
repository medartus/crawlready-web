import { auth } from '@clerk/nextjs/server';
import { apiKeyQueries } from '@crawlready/database';
import type { NextRequest } from 'next/server';

import { extractApiKey } from './api-key-utils';
import { db } from './DB';

/**
 * Dual Authentication System
 *
 * Supports both API key authentication (for external integrations)
 * and Clerk session authentication (for dashboard/browser usage).
 */

export type AuthContext = {
  userId: string;
  orgId: string | null;
  authMethod: 'api_key' | 'clerk_session';
  apiKeyId?: string;
  tier: 'free' | 'pro' | 'enterprise';
  customerEmail?: string;
};

/**
 * Authenticate a request using either API key or Clerk session
 *
 * Priority order:
 * 1. Check for API key in Authorization header
 * 2. Fall back to Clerk session
 *
 * @param request - NextRequest object
 * @returns AuthContext or null if not authenticated
 */
export async function authenticateRequest(
  request: NextRequest,
): Promise<AuthContext | null> {
  // Try API key authentication first
  const authHeader = request.headers.get('authorization');
  const apiKey = extractApiKey(authHeader);

  if (apiKey) {
    try {
      const customer = await apiKeyQueries.findByKey(db, apiKey);

      if (customer && customer.isActive) {
        return {
          userId: customer.userId,
          orgId: customer.orgId,
          authMethod: 'api_key',
          apiKeyId: customer.id,
          tier: customer.tier as 'free' | 'pro' | 'enterprise',
          customerEmail: customer.customerEmail,
        };
      }
    } catch (error) {
      // API key lookup failed, fall through to Clerk auth
      console.error('[Dual Auth] API key lookup error:', error);
    }
  }

  // Fall back to Clerk session authentication
  try {
    const clerkContext = await auth();

    if (clerkContext.userId) {
      return {
        userId: clerkContext.userId,
        orgId: clerkContext.orgId || null,
        authMethod: 'clerk_session',
        tier: 'free', // Default tier for Clerk users (can be enhanced with user metadata)
      };
    }
  } catch (error) {
    // Clerk auth failed
    console.error('[Dual Auth] Clerk auth error:', error);
  }

  // No authentication method succeeded
  return null;
}

/**
 * Authenticate using API key only (stricter check)
 * Used when API key authentication is explicitly required
 *
 * @param request - NextRequest object
 * @returns AuthContext or null
 */
export async function authenticateWithApiKey(
  request: NextRequest,
): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  const apiKey = extractApiKey(authHeader);

  if (!apiKey) {
    return null;
  }

  try {
    const customer = await apiKeyQueries.findByKey(db, apiKey);

    if (customer && customer.isActive) {
      return {
        userId: customer.userId,
        orgId: customer.orgId,
        authMethod: 'api_key',
        apiKeyId: customer.id,
        tier: customer.tier as 'free' | 'pro' | 'enterprise',
        customerEmail: customer.customerEmail,
      };
    }
  } catch (error) {
    console.error('[Dual Auth] API key authentication error:', error);
  }

  return null;
}

/**
 * Authenticate using Clerk session only
 * Used for dashboard-only endpoints
 *
 * @returns AuthContext or null
 */
export async function authenticateWithClerk(): Promise<AuthContext | null> {
  try {
    const clerkContext = await auth();

    if (clerkContext.userId) {
      return {
        userId: clerkContext.userId,
        orgId: clerkContext.orgId || null,
        authMethod: 'clerk_session',
        tier: 'free', // Default tier (enhance with user metadata if needed)
      };
    }
  } catch (error) {
    console.error('[Dual Auth] Clerk authentication error:', error);
  }

  return null;
}

/**
 * Check if request is authenticated (either method)
 *
 * @param request - NextRequest object
 * @returns boolean
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const authContext = await authenticateRequest(request);
  return authContext !== null;
}

/**
 * Get auth method identifier for logging/analytics
 *
 * @param authContext - AuthContext object
 * @returns Human-readable auth method string
 */
export function getAuthMethodLabel(authContext: AuthContext): string {
  if (authContext.authMethod === 'api_key') {
    return `API Key (${authContext.apiKeyId?.substring(0, 8)}...)`;
  }
  return `Clerk Session (${authContext.userId.substring(0, 8)}...)`;
}
