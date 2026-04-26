'use client';

import { ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { EmailGate } from '@/components/score/EmailGate';
import { EuAiActChecklist } from '@/components/score/EuAiActChecklist';
import { RecommendationsList } from '@/components/score/RecommendationsList';
import { ScanForm } from '@/components/score/ScanForm';
import { SchemaPreviewCard } from '@/components/score/SchemaPreviewCard';
import { getScoreBand, SCORE_MESSAGES } from '@/components/score/score-utils';
import { ScoreGauge } from '@/components/score/ScoreGauge';
import { SubScoreBars } from '@/components/score/SubScoreBars';
import { VisualDiff } from '@/components/score/VisualDiff';

type VisualDiffData = {
  blocks: Array<{
    text: string;
    inBotView: boolean;
    inRenderedView: boolean;
    status: 'visible' | 'js-invisible' | 'bot-only';
  }>;
  stats: {
    renderedBlockCount: number;
    botBlockCount: number;
    jsInvisibleCount: number;
    botOnlyCount: number;
    visibilityRatio: number;
    renderedTextLength: number;
    botTextLength: number;
  };
};

type ScanData = {
  id: number;
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
  schemaPreview: {
    detectedTypes: Array<{ type: string; properties: number }>;
    generatable: Array<{ type: string; confidence: number; reason: string }>;
  };
  rawHtmlSize: number | null;
  markdownSize: number | null;
  scannedAt: string;
  scoreUrl: string;
};

type ScanResultPageClientProps = {
  scan: ScanData;
};

const FREE_RECOMMENDATION_COUNT = 3;

export function ScanResultPageClient({ scan }: ScanResultPageClientProps) {
  const [visualDiff, setVisualDiff] = useState<VisualDiffData | null>(null);
  const [shareText, setShareText] = useState('Share');
  const [unlocked, setUnlocked] = useState(false);
  const band = getScoreBand(scan.aiReadinessScore);
  const message = SCORE_MESSAGES[band.label] ?? '';

  // Try to load visual diff from sessionStorage (only available right after a scan)
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('scanResult');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id === scan.id && parsed.visualDiff) {
          setVisualDiff(parsed.visualDiff);
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

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {/* Headline Score */}
        <div className={`rounded-2xl p-8 ${band.bg}`}>
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            <div className="flex flex-col items-center gap-2">
              <ScoreGauge score={scan.aiReadinessScore} size="lg" label="AI Readiness" />
              <p className="mt-2 max-w-xs text-center text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
            <div className="w-full max-w-md">
              <SubScoreBars
                crawlability={scan.crawlabilityScore}
                agentReadiness={scan.agentReadinessScore}
                agentInteraction={scan.agentInteractionScore}
              />
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

        {/* Visual Diff */}
        {visualDiff
          ? (
              <VisualDiff blocks={visualDiff.blocks} stats={visualDiff.stats} />
            )
          : (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visual diff is only available immediately after scanning.
                  {' '}
                  <Link
                    href="/"
                    className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    Run a new scan
                  </Link>
                  {' '}
                  to see the side-by-side comparison.
                </p>
              </div>
            )}

        {/* EU AI Act Checklist */}
        <EuAiActChecklist
          passed={scan.euAiAct.passed}
          total={scan.euAiAct.total}
          checks={scan.euAiAct.checks}
        />

        {/* Schema Preview */}
        <SchemaPreviewCard
          detectedTypes={scan.schemaPreview.detectedTypes}
          generatable={scan.schemaPreview.generatable}
        />

        {/* Recommendations — top 3 free, rest behind email gate */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recommendations
            {scan.recommendations.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                (
                {scan.recommendations.length}
                {' '}
                total)
              </span>
            )}
          </h3>
          <RecommendationsList
            recommendations={
              unlocked
                ? scan.recommendations
                : scan.recommendations.slice(0, FREE_RECOMMENDATION_COUNT)
            }
          />
          {!unlocked && scan.recommendations.length > FREE_RECOMMENDATION_COUNT && (
            <div className="mt-6">
              <EmailGate domain={scan.domain} onUnlocked={() => setUnlocked(true)} />
            </div>
          )}
        </div>

        {/* CTA: Scan another URL */}
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
