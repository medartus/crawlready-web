import { Award, BarChart3, Bot, Code2, Sparkles, Zap } from 'lucide-react';

import { Background } from '@/components/Background';
import { FeatureCard } from '@/features/landing/FeatureCard';
import { Section } from '@/features/landing/Section';

export const Features = () => {
  return (
    <div id="features">
      <Background>
        <Section
          subtitle="AI-First Features"
          title="Everything You Need to Dominate AI Search"
          description="Built specifically for AI crawler optimization. Features competitors don't have and can't easily replicate."
        >
          <div className="grid grid-cols-1 gap-x-3 gap-y-8 md:grid-cols-3">
            {/* Feature 1: AI Citation Tracking */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <Award className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="AI Citation Tracking"
            >
              Monitor when ChatGPT, Perplexity, and Claude cite your content. Get real-time alerts when your brand appears in AI answers. Track competitor mentions too.
            </FeatureCard>

            {/* Feature 2: Lightning Rendering */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <Zap className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="Sub-200ms Rendering"
            >
              Blazing-fast JavaScript rendering with headless Chrome. AI crawlers get fully-rendered HTML instantly. No impact on your users' experience.
            </FeatureCard>

            {/* Feature 3: LLM-Optimized Schema */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <Sparkles className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="AI-Optimized Schema"
            >
              Auto-inject structured data designed for LLMs. FAQ, HowTo, Article, and Product schemas that help AI understand your content better than competitors.
            </FeatureCard>

            {/* Feature 4: AI Crawler Analytics */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <BarChart3 className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="Real-Time AI Analytics"
            >
              See exactly which AI crawlers visit your site. Track GPTBot, PerplexityBot, ClaudeBot activity. Understand which content AI platforms index most.
            </FeatureCard>

            {/* Feature 5: Developer-Friendly Integration */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <Code2 className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="Developer-Friendly API"
            >
              RESTful API with comprehensive docs. Webhook support for real-time events. Open-source SDKs for Node.js, Python, and Go. Built by developers, for developers.
            </FeatureCard>

            {/* Feature 6: Multi-Platform Support */}
            <FeatureCard
              icon={(
                <div className="flex size-full items-center justify-center">
                  <Bot className="stroke-primary-foreground size-8" />
                </div>
              )}
              title="All AI Platforms"
            >
              Optimized for ChatGPT Search, Perplexity, Claude, Google Gemini, Bing AI, and emerging AI search engines. Auto-updates as new AI crawlers emerge.
            </FeatureCard>
          </div>
        </Section>
      </Background>
    </div>
  );
};
