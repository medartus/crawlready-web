import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { DocsSidebar } from '@/components/DocsSidebar';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { getDocsSidebar } from '@/libs/mdx/docs';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Docs',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const DocsPage = async (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  const navigation = await getDocsSidebar();

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
            Documentation
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            Everything you need to integrate CrawlReady and optimize your site for AI crawlers.
          </p>
        </div>
      </Section>

      {/* Main Content */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl gap-12">
          {/* Sidebar */}
          <DocsSidebar navigation={navigation} />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
              <h2>Welcome to CrawlReady Documentation</h2>

              <p>
                CrawlReady makes your JavaScript site visible to AI search engines like ChatGPT,
                Perplexity, and Claude. Our documentation will help you get set up quickly and
                make the most of our platform.
              </p>

              <h3>Quick Links</h3>

              <div className="not-prose grid gap-4 md:grid-cols-2">
                {navigation.sections.map(section => (
                  <div
                    key={section.title}
                    className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-300 dark:border-gray-700 dark:hover:border-indigo-600"
                  >
                    <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h4>
                    <ul className="space-y-1">
                      {section.docs.slice(0, 3).map(doc => (
                        <li key={doc.slug}>
                          <Link
                            href={`/docs/${doc.slug}`}
                            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                          >
                            <ArrowRight className="size-3" />
                            {doc.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <h3>Getting Help</h3>

              <p>
                Can&apos;t find what you&apos;re looking for? We&apos;re here to help:
              </p>

              <ul>
                <li>
                  <strong>Email:</strong>
                  {' '}
                  <a href="mailto:support@crawlready.com">support@crawlready.com</a>
                </li>
                <li>
                  <strong>Twitter:</strong>
                  {' '}
                  <a href="https://twitter.com/medartus" target="_blank" rel="noopener noreferrer">
                    @medartus
                  </a>
                </li>
              </ul>
            </div>

            {/* Get Started CTA */}
            <div className="mt-12 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
              <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                Ready to Get Started?
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                Follow our quick start guide to integrate CrawlReady in 5 minutes.
              </p>
              <Link
                href="/docs/getting-started"
                className={`${buttonVariants()} gap-2`}
              >
                Quick Start Guide
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default DocsPage;
