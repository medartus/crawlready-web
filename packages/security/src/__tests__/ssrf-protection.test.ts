/**
 * SSRF Protection Integration Tests
 *
 * Tests SSRF protection at the highest level - testing real URL validation
 * scenarios that would occur in production.
 */

import { describe, expect, it } from 'vitest';

import { SSRFError, validateUrlSecurity } from '../ssrf-protection';

describe('SSRF Protection Integration Tests', () => {
  describe('Valid URLs - Should Pass', () => {
    it('should allow valid public HTTP URLs', () => {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'https://www.example.com/page',
        'https://subdomain.example.com/path?query=value',
        'https://example.com:443/secure',
      ];

      validUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).not.toThrow();
      });
    });

    it('should allow URLs with various TLDs', () => {
      const validUrls = [
        'https://example.co.uk',
        'https://example.io',
        'https://example.dev',
        'https://example.app',
      ];

      validUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).not.toThrow();
      });
    });

    it('should allow URLs with paths and query parameters', () => {
      const url = 'https://example.com/api/v1/users?id=123&filter=active';

      expect(() => validateUrlSecurity(url)).not.toThrow();
    });
  });

  describe('Localhost and Private IPs - Should Block', () => {
    it('should block localhost variations', () => {
      const localhostUrls = [
        'http://localhost',
        'http://localhost:3000',
        'https://localhost',
        'http://127.0.0.1',
        'http://127.0.0.1:8080',
        'http://[::1]',
        'http://[::1]:3000',
      ];

      localhostUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
        expect(() => validateUrlSecurity(url)).toThrow(/localhost.*not allowed/i);
      });
    });

    it('should block private IP ranges (RFC 1918)', () => {
      const privateIps = [
        'http://10.0.0.1',
        'http://10.255.255.255',
        'http://172.16.0.1',
        'http://172.31.255.255',
        'http://192.168.0.1',
        'http://192.168.255.255',
      ];

      privateIps.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
        expect(() => validateUrlSecurity(url)).toThrow(/private.*not allowed/i);
      });
    });

    it('should block link-local addresses', () => {
      const linkLocalUrls = [
        'http://169.254.0.1',
        'http://169.254.169.254', // AWS metadata service
        'http://[fe80::1]',
      ];

      linkLocalUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
      });
    });
  });

  describe('Cloud Metadata Services - Should Block', () => {
    it('should block AWS metadata service', () => {
      const awsMetadata = [
        'http://169.254.169.254/latest/meta-data/',
        'http://169.254.169.254',
      ];

      awsMetadata.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
      });
    });

    it('should block internal cloud service URLs', () => {
      const cloudUrls = [
        'http://metadata.google.internal',
        'http://169.254.169.254/computeMetadata/v1/',
      ];

      cloudUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
      });
    });
  });

  describe('Special Cases and Edge Cases', () => {
    it('should block URLs with IP addresses in decimal format', () => {
      // 127.0.0.1 in decimal = 2130706433
      const decimalIp = 'http://2130706433';

      expect(() => validateUrlSecurity(decimalIp)).toThrow(SSRFError);
    });

    it('should block URLs with IPv6 loopback', () => {
      const ipv6Loopback = [
        'http://[::1]',
        'http://[0:0:0:0:0:0:0:1]',
      ];

      ipv6Loopback.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
      });
    });

    it('should handle URLs with authentication', () => {
      // Should still validate the hostname even with auth
      expect(() => validateUrlSecurity('http://user:pass@localhost')).toThrow(SSRFError);
      expect(() => validateUrlSecurity('http://user:pass@example.com')).not.toThrow();
    });

    it('should handle URLs with unusual ports', () => {
      expect(() => validateUrlSecurity('http://example.com:8080')).not.toThrow();
      expect(() => validateUrlSecurity('http://localhost:8080')).toThrow(SSRFError);
    });
  });

  describe('Real-world Attack Scenarios', () => {
    it('should prevent SSRF via localhost bypass attempts', () => {
      const bypassAttempts = [
        'http://127.0.0.1',
        'http://localhost',
        'http://[::1]',
        'http://0.0.0.0',
      ];

      bypassAttempts.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
      });
    });

    it('should prevent access to internal network resources', () => {
      const internalUrls = [
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1',
      ];

      internalUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).toThrow(SSRFError);
      });
    });

    it('should allow legitimate external URLs that might look suspicious', () => {
      const legitimateUrls = [
        'https://192-168-1-1.example.com', // Looks like IP but is hostname
        'https://localhost.example.com', // Contains 'localhost' but is external
        'https://my-local-host.com', // Contains 'local' but is external
      ];

      legitimateUrls.forEach((url) => {
        expect(() => validateUrlSecurity(url)).not.toThrow();
      });
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error messages', () => {
      try {
        validateUrlSecurity('http://localhost');

        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SSRFError);
        expect((error as Error).message).toMatch(/localhost/i);
      }

      try {
        validateUrlSecurity('http://192.168.1.1');

        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(SSRFError);
        expect((error as Error).message).toMatch(/private/i);
      }
    });
  });
});
