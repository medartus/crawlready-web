/**
 * In-memory Firecrawl budget counter.
 *
 * Phase 0: simple in-memory daily counter. Tracks credit usage and
 * enforces soft/hard limits per infrastructure-overview.md §Budget Circuit Breaker.
 *
 * Migrate to Upstash Redis in Phase 1 for cross-isolate consistency.
 */

import { createLogger } from '@crawlready/logger';

const log = createLogger({ service: 'budget' });

// $19/mo = 500 credits. Daily budget = ~16.6 credits/day.
// Soft limit at 80%, hard limit at 100%.
const DAILY_CREDIT_LIMIT = 17;
const SOFT_LIMIT_RATIO = 0.8;

type DayBucket = {
  date: string; // YYYY-MM-DD
  credits: number;
  softAlertSent: boolean;
};

let bucket: DayBucket = {
  date: todayKey(),
  credits: 0,
  softAlertSent: false,
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function ensureCurrentDay(): void {
  const today = todayKey();
  if (bucket.date !== today) {
    log.info(
      { previousDate: bucket.date, creditsUsed: bucket.credits },
      'Daily budget counter reset',
    );
    bucket = { date: today, credits: 0, softAlertSent: false };
  }
}

export type BudgetCheckResult = {
  allowed: boolean;
  creditsUsed: number;
  creditsRemaining: number;
  softLimitReached: boolean;
  hardLimitReached: boolean;
};

/**
 * Check if a scan is within budget. Does NOT increment — call `recordCredit` after use.
 */
export function checkBudget(): BudgetCheckResult {
  ensureCurrentDay();

  const softLimit = Math.floor(DAILY_CREDIT_LIMIT * SOFT_LIMIT_RATIO);
  const softLimitReached = bucket.credits >= softLimit;
  const hardLimitReached = bucket.credits >= DAILY_CREDIT_LIMIT;

  return {
    allowed: !hardLimitReached,
    creditsUsed: bucket.credits,
    creditsRemaining: Math.max(0, DAILY_CREDIT_LIMIT - bucket.credits),
    softLimitReached,
    hardLimitReached,
  };
}

/**
 * Record a credit usage after a successful Firecrawl call.
 */
export function recordCredit(credits = 1): void {
  ensureCurrentDay();
  bucket.credits += credits;

  const softLimit = Math.floor(DAILY_CREDIT_LIMIT * SOFT_LIMIT_RATIO);

  if (bucket.credits >= softLimit && !bucket.softAlertSent) {
    bucket.softAlertSent = true;
    log.warn(
      { creditsUsed: bucket.credits, softLimit, hardLimit: DAILY_CREDIT_LIMIT },
      'Firecrawl budget soft limit reached (80%)',
    );
  }

  if (bucket.credits >= DAILY_CREDIT_LIMIT) {
    log.error(
      { creditsUsed: bucket.credits, limit: DAILY_CREDIT_LIMIT },
      'Firecrawl budget HARD limit reached — scans will be rejected',
    );
  }

  log.debug(
    { creditsUsed: bucket.credits, remaining: DAILY_CREDIT_LIMIT - bucket.credits },
    'Firecrawl credit recorded',
  );
}
