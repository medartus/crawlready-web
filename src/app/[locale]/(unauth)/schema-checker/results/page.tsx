'use client';

import { ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SchemaAnalysisSection } from '@/components/SchemaAnalysisSection';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';
import type { SchemaAnalysis } from '@/types/crawler-checker';

export default function SchemaCheckerResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<SchemaAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const url = searchParams.get('url') || '';

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem('schemaCheckResult');

    if (!storedAnalysis) {
      router.push('/schema-checker');
      return;
    }

    try {
      const parsedAnalysis = JSON.parse(storedAnalysis) as SchemaAnalysis;
      setAnalysis(parsedAnalysis);
    } catch (error) {
      console.error('Error parsing analysis:', error);
      router.push('/schema-checker');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
      <Section className="relative overflow-hidden border-b border-gray-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 dark:border-gray-700 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]" />

        <div className="mx-auto max-w-5xl text-center">
          <Link
            href="/schema-checker"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="size-4" />
            Back to Schema Checker
          </Link>

          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            Schema Markup Analysis Report
          </h1>

          <div className="mx-auto max-w-2xl">
            <p className="mb-2 text-lg text-gray-600 dark:text-gray-400">
              Results for
            </p>
            <p className="mb-3 break-all font-mono text-sm text-gray-900 dark:text-white">
              {url}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Analyzed just now
            </p>
          </div>
        </div>
      </Section>

      {/* Main Content - Schema Analysis */}
      <Section className="bg-white px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <SchemaAnalysisSection analysis={analysis} />
        </div>
      </Section>

      {/* Additional CTA Section */}
      <Section className="border-t border-gray-200 bg-white py-20 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-2xl dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <div className="p-12 text-center">
              <div className="mb-6 text-6xl">🎯</div>
              <h3 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-5xl">
                Want Perfect Schema Automatically?
              </h3>
              <p className="mb-2 text-xl text-gray-700 dark:text-gray-300">
                CrawlReady generates comprehensive, valid Schema markup for every page.
              </p>
              <p className="mb-8 text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                No manual coding. Always up-to-date. AI-optimized.
              </p>

              {/* Value Props Grid */}
              <div className="mb-10 grid gap-4 text-left sm:grid-cols-3">
                <div className="rounded-xl bg-white/60 p-4 dark:bg-black/20">
                  <div className="mb-2 text-2xl">✨</div>
                  <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">Auto-Generated</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analyzes content and creates perfect Schema
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 p-4 dark:bg-black/20">
                  <div className="mb-2 text-2xl">🎯</div>
                  <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">Always Valid</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Follows latest Schema.org standards
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 p-4 dark:bg-black/20">
                  <div className="mb-2 text-2xl">🤖</div>
                  <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">AI-Optimized</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Maximizes visibility to AI crawlers
                  </p>
                </div>
              </div>

              <div className="mb-6 flex justify-center">
                <Link
                  href="/#early-access"
                  className={`${buttonVariants({ size: 'lg' })} group bg-indigo-600 px-12 py-6 text-xl text-white shadow-2xl transition-all hover:scale-105 hover:bg-indigo-700`}
                >
                  Join Waitlist
                  <ArrowRight className="ml-2 size-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                ✓ Free to join • ✓ No commitment • ✓ Be notified at launch
              </p>
            </div>

            {/* Secondary Actions Bar */}
            <div className="border-t border-indigo-200 bg-white/40 px-6 py-4 dark:border-indigo-800 dark:bg-black/20">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                >
                  <Share2 className="size-5" />
                  Share Results
                </button>
                <span className="hidden text-gray-400 sm:inline">•</span>
                <button
                  type="button"
                  onClick={handleCheckAnother}
                  className="inline-flex items-center gap-2 text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                >
                  <ArrowLeft className="size-5" />
                  Check Another Site
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
}
