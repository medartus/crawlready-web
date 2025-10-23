import { Play } from 'lucide-react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const DemoSection = () => {
  return (
    <div id="demo">
      <Section
        subtitle="See It In Action"
        title="Watch How CrawlReady Works"
        description="5-minute setup. Zero code changes. Instant AI visibility."
      >
      <div className="mx-auto max-w-5xl">
        {/* Video Placeholder */}
        <div className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 shadow-2xl transition-all hover:border-indigo-400 hover:shadow-indigo-500/20 dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
          {/* Aspect Ratio Container */}
          <div className="relative aspect-video">
            {/* Placeholder Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              {/* Play Button */}
              <button
                type="button"
                className="group/play mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 shadow-2xl transition-all hover:scale-110 hover:shadow-indigo-500/50"
                aria-label="Play demo video"
              >
                <Play className="ml-1 size-10 fill-white text-white transition-transform group-hover/play:scale-110" />
              </button>

              {/* Text */}
              <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Demo Video Coming Soon
              </h3>
              <p className="mb-6 max-w-md text-center text-gray-600 dark:text-gray-400">
                Watch how to set up CrawlReady in 5 minutes and start getting cited in ChatGPT answers
              </p>

              {/* Features List */}
              <div className="grid gap-3 text-left md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-indigo-600" />
                  <span>5-minute integration walkthrough</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-purple-600" />
                  <span>AI citation tracking demo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-pink-600" />
                  <span>Dashboard tour</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="size-2 rounded-full bg-green-600" />
                  <span>Real results showcase</span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute left-4 top-4 size-16 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="absolute bottom-4 right-4 size-20 rounded-full bg-purple-500/10 blur-2xl" />
          </div>
        </div>

        {/* CTA Below Video */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Want to see it live? Join early access and we'll give you a personal walkthrough.
          </p>
          <a
            href="#early-access"
            className={`${buttonVariants({ size: 'lg' })} bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl hover:shadow-2xl`}
          >
            Get Early Access
          </a>
        </div>

        {/* Stats Below - Unique differentiators */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-1 text-3xl font-bold text-indigo-600 dark:text-indigo-400">All</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Frameworks supported (React, Vue, Angular, Next.js)</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-1 text-3xl font-bold text-purple-600 dark:text-purple-400">70%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cache hit rate (reduces costs)</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-1 text-3xl font-bold text-pink-600 dark:text-pink-400">Weekly</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatic updates (no maintenance)</p>
          </div>
        </div>
      </div>
      </Section>
    </div>
  );
};
