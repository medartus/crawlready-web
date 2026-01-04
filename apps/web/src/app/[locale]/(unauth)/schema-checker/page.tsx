'use client';

import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { api } from '@/libs/api-client';
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

      // Fetch and analyze (distinct ID automatically included in header)
      const response = await api.post('/api/check-schema', { url: normalizedUrl });

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
          <p className="mx-auto mb-12 max-w-3xl text-xl text-gray-600 md:text-2xl dark:text-gray-300">
            Analyze your website's structured data quality and discover how AI crawlers interpret your content.
            {' '}
            <span className="font-semibold text-gray-900 dark:text-white">Get instant results</span>
            {' '}
            with actionable recommendations.
          </p>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mx-auto mb-12 max-w-2xl">
            <div className="flex flex-col gap-2">
              <label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enter your website URL
              </label>
              <div className="flex gap-2">
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="example.com or https://example.com"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Check Now'}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          </form>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                No signup required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-indigo-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Instant results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                100% free forever
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* What We Check Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            What We Analyze
          </h2>

          <div className="space-y-6">
            {[
              {
                number: '1',
                title: 'Schema Presence & Format',
                description: 'We detect all schema types on your page (JSON-LD, Microdata, RDFa) and verify they follow schema.org standards that AI crawlers prefer.',
                gradient: 'from-indigo-500 to-purple-600',
              },
              {
                number: '2',
                title: 'Completeness Analysis',
                description: 'We check if all required and recommended fields are present for each schema type, ensuring maximum AI crawler understanding.',
                gradient: 'from-purple-500 to-pink-600',
              },
              {
                number: '3',
                title: 'Validity & Structure',
                description: 'We validate JSON syntax, data formats, and schema.org compliance to ensure your structured data is error-free and parseable.',
                gradient: 'from-pink-500 to-rose-600',
              },
              {
                number: '4',
                title: 'AI Optimization Score',
                description: 'Get a detailed 0-100 score with specific recommendations to maximize your visibility and citation chances in AI search results.',
                gradient: 'from-indigo-600 to-indigo-700',
              },
            ].map(item => (
              <div
                key={item.number}
                className="group flex items-start gap-6 rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-800"
              >
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-2xl font-bold text-white shadow-lg`}>
                  {item.number}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Why Schema Matters Section */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Why Schema Markup Matters for AI
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 text-center transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
              <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl text-white shadow-lg">
                ⚡
              </div>
              <div className="mb-4 text-5xl font-bold text-indigo-600 dark:text-indigo-400">
                11×
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                More Efficient
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                JSON-LD facts require
                {' '}
                <span className="font-semibold text-gray-900 dark:text-white">11× fewer tokens</span>
                {' '}
                for AI to parse vs raw HTML, making your content easier to understand.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 text-center transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
              <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-3xl text-white shadow-lg">
                📈
              </div>
              <div className="mb-4 text-5xl font-bold text-green-600 dark:text-green-400">
                +52%
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Higher Citation Rate
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                FAQPage schema shows
                {' '}
                <span className="font-semibold text-gray-900 dark:text-white">52% increase</span>
                {' '}
                in AI answer citations, boosting your visibility.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 text-center transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
              <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-3xl text-white shadow-lg">
                🎯
              </div>
              <div className="mb-4 text-5xl font-bold text-purple-600 dark:text-purple-400">
                92%
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Crawler Priority
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">92% of AI crawlers</span>
                {' '}
                parse JSON-LD structured data first, giving you a competitive edge.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-12 shadow-xl dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <div className="text-center">
              <div className="mb-6 text-6xl">🚀</div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                Ready to Optimize Your Schema?
              </h2>
              <p className="mb-10 text-xl text-gray-700 dark:text-gray-300">
                Get instant insights into your structured data quality and AI crawler compatibility
              </p>
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => document.querySelector('input')?.focus(), 500);
                }}
                className={`${buttonVariants({ size: 'lg' })} bg-gradient-to-r from-indigo-600 to-purple-600 px-12 text-xl shadow-xl transition-all hover:scale-105 hover:shadow-2xl`}
              >
                Analyze Your Schema Now
              </button>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span>Instant analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Actionable recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                question: 'Is this tool really free?',
                answer: 'Yes! This tool is 100% free with no signup required. We built it to help the community optimize their schema markup for AI crawlers.',
              },
              {
                question: 'What schema formats do you support?',
                answer: 'We analyze all major schema formats including JSON-LD (recommended), Microdata, and RDFa. JSON-LD is the preferred format for AI crawlers.',
              },
              {
                question: 'How accurate are the results?',
                answer: 'Our analyzer uses the same parsing methods as major AI crawlers. We validate against schema.org standards and provide actionable recommendations based on current best practices.',
              },
              {
                question: 'What if my site has no schema markup?',
                answer: 'No problem! Our tool will identify this and provide specific recommendations on which schema types to implement based on your content type and industry.',
              },
              {
                question: 'Can this help with SEO?',
                answer: 'Absolutely! While schema markup is crucial for AI crawlers, it also improves traditional SEO by helping search engines understand your content better, potentially leading to rich snippets.',
              },
            ].map(faq => (
              <details
                key={faq.question}
                className="group rounded-xl border border-gray-200 bg-white transition-all hover:border-indigo-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-800"
              >
                <summary className="cursor-pointer p-6 font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {faq.question}
                </summary>
                <div className="border-t border-gray-200 px-6 pb-6 pt-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
}
