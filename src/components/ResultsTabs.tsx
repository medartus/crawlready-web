'use client';

import { useState } from 'react';

import type { CompatibilityReport, Issue, ViewDifference } from '@/types/crawler-checker';

type Tab = 'overview' | 'issues' | 'crawler-view' | 'technical';

type ResultsTabsProps = {
  report: CompatibilityReport;
};

export function ResultsTabs({ report }: ResultsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Merge issues with crawler differences for accurate count
  const totalIssues = report.issues.length + (report.visualComparison?.differences.length || 0);

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: '📊', count: null },
    { id: 'issues' as Tab, label: 'Issues', icon: '⚠️', count: totalIssues },
    { id: 'crawler-view' as Tab, label: 'Crawler View', icon: '🤖', count: null },
    { id: 'technical' as Tab, label: 'Technical', icon: '⚙️', count: null },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Tab Navigation */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-medium transition-all
                ${activeTab === tab.id
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`
                  ml-1 rounded-full px-2 py-0.5 text-xs font-semibold
                  ${activeTab === tab.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }
                `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab report={report} />}
        {activeTab === 'issues' && <IssuesTab report={report} />}
        {activeTab === 'crawler-view' && <CrawlerViewTab report={report} />}
        {activeTab === 'technical' && <TechnicalTab report={report} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ report }: { report: CompatibilityReport }) {
  // Merge all issues including crawler differences
  const allIssues = [
    ...report.issues,
    ...(report.visualComparison?.differences || []),
  ];
  
  const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
  const highIssues = allIssues.filter(i => i.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 dark:from-indigo-950/20 dark:to-purple-950/20">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
              Compatibility Score
            </h3>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-bold ${
                report.score >= 90
                  ? 'text-green-600 dark:text-green-400'
                  : report.score >= 70
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
              >
                {report.score}
              </span>
              <span className="text-3xl text-gray-500 dark:text-gray-400">/100</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {report.score >= 90
                ? 'Excellent! Your site is highly optimized.'
                : report.score >= 70
                  ? 'Good, but there\'s room for improvement.'
                  : report.score >= 50
                    ? 'Needs attention to improve crawler visibility.'
                    : 'Critical issues detected. Immediate action required.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-white/80 p-4 text-center backdrop-blur dark:bg-gray-800/80">
              <div className={`text-2xl font-bold ${criticalIssues > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {criticalIssues}
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Critical</div>
            </div>
            <div className="rounded-lg bg-white/80 p-4 text-center backdrop-blur dark:bg-gray-800/80">
              <div className={`text-2xl font-bold ${highIssues > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                {highIssues}
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">High</div>
            </div>
            <div className="rounded-lg bg-white/80 p-4 text-center backdrop-blur dark:bg-gray-800/80">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(report.crawlerView.contentLength / 1000)}
                K
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Characters</div>
            </div>
            <div className="rounded-lg bg-white/80 p-4 text-center backdrop-blur dark:bg-gray-800/80">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {report.crawlerView.hasSchema ? '✓' : '✗'}
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">Schema</div>
            </div>
          </div>
        </div>
      </div>

      {/* Crawler Compatibility Matrix */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Crawler Compatibility
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(report.crawlerCompatibility).map(([crawler, status]) => (
            <div
              key={crawler}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <span className="font-medium text-gray-700 dark:text-gray-300">{crawler}</span>
              <span className={`
                rounded-full px-3 py-1 text-xs font-semibold uppercase
                ${status === 'full'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : status === 'partial'
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
              `}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="rounded-xl bg-blue-50 p-6 dark:bg-blue-950/20">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-300">
            <span>💡</span>
            Quick Wins
          </h3>
          <div className="space-y-2">
            {report.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm text-blue-900 dark:text-blue-200">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Issues Tab Component
function IssuesTab({ report }: { report: CompatibilityReport }) {
  // Merge crawler view differences with regular issues
  const allIssues: Array<Issue | ViewDifference> = [
    ...report.issues,
    ...(report.visualComparison?.differences || []),
  ];

  const groupedIssues = {
    critical: allIssues.filter(i => i.severity === 'critical'),
    high: allIssues.filter(i => i.severity === 'high'),
    medium: allIssues.filter(i => i.severity === 'medium'),
    low: allIssues.filter(i => i.severity === 'low'),
  };

  const getSeverityConfig = (severity: string) => {
    const configs = {
      critical: { bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-800 dark:text-red-300', icon: '🚨' },
      high: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-800 dark:text-orange-300', icon: '⚠️' },
      medium: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-800 dark:text-yellow-300', icon: '⚡' },
      low: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-800 dark:text-blue-300', icon: 'ℹ️' },
    };
    return configs[severity as keyof typeof configs] || configs.low;
  };

  if (report.issues.length === 0) {
    return (
      <div className="rounded-xl border-2 border-green-300 bg-green-50 p-12 text-center dark:border-green-700 dark:bg-green-950/20">
        <div className="mb-4 text-6xl">✨</div>
        <h3 className="mb-2 text-2xl font-bold text-green-800 dark:text-green-300">
          Perfect Score!
        </h3>
        <p className="text-green-700 dark:text-green-400">
          No issues detected. Your site is fully optimized for AI crawlers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Found:</span>
          {Object.entries(groupedIssues).map(([severity, issues]) => (
            issues.length > 0 && (
              <span key={severity} className="flex items-center gap-2 text-sm">
                <span>{getSeverityConfig(severity).icon}</span>
                <span className={`font-semibold ${getSeverityConfig(severity).text}`}>
                  {issues.length}
                  {' '}
                  {severity}
                </span>
              </span>
            )
          ))}
        </div>
      </div>

      {/* Issue Lists by Severity */}
      {Object.entries(groupedIssues).map(([severity, issues]) => (
        issues.length > 0 && (
          <div key={severity}>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <span>{getSeverityConfig(severity).icon}</span>
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
              {' '}
              Priority (
              {issues.length}
              )
            </h3>
            <div className="space-y-3">
              {issues.map((issue, index) => {
                const config = getSeverityConfig(issue.severity);
                return (
                  <div
                    key={index}
                    className={`rounded-lg border-2 p-4 ${config.bg} ${config.border}`}
                  >
                    <div className="mb-2">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-75">
                        <span>{issue.crawler}</span>
                      </div>
                      <p className={`font-semibold ${config.text}`}>{issue.description}</p>
                    </div>
                    {'impact' in issue && issue.impact && (
                      <div className="mt-2 rounded-md bg-blue-50/60 p-3 dark:bg-blue-950/20">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Impact:</span>
                          {' '}
                          {issue.impact}
                        </p>
                      </div>
                    )}
                    <div className="mt-3 rounded-md bg-white/60 p-3 dark:bg-black/20">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">How to fix:</span>
                        {' '}
                        {issue.fix}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ))}

      {/* All Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="mt-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 dark:from-blue-950/20 dark:to-indigo-950/20">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <span>💡</span>
            Additional Recommendations
          </h3>
          <div className="space-y-2">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg bg-white/60 p-3 dark:bg-black/20">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Crawler View Tab Component
function CrawlerViewTab({ report }: { report: CompatibilityReport }) {
  if (!report.visualComparison) {
    return (
      <div className="rounded-xl bg-gray-50 p-12 text-center dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">Visual comparison not available</p>
      </div>
    );
  }

  const { visualComparison } = report;

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Scripts Removed" value={visualComparison.statistics.jsScriptsRemoved} icon="📜" />
        <StatCard label="Event Handlers" value={visualComparison.statistics.eventHandlersRemoved} icon="⚡" />
        <StatCard label="Lazy Images" value={visualComparison.statistics.lazyImagesDetected} icon="🖼️" />
        <StatCard label="Hidden Content" value={visualComparison.statistics.hiddenContentDetected} icon="👁️" />
        <StatCard label="Dynamic Content" value={visualComparison.statistics.dynamicContentDetected} icon="⚙️" />
      </div>

      {/* User View Link */}
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h4 className="mb-1 font-semibold text-blue-900 dark:text-blue-300">
              Compare with your live site
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Open your site in a new tab to see the full styled version with JavaScript.
            </p>
          </div>
          <a
            href={visualComparison.userViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            🔗 Open Site
          </a>
        </div>
      </div>

      {/* Crawler View Preview - Rendered HTML */}
      <div className="overflow-hidden rounded-xl border-2 border-gray-300 shadow-lg dark:border-gray-700">
        <div className="border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Crawler View (Rendered)</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">What AI crawlers actually see (JavaScript stripped)</p>
              </div>
            </div>
          </div>
        </div>
        <div
          className="h-[600px] overflow-auto bg-white dark:bg-gray-900"
          dangerouslySetInnerHTML={{ __html: visualComparison.crawlerViewHtml }}
        />
      </div>
    </div>
  );
}

// Technical Tab Component
function TechnicalTab({ report }: { report: CompatibilityReport }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TechnicalCard
          title="Response Time"
          value={`${report.crawlerView.renderTime}ms`}
          description="Time to first byte"
          status={report.crawlerView.renderTime < 1000 ? 'good' : report.crawlerView.renderTime < 3000 ? 'warning' : 'error'}
        />
        <TechnicalCard
          title="HTML Size"
          value={`${Math.round(report.crawlerView.html.length / 1024)} KB`}
          description="Total HTML document size"
          status={report.crawlerView.html.length / 1024 < 500 ? 'good' : 'warning'}
        />
        <TechnicalCard
          title="Content Length"
          value={`${report.crawlerView.contentLength}`}
          description="Extracted text characters"
          status={report.crawlerView.contentLength > 500 ? 'good' : 'warning'}
        />
        <TechnicalCard
          title="Schema Markup"
          value={report.crawlerView.hasSchema ? 'Detected' : 'Not Found'}
          description="Structured data presence"
          status={report.crawlerView.hasSchema ? 'good' : 'error'}
        />
      </div>

      {/* Category Scores */}
      {report.categoryScores && (
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(report.categoryScores).map(([category, score]) => (
              <div key={category} className="flex items-center gap-3">
                <span className="w-32 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                  {category}
                </span>
                <div className="flex-1">
                  <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        score >= 80
                          ? 'bg-green-500'
                          : score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  {Math.round(score)}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}

function TechnicalCard({
  title,
  value,
  description,
  status,
}: {
  title: string;
  value: string;
  description: string;
  status: 'good' | 'warning' | 'error';
}) {
  const statusColors = {
    good: 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/20',
    warning: 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/20',
    error: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/20',
  };

  const statusIcons = {
    good: '✓',
    warning: '⚠',
    error: '✗',
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${statusColors[status]}`}>
      <div className="mb-2 flex items-start justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
        <span className="text-xl">{statusIcons[status]}</span>
      </div>
      <p className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
