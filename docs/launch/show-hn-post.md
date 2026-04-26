# Show HN: CrawlReady — See what GPTBot actually sees when it crawls your site

**Title:** Show HN: CrawlReady — See what GPTBot actually sees when it crawls your site

**URL:** https://crawlready.app

---

## Post Body

I built CrawlReady because I discovered that GPTBot and other AI crawlers can't see most of my JavaScript-rendered content.

**The problem:** AI crawlers like GPTBot, ClaudeBot, and PerplexityBot fetch pages with simple HTTP GET requests — they don't execute JavaScript. If your site uses React, Vue, Angular, or any CSR framework, the AI sees an empty `<div id="root"></div>` instead of your actual content. This means AI search engines (ChatGPT Search, Perplexity, etc.) either index nothing or index stale server-rendered shells.

**What CrawlReady does:**
- Enter any URL and get a side-by-side visual diff showing what humans see vs. what GPTBot sees
- AI Readiness Score (0-100) with three sub-scores: Crawlability, Agent Readiness, Agent Interaction
- EU AI Act transparency checklist (robots.txt, llms.txt, content negotiation)
- Actionable recommendations to fix invisible content

**The aha moment:** Paste your site's URL and within 10 seconds you'll see exactly which sections of your page are invisible to AI. Most JS-heavy sites score below 40/100.

**Tech:**
- Firecrawl for JS-rendered crawling, GPTBot UA for raw bot view
- Content negotiation probe (Accept: text/markdown)
- llms.txt standard detection
- Schema.org JSON-LD analysis

**What I learned building this:**
1. ~68% of JS-heavy sites serve significantly different content to bots vs humans
2. Most sites don't have robots.txt rules for AI crawlers at all
3. Almost no sites support the emerging llms.txt standard
4. Content negotiation (serving markdown to bots) is practically non-existent

Free to use, no signup required for scanning. The score pages are permanent and shareable.

Built with Next.js, Supabase, Clerk, and deployed on Vercel.

Would love feedback from the HN community. What would you want to see in an AI readiness tool?

---

## Timing Notes

- **Best days:** Tuesday–Thursday
- **Best time:** 8-9am EST (when HN traffic peaks)
- **Avoid:** Weekends, Friday afternoons, major tech news days

## Engagement Plan

1. Post Tuesday-Thursday morning EST
2. Monitor comments for first 2 hours
3. Reply to every question within 30 minutes
4. Prepare answers for likely questions:
   - "How is this different from Lighthouse?" → Lighthouse tests web performance, not AI crawler visibility
   - "Isn't this just SSR testing?" → It's specifically about what AI crawlers see, including standards like llms.txt and content negotiation
   - "Why not just use SSR?" → Even SSR sites can fail AI readiness (missing robots.txt rules, no structured data, etc.)
   - "Privacy concerns with scanning?" → We only crawl what's publicly accessible, same as any crawler
