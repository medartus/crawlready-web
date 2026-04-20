# Lead Generation Pipeline

A comprehensive pipeline for finding companies with JavaScript rendering issues that could benefit from CrawlReady's AI crawler optimization service.

## Overview

This tool automates the process of:
1. **Discovering** tech companies from Welcome to the Jungle (WTTJ)
2. **Analyzing** their websites for AI crawler visibility issues
3. **Finding** decision-maker contacts
4. **Generating** personalized outreach emails

### The Problem We're Solving

Only 31% of AI crawlers (GPTBot, ClaudeBot, PerplexityBot) can render JavaScript, while 98.9% of modern websites use React/Vue/Angular. This means most websites are invisible to AI search engines like ChatGPT, Perplexity, and Claude.

### Target Companies

- JavaScript SaaS platforms (React/Vue/Angular SPAs)
- E-commerce stores with headless commerce
- Technical content publishers and documentation sites

---

## Quick Start

```bash
# Navigate to the lead-gen tool
cd apps/tools/lead-gen

# Install dependencies (if not already done)
pnpm install

# Analyze a single website
pnpm tsx src/index.ts analyze-single https://example.com

# Run the full pipeline
pnpm tsx src/index.ts scrape-wttj --pages=5
pnpm tsx src/index.ts analyze --limit=20
pnpm tsx src/index.ts scrape-teams
pnpm tsx src/index.ts filter --min-score=50
pnpm tsx src/index.ts generate-emails --csv=data/outreach.csv
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LEAD GENERATION PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   PHASE 1    │    │   PHASE 2    │    │   PHASE 3    │              │
│  │   SCRAPING   │───▶│   ANALYSIS   │───▶│   CONTACTS   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ companies    │    │ analysis-    │    │ contacts     │              │
│  │ .json        │    │ results.json │    │ .json        │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                 │                       │
│                                                 ▼                       │
│                             ┌──────────────────────────────┐           │
│                             │          PHASE 4             │           │
│                             │    OUTREACH GENERATION       │           │
│                             └──────────────────────────────┘           │
│                                          │                             │
│                                          ▼                             │
│                             ┌──────────────────────────────┐           │
│                             │   outreach-queue.json        │           │
│                             │   outreach.csv               │           │
│                             └──────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| **Scrapers** | Extract company data from WTTJ | `wttj-companies.ts`, `wttj-team.ts` |
| **Analyzers** | Assess website AI crawler visibility | `js-analyzer.ts`, `framework-detector.ts`, etc. |
| **Contacts** | Find and validate decision-maker emails | `email-pattern.ts`, `email-verifier.ts` |
| **Outreach** | Generate personalized cold emails | `email-generator.ts`, `template-renderer.ts` |
| **Utils** | Shared utilities | `puppeteer.ts`, `logger.ts`, `rate-limiter.ts` |

---

## Phase 1: Company Scraping

### Command: `scrape-wttj`

Scrapes tech companies from Welcome to the Jungle.

```bash
pnpm tsx src/index.ts scrape-wttj [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `-s, --sector` | `tech` | Filter by sector |
| `-r, --region` | `FR` | Country code (FR, US, UK, DE, etc.) |
| `-p, --pages` | `10` | Number of listing pages to scrape |
| `-o, --output` | `data/companies.json` | Output file path |

**Output Schema (`companies.json`):**
```json
[
  {
    "name": "Spendesk",
    "slug": "spendesk",
    "wttjUrl": "https://www.welcometothejungle.com/en/companies/spendesk",
    "websiteUrl": "https://www.spendesk.com",
    "linkedinUrl": "https://linkedin.com/company/spendesk",
    "twitterUrl": "https://twitter.com/spendesk",
    "sector": ["FinTech", "SaaS"],
    "employeeCount": "250-500",
    "location": "Paris, France",
    "description": "Spend management platform...",
    "scrapedAt": "2026-01-26T10:00:00.000Z"
  }
]
```

**Rate Limiting:** 20 requests/minute to avoid being blocked.

---

## Phase 2: Website Analysis

### Command: `analyze-single`

Analyze a single website URL.

```bash
pnpm tsx src/index.ts analyze-single <url> [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output` | (none) | Save results to JSON file |
| `--crux-key` | (none) | Google CrUX API key for performance metrics |

**Example:**
```bash
pnpm tsx src/index.ts analyze-single https://www.example.com
```

### Command: `analyze`

Batch analyze all scraped companies.

```bash
pnpm tsx src/index.ts analyze [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `-i, --input` | `data/companies.json` | Input companies file |
| `-o, --output` | `data/analysis-results.json` | Output analysis file |
| `-c, --concurrent` | `1` | Concurrent analyses |
| `--crux-key` | (none) | Google CrUX API key |
| `--limit` | (all) | Limit number of companies |

### Analysis Checks

#### 1. JS Dependency Score

Compares raw HTML (no JavaScript) vs rendered HTML (with JavaScript).

```
JS Score = (renderedTextLength - rawTextLength) / renderedTextLength × 100
```

| Score | Interpretation | Priority |
|-------|----------------|----------|
| >70% | Heavily JS-dependent (SPA) | HIGH |
| 40-70% | Moderate JS usage | MEDIUM |
| <40% | Mostly static | LOW |

#### 2. Framework Detection

Identifies JavaScript frameworks from HTML patterns:

| Framework | Detection Patterns | CrawlReady Fit |
|-----------|-------------------|----------------|
| React | `data-reactroot`, `react-dom` | Excellent |
| Next.js | `__NEXT_DATA__`, `_next/static` | Good |
| Vue | `data-v-`, `v-cloak` | Excellent |
| Nuxt | `__NUXT__`, `_nuxt/` | Good |
| Angular | `ng-version`, `_ngcontent-` | Excellent |
| Svelte | `svelte-`, `__sveltekit/` | Good |

#### 3. robots.txt Analysis

Checks if AI crawlers are allowed:

```
User-agent: GPTBot      → Allowed/Blocked
User-agent: ClaudeBot   → Allowed/Blocked
User-agent: PerplexityBot → Allowed/Blocked
```

If all AI crawlers are blocked, priority is set to `NOT_APPLICABLE`.

#### 4. Meta Tags Analysis

Checks if SEO meta tags are present in raw HTML vs rendered:

- **Title tag**: Present in raw HTML?
- **Meta description**: Present in raw HTML?
- **OG tags**: Present in raw HTML?
- **Schema.org**: Present in raw HTML?

**Critical Issue:** If meta tags only appear after JavaScript renders, AI bots miss them entirely.

#### 5. Content Difference

Compares content elements between raw and rendered HTML:

- Headings (H1-H6) count and content
- Paragraph count
- Link count
- Image count
- Total text length

#### 6. CrUX Metrics (Optional)

Fetches real-user performance data from Chrome UX Report:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | <2.5s | 2.5-4s | >4s |
| FID | <100ms | 100-300ms | >300ms |
| CLS | <0.1 | 0.1-0.25 | >0.25 |
| TTFB | <800ms | 800-1800ms | >1800ms |

**Note:** Requires a Google CrUX API key. Many smaller sites have no CrUX data.

### Priority Scoring Algorithm

```typescript
Priority = HIGH if:
  - JS Score >= 70% OR
  - (Framework = React/Vue SPA) AND (Meta tags JS-injected)

Priority = MEDIUM if:
  - JS Score 40-70% OR
  - (Framework detected) AND (Meta tags JS-injected)

Priority = LOW if:
  - JS Score < 40%

Priority = NOT_APPLICABLE if:
  - All AI crawlers blocked in robots.txt
```

### Output Schema (`analysis-results.json`)

```json
{
  "company": { /* WTTJCompany */ },
  "jsAnalysis": {
    "url": "https://example.com",
    "rawTextLength": 2340,
    "renderedTextLength": 10560,
    "jsScore": 78,
    "analyzedAt": "2026-01-26T10:00:00.000Z"
  },
  "frameworkDetection": {
    "framework": "react",
    "confidence": "high",
    "indicators": ["data-reactroot", "react-dom"]
  },
  "robotsTxt": {
    "overallStatus": "allowed",
    "rules": [
      { "crawler": "GPTBot", "status": "allowed" }
    ]
  },
  "metaTags": {
    "issues": {
      "metaTagsJsInjected": true,
      "titleMissing": false
    }
  },
  "contentDiff": {
    "diff": {
      "percentageLost": 78,
      "headingsMissing": ["Welcome to Example"]
    }
  },
  "priority": "HIGH",
  "reasons": [
    "High JS dependency (78%) - SPA detected",
    "react detected - React SPAs typically render 80-95% via JS",
    "Meta tags are JS-injected - invisible to AI bots"
  ],
  "analyzedAt": "2026-01-26T10:00:00.000Z"
}
```

---

## Phase 3: Contact Discovery

### Command: `scrape-teams`

Scrapes WTTJ team pages to find decision-maker contacts.

```bash
pnpm tsx src/index.ts scrape-teams [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `-i, --input` | `data/analysis-results.json` | Input analysis file |
| `-o, --output` | `data/contacts.json` | Output contacts file |

### Team Page Discovery

The scraper tries multiple URL patterns:
- `/team`
- `/team-1`
- `/team-2`
- `/team-3`

### Target Roles (Priority Order)

**Technical Decision Makers:**
1. CTO / Chief Technology Officer
2. VP Engineering
3. Head of Engineering
4. Tech Lead / Lead Developer

**Growth/Marketing:**
1. Head of SEO
2. Head of Growth
3. VP Marketing / CMO

**Founders (for startups <50 people):**
1. Co-founder
2. CEO

### Email Pattern Detection

Common patterns tested:
```
{first}.{last}@{domain}    → john.doe@company.com
{first}@{domain}           → john@company.com
{f}{last}@{domain}         → jdoe@company.com
{first}{last}@{domain}     → johndoe@company.com
{first}_{last}@{domain}    → john_doe@company.com
```

### Email Verification

- **MX Record Check**: Verifies domain can receive email
- **Format Validation**: Ensures email format is valid
- **Disposable Detection**: Flags temporary email domains

### Output Schema (`contacts.json`)

```json
{
  "company": { /* WTTJCompany */ },
  "domain": "example.com",
  "emailPattern": {
    "pattern": "{first}.{last}@{domain}",
    "confidence": "medium",
    "source": "French domain convention"
  },
  "contacts": [
    {
      "name": "Jean Dupont",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "CTO",
      "company": "Example Corp",
      "domain": "example.com",
      "source": "wttj-team",
      "email": "jean.dupont@example.com",
      "emailVerified": true,
      "emailConfidence": "pattern-based"
    }
  ],
  "teamPageFound": true,
  "discoveredAt": "2026-01-26T10:00:00.000Z"
}
```

---

## Phase 4: Outreach Generation

### Command: `filter`

Filter to high-priority leads.

```bash
pnpm tsx src/index.ts filter [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `-i, --input` | `data/analysis-results.json` | Input analysis file |
| `-o, --output` | `data/filtered-leads.json` | Output filtered file |
| `--min-score` | `50` | Minimum JS score |
| `--max-results` | `50` | Maximum leads to output |

### Command: `generate-emails`

Generate personalized outreach emails.

```bash
pnpm tsx src/index.ts generate-emails [options]
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `-a, --analysis` | `data/filtered-leads.json` | Analysis file |
| `-c, --contacts` | `data/contacts.json` | Contacts file |
| `-o, --output` | `data/outreach-queue.json` | Output queue file |
| `--csv` | (none) | Also export as CSV |

### Email Templates

Templates are stored in `templates/` and use Handlebars syntax.

**Available Variables:**
```handlebars
{{contact.firstName}}
{{contact.lastName}}
{{contact.role}}
{{company.name}}
{{company.website}}
{{analysis.jsScore}}
{{analysis.framework}}
{{analysis.contentLost}}
{{analysis.reasons}}
{{sender.name}}
```

### Initial Email Template

```
Subject: {{company.name}}'s website is {{jsScore}}% invisible to ChatGPT

Hi {{contact.firstName}},

I was analyzing how AI search engines see {{company.name}}'s website,
and found something concerning.

When GPTBot (ChatGPT's crawler) visits {{company.website}}, it only sees
{{100 - jsScore}}% of your content. The rest requires JavaScript to
render - which most AI crawlers can't execute.

I'm building CrawlReady, a pre-rendering solution specifically for AI
crawlers. We're looking for 5-10 co-creation partners to shape the product.

As a partner, you'd get:
- Free early access
- Direct input on features
- Priority support

Would you be open to a 15-minute call this week?

Best,
{{sender.name}}
```

### LinkedIn Connection Request (300 char limit)

```
Hi {{firstName}}, I analyzed {{company}}'s website from an AI crawler
perspective - found that ~{{jsScore}}% of your content is invisible to
ChatGPT/Perplexity. Building a solution and looking for co-creation
partners. Happy to share the analysis!
```

### Output Schema (`outreach-queue.json`)

```json
{
  "id": "uuid",
  "contact": { /* Contact */ },
  "analysis": { /* CompanyAnalysis */ },
  "outreach": {
    "emails": {
      "initial": { "subject": "...", "body": "..." },
      "followup1": { "subject": "...", "body": "..." },
      "followup2": { "subject": "...", "body": "..." }
    },
    "linkedinRequest": "..."
  },
  "status": "pending",
  "emailsSent": {
    "initial": null,
    "followup1": null,
    "followup2": null
  },
  "linkedinSent": null,
  "createdAt": "2026-01-26T10:00:00.000Z"
}
```

---

## Outreach Cadence

| Day | Channel | Action |
|-----|---------|--------|
| 0 | Email | Initial outreach with analysis |
| 0 | LinkedIn | Connection request |
| 3 | Email | Follow-up #1 with detailed report |
| 7 | LinkedIn | Message (if connected) |
| 10 | Email | Final follow-up |

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No |
| `CRUX_API_KEY` | Google CrUX API key | No |

### Rate Limits

| Target | Limit | Delay |
|--------|-------|-------|
| WTTJ Scraping | 20 req/min | 1-3s between requests |
| Website Analysis | 10 req/min | 2-5s between requests |
| Gmail Sending | 500/day | Space throughout day |
| LinkedIn Requests | 100/week | Manual pacing |

---

## Data Files

All generated data is stored in `data/` (gitignored):

| File | Description |
|------|-------------|
| `companies.json` | Scraped WTTJ companies |
| `analysis-results.json` | Website analysis results |
| `contacts.json` | Discovered contacts |
| `filtered-leads.json` | High-priority leads |
| `outreach-queue.json` | Generated outreach items |
| `outreach.csv` | CSV export for spreadsheets |

---

## Troubleshooting

### Common Issues

**"No team page found"**
- Not all companies have team pages on WTTJ
- Some use different URL patterns
- Check manually: `https://www.welcometothejungle.com/en/companies/{slug}/team`

**"MX records not found"**
- Domain may not accept email
- Try alternative domains (e.g., @company.io vs @company.com)
- Email pattern may be incorrect

**"JS Score is 0%"**
- Site uses SSR (Server-Side Rendering) - already optimized
- Site is fully static HTML
- Puppeteer couldn't load the page properly

**"Priority: NOT_APPLICABLE"**
- Site blocks AI crawlers in robots.txt
- CrawlReady won't help if crawlers can't access the site

### Debug Mode

```bash
LOG_LEVEL=debug pnpm tsx src/index.ts analyze-single https://example.com
```

---

## Best Practices

### For Scraping
- Start with small page counts (5-10) to test
- Monitor for rate limiting or blocking
- Save results incrementally

### For Analysis
- Run `analyze-single` first to validate before batch
- Use `--limit` to test on subset
- Check robots.txt results - blocked sites are NOT_APPLICABLE

### For Outreach
- Personalize beyond template variables
- Attach screenshots showing the issue
- A/B test subject lines
- Track open/reply rates

---

## File Structure

```
apps/tools/lead-gen/
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
├── src/
│   ├── index.ts              # CLI entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── scrapers/
│   │   ├── index.ts
│   │   ├── wttj-companies.ts # Company listings scraper
│   │   └── wttj-team.ts      # Team page scraper
│   ├── analyzers/
│   │   ├── index.ts
│   │   ├── js-analyzer.ts    # JS dependency score
│   │   ├── framework-detector.ts
│   │   ├── crux-fetcher.ts   # Chrome UX Report
│   │   ├── robots-checker.ts # AI crawler access
│   │   ├── meta-analyzer.ts  # SEO meta tags
│   │   └── content-differ.ts # Content comparison
│   ├── contacts/
│   │   ├── index.ts
│   │   ├── email-pattern.ts  # Pattern detection
│   │   ├── email-verifier.ts # MX validation
│   │   └── contact-finder.ts # Aggregation
│   ├── outreach/
│   │   ├── index.ts
│   │   ├── template-renderer.ts
│   │   └── email-generator.ts
│   └── utils/
│       ├── index.ts
│       ├── puppeteer.ts      # Browser management
│       ├── logger.ts         # Logging
│       └── rate-limiter.ts   # Rate limiting
├── templates/
│   ├── email-initial.hbs
│   ├── email-followup-1.hbs
│   ├── email-followup-2.hbs
│   └── linkedin-request.txt
└── data/                     # Generated data (gitignored)
    └── .gitkeep
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| puppeteer | ^23.x | Browser automation |
| cheerio | ^1.x | HTML parsing |
| commander | ^12.x | CLI framework |
| handlebars | ^4.x | Email templates |
| tsx | ^4.x | TypeScript execution |

---

## License

Internal tool for CrawlReady lead generation. Not for redistribution.
