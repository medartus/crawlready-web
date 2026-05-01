'use client';

import { ArrowLeft, Check, Layers, RefreshCw, Share2 } from 'lucide-react';
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

export function ScanResultPageClient({ scan }: Readonly<ScanResultPageClientProps>) {
  const [visualDiff, setVisualDiff] = useState<VisualDiffData | null>(scan.visualDiff);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
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
    const text = `${scan.domain} scored ${scan.aiReadinessScore}/100 on AI Readiness`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url: shareUrl });
        return;
      } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(`${text} — ${shareUrl}`);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2200);
    } catch { /* silent */ }
  };

  return (
    <div className="bg-cr-bg min-h-screen">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-cr-border-subtle bg-cr-bg/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link
            href="/"
            className="text-cr-fg-secondary hover:text-cr-primary inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only sm:not-sr-only">Back</span>
          </Link>

          <Link href="/" className="text-cr-fg text-[15px] font-semibold tracking-tight">
            CrawlReady
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="border-cr-border text-cr-fg-secondary hover:border-cr-primary/30 hover:text-cr-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {shareState === 'copied'
              ? (
                  <>
                    <Check className="size-3.5" />
                    {' '}
                    Copied
                  </>
                )
              : (
                  <>
                    <Share2 className="size-3.5" />
                    {' '}
                    Share
                  </>
                )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        {/* ── Hero: Score ──────────────────────────────────── */}
        <section className={`rounded-2xl px-8 pb-8 pt-10 ${band.bg}`}>
          <p className="text-cr-fg-secondary text-center font-mono text-sm tracking-wide">
            {scan.url}
          </p>

          {/* Gauge */}
          <div className="mt-6 flex justify-center">
            <HeroGauge score={scan.aiReadinessScore} band={band} />
          </div>

          {/* Band label + message */}
          <p className={`mt-4 text-center text-lg font-semibold ${band.color}`}>
            {band.label}
          </p>
          <p className="text-cr-fg-secondary mx-auto mt-1 max-w-md text-center text-sm leading-relaxed">
            {message}
          </p>

          {/* Sub-scores */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <SubScoreIndicator label="Crawlability" score={scan.crawlabilityScore} weight="50%" description={CATEGORY_DESCRIPTIONS.crawlability} />
            <SubScoreIndicator label="Agent Readiness" score={scan.agentReadinessScore} weight="25%" description={CATEGORY_DESCRIPTIONS.agentReadiness} />
            <SubScoreIndicator label="Agent Interaction" score={scan.agentInteractionScore} weight="25%" description={CATEGORY_DESCRIPTIONS.agentInteraction} />
          </div>

          {/* Meta line */}
          <div className="border-cr-fg/5 text-cr-fg-muted mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs">
            <span>
              Scanned
              {' '}
              {new Date(scan.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <Link
              href={`/score/${scan.domain}`}
              className="text-cr-primary hover:text-cr-primary-hover font-medium transition-colors"
            >
              View public score page →
            </Link>
          </div>
        </section>

        {/* ── Warnings ─────────────────────────────────────── */}
        {scan.warnings && scan.warnings.length > 0 && (
          <div className="mt-6">
            <ScanWarnings warnings={scan.warnings} />
          </div>
        )}

        {/* ── Score Breakdown Cards ────────────────────────── */}
        {breakdown
          ? (
              <section className="mt-10">
                <h2 className="text-cr-fg text-sm font-semibold">Score Breakdown</h2>
                <div className="mt-3 space-y-3">
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
              </section>
            )
          : (
              <section className="border-cr-border-subtle bg-cr-surface mt-10 rounded-xl border p-6 text-center">
                <p className="text-cr-fg-secondary text-sm">
                  Detailed score breakdown is available for new scans.
                  {' '}
                  <Link href="/" className="text-cr-primary hover:text-cr-primary-hover font-medium transition-colors">
                    Run a new scan
                  </Link>
                  {' '}
                  to see per-check details.
                </p>
              </section>
            )}

        {/* ── Visual Diff ──────────────────────────────────── */}
        <section className="mt-8">
          {visualDiff
            ? <VisualDiff blocks={visualDiff.blocks} stats={visualDiff.stats} />
            : (
                <div className="border-cr-border-subtle bg-cr-surface overflow-hidden rounded-xl border">
                  <div className="flex items-center gap-4 p-5">
                    <Layers className="text-cr-fg-muted size-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-cr-fg text-[15px] font-semibold">
                        Visual Content Diff
                      </h3>
                      <p className="text-cr-fg-secondary mt-0.5 text-sm">
                        Compares what humans see vs what AI crawlers receive.
                        {' '}
                        <Link
                          href="/"
                          className="text-cr-primary hover:text-cr-primary-hover inline-flex items-center gap-1 font-medium transition-colors"
                        >
                          <RefreshCw className="size-3" />
                          Rescan
                        </Link>
                        {' '}
                        to generate the visual comparison.
                      </p>
                    </div>
                  </div>
                </div>
              )}
        </section>

        {/* ── EU AI Act Checklist ──────────────────────────── */}
        <section className="mt-8">
          <EuAiActChecklist
            passed={scan.euAiAct.passed}
            total={scan.euAiAct.total}
            checks={scan.euAiAct.checks}
          />
        </section>

        {/* ── Schema Preview ───────────────────────────────── */}
        <section className="mt-8">
          <SchemaPreviewCard
            detectedTypes={scan.schemaPreview.detectedTypes}
            generatable={scan.schemaPreview.generatable}
          />
        </section>

        {/* ── Recommendations ──────────────────────────────── */}
        <section className="mt-8">
          <RecommendationsList
            recommendations={
              unlocked
                ? scan.recommendations
                : scan.recommendations.slice(0, FREE_RECOMMENDATION_COUNT)
            }
          />
          {!unlocked && scan.recommendations.length > FREE_RECOMMENDATION_COUNT && (
            <div className="mt-4">
              <EmailGate domain={scan.domain} onUnlocked={() => setUnlocked(true)} />
            </div>
          )}
        </section>

        {/* ── CTA: Scan another URL ────────────────────────── */}
        <section className="border-cr-border bg-cr-surface mt-12 rounded-2xl border px-8 py-10 text-center">
          <h2 className="text-cr-fg text-lg font-semibold">
            Check another site&apos;s AI readiness
          </h2>
          <p className="text-cr-fg-secondary mx-auto mt-2 max-w-sm text-sm">
            Enter any URL for a free, instant AI readiness diagnostic.
          </p>
          <div className="mx-auto mt-6 max-w-lg">
            <ScanForm />
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="border-cr-border-subtle text-cr-fg-muted mt-12 border-t pb-8 pt-6 text-center text-xs">
          <p>
            AI Readiness Score by
            {' '}
            <Link href="/" className="text-cr-fg-secondary hover:text-cr-primary font-medium transition-colors">
              CrawlReady
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}

/* ── Hero Gauge (SVG ring) ─────────────────────────────────── */

type BandInfo = ReturnType<typeof getScoreBand>;

function HeroGauge({ score, band }: Readonly<{ score: number; band: BandInfo }>) {
  const size = 160;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-cr-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${band.ring} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-5xl font-bold tabular-nums leading-none ${band.color}`}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {score}
        </span>
        <span className="text-cr-fg-muted mt-1 text-xs font-medium">/100</span>
      </div>
    </div>
  );
}

/* ── Sub-score indicator ───────────────────────────────────── */

function SubScoreIndicator({ label, score, weight, description }: Readonly<{ label: string; score: number; weight: string; description: string }>) {
  const b = getScoreBand(score);
  const pct = Math.max(score, 2);

  return (
    <div className="text-center">
      <p className="text-cr-fg-secondary text-xs font-medium">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${b.color}`}>{score}</p>
      <div className="bg-cr-surface-raised mx-auto mt-2 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${b.barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-cr-fg-muted mt-1.5 text-[10px]">
        {weight}
        {' '}
        weight
      </p>
      <p className="text-cr-fg-muted mx-auto mt-1 hidden max-w-[160px] text-[10px] leading-tight sm:block">
        {description}
      </p>
    </div>
  );
}
