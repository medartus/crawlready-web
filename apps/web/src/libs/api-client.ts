/**
 * API Client Wrapper
 * Automatically includes PostHog distinct ID in headers for consistent tracking
 */

import posthog from 'posthog-js';

export type ApiRequestOptions = RequestInit & {
  body?: any;
};

/**
 * Standard API wrapper that includes PostHog distinct ID in headers
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Fetch response
 */
export async function apiClient(
  url: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { body, headers = {}, ...restOptions } = options;

  // Get PostHog distinct ID
  const distinctId = posthog?.get_distinct_id() || 'anonymous';

  // Prepare headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'X-PostHog-Distinct-Id': distinctId,
    ...headers,
  };

  // Prepare request options
  const requestOptions: RequestInit = {
    ...restOptions,
    headers: requestHeaders,
  };

  // Add body if provided
  if (body !== undefined) {
    requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return fetch(url, requestOptions);
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient(url, { ...options, method: 'GET' }),

  post: (url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient(url, { ...options, method: 'POST', body }),

  put: (url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient(url, { ...options, method: 'PUT', body }),

  patch: (url: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient(url, { ...options, method: 'PATCH', body }),

  delete: (url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient(url, { ...options, method: 'DELETE' }),
};
