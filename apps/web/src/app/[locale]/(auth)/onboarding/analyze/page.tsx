'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type AnalysisResult = {
  url: string;
  domain: string;
  framework: {
    name: string | null;
    version: string | null;
    confidence: 'high' | 'medium' | 'low' | null;
  };
  problems: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
  }>;
  scores: {
    aiVisibility: number;
    contentAccessibility: number;
    structuredData: number;
  };
  rendering: {
    userViewHtml: string;
    crawlerViewHtml: string;
    contentDifference: number;
  };
};

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) {
      return 'text-green-500';
    }
    if (s >= 50) {
      return 'text-yellow-500';
    }
    return 'text-red-500';
  };

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${getColor(score)}`}>
        {score}
        %
      </div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}

function ProblemCard({
  problem,
}: {
  problem: { type: 'critical' | 'warning' | 'info'; title: string; description: string };
}) {
  const styles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '🚨',
      iconBg: 'bg-red-100',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
    },
  };

  const style = styles[problem.type];

  return (
    <div className={`${style.bg} ${style.border} rounded-lg border p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${style.iconBg} flex size-8 shrink-0 items-center justify-center rounded-full`}>
          {style.icon}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{problem.title}</h4>
          <p className="mt-1 text-sm text-gray-600">{problem.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem('onboarding_analysis');
    if (!storedAnalysis) {
      router.push('/onboarding/add-site');
      return;
    }

    try {
      setAnalysis(JSON.parse(storedAnalysis));
    } catch {
      router.push('/onboarding/add-site');
    }
  }, [router]);

  if (!analysis) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center">
          <svg className="size-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-gray-600">Loading analysis...</span>
        </div>
      </div>
    );
  }

  const criticalProblems = analysis.problems.filter(p => p.type === 'critical');
  const hasCriticalProblems = criticalProblems.length > 0;

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Analysis Results</h2>
          <p className="mt-2 text-gray-600">{analysis.domain}</p>
        </div>

        {/* Framework Detection */}
        {analysis.framework.name && (
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">Detected framework:</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {analysis.framework.name}
              {analysis.framework.version && ` ${analysis.framework.version}`}
            </span>
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-3 gap-8 border-y border-gray-200 py-6">
          <ScoreCircle score={analysis.scores.aiVisibility} label="AI Visibility" />
          <ScoreCircle score={analysis.scores.contentAccessibility} label="Content Access" />
          <ScoreCircle score={analysis.scores.structuredData} label="Structured Data" />
        </div>

        {/* Content Difference Alert */}
        {analysis.rendering.contentDifference > 50 && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <h4 className="font-medium text-red-800">
                  {analysis.rendering.contentDifference}
                  % of your content is invisible to AI crawlers
                </h4>
                <p className="mt-1 text-sm text-red-600">
                  JavaScript-rendered content is not being seen by ChatGPT, Claude, and other AI platforms.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Problems Found */}
      {analysis.problems.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Issues Found</h3>
          <div className="space-y-3">
            {analysis.problems.map(problem => (
              <ProblemCard key={`${problem.type}-${problem.title}`} problem={problem} />
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Side-by-Side Comparison</h3>
            <p className="mt-1 text-sm text-gray-500">See how your site looks to users vs AI crawlers</p>
          </div>
          <svg
            className={`size-5 text-gray-400 transition-transform ${showComparison ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showComparison && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="size-2 rounded-full bg-green-500"></span>
                What Users See
              </h4>
              <div className="h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="prose prose-sm max-w-none">
                  {analysis.rendering.userViewHtml
                    ? (
                        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
                        <div dangerouslySetInnerHTML={{ __html: analysis.rendering.userViewHtml }} />
                      )
                    : (
                        <p className="py-8 text-center text-gray-500">Full page content</p>
                      )}
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="size-2 rounded-full bg-red-500"></span>
                What AI Crawlers See
              </h4>
              <div className="h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="prose prose-sm max-w-none">
                  {analysis.rendering.crawlerViewHtml
                    ? (
                        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
                        <div dangerouslySetInnerHTML={{ __html: analysis.rendering.crawlerViewHtml }} />
                      )
                    : (
                        <p className="py-8 text-center text-gray-400">
                          Limited or no content visible
                        </p>
                      )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Link
          href="/onboarding/add-site"
          className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          ← Back
        </Link>
        <Link
          href="/onboarding/integrate"
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {hasCriticalProblems ? 'Fix These Issues →' : 'Continue →'}
        </Link>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
