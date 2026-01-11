'use client';

import { ArrowRight, Key, LineChart, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="space-y-8">
        {/* Quick Stats */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t('quick_stats_title')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Zap className="size-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('renders_today')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <LineChart className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('cache_hit_rate')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <svg className="size-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('ai_crawlers_detected')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started */}
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {t('getting_started_title')}
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {t('getting_started_description')}
          </p>

          <div className="space-y-4">
            {/* Step 1: Generate API Key */}
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('step1_title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('step1_description')}
                </p>
                <Link
                  href="/dashboard/api-keys"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-3 gap-2`}
                >
                  <Key className="size-4" />
                  Generate API Key
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Step 2: Add Middleware */}
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-sm font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('step2_title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('step2_description')}
                </p>
                <Link
                  href="/docs"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-3 gap-2`}
                >
                  View Documentation
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Step 3: Verify Setup */}
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-indigo-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-sm font-bold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('step3_title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('step3_description')}
                </p>
                <Link
                  href="/crawler-checker"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mt-3 gap-2`}
                >
                  Check Your Site
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 dark:border-indigo-800 dark:from-indigo-950/30 dark:to-purple-950/30">
          <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
            Need Help?
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Documentation
            </Link>
            <Link
              href="/crawler-checker"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Free Crawler Checker
            </Link>
            <Link
              href="/schema-checker"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Free Schema Checker
            </Link>
            <a
              href="https://twitter.com/medartus"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Contact @medartus
            </a>
          </div>
        </section>
      </div>
    </>
  );
};

export default DashboardIndexPage;
