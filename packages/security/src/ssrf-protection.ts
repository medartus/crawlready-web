/**
 * SSRF (Server-Side Request Forgery) Protection
 */

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
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
  '169.254.',
  'metadata.google.internal',
  'metadata.google.com',
  'metadata',
  'instance-data',
  '.local',
  '.internal',
  '.private',
];

export class SSRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SSRFError';
  }
}

export function validateUrlSecurity(url: string): void {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new SSRFError('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SSRFError('Only HTTP(S) protocols allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  for (const blocked of BLOCKED_HOSTNAMES) {
    if (hostname.includes(blocked)) {
      throw new SSRFError(`Hostname blocked: ${hostname}`);
    }
  }

  if (isPrivateIP(hostname)) {
    throw new SSRFError('Private IP addresses are blocked');
  }
}

function isPrivateIP(hostname: string): boolean {
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Pattern);

  if (match) {
    const parts = match.slice(1).map(Number);

    if (parts.some(part => part < 0 || part > 255)) {
      return false;
    }

    const [first, second] = parts;

    if (
      first === 10
      || first === 127
      || (first === 172 && second !== undefined && second >= 16 && second <= 31)
      || (first === 192 && second === 168)
      || (first === 169 && second === 254)
    ) {
      return true;
    }
  }

  return false;
}

export function isSafeUrl(url: string): boolean {
  try {
    validateUrlSecurity(url);
    return true;
  } catch {
    return false;
  }
}
