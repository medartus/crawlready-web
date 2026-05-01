'use client';

import { ArrowLeft, ArrowRight, Check, ChevronRight, Copy, EyeOff, Share2, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ScanForm } from '@/components/score/ScanForm';
import type { RecommendationData, VisualDiffStatsData } from '@/types/scan';

/* ── Score band logic (self-contained for the new design) ──── */

type ScoreBand = {
  label: string;
  colorClass: string;
  ringClass: string;
  bgClass: string;
  barClass: string;
};

const SCORE_BANDS: ScoreBand[] = [
  { label: 'Critical', colorClass: 'text-cr-score-critical', ringClass: 'stroke-cr-score-critical', bgClass: 'bg-cr-score-critical-soft', barClass: 'bg-cr-score-critical' },
  { label: 'Poor', colorClass: 'text-cr-score-poor', ringClass: 'stroke-cr-score-poor', bgClass: 'bg-cr-score-poor-soft', barClass: 'bg-cr-score-poor' },
  { label: 'Fair', colorClass: 'text-cr-score-fair', ringClass: 'stroke-cr-score-fair', bgClass: 'bg-cr-score-fair-soft', barClass: 'bg-cr-score-fair' },
  { label: 'Good', colorClass: 'text-cr-score-good', ringClass: 'stroke-cr-score-good', bgClass: 'bg-cr-score-good-soft', barClass: 'bg-cr-score-good' },
  { label: 'Excellent', colorClass: 'text-cr-score-excellent', ringClass: 'stroke-cr-score-excellent', bgClass: 'bg-cr-score-excellent-soft', barClass: 'bg-cr-score-excellent' },
];

const BAND_MESSAGES: Record<string, string> = {
  Critical: 'This site is invisible to AI crawlers. Immediate action needed.',
  Poor: 'AI crawlers struggle to read this site. Major gaps remain.',
  Fair: 'Partially visible to AI, but significant content is missing.',
  Good: 'Most content is visible to AI crawlers. Minor optimizations left.',
  Excellent: 'Fully optimized for AI crawlers.',
};

function getBand(score: number): ScoreBand {
  if (score <= 20) {
    return SCORE_BANDS[0];
  }
  if (score <= 40) {
    return SCORE_BANDS[1];
  }
  if (score <= 60) {
    return SCORE_BANDS[2];
  }
  if (score <= 80) {
    return SCORE_BANDS[3];
  }
  return SCORE_BANDS[4];
}

/* ── Severity helpers ──────────────────────────────────────── */

function getSeverityIcon(severity: string) {
  if (severity === 'critical' || severity === 'high') {
    return <TriangleAlert className="text-cr-score-critical mt-0.5 size-4 shrink-0" />;
  }
  return <ChevronRight className="text-cr-fg-muted mt-0.5 size-4 shrink-0" />;
}

/* ── Props ─────────────────────────────────────────────────── */

export type ScorePageContentProps = Readonly<{
  domain: string;
  url: string;
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  recommendations: RecommendationData[];
  visualDiffStats: VisualDiffStatsData | null;
  scannedAt: string;
  scoreUrl: string;
  scanId: number;
}>;

/* ── Component ─────────────────────────────────────────────── */

export function ScorePageContent({
  domain,
  url,
  aiReadinessScore,
  crawlabilityScore,
  agentReadinessScore,
  agentInteractionScore,
  recommendations,
  visualDiffStats,
  scannedAt,
  scoreUrl,
  scanId,
}: ScorePageContentProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const band = getBand(aiReadinessScore);
  const message = BAND_MESSAGES[band.label] ?? '';
  const topRecs = recommendations.slice(0, 3);

  const handleShare = async () => {
    const text = `${domain} scored ${aiReadinessScore}/100 on AI Readiness`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url: scoreUrl });
        return;
      } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(`${text} — ${scoreUrl}`);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2200);
    } catch { /* silent */ }
  };

  const visibilityPct = visualDiffStats
    ? Math.round(visualDiffStats.visibilityRatio * 100)
    : null;

  return (
    <div
      className="bg-cr-bg min-h-screen"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-cr-border-subtle bg-cr-bg/80 border-b backdrop-blur-sm">
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
        <section className={`rounded-2xl px-8 pb-8 pt-10 ${band.bgClass}`}>
          {/* Domain */}
          <p className="text-cr-fg-secondary text-center font-mono text-sm tracking-wide">
            {url}
          </p>

          {/* Gauge */}
          <div className="mt-6 flex justify-center">
            <ScoreGauge score={aiReadinessScore} band={band} />
          </div>

          {/* Band label + message */}
          <p className={`mt-4 text-center text-lg font-semibold ${band.colorClass}`}>
            {band.label}
          </p>
          <p className="text-cr-fg-secondary mx-auto mt-1 max-w-md text-center text-sm leading-relaxed">
            {message}
          </p>

          {/* Sub-scores */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <SubScoreIndicator label="Crawlability" score={crawlabilityScore} weight="50%" />
            <SubScoreIndicator label="Agent Readiness" score={agentReadinessScore} weight="25%" />
            <SubScoreIndicator label="Agent Interaction" score={agentInteractionScore} weight="25%" />
          </div>

          {/* Meta line */}
          <div className="border-cr-fg/5 text-cr-fg-muted mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs">
            <span>
              Scanned
              {' '}
              {new Date(scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="hover:text-cr-primary inline-flex items-center gap-1 transition-colors"
            >
              <Copy className="size-3" />
              Copy link
            </button>
          </div>
        </section>

        {/* ── Visual diff one-liner ────────────────────────── */}
        {visibilityPct !== null && (
          <section className="border-cr-border-subtle bg-cr-surface mt-6 flex items-start gap-3 rounded-xl border px-5 py-4">
            <EyeOff className="text-cr-fg-muted mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-cr-fg text-sm">
                AI crawlers see
                {' '}
                <span className="font-semibold tabular-nums">
                  {visibilityPct}
                  %
                </span>
                {' '}
                of this site&apos;s content.
                {visibilityPct < 80 && (
                  <span className="text-cr-fg-secondary">
                    {' '}
                    {100 - visibilityPct}
                    % is invisible to AI.
                  </span>
                )}
              </p>
              <Link
                href={`/scan/${scanId}`}
                className="text-cr-primary hover:text-cr-primary-hover mt-1 inline-flex items-center gap-1 text-xs font-medium transition-colors"
              >
                View visual diff
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </section>
        )}

        {/* ── Top recommendations ──────────────────────────── */}
        {topRecs.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-cr-fg text-sm font-semibold">Top Recommendations</h2>
              {recommendations.length > 3 && (
                <Link
                  href={`/scan/${scanId}`}
                  className="text-cr-primary hover:text-cr-primary-hover text-xs font-medium transition-colors"
                >
                  View all
                  {' '}
                  {recommendations.length}
                  {' '}
                  →
                </Link>
              )}
            </div>

            <div className="divide-cr-border-subtle border-cr-border-subtle bg-cr-surface mt-3 divide-y rounded-xl border">
              {topRecs.map(rec => (
                <div key={rec.id} className="flex items-start gap-3 px-5 py-4">
                  {getSeverityIcon(rec.severity)}
                  <div className="min-w-0 flex-1">
                    <p className="text-cr-fg text-sm font-medium">{rec.title}</p>
                    <p className="text-cr-fg-secondary mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Full report link ─────────────────────────────── */}
        <div className="mt-6 text-center">
          <Link
            href={`/scan/${scanId}`}
            className="text-cr-primary hover:text-cr-primary-hover inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            View detailed report
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* ── CTA: Scan your site ──────────────────────────── */}
        <section className="border-cr-border bg-cr-surface mt-12 rounded-2xl border px-8 py-10 text-center">
          <h2 className="text-cr-fg text-lg font-semibold">
            How does your site score?
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

/* ── Score Gauge (SVG ring) ────────────────────────────────── */

function ScoreGauge({ score, band }: Readonly<{ score: number; band: ScoreBand }>) {
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
          className={`${band.ringClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`text-5xl font-bold tabular-nums leading-none ${band.colorClass}`}
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

function SubScoreIndicator({ label, score, weight }: Readonly<{ label: string; score: number; weight: string }>) {
  const band = getBand(score);
  const pct = Math.max(score, 2);

  return (
    <div className="text-center">
      <p className="text-cr-fg-secondary text-xs font-medium">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${band.colorClass}`}>{score}</p>
      <div className="bg-cr-surface-raised mx-auto mt-2 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${band.barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-cr-fg-muted mt-1.5 text-[10px]">
        {weight}
        {' '}
        weight
      </p>
    </div>
  );
}
