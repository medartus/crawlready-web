// NOTE: This is a temporary copy from src/libs/logger.ts
// TODO: Move to shared package when implementing monorepo (see documentation/architecture/monorepo-refactor-plan.md)

import pino from 'pino';

/**
 * Centralized logger for CrawlReady Worker
 * Uses pino for structured logging with performance
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
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
