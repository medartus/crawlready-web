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
      title="Frequently Asked Questions"
      description="Everything you need to know about CrawlReady and AI crawler optimization"
    >
      <div className="mx-auto max-w-3xl">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              How is CrawlReady different from Prerender.io?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              While Prerender.io focuses on traditional SEO, CrawlReady is built specifically for AI search engines. 
              We offer <strong>AI citation tracking</strong> (see when ChatGPT cites you), <strong>LLM-optimized schema injection</strong>, 
              and <strong>real-time AI crawler analytics</strong>—features Prerender doesn't have. Plus, we're <strong>46% cheaper</strong> on entry tiers ($49 vs $90) with better performance (&lt;200ms vs 300ms+).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              Will this slow down my website for users?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              No! CrawlReady only activates when AI crawlers (GPTBot, PerplexityBot, ClaudeBot) visit your site. 
              Regular users get your normal site with zero performance impact. We render JavaScript server-side exclusively 
              for AI crawlers in under 200ms.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              Do I need to rebuild my site or change my code?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              Nope! CrawlReady works with your existing React, Vue, Angular, Next.js, or any JavaScript framework. 
              Just add our middleware script (5-minute setup), and you're done. No rebuilding, no SSR migration, no code changes.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">
              How does AI citation tracking work?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              We automatically query ChatGPT, Perplexity, and Claude daily with keywords related to your business. 
              When your site gets cited in an AI answer, you get an instant alert via email or Slack. You can also track 
              competitor citations to understand how you compare in AI search visibility.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left">
              What's included in the Phase 0 early access?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              Early access users get: <strong>50% lifetime discount</strong> (locked in forever), priority feature requests, 
              direct access to our founding team, dedicated Slack channel, and the ability to shape the product roadmap. 
              Plus, no credit card required to join the waitlist.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-left">
              Why should I care about AI search now?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              AI search traffic is growing 400% year-over-year. ChatGPT Search just launched, Perplexity is gaining millions 
              of users, and Google is integrating AI overviews. Early movers who optimize for AI citations now will have a 
              massive advantage over competitors who wait. The first 100 brands in your space to get cited will dominate AI search.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-left">
              Can I cancel anytime?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              Absolutely! No long-term contracts, no cancellation fees. Cancel anytime with one click from your dashboard. 
              Your 50% lifetime discount applies as long as you remain a customer—if you cancel and come back later, 
              you'll still have your early access pricing.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8">
            <AccordionTrigger className="text-left">
              What happens if I exceed my render limit?
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-400">
              You'll get notified at 80% usage. If you hit your limit, we'll send you an alert and you can either upgrade 
              your plan instantly or pay for overages at $0.50 per 1,000 additional renders (40% cheaper than Prerender's $0.75-1.50). 
              There's no service interruption—we keep serving your content.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Section>
    </div>
  );
};
