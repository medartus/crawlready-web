'use client';

import { ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { SchemaAnalysisSection } from '@/components/SchemaAnalysisSection';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';
import type { SchemaAnalysis } from '@/types/crawler-checker';

function SchemaCheckerResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<SchemaAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const url = searchParams.get('url') || '';

  useEffect(() => {
    const fetchResults = async () => {
      // First, try to get from sessionStorage
      const storedAnalysis = sessionStorage.getItem('schemaCheckResult');

      if (storedAnalysis) {
        try {
          const parsedAnalysis = JSON.parse(storedAnalysis) as SchemaAnalysis;
          setAnalysis(parsedAnalysis);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing stored analysis:', error);
        }
      }

      // If no stored analysis and URL param exists, fetch from API
      if (url) {
        try {
          const response = await fetch('/api/check-schema', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch schema analysis results');
          }

          const data = await response.json();
          setAnalysis(data.analysis);
        } catch (error) {
          console.error('Error fetching analysis:', error);
          router.push('/schema-checker');
        } finally {
          setLoading(false);
        }
      } else {
        // No stored analysis and no URL param, redirect
        router.push('/schema-checker');
      }
    };

    fetchResults();
  }, [router, url]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `I analyzed my website's schema markup and scored ${analysis?.overallScore}/100! Check yours at`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Schema Markup Analysis',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // Share failed silently - fallback to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    }
  };

  const handleCheckAnother = () => {
    sessionStorage.removeItem('schemaCheckResult');
    router.push('/schema-checker');
  };

  if (loading) {
    return (
      <>
        <LandingNavbar />
        <Section className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Analyzing your schema markup...</p>
          </div>
        </Section>
        <LandingFooter />
      </>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <>
      <LandingNavbar />

      {/* Header Section */}
      <Section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]" />

        <div className="mx-auto max-w-5xl">
          <Link
            href="/schema-checker"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="size-4" />
            Back to Schema Checker
          </Link>

          <div className="text-center">
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Schema Markup Analysis
            </h1>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              Results for
            </p>
            <p className="mb-6 break-all font-mono text-sm font-medium text-gray-900 dark:text-white">
              {url}
            </p>
          </div>
        </div>
      </Section>

      {/* Score Hero Section */}
      <Section className="border-b border-gray-200 bg-white py-12 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:gap-12">
              {/* Overall Score Display */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Overall Schema Score
                </div>
                <div className="relative mb-6">
                  <svg className="size-48" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeLinecap="round"
                      className={`transition-all ${
                        analysis.overallScore >= 80
                          ? 'text-green-500'
                          : analysis.overallScore >= 60
                            ? 'text-yellow-500'
                            : 'text-red-500'
                      }`}
                      strokeDasharray={`${(analysis.overallScore / 100) * 565.48} 565.48`}
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <div
                        className={`text-5xl font-bold ${
                          analysis.overallScore >= 80
                            ? 'text-green-600 dark:text-green-400'
                            : analysis.overallScore >= 60
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {analysis.overallScore}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">out of 100</div>
                    </div>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    analysis.overallScore >= 80
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : analysis.overallScore >= 60
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {analysis.overallScore >= 80 ? '✓ Excellent' : analysis.overallScore >= 60 ? '⚠ Needs Improvement' : '✗ Poor'}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">Schemas Found</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysis.schemaCount}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">Issues Detected</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysis.issues.length}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-1 text-sm text-gray-600 dark:text-gray-400">Recommendations</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysis.recommendations.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-gray-200 pt-8 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCheckAnother}
                className={`${buttonVariants({ variant: 'outline' })} group gap-2`}
              >
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                Check Another Site
              </button>
              <button
                type="button"
                onClick={handleShare}
                className={`${buttonVariants({ variant: 'outline' })} group gap-2`}
              >
                <Share2 className="size-4" />
                Share Results
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Main Content - Schema Analysis */}
      <Section className="bg-gradient-to-br from-gray-50 to-white px-4 py-16 dark:from-gray-900 dark:to-gray-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Detailed Analysis
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              In-depth breakdown of your schema markup quality and recommendations
            </p>
          </div>
          <SchemaAnalysisSection analysis={analysis} />
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="border-t border-gray-200 bg-white py-20 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-2xl dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <div className="p-8 text-center md:p-12">
              <div className="mb-6 text-6xl">🚀</div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
                Want Perfect Schema Automatically?
              </h2>
              <p className="mb-2 text-xl text-gray-700 dark:text-gray-300">
                CrawlReady generates comprehensive, valid Schema markup for every page.
              </p>
              <p className="mb-8 text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                No manual coding. Always up-to-date. AI-optimized.
              </p>

              {/* Value Props Grid */}
              <div className="mb-10 grid gap-6 text-left md:grid-cols-3">
                <div className="group rounded-2xl border border-white/40 bg-white/60 p-6 transition-all hover:scale-105 hover:shadow-lg dark:border-gray-700/40 dark:bg-black/20">
                  <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl text-white shadow-lg">
                    ✨
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Auto-Generated</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzes your content and creates perfect Schema markup automatically
                  </p>
                </div>
                <div className="group rounded-2xl border border-white/40 bg-white/60 p-6 transition-all hover:scale-105 hover:shadow-lg dark:border-gray-700/40 dark:bg-black/20">
                  <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-2xl text-white shadow-lg">
                    ✓
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Always Valid</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Follows latest Schema.org standards and best practices
                  </p>
                </div>
                <div className="group rounded-2xl border border-white/40 bg-white/60 p-6 transition-all hover:scale-105 hover:shadow-lg dark:border-gray-700/40 dark:bg-black/20">
                  <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-2xl text-white shadow-lg">
                    🤖
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">AI-Optimized</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Maximizes visibility and citation by AI crawlers
                  </p>
                </div>
              </div>

              <Link
                href="/#early-access"
                className={`${buttonVariants({ size: 'lg' })} group bg-gradient-to-r from-indigo-600 to-purple-600 px-12 text-xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl`}
              >
                Join Waitlist
                <ArrowRight className="ml-2 size-6 transition-transform group-hover:translate-x-1" />
              </Link>

              <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                ✓ Free to join • ✓ No commitment • ✓ Be notified at launch
              </p>
            </div>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
}

export default function SchemaCheckerResultsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <SchemaCheckerResultsContent />
    </Suspense>
  );
}
