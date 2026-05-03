import { Check, X } from 'lucide-react';

import { Background } from '@/components/Background';
import { Section } from '@/features/landing/Section';

const rows = [
  { feature: 'AI Citation Tracking', cr: true, prerender: false, diy: false },
  { feature: 'AI-Optimized Schema', cr: true, prerender: false, diy: 'Manual' },
  { feature: 'AI Crawler Analytics', cr: true, prerender: 'Basic', diy: false },
  { feature: 'Render Speed', cr: '<200ms', prerender: '~500ms', diy: 'Varies' },
  { feature: 'Setup Time', cr: '5 min', prerender: '5 min', diy: '3-6 months' },
  { feature: 'Starter Cost', cr: '$29/mo', prerender: '$90/mo', diy: '$10K+ dev' },
  { feature: 'Maintenance', cr: 'Zero', prerender: 'Minimal', diy: '10-20 hrs/mo' },
];

const CellValue = ({ value }: { value: boolean | string }) => {
  if (value === true) {
    return <Check className="text-cr-score-good mx-auto size-5" />;
  }
  if (value === false) {
    return <X className="text-cr-fg-muted mx-auto size-5" />;
  }
  return <span className="text-cr-fg-secondary text-sm">{value}</span>;
};

export const ComparisonSection = () => {
  return (
    <Background className="bg-cr-surface">
      <Section
        subtitle="COMPARISON"
        title="How CrawlReady compares"
        description="Pre-rendering built for AI search, not retrofitted from SEO tools."
      >
        <div className="mx-auto max-w-4xl">
          <div className="border-cr-border bg-cr-bg overflow-hidden rounded-xl border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-cr-border border-b">
                    <th className="text-cr-fg px-5 py-3 text-left font-semibold">Feature</th>
                    <th className="bg-cr-primary-soft text-cr-primary px-5 py-3 text-center font-semibold">CrawlReady</th>
                    <th className="text-cr-fg-muted px-5 py-3 text-center font-semibold">Prerender.io</th>
                    <th className="text-cr-fg-muted px-5 py-3 text-center font-semibold">DIY</th>
                  </tr>
                </thead>
                <tbody className="divide-cr-border-subtle divide-y">
                  {rows.map(row => (
                    <tr key={row.feature}>
                      <td className="text-cr-fg px-5 py-3 font-medium">{row.feature}</td>
                      <td className="bg-cr-primary-soft/50 px-5 py-3 text-center"><CellValue value={row.cr} /></td>
                      <td className="px-5 py-3 text-center"><CellValue value={row.prerender} /></td>
                      <td className="px-5 py-3 text-center"><CellValue value={row.diy} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Section>
    </Background>
  );
};
