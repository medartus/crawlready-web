import { ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'About',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const AboutPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            Making JavaScript Sites
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Visible to AI
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            CrawlReady helps businesses get cited in ChatGPT, Perplexity, and Claude answers
            without rebuilding their websites.
          </p>
        </div>
      </Section>

      {/* The Problem Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            The Problem We&apos;re Solving
          </h2>

          <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
            <p>
              <strong className="text-gray-900 dark:text-white">98.9% of websites use JavaScript.</strong>
              {' '}
              Modern web applications are built with React, Vue, Angular, and other JavaScript
              frameworks that create dynamic, interactive experiences.
            </p>

            <p>
              But there&apos;s a problem:
              {' '}
              <strong className="text-gray-900 dark:text-white">only 31% of AI crawlers can render JavaScript.</strong>
              {' '}
              When ChatGPT&apos;s GPTBot, Perplexity&apos;s crawler, or other AI search engines visit your
              site, they often see a blank page—just an empty div and a loading spinner.
            </p>

            <p>
              This means your content is invisible to AI search. When users ask ChatGPT about
              your product category, your competitors get cited. You don&apos;t. You&apos;re losing
              qualified leads to brands with worse products but better AI visibility.
            </p>

            <div className="my-8 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-6 dark:border-indigo-800 dark:bg-indigo-950/30">
              <p className="text-center text-xl font-semibold text-indigo-900 dark:text-indigo-100">
                &quot;AI search is growing 400% year-over-year. If you&apos;re not optimizing for it,
                you&apos;re falling behind.&quot;
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Our Solution Section */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            Our Solution
          </h2>

          <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
            <p>
              CrawlReady detects AI crawlers (GPTBot, PerplexityBot, ClaudeBot, and others) and
              serves them pre-rendered HTML in under 200ms. No code changes required. Setup
              takes 5 minutes.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Zap className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Lightning Fast
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sub-200ms rendering ensures AI crawlers get your content before they timeout.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <svg className="size-6 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Zero Code Changes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Simple middleware integration. Works with Next.js, React, Vue, Angular, and more.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <svg className="size-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  AI-Optimized Schema
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatically inject LLM-friendly structured data that AI models understand.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <svg className="size-6 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 17V9" />
                    <path d="M13 17V5" />
                    <path d="M8 17v-3" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Citation Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get alerts when ChatGPT, Perplexity, or Claude cite your content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Founder Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            About the Founder
          </h2>

          <div className="flex flex-col items-start gap-8 md:flex-row">
            <div className="shrink-0">
              <div className="flex size-32 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl font-bold text-white shadow-xl">
                M
              </div>
            </div>

            <div className="space-y-4 text-lg text-gray-600 dark:text-gray-300">
              <p>
                CrawlReady is built by
                {' '}
                <a
                  href="https://twitter.com/medartus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  @medartus
                </a>
                , a developer passionate about making the web more accessible to AI systems.
              </p>

              <p>
                After seeing how many JavaScript-heavy sites were invisible to AI crawlers,
                I decided to build a solution that doesn&apos;t require companies to rebuild
                their entire frontend stack.
              </p>

              <p>
                I&apos;m building CrawlReady in public and sharing the journey on Twitter.
                Follow along for updates, insights, and early access to new features.
              </p>

              <div className="pt-4">
                <a
                  href="https://twitter.com/medartus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants()} gap-2`}
                >
                  Follow @medartus
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:border-gray-700 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
            Check if AI crawlers can see your site with our free tool, or join early access
            to get full optimization.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/crawler-checker"
              className={`${buttonVariants({ size: 'lg' })} gap-2`}
            >
              Free Crawler Checker
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/#early-access"
              className={`${buttonVariants({ variant: 'outline', size: 'lg' })} gap-2`}
            >
              Join Early Access
            </Link>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default AboutPage;
