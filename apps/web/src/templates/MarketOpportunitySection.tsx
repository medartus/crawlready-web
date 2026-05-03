import { Section } from '@/features/landing/Section';

export const MarketOpportunitySection = () => {
  return (
    <Section
      subtitle="CONTEXT"
      title="AI search is already replacing traditional search for millions of users"
      description="ChatGPT, Perplexity, and Claude now answer questions with citations. If your content isn't crawlable, it isn't cited."
    >
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-cr-border bg-cr-bg p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-cr-fg-muted">Late 2024</p>
              <p className="mt-1 text-cr-fg">
                ChatGPT Search launched. Perplexity passed 100M users. AI-powered search moved from niche to mainstream.
              </p>
            </div>
            <div className="border-t border-cr-border-subtle" />
            <div>
              <p className="text-sm font-semibold text-cr-primary">Now</p>
              <p className="mt-1 text-cr-fg">
                Over 500M people use AI search daily. Sites that are crawlable get cited. Sites that aren't are invisible.
              </p>
            </div>
            <div className="border-t border-cr-border-subtle" />
            <div>
              <p className="text-sm font-semibold text-cr-fg-muted">What this means</p>
              <p className="mt-1 text-cr-fg">
                JavaScript-heavy sites are at a disadvantage. Most AI crawlers can't render client-side content.
                CrawlReady closes that gap.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};
