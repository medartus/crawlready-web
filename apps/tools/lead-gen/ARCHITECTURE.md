# Lead Generation Pipeline - Technical Architecture

## System Overview

The lead generation pipeline is a Node.js CLI application that automates the discovery and qualification of potential CrawlReady customers. It uses Puppeteer for web scraping and rendering analysis, with a modular architecture that separates concerns into distinct phases.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLI LAYER                                       │
│                           (src/index.ts)                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ scrape- │ │ analyze │ │ analyze │ │ scrape- │ │ filter  │ │generate │   │
│  │ wttj    │ │         │ │ -single │ │ teams   │ │         │ │-emails  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────────┘
        │          │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                     │
│                                                                              │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐     │
│  │      SCRAPERS      │  │     ANALYZERS      │  │     CONTACTS       │     │
│  │                    │  │                    │  │                    │     │
│  │ • wttj-companies   │  │ • js-analyzer      │  │ • email-pattern    │     │
│  │ • wttj-team        │  │ • framework-detect │  │ • email-verifier   │     │
│  │                    │  │ • crux-fetcher     │  │ • contact-finder   │     │
│  │                    │  │ • robots-checker   │  │                    │     │
│  │                    │  │ • meta-analyzer    │  │                    │     │
│  │                    │  │ • content-differ   │  │                    │     │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘     │
│                                                                              │
│  ┌────────────────────┐                                                     │
│  │      OUTREACH      │                                                     │
│  │                    │                                                     │
│  │ • template-render  │                                                     │
│  │ • email-generator  │                                                     │
│  └────────────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UTILITY LAYER                                      │
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │   PUPPETEER    │  │    LOGGER      │  │  RATE LIMITER  │                 │
│  │                │  │                │  │                │                 │
│  │ • getBrowser() │  │ • info/error   │  │ • wait()       │                 │
│  │ • createPage() │  │ • progress()   │  │ • withRetry()  │                 │
│  │ • renderPage() │  │ • child()      │  │ • withConc()   │                 │
│  │ • fetchRaw()   │  │                │  │                │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────┘
        │          │          │
        ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │    WTTJ    │  │  WEBSITES  │  │   CrUX     │  │    DNS     │            │
│  │  (scrape)  │  │  (render)  │  │   (API)    │  │  (verify)  │            │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
                    ┌─────────────────────────────────────┐
                    │         WTTJ LISTINGS               │
                    │   welcometothejungle.com/companies  │
                    └─────────────────┬───────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 1: SCRAPING                                   │
│                                                                              │
│   Input: WTTJ listing pages                                                  │
│   Process: Extract company profiles, social links, metadata                  │
│   Output: companies.json                                                     │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │ [                                                            │          │
│   │   {                                                          │          │
│   │     "name": "Spendesk",                                      │          │
│   │     "websiteUrl": "https://spendesk.com",                    │          │
│   │     "linkedinUrl": "https://linkedin.com/company/spendesk",  │          │
│   │     "sector": ["FinTech", "SaaS"],                           │          │
│   │     ...                                                      │          │
│   │   }                                                          │          │
│   │ ]                                                            │          │
│   └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 2: ANALYSIS                                   │
│                                                                              │
│   For each company.websiteUrl:                                               │
│                                                                              │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│   │  JS ANALYSIS    │    │   FRAMEWORK     │    │     CrUX        │         │
│   │                 │    │   DETECTION     │    │                 │         │
│   │ Raw HTML        │    │                 │    │ LCP, FID, CLS   │         │
│   │ vs              │───▶│ React, Vue,     │───▶│ TTFB, INP       │         │
│   │ Rendered HTML   │    │ Angular, etc.   │    │                 │         │
│   │                 │    │                 │    │ (optional)      │         │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│            │                      │                      │                   │
│            ▼                      ▼                      ▼                   │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│   │  ROBOTS.TXT     │    │   META TAGS     │    │  CONTENT DIFF   │         │
│   │                 │    │                 │    │                 │         │
│   │ GPTBot: ✓/✗     │    │ Title: raw/js?  │    │ Headings lost   │         │
│   │ ClaudeBot: ✓/✗  │    │ Desc: raw/js?   │    │ Paragraphs lost │         │
│   │ Perplexity: ✓/✗ │    │ OG: raw/js?     │    │ Links lost      │         │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘         │
│            │                      │                      │                   │
│            └──────────────────────┼──────────────────────┘                   │
│                                   │                                          │
│                                   ▼                                          │
│                    ┌─────────────────────────────┐                           │
│                    │      PRIORITY SCORING       │                           │
│                    │                             │                           │
│                    │  HIGH: JS > 70% OR          │                           │
│                    │        meta tags injected   │                           │
│                    │  MEDIUM: JS 40-70%          │                           │
│                    │  LOW: JS < 40%              │                           │
│                    │  N/A: robots.txt blocked    │                           │
│                    └─────────────┬───────────────┘                           │
│                                  │                                           │
│   Output: analysis-results.json  │                                           │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 3: CONTACT DISCOVERY                            │
│                                                                              │
│   ┌────────────────────┐                                                    │
│   │  WTTJ TEAM PAGES   │                                                    │
│   │                    │                                                    │
│   │  /team             │                                                    │
│   │  /team-1           │──────┐                                             │
│   │  /team-2           │      │                                             │
│   │  /team-3           │      │                                             │
│   └────────────────────┘      │                                             │
│                               ▼                                             │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │  PARSE TEAM MEMBERS                                         │           │
│   │                                                             │           │
│   │  Video titles: "Rencontrez Marion, Co-fondatrice"           │           │
│   │  → Extract: name="Marion", role="Co-fondatrice"             │           │
│   └─────────────────────────────────┬───────────────────────────┘           │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │  FILTER BY TARGET ROLES                                     │           │
│   │                                                             │           │
│   │  Priority: CTO > VP Eng > Head of SEO > Co-founder > CEO    │           │
│   └─────────────────────────────────┬───────────────────────────┘           │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │  EMAIL GENERATION                                           │           │
│   │                                                             │           │
│   │  Domain: spendesk.com                                       │           │
│   │  Pattern: {first}.{last}@{domain}                           │           │
│   │  → jean.dupont@spendesk.com                                 │           │
│   └─────────────────────────────────┬───────────────────────────┘           │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │  MX VERIFICATION                                            │           │
│   │                                                             │           │
│   │  DNS lookup: spendesk.com MX records exist? ✓               │           │
│   └─────────────────────────────────┬───────────────────────────┘           │
│                                     │                                       │
│   Output: contacts.json             │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 4: OUTREACH GENERATION                           │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │  FILTER HIGH-PRIORITY LEADS                                 │           │
│   │                                                             │           │
│   │  - JS Score >= threshold                                    │           │
│   │  - Has contacts with emails                                 │           │
│   │  - Priority = HIGH or MEDIUM                                │           │
│   └─────────────────────────────────┬───────────────────────────┘           │
│                                     │                                       │
│                                     ▼                                       │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │  TEMPLATE RENDERING                                         │           │
│   │                                                             │           │
│   │  ┌─────────────────────────────────────────────────────┐    │           │
│   │  │ templates/email-initial.hbs                         │    │           │
│   │  │                                                     │    │           │
│   │  │ Subject: {{company.name}}'s website is              │    │           │
│   │  │          {{analysis.jsScore}}% invisible...         │    │           │
│   │  │                                                     │    │           │
│   │  │ Hi {{contact.firstName}},                           │    │           │
│   │  │ ...                                                 │    │           │
│   │  └─────────────────────────────────────────────────────┘    │           │
│   │                         +                                   │           │
│   │  ┌─────────────────────────────────────────────────────┐    │           │
│   │  │ Context Data                                        │    │           │
│   │  │                                                     │    │           │
│   │  │ contact: { firstName: "Jean", role: "CTO" }         │    │           │
│   │  │ company: { name: "Spendesk", website: "..." }       │    │           │
│   │  │ analysis: { jsScore: 78, framework: "react" }       │    │           │
│   │  └─────────────────────────────────────────────────────┘    │           │
│   │                         =                                   │           │
│   │  ┌─────────────────────────────────────────────────────┐    │           │
│   │  │ Personalized Email                                  │    │           │
│   │  │                                                     │    │           │
│   │  │ Subject: Spendesk's website is 78% invisible...     │    │           │
│   │  │                                                     │    │           │
│   │  │ Hi Jean,                                            │    │           │
│   │  │ ...                                                 │    │           │
│   │  └─────────────────────────────────────────────────────┘    │           │
│   └─────────────────────────────────┬───────────────────────────┘           │
│                                     │                                       │
│   Output: outreach-queue.json       │                                       │
│           outreach.csv              │                                       │
└─────────────────────────────────────┴───────────────────────────────────────┘
```

## Module Dependencies

```
src/index.ts (CLI)
│
├── scrapers/
│   ├── wttj-companies.ts
│   │   └── utils/puppeteer.ts
│   │   └── utils/rate-limiter.ts
│   │   └── utils/logger.ts
│   │
│   └── wttj-team.ts
│       └── utils/puppeteer.ts
│       └── utils/rate-limiter.ts
│
├── analyzers/
│   ├── js-analyzer.ts
│   │   └── utils/puppeteer.ts (fetchRawHtml, renderPage)
│   │
│   ├── framework-detector.ts
│   │   └── (pure function, no external deps)
│   │
│   ├── crux-fetcher.ts
│   │   └── (fetch API only)
│   │
│   ├── robots-checker.ts
│   │   └── (fetch API only)
│   │
│   ├── meta-analyzer.ts
│   │   └── (cheerio only)
│   │
│   └── content-differ.ts
│       └── (cheerio only)
│
├── contacts/
│   ├── email-pattern.ts
│   │   └── (pure functions)
│   │
│   ├── email-verifier.ts
│   │   └── (dns module)
│   │
│   └── contact-finder.ts
│       └── email-pattern.ts
│       └── email-verifier.ts
│
└── outreach/
    ├── template-renderer.ts
    │   └── (handlebars)
    │
    └── email-generator.ts
        └── template-renderer.ts
```

## Key Design Decisions

### 1. Single Browser Instance

```typescript
// utils/puppeteer.ts
let browserInstance: Browser | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({...});
  }
  return browserInstance;
}
```

**Rationale:** Creating a new browser for each request is expensive. A shared instance reduces memory and startup time.

### 2. Incremental Saving

```typescript
// During batch analysis
for (const company of companies) {
  const result = await analyzeCompany(company);
  results.push(result);

  // Save after each company
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
}
```

**Rationale:** Long-running operations can fail. Incremental saves prevent data loss.

### 3. Priority-Based Filtering

```typescript
type Priority = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';

// NOT_APPLICABLE takes precedence
if (robotsTxt.overallStatus === 'blocked') {
  return 'NOT_APPLICABLE'; // Can't help if bots are blocked
}
```

**Rationale:** Focusing on actionable leads. Blocked sites waste outreach effort.

### 4. Template-Based Emails

```typescript
// Using Handlebars for flexibility
const template = Handlebars.compile(templateSource);
const email = template({
  contact,
  company,
  analysis,
  sender
});
```

**Rationale:** Non-technical users can modify templates without code changes.

### 5. Conservative Rate Limiting

```typescript
const WTTJ_RATE_LIMIT = {
  requestsPerMinute: 20,
  minDelayMs: 1000,
  maxDelayMs: 3000
};
```

**Rationale:** Avoid IP bans. The pipeline is meant for sustained use, not one-time bursts.

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING LAYERS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLI Layer (index.ts)                                           │
│  ├── Catches all errors                                         │
│  ├── Logs with context                                          │
│  └── Returns appropriate exit codes                             │
│                                                                 │
│  Service Layer (scrapers/, analyzers/, etc.)                    │
│  ├── withRetry() for transient failures                         │
│  ├── Graceful degradation (null results vs throwing)            │
│  └── Detailed error logging                                     │
│                                                                 │
│  Utility Layer                                                  │
│  ├── Rate limiting prevents overwhelm                           │
│  ├── Timeout handling for Puppeteer                             │
│  └── Resource cleanup (closeBrowser)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Retry Logic

```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt); // Exponential backoff
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

## Performance Considerations

### Memory Management

| Concern | Solution |
|---------|----------|
| Large HTML strings | Process and discard immediately |
| Browser memory | Single shared instance, close pages after use |
| JSON files | Stream large files if needed (future) |

### Parallelization Points

| Operation | Parallelizable? | Current | Notes |
|-----------|-----------------|---------|-------|
| WTTJ scraping | Yes | Sequential | Rate limit concerns |
| Website analysis | Yes | Sequential | Memory concerns |
| Email verification | Yes | Sequential | DNS rate limits |
| Template rendering | Yes | Sequential | CPU-bound, fast |

### Optimization Opportunities

1. **Parallel page analysis** - Could run multiple Puppeteer pages
2. **DNS caching** - MX records rarely change
3. **HTML caching** - Skip re-fetch for same URL
4. **Incremental analysis** - Only analyze changed sites

## Security Considerations

### Input Validation

```typescript
// URL validation before fetch
try {
  new URL(url);
} catch {
  throw new Error('Invalid URL');
}
```

### Rate Limiting

- WTTJ: 20 requests/minute
- Target websites: 10 requests/minute
- DNS lookups: No explicit limit (uses system resolver)

### Data Privacy

- No credentials stored in code
- Generated data is gitignored
- Email addresses are pattern-guessed (not scraped from public sources)

## Extension Points

### Adding New Analyzers

```typescript
// Create new analyzer in analyzers/
export interface NewAnalyzerResult {
  // Define result schema
}

export async function newAnalyzer(url: string): Promise<NewAnalyzerResult> {
  // Implementation
}

// Add to CLI in index.ts
const newResult = await newAnalyzer(url);
```

### Adding New Scrapers

```typescript
// Create new scraper in scrapers/
export async function scrapeNewSource(): Promise<WTTJCompany[]> {
  // Must return compatible company objects
}
```

### Custom Email Templates

1. Create new `.hbs` file in `templates/`
2. Use standard Handlebars syntax
3. Reference via `renderTemplate('template-name', context)`

## Testing Strategy

### Recommended Test Types

| Type | Location | Purpose |
|------|----------|---------|
| Unit | `*.test.ts` | Pure functions (pattern, scoring) |
| Integration | `__tests__/` | Full pipeline with mocked HTTP |
| E2E | Manual | Real websites (rate limited) |

### Test Commands

```bash
# Type checking
pnpm check-types

# Lint
pnpm lint

# Manual testing
pnpm tsx src/index.ts analyze-single https://example.com
```

## Monitoring & Observability

### Current Logging

```typescript
// Structured logging with levels
logger.info('Starting analysis', { url, options });
logger.error('Analysis failed', { error: String(error) });
logger.progress(current, total, message);
```

### Recommended Additions (Future)

1. **Metrics**: Count of companies scraped, analyzed, filtered
2. **Timing**: Duration of each phase
3. **Success rates**: % of successful analyses
4. **Error tracking**: Categorize and track failure reasons

## Deployment Considerations

### Local Development

```bash
cd apps/tools/lead-gen
pnpm install
pnpm tsx src/index.ts --help
```

### Production Use

- Run on machine with GUI (Puppeteer needs display)
- Or use headless Chrome with `--no-sandbox`
- Consider Docker for reproducible environment

### Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 2GB | 4GB+ |
| CPU | 2 cores | 4 cores |
| Disk | 1GB | 5GB (for data) |
| Network | Stable | Stable |

---

## Appendix: Type Definitions

See `src/types.ts` for complete TypeScript interfaces:

- `WTTJCompany` - Company data from WTTJ
- `JSAnalysisResult` - JS dependency analysis
- `FrameworkDetectionResult` - Framework detection
- `CruxResult` - Chrome UX Report metrics
- `RobotsTxtResult` - robots.txt analysis
- `MetaTagsResult` - Meta tag analysis
- `ContentDiffResult` - Content comparison
- `CompanyAnalysis` - Combined analysis
- `Contact` - Contact information
- `PersonalizedOutreach` - Generated emails
- `OutreachQueueItem` - Outreach tracking
