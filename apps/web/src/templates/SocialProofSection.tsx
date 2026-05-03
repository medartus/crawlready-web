import { Code2, ShoppingCart, FileText, Building2 } from 'lucide-react';

import { Background } from '@/components/Background';
import { Section } from '@/features/landing/Section';

const segments = [
  {
    icon: Code2,
    label: 'SaaS platforms',
    detail: 'React, Vue, Angular SPAs where AI visibility drives signups',
  },
  {
    icon: ShoppingCart,
    label: 'E-commerce stores',
    detail: 'Headless storefronts with product pages AI can\'t render',
  },
  {
    icon: FileText,
    label: 'Content publishers',
    detail: 'Documentation and blogs losing traffic to AI-generated answers',
  },
  {
    icon: Building2,
    label: 'Enterprise portals',
    detail: 'Knowledge bases and support docs invisible to AI assistants',
  },
];

export const SocialProofSection = () => {
  return (
    <Background className="bg-cr-surface">
      <Section
        subtitle="WHO IT'S FOR"
        title="Built for JavaScript-heavy sites"
        description="If your site relies on client-side rendering, CrawlReady makes it visible to AI."
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {segments.map(segment => (
            <div key={segment.label} className="flex items-start gap-4 rounded-xl border border-cr-border bg-cr-bg p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cr-primary-soft">
                <segment.icon className="size-5 text-cr-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-cr-fg">{segment.label}</h3>
                <p className="mt-1 text-sm text-cr-fg-secondary">{segment.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </Background>
  );
};
