# CrawlReady Crawler Checker - Modular Architecture

## Structure

```
crawler-checker/
├── index.ts                    # Main service entry point
├── types.ts                    # TypeScript type definitions
├── README.md                   # This file
├── config/
│   └── weights.ts             # Scoring weights & thresholds
├── utils/
│   ├── url-fetcher.ts         # URL fetching with error handling
│   └── html-parser.ts         # HTML parsing utilities
├── checkers/                  # Individual check modules
│   ├── robots-txt.checker.ts  # Robots.txt validation
│   ├── meta-robots.checker.ts # Meta robots & X-Robots-Tag
│   ├── canonical.checker.ts   # Canonical URL validation
│   ├── schema.checker.ts      # Schema.org deep analysis
│   ├── meta-tags.checker.ts   # Title, description, OG tags
│   ├── semantic-html.checker.ts # HTML5 semantic structure
│   ├── content-quality.checker.ts # Content depth & E-E-A-T
│   ├── javascript.checker.ts  # JS dependency detection
│   └── navigation.checker.ts  # Internal linking analysis
└── scoring/
    └── score-calculator.ts    # Weighted scoring algorithm
```

## Usage

```typescript
import { crawlerCheckerService } from '@/libs/crawler-checker';

const result = await crawlerCheckerService.checkUrl('https://example.com');
console.log(`Score: ${result.score}/100`);
console.log(`Issues: ${result.issues.length}`);
```

## Key Features

- **25+ Checks** across 7 weighted categories
- **Research-backed** scoring (25% JS, 20% Tech SEO, 20% Schema, 15% Content, 10% Performance, 5% Navigation, 5% Security)
- **Modular** - each checker is independent and testable
- **Type-safe** - full TypeScript support
- **Fast** - all checks use fetch (no Puppeteer for MVP)

## Adding New Checkers

1. Create checker in `checkers/` directory
2. Add type definition to `types.ts`
3. Import and use in `index.ts`
4. Update scoring in `scoring/score-calculator.ts`

## Scoring Weights

Based on AI Crawler Research:
- **JavaScript Accessibility**: 25% (most AI crawlers don't execute JS)
- **Technical SEO**: 20% (robots.txt, canonical, HTTPS)
- **Schema & Metadata**: 20% (critical for AI attribution)
- **Content Quality**: 15% (E-E-A-T signals)
- **Performance**: 10% (response time, Core Web Vitals)
- **Navigation**: 5% (internal linking)
- **Security**: 5% (HTTPS, headers)
