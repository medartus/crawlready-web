import { ArrowRight, Github, MessageCircle, Twitter, Users } from 'lucide-react';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';
import { LandingFooter } from '@/templates/LandingFooter';
import { LandingNavbar } from '@/templates/LandingNavbar';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Community',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const CommunityPage = (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  return (
    <>
      <LandingNavbar />

      {/* Hero Section */}
      <Section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20" />

        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl dark:text-white">
            Join the Community
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            Connect with other developers and marketers optimizing for AI search.
            Share insights, get help, and stay updated on the latest in AI crawler optimization.
          </p>
        </div>
      </Section>

      {/* Community Channels */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Twitter */}
            <a
              href="https://twitter.com/medartus"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-blue-400 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
            >
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg transition-transform group-hover:scale-110">
                <Twitter className="size-8" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Twitter / X
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Follow @medartus for real-time updates, AI search insights, and build-in-public content.
                DMs are open for questions!
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                Follow @medartus
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/crawlready"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-gray-400 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-500"
            >
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg transition-transform group-hover:scale-110">
                <Github className="size-8" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                GitHub
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Star our repos, report issues, and contribute to open-source tools for AI search optimization.
              </p>
              <span className="inline-flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                View on GitHub
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>

            {/* Discord (Coming Soon) */}
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 dark:border-gray-600 dark:bg-gray-800/50">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 text-white opacity-50 shadow-lg">
                <MessageCircle className="size-8" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-500 dark:text-gray-400">
                Discord
              </h3>
              <p className="mb-4 text-gray-500 dark:text-gray-500">
                A dedicated Discord community is coming soon. Join the waitlist to be notified when it launches.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-400">
                Coming Soon
              </span>
            </div>

            {/* Community Forum (Coming Soon) */}
            <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 dark:border-gray-600 dark:bg-gray-800/50">
              <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 text-white opacity-50 shadow-lg">
                <Users className="size-8" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-500 dark:text-gray-400">
                Community Forum
              </h3>
              <p className="mb-4 text-gray-500 dark:text-gray-500">
                A place to share case studies, ask questions, and discuss AI search strategies. Coming soon.
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-400">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </Section>

      {/* What to Expect */}
      <Section className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900 dark:text-white">
            What You&apos;ll Find
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                AI Search Insights
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Latest research on how AI crawlers work and how to optimize for them.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <span className="text-2xl">🛠️</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Technical Help
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help with integration, troubleshooting, and best practices.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/30">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                Success Stories
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Learn from others who&apos;ve improved their AI search visibility.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            Start the Conversation
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            The best way to connect right now is on Twitter. Follow @medartus and say hi!
          </p>
          <a
            href="https://twitter.com/medartus"
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonVariants({ size: 'lg' })} gap-2`}
          >
            <Twitter className="size-5" />
            Follow @medartus
          </a>
        </div>
      </Section>

      <LandingFooter />
    </>
  );
};

export default CommunityPage;
