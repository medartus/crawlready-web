// Cache metadata types for CDN-first architecture

/**
 * Redis cache metadata schema
 * Stores metadata about cached pages instead of full HTML content
 */
export type CacheMetadata = {
  /** Public CDN URL for the rendered page */
  publicUrl: string;
  /** Storage key in Supabase bucket */
  storageKey: string;
  /** Unix timestamp when page was rendered */
  renderedAt: number;
  /** Size of rendered HTML in bytes */
  sizeBytes: number;
  /** Cache status: rendering, ready, or failed */
  status: CacheStatus;
  /** Error message if status is 'failed' */
  errorMessage?: string;
};

export type CacheStatus = 'rendering' | 'ready' | 'failed';

/**
 * Response from /api/render endpoint (legacy cache-status mode)
 * @deprecated Use OnTheFlyRenderResponse for new integrations
 */
export type RenderApiResponse =
  | {
    /** Page is cached and ready */
    cached: true;
    /** Public CDN URL for the rendered page */
    publicUrl: string;
    /** ISO timestamp when page was rendered */
    renderedAt: string;
    /** Size of rendered HTML in bytes */
    sizeBytes: number;
  }
  | {
    /** Page is currently being rendered */
    cached: false;
    status: 'rendering';
    message: string;
  };

/**
 * Response from /api/render endpoint (on-the-fly rendering mode)
 *
 * Always returns HTML in 200 response. Customer middleware just:
 * 1. Detect AI bot
 * 2. POST /api/render { url }
 * 3. Return HTML from response
 */
export type OnTheFlyRenderResponse = {
  /** Full rendered HTML */
  html: string;
  /** Where content came from: 'cdn' (cached) or 'rendered' (fresh) */
  source: 'cdn' | 'rendered';
  /** CDN URL for reference (where HTML is stored) */
  publicUrl: string;
  /** Time to render in ms (0 if from cache) */
  renderDurationMs: number;
  /** Size of HTML in bytes */
  sizeBytes: number;
};

/**
 * Response when another request is already rendering
 */
export type RenderingInProgressResponse = {
  status: 'rendering';
  message: string;
  retryAfter: number;
};

/**
 * Response when render times out
 */
export type RenderTimeoutResponse = {
  error: 'Render timeout';
  message: string;
};

/**
 * Response from /api/render-async endpoint
 */
export type RenderAsyncApiResponse = {
  /** Always true for fire-and-forget */
  queued: boolean;
  message?: string;
};
