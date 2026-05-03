import { Award, BarChart3, Bot, Code2, FileCode, Zap } from 'lucide-react';

import { Background } from '@/components/Background';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

export const Features = () => {
  return (
    <div id="features">
      <Background className="bg-cr-surface">
        <Section
          subtitle="CAPABILITIES"
          title="What CrawlReady does"
          description="Purpose-built for AI crawler optimization. Diagnostic, rendering, and analytics in one platform."
        >
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-3">
            <FeatureCard
              icon={<Award className="size-6" />}
              title="AI Citation Tracking"
            >
              Monitor when ChatGPT, Perplexity, and Claude cite your content. Real-time alerts when your brand appears in AI answers.
            </FeatureCard>

            <FeatureCard
              icon={<Zap className="size-6" />}
              title="Sub-200ms Rendering"
            >
              JavaScript rendering with headless Chrome. AI crawlers get fully-rendered HTML with no impact on your users' experience.
            </FeatureCard>

            <FeatureCard
              icon={<FileCode className="size-6" />}
              title="AI-Optimized Schema"
            >
              Structured data designed for LLMs. FAQ, HowTo, Article, and Product schemas that help AI understand your content.
            </FeatureCard>

            <FeatureCard
              icon={<BarChart3 className="size-6" />}
              title="AI Crawler Analytics"
            >
              See which AI crawlers visit your site. Track GPTBot, PerplexityBot, ClaudeBot activity and which content they index.
            </FeatureCard>

            <FeatureCard
              icon={<Code2 className="size-6" />}
              title="Developer-Friendly API"
            >
              RESTful API with comprehensive docs. Webhook support for real-time events. SDKs for Node.js, Python, and Go.
            </FeatureCard>

            <FeatureCard
              icon={<Bot className="size-6" />}
              title="All AI Platforms"
            >
              ChatGPT Search, Perplexity, Claude, Gemini, Bing AI, and emerging AI search engines. Auto-updates as new crawlers appear.
            </FeatureCard>
          </div>
        </Section>
      </Background>
    </div>
  );
};
