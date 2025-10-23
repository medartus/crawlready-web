import { ArrowRight, Check, Crown, Rocket, Sparkles, Zap } from 'lucide-react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const Pricing = () => {
  return (
    <div id="pricing">
    <Section
      subtitle="Phase 0 Early Access"
      title="Join the First 100 Users"
      description="Get lifetime 50% discount. Help shape the product. Priority support. Limited spots available."
    >
      <div className="mx-auto max-w-6xl">
        {/* Pricing Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Starter Plan */}
          <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Starter</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Perfect for small sites</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$49</span>
                <span className="text-gray-500 dark:text-gray-400">/mo</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                50% off · Normally $99
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">10,000 renders/month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">AI crawler detection</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Basic analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">24hr cache</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Email support</span>
              </li>
            </ul>

            <a
              href="#early-access"
              className={`${buttonVariants({ variant: 'outline', size: 'lg' })} w-full group`}
            >
              Get Started
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Pro Plan - Featured */}
          <div className="relative scale-105 rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50 to-purple-50 p-8 shadow-2xl dark:from-indigo-950/50 dark:to-purple-950/50">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                <Sparkles className="size-4" />
                Most Popular
              </span>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Pro</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">For growing businesses</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$149</span>
                <span className="text-gray-500 dark:text-gray-400">/mo</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                50% off · Normally $299
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">50,000 renders/month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">AI citation tracking ⭐</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Schema injection ⭐</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">12hr cache</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Priority support</span>
              </li>
            </ul>

            <a
              href="#early-access"
              className={`${buttonVariants({ size: 'lg' })} w-full bg-gradient-to-r from-indigo-600 to-purple-600 group shadow-xl hover:shadow-2xl`}
            >
              Start Free Trial
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-indigo-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Rocket className="size-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">For high-traffic sites</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$499</span>
                <span className="text-gray-500 dark:text-gray-400">/mo</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-green-600 dark:text-green-400">
                50% off · Normally $999
              </p>
            </div>

            <ul className="mb-8 space-y-3">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">250,000 renders/month</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Everything in Pro</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Custom schema rules</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">6hr cache</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Dedicated support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 size-5 shrink-0 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">SLA guarantee</span>
              </li>
            </ul>

            <a
              href="#early-access"
              className={`${buttonVariants({ variant: 'outline', size: 'lg' })} w-full group`}
            >
              Contact Sales
              <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 space-y-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            💎 <span className="font-semibold text-gray-900 dark:text-white">Lifetime 50% discount</span> for first 100 users • 
            🚀 <span className="font-semibold text-gray-900 dark:text-white">No credit card required</span> to join • 
            ⚡ <span className="font-semibold text-gray-900 dark:text-white">Cancel anytime</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            📊 <span className="font-semibold">Transparent overage pricing:</span> $0.50 per 1,000 additional renders (46% cheaper than competitors) • 
            🔔 <span className="font-semibold">Proactive alerts:</span> Get notified at 80% usage • 
            🔒 <span className="font-semibold">No hidden fees</span>
          </p>
        </div>
      </div>
    </Section>
    </div>
  );
};
