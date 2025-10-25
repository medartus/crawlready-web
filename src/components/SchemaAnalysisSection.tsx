import { AlertCircle, AlertTriangle, CheckCircle, FileCode, XCircle } from 'lucide-react';

import type { SchemaAnalysis, SchemaIssue } from '@/types/crawler-checker';

type SchemaAnalysisSectionProps = {
  analysis: SchemaAnalysis;
};

function ScoreCard({ title, score, max, icon }: { title: string; score: number; max: number; icon: string }) {
  const percentage = (score / max) * 100;
  const getColor = () => {
    if (percentage >= 90) {
      return 'bg-green-500';
    }
    if (percentage >= 70) {
      return 'bg-blue-500';
    }
    if (percentage >= 50) {
      return 'bg-yellow-500';
    }
    return 'bg-red-500';
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 text-3xl">{icon}</div>
      <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{score}</span>
        <span className="text-lg text-gray-500 dark:text-gray-400">
          /
          {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function IssueCard({ issue }: { issue: SchemaIssue }) {
  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'critical':
        return <XCircle className="size-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="size-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="size-5 text-yellow-500" />;
      default:
        return <AlertCircle className="size-5 text-blue-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (issue.severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20';
      case 'high':
        return 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getSeverityColor()}`}>
      <div className="flex items-start gap-3">
        {getSeverityIcon()}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h5 className="font-semibold text-gray-900 dark:text-white">{issue.title}</h5>
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium uppercase dark:bg-black/20">
              {issue.severity}
            </span>
          </div>
          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{issue.description}</p>
          <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            <strong>Impact:</strong>
            {' '}
            {issue.impact}
          </p>
          {issue.fix && (
            <div className="mt-3 rounded bg-white/60 p-3 dark:bg-black/20">
              <p className="mb-1 text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                How to Fix:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{issue.fix}</p>
            </div>
          )}
          {issue.example && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                Show Example
              </summary>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                {issue.example}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: SchemaAnalysis['recommendations'][0] }) {
  const getPriorityColor = () => {
    switch (recommendation.priority) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20';
      case 'high':
        return 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getPriorityColor()}`}>
      <div className="mb-2 flex items-center gap-2">
        <h5 className="font-semibold text-gray-900 dark:text-white">{recommendation.title}</h5>
        <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium uppercase dark:bg-black/20">
          {recommendation.priority}
        </span>
      </div>
      <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{recommendation.description}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        <strong>Expected Impact:</strong>
        {' '}
        {recommendation.impact}
      </p>
      {recommendation.implementation && (
        <div className="mt-3 rounded bg-white/60 p-3 dark:bg-black/20">
          <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation.implementation}</p>
        </div>
      )}
    </div>
  );
}

export function SchemaAnalysisSection({ analysis }: SchemaAnalysisSectionProps) {
  return (
    <div className="space-y-8">
      {/* Overall Score Card */}
      <div className="overflow-hidden rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 text-center dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
        <div className="mb-4 text-6xl">📊</div>
        <h3 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Schema Markup Quality
        </h3>
        <div className="mb-2 flex items-baseline justify-center gap-3">
          <span className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">
            {analysis.overallScore}
          </span>
          <span className="text-3xl text-gray-500 dark:text-gray-400">/100</span>
        </div>
        <div className="mb-4 inline-block rounded-full bg-white/60 px-6 py-2 dark:bg-black/20">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            Grade:
            {' '}
            {analysis.grade}
          </span>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          {analysis.grade === 'A+' && 'Excellent! Your schema markup is optimized for AI crawlers.'}
          {analysis.grade === 'A' && 'Very good! Minor optimizations could improve AI visibility.'}
          {analysis.grade === 'B' && 'Good foundation. Add recommended schemas for better results.'}
          {analysis.grade === 'C' && 'Fair. Significant improvements needed for AI optimization.'}
          {analysis.grade === 'D' && 'Poor. Major restructuring required for AI visibility.'}
          {analysis.grade === 'F' && 'Critical. Start implementing schema markup immediately.'}
        </p>
      </div>

      {/* Category Breakdown */}
      <div>
        <h4 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Score Breakdown</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard
            title="Presence"
            score={analysis.categories.presence.score}
            max={40}
            icon="🎯"
          />
          <ScoreCard
            title="Completeness"
            score={analysis.categories.completeness.score}
            max={30}
            icon="✅"
          />
          <ScoreCard
            title="Validity"
            score={analysis.categories.validity.score}
            max={20}
            icon="🔍"
          />
          <ScoreCard
            title="AI Optimization"
            score={analysis.categories.aiOptimization.score}
            max={10}
            icon="🤖"
          />
        </div>
      </div>

      {/* What We Found */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          What We Found
        </h4>

        {analysis.hasSchema ? (
          <>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Your site has
              {' '}
              <strong>{analysis.schemaCount}</strong>
              {' '}
              schema markup
              {analysis.schemaCount !== 1 ? 's' : ''}
              {' '}
              implemented using
              {' '}
              <strong>{analysis.primaryFormat.toUpperCase()}</strong>
              :
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.schemaTypes.map(type => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                >
                  <FileCode className="size-4" />
                  {type}
                </span>
              ))}
            </div>

            {/* Quick Indicators */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {analysis.categories.presence.hasJsonLd
                  ? (
                      <CheckCircle className="size-5 text-green-500" />
                    )
                  : (
                      <XCircle className="size-5 text-red-500" />
                    )}
                <span className="text-gray-700 dark:text-gray-300">
                  JSON-LD format (preferred by AI crawlers)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {analysis.categories.presence.hasOrganization
                  ? (
                      <CheckCircle className="size-5 text-green-500" />
                    )
                  : (
                      <AlertCircle className="size-5 text-yellow-500" />
                    )}
                <span className="text-gray-700 dark:text-gray-300">
                  Organization schema
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {analysis.categories.presence.hasContentType
                  ? (
                      <CheckCircle className="size-5 text-green-500" />
                    )
                  : (
                      <AlertCircle className="size-5 text-yellow-500" />
                    )}
                <span className="text-gray-700 dark:text-gray-300">
                  Content-specific schema (Article, Product, etc.)
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
            <AlertTriangle className="size-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">
                No Schema Markup Found
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Your site is missing structured data, making it harder for AI crawlers to understand your content.
                This reduces your chances of being cited by AI systems by up to 80%.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div>
          <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Issues Found (
            {analysis.issues.length}
            )
          </h4>
          <div className="space-y-4">
            {analysis.issues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div>
          <h4 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Recommendations (
            {analysis.recommendations.length}
            )
          </h4>
          <div className="space-y-4">
            {analysis.recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Missing Schemas */}
      {analysis.missingSchemas.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-950/20">
          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-yellow-900 dark:text-yellow-200">
            <AlertCircle className="size-5" />
            Missing Recommended Schemas
          </h4>
          <p className="mb-4 text-sm text-yellow-800 dark:text-yellow-300">
            Based on your page type (
            <strong>{analysis.pageType}</strong>
            ), we recommend adding:
          </p>
          <ul className="space-y-2">
            {analysis.missingSchemas.map(schema => (
              <li key={schema} className="flex items-start gap-2 text-sm text-yellow-900 dark:text-yellow-200">
                <span className="mt-0.5">•</span>
                <div>
                  <strong>{schema}</strong>
                  {' '}
                  schema
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
