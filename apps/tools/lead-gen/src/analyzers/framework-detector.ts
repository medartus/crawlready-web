/**
 * JavaScript Framework Detector
 * Identifies React, Vue, Angular, Svelte, etc. from HTML/headers
 */

import { load } from 'cheerio';
import type { FrameworkDetectionResult, FrameworkType } from '../types.js';
import { logger } from '../utils/logger.js';

interface FrameworkIndicator {
  framework: FrameworkType;
  patterns: {
    html?: RegExp[];
    attributes?: string[];
    scripts?: RegExp[];
    headers?: Record<string, RegExp>;
    meta?: Record<string, RegExp>;
  };
  confidence: 'high' | 'medium' | 'low';
}

const FRAMEWORK_INDICATORS: FrameworkIndicator[] = [
  // Next.js (React SSR/SSG)
  {
    framework: 'next.js',
    patterns: {
      html: [/__NEXT_DATA__/, /_next\/static/, /_next\/image/],
      attributes: ['data-nextjs-scroll-focus-boundary'],
      meta: { generator: /next\.js/i },
    },
    confidence: 'high',
  },
  // React (generic)
  {
    framework: 'react',
    patterns: {
      html: [/react\.production\.min\.js/, /react-dom/],
      attributes: ['data-reactroot', 'data-reactid'],
      scripts: [/react@\d+/, /react-dom@\d+/],
    },
    confidence: 'high',
  },
  // Nuxt.js (Vue SSR)
  {
    framework: 'nuxt',
    patterns: {
      html: [/__NUXT__/, /_nuxt\//, /nuxt\.config/],
      attributes: ['data-n-head', 'data-n-head-ssr'],
      scripts: [/nuxt\.js/],
    },
    confidence: 'high',
  },
  // Vue (generic)
  {
    framework: 'vue',
    patterns: {
      html: [/vue\.runtime/, /vue@\d+/],
      attributes: ['data-v-', 'v-cloak'],
      scripts: [/vue\.min\.js/, /vue\.global/],
    },
    confidence: 'high',
  },
  // Angular
  {
    framework: 'angular',
    patterns: {
      html: [/ng-version/, /angular\.io/],
      attributes: ['ng-version', '_nghost-', '_ngcontent-', 'ng-reflect-'],
      scripts: [/@angular\/core/, /angular\.min\.js/],
    },
    confidence: 'high',
  },
  // Svelte/SvelteKit
  {
    framework: 'svelte',
    patterns: {
      html: [/svelte-/, /__sveltekit\//],
      attributes: ['svelte-hash', 'data-svelte'],
      scripts: [/svelte\.dev/, /svelte-kit/],
    },
    confidence: 'high',
  },
  // Gatsby (React SSG)
  {
    framework: 'gatsby',
    patterns: {
      html: [/___gatsby/, /gatsby-/, /gatsby\.js/],
      meta: { generator: /gatsby/i },
    },
    confidence: 'high',
  },
  // Remix (React SSR)
  {
    framework: 'remix',
    patterns: {
      html: [/__remix/, /remix\.run/],
      scripts: [/@remix-run/],
    },
    confidence: 'high',
  },
];

// React-specific indicators (after ruling out Next.js, Gatsby, Remix)
const REACT_ROOT_INDICATORS = [
  '<div id="root"',
  '<div id="app"',
  'data-reactroot',
  'createRoot',
  'ReactDOM.render',
];

/**
 * Detect JavaScript framework from HTML content
 */
export function detectFramework(
  html: string,
  headers?: Record<string, string>
): FrameworkDetectionResult {
  const log = logger.child('framework-detector');
  const $ = load(html);

  const indicators: string[] = [];
  let detectedFramework: FrameworkType = 'unknown';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Check each framework's indicators
  for (const indicator of FRAMEWORK_INDICATORS) {
    let matches = 0;
    const matchedPatterns: string[] = [];

    // Check HTML content patterns
    if (indicator.patterns.html) {
      for (const pattern of indicator.patterns.html) {
        if (pattern.test(html)) {
          matches++;
          matchedPatterns.push(`html:${pattern.source}`);
        }
      }
    }

    // Check attributes in HTML
    if (indicator.patterns.attributes) {
      for (const attr of indicator.patterns.attributes) {
        if (html.includes(attr)) {
          matches++;
          matchedPatterns.push(`attr:${attr}`);
        }
      }
    }

    // Check script src patterns
    if (indicator.patterns.scripts) {
      $('script[src]').each((_, el) => {
        const src = $(el).attr('src') || '';
        for (const pattern of indicator.patterns.scripts!) {
          if (pattern.test(src)) {
            matches++;
            matchedPatterns.push(`script:${pattern.source}`);
          }
        }
      });
    }

    // Check meta tags
    if (indicator.patterns.meta) {
      for (const [name, pattern] of Object.entries(indicator.patterns.meta)) {
        const metaContent = $(`meta[name="${name}"]`).attr('content') || '';
        if (pattern.test(metaContent)) {
          matches++;
          matchedPatterns.push(`meta:${name}`);
        }
      }
    }

    // Check headers if provided
    if (headers && indicator.patterns.headers) {
      for (const [header, pattern] of Object.entries(indicator.patterns.headers)) {
        const headerValue = headers[header.toLowerCase()] || '';
        if (pattern.test(headerValue)) {
          matches++;
          matchedPatterns.push(`header:${header}`);
        }
      }
    }

    // If we found matches, update detection
    if (matches > 0) {
      // Prioritize specific frameworks over generic ones
      const specificFrameworks: FrameworkType[] = ['next.js', 'nuxt', 'gatsby', 'remix'];
      const isSpecific = specificFrameworks.includes(indicator.framework);

      if (
        detectedFramework === 'unknown' ||
        (isSpecific && !specificFrameworks.includes(detectedFramework)) ||
        matches > indicators.length
      ) {
        detectedFramework = indicator.framework;
        confidence = indicator.confidence;
        indicators.length = 0;
        indicators.push(...matchedPatterns);
      }
    }
  }

  // If we detected React generically, check for SPA indicators
  if (detectedFramework === 'react' || detectedFramework === 'unknown') {
    const hasReactRoot = REACT_ROOT_INDICATORS.some((ind) => html.includes(ind));
    const bodyContent = $('body').html() || '';
    const isLikelySPA =
      bodyContent.length < 500 &&
      (bodyContent.includes('<div id="root"') || bodyContent.includes('<div id="app"'));

    if (hasReactRoot && isLikelySPA) {
      if (detectedFramework === 'unknown') {
        detectedFramework = 'react';
        confidence = 'medium';
      }
      indicators.push('spa-root-detected');
    }
  }

  // Log detection result
  if (detectedFramework !== 'unknown') {
    log.debug(`Detected ${detectedFramework}`, { indicators });
  }

  return {
    url: '', // Will be set by caller
    framework: detectedFramework,
    confidence,
    indicators,
  };
}

/**
 * Get CrawlReady fit assessment based on framework
 */
export function getFrameworkFit(framework: FrameworkType): {
  fit: 'excellent' | 'good' | 'moderate' | 'low';
  reason: string;
} {
  switch (framework) {
    case 'react':
      return {
        fit: 'excellent',
        reason: 'React SPAs typically render 80-95% of content via JavaScript',
      };
    case 'next.js':
      return {
        fit: 'good',
        reason: 'Next.js can use CSR, SSR, or SSG. CSR pages need pre-rendering.',
      };
    case 'vue':
      return {
        fit: 'excellent',
        reason: 'Vue SPAs typically render 80-95% of content via JavaScript',
      };
    case 'nuxt':
      return {
        fit: 'good',
        reason: 'Nuxt can use CSR or SSR. CSR pages need pre-rendering.',
      };
    case 'angular':
      return {
        fit: 'excellent',
        reason: 'Angular apps are typically SPAs with heavy JS rendering',
      };
    case 'svelte':
      return {
        fit: 'good',
        reason: 'SvelteKit supports SSR, but CSR apps need pre-rendering',
      };
    case 'gatsby':
      return {
        fit: 'moderate',
        reason: 'Gatsby generates static HTML but may have hydration-dependent content',
      };
    case 'remix':
      return {
        fit: 'moderate',
        reason: 'Remix prioritizes SSR but may have client-only features',
      };
    default:
      return {
        fit: 'low',
        reason: 'Unknown framework - manual analysis recommended',
      };
  }
}
