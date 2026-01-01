import pino from 'pino';

/**
 * Centralized logger for CrawlReady
 * Uses pino for structured logging with performance
 *
 * Note: Simplified for Next.js - no pino-pretty transport to avoid worker thread issues
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // No transport in development - write directly to stdout (faster, more stable)
  // This avoids worker thread crashes in Next.js webpack environment
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

/**
 * Create a child logger with context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
