import { Ban, Clock, TrendingDown } from 'lucide-react';

import { Section } from '@/features/landing/Section';

export const ProblemSection = () => (
  <Section
    id="problem"
    subtitle="THE PROBLEM"
    title="Most JavaScript sites are invisible to AI"
    description="If your site relies on client-side rendering, AI search engines see an empty page. Here's what that looks like."
  >
    <div className="mx-auto max-w-4xl">
      <div className="space-y-6">
        <div className="border-cr-border bg-cr-bg rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="bg-cr-score-critical-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Ban className="text-cr-score-critical size-5" />
            </div>
            <div>
              <h3 className="text-cr-fg text-lg font-semibold">AI crawlers see blank pages</h3>
              <p className="text-cr-fg-secondary mt-1">
                69% of AI crawlers don't execute JavaScript. Your React, Vue, or Angular app sends empty HTML to ChatGPT, Claude, and Perplexity.
              </p>
              <div className="bg-cr-surface text-cr-fg-muted mt-3 rounded-lg p-3 font-mono text-xs">
                &lt;div id="root"&gt;&lt;/div&gt;
                <br />
                &lt;script src="bundle.js"&gt;&lt;/script&gt;
              </div>
            </div>
          </div>
        </div>

        <div className="border-cr-border bg-cr-bg rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="bg-cr-score-poor-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
              <TrendingDown className="text-cr-score-poor size-5" />
            </div>
            <div>
              <h3 className="text-cr-fg text-lg font-semibold">Your competitors get cited, you don't</h3>
              <p className="text-cr-fg-secondary mt-1">
                OpenAI's SearchGPT, Perplexity, and Claude are replacing Google for millions of users. If they can't read your content, you don't exist in AI-generated answers.
              </p>
            </div>
          </div>
        </div>

        <div className="border-cr-border bg-cr-bg rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="bg-cr-score-fair-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Clock className="text-cr-score-fair size-5" />
            </div>
            <div>
              <h3 className="text-cr-fg text-lg font-semibold">DIY pre-rendering is a time sink</h3>
              <p className="text-cr-fg-secondary mt-1">
                Building your own pre-rendering pipeline requires headless browsers, caching infrastructure, and continuous maintenance. Teams spend months and $10K+ getting it right.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Section>
);
