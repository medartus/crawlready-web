/**
 * Render Service Client
 *
 * Client for calling the Fly.io render worker's HTTP API.
 * Used by Vercel /api/render for on-the-fly rendering.
 *
 * Architecture:
 * Customer → Vercel /api/render → Fly.io Worker → Puppeteer → HTML
 */

// Worker configuration
const RENDER_WORKER_URL = process.env.RENDER_WORKER_URL;
const RENDER_WORKER_SECRET = process.env.RENDER_WORKER_SECRET;

/**
 * Render options
 */
export type RenderOptions = {
  /** Wait for this CSS selector before capturing HTML */
  waitForSelector?: string;
  /** Render timeout in ms (default 30000, max 60000) */
  timeout?: number;
};

/**
 * Successful render result
 */
export type RenderResult = {
  /** Rendered and optimized HTML */
  html: string;
  /** Time to render in milliseconds */
  renderDurationMs: number;
  /** Size of HTML in bytes */
  sizeBytes: number;
  /** Render metrics */
  metrics?: {
    loadTime: number;
    totalRequests: number;
    blockedRequests: number;
  };
};

/**
 * Error types for render failures
 */
export type RenderErrorType = 'timeout' | 'busy' | 'validation' | 'network' | 'unknown';

/**
 * Render error with typed error information
 */
export class RenderServiceError extends Error {
  constructor(
    message: string,
    public readonly type: RenderErrorType,
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'RenderServiceError';
  }
}

/**
 * Check if render service is configured
 */
export function isRenderServiceConfigured(): boolean {
  return !!RENDER_WORKER_URL;
}

/**
 * Call the Fly.io render worker to render a page
 *
 * @param url - URL to render (must pass SSRF validation)
 * @param options - Render options
 * @returns Rendered HTML and metadata
 * @throws RenderServiceError on failure
 */
export async function renderViaWorker(
  url: string,
  options?: RenderOptions,
): Promise<RenderResult> {
  if (!RENDER_WORKER_URL) {
    throw new RenderServiceError(
      'Render worker not configured. Set RENDER_WORKER_URL environment variable.',
      'unknown',
    );
  }

  const timeout = options?.timeout || 30000;
  // Add 5s buffer for network overhead
  const fetchTimeout = timeout + 5000;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth header if secret is configured
  if (RENDER_WORKER_SECRET) {
    headers.Authorization = `Bearer ${RENDER_WORKER_SECRET}`;
  }

  try {
    const response = await fetch(`${RENDER_WORKER_URL}/render`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        waitForSelector: options?.waitForSelector,
        timeout,
      }),
      signal: AbortSignal.timeout(fetchTimeout),
    });

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as {
        error?: string;
        message?: string;
        retryAfter?: number;
      };

      switch (response.status) {
        case 400:
          throw new RenderServiceError(
            errorData.message || 'Invalid request',
            'validation',
          );
        case 401:
        case 403:
          throw new RenderServiceError(
            'Render worker authentication failed',
            'unknown',
          );
        case 503:
          throw new RenderServiceError(
            errorData.message || 'Render worker busy',
            'busy',
            errorData.retryAfter || 5,
          );
        case 504:
          throw new RenderServiceError(
            errorData.message || 'Render timeout',
            'timeout',
          );
        default:
          throw new RenderServiceError(
            errorData.message || `Render failed with status ${response.status}`,
            'unknown',
          );
      }
    }

    const result = await response.json() as RenderResult;
    return result;
  } catch (error) {
    // Re-throw RenderServiceError as-is
    if (error instanceof RenderServiceError) {
      throw error;
    }

    // Handle timeout from AbortSignal
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new RenderServiceError(
        'Render request timed out',
        'timeout',
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new RenderServiceError(
        'Failed to connect to render worker',
        'network',
      );
    }

    // Unknown error
    throw new RenderServiceError(
      error instanceof Error ? error.message : 'Unknown render error',
      'unknown',
    );
  }
}

/**
 * Check if the render worker is healthy
 */
export async function checkWorkerHealth(): Promise<{
  healthy: boolean;
  available?: number;
  waiting?: number;
}> {
  if (!RENDER_WORKER_URL) {
    return { healthy: false };
  }

  try {
    const response = await fetch(`${RENDER_WORKER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { healthy: false };
    }

    const data = await response.json() as {
      status: string;
      concurrency?: { available: number; waiting: number };
    };

    return {
      healthy: data.status === 'ok',
      available: data.concurrency?.available,
      waiting: data.concurrency?.waiting,
    };
  } catch {
    return { healthy: false };
  }
}
