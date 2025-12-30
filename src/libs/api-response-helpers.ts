import { NextResponse } from 'next/server';

/**
 * Standardized API Response Helpers
 *
 * These functions provide consistent response formatting across all API endpoints,
 * eliminating repetition and ensuring uniform error messages.
 */

/**
 * Return 401 Unauthorized response
 */
export function unauthorized(message?: string) {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message: message || 'Authentication required',
    },
    { status: 401 },
  );
}

/**
 * Return 403 Forbidden response
 */
export function forbidden(message?: string) {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message: message || 'You don\'t have permission to access this resource',
    },
    { status: 403 },
  );
}

/**
 * Return 404 Not Found response
 */
export function notFound(message?: string) {
  return NextResponse.json(
    {
      error: 'Not found',
      message: message || 'The requested resource was not found',
    },
    { status: 404 },
  );
}

/**
 * Return 400 Bad Request response
 */
export function badRequest(message: string, details?: unknown) {
  const response: { error: string; message: string; details?: unknown } = {
    error: 'Bad request',
    message,
  };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status: 400 });
}

/**
 * Return 409 Conflict response
 */
export function conflict(message: string) {
  return NextResponse.json(
    {
      error: 'Conflict',
      message,
    },
    { status: 409 },
  );
}

/**
 * Return 429 Rate Limit Exceeded response
 */
export function rateLimitExceeded(message?: string, retryAfter?: number) {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: message || 'Too many requests. Please try again later.',
      ...(retryAfter && { retryAfter }),
    },
    { status: 429 },
  );
}

/**
 * Return 500 Internal Server Error response
 */
export function serverError(error?: unknown) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return NextResponse.json(
    {
      error: 'Internal server error',
      message,
    },
    { status: 500 },
  );
}

/**
 * Return successful response with data
 */
export function success<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Return 201 Created response with data
 */
export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

/**
 * Return 204 No Content response
 */
export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Validation error response (400) with Zod error details
 */
export function validationError(zodError: { errors: Array<{ path: (string | number)[]; message: string }> }) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: zodError.errors.map(err => ({
        field: err.path.map(String).join('.'),
        message: err.message,
      })),
    },
    { status: 400 },
  );
}
