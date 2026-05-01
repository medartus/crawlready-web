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
        bg: 'bg-cr-score-critical-soft',
        border: 'border-cr-score-critical/20',
        badge: 'bg-cr-score-critical-soft text-cr-score-critical',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bg: 'bg-cr-score-fair-soft',
        border: 'border-cr-score-fair/20',
        badge: 'bg-cr-score-fair-soft text-cr-score-fair',
      };
    default:
      return {
        icon: Info,
        bg: 'bg-cr-primary-soft',
        border: 'border-cr-primary/20',
        badge: 'bg-cr-primary-soft text-cr-primary',
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
      <div className="bg-cr-score-excellent-soft border-cr-score-excellent/20 overflow-hidden rounded-xl border p-6 text-center">
        <p className="text-cr-score-excellent text-sm font-medium">
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
    <div className="border-cr-border-subtle bg-cr-surface overflow-hidden rounded-xl border">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="hover:bg-cr-surface-raised flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors"
      >
        <Lightbulb className="size-5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-cr-fg text-base font-semibold">
              Recommendations
            </h3>
            <span className="bg-cr-surface-raised text-cr-fg-secondary rounded-full px-2.5 py-0.5 text-xs font-bold">
              {recommendations.length}
            </span>
          </div>
          <p className="text-cr-fg-secondary mt-0.5 text-sm">
            {criticalCount > 0 && `${criticalCount} critical`}
            {criticalCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && `${warningCount} warning${warningCount > 1 ? 's' : ''}`}
            {criticalCount === 0 && warningCount === 0 && `${recommendations.length} suggestion${recommendations.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {expanded
          ? <ChevronDown className="text-cr-fg-muted size-5 shrink-0" />
          : <ChevronRight className="text-cr-fg-muted size-5 shrink-0" />}
      </button>

      {/* Expanded: grouped recommendations */}
      {expanded && (
        <div className="border-cr-border-subtle border-t">
          {sortedCategories.map(category => (
            <div key={category}>
              {/* Category header */}
              <div className="border-cr-border-subtle bg-cr-surface-raised border-b px-5 py-2">
                <span className="text-cr-fg-muted text-xs font-semibold uppercase tracking-wide">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
              </div>
              {/* Recommendations in this category */}
              <div className="divide-cr-border-subtle divide-y">
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
            <span className="text-cr-fg text-sm font-semibold">
              {rec.title}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
              {rec.severity}
            </span>
          </div>
          <p className="text-cr-fg-secondary text-sm">
            {rec.description}
          </p>
          {rec.impact && (
            <p className="text-cr-fg-muted mt-1 text-xs">
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
