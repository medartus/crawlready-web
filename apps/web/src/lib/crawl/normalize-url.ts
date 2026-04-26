/**
 * URL & domain normalization — single source of truth.
 *
 * Used everywhere: API routes, cache keys, database writes, score pages.
 * See docs/architecture/api-first.md § URL Normalization.
 */

export type NormalizedResult = {
  /** Normalized full URL (https://example.com/pricing/) */
  url: string;
  /** Normalized domain only (example.com) */
  domain: string;
};

/**
 * Normalize a URL input for storage, cache, and display.
 *
 * @throws {Error} if the input is not a valid HTTP(S) URL
 */
export function normalizeUrl(input: string): NormalizedResult {
  let raw = input.trim();

  // Default to https:// if no scheme
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }

  // Reject non-HTTP schemes
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Unsupported scheme: ${parsed.protocol}`);
  }

  // Reject user:pass@host
  if (parsed.username || parsed.password) {
    throw new Error('URLs with authentication are not supported');
  }

  // Reject IP addresses
  const host = parsed.hostname;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) || host.startsWith('[')) {
    throw new Error('IP addresses are not supported');
  }

  // Domain normalization
  let domain = host.toLowerCase();
  domain = domain.replace(/^www\./, '');
  domain = domain.replace(/\.$/, ''); // trailing DNS dot

  // Strip default ports
  const isDefaultPort = (parsed.protocol === 'https:' && parsed.port === '443')
    || (parsed.protocol === 'http:' && parsed.port === '80')
    || parsed.port === '';

  const portSuffix = isDefaultPort ? '' : `:${parsed.port}`;

  // URL normalization — lowercase path, strip query & fragment
  const path = parsed.pathname.toLowerCase();

  const url = `https://${domain}${portSuffix}${path}`;

  return { url, domain };
}

/**
 * Normalize a domain string only (strip scheme, www, lowercase).
 */
export function normalizeDomain(input: string): string {
  return normalizeUrl(input).domain;
}
