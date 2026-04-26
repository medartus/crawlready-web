/**
 * Composite AI Readiness Score (0-100)
 *
 * Formula: 50% Crawlability + 25% Agent Readiness + 25% Agent Interaction
 * Floor rule: if any sub-score < 20, cap at 60.
 *
 * See docs/architecture/scoring-detail.md § Unified AI Readiness Score.
 */

export type CompositeScoreResult = {
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  floorCapped: boolean;
};

export function computeCompositeScore(
  crawlability: number,
  agentReadiness: number,
  agentInteraction: number,
): CompositeScoreResult {
  const weighted = (0.5 * crawlability)
    + (0.25 * agentReadiness)
    + (0.25 * agentInteraction);

  const anyBelowFloor = crawlability < 20
    || agentReadiness < 20
    || agentInteraction < 20;

  const capped = anyBelowFloor ? Math.min(weighted, 60) : weighted;
  const score = Math.round(capped);

  return {
    aiReadinessScore: score,
    crawlabilityScore: crawlability,
    agentReadinessScore: agentReadiness,
    agentInteractionScore: agentInteraction,
    floorCapped: anyBelowFloor && weighted > 60,
  };
}
