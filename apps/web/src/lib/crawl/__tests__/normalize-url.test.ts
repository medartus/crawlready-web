import { describe, expect, it } from 'vitest';

import { normalizeDomain, normalizeUrl } from '../normalize-url';

describe('normalizeUrl', () => {
  it('adds https:// if no scheme', () => {
    const r = normalizeUrl('example.com');

    expect(r.url).toBe('https://example.com/');
    expect(r.domain).toBe('example.com');
  });

  it('preserves https scheme', () => {
    expect(normalizeUrl('https://example.com').url).toBe('https://example.com/');
  });

  it('converts http to https in normalized URL', () => {
    const r = normalizeUrl('http://example.com/page');

    expect(r.url).toBe('https://example.com/page');
  });

  it('strips www prefix', () => {
    const r = normalizeUrl('https://www.example.com/pricing');

    expect(r.domain).toBe('example.com');
    expect(r.url).toBe('https://example.com/pricing');
  });

  it('strips trailing DNS dot', () => {
    const r = normalizeUrl('https://example.com.');

    expect(r.domain).toBe('example.com');
  });

  it('strips default ports', () => {
    expect(normalizeUrl('https://example.com:443/').url).toBe('https://example.com/');
    expect(normalizeUrl('http://example.com:80/').url).toBe('https://example.com/');
  });

  it('preserves non-default ports', () => {
    expect(normalizeUrl('https://example.com:8080/').url).toBe('https://example.com:8080/');
  });

  it('preserves path case (does not lowercase)', () => {
    const r = normalizeUrl('https://example.com/README');

    expect(r.url).toBe('https://example.com/README');
  });

  it('preserves trailing slash in path', () => {
    const r = normalizeUrl('https://example.com/pricing/');

    expect(r.url).toBe('https://example.com/pricing/');
  });

  it('strips query string and fragment', () => {
    const r = normalizeUrl('https://example.com/page?foo=bar#section');

    expect(r.url).toBe('https://example.com/page');
  });

  it('lowercases domain but not path', () => {
    const r = normalizeUrl('https://EXAMPLE.COM/API/v2');

    expect(r.domain).toBe('example.com');
    expect(r.url).toBe('https://example.com/API/v2');
  });

  it('rejects IP addresses', () => {
    expect(() => normalizeUrl('http://192.168.1.1')).toThrow('IP addresses are not supported');
  });

  it('rejects IPv6', () => {
    expect(() => normalizeUrl('http://[::1]')).toThrow('IP addresses are not supported');
  });

  it('rejects URLs with user:pass', () => {
    expect(() => normalizeUrl('https://user:pass@example.com')).toThrow('authentication');
  });

  it('rejects invalid URLs', () => {
    expect(() => normalizeUrl('not a url at all !@#')).toThrow('Invalid URL');
  });

  it('handles subdomains correctly', () => {
    const r = normalizeUrl('https://api.staging.example.com/v1/health');

    expect(r.domain).toBe('api.staging.example.com');
    expect(r.url).toBe('https://api.staging.example.com/v1/health');
  });
});

describe('normalizeDomain', () => {
  it('extracts domain from full URL', () => {
    expect(normalizeDomain('https://www.example.com/pricing')).toBe('example.com');
  });

  it('handles bare domain input', () => {
    expect(normalizeDomain('example.com')).toBe('example.com');
  });
});
