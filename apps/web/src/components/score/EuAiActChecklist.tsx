'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

type Check = {
  name: string;
  passed: boolean;
};

type EuAiActChecklistProps = {
  passed: number;
  total: number;
  checks: Check[];
};

const LABELS: Record<string, string> = {
  content_provenance: 'Content Provenance',
  content_transparency: 'Content Transparency',
  machine_readable_marking: 'Machine-Readable Marking',
  structured_data_provenance: 'Structured Data Provenance',
};

export function EuAiActChecklist({ passed, total, checks }: EuAiActChecklistProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          EU AI Act Transparency
        </h3>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${
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
      <div className="space-y-3">
        {checks.map(check => (
          <div key={check.name} className="flex items-center gap-3">
            {check.passed
              ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
              : <XCircle className="size-5 shrink-0 text-red-400" />}
            <span className={`text-sm ${check.passed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
              {LABELS[check.name] ?? check.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
