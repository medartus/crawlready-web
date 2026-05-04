/**
 * Correlation ID utilities for request tracing.
 *
 * Every API request gets a unique correlation ID propagated through logs.
 * If the client sends X-Correlation-Id, the server reuses it.
 *
 * See docs/architecture/diagrams-infrastructure.md §Correlation ID Flow
 */

const HEADER_NAME = 'x-correlation-id';

/**
 * Get or generate a correlation ID from a request.
 * Reuses the client-provided header if present, otherwise generates a UUID v4.
 */
export function getCorrelationId(request: Request): string {
  const existing = request.headers.get(HEADER_NAME);
  if (existing && existing.length > 0 && existing.length <= 128) {
    return existing;
  }

  return crypto.randomUUID();
}

export { HEADER_NAME as CORRELATION_HEADER };
