import { Sparkles } from 'lucide-react';
import { unstable_setRequestLocale } from 'next-intl/server';

import { CrawlerCheckerForm } from '@/components/CrawlerCheckerForm';
import { badgeVariants } from '@/components/ui/badgeVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export const metadata = {
  title: 'Free AI Crawler Checker - Test Your Website | CrawlReady',
  description: 'Check if ChatGPT, Claude, and Perplexity can properly crawl and index your website. Free tool, instant results, no signup required.',
};

const CrawlerCheckerPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-24 md:py-32">
        {/* Animated background gradient - matching Hero */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.1),transparent_50%)]" />

        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className={`${badgeVariants({ variant: 'outline' })} border-indigo-200 bg-white shadow-sm dark:border-indigo-800 dark:bg-gray-900`}>
              <Sparkles className="mr-2 size-4 text-indigo-600 dark:text-indigo-400" />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text font-semibold text-transparent dark:bg-none dark:!text-white">
                Free AI Crawler Compatibility Checker
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            <span className="block text-gray-900 dark:text-white">
              Can AI Crawlers
            </span>
            <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              See Your Website?
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-3xl text-xl text-gray-600 md:text-2xl dark:text-gray-300">
            Test if ChatGPT, Claude, Perplexity, and other AI search engines can properly crawl your JavaScript-heavy website.
            {' '}
            <span className="font-semibold text-gray-900 dark:text-white">Get instant results</span>
            {' '}
            with actionable recommendations.
          </p>

          {/* Form */}
          <div className="mb-12 flex justify-center">
            <CrawlerCheckerForm className="w-full" />
          </div>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                No signup required
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-indigo-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Instant results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-purple-500" />
              <span className="text-gray-600 dark:text-gray-400">
                100% free forever
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* Why It Matters Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Why AI Crawler Compatibility Matters
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Card 1 */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
              <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-3xl text-white shadow-lg">
                🔍
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                AI Search is Growing
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                ChatGPT, Perplexity, and other AI search engines are becoming major traffic sources. If they can't crawl your site,
                {' '}
                <span className="font-semibold text-gray-900 dark:text-white">you're invisible</span>
                .
              </p>
            </div>

            {/* Card 2 */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
              <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-3xl text-white shadow-lg">
                ⚠️
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                JavaScript Problem
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-gray-900 dark:text-white">Only 31% of AI crawlers</span>
                {' '}
                support JavaScript rendering. If your site is built with React, Vue, or Angular, you might be invisible.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-800">
              <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-3xl text-white shadow-lg">
                💡
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                Easy to Fix
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our free tool identifies exactly what's wrong and gives you
                {' '}
                <span className="font-semibold text-gray-900 dark:text-white">actionable steps</span>
                {' '}
                to fix it. No technical expertise required.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* What We Check Section */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            What We Check
          </h2>

          <div className="space-y-6">
            {[
              {
                number: '1',
                title: 'JavaScript Rendering',
                description: 'We test if your content is visible without JavaScript execution, critical for crawlers like PerplexityBot that don\'t support JS.',
                gradient: 'from-indigo-500 to-purple-600',
              },
              {
                number: '2',
                title: 'Structured Data',
                description: 'We verify if you have Schema.org markup that helps AI crawlers understand your content and increases citation chances.',
                gradient: 'from-purple-500 to-pink-600',
              },
              {
                number: '3',
                title: 'Content Accessibility',
                description: 'We analyze your content structure and ensure it\'s accessible to all major AI crawlers including GPTBot, ClaudeBot, and more.',
                gradient: 'from-pink-500 to-rose-600',
              },
              {
                number: '4',
                title: 'Compatibility Score',
                description: 'Get a detailed 0-100 score for each major AI crawler with specific recommendations to improve visibility.',
                gradient: 'from-indigo-600 to-indigo-700',
              },
            ].map(item => (
              <div
                key={item.number}
                className="group flex items-start gap-6 rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-indigo-200 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-800"
              >
                <div className={`flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-2xl font-bold text-white shadow-lg`}>
                  {item.number}
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section - Accessible Design */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-12 shadow-xl dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <div className="text-center">
              <div className="mb-6 text-6xl">🚀</div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                Ready to Check Your Website?
              </h2>
              <p className="mb-10 text-xl text-gray-700 dark:text-gray-300">
                Get instant insights into your website's AI crawler compatibility
              </p>
              <div className="mx-auto max-w-2xl">
                <CrawlerCheckerForm />
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span>Instant analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Actionable recommendations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* FAQ Section */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                question: 'Is this tool really free?',
                answer: 'Yes! This tool is 100% free with no signup required. We built it to help the community and showcase what CrawlReady can do.',
              },
              {
                question: 'Which AI crawlers do you check?',
                answer: 'We test compatibility with GPTBot (ChatGPT), ClaudeBot (Anthropic), PerplexityBot, GoogleBot, and other major AI crawlers.',
              },
              {
                question: 'How accurate are the results?',
                answer: 'We use industry-standard testing methods to simulate how different AI crawlers interact with your site. Results are indicative but may vary based on actual crawler behavior.',
              },
              {
                question: 'What if my site scores poorly?',
                answer: 'Don\'t worry! Our tool provides specific, actionable recommendations to improve your score. You can also use CrawlReady\'s paid service to automatically fix these issues.',
              },
            ].map((faq, index) => (
              <details
                key={index}
                className="group rounded-xl border border-gray-200 bg-white transition-all hover:border-indigo-200 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-800"
              >
                <summary className="cursor-pointer p-6 font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {faq.question}
                </summary>
                <div className="border-t border-gray-200 px-6 pb-6 pt-4 text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default CrawlerCheckerPage;
