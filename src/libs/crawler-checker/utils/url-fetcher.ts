/**
 * URL fetching utilities with enhanced error handling
 */

export type FetchResult = {
  html: string;
  ok: boolean;
  headers: Headers;
  responseTime: number;
  status: number;
};

export class URLFetcher {
  /**
   * Fetch URL with AI crawler user agent
   */
  static async fetch(url: string, timeout = 20000): Promise<FetchResult> {
    const startTime = Date.now();

    try {
      console.log(`[URLFetcher] Fetching: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(timeout),
        redirect: 'follow',
      });

      const responseTime = Date.now() - startTime;
      console.log(`[URLFetcher] Response: ${response.status} in ${responseTime}ms`);

      const html = await response.text();
      console.log(`[URLFetcher] Received ${html.length} bytes`);

      // Validate we got HTML, not JSON or other content
      const trimmedHtml = html.trim();
      if (!trimmedHtml.startsWith('<')) {
        console.error(`[URLFetcher] Not HTML. First 100 chars: ${trimmedHtml.substring(0, 100)}`);
        throw new Error('Response does not appear to be HTML. The website may be returning JSON or plain text.');
      }

      return {
        html,
        ok: response.ok,
        headers: response.headers,
        responseTime,
        status: response.status,
      };
    } catch (error) {
      console.error(`[URLFetcher] Error:`, error);

      if (error instanceof Error) {
        // Provide more specific error messages
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error(`Request timed out - the website took too long to respond (>${timeout}ms)`);
        }

        // Network errors
        if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
          throw new Error('Unable to connect to the website. Please check the URL is correct and accessible.');
        }

        if (error.message.includes('ECONNREFUSED')) {
          throw new Error('Connection refused - the website is not accepting connections.');
        }

        if (error.message.includes('ETIMEDOUT')) {
          throw new Error('Connection timed out - the website is not responding.');
        }

        if (error.message.includes('certificate') || error.message.includes('SSL')) {
          throw new Error('SSL/Certificate error - the website has an invalid security certificate.');
        }

        throw error;
      }

      throw new Error('Failed to fetch URL: Unknown error');
    }
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Get base URL (origin)
   */
  static getBaseUrl(url: string): string {
    try {
      return new URL(url).origin;
    } catch {
      throw new Error('Invalid URL format');
    }
  }
}
