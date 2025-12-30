import type { NextRequest, NextResponse } from 'next/server';

import { forbidden, serverError, unauthorized } from './api-response-helpers';
import { logger } from './Logger';

/**
 * API Error Handler Wrapper
 *
 * Eliminates try-catch repetition by wrapping route handlers with
 * centralized error handling logic.
 */

type RouteHandler = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse>;

/**
 * Wrap an API route handler with error handling
 *
 * @param handler - The route handler function
 * @returns Wrapped handler with error handling
 *
 * @example
 * export const POST = withErrorHandler(async (request: NextRequest) => {
 *   // Your logic here - throws will be caught automatically
 *   const data = await doSomething();
 *   return success(data);
 * });
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      // Handle known error types
      if (error instanceof Error) {
        const message = error.message;

        // Authentication errors
        if (message === 'Unauthorized' || message.includes('Authentication required')) {
          return unauthorized(message);
        }

        // Authorization errors
        if (message.includes('Forbidden') || message.includes('permission')) {
          return forbidden(message);
        }

        // Log unexpected errors
        logger.error({
          msg: '[API Error]',
          path: request.nextUrl.pathname,
          method: request.method,
          error: message,
          stack: error.stack,
        });
      } else {
        logger.error({
          msg: '[API Error] Unknown error type',
          error,
        });
      }

      // Return generic server error
      return serverError(error);
    }
  };
}

/**
 * Custom error classes for specific scenarios
 */

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}
