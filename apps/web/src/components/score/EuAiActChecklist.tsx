'use client';

import { CheckCircle2, ChevronDown, ChevronRight, ExternalLink, Shield, XCircle } from 'lucide-react';
import { useState } from 'react';

import { EU_AI_ACT_CONTENT } from '@/components/score/check-content';

type Check = {
  name: string;
  passed: boolean;
};

type EuAiActChecklistProps = {
  passed: number;
  total: number;
  checks: Check[];
};

export function EuAiActChecklist({ passed, total, checks }: EuAiActChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const failingChecks = checks.filter(c => !c.passed);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Shield className="size-5 shrink-0 text-indigo-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              EU AI Act Transparency
            </h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              passed === total
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            }`}
            >
              {passed}
              /
              {total}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {passed === total
              ? 'All transparency checks passing'
              : `${failingChecks.length} check${failingChecks.length > 1 ? 's' : ''} need attention`}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="size-5 shrink-0 text-gray-400" />
          : <ChevronRight className="size-5 shrink-0 text-gray-400" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {/* Intro */}
          <div className="border-b border-gray-100 px-5 py-3 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The EU AI Act (Article 50) requires transparency about AI-generated content.
              These checks verify whether your site provides the metadata AI systems need.
            </p>
          </div>

          {/* Check rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {checks.map(check => (
              <EuAiActCheckRow key={check.name} check={check} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EuAiActCheckRow({ check }: { check: Check }) {
  const content = EU_AI_ACT_CONTENT[check.name];
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        {check.passed
          ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
          : <XCircle className="mt-0.5 size-5 shrink-0 text-red-400" />}
        <div className="min-w-0 flex-1">
          <span className={`text-sm font-medium ${check.passed ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
            {content?.label ?? check.name}
          </span>
          {content && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {content.description}
            </p>
          )}
          {content && !check.passed && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {showHint ? 'Hide fix' : 'How to fix'}
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
