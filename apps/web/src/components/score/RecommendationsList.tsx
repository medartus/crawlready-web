'use client';

import { AlertTriangle, ArrowUpCircle, Info, XOctagon } from 'lucide-react';

type Recommendation = {
  id: string;
  severity: string;
  category: string;
  title: string;
  description: string;
  impact: string;
};

type RecommendationsListProps = {
  recommendations: Recommendation[];
};

const SEVERITY_CONFIG = {
  critical: {
    icon: XOctagon,
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
  high: {
    icon: AlertTriangle,
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  },
  medium: {
    icon: ArrowUpCircle,
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  low: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  },
} as const;

function getConfig(severity: string) {
  return SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.low;
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
        <div className="mb-2 text-4xl">
          &#10024;
        </div>
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">
          No recommendations — your site is well optimized!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const config = getConfig(rec.severity);
        const Icon = config.icon;

        return (
          <div
            key={rec.id}
            className={`rounded-lg border p-4 ${config.bg} ${config.border}`}
          >
            <div className="mb-2 flex items-start gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 opacity-70" />
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {rec.title}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                    {rec.severity}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {rec.category}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {rec.description}
                </p>
                {rec.impact && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Impact:
                    {' '}
                    {rec.impact}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
