import { ArrowRight, Sparkles } from 'lucide-react';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  return (
    <Section className="relative overflow-hidden py-24 md:py-32">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.1),transparent_50%)]" />

      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <a
            className={`${badgeVariants({ variant: 'outline' })} relative overflow-hidden border-indigo-200 bg-white shadow-sm focus:outline-none focus:ring-0 dark:border-indigo-800 dark:bg-gray-900`}
            href="#early-access"
          >
            <Sparkles className="mr-2 size-4 text-indigo-600 dark:text-indigo-400" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text font-semibold text-transparent dark:bg-none dark:!text-white">
              Phase 0: Early Access Now Open
            </span>
            <ArrowRight className="ml-2 size-4 text-indigo-600 dark:text-indigo-400" />
          </a>
        </div>

        {/* Main Headline */}
        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
          <span className="block text-gray-900 dark:text-white">
            Get Cited in
          </span>
          <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            ChatGPT Answers
          </span>
          <span className="block text-gray-900 dark:text-white">
            Without Rebuilding Your Site
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mb-10 max-w-3xl text-xl text-gray-600 dark:text-gray-300 md:text-2xl">
          <span className="font-semibold text-gray-900 dark:text-white">Only 31% of AI crawlers</span>
          {' '}
          can render JavaScript.
          If your site uses React, Vue, or Angular,
          <span className="font-semibold text-gray-900 dark:text-white">ChatGPT can't see it.</span>
        </p>

        {/* Stats Bar - Unique value props instead of duplicated stats */}
        <div className="mb-12 flex flex-wrap items-center justify-center gap-8 text-sm md:text-base">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">99.97%</span>
              {' '}
              uptime guaranteed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-indigo-500" />
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">67%</span>
              {' '}
              cheaper than alternatives
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">
              <span className="font-bold text-gray-900 dark:text-white">&lt;200ms</span>
              {' '}
              render speed
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            className={`${buttonVariants({ size: 'lg' })} group bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-lg shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/50`}
            href="#early-access"
          >
            Start Free (10K Renders)
            <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            className={`${buttonVariants({ variant: 'outline', size: 'lg' })} border-2 border-indigo-200 px-8 text-lg transition-all hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50`}
            href="#demo"
          >
            See Live Demo
            <svg className="ml-2 size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </a>
        </div>

        {/* Trust Signal */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-500">
          ⚡ One-line integration • 🔒 No credit card required • 🎯 First 100 users get 50% off for life
        </p>
      </div>
    </Section>
  );
};
