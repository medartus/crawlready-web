/**
 * SSRF (Server-Side Request Forgery) Protection
 *
 * Prevents attackers from using the render service to access:
 * - Internal services (localhost, private IPs)
 * - Cloud metadata endpoints
 * - Other restricted resources
 */

/**
 * Blocked hostnames and IP ranges
 */
const BLOCKED_HOSTNAMES = [
  // Loopback
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',

  // Private IPv4 (RFC 1918)
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',

  // Link-local (RFC 3927)
  '169.254.',

  // Cloud metadata endpoints
  'metadata.google.internal',
  'metadata.google.com',
  'metadata',
  'instance-data', // AWS

  // Private TLDs
  '.local',
  '.internal',
  '.private',
];

/**
 * Custom error for SSRF violations
 */
export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

/**
 * Validate URL against SSRF attacks
 *
 * @throws {SSRFError} If URL is blocked
 */
export function validateUrlSecurity(url: string): void {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new SSRFError('Invalid URL format');
  }

  // Check protocol
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SSRFError('Only HTTP(S) protocols allowed');
  }

  // Check hostname against blocklist
  const hostname = parsed.hostname.toLowerCase();

  for (const blocked of BLOCKED_HOSTNAMES) {
    if (hostname.includes(blocked)) {
      throw new SSRFError(`Hostname blocked: ${hostname}`);
    }
  }

  // Additional check for IP addresses
  if (isPrivateIP(hostname)) {
    throw new SSRFError('Private IP addresses are blocked');
  }
}

/**
 * Check if hostname is a private IP address
 */
function isPrivateIP(hostname: string): boolean {
  // Check IPv4 format
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Pattern);

  if (match) {
    const parts = match.slice(1).map(Number);

    // Check if all parts are valid (0-255)
    if (parts.some(part => part < 0 || part > 255)) {
      return false;
    }

    // Check private IP ranges
    const [first, second] = parts;

    if (
      first === 10 // 10.0.0.0/8
      || first === 127 // 127.0.0.0/8 (loopback)
      || (first === 172 && second !== undefined && second >= 16 && second <= 31) // 172.16.0.0/12
      || (first === 192 && second === 168) // 192.168.0.0/16
      || (first === 169 && second === 254) // 169.254.0.0/16 (link-local)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if URL is safe (convenience function that returns boolean)
 */
export function isSafeUrl(url: string): boolean {
  try {
    validateUrlSecurity(url);
    return true;
  } catch {
    return false;
  }
}
