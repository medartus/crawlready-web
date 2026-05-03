import { Check, X } from 'lucide-react';

import { Background } from '@/components/Background';
import { Section } from '@/features/landing/Section';

export const DemoSection = () => (
  <Background className="bg-cr-surface">
    <Section
      id="demo"
      subtitle="BEFORE AND AFTER"
      title="What changes when AI crawlers can read your site"
    >
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border-cr-border bg-cr-bg rounded-xl border p-6">
            <div className="text-cr-score-critical mb-3 text-sm font-semibold uppercase tracking-wide">
              Without optimization
            </div>
            <h3 className="text-cr-fg mb-3 text-lg font-semibold">
              AI crawlers see an empty page
            </h3>
            <ul className="text-cr-fg-secondary space-y-2">
              <li className="flex items-start gap-2">
                <X className="text-cr-score-critical mt-0.5 size-4 shrink-0" />
                Empty HTML with JavaScript bundles
              </li>
              <li className="flex items-start gap-2">
                <X className="text-cr-score-critical mt-0.5 size-4 shrink-0" />
                No structured data or metadata
              </li>
              <li className="flex items-start gap-2">
                <X className="text-cr-score-critical mt-0.5 size-4 shrink-0" />
                Missing from AI-generated answers
              </li>
            </ul>
          </div>

          <div className="border-cr-border bg-cr-bg rounded-xl border p-6">
            <div className="text-cr-score-good mb-3 text-sm font-semibold uppercase tracking-wide">
              With CrawlReady
            </div>
            <h3 className="text-cr-fg mb-3 text-lg font-semibold">
              Your content gets cited
            </h3>
            <ul className="text-cr-fg-secondary space-y-2">
              <li className="flex items-start gap-2">
                <Check className="text-cr-score-good mt-0.5 size-4 shrink-0" />
                Pre-rendered, crawlable HTML
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-cr-score-good mt-0.5 size-4 shrink-0" />
                Rich schema markup for AI understanding
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-cr-score-good mt-0.5 size-4 shrink-0" />
                Cited in ChatGPT, Perplexity, and Claude
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  </Background>
);
