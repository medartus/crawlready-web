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
  pass: 'text-emerald-500',
  partial: 'text-amber-500',
  fail: 'text-red-500',
} as const;

const STATUS_BAR_COLOR = {
  pass: 'bg-emerald-500',
  partial: 'bg-amber-500',
  fail: 'bg-red-500',
} as const;

function countIssues(checks: SubCheckScore[]): number {
  return checks.filter(c => c.status !== 'pass').length;
}

function getBorderColor(color: string): string {
  if (color === 'text-red-600 dark:text-red-400') {
    return 'border-red-300 dark:border-red-700';
  }
  if (color === 'text-orange-600 dark:text-orange-400') {
    return 'border-orange-300 dark:border-orange-700';
  }
  if (color === 'text-yellow-600 dark:text-yellow-400') {
    return 'border-yellow-300 dark:border-yellow-700';
  }
  if (color === 'text-green-600 dark:text-green-400') {
    return 'border-green-300 dark:border-green-700';
  }
  return 'border-emerald-300 dark:border-emerald-700';
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Card Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {/* Score circle */}
        <div className={`flex size-14 shrink-0 items-center justify-center rounded-full border-2 ${getBorderColor(band.color)}`}>
          <span className={`text-lg font-bold ${band.color}`}>{breakdown.score}</span>
        </div>

        {/* Label + description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {breakdown.label}
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (
              {breakdown.weight}
              )
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {issueCount === 0
              ? 'All checks passing'
              : `${issueCount} issue${issueCount > 1 ? 's' : ''} found`}
            {recommendations.length > 0 && ` · ${recommendations.length} recommendation${recommendations.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Score bar (compact) */}
        <div className="hidden w-24 sm:block">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
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
          ? <ChevronDown className="size-5 shrink-0 text-gray-400" />
          : <ChevronRight className="size-5 shrink-0 text-gray-400" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {check.label}
            </span>
            <span className={`shrink-0 text-sm font-semibold tabular-nums ${STATUS_COLOR[check.status]}`}>
              {check.score}
              /
              {check.maxScore}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${STATUS_BAR_COLOR[check.status]}`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          </div>

          {/* Description */}
          {content && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {content.description}
            </p>
          )}

          {/* Fix hint — show on failing/partial checks */}
          {content && check.status !== 'pass' && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {showHint ? 'Hide' : 'How to fix'}
              </button>
              {showHint && (
                <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
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
