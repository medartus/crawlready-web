import { Check, X, ArrowRight } from 'lucide-react';

import { Section } from '@/features/landing/Section';

export const ComparisonSection = () => {
  return (
    <Section
      subtitle="Why CrawlReady?"
      title="Built for AI Search. Not an Afterthought."
      description="See how we compare to Prerender.io and DIY solutions"
    >
      <div className="mx-auto max-w-6xl">
        {/* Comparison Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Feature
                  </th>
                  <th className="bg-gradient-to-b from-indigo-50 to-purple-50 px-6 py-4 text-center dark:from-indigo-950/30 dark:to-purple-950/30">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">CrawlReady</span>
                      <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                        AI-First
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Prerender.io
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-400">
                    DIY Solution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {/* Row 1 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">AI Citation Tracking</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Monitor ChatGPT/Perplexity citations
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <Check className="mx-auto size-6 text-green-600" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto size-6 text-red-500" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto size-6 text-red-500" />
                  </td>
                </tr>

                {/* Row 2 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">LLM-Optimized Schema</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Auto-inject AI-friendly structured data
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <Check className="mx-auto size-6 text-green-600" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto size-6 text-red-500" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-500">Manual</span>
                  </td>
                </tr>

                {/* Row 3 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">AI Crawler Analytics</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Real-time GPTBot/PerplexityBot tracking
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <Check className="mx-auto size-6 text-green-600" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-500">Basic</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <X className="mx-auto size-6 text-red-500" />
                  </td>
                </tr>

                {/* Row 4 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">Render Speed</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Time to serve rendered HTML
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <span className="font-bold text-green-600">&lt;200ms</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">~500ms</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Varies</span>
                  </td>
                </tr>

                {/* Row 5 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">Setup Time</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Time to first render
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <span className="font-bold text-green-600">5 minutes</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">5 minutes</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-red-600">3-6 months</span>
                  </td>
                </tr>

                {/* Row 6 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">Monthly Cost</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Starter tier pricing
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <span className="font-bold text-green-600">$49</span>
                    <p className="text-xs text-gray-500">50% off</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">$90</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-red-600">$10K+</span>
                    <p className="text-xs text-gray-500">Dev costs</p>
                  </td>
                </tr>

                {/* Row 7 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">Maintenance</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Ongoing effort required
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <span className="font-bold text-green-600">Zero</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Minimal</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-red-600">10-20 hrs/mo</span>
                  </td>
                </tr>

                {/* Row 8 */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <span className="font-semibold">Support</span>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Help when you need it
                    </p>
                  </td>
                  <td className="bg-indigo-50/50 px-6 py-4 text-center dark:bg-indigo-950/10">
                    <span className="text-sm font-semibold text-green-600">Priority</span>
                    <p className="text-xs text-gray-500">&lt;24hr response</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Ticket-based</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Self-service</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">40% cheaper</span> than Prerender.io. 
            <span className="font-semibold text-gray-900 dark:text-white"> 99% faster</span> than building it yourself.
          </p>
          <a
            href="#early-access"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Join Early Access
            <ArrowRight className="size-5" />
          </a>
        </div>
      </div>
    </Section>
  );
};
