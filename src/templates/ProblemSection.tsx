import { AlertTriangle, TrendingDown, X, ArrowRight } from 'lucide-react';

import { Section } from '@/features/landing/Section';

export const ProblemSection = () => {
  return (
    <Section className="py-20">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 dark:bg-red-950/30">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              Critical Visibility Gap
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            Your Competitors Are Getting Cited.
            <br />
            <span className="text-red-600 dark:text-red-400">You're Not.</span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300">
            While your competitors appear in ChatGPT, Perplexity, and Claude answers, your JavaScript-heavy site is invisible to AI search engines.
          </p>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Problem 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-red-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="absolute right-4 top-4 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <X className="size-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-500 text-white">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              AI Crawlers See Blank Pages
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              GPTBot, PerplexityBot, and ClaudeBot can't execute JavaScript. They see empty divs instead of your content.
            </p>
            <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-500">
              &lt;div id="root"&gt;&lt;/div&gt;
              <br />
              <span className="text-red-500">// AI sees nothing ❌</span>
            </div>
          </div>

          {/* Problem 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-red-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="absolute right-4 top-4 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <TrendingDown className="size-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              Missing AI Search Results
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              When users ask ChatGPT about your industry, your competitors appear in citations. You don't.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <X className="size-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">No ChatGPT citations</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="size-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">No Perplexity answers</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <X className="size-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-400">No Claude references</span>
              </div>
            </div>
          </div>

          {/* Problem 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-red-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="absolute right-4 top-4 rounded-full bg-red-100 p-2 dark:bg-red-900/30">
              <svg className="size-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              DIY Solutions Cost 6 Months
            </h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Building SSR from scratch takes 3-6 months. Managing Puppeteer requires 10-20 hours/month maintenance plus high infrastructure costs.
            </p>
            <div className="space-y-2">
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Development: $120K+/year
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-500">
                  (2 engineers × 3 months + 20 hrs/month maintenance)
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  2.87x higher 404 rate vs Google
                </p>
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-500">
                  AI crawlers fail more often on JS-heavy sites
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">The opportunity cost?</span> Every day you're invisible, your competitors are building AI search authority.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="mb-6 text-xl text-gray-600 dark:text-gray-400">
            Don't let AI search engines ignore your content
          </p>
          <a
            href="#early-access"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Fix This in 5 Minutes
            <ArrowRight className="size-5" />
          </a>
        </div>
      </div>
    </Section>
  );
};
