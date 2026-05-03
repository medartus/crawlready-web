import { ArrowRight } from 'lucide-react';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { Section } from '@/features/landing/Section';

export const Hero = () => {
  return (
    <Section className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-light leading-tight tracking-tight text-cr-fg md:text-5xl lg:text-6xl">
          What ChatGPT actually sees
          {' '}
          <span className="font-semibold">on your site</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-cr-fg-secondary md:text-xl">
          Only 31% of AI crawlers can render JavaScript.
          If your site uses React, Vue, or Angular, most of your content is invisible to ChatGPT, Perplexity, and Claude.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            className={`${buttonVariants({ size: 'lg' })} bg-cr-primary px-6 text-cr-primary-fg transition-colors hover:bg-cr-primary-hover`}
            href="/crawler-checker"
          >
            Scan your site
            <ArrowRight className="ml-2 size-5" />
          </a>

          <a
            className={`${buttonVariants({ variant: 'outline', size: 'lg' })} border-cr-border px-6 text-cr-fg-secondary transition-colors hover:bg-cr-primary-soft hover:text-cr-primary`}
            href="#early-access"
          >
            Join early access
          </a>
        </div>

        <p className="mt-6 text-sm text-cr-fg-muted">
          Free scan, no account required. Early access users get 50% off for life.
        </p>
      </div>
    </Section>
  );
};
