import { ArrowRight, Building2, Code2, ShoppingCart, TrendingUp } from 'lucide-react';

import { Section } from '@/features/landing/Section';

export const SocialProofSection = () => {
  return (
    <Section
      subtitle="Who Benefits Most"
      title="Built for JavaScript-Heavy Businesses"
      description="Join companies already optimizing for AI search visibility"
    >
      <div className="mx-auto max-w-6xl">
        {/* Customer Profiles Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Profile 1: SaaS Platforms */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                <Code2 className="size-7" />
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                Most Popular
              </span>
            </div>

            <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              JavaScript SaaS Platforms
            </h3>

            <p className="mb-4 text-gray-600 dark:text-gray-400">
              React, Vue, Angular SPAs with 500-50K pages. Product-led growth companies where AI search visibility drives signups.
            </p>

            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-red-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Pain Point</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "ChatGPT can't index our feature pages. AI demos our competitors but not us."
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get cited in AI answers when users search for solutions in your category
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-950/30">
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                Typical Investment: $149-499/month
              </p>
              <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-400">
                ROI: 10-50 qualified leads/month from AI search
              </p>
            </div>
          </div>

          {/* Profile 2: E-Commerce */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-purple-300 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <ShoppingCart className="size-7" />
              </div>
            </div>

            <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              E-Commerce Stores
            </h3>

            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Headless commerce, custom React storefronts with 1K-50K product SKUs and dynamic filtering.
            </p>

            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-red-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Pain Point</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "Products not appearing in ChatGPT shopping recommendations. Losing to Amazon."
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Products appear in AI shopping answers with optimized schema markup
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-950/30">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-300">
                Typical Investment: $49-299/month
              </p>
              <p className="mt-1 text-xs text-purple-700 dark:text-purple-400">
                ROI: 5-15% increase in organic discovery
              </p>
            </div>
          </div>

          {/* Profile 3: Content Publishers */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-green-300 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                <TrendingUp className="size-7" />
              </div>
            </div>

            <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              Technical Content Publishers
            </h3>

            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Tech blogs, documentation sites, developer resources with 500-10K articles and code snippets.
            </p>

            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-red-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Pain Point</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "Losing traffic to ChatGPT for 'how-to' queries. Code examples not rendering."
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get cited as the authoritative source in AI developer tool answers
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
              <p className="text-sm font-semibold text-green-900 dark:text-green-300">
                Typical Investment: $49-149/month
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                ROI: Maintain thought leadership in AI era
              </p>
            </div>
          </div>

          {/* Profile 4: Enterprise */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-orange-300 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-start justify-between">
              <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <Building2 className="size-7" />
              </div>
            </div>

            <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
              Enterprise Portals
            </h3>

            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Large-scale customer portals, knowledge bases, and internal tools with complex JavaScript frameworks.
            </p>

            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-red-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Pain Point</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    "Support docs invisible to AI. Customers can't find answers via ChatGPT."
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 size-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Knowledge base content accessible via AI assistants, reducing support tickets
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-orange-50 p-4 dark:bg-orange-950/30">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                Typical Investment: $499-999/month
              </p>
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-400">
                ROI: 20-30% reduction in support volume
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Stats - Trust & Credibility Metrics */}
        <div className="mt-16 grid gap-8 md:grid-cols-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">99.97%</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Uptime SLA</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">10K+</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Renders per day</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-pink-600 dark:text-pink-400">&lt;200ms</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Average render time</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-green-600 dark:text-green-400">24/7</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Monitoring & alerts</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
            Which category describes your business?
          </p>
          <a
            href="#early-access"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Get Started Today
            <ArrowRight className="size-5" />
          </a>
        </div>
      </div>
    </Section>
  );
};
