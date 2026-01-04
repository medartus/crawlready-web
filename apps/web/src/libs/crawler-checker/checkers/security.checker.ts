/**
 * Security & Trust Infrastructure Checker
 * Security headers and trust signals impact crawler trust and user safety
 */

import type { SecurityCheck } from '../types';

export class SecurityChecker {
  static check(url: string, html: string, headers: Headers): SecurityCheck {
    const issues: string[] = [];

    // HTTPS validation
    const isHTTPS = url.startsWith('https://');

    if (!isHTTPS) {
      issues.push('Site not using HTTPS - major security risk');
    }

    // Security Headers
    const hasHSTS = Boolean(headers.get('strict-transport-security'));
    const hasCSP = Boolean(headers.get('content-security-policy'));
    const hasXFrameOptions = Boolean(headers.get('x-frame-options'));
    const hasXContentTypeOptions = Boolean(headers.get('x-content-type-options'));
    const hasReferrerPolicy = Boolean(headers.get('referrer-policy'));
    const hasPermissionsPolicy = Boolean(headers.get('permissions-policy') || headers.get('feature-policy'));

    if (isHTTPS && !hasHSTS) {
      issues.push('Missing Strict-Transport-Security header (HSTS)');
    }

    if (!hasCSP) {
      issues.push('Missing Content-Security-Policy header (protects against XSS)');
    }

    if (!hasXFrameOptions) {
      issues.push('Missing X-Frame-Options header (protects against clickjacking)');
    }

    if (!hasXContentTypeOptions) {
      issues.push('Missing X-Content-Type-Options header');
    }

    // Mixed content detection
    let mixedContentDetected = false;

    if (isHTTPS) {
      const httpResources = html.match(/(?:src|href)=["']http:\/\/[^"']+["']/gi) || [];
      mixedContentDetected = httpResources.length > 0;

      if (mixedContentDetected) {
        issues.push(`Mixed content detected: ${httpResources.length} HTTP resources on HTTPS page`);
      }
    }

    // Trust signals detection
    const hasPrivacyPolicy = /privacy[\s-]policy|privacy/i.test(html);
    const hasTermsOfService = /terms[\s-]of[\s-]service|terms[\s-]and[\s-]conditions|terms/i.test(html);
    const hasAboutPage = /href=["'][^"']*about[^"']*["']/i.test(html);
    const hasContactPage = /href=["'][^"']*contact[^"']*["']/i.test(html);
    const hasCookieConsent = /cookie[\s-]consent|cookie[\s-]policy|gdpr/i.test(html);

    if (!hasPrivacyPolicy) {
      issues.push('No privacy policy detected (impacts trust)');
    }

    if (!hasTermsOfService) {
      issues.push('No terms of service detected');
    }

    if (!hasAboutPage) {
      issues.push('No about page link detected (impacts E-E-A-T)');
    }

    if (!hasContactPage) {
      issues.push('No contact page link detected (impacts trust)');
    }

    // Calculate security score
    let securityScore = 100;

    if (!isHTTPS) {
      securityScore -= 50;
    }
    if (!hasHSTS && isHTTPS) {
      securityScore -= 10;
    }
    if (!hasCSP) {
      securityScore -= 15;
    }
    if (!hasXFrameOptions) {
      securityScore -= 10;
    }
    if (!hasXContentTypeOptions) {
      securityScore -= 5;
    }
    if (mixedContentDetected) {
      securityScore -= 20;
    }
    if (!hasPrivacyPolicy) {
      securityScore -= 10;
    }
    if (!hasTermsOfService) {
      securityScore -= 5;
    }
    if (!hasAboutPage) {
      securityScore -= 10;
    }
    if (!hasContactPage) {
      securityScore -= 10;
    }

    return {
      isHTTPS,
      hasHSTS,
      hasCSP,
      hasXFrameOptions,
      hasXContentTypeOptions,
      hasReferrerPolicy,
      hasPermissionsPolicy,
      mixedContentDetected,
      trustSignals: {
        hasPrivacyPolicy,
        hasTermsOfService,
        hasAboutPage,
        hasContactPage,
        hasCookieConsent,
      },
      securityScore: Math.max(0, securityScore),
      issues,
    };
  }

  /**
   * Analyze specific security header values
   */
  static analyzeHSTS(header: string | null): { maxAge: number; includeSubDomains: boolean; preload: boolean } {
    if (!header) {
      return { maxAge: 0, includeSubDomains: false, preload: false };
    }

    const maxAgeMatch = header.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch && maxAgeMatch[1] ? Number.parseInt(maxAgeMatch[1], 10) : 0;
    const includeSubDomains = /includeSubDomains/i.test(header);
    const preload = /preload/i.test(header);

    return { maxAge, includeSubDomains, preload };
  }
}
