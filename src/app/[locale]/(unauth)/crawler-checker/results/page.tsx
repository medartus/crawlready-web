'use client';

import { ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CompatibilityScore } from '@/components/CompatibilityScore';
import { CrawlerCompatibilityBadge } from '@/components/CrawlerCompatibilityBadge';
import { CrawlerViewComparison } from '@/components/CrawlerViewComparison';
import { IssuesAndRecommendations } from '@/components/IssuesAndRecommendations';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';
import type { CompatibilityReport } from '@/types/crawler-checker';

export default function CrawlerCheckerResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const url = searchParams.get('url') || '';

  useEffect(() => {
    const storedReport = sessionStorage.getItem('crawlerCheckResult');

    if (!storedReport) {
      router.push('/crawler-checker');
      return;
    }

    try {
      const parsedReport = JSON.parse(storedReport) as CompatibilityReport;
      setReport(parsedReport);
    }
    catch (error) {
      console.error('Error parsing report:', error);
      router.push('/crawler-checker');
    }
    finally {
      setLoading(false);
    }
  }, [router]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `I checked my website's AI crawler compatibility and scored ${report?.score}/100! Check yours at`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Crawler Compatibility Check',
          text: shareText,
          url: shareUrl,
        });
      }
      catch (err) {
        console.log('Share failed:', err);
      }
    }
    else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleCheckAnother = () => {
    sessionStorage.removeItem('crawlerCheckResult');
    router.push('/crawler-checker');
  };

  if (loading) {
    return (
      <>
        <LandingNavbar />
        <Section className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block size-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <p className="text-lg text-gray-600 dark:text-gray-400">Analyzing your website...</p>
          </div>
        </Section>
        <LandingFooter />
      </>
    );
  }

  if (!report) {
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
            href="/crawler-checker"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="size-4" />
            Back to Checker
          </Link>
          
          <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            AI Crawler Compatibility Report
          </h1>
          
          <div className="mx-auto max-w-2xl">
            <p className="mb-2 text-lg text-gray-600 dark:text-gray-400">
              Results for
            </p>
            <p className="mb-3 break-all font-mono text-sm text-gray-900 dark:text-white">
              {url}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Checked at {new Date(report.checkedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </Section>

      {/* Score Section */}
      <Section className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 md:p-12">
            <div className="text-center">
              <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
                Overall Compatibility Score
              </h2>
              <CompatibilityScore score={report.score} />

              {/* Quick Stats */}
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-gray-200 pt-8 dark:border-gray-700">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {report.issues.length}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Issues Found</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {report.crawlerView.contentLength}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Characters</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {report.crawlerView.hasSchema ? 'Yes' : 'No'}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Schema Markup</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Crawler Compatibility */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-12">
            <CrawlerCompatibilityBadge compatibility={report.crawlerCompatibility} />
          </div>
        </div>
      </Section>

      {/* Issues and Recommendations */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 md:p-12">
            <IssuesAndRecommendations
              issues={report.issues}
              recommendations={report.recommendations}
            />
          </div>
        </div>
      </Section>

      {/* Visual Comparison: What AI Crawlers See */}
      {report.visualComparison && (
        <Section className="border-t border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 dark:border-gray-700 dark:from-indigo-950/20 dark:to-purple-950/20">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-12">
              <CrawlerViewComparison comparison={report.visualComparison} />
            </div>
          </div>
        </Section>
      )}

      {/* Content Preview */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800 md:p-12">
            <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              Content Preview
            </h3>
            <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-900">
              <p className="font-mono text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {report.crawlerView.textContent.slice(0, 500)}
                {report.crawlerView.textContent.length > 500 && '...'}
              </p>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Showing first 500 characters of {report.crawlerView.contentLength} total
            </p>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="border-t border-gray-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:border-gray-700">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 text-5xl">🚀</div>
          <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Want to Fix These Issues Automatically?
          </h3>
          <p className="mb-8 text-xl text-indigo-100">
            CrawlReady automatically renders your JavaScript and serves optimized HTML to AI crawlers.
            <br />
            <span className="font-semibold text-white">No code changes required.</span>
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className={`${buttonVariants({ size: 'lg' })} group bg-white px-8 text-lg text-indigo-600 shadow-xl transition-all hover:scale-105 hover:bg-gray-100`}
            >
              Start Free Trial
              <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className={`${buttonVariants({ variant: 'outline', size: 'lg' })} border-2 border-white/30 bg-white/10 px-8 text-lg text-white backdrop-blur-sm transition-all hover:bg-white/20`}
            >
              <Share2 className="mr-2 size-5" />
              Share Results
            </button>
            <button
              type="button"
              onClick={handleCheckAnother}
              className={`${buttonVariants({ variant: 'outline', size: 'lg' })} border-2 border-white/30 bg-white/10 px-8 text-lg text-white backdrop-blur-sm transition-all hover:bg-white/20`}
            >
              Check Another Site
            </button>
          </div>
        </div>
      </Section>

      {/* Technical Details */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl">
          <details className="group rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 transition-all hover:border-indigo-200 hover:shadow-lg dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
            <summary className="cursor-pointer p-8 text-lg font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
              Technical Details (for developers)
            </summary>
            <div className="border-t border-gray-200 p-8 dark:border-gray-700">
              <div className="space-y-6">
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Render Time</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.crawlerView.renderTime}
                    ms
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">HTML Size</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(report.crawlerView.html.length / 1024)}
                    {' '}
                    KB
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Extracted Text</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.crawlerView.contentLength}
                    {' '}
                    characters
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Schema.org Markup</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.crawlerView.hasSchema ? 'Detected' : 'Not detected'}
                  </p>
                </div>
              </div>
            </div>
          </details>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
}
