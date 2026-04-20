/**
 * Chrome UX Report (CrUX) Data Fetcher
 * Fetches real-user performance metrics from Google's CrUX API
 */

import type { CruxResult, CruxMetrics } from '../types.js';
import { logger } from '../utils/logger.js';

const CRUX_API_URL = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord';

// CrUX metric thresholds (from web.dev)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // ms
  FID: { good: 100, poor: 300 }, // ms
  CLS: { good: 0.1, poor: 0.25 }, // score
  TTFB: { good: 800, poor: 1800 }, // ms
  INP: { good: 200, poor: 500 }, // ms
};

interface CruxApiResponse {
  record?: {
    metrics?: {
      largest_contentful_paint?: { percentiles: { p75: number } };
      first_input_delay?: { percentiles: { p75: number } };
      cumulative_layout_shift?: { percentiles: { p75: number } };
      experimental_time_to_first_byte?: { percentiles: { p75: number } };
      interaction_to_next_paint?: { percentiles: { p75: number } };
    };
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * Extract origin from URL
 */
function getOrigin(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch {
    return url;
  }
}

/**
 * Determine overall score based on metrics
 */
function calculateOverallScore(metrics: CruxMetrics): 'good' | 'needs-improvement' | 'poor' {
  const scores: ('good' | 'needs-improvement' | 'poor')[] = [];

  // LCP
  if (metrics.LCP !== null) {
    if (metrics.LCP <= THRESHOLDS.LCP.good) scores.push('good');
    else if (metrics.LCP <= THRESHOLDS.LCP.poor) scores.push('needs-improvement');
    else scores.push('poor');
  }

  // FID
  if (metrics.FID !== null) {
    if (metrics.FID <= THRESHOLDS.FID.good) scores.push('good');
    else if (metrics.FID <= THRESHOLDS.FID.poor) scores.push('needs-improvement');
    else scores.push('poor');
  }

  // CLS
  if (metrics.CLS !== null) {
    if (metrics.CLS <= THRESHOLDS.CLS.good) scores.push('good');
    else if (metrics.CLS <= THRESHOLDS.CLS.poor) scores.push('needs-improvement');
    else scores.push('poor');
  }

  // INP (newer metric)
  if (metrics.INP !== null) {
    if (metrics.INP <= THRESHOLDS.INP.good) scores.push('good');
    else if (metrics.INP <= THRESHOLDS.INP.poor) scores.push('needs-improvement');
    else scores.push('poor');
  }

  // Calculate overall: worst score wins
  if (scores.includes('poor')) return 'poor';
  if (scores.includes('needs-improvement')) return 'needs-improvement';
  if (scores.length > 0) return 'good';

  return 'needs-improvement'; // Default if no data
}

/**
 * Fetch CrUX data for a URL
 */
export async function fetchCruxData(url: string, apiKey?: string): Promise<CruxResult> {
  const log = logger.child('crux-fetcher');
  const origin = getOrigin(url);

  // If no API key, return no-data result
  if (!apiKey) {
    log.debug('No CrUX API key provided, skipping');
    return {
      url,
      hasData: false,
      metrics: {
        LCP: null,
        FID: null,
        CLS: null,
        TTFB: null,
        INP: null,
      },
      overallScore: 'no-data',
      fetchedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`${CRUX_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        formFactor: 'DESKTOP', // Can also use 'PHONE' or 'ALL_FORM_FACTORS'
      }),
    });

    const data = (await response.json()) as CruxApiResponse;

    // Check for API errors
    if (data.error) {
      if (data.error.code === 404) {
        // No data for this origin (common for smaller sites)
        log.debug(`No CrUX data for ${origin}`);
        return {
          url,
          hasData: false,
          metrics: { LCP: null, FID: null, CLS: null, TTFB: null, INP: null },
          overallScore: 'no-data',
          fetchedAt: new Date().toISOString(),
        };
      }
      throw new Error(`CrUX API error: ${data.error.message}`);
    }

    // Extract metrics
    const record = data.record?.metrics;
    if (!record) {
      return {
        url,
        hasData: false,
        metrics: { LCP: null, FID: null, CLS: null, TTFB: null, INP: null },
        overallScore: 'no-data',
        fetchedAt: new Date().toISOString(),
      };
    }

    const metrics: CruxMetrics = {
      LCP: record.largest_contentful_paint?.percentiles?.p75 ?? null,
      FID: record.first_input_delay?.percentiles?.p75 ?? null,
      CLS: record.cumulative_layout_shift?.percentiles?.p75 ?? null,
      TTFB: record.experimental_time_to_first_byte?.percentiles?.p75 ?? null,
      INP: record.interaction_to_next_paint?.percentiles?.p75 ?? null,
    };

    const overallScore = calculateOverallScore(metrics);

    log.info(`CrUX data for ${origin}`, { metrics, overallScore });

    return {
      url,
      hasData: true,
      metrics,
      overallScore,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    log.error(`Failed to fetch CrUX data for ${url}`, { error: String(error) });
    return {
      url,
      hasData: false,
      metrics: { LCP: null, FID: null, CLS: null, TTFB: null, INP: null },
      overallScore: 'no-data',
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get human-readable interpretation of CrUX metrics
 */
export function interpretCruxMetrics(result: CruxResult): string[] {
  const insights: string[] = [];

  if (!result.hasData) {
    insights.push('No Chrome UX Report data available (site may have insufficient traffic)');
    return insights;
  }

  const { metrics } = result;

  // LCP interpretation
  if (metrics.LCP !== null) {
    if (metrics.LCP > THRESHOLDS.LCP.poor) {
      insights.push(
        `Poor LCP (${(metrics.LCP / 1000).toFixed(1)}s) - Users wait too long to see content. Pre-rendering can help AI bots skip this wait.`
      );
    } else if (metrics.LCP > THRESHOLDS.LCP.good) {
      insights.push(`LCP needs improvement (${(metrics.LCP / 1000).toFixed(1)}s)`);
    }
  }

  // CLS interpretation
  if (metrics.CLS !== null && metrics.CLS > THRESHOLDS.CLS.poor) {
    insights.push(
      `High CLS (${metrics.CLS.toFixed(2)}) - Layout shifts during load. JS-heavy rendering often causes this.`
    );
  }

  // TTFB interpretation
  if (metrics.TTFB !== null && metrics.TTFB > THRESHOLDS.TTFB.poor) {
    insights.push(
      `Slow TTFB (${(metrics.TTFB / 1000).toFixed(1)}s) - Server is slow to respond. Pre-rendering from cache eliminates this for AI bots.`
    );
  }

  // INP interpretation
  if (metrics.INP !== null && metrics.INP > THRESHOLDS.INP.poor) {
    insights.push(`Poor INP (${metrics.INP}ms) - Heavy JavaScript blocking interactions.`);
  }

  if (insights.length === 0) {
    insights.push(`Core Web Vitals are ${result.overallScore}`);
  }

  return insights;
}

/**
 * Check if poor CrUX indicates JS rendering issues
 */
export function suggestsJSRenderingIssues(result: CruxResult): boolean {
  if (!result.hasData) return false;

  const { metrics } = result;

  // Poor LCP often indicates heavy JS blocking render
  if (metrics.LCP !== null && metrics.LCP > THRESHOLDS.LCP.poor) return true;

  // High CLS often caused by JS-injected content
  if (metrics.CLS !== null && metrics.CLS > THRESHOLDS.CLS.poor) return true;

  // Poor INP indicates heavy JS execution
  if (metrics.INP !== null && metrics.INP > THRESHOLDS.INP.poor) return true;

  return false;
}
