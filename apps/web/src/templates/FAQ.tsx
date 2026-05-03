import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Section } from '@/features/landing/Section';

export const FAQ = () => {
  return (
    <div id="faq">
      <Section
        subtitle="FAQ"
        title="Frequently asked questions"
      >
        <div className="mx-auto max-w-3xl">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-cr-fg">
                How is CrawlReady different from Prerender.io?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                Prerender.io focuses on traditional SEO pre-rendering. CrawlReady adds AI citation tracking, LLM-optimized schema injection, and real-time AI crawler analytics on top of rendering. Starter pricing is $29/mo vs Prerender's $90/mo.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-cr-fg">
                Will this slow down my website for users?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                No. CrawlReady only activates when AI crawlers (GPTBot, PerplexityBot, ClaudeBot) visit your site. Regular users get your normal site with zero performance impact. Rendering happens server-side in under 200ms.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-cr-fg">
                Do I need to rebuild my site or change my code?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                No. CrawlReady works with your existing React, Vue, Angular, Next.js, or any JavaScript framework. Add a middleware snippet (5-minute setup) and you're done. No SSR migration, no code changes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left text-cr-fg">
                How does AI citation tracking work?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                CrawlReady queries ChatGPT, Perplexity, and Claude daily with keywords related to your business. When your site gets cited in an AI answer, you get an alert via email or Slack. You can also track competitor citations.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left text-cr-fg">
                What's included in the early access?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                Early access users get 50% lifetime discount, priority feature requests, direct access to the founding team, and the ability to shape the product roadmap. No credit card required to join.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left text-cr-fg">
                Can I cancel anytime?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                Yes. No contracts, no cancellation fees. Cancel anytime from your dashboard. Your early access pricing is preserved if you return.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger className="text-left text-cr-fg">
                What happens if I exceed my render limit?
              </AccordionTrigger>
              <AccordionContent className="text-cr-fg-secondary">
                You'll get notified at 80% usage. If you hit your limit, you can upgrade your plan instantly or pay for overages. There's no service interruption.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>
    </div>
  );
};
