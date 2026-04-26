import { describe, expect, it } from 'vitest';

import { computeCompositeScore } from '../composite';

describe('computeCompositeScore', () => {
  it('computes weighted average: 50% crawl + 25% agent + 25% interaction', () => {
    const result = computeCompositeScore(80, 60, 40);

    // 0.5*80 + 0.25*60 + 0.25*40 = 40 + 15 + 10 = 65
    expect(result.aiReadinessScore).toBe(65);
    expect(result.floorCapped).toBe(false);
  });

  it('caps at 60 when any sub-score is below 20 (floor rule)', () => {
    const result = computeCompositeScore(90, 10, 80);

    // 0.5*90 + 0.25*10 + 0.25*80 = 45 + 2.5 + 20 = 67.5 → capped to 60
    expect(result.aiReadinessScore).toBe(60);
    expect(result.floorCapped).toBe(true);
  });

  it('does not cap when weighted average is already below 60', () => {
    const result = computeCompositeScore(30, 10, 20);

    // 0.5*30 + 0.25*10 + 0.25*20 = 15 + 2.5 + 5 = 22.5 → rounds to 23
    expect(result.aiReadinessScore).toBe(23);
    expect(result.floorCapped).toBe(false);
  });

  it('returns perfect 100 for all-100 inputs', () => {
    const result = computeCompositeScore(100, 100, 100);

    expect(result.aiReadinessScore).toBe(100);
  });

  it('returns 0 for all-zero inputs', () => {
    const result = computeCompositeScore(0, 0, 0);

    expect(result.aiReadinessScore).toBe(0);
  });

  it('preserves individual sub-scores in result', () => {
    const result = computeCompositeScore(72, 45, 88);

    expect(result.crawlabilityScore).toBe(72);
    expect(result.agentReadinessScore).toBe(45);
    expect(result.agentInteractionScore).toBe(88);
  });

  it('rounds to nearest integer', () => {
    const result = computeCompositeScore(71, 51, 33);

    // 0.5*71 + 0.25*51 + 0.25*33 = 35.5 + 12.75 + 8.25 = 56.5 → 57
    expect(result.aiReadinessScore).toBe(57);
  });
});
