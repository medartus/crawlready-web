import { ArrowRight, Book, Code, Rocket, Zap } from 'lucide-react';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
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

const DocsPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  const docSections = [
    {
      icon: Rocket,
      title: 'Getting Started',
      description: 'Set up CrawlReady in 5 minutes with our quick start guide.',
      links: [
        { title: 'Quick Start Guide', href: '#quick-start' },
        { title: 'Installation', href: '#installation' },
        { title: 'Configuration', href: '#configuration' },
      ],
    },
    {
      icon: Code,
      title: 'API Reference',
      description: 'Complete API documentation for the CrawlReady render service.',
      links: [
        { title: 'Authentication', href: '#authentication' },
        { title: 'Render Endpoint', href: '#render-endpoint' },
        { title: 'Cache Management', href: '#cache-management' },
      ],
    },
    {
      icon: Zap,
      title: 'Integrations',
      description: 'Framework-specific guides for Next.js, React, Vue, and more.',
      links: [
        { title: 'Next.js', href: '#nextjs' },
        { title: 'React', href: '#react' },
        { title: 'Vue / Nuxt', href: '#vue' },
      ],
    },
    {
      icon: Book,
      title: 'Guides',
      description: 'In-depth tutorials and best practices for AI search optimization.',
      links: [
        { title: 'AI Crawler Detection', href: '#crawler-detection' },
        { title: 'Schema Markup', href: '#schema-markup' },
        { title: 'Performance Optimization', href: '#performance' },
      ],
    },
  ];

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-20 md:py-28">
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

      {/* Quick Start */}
      <Section id="quick-start" className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            Quick Start
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                1
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Generate an API Key
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  Sign up for CrawlReady and generate your API key from the dashboard.
                </p>
                <Link
                  href="/dashboard/api-keys"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-2`}
                >
                  Go to API Keys
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                2
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Add the Middleware
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  Add our middleware to detect AI crawlers and serve pre-rendered content.
                </p>
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                  <code>
                    {`// middleware.ts (Next.js example)
import { crawlreadyMiddleware } from '@crawlready/middleware';

export default crawlreadyMiddleware({
  apiKey: process.env.CRAWLREADY_API_KEY,
});`}
                  </code>
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                3
              </div>
              <div className="flex-1">
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Verify Your Setup
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  Use our free crawler checker to verify AI crawlers can now see your content.
                </p>
                <Link
                  href="/crawler-checker"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-2`}
                >
                  Check Your Site
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Documentation Sections */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
            Documentation Sections
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {docSections.map(section => (
              <div
                key={section.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <section.icon className="size-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <ArrowRight className="size-3" />
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* API Reference Preview */}
      <Section id="authentication" className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">
            API Reference
          </h2>

          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Authentication
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                All API requests require authentication using your API key in the header:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
                <code>
                  {`curl -X POST https://api.crawlready.com/render \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`}
                </code>
              </pre>
            </div>

            <div id="render-endpoint">
              <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Render Endpoint
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Submit a URL for rendering and receive pre-rendered HTML optimized for AI crawlers.
              </p>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <code className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    POST /render
                  </code>
                </div>
                <div className="p-4">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Request Body:</p>
                  <pre className="overflow-x-auto rounded bg-gray-100 p-3 text-sm dark:bg-gray-900">
                    <code>
                      {`{
  "url": "https://example.com/page",
  "waitFor": "networkidle0",
  "timeout": 30000
}`}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Help CTA */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:border-gray-700 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Need Help?
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Can&apos;t find what you&apos;re looking for? Reach out and we&apos;ll help you get set up.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className={`${buttonVariants({ variant: 'outline' })} gap-2`}
            >
              Contact Support
            </Link>
            <a
              href="https://twitter.com/medartus"
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonVariants()} gap-2`}
            >
              Ask @medartus
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default DocsPage;
