import pino from 'pino';

/**
 * Centralized logger for CrawlReady
 * Uses pino for structured logging with performance
 *
 * This shared package provides consistent logging across web app and worker.
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
 *
 * @example
 * const serviceLogger = createLogger({ service: 'render-worker' });
 * serviceLogger.info({ jobId: '123' }, 'Processing job');
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
