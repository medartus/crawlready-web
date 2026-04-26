/**
 * CrawlProvider — provider-agnostic interface for crawling services.
 *
 * The scoring engine and scan orchestrator never import a specific
 * provider directly.  They call `crawlProvider.scrape(url)` and get
 * back a `CrawlResult`.
 *
 * Swap implementations by changing `getCrawlProvider()`.
 */

export type CrawlResult = {
  /** Fully rendered HTML (JS executed) */
  html: string;
  /** Markdown representation of the page content */
  markdown: string;
  /** Final URL after redirects */
  url: string;
  /** HTTP status code */
  statusCode: number;
  /** Metadata extracted by the provider */
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    ogImage?: string;
    [key: string]: unknown;
  };
};

export type CrawlProvider = {
  /** Human-readable provider name (for logging / diagnostics) */
  readonly name: string;

  /**
   * Scrape a single URL with full JS rendering.
   * Returns the rendered HTML + Markdown + metadata.
   *
   * @throws {CrawlProviderError} on provider failures
   */
  scrape: (url: string) => Promise<CrawlResult>;
};

export class CrawlProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly providerName?: string,
  ) {
    super(message);
    this.name = 'CrawlProviderError';
  }
}
