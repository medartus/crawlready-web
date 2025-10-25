'use client';

import { ArrowRight, CheckCircle, FileCode, Search, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export default function SchemaCheckerPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate URL
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const normalizedUrl = urlObj.toString();

      setLoading(true);

      // Fetch and analyze
      const response = await fetch('/api/check-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response. Please try again or contact support.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze schema');
      }

      // Store result and navigate
      sessionStorage.setItem('schemaCheckResult', JSON.stringify(data.analysis));
      router.push(`/schema-checker/results?url=${encodeURIComponent(normalizedUrl)}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-24 md:py-32">
        {/* Animated background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.1),transparent_50%)]" />

        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className={`${badgeVariants({ variant: 'outline' })} border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-gray-900`}>
              <Sparkles className="mr-2 size-4 text-indigo-600 dark:text-indigo-400" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text font-semibold text-transparent dark:bg-none dark:!text-white">
                Free Schema Markup Analyzer
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="block text-gray-900 dark:text-white">
              Is Your Schema
            </span>
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-Ready?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-3xl text-xl text-gray-600 dark:text-gray-300 md:text-2xl">
            Analyze your website's structured data quality.
            {' '}
            <span className="font-semibold text-gray-900 dark:text-white">Get a detailed report</span>
            {' '}
            on what AI crawlers see and how to improve.
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mx-auto mb-12 max-w-2xl">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="Enter your website URL (e.g., example.com)"
                  className="w-full rounded-lg border-2 border-gray-300 bg-white py-4 pl-12 pr-4 text-lg transition-colors focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${buttonVariants({ size: 'lg' })} group whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-lg shadow-xl transition-all hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:hover:scale-100`}
              >
                {loading
                  ? (
                      <>
                        <div className="mr-2 size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Analyzing...
                      </>
                    )
                  : (
                      <>
                        Analyze Schema
                        <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
              </button>
            </div>
            {error && (
              <p className="mt-3 text-left text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </form>

          {/* Trust Signals */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-8 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                No signup required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Instant analysis
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Actionable recommendations
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* What We Check Section */}
      <Section className="bg-white py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              What We Analyze
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Comprehensive schema markup assessment based on AI crawler requirements
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 text-4xl">🎯</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Presence
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Which schema types are implemented and in what format (JSON-LD, Microdata, RDFa)
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 text-4xl">✅</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Completeness
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are all required and recommended fields present for each schema type
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 text-4xl">🔍</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Validity
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Correct JSON syntax, valid formats, and proper schema.org structure
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 text-4xl">🤖</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                AI Optimization
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Properties that maximize visibility and citation by AI crawlers
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Why Schema Matters Section */}
      <Section className="border-t border-gray-200 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
              Why Schema Markup Matters for AI
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Structured data is critical for AI crawler understanding and citation
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                11×
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                More Efficient
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                JSON-LD facts require 11× fewer tokens for AI to parse vs raw HTML
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                +52%
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Higher Citation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                FAQPage schema shows 52% increase in AI answer citations
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                92%
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Crawler Priority
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                92% of AI crawlers parse JSON-LD structured data first
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-white py-20 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 text-6xl">
            <FileCode className="mx-auto size-16 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            Ready to Optimize Your Schema?
          </h2>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
            Get instant insights into your structured data quality and learn how to improve AI visibility
          </p>
          <button
            type="button"
            onClick={() => document.querySelector('input')?.focus()}
            className={`${buttonVariants({ size: 'lg' })} bg-indigo-600 px-12 py-6 text-xl text-white hover:bg-indigo-700`}
          >
            Analyze Your Schema Now
          </button>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
}
