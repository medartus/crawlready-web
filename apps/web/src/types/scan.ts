/**
 * Shared scan result types used across API routes, pages, and components.
 *
 * Single source of truth — avoids inline casts scattered across files.
 */

export type EuAiActData = {
  passed: number;
  total: number;
  checks: Array<{ name: string; passed: boolean }>;
};

export type RecommendationData = {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  impact: string;
};

export type SchemaPreviewData = {
  detectedTypes: Array<{ type: string; properties: number }>;
  generatable: Array<{ type: string; confidence: number; reason: string }>;
};

export type VisualDiffBlockData = {
  text: string;
  inBotView: boolean;
  inRenderedView: boolean;
  status: 'visible' | 'js-invisible' | 'bot-only';
};

export type VisualDiffStatsData = {
  renderedBlockCount: number;
  botBlockCount: number;
  jsInvisibleCount: number;
  botOnlyCount: number;
  visibilityRatio: number;
  renderedTextLength: number;
  botTextLength: number;
};

export type VisualDiffData = {
  blocks: VisualDiffBlockData[];
  stats: VisualDiffStatsData;
};

export type ScanWarningData = {
  code: string;
  message: string;
};

export type SubCheckScore = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  status: 'pass' | 'partial' | 'fail';
};

export type SubScoreBreakdown = {
  label: string;
  score: number;
  weight: string;
  checks: SubCheckScore[];
};

export type ScoreBreakdown = {
  crawlability: SubScoreBreakdown;
  agentReadiness: SubScoreBreakdown;
  agentInteraction: SubScoreBreakdown;
};

export type ScanResultData = {
  id: number;
  url: string;
  domain: string;
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  euAiAct: EuAiActData;
  recommendations: RecommendationData[];
  schemaPreview: SchemaPreviewData;
  visualDiff: VisualDiffData | null;
  rawHtmlSize: number | null;
  markdownSize: number | null;
  scannedAt: string;
  scoreUrl: string;
  warnings: ScanWarningData[];
  scoreBreakdown: ScoreBreakdown | null;
};
