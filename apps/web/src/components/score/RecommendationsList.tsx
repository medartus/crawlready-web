'use client';

import { AlertTriangle, ChevronDown, ChevronRight, Info, Lightbulb, OctagonAlert } from 'lucide-react';
import { useState } from 'react';

import type { RecommendationData } from '@/types/scan';

type RecommendationsListProps = {
  recommendations: RecommendationData[];
};

type SeverityConfig = {
  icon: typeof OctagonAlert;
  bg: string;
  border: string;
  badge: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  crawlability: 'Crawlability',
  agentReadiness: 'Agent Readiness',
  agent_readiness: 'Agent Readiness',
  agentInteraction: 'Agent Interaction',
  agent_interaction: 'Agent Interaction',
};

function getConfig(severity: string): SeverityConfig {
  switch (severity) {
    case 'critical':
      return {
        icon: OctagonAlert,
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-800',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      };
    default:
      return {
        icon: Info,
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      };
  }
}

function groupByCategory(recs: RecommendationData[]): Record<string, RecommendationData[]> {
  const groups: Record<string, RecommendationData[]> = {};
  for (const rec of recs) {
    const key = rec.category || 'other';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(rec);
  }
  return groups;
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const [expanded, setExpanded] = useState(false);

  if (recommendations.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          No recommendations — your site is well-optimized for AI crawlers!
        </p>
      </div>
    );
  }

  const criticalCount = recommendations.filter(r => r.severity === 'critical').length;
  const warningCount = recommendations.filter(r => r.severity === 'warning').length;
  const grouped = groupByCategory(recommendations);
  const categoryOrder = ['crawlability', 'agentReadiness', 'agent_readiness', 'agentInteraction', 'agent_interaction', 'other'];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Lightbulb className="size-5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Recommendations
            </h3>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {recommendations.length}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {criticalCount > 0 && `${criticalCount} critical`}
            {criticalCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
            {criticalCount === 0 && warningCount === 0 && `${recommendations.length} suggestion${recommendations.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="size-5 shrink-0 text-gray-400" />
          : <ChevronRight className="size-5 shrink-0 text-gray-400" />}
      </button>

      {/* Expanded: grouped recommendations */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          {sortedCategories.map(category => (
            <div key={category}>
              {/* Category header */}
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-2 dark:border-gray-700 dark:bg-gray-900/50">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
              </div>
              {/* Recommendations in this category */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {grouped[category]!.map(rec => (
                  <RecommendationRow key={rec.id} rec={rec} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationRow({ rec }: { rec: RecommendationData }) {
  const config = getConfig(rec.severity);
  const Icon = config.icon;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 opacity-70" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {rec.title}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
              {rec.severity}
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
}
