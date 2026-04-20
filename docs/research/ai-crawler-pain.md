# Research: AI Crawler Pain Points

Evidence log of real, documented pain points from website owners and developers regarding AI crawlers. Sources: Hacker News threads, Search Engine Journal, Cloudflare reports, publisher statements. Compiled April 2026.

---

## Scale of the Problem

- AI bots account for **52% of all global web traffic** (2026)
- **300% increase** in AI crawler traffic during 2025 (Cloudflare)
- Bot traffic will surpass human traffic **by 2027** (Cloudflare projection)
- **5.6 million websites** added GPTBot to robots.txt disallow list by late 2025 (up 70% from July 2025)
- **80%+ of Cloudflare customers** chose to block AI bots when given the option
- **336% increase** in sites blocking AI crawlers (Tollbit data)

## robots.txt Compliance Data

- **13.26% of AI bot requests ignored robots.txt** in Q2 2025 (Cloudflare)
- Up from **3.3% in Q4 2024** — compliance is getting *worse*, not better
- Duke University study (2025): several categories of AI crawlers **never request robots.txt at all**
- A honeypot experiment provided evidence that **some crawlers parse robots.txt URLs but still fetch disallowed pages** and follow nofollow links

## Real Incidents (from Hacker News threads)

Source: HN threads id=43476337, id=44971487, id=42009636

**Volume incidents:**
- Developer reports **~1M automated requests per day** vs ~1K organic on one site
- Another: **170,000 requests from one bot in a few minutes**
- OpenAI's bot hit a honeypot at **0.87 req/sec for 5 weeks** — 1.8M requests, 4GB bandwidth
- One site: **500,000 AI scraper requests per day** (confirmed by Cloudflare audit)
- Low-traffic pipeline cleaning website: **15,000 requests per minute**
- Forum operator: bot traffic grew from **single-digit % to 99.9%** of all traffic in 18 months
- One admin blocked **15 IP ranges containing 37 million IP addresses** from a single crawler

**Cost incidents:**
- Read the Docs incurred **thousands of dollars** in unexpected bandwidth costs; eventually one AI company compensated them
- Browser game wiki: AI bot traffic **crashed the MariaDB process multiple times**, requiring server restarts
- Infrastructure costs pushed onto website owners while AI companies profit from the data

**Evasion tactics documented by developers:**
- Rotating residential proxy IPs ("millions of unique IPs doing strange requests")
- Spoofing User-Agent headers to impersonate normal browsers
- Ignoring robots.txt entirely
- Distributing requests across thousands of IPs to evade rate limiting

**Specific company data:**
- "Nearly 90% of our AI crawler traffic is from ByteDance" (HN thread id=42009636)
- ClaudeBot: **23,951 pages crawled per referral sent back** (SEOmator crawl-to-refer ratio analysis)
- GPTBot: **1,276 pages crawled per referral** — still extracting vastly more than returning

## Publisher and Platform Losses

- **Chegg:** 49% decline in non-subscriber traffic between Jan 2024–Jan 2025; filed antitrust lawsuit Feb 2025
- **Wikipedia:** 50% surge in bandwidth consumption from AI bots since Jan 2024; human pageviews declined 8%
- **The Register** (Dec 2025): Major publishers blocking AI scrapers at server level — "say no to AI scrapers"
- Sites without direct AI licensing deals: CTR dropped ~3x between Q2 and Q4 2025

## CTR and Traffic Losses from AI Overviews

- Google AI Overviews reduced organic CTR by **34.5%** for top-ranking content in one year (Ahrefs)
- Seer Interactive (Sept 2025): organic CTR dropped **61%** for queries with AI Overviews (1.76% → 0.61%)
- Daily Mail: desktop CTR dropped from **25.23% to 2.79%** when AI Overview appeared (-89%)
- **93% of AI search sessions end without visiting a website** (Semrush, Sept 2025)
- **60% of Google searches are zero-click** in 2026 (Bain & Company)

## Workarounds Developers Are Currently Using

| Workaround | Effectiveness | Downside |
|---|---|---|
| robots.txt | Low — 13.26% ignored | Doesn't stop training bots |
| Cloudflare "Block AI Bots" | High for blocking | Blocks citation bots too |
| IP blocklisting | Medium | Ineffective vs. residential proxies |
| Rate limiting | Medium | Requires constant tuning |
| Anubis (proof-of-work) | High | Adds friction for edge cases; requires setup |
| Tar pits / honeypots | Medium | Wastes their time, not bandwidth |
| ZIP bombs | Aggressive, works | Legal/ethical risk |
| Geo-blocking countries | High | Breaks legitimate users in those regions |
| Moving behind login | Works | Kills AI visibility entirely |

**Anubis** (proof-of-work tool) notable adoption: Linux Kernel, FreeBSD, Arch Linux, GNOME, Wine, FFmpeg, Proxmox, Duke University, UNESCO — all defensive, open-source, or academic organizations.

## Emerging Counter-Monetization Approaches

- **HTTP 402 "Pay to crawl":** A Caddy plugin (HN id=47179432) charges AI crawlers USDC to access content. If the bot pays, it gets content. Humans are unaffected.
- **Cloudflare AI Labyrinth:** Generates AI-created fake content to waste crawler processing time
- **Tollbit:** Infrastructure for charging AI crawlers per access

These are adversarial solutions. CrawlReady's opportunity is the cooperative middle ground: help AI crawlers see what they need to see efficiently, while giving website owners control and visibility into the relationship.

## The Visibility Problem (Separate from Infrastructure)

- One writer asked ChatGPT a question their article answered — it cited "random Medium links, Reddit threads, some site from 2019" instead
- Businesses report "competitors are getting recommended by ChatGPT, Claude, and Perplexity — but we are nowhere"
- AI systems ignore content hidden behind JavaScript: dropdowns, tabs, dynamically-loaded sections
- Marketing language with metaphors and CTAs is ambiguous to AI — it prefers direct definitions and extractable facts
- External authority matters more than page format: a Reddit thread mentioning your content can outweigh a well-structured page from your own domain

## Key Insight for CrawlReady

The two pain points are real but require different solutions:
1. **Infrastructure cost/control** → selective allow/block/meter with transparency
2. **AI visibility** → serve content AI can actually parse (format optimization)

Both are currently unaddressed by a single product. CrawlReady addresses both under one roof.
