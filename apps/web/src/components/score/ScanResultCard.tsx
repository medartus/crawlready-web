'use client';

import { Share2 } from 'lucide-react';

import { EuAiActChecklist } from './EuAiActChecklist';
import { RecommendationsList } from './RecommendationsList';
import { getScoreBand, SCORE_MESSAGES } from './score-utils';
import { ScoreGauge } from './ScoreGauge';
import { SubScoreBars } from './SubScoreBars';

type ScanResultData = {
  url: string;
  domain: string;
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  euAiAct: {
    passed: number;
    total: number;
    checks: Array<{ name: string; passed: boolean }>;
  };
  recommendations: Array<{
    id: string;
    severity: string;
    category: string;
    title: string;
    description: string;
    impact: string;
  }>;
  scannedAt: string;
  scoreUrl?: string;
};

type ScanResultCardProps = {
  result: ScanResultData;
};

export function ScanResultCard({ result }: ScanResultCardProps) {
  const band = getScoreBand(result.aiReadinessScore);
  const message = SCORE_MESSAGES[band.label] ?? '';

  const handleShare = async () => {
    const shareUrl = result.scoreUrl ?? `https://crawlready.app/score/${result.domain}`;
    const text = `${result.domain} scored ${result.aiReadinessScore}/100 on AI Readiness! Check yours:`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'AI Readiness Score', text, url: shareUrl });
      } catch {
        await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`rounded-2xl p-8 ${band.bg}`}>
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Score gauge */}
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={result.aiReadinessScore} size="lg" label="AI Readiness" />
            <p className="mt-2 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>

          {/* Sub-scores */}
          <div className="w-full max-w-md">
            <SubScoreBars
              crawlability={result.crawlabilityScore}
              agentReadiness={result.agentReadinessScore}
              agentInteraction={result.agentInteractionScore}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-mono">{result.domain}</span>
            {' · '}
            Scanned
            {' '}
            {new Date(result.scannedAt).toLocaleDateString()}
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>
      </div>

      {/* EU AI Act */}
      <EuAiActChecklist
        passed={result.euAiAct.passed}
        total={result.euAiAct.total}
        checks={result.euAiAct.checks}
      />

      {/* Recommendations */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Recommendations
        </h3>
        <RecommendationsList recommendations={result.recommendations} />
      </div>
    </div>
  );
}
