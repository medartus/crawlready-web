import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from './libs/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Helper function to check if a path is an API route
const isApiRoute = (pathname: string) => {
  return pathname.startsWith('/api/');
};

// Public API routes that don't require authentication (allowlist)
// All other /api/* routes are protected by default
const publicApiRoutes = [
  '/api/check-crawler',
  '/api/check-schema',
  '/api/waitlist',
  '/api/waitlist/count',
  '/api/render', // Handles dual auth internally
  '/api/status', // Handles dual auth internally
  '/api/cache', // Handles dual auth internally
];

// Protected page routes that require authentication
const isProtectedPageRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
]);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const { pathname } = request.nextUrl;

  // 1. Allow public API routes immediately (no auth required)
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. Protect ALL other API routes by default (secure by default)
  // Supports both cookie-based auth (browser) and Bearer token (programmatic)
  if (isApiRoute(pathname)) {
    return clerkMiddleware(async (auth) => {
      // Require authentication for all non-public API routes
      await auth.protect();

      // Skip intl middleware for API routes (they don't need localization)
      return NextResponse.next();
    })(request, event);
  }

  // 3. Handle protected page routes (dashboard, onboarding)
  if (isProtectedPageRoute(request)) {
    return clerkMiddleware(async (auth, req) => {
      const locale
          = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

      const signInUrl = new URL(`${locale}/sign-in`, req.url);

      // Require authentication
      await auth.protect({
        // `unauthenticatedUrl` is needed to avoid error: "Unable to find `next-intl` locale because the middleware didn't run on this request"
        unauthenticatedUrl: signInUrl.toString(),
      });

      const authObj = await auth();

      // Redirect to org selection if user doesn't have an org
      if (
        authObj.userId
        && !authObj.orgId
        && req.nextUrl.pathname.includes('/dashboard')
        && !req.nextUrl.pathname.endsWith('/organization-selection')
      ) {
        const orgSelection = new URL(
          '/onboarding/organization-selection',
          req.url,
        );

        return NextResponse.redirect(orgSelection);
      }

      return intlMiddleware(req);
    })(request, event);
  }

  // 4. Handle sign-in/sign-up pages (apply Clerk middleware for auth flows)
  if (pathname.includes('/sign-in') || pathname.includes('/sign-up')) {
    return clerkMiddleware(async (_auth, req) => {
      return intlMiddleware(req);
    })(request, event);
  }

  // 5. Default: public pages with intl support
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'], // Also exclude tunnelRoute used in Sentry from the matcher
};
