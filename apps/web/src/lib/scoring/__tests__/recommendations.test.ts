import { describe, expect, it } from 'vitest';

import type { AgentInteractionResult } from '../agent-interaction';
import type { AgentReadinessResult } from '../agent-readiness';
import type { CrawlabilityResult } from '../crawlability';
import { generateRecommendations } from '../recommendations';

function makeResults(overrides: {
  crawlability?: Partial<CrawlabilityResult>;
  agentReadiness?: Partial<AgentReadinessResult>;
  agentInteraction?: Partial<AgentInteractionResult>;
} = {}) {
  return {
    crawlability: {
      score: 80,
      c1ContentVisibility: 35,
      c2StructuralClarity: 20,
      c3NoiseRatio: 14,
      c4SchemaPresence: 15,
      details: { visibilityRatio: 0.95, renderedTextLength: 1000, botTextLength: 950, noiseRatio: 0.5, jsonLdCount: 2 },
      ...overrides.crawlability,
    } as CrawlabilityResult,
    agentReadiness: {
      score: 60,
      a1StructuredData: 18,
      a2ContentNegotiation: 15,
      a3MachineActionable: 20,
      a4StandardsAdoption: 12,
      ...overrides.agentReadiness,
    } as AgentReadinessResult,
    agentInteraction: {
      score: 70,
      i1SemanticHtml: 20,
      i2Accessibility: 25,
      i3Navigation: 15,
      i4VisualSemantic: 15,
      ...overrides.agentInteraction,
    } as AgentInteractionResult,
  };
}

describe('generateRecommendations', () => {
  it('returns no recommendations for a well-scored page', () => {
    const recs = generateRecommendations(makeResults());

    expect(recs.length).toBe(0);
  });

  it('flags critical visibility issue when C1 is 0', () => {
    const recs = generateRecommendations(makeResults({
      crawlability: { c1ContentVisibility: 0 },
    }));
    const c1Rec = recs.find(r => r.id === 'c1-low-visibility');

    expect(c1Rec).toBeDefined();
    expect(c1Rec!.severity).toBe('critical');
    expect(c1Rec!.category).toBe('crawlability');
  });

  it('flags high severity when C1 is low but non-zero', () => {
    const recs = generateRecommendations(makeResults({
      crawlability: { c1ContentVisibility: 8 },
    }));
    const c1Rec = recs.find(r => r.id === 'c1-low-visibility');

    expect(c1Rec).toBeDefined();
    expect(c1Rec!.severity).toBe('high');
  });

  it('sorts recommendations by severity (critical first)', () => {
    const recs = generateRecommendations(makeResults({
      crawlability: { c1ContentVisibility: 0, c4SchemaPresence: 0 },
      agentReadiness: { a1StructuredData: 5 },
      agentInteraction: { i2Accessibility: 10 },
    }));

    expect(recs.length).toBeGreaterThanOrEqual(3);
    expect(recs[0]!.severity).toBe('critical');
  });

  it('generates recommendations for each low sub-check', () => {
    const recs = generateRecommendations(makeResults({
      crawlability: { c1ContentVisibility: 0, c2StructuralClarity: 5, c3NoiseRatio: 0, c4SchemaPresence: 0 },
      agentReadiness: { a1StructuredData: 5, a2ContentNegotiation: 5, a3MachineActionable: 5, a4StandardsAdoption: 3 },
      agentInteraction: { i1SemanticHtml: 5, i2Accessibility: 10, i3Navigation: 5, i4VisualSemantic: 5 },
    }));

    expect(recs.length).toBeGreaterThanOrEqual(8);
  });
});
