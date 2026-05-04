import { EyeOff, GanttChart, Shield } from 'lucide-react';

import { Background } from '@/components/Background';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

export const Features = () => {
  return (
    <div id="features">
      <Background className="bg-cr-surface">
        <Section
          subtitle="The Problem"
          title="Why is Your Site Invisible to AI?"
          description="Your modern web app is likely built with JavaScript. That's great for users, but it means AI crawlers see a blank page. You're not getting cited, and you're losing traffic."
        >
          <div className="grid grid-cols-1 gap-x-3 gap-y-8 md:grid-cols-3">
            {/* Feature 1: CSR Invisibility */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <EyeOff className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="Solve CSR Invisibility"
            >
              Your pricing table, feature list, and key content are rendered with JavaScript. AI crawlers like GPTBot don't wait for it. See a side-by-side comparison of what users see vs. what AI sees.
            </FeatureCard>

            {/* Feature 2: Traffic Defense */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <Shield className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="Defend Your Traffic"
            >
              Organic search traffic is down 38% as users turn to AI. Cited publishers get 20-40% more clicks. Find out if you're being cited and how to fix it if you're not.
            </FeatureCard>

            {/* Feature 3: Compliance Urgency */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <GanttChart className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="Check AI Act Readiness"
            >
              The EU AI Act's transparency rules take effect August 2, 2026. Our diagnostic includes a readiness checklist to see if your site meets the new requirements for machine-readability.
            </FeatureCard>
          </div>
        </Section>
      </Background>
    </div>
  );
};
