/**
 * Shared API utilities for route handlers.
 *
 * - Error envelope per api-first.md
 * - Client IP extraction
 * - Rate-limit response headers
 */

import { NextResponse } from 'next/server';

import type { RateLimitResult } from './rate-limit';

/**
 * Build a JSON error response matching the api-first.md error contract:
 *   { "error": { "code": "...", "message": "...", ... } }
 */
export function apiError(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status },
  );
}

/**
 * Build a 429 rate-limit response with proper headers per api-first.md:
 *   Retry-After (seconds), X-RateLimit-Remaining
 */
export function rateLimitError(limit: RateLimitResult): NextResponse {
  const res = apiError(
    'RATE_LIMITED',
    'Too many requests. Please try again later.',
    429,
    { retry_after: limit.retryAfterSeconds },
  );
  if (limit.retryAfterSeconds !== null) {
    res.headers.set('Retry-After', String(limit.retryAfterSeconds));
  }
  res.headers.set('X-RateLimit-Remaining', String(limit.remaining));
  return res;
}

/**
 * Extract client IP from request headers (X-Forwarded-For or fallback).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  return '127.0.0.1';
}
