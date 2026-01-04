/**
 * Performance Checker
 * AI crawlers have 1-5 second timeout constraints - critical for visibility
 */

import { Buffer } from 'node:buffer';

import type { PerformanceCheck } from '../types';

export class PerformanceChecker {
  static check(html: string, headers: Headers, responseTime: number): PerformanceCheck {
    const issues: string[] = [];

    // Content-Type validation
    const contentType = headers.get('content-type') || '';
    const isHTML = contentType.includes('text/html');

    if (!isHTML) {
      issues.push(`Wrong Content-Type: ${contentType} (should be text/html)`);
    }

    // HTML size (should be < 500KB for optimal performance)
    const htmlSize = Buffer.byteLength(html, 'utf8');
    const htmlSizeKB = Math.round(htmlSize / 1024);

    if (htmlSizeKB > 500) {
      issues.push(`Large HTML size: ${htmlSizeKB}KB (should be < 500KB)`);
    } else if (htmlSizeKB > 300) {
      issues.push(`HTML size ${htmlSizeKB}KB approaching limit`);
    }

    // Compression detection
    const encoding = headers.get('content-encoding') || '';
    const hasCompression = encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate');

    if (!hasCompression && htmlSizeKB > 50) {
      issues.push('No compression detected (should use gzip or brotli)');
    }

    // Cache headers
    const cacheControl = headers.get('cache-control') || '';
    const isCacheable = !cacheControl.includes('no-cache') && !cacheControl.includes('no-store');

    if (!isCacheable) {
      issues.push('Page not cacheable (impacts performance)');
    }

    // TTFB (Time to First Byte) - using responseTime as proxy
    const ttfb = responseTime;

    if (ttfb > 600) {
      issues.push(`Slow TTFB: ${ttfb}ms (should be < 600ms, ideal < 200ms)`);
    }

    // Resource counts
    const scriptCount = (html.match(/<script[^>]*>/gi) || []).length;
    const stylesheetCount = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
    const imageCount = (html.match(/<img[^>]*>/gi) || []).length;

    if (scriptCount > 20) {
      issues.push(`Too many scripts: ${scriptCount} (should be < 20)`);
    }

    if (stylesheetCount > 10) {
      issues.push(`Too many stylesheets: ${stylesheetCount} (should be < 10)`);
    }

    // Estimate total resources
    const totalResourcesEstimate = scriptCount + stylesheetCount + imageCount;

    return {
      responseTime,
      htmlSize: htmlSizeKB,
      contentType,
      isHTML,
      hasCompression,
      isCacheable,
      ttfb,
      scriptCount,
      stylesheetCount,
      imageCount,
      totalResourcesEstimate,
      issues,
    };
  }

  /**
   * Check for render-blocking resources
   */
  static checkRenderBlocking(html: string): { count: number; issues: string[] } {
    const issues: string[] = [];

    // Scripts without defer/async
    const blockingScripts = html.match(/<script(?![^>]*(?:defer|async))[^>]*src=/gi) || [];
    const blockingCount = blockingScripts.length;

    if (blockingCount > 5) {
      issues.push(`${blockingCount} render-blocking scripts (add defer or async)`);
    }

    // Stylesheets in <head> without media or preload
    const blockingStyles = html.match(/<link[^>]*rel=["']stylesheet["'](?![^>]*media=["']print["'])[^>]*>/gi) || [];

    if (blockingStyles.length > 3) {
      issues.push(`${blockingStyles.length} render-blocking stylesheets (consider critical CSS inline)`);
    }

    return {
      count: blockingCount + blockingStyles.length,
      issues,
    };
  }
}
