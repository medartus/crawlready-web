import { ArrowRight, CheckCircle2, Clock, Sparkles, Users } from 'lucide-react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const CTA = () => {
  return (
    <div id="early-access">
    <Section className="py-20">
      <div className="mx-auto max-w-4xl">
        {/* Main CTA Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-1">
          <div className="rounded-3xl bg-white p-12 dark:bg-gray-900 md:p-16">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 dark:bg-indigo-900/30">
                <Sparkles className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Limited Time: Phase 0 Early Access
                </span>
              </div>
              
              <h2 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white md:text-5xl">
                Join the First 100 Users
              </h2>
              
              <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                Get <span className="font-bold text-indigo-600 dark:text-indigo-400">lifetime 50% discount</span>, 
                priority support, and help shape the future of AI crawler optimization.
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-10 grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">50% Off Forever</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Locked-in pricing for life</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <Clock className="mt-1 size-5 shrink-0 text-indigo-600" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">5-Minute Setup</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">No code changes required</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
                <Users className="mt-1 size-5 shrink-0 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Direct Access</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Founding team support</p>
                </div>
              </div>
            </div>

            {/* Signup Form */}
            <div className="mx-auto max-w-md">
              <form className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Enter your work email"
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <input
                    type="url"
                    placeholder="Your website URL"
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 transition-colors focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`${buttonVariants({ size: 'lg' })} group w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-lg shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl`}
                >
                  Claim Your 50% Discount
                  <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
              
              <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                ✓ 14-day free trial • ✓ Cancel anytime • ✓ Money-back guarantee
              </p>
            </div>

            {/* Social Proof */}
            <div className="mt-10 border-t border-gray-200 pt-8 text-center dark:border-gray-700">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Join Tech Leaders Optimizing for AI Search
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">87</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spots Remaining</p>
                </div>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">400%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI Search Growth</p>
                </div>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">&lt;200ms</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Render Speed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
    </div>
  );
};
