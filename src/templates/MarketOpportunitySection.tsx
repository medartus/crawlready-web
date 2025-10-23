import { ArrowUpRight, Rocket, TrendingUp, Zap, ArrowRight } from 'lucide-react';

import { Section } from '@/features/landing/Section';

export const MarketOpportunitySection = () => {
  return (
    <Section className="bg-gradient-to-b from-indigo-50 to-white py-20 dark:from-indigo-950/20 dark:to-gray-950">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 dark:bg-indigo-900/30">
            <TrendingUp className="size-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Market Timing
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
            The AI Search Revolution is
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Happening Right Now
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-300">
            Early movers who optimize for AI citations today will dominate their categories tomorrow
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {/* Stat 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-indigo-200 bg-white p-8 transition-all hover:border-indigo-400 hover:shadow-2xl dark:border-indigo-900 dark:bg-gray-900">
            <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Rocket className="size-24 text-indigo-600" />
            </div>
            <div className="relative">
              <p className="mb-2 text-5xl font-bold text-indigo-600 dark:text-indigo-400">200M+</p>
              <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                ChatGPT Search Users
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                OpenAI launched ChatGPT Search in November 2024, giving 200M+ users direct access to AI-powered search. The shift is happening now.
              </p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-purple-200 bg-white p-8 transition-all hover:border-purple-400 hover:shadow-2xl dark:border-purple-900 dark:bg-gray-900">
            <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
              <Zap className="size-24 text-purple-600" />
            </div>
            <div className="relative">
              <p className="mb-2 text-5xl font-bold text-purple-600 dark:text-purple-400">Q1 2025</p>
              <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Early Mover Window
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The first 100 brands in each category to optimize for AI citations will establish authority. Competition is still low—act now.
              </p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-pink-200 bg-white p-8 transition-all hover:border-pink-400 hover:shadow-2xl dark:border-pink-900 dark:bg-gray-900">
            <div className="absolute right-4 top-4 opacity-10 transition-opacity group-hover:opacity-20">
              <ArrowUpRight className="size-24 text-pink-600" />
            </div>
            <div className="relative">
              <p className="mb-2 text-5xl font-bold text-pink-600 dark:text-pink-400">10x</p>
              <p className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                ROI vs DIY Solutions
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save $120K+ in development costs and 20 hours/month in maintenance. CrawlReady pays for itself in the first month with better results.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900 md:p-12">
          <h3 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Why Now is the Perfect Time
          </h3>
          
          <div className="space-y-6">
            {/* Timeline Item 1 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                  <span className="text-lg font-bold">✓</span>
                </div>
                <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-green-500 to-indigo-500" />
              </div>
              <div className="pb-8">
                <p className="mb-1 text-sm font-semibold text-green-600 dark:text-green-400">
                  November 2024
                </p>
                <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  ChatGPT Search Launches
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  OpenAI launches ChatGPT Search, making AI-powered search mainstream. 200M+ users now have direct access to AI search.
                </p>
              </div>
            </div>

            {/* Timeline Item 2 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  <span className="text-lg font-bold">→</span>
                </div>
                <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500" />
              </div>
              <div className="pb-8">
                <p className="mb-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Q1 2025 (Now)
                </p>
                <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  Early Mover Advantage Window
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The first 100 brands in each category to optimize for AI citations will establish authority. Competition is still low.
                </p>
              </div>
            </div>

            {/* Timeline Item 3 */}
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <span className="text-lg font-bold">⚡</span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
                  Q2-Q4 2025
                </p>
                <h4 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                  AI Search Becomes Standard
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Google integrates AI Overviews deeper. Perplexity grows to 100M+ users. Late movers struggle to catch up with established AI citations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">Don't wait until your competitors dominate AI search.</span>
            <br />
            Join the first 100 users and secure your AI visibility advantage today.
          </p>
          <a
            href="#early-access"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Claim Your Spot Now
            <ArrowRight className="size-5" />
          </a>
        </div>
      </div>
    </Section>
  );
};
