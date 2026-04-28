'use client';

import { ArrowLeft, Layers, RefreshCw, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CATEGORY_DESCRIPTIONS } from '@/components/score/check-content';
import { EmailGate } from '@/components/score/EmailGate';
import { EuAiActChecklist } from '@/components/score/EuAiActChecklist';
import { RecommendationsList } from '@/components/score/RecommendationsList';
import { ScanForm } from '@/components/score/ScanForm';
import { ScanWarnings } from '@/components/score/ScanWarnings';
import { SchemaPreviewCard } from '@/components/score/SchemaPreviewCard';
import { getScoreBand, SCORE_MESSAGES } from '@/components/score/score-utils';
import { ScoreGauge } from '@/components/score/ScoreGauge';
import { SubScoreBars } from '@/components/score/SubScoreBars';
import { SubScoreCard } from '@/components/score/SubScoreCard';
import { VisualDiff } from '@/components/score/VisualDiff';
import type { ScanResultData, VisualDiffData } from '@/types/scan';

type ScanResultPageClientProps = {
  scan: ScanResultData;
};

const FREE_RECOMMENDATION_COUNT = 3;

function getRecsForCategory(recs: ScanResultData['recommendations'], category: string) {
  return recs.filter(r =>
    r.category === category
    || r.category === category.replaceAll(/[A-Z]/g, m => `_${m.toLowerCase()}`),
  );
}

export function ScanResultPageClient({ scan }: ScanResultPageClientProps) {
  const [visualDiff, setVisualDiff] = useState<VisualDiffData | null>(scan.visualDiff);
  const [shareText, setShareText] = useState('Share');
  const [unlocked, setUnlocked] = useState(false);
  const band = getScoreBand(scan.aiReadinessScore);
  const message = SCORE_MESSAGES[band.label] ?? '';
  const breakdown = scan.scoreBreakdown;

  // Override with sessionStorage if available (fresher data from just-completed scan)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('scanResult');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === scan.id && parsed.visualDiff) {
          setVisualDiff(parsed.visualDiff);
          sessionStorage.removeItem('scanResult');
        }
      }
    } catch {
      // sessionStorage not available or invalid data
    }
  }, [scan.id]);

  const handleShare = async () => {
    const shareUrl = scan.scoreUrl;
    const text = `${scan.domain} scored ${scan.aiReadinessScore}/100 on AI Readiness! Check yours:`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'AI Readiness Score', text, url: shareUrl });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${shareUrl}`);
      setShareText('Copied!');
      setTimeout(() => setShareText('Share'), 2000);
    } catch {
      // Clipboard failed silently
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            CrawlReady
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <Share2 className="size-4" />
            {shareText}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {/* ── Executive Summary ──────────────────────────────── */}
        <div className={`rounded-2xl p-8 ${band.bg}`}>
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={scan.aiReadinessScore} size="lg" label="AI Readiness" />
              <p className="mt-2 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
            <div className="w-full max-w-md space-y-4">
              <SubScoreBars
                crawlability={scan.crawlabilityScore}
                agentReadiness={scan.agentReadinessScore}
                agentInteraction={scan.agentInteractionScore}
              />
              {/* Summary sentences */}
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                <p>{CATEGORY_DESCRIPTIONS.crawlability}</p>
                <p>{CATEGORY_DESCRIPTIONS.agentReadiness}</p>
                <p>{CATEGORY_DESCRIPTIONS.agentInteraction}</p>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-mono">{scan.url}</span>
              {' · '}
              Scanned
              {' '}
              {new Date(scan.scannedAt).toLocaleDateString()}
            </div>
            <Link
              href={`/score/${scan.domain}`}
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View public score page →
            </Link>
          </div>
        </div>

        {/* Warnings */}
        {scan.warnings && scan.warnings.length > 0 && (
          <ScanWarnings warnings={scan.warnings} />
        )}

        {/* ── Score Breakdown Cards ─────────────────────────── */}
        {breakdown
          ? (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Score Breakdown
                </h2>
                <SubScoreCard
                  breakdown={breakdown.crawlability}
                  categoryKey="crawlability"
                  recommendations={getRecsForCategory(scan.recommendations, 'crawlability')}
                  defaultExpanded={breakdown.crawlability.score < 60}
                />
                <SubScoreCard
                  breakdown={breakdown.agentReadiness}
                  categoryKey="agentReadiness"
                  recommendations={getRecsForCategory(scan.recommendations, 'agentReadiness')}
                  defaultExpanded={breakdown.agentReadiness.score < 60}
                />
                <SubScoreCard
                  breakdown={breakdown.agentInteraction}
                  categoryKey="agentInteraction"
                  recommendations={getRecsForCategory(scan.recommendations, 'agentInteraction')}
                  defaultExpanded={breakdown.agentInteraction.score < 60}
                />
              </div>
            )
          : (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Detailed score breakdown is available for new scans.
                  {' '}
                  <Link
                    href="/"
                    className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Run a new scan
                  </Link>
                  {' '}
                  to see per-check details.
                </p>
              </div>
            )}

        {/* ── Visual Diff ───────────────────────────────────── */}
        {visualDiff
          ? (
              <VisualDiff blocks={visualDiff.blocks} stats={visualDiff.stats} />
            )
          : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center gap-4 p-5">
                  <Layers className="size-5 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Visual Content Diff
                    </h3>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      Compares what humans see vs what AI crawlers receive.
                      {' '}
                      <Link
                        href="/"
                        className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <RefreshCw className="mr-1 inline-block size-3" />
                        Rescan
                      </Link>
                      {' '}
                      to generate the visual comparison.
                    </p>
                  </div>
                </div>
              </div>
            )}

        {/* ── EU AI Act Checklist ────────────────────────────── */}
        <EuAiActChecklist
          passed={scan.euAiAct.passed}
          total={scan.euAiAct.total}
          checks={scan.euAiAct.checks}
        />

        {/* ── Schema Preview ────────────────────────────────── */}
        <SchemaPreviewCard
          detectedTypes={scan.schemaPreview.detectedTypes}
          generatable={scan.schemaPreview.generatable}
        />

        {/* ── Recommendations ───────────────────────────────── */}
        <RecommendationsList
          recommendations={
            unlocked
              ? scan.recommendations
              : scan.recommendations.slice(0, FREE_RECOMMENDATION_COUNT)
          }
        />
        {!unlocked && scan.recommendations.length > FREE_RECOMMENDATION_COUNT && (
          <EmailGate domain={scan.domain} onUnlocked={() => setUnlocked(true)} />
        )}

        {/* ── CTA: Scan another URL ─────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
            Check another site&apos;s AI readiness
          </h3>
          <div className="mx-auto max-w-xl">
            <ScanForm />
          </div>
        </div>
      </main>
    </div>
  );
}
