'use client';

import { ArrowLeft, ArrowRight, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ResultsTabs } from '@/components/ResultsTabs';
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
    } catch (error) {
      console.error('Error parsing report:', error);
      router.push('/crawler-checker');
    } finally {
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
      } catch {
        // Share failed silently - fallback to clipboard
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
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
              Checked at
              {' '}
              {new Date(report.checkedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </Section>

      {/* Main Content - Tab-Based Interface */}
      <Section className="bg-white px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
        <ResultsTabs report={report} />
      </Section>

      {/* Final CTA Section */}
      <Section className="border-t border-gray-200 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-20 dark:border-gray-700">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <div className="mb-6 text-6xl">🎯</div>
            <h3 className="mb-4 text-3xl font-bold text-white md:text-5xl">
              Ready to Optimize for AI Crawlers?
            </h3>
            <p className="mb-8 text-xl text-indigo-100">
              Join companies using CrawlReady to ensure their content is fully visible to AI crawlers.
              <br />
              <span className="font-semibold text-white">Start your free trial today.</span>
            </p>
            <div className="mb-8 flex justify-center">
              <Link
                href="/sign-up"
                className={`${buttonVariants({ size: 'lg' })} group bg-white px-12 py-6 text-xl text-indigo-600 shadow-2xl transition-all hover:scale-105 hover:bg-gray-100`}
              >
                Start Free Trial
                <ArrowRight className="ml-2 size-6 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
              >
                <Share2 className="size-5" />
                Share Results
              </button>
              <span className="hidden text-white/50 sm:inline">•</span>
              <button
                type="button"
                onClick={handleCheckAnother}
                className="inline-flex items-center gap-2 text-white/90 transition-colors hover:text-white"
              >
                <ArrowLeft className="size-5" />
                Check Another Site
              </button>
            </div>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
}
