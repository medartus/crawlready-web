/**
 * Crawler View Comparison Component
 * Displays side-by-side comparison of user view vs crawler view
 */

import type { CrawlerViewComparison } from '@/types/crawler-checker';

type CrawlerViewComparisonProps = {
  comparison: CrawlerViewComparison;
};

export function CrawlerViewComparison({ comparison }: CrawlerViewComparisonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Visual Comparison: What AI Crawlers See
        </h2>
        <p className="text-gray-600">
          Compare your website with JavaScript enabled (left) vs. without JavaScript (right) to understand what AI crawlers actually see.
        </p>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          label="Scripts Removed"
          value={comparison.statistics.jsScriptsRemoved}
          icon="📜"
          color="blue"
        />
        <StatCard
          label="Event Handlers"
          value={comparison.statistics.eventHandlersRemoved}
          icon="⚡"
          color="purple"
        />
        <StatCard
          label="Lazy Images"
          value={comparison.statistics.lazyImagesDetected}
          icon="🖼️"
          color="green"
        />
        <StatCard
          label="Hidden Content"
          value={comparison.statistics.hiddenContentDetected}
          icon="👁️"
          color="yellow"
        />
        <StatCard
          label="Dynamic Content"
          value={comparison.statistics.dynamicContentDetected}
          icon="⚙️"
          color="red"
        />
      </div>

      {/* Crawler View - Full Width (User view removed due to iframe restrictions) */}
      <div className="space-y-4">
        {/* Info Box about User View */}
        <div className="rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h4 className="mb-1 font-semibold text-blue-900">
                Want to see the full user experience?
              </h4>
              <p className="mb-3 text-sm text-blue-800">
                Most websites block iframe embedding for security. Open your site in a new tab to see the styled version with JavaScript enabled.
              </p>
              <a
                href={comparison.userViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <span>🔗</span>
                Open Your Site in New Tab
              </a>
            </div>
          </div>
        </div>

        {/* Crawler View - Full Width */}
        <div className="overflow-hidden rounded-lg border-2 border-red-500 shadow-lg">

          <div className="border-b-2 border-red-500 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-gray-900">What AI Crawlers See</h3>
                  <p className="text-xs text-gray-600">Content without JavaScript (stripped HTML)</p>
                </div>
              </div>
              <div className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
                Crawler View
              </div>
            </div>
          </div>
          <div
            className="h-[600px] overflow-auto bg-gray-50"
            dangerouslySetInnerHTML={{ __html: comparison.crawlerViewHtml }}
          />
        </div>
      </div>

      {/* Differences Section */}
      {comparison.differences.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            <span>⚠️</span>
            Issues Found (
            {comparison.differences.length}
            )
          </h3>
          <div className="space-y-3">
            {[...comparison.differences]
              .sort((a, b) => {
                const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
              })
              .map((diff, index) => (
                <DifferenceCard key={`${diff.type}-${index}`} difference={diff} />
              ))}
          </div>
        </div>
      )}

      {/* No Differences */}
      {comparison.differences.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <div className="mb-3 text-5xl">✅</div>
          <h3 className="mb-2 text-lg font-semibold text-green-900">
            Great! No Critical Differences Detected
          </h3>
          <p className="text-green-700">
            Your website appears consistent between user and crawler views.
          </p>
        </div>
      )}

      {/* Comprehensive Hidden Content Analysis */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-orange-900">
          <span>🔍</span>
          Comprehensive Hidden Content Analysis
        </h3>
        <div className="space-y-4">
          <div className="rounded-lg bg-white p-4">
            <h4 className="mb-2 font-semibold text-gray-900">JavaScript Dependencies</h4>
            <p className="mb-2 text-sm text-gray-700">
              {comparison.statistics.jsScriptsRemoved}
              {' '}
              scripts removed that crawlers won't execute
            </p>
            {comparison.statistics.jsScriptsRemoved > 0 && (
              <p className="text-xs text-orange-700">
                ⚠️ If your content depends on these scripts, crawlers won't see it
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-4">
            <h4 className="mb-2 font-semibold text-gray-900">Interactive Elements</h4>
            <p className="mb-2 text-sm text-gray-700">
              {comparison.statistics.eventHandlersRemoved}
              {' '}
              event handlers (onClick, onHover, etc.)
            </p>
            {comparison.statistics.eventHandlersRemoved > 0 && (
              <p className="text-xs text-orange-700">
                ⚠️ Interactive content may not be accessible to crawlers
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-4">
            <h4 className="mb-2 font-semibold text-gray-900">Lazy-Loaded Media</h4>
            <p className="mb-2 text-sm text-gray-700">
              {comparison.statistics.lazyImagesDetected}
              {' '}
              images with lazy loading
            </p>
            {comparison.statistics.lazyImagesDetected > 0 && (
              <p className="text-xs text-orange-700">
                ⚠️ These images may not load for crawlers without JavaScript
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-4">
            <h4 className="mb-2 font-semibold text-gray-900">Hidden Content</h4>
            <p className="mb-2 text-sm text-gray-700">
              {comparison.statistics.hiddenContentDetected}
              {' '}
              elements with display:none or visibility:hidden
            </p>
            {comparison.statistics.hiddenContentDetected > 0 && (
              <p className="text-xs text-orange-700">
                ⚠️ Hidden content is typically ignored by crawlers
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white p-4">
            <h4 className="mb-2 font-semibold text-gray-900">Dynamic Content</h4>
            <p className="mb-2 text-sm text-gray-700">
              {comparison.statistics.dynamicContentDetected}
              {' '}
              dynamically loaded elements
            </p>
            {comparison.statistics.dynamicContentDetected > 0 && (
              <p className="text-xs text-orange-700">
                ⚠️ Content loaded via JavaScript won't be indexed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold text-blue-900">💡 Understanding What Crawlers See</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            •
            {' '}
            <strong>Crawler View:</strong>
            {' '}
            Shows the HTML content that AI crawlers like GPTBot, ClaudeBot, and PerplexityBot actually parse
          </li>
          <li>
            •
            {' '}
            <strong>No JavaScript:</strong>
            {' '}
            Crawlers don't execute JavaScript, so any content loaded dynamically won't be seen
          </li>
          <li>
            •
            {' '}
            <strong>Hidden Content:</strong>
            {' '}
            Content with display:none, visibility:hidden, or requiring user interaction is invisible
          </li>
          <li>
            •
            {' '}
            <strong>Best Practice:</strong>
            {' '}
            Critical content should be in the HTML source, not loaded via JavaScript
          </li>
        </ul>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}

// Difference Card Component
function DifferenceCard({ difference }: { difference: CrawlerViewComparison['differences'][0] }) {
  const severityConfig = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      badge: 'bg-red-500',
      icon: '🚨',
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      badge: 'bg-orange-500',
      icon: '⚠️',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      badge: 'bg-yellow-500',
      icon: '⚡',
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      badge: 'bg-blue-500',
      icon: 'ℹ️',
    },
  };

  const config = severityConfig[difference.severity];

  return (
    <div className={`${config.bg} border-l-4 ${config.border} rounded-r-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h4 className="font-semibold text-gray-900">{difference.description}</h4>
            <span className={`${config.badge} rounded-full px-2 py-0.5 text-xs font-medium uppercase text-white`}>
              {difference.severity}
            </span>
          </div>
          <p className="mb-2 text-sm text-gray-700">{difference.impact}</p>
          <div className="inline-block rounded bg-white bg-opacity-50 px-2 py-1 text-xs text-gray-600">
            Type:
            {' '}
            <span className="font-medium">{difference.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
