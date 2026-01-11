import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { DocsNavigationLinks, DocsSidebar } from '@/components/DocsSidebar';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { mdxComponents } from '@/libs/mdx';
import { getAllDocSlugs, getDocBySlug, getDocNavigation, getDocsSidebar } from '@/libs/mdx/docs';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

type DocsPageProps = {
  params: {
    locale: string;
    slug: string[];
  };
};

export async function generateMetadata(props: DocsPageProps) {
  const slug = props.params.slug.join('/');
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return {
      title: 'Page Not Found - CrawlReady Docs',
    };
  }

  return {
    title: `${doc.title} - CrawlReady Docs`,
    description: doc.description,
  };
}

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs();
  return slugs.map(slug => ({
    slug: slug.split('/'),
  }));
}

const DocsContentPage = async (props: DocsPageProps) => {
  unstable_setRequestLocale(props.params.locale);

  const slug = props.params.slug.join('/');
  const [doc, navigation, docNavigation] = await Promise.all([
    getDocBySlug(slug),
    getDocsSidebar(),
    getDocNavigation(slug),
  ]);

  if (!doc) {
    notFound();
  }

  return (
    <>
      <LandingNavbar />

      {/* Header */}
      <Section className="relative overflow-hidden border-b border-gray-200 py-12 dark:border-gray-700">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/docs" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Docs
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{doc.section}</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
              {doc.description}
            </p>
          )}
        </div>
      </Section>

      {/* Main Content */}
      <Section className="bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl gap-12">
          {/* Sidebar */}
          <DocsSidebar navigation={navigation} />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <article className="prose prose-lg prose-gray dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-bold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-indigo-400 max-w-none">
              <MDXRemote source={doc.content} components={mdxComponents} />
            </article>

            {/* Previous / Next Navigation */}
            <DocsNavigationLinks prev={docNavigation.prev} next={docNavigation.next} />

            {/* Help CTA */}
            <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Need Help?
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Can&apos;t find what you&apos;re looking for? Reach out and we&apos;ll help.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/contact"
                  className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-2`}
                >
                  Contact Support
                </Link>
                <a
                  href="https://twitter.com/medartus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ size: 'sm' })} gap-2`}
                >
                  Ask @medartus
                  <ArrowRight className="size-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default DocsContentPage;
