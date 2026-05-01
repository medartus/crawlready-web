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
    <div className="border-cr-border-subtle bg-cr-surface overflow-hidden rounded-xl border">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-cr-surface-raised flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors"
      >
        <Shield className="text-cr-primary size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-cr-fg text-base font-semibold">
              EU AI Act Transparency
            </h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              passed === total
                ? 'bg-cr-score-excellent-soft text-cr-score-excellent'
                : 'bg-cr-score-fair-soft text-cr-score-fair'
            }`}
            >
              {passed}
              /
              {total}
            </span>
          </div>
          <p className="text-cr-fg-secondary mt-0.5 text-sm">
            {passed === total
              ? 'All transparency checks passing'
              : `${failingChecks.length} check${failingChecks.length > 1 ? 's' : ''} need attention`}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="text-cr-fg-muted size-5 shrink-0" />
          : <ChevronRight className="text-cr-fg-muted size-5 shrink-0" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-cr-border-subtle border-t">
          {/* Intro */}
          <div className="border-cr-border-subtle border-b px-5 py-3">
            <p className="text-cr-fg-muted text-xs">
              The EU AI Act (Article 50) requires transparency about AI-generated content.
              These checks verify whether your site provides the metadata AI systems need.
            </p>
          </div>

          {/* Check rows */}
          <div className="divide-cr-border-subtle divide-y">
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
          ? <CheckCircle2 className="text-cr-score-excellent mt-0.5 size-5 shrink-0" />
          : <XCircle className="text-cr-score-critical mt-0.5 size-5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <span className={`text-sm font-medium ${check.passed ? 'text-cr-fg' : 'text-cr-fg-secondary'}`}>
            {content?.label ?? check.name}
          </span>
          {content && (
            <p className="text-cr-fg-muted mt-1 text-xs">
              {content.description}
            </p>
          )}
          {content && !check.passed && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-cr-primary hover:text-cr-primary-hover inline-flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors"
              >
                {showHint ? 'Hide fix' : 'How to fix'}
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
