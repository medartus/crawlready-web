'use client';

import type { Issue } from '@/types/crawler-checker';

interface IssuesAndRecommendationsProps {
  issues: Issue[];
  recommendations: string[];
  className?: string;
}

export function IssuesAndRecommendations({
  issues,
  recommendations,
  className = '',
}: IssuesAndRecommendationsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '⚡';
      case 'low':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Issues Section */}
      {issues.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Issues Found ({issues.length})
          </h3>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 p-4 ${getSeverityColor(issue.severity)}`}
              >
                <div className="mb-2 flex items-start gap-2">
                  <span className="text-xl">{getSeverityIcon(issue.severity)}</span>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        {issue.severity}
                      </span>
                      <span className="text-xs opacity-75">• {issue.crawler}</span>
                    </div>
                    <p className="font-medium">{issue.description}</p>
                  </div>
                </div>
                <div className="ml-7 mt-2 rounded bg-white/50 p-3 text-sm dark:bg-black/20">
                  <strong className="font-semibold">Fix:</strong> {issue.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10"
              >
                <span className="mt-0.5 text-blue-600 dark:text-blue-400">💡</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No issues - success state */}
      {issues.length === 0 && (
        <div className="rounded-lg border-2 border-green-300 bg-green-50 p-6 text-center dark:border-green-700 dark:bg-green-900/20">
          <div className="mb-2 text-4xl">✨</div>
          <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-400">
            Great Job!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            No critical issues found. Your site appears to be crawler-friendly.
          </p>
        </div>
      )}
    </div>
  );
}
