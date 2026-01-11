import { ArrowLeft, ArrowRight, Calendar, Clock, Share2 } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { badgeVariants } from '@/components/ui/badgeVariants';
import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { mdxComponents } from '@/libs/mdx';
import { getAllPostSlugs, getPostBySlug } from '@/libs/mdx/blog';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: { locale: string; slug: string } }) {
  const post = await getPostBySlug(props.params.slug);

  if (!post) {
    return {
      title: 'Post Not Found - CrawlReady Blog',
    };
  }

  return {
    title: `${post.title} - CrawlReady Blog`,
    description: post.excerpt,
  };
}

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map(slug => ({ slug }));
}

const BlogPostPage = async (props: { params: { locale: string; slug: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  const post = await getPostBySlug(props.params.slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <LandingNavbar />

      {/* Article Header */}
      <Section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="size-4" />
            Back to Blog
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`${badgeVariants({ variant: 'default' })} bg-indigo-600`}>
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="size-4" />
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="size-4" />
              {post.readTime}
            </span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
            {post.title}
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300">
            {post.excerpt}
          </p>
        </div>
      </Section>

      {/* Article Content */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <article className="prose prose-lg prose-gray dark:prose-invert prose-headings:font-bold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-indigo-400 mx-auto max-w-3xl">
          <MDXRemote source={post.content} components={mdxComponents} />
        </article>
      </Section>

      {/* Share & CTA */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-3xl">
          {/* Share */}
          <div className="mb-12 flex items-center justify-between border-b border-gray-200 pb-8 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Share this article
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://crawlready.com/blog/${props.params.slug}`)}&via=medartus`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${buttonVariants({ variant: 'outline', size: 'sm' })} gap-2`}
              >
                <Share2 className="size-4" />
                Tweet
              </a>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 text-center dark:border-indigo-800 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30">
            <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
              Ready to Make Your Site Visible to AI?
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Join CrawlReady&apos;s early access and get 50% off forever.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/crawler-checker"
                className={`${buttonVariants({ variant: 'outline' })} gap-2`}
              >
                Free Crawler Checker
              </Link>
              <Link
                href="/#early-access"
                className={`${buttonVariants()} gap-2`}
              >
                Join Early Access
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

export default BlogPostPage;
