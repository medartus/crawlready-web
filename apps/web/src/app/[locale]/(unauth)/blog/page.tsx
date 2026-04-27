import { ArrowRight, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { getAllPosts, getFeaturedPost } from '@/libs/mdx/blog';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Blog',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const BlogPage = async (props: { params: Promise<{ locale: string }> }) => {
  const { locale } = await props.params;
  setRequestLocale(locale);

  const allPosts = await getAllPosts();
  const featuredPost = await getFeaturedPost();
  const regularPosts = allPosts.filter(post => !post.featured);

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
            CrawlReady Blog
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            Expert insights on AI search optimization, JavaScript rendering, and getting your content
            cited by ChatGPT, Perplexity, and Claude.
          </p>
        </div>
      </Section>

      {/* Featured Post */}
      {featuredPost && (
        <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-8 text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Featured Article
            </h2>

            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group block overflow-hidden rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 transition-all hover:border-indigo-300 hover:shadow-2xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 dark:hover:border-indigo-600"
            >
              <div className="p-8 md:p-12">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className={`${badgeVariants({ variant: 'default' })} bg-indigo-600`}>
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="size-4" />
                    {new Date(featuredPost.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="size-4" />
                    {featuredPost.readTime}
                  </span>
                </div>

                <h3 className="mb-4 text-3xl font-bold text-gray-900 transition-colors group-hover:text-indigo-600 md:text-4xl dark:text-white dark:group-hover:text-indigo-400">
                  {featuredPost.title}
                </h3>

                <p className="mb-6 text-lg text-gray-600 dark:text-gray-300">
                  {featuredPost.excerpt}
                </p>

                <span className={`${buttonVariants()} gap-2`}>
                  Read Article
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </div>
        </Section>
      )}

      {/* All Posts */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
            All Articles
          </h2>

          <div className="grid gap-8 md:grid-cols-2">
            {regularPosts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`${badgeVariants({ variant: 'outline' })} text-xs`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                  {post.title}
                </h3>

                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {post.readTime}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    Read more
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {allPosts.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                More articles coming soon! Follow
                {' '}
                <a
                  href="https://twitter.com/medartus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  @medartus
                </a>
                {' '}
                for updates.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Newsletter CTA */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Stay Updated
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            Get the latest insights on AI search optimization delivered to your inbox.
            Follow @medartus on Twitter for real-time updates.
          </p>
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
      </Section>

      <LandingFooter />
    </>
  );
};

export default BlogPage;
