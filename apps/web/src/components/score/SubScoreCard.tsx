'use client';

import { ChevronDown, ChevronRight, CircleAlert, CircleCheck, CircleMinus, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { SCORE_CHECK_CONTENT } from '@/components/score/check-content';
import { getScoreBand } from '@/components/score/score-utils';
import type { RecommendationData, SubCheckScore, SubScoreBreakdown } from '@/types/scan';

type SubScoreCardProps = {
  breakdown: SubScoreBreakdown;
  categoryKey: string;
  recommendations: RecommendationData[];
  defaultExpanded?: boolean;
};

const STATUS_ICON = {
  pass: CircleCheck,
  partial: CircleMinus,
  fail: CircleAlert,
} as const;

const STATUS_COLOR = {
  pass: 'text-cr-score-excellent',
  partial: 'text-cr-score-fair',
  fail: 'text-cr-score-critical',
} as const;

const STATUS_BAR_COLOR = {
  pass: 'bg-cr-score-excellent',
  partial: 'bg-cr-score-fair',
  fail: 'bg-cr-score-critical',
} as const;

function countIssues(checks: SubCheckScore[]): number {
  return checks.filter(c => c.status !== 'pass').length;
}

function getBorderColor(bandLabel: string): string {
  switch (bandLabel) {
    case 'Critical': return 'border-cr-score-critical/40';
    case 'Poor': return 'border-cr-score-poor/40';
    case 'Fair': return 'border-cr-score-fair/40';
    case 'Good': return 'border-cr-score-good/40';
    default: return 'border-cr-score-excellent/40';
  }
}

export function SubScoreCard({
  breakdown,
  categoryKey,
  recommendations,
  defaultExpanded = false,
}: SubScoreCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const band = getScoreBand(breakdown.score);
  const issueCount = countIssues(breakdown.checks);

  return (
    <div className="border-cr-border-subtle bg-cr-surface overflow-hidden rounded-xl border">
      {/* Card Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-cr-surface-raised flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors"
      >
        {/* Score circle */}
        <div className={`flex size-14 shrink-0 items-center justify-center rounded-full border-2 ${getBorderColor(band.label)}`}>
          <span className={`text-lg font-bold ${band.color}`}>{breakdown.score}</span>
        </div>

        {/* Label + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-cr-fg text-base font-semibold">
              {breakdown.label}
            </h3>
            <span className="text-cr-fg-muted text-xs">
              (
              {breakdown.weight}
              )
            </span>
          </div>
          <p className="text-cr-fg-secondary mt-0.5 text-sm">
            {issueCount === 0
              ? 'All checks passing'
              : `${issueCount} issue${issueCount > 1 ? 's' : ''} found`}
            {recommendations.length > 0 && ` · ${recommendations.length} recommendation${recommendations.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Score bar (compact) */}
        <div className="hidden w-24 sm:block">
          <div className="bg-cr-surface-raised h-2 overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${band.barColor}`}
              style={{ width: `${Math.max(breakdown.score, 2)}%` }}
            />
          </div>
          <div className={`mt-1 text-right text-xs font-medium ${band.color}`}>
            {breakdown.score}
            /100
          </div>
        </div>

        {/* Expand icon */}
        {expanded
          ? <ChevronDown className="text-cr-fg-muted size-5 shrink-0" />
          : <ChevronRight className="text-cr-fg-muted size-5 shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-cr-border-subtle border-t">
          <div className="divide-cr-border-subtle divide-y">
            {breakdown.checks.map(check => (
              <CheckRow
                key={check.id}
                check={check}
                categoryKey={categoryKey}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckRow({ check, categoryKey: _categoryKey }: { check: SubCheckScore; categoryKey: string }) {
  const content = SCORE_CHECK_CONTENT[check.id];
  const StatusIcon = STATUS_ICON[check.status];
  const pct = check.maxScore > 0 ? Math.round((check.score / check.maxScore) * 100) : 0;
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        <StatusIcon className={`mt-0.5 size-5 shrink-0 ${STATUS_COLOR[check.status]}`} />
        <div className="min-w-0 flex-1">
          {/* Check label + score */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-cr-fg text-sm font-medium">
              {check.label}
            </span>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${STATUS_COLOR[check.status]}`}>
              {check.score}
              /
              {check.maxScore}
            </span>
          </div>

          {/* Progress bar */}
          <div className="bg-cr-surface-raised mt-2 h-1.5 overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${STATUS_BAR_COLOR[check.status]}`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>

          {/* Description */}
          {content && (
            <p className="text-cr-fg-muted mt-2 text-xs">
              {content.description}
            </p>
          )}

          {/* Fix hint — show on failing/partial checks */}
          {content && check.status !== 'pass' && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-cr-primary hover:text-cr-primary-hover inline-flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors"
              >
                {showHint ? 'Hide' : 'How to fix'}
              </button>
              {showHint && (
                <div className="bg-cr-primary-soft text-cr-primary mt-2 rounded-lg px-3 py-2 text-xs">
                  {content.fixHint}
                  {content.learnMoreUrl && (
                    <a
                      href={content.learnMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 inline-flex items-center gap-0.5 font-medium underline"
                    >
                      Learn more
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
