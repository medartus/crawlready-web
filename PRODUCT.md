# Product

## Register

brand

Default is brand (landing page, public diagnostic, score pages, marketing surfaces). Override to product for dashboard, onboarding, settings, and all authenticated surfaces.

## Brand Identity

**Name:** CrawlReady. Capital C, capital R, one word, no space, no hyphen. Never "Crawl Ready" or "crawlready."

**Domain:** crawlready.app

**Tagline:** "See what AI actually sees." Used under the wordmark when needed. Not a headline. Not a slogan. A factual description of what the tool does.

**Wordmark:** "CrawlReady" set in Geist Sans, weight 700. This is the primary logo. No icon, no symbol, no gradient. The name in the chosen typeface is the brand. In compact contexts (favicons, app icons, OG thumbnails), use "CR" in Geist Sans Bold on a solid `--cr-primary` background.

**Logo color:** `--cr-fg` on light backgrounds. `--cr-primary-fg` on primary-colored backgrounds. Never rendered in a gradient.

## Users

Technical founders and dev leads at B2B SaaS companies (5-100 employees) building with JavaScript frameworks. They arrive from Hacker News, technical blog posts, or search results for queries like "ChatGPT can't see my site."

**Their moment of arrival:** Mid-workflow. Evaluating whether AI visibility is a real issue for their specific site. They are skeptical of marketing tools. They will leave in under 10 seconds if the page looks like a template, asks for payment before showing value, or makes claims without evidence.

**Their physical context:** Well-lit workspace, wide display, tabbed browser with 15+ tabs open. They are working, not browsing. They skim headings before reading body text.

**What they need to feel:** "This tool understands my problem better than I do."

**The job to be done:** Enter a URL, see a meaningful diagnostic, understand the gap, and decide whether to act on it.

## Product Purpose

CrawlReady produces a free AI Readiness Score (0-100) with a visual diff showing exactly what AI crawlers see versus what humans see. The diagnostic is the product. The paid tier intercepts AI crawler requests and serves clean, structured content while human visitors see the normal site.

Phase 0: landing page, working diagnostic, analytics onboarding at crawlready.app. The aha moment happens in under 60 seconds: enter a URL, see the score, see the visual diff.

Success: a technical visitor enters a URL, sees real data about their site, trusts the tool, and shares the score page.

## Brand Personality

**Three words:** Precise. Calm. Builder-grade.

CrawlReady speaks like a senior engineer explaining a tricky problem to a peer: clear, specific, respectful of the reader's intelligence. Confidence comes from showing real data, not from bold claims.

**Voice rules:**
- State facts without amplifying them. "AI crawlers cannot execute JavaScript" not "Your website is INVISIBLE to AI!"
- Use second person ("your site"), present tense ("CrawlReady scans your page"), and active voice.
- Quantify when possible. "3 sections are invisible" not "several sections are invisible."
- No exclamation marks in product UI. Reserve for genuine success states only.
- Never promise outcomes CrawlReady cannot control. Promise visibility, not citations.
- No hedging language ("might," "could potentially," "we believe"). Be direct or stay silent.

**Tone by context:**

| Surface | Tone |
|---|---|
| Landing page headlines | Confident, factual, slightly provocative |
| Diagnostic results | Clinical, specific, actionable |
| Recommendations | Helpful peer, not lecturing authority |
| Error states | Calm, explain what happened, offer next step |
| Empty states | Brief, show what the state will look like when populated |
| Success states | Understated satisfaction, no confetti |
| Blog / long-form | Thorough, evidence-backed, opinionated |

## Anti-references

- **Generic SaaS templates:** Hero + three feature cards + pricing grid. Gradient text headlines. "Loved by 10,000+ teams" with stock avatars. Sparkle emoji badges. If someone could swap the logo and not notice, it has failed.
- **SEO tool dashboards (Ahrefs, SEMrush):** 40+ navigation items, metric walls, cluttered sidebars. CrawlReady shows less and shows it better.
- **Neon-on-dark developer hype:** Glow effects, particle backgrounds, terminal-cosplay aesthetics. CrawlReady is a serious tool, not a hackathon demo or a crypto project.
- **Webflow/Framer template patterns:** Heavy scroll-driven animations, decorative illustrations, parallax sections. Style performing as substance. CrawlReady's substance IS its style.

## Design Principles

1. **Show, don't tell.** The visual diff diagnostic IS the product. The landing page hero contains the actual working tool, not a screenshot of it. Every section proves something rather than asserting it.
2. **Data with clarity.** One clear insight beats ten raw metrics. The AI Readiness Score (one number) is always the headline; sub-scores appear on drill-down. If a user has to think about what a number means, the presentation has failed.
3. **Earned trust.** Credibility comes from precision and transparency, not superlatives. No unsubstantiated claims. No vanity metrics without a source. If the data speaks, the copy stays quiet.
4. **Builder respect.** The audience is competent. No dumbing down, no unnecessary explanations, no wizard dialogs for what a code snippet can do. Technical users notice when you respect their time.
5. **Quiet confidence.** The design does not try hard. Quality shows in restraint: generous whitespace, precise typography, intentional color. Every element earns its place or gets removed.

## Copy Guidelines

### Headlines
Write headlines as observations about the user's reality, not commands or superlatives.

| Pattern | Example |
|---|---|
| Observation | "What ChatGPT actually sees on your site" |
| Finding | "3 sections are invisible to AI crawlers" |
| Data point | "AI Readiness Score: 31/100" |

Never use: "Supercharge your AI visibility!" / "Fix your invisible content now!" / "The #1 AI optimization platform" / "Unlock your potential."

### Calls to action
Describe the action the user will take. Not the emotion they should feel.

| Do | Don't |
|---|---|
| Scan your site | Get started free! |
| View full report | Unlock your potential |
| Copy snippet | Start your journey |
| Create account | Join the revolution |

### Data and numbers
Use real data from real scans. Never use rounded approximations that sound invented.

| Do | Don't |
|---|---|
| "73% of sites have technical barriers blocking AI crawler access" (sourced) | "Most websites are invisible" |
| "Score: 31/100" | "Low score detected" |
| "14,200 tokens reduced to 847" | "90%+ noise reduction" |

### Words to avoid
Supercharge, unleash, unlock, revolutionize, game-changing, cutting-edge, next-generation, best-in-class, world-class, seamless, effortless, delightful, love (as in "you'll love"), powerful, robust.

## Accessibility & Inclusion

WCAG 2.1 AA. 4.5:1 contrast for normal text, 3:1 for large text and UI components. Full keyboard navigation with visible focus indicators. Semantic HTML and ARIA landmarks for screen readers. No information conveyed through color alone (score bands always include text labels). Reduced-motion preferences respected: all animations resolve instantly when `prefers-reduced-motion: reduce` is active.
