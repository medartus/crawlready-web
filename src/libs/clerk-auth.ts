import { auth } from '@clerk/nextjs/server';

import { AuthorizationError } from './api-error-handler';

/**
 * Clerk Authentication Utilities
 *
 * Helpers for Clerk-based authentication and authorization,
 * including admin role verification and user context extraction.
 */

export type ClerkUserContext = {
  userId: string;
  orgId: string | null;
  orgRole?: string;
};

/**
 * Require admin role for the current request
 * Throws AuthorizationError if user is not an admin
 *
 * @returns User context with admin role verified
 * @throws AuthorizationError if not authenticated or not admin
 */
export async function requireAdminRole(): Promise<ClerkUserContext> {
  const authResult = await auth();

  if (!authResult.userId) {
    throw new Error('Unauthorized');
  }

  // Check if user has admin role in their organization
  if (authResult.orgRole !== 'org:admin') {
    throw new AuthorizationError('Admin role required. Please contact your organization administrator.');
  }

  return {
    userId: authResult.userId,
    orgId: authResult.orgId || null,
    orgRole: authResult.orgRole,
  };
}

/**
 * Get current Clerk user context (if authenticated)
 * Returns null if not authenticated
 *
 * @returns User context or null
 */
export async function getClerkUserContext(): Promise<ClerkUserContext | null> {
  const authResult = await auth();

  if (!authResult.userId) {
    return null;
  }

  return {
    userId: authResult.userId,
    orgId: authResult.orgId || null,
    orgRole: authResult.orgRole,
  };
}

/**
 * Require authenticated Clerk user (any role)
 * Throws error if not authenticated
 *
 * @returns User context
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<ClerkUserContext> {
  const authResult = await auth();

  if (!authResult.userId) {
    throw new Error('Unauthorized');
  }

  return {
    userId: authResult.userId,
    orgId: authResult.orgId || null,
    orgRole: authResult.orgRole,
  };
}

/**
 * Check if current user has a specific role
 *
 * @param requiredRole - The role to check for
 * @returns True if user has the role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const authResult = await auth();

  if (!authResult.userId) {
    return false;
  }

  return authResult.orgRole === requiredRole;
}

/**
 * Get user's organization membership details
 *
 * @returns Organization details or null if not in an org
 */
export async function getOrgContext() {
  const authResult = await auth();

  if (!authResult.userId || !authResult.orgId) {
    return null;
  }

  return {
    orgId: authResult.orgId,
    orgRole: authResult.orgRole,
    orgSlug: authResult.orgSlug,
  };
}
