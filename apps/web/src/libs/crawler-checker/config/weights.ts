/**
 * Scoring weights based on AI Crawler Research
 *
 * Research findings:
 * - Only 31% of AI crawlers support JavaScript (GPTBot, ClaudeBot, PerplexityBot do NOT)
 * - E-E-A-T signals directly impact AI citation likelihood
 * - Schema markup with author/datePublished/publisher critical for attribution
 * - Performance matters: AI crawlers have 1-5 second timeout constraints
 */

export const CATEGORY_WEIGHTS = {
  javascript: 0.25, // 25% - CRITICAL (most AI crawlers don't execute JS)
  technicalSEO: 0.20, // 20% - robots.txt, HTTPS, canonical
  schemaMarkup: 0.20, // 20% - Schema.org structured data quality
  contentQuality: 0.15, // 15% - E-E-A-T, freshness, structure
  performance: 0.10, // 10% - Speed, Core Web Vitals
  navigation: 0.05, // 5% - Internal linking, discoverability
  security: 0.05, // 5% - HTTPS, security headers
} as const;

export const SCORE_THRESHOLDS = {
  excellent: 90, // 90-100: Excellent - Fully optimized for AI crawlers
  good: 70, // 70-89: Good - Minor improvements needed
  fair: 50, // 50-69: Fair - Significant optimization required
  poor: 0, // 0-49: Poor - Critical issues blocking AI crawler visibility
} as const;

export const PENALTY_WEIGHTS = {
  critical: 50, // Blocks indexing entirely
  high: 30, // Major visibility issues
  medium: 15, // Optimization opportunities
  low: 5, // Nice-to-have improvements
} as const;
