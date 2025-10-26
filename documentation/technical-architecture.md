# Technical Architecture Document
## CrawlReady: AI Crawler Optimization Platform

**Document Version:** 1.0
**Date:** October 2025
**Project:** CrawlReady
**Target Launch:** Q1 2026

---

## Executive Summary

CrawlReady is an AI-first rendering service designed to make JavaScript-heavy websites visible to AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.). This document outlines the technical architecture for two core components:

1. **Rendering Script**: High-performance headless Chrome rendering engine (<200ms)
2. **AI Crawler Checker**: Free viral marketing tool to test AI crawler compatibility

### Key Technical Requirements

- **Performance**: <200ms rendering time (p95)
- **Scalability**: 1M+ renders/month by Month 12
- **Cost Target**: 40% cheaper than competitors
- **Uptime**: 99.9% SLA for Scale tier
- **Unique Features**: Citation tracking, schema injection, crawler analytics

---

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      USER'S WEBSITE                          │
│               (React/Vue/Angular SPA)                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Request (AI Crawler User-Agent)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              CRAWLREADY MIDDLEWARE                           │
│  • Crawler Detection                                         │
│  • Cache Check (CloudFlare CDN)                              │
│  • Route to Render Service if needed                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Cache Miss
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              RENDERING SERVICE API                           │
│  • Job Queue (BullMQ + Redis)                                │
│  • Rate Limiting & Quota Management                          │
│  • Analytics Pipeline                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Enqueue Job
                     ▼
┌──────────────────────────────────────────────────────────────┐
│         RENDERING ENGINE (Puppeteer Cluster)                 │
│  • Headless Chrome Workers (4-16 per server)                 │
│  • JavaScript Execution                                      │
│  • Resource Optimization                                     │
│  • Schema Injection                                          │
│  • HTML Optimization                                         │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Rendered HTML
                     ▼
┌──────────────────────────────────────────────────────────────┐
│           CACHE & CDN LAYER                                  │
│  • Redis (In-Memory)                                         │
│  • CloudFlare CDN (Global Edge)                              │
│  • Configurable TTL (6-48 hours)                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    AI CRAWLERS                               │
│  GPTBot | ClaudeBot | PerplexityBot | Google-Extended       │
└──────────────────────────────────────────────────────────────┘
```

---

## Component 1: Rendering Script Architecture

### Core Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Browser Automation** | Puppeteer + @sparticuz/chromium | JavaScript execution |
| **Clustering** | Puppeteer Cluster | Parallel rendering |
| **Job Queue** | BullMQ + Redis | Async job processing |
| **Cache** | Redis + CloudFlare CDN | Fast response delivery |
| **API Server** | Node.js + Express | Request handling |

### Rendering Pipeline (9 Steps)

```typescript
// Simplified rendering flow
async function renderPage(url: string, options: RenderOptions): Promise<string> {
  // 1. Launch Browser Context
  const page = await cluster.getPage();

  // 2. Block Unnecessary Resources (speed optimization)
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'font', 'media'].includes(req.resourceType())) {
      req.abort(); // Save bandwidth & time
    } else {
      req.continue();
    }
  });

  // 3. Navigate to URL
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  // 4. Wait for JavaScript Execution
  await page.waitForTimeout(1000);

  // 5. Handle Lazy Loading (auto-scroll)
  if (options.enableScroll) {
    await autoScroll(page);
  }

  // 6. Inject AI-Optimized Schema
  if (options.injectSchema) {
    await injectSchema(page);
  }

  // 7. Extract HTML
  const html = await page.content();

  // 8. Optimize HTML (remove scripts, minify)
  const optimized = optimizeHtml(html);

  // 9. Return & Cache
  return optimized;
}
```

### Crawler Detection Module

```typescript
// /src/lib/crawler-detection.ts

export const AI_CRAWLERS = {
  // OpenAI
  GPTBot: /GPTBot/i,
  OAI_SearchBot: /OAI-SearchBot/i,
  ChatGPT_User: /ChatGPT-User/i,

  // Anthropic
  ClaudeBot: /ClaudeBot|Claude-Web/i,

  // Perplexity
  PerplexityBot: /PerplexityBot/i,

  // Google AI
  Google_Extended: /Google-Extended/i,

  // Meta AI
  Meta_ExternalAgent: /Meta-ExternalAgent/i,

  // Others
  YouBot: /YouBot/i,
  BingBot: /bingbot/i,
};

export function detectCrawler(userAgent: string): CrawlerInfo | null {
  for (const [name, pattern] of Object.entries(AI_CRAWLERS)) {
    if (pattern.test(userAgent)) {
      return {
        name,
        type: getCrawlerType(name),
        needsRendering: true,
      };
    }
  }
  return null;
}
```

### Schema Injection Engine

Auto-detects page type and injects appropriate structured data:

```typescript
// Auto-detect and inject schema
async function injectSchema(page: Page): Promise<void> {
  const pageType = await detectPageType(page);

  const schemaGenerators = {
    article: generateArticleSchema,
    product: generateProductSchema,
    faq: generateFAQSchema,
    howto: generateHowToSchema,
    default: generateWebPageSchema,
  };

  const schema = await schemaGenerators[pageType](page);

  // Inject as JSON-LD
  await page.evaluate((schemaJson) => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = schemaJson;
    document.head.appendChild(script);
  }, JSON.stringify(schema));
}

// Example: FAQ Schema
function generateFAQSchema(page: Page): SchemaType {
  const faqs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('details, .faq-item')).map(el => ({
      question: el.querySelector('summary, .question')?.textContent,
      answer: el.querySelector('.answer, p')?.textContent,
    }));
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
    })),
  };
}
```

### Performance Optimizations

| Optimization | Impact | Implementation |
|-------------|--------|----------------|
| **Resource Blocking** | 40-60% faster | Block images, fonts, ads during render |
| **Caching Strategy** | 90%+ cache hit rate | Redis + CDN with smart TTL |
| **Parallel Rendering** | 10x throughput | Puppeteer Cluster with 4-16 workers |
| **HTML Minification** | 30% smaller payloads | Remove scripts, compress HTML |
| **Spot Instances** | 70% cost reduction | Use AWS Spot for render workers |

---

## Component 2: AI Crawler Checker (Free Tool)

### Purpose & Strategy

**Goal**: Viral marketing tool that:
1. Provides immediate value (test if AI can see your site)
2. Generates qualified leads
3. Demonstrates product capability
4. Builds SEO authority

**Distribution**: HackerNews, ProductHunt, Reddit r/SEO, Twitter

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              LANDING PAGE (Next.js)                          │
│  • Input: Website URL                                        │
│  • Button: "Check AI Crawler Compatibility"                 │
│  • Real-time progress indicator                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ POST /api/check-crawler
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              CRAWLER CHECK API                               │
│  1. Fetch URL with regular browser                           │
│  2. Fetch URL with AI crawler User-Agent                     │
│  3. Compare rendered content                                 │
│  4. Generate compatibility score                             │
│  5. Identify missing content                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Return Results
                     ▼
┌──────────────────────────────────────────────────────────────┐
│              RESULTS PAGE                                    │
│  • Compatibility Score: 45%                                  │
│  • Issues Found:                                             │
│    - JavaScript content not rendered                         │
│    - Missing schema markup                                   │
│    - Lazy-loaded images invisible                            │
│  • CTA: "Fix with CrawlReady (14-day free trial)"           │
└──────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// /src/app/api/check-crawler/route.ts

export async function POST(req: Request) {
  const { url } = await req.json();

  // Validate URL
  if (!isValidUrl(url)) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Run parallel checks
  const [userView, crawlerView] = await Promise.all([
    renderAsUser(url),
    renderAsCrawler(url),
  ]);

  // Compare results
  const analysis = analyzeCompatibility(userView, crawlerView);

  // Store result for analytics
  await saveCheckResult({
    url,
    score: analysis.score,
    issues: analysis.issues,
    timestamp: new Date(),
  });

  return Response.json(analysis);
}

type CheckResult = {
  score: number; // 0-100
  issues: Issue[];
  recommendations: string[];
  crawlerSupport: {
    gptbot: boolean;
    claudebot: boolean;
    perplexitybot: boolean;
  };
};

function analyzeCompatibility(userView: RenderResult, crawlerView: RenderResult): CheckResult {
  const issues: Issue[] = [];
  let score = 100;

  // Check 1: Content parity
  const contentDiff = calculateContentDiff(userView.html, crawlerView.html);
  if (contentDiff > 20) {
    issues.push({
      type: 'content_missing',
      severity: 'high',
      description: `${contentDiff}% of content not visible to crawlers`,
    });
    score -= 30;
  }

  // Check 2: Schema markup
  if (!hasSchemaMarkup(crawlerView.html)) {
    issues.push({
      type: 'no_schema',
      severity: 'medium',
      description: 'Missing structured data (Schema.org)',
    });
    score -= 20;
  }

  // Check 3: JavaScript rendering
  if (!hasRenderedJs(crawlerView.html)) {
    issues.push({
      type: 'js_not_rendered',
      severity: 'high',
      description: 'JavaScript content not executing for crawlers',
    });
    score -= 40;
  }

  // Check 4: Meta tags
  if (!hasMetaTags(crawlerView.html)) {
    issues.push({
      type: 'missing_meta',
      severity: 'low',
      description: 'Missing or incomplete meta tags',
    });
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations: generateRecommendations(issues),
    crawlerSupport: detectCrawlerSupport(url),
  };
}
```

### Free Tool Features

| Feature | Purpose | Implementation |
|---------|---------|----------------|
| **Real-time Check** | Test any URL instantly | Puppeteer render with AI User-Agent |
| **Compatibility Score** | Visual 0-100% rating | Content diff + schema + JS check |
| **Issue Detection** | Show specific problems | Compare user vs crawler view |
| **Crawler Support Matrix** | Which AIs support the site | Test GPTBot, ClaudeBot, etc. |
| **Visual Diff** | Side-by-side comparison | Screenshot comparison |
| **Recommendations** | How to fix issues | CTA to paid product |

### Viral Growth Mechanisms

```typescript
// Social sharing with custom OG tags
<meta property="og:title" content="My site scores 45% on AI Crawler Compatibility" />
<meta property="og:description" content="Check if ChatGPT and Perplexity can see your website" />
<meta property="og:image" content="https://crawlready.com/og/score-45.png" />

// Dynamic OG image generation
// /api/og/[score].png
export async function GET(req: Request, { params }: { params: { score: string } }) {
  const score = parseInt(params.score);
  const svg = generateScoreBadge(score);
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}

// Shareable report URL
const reportUrl = `https://crawlready.com/report/${checkId}`;
// Includes: detailed analysis, recommendations, CTA to sign up
```

---

## Technology Stack Summary

### Frontend (Next.js 14)
```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript",
  "styling": "TailwindCSS + shadcn/ui",
  "charts": "Recharts",
  "deployment": "Vercel"
}
```

### Backend (Node.js)
```json
{
  "runtime": "Node.js 20+",
  "framework": "Express",
  "orm": "Drizzle ORM",
  "database": "PostgreSQL (Supabase)",
  "cache": "Redis (Upstash)",
  "queue": "BullMQ"
}
```

### Rendering Engine
```json
{
  "browser": "Puppeteer + @sparticuz/chromium",
  "clustering": "Puppeteer Cluster",
  "optimization": "Resource blocking, HTML minification",
  "deployment": "Railway / Fly.io containers"
}
```

### Infrastructure
```json
{
  "frontend": "Vercel Edge Network",
  "api": "Railway (Node.js containers)",
  "render-workers": "Fly.io (global regions)",
  "cdn": "CloudFlare",
  "database": "Supabase PostgreSQL",
  "cache": "Upstash Redis",
  "monitoring": "Sentry + Axiom + PostHog"
}
```

---

## API Specifications

### 1. Render API

```http
POST https://api.crawlready.com/v1/render
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "url": "https://example.com/page",
  "userAgent": "GPTBot/1.0",
  "options": {
    "waitUntil": "networkidle2",
    "timeout": 30000,
    "blockResources": ["image", "font"],
    "injectSchema": true,
    "enableScroll": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "html": "<html>...</html>",
  "metadata": {
    "renderTime": 187,
    "cacheHit": false,
    "schemaInjected": true,
    "resourcesBlocked": 23
  },
  "quota": {
    "used": 1234,
    "limit": 25000,
    "resetAt": "2026-02-01T00:00:00Z"
  }
}
```

### 2. Cache Invalidation API

```http
DELETE https://api.crawlready.com/v1/cache
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "urls": [
    "https://example.com/page1",
    "https://example.com/page2"
  ]
}
```

### 3. Analytics API

```http
GET https://api.crawlready.com/v1/analytics?period=7d
Authorization: Bearer {API_KEY}

Response:
{
  "crawlers": {
    "GPTBot": 1234,
    "ClaudeBot": 567,
    "PerplexityBot": 890
  },
  "renders": {
    "total": 2691,
    "cached": 2420,
    "cacheHitRate": 0.90
  },
  "avgRenderTime": 195
}
```

---

## Scalability & Performance

### Auto-Scaling Strategy

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Queue Depth** | >100 jobs | Add 2 render workers |
| **Avg Wait Time** | >5 seconds | Scale up workers |
| **CPU Usage** | >80% | Horizontal scale |
| **Cache Hit Rate** | <85% | Increase TTL |

### Performance Targets

```
Rendering Time (p50): <150ms
Rendering Time (p95): <200ms
Rendering Time (p99): <500ms
Cache Hit Rate: >90%
API Response Time: <50ms (cache hit)
Uptime: 99.9% (43 minutes downtime/month)
```

### Cost Optimization

```typescript
// Intelligent caching strategy
function calculateCacheTTL(url: string, userPlan: string): number {
  const baseTTL = {
    developer: 6 * 3600, // 6 hours
    startup: 24 * 3600, // 24 hours
    growth: 48 * 3600, // 48 hours
    scale: 48 * 3600, // 48 hours
  };

  // Dynamic content = shorter TTL
  if (isDynamicPage(url)) {
    return baseTTL[userPlan] / 2;
  }

  // Static content = longer TTL
  if (isStaticPage(url)) {
    return baseTTL[userPlan] * 2;
  }

  return baseTTL[userPlan];
}

// Spot instance usage
const renderWorkers = {
  production: {
    spot: 0.70, // 70% spot instances
    onDemand: 0.30, // 30% on-demand (reliability)
  },
  costSavings: 0.65, // 65% cost reduction
};
```

---

## Security Architecture

### Authentication & Authorization

```typescript
// API Key management
type ApiKey = {
  id: string;
  userId: string;
  key: string; // Hashed with bcrypt
  permissions: string[];
  rateLimit: number;
  quotaLimit: number;
  createdAt: Date;
  lastUsed: Date;
};

// Rate limiting (per API key)
const rateLimits = {
  developer: 100, // requests per minute
  startup: 500,
  growth: 2000,
  scale: 10000,
};

// Quota enforcement
async function checkQuota(apiKey: string): Promise<boolean> {
  const usage = await getMonthlyUsage(apiKey);
  const plan = await getUserPlan(apiKey);
  return usage < plan.quotaLimit;
}
```

### Content Security

```typescript
// Prevent abuse
const securityChecks = {
  // Block malicious URLs
  async validateUrl(url: string): Promise<boolean> {
    const blocked = ['localhost', '127.0.0.1', '0.0.0.0', 'file://'];
    return !blocked.some(b => url.includes(b));
  },

  // Prevent infinite loops
  maxRedirects: 3,
  timeout: 30000, // 30s max per render

  // Resource limits
  maxMemory: '2GB',
  maxCPU: '1 core',
};
```

---

## Deployment Strategy

### Phase 1: MVP (Weeks 1-4)
- Manual rendering script (Puppeteer on local machine)
- Loom demo video
- Landing page + email capture
- Target: 10 paying customers

### Phase 2: Automated Product (Months 1-3)
- Deploy rendering service (Railway)
- Job queue (BullMQ + Redis)
- Simple dashboard (Next.js)
- API with authentication
- Target: 30 paying customers

### Phase 3: Scale (Months 4-8)
- Multi-region deployment (Fly.io)
- Global CDN (CloudFlare)
- Advanced analytics
- Citation tracking feature
- Target: 100 paying customers

### Infrastructure Costs

```
Month 1-3 (0-30 customers):
- Vercel: $20/month (Pro plan)
- Railway: $50/month (4 workers)
- Supabase: $25/month
- Upstash Redis: $10/month
- CloudFlare: $20/month
Total: ~$125/month

Month 4-8 (30-100 customers):
- Vercel: $20/month
- Fly.io: $200/month (10 workers)
- Supabase: $50/month
- Upstash: $30/month
- CloudFlare: $20/month
Total: ~$320/month

Month 9-18 (100-300 customers):
- Vercel: $20/month
- Fly.io: $600/month (30 workers)
- Supabase: $100/month
- Upstash: $100/month
- CloudFlare: $50/month
Total: ~$870/month
```

**Target Margins**: 80% gross margin (SaaS standard)

---

## Monitoring & Observability

### Key Metrics Dashboard

```typescript
const kpis = {
  // Business Metrics
  mrr: 'Monthly Recurring Revenue',
  churnRate: 'Customer churn rate',
  cac: 'Customer Acquisition Cost',
  ltv: 'Lifetime Value',

  // Technical Metrics
  renderLatency: 'p50, p95, p99 render times',
  cacheHitRate: 'Percentage of cache hits',
  errorRate: 'Failed renders / total renders',
  uptime: '99.9% SLA compliance',

  // Product Metrics
  dailyActiveUsers: 'DAU',
  apiCallsPerUser: 'Usage intensity',
  featureAdoption: 'Schema injection usage',
  nps: 'Net Promoter Score',
};
```

### Alerting Rules

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: PagerDuty + Slack

  - name: Slow Renders
    condition: p95_latency > 300ms
    action: Slack notification

  - name: Queue Backlog
    condition: queue_depth > 200
    action: Auto-scale workers

  - name: Low Cache Hit Rate
    condition: cache_hit_rate < 80%
    action: Investigate + adjust TTL
```

---

## Next Steps (MVP Launch)

### Week 1: Setup
1. Register domain (crawlready.com)
2. Set up Next.js landing page
3. Create Puppeteer rendering script
4. Build AI Crawler Checker tool
5. Deploy to Vercel

### Week 2-3: Distribution
1. Post on HackerNews: "Show HN: Check if ChatGPT can see your JavaScript site"
2. Post on ProductHunt
3. Share on Twitter/LinkedIn
4. Manual outreach to 50 target companies

### Week 4: Validation
1. Goal: 10 paying customers @ $49-99/month
2. Collect feedback
3. Iterate on manual service
4. Document common issues

**Only build automated product after reaching $500-1000 MRR**

---

## Appendix: Code Repository Structure

```
crawlready-web/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Authenticated routes
│   │   ├── (unauth)/     # Public routes
│   │   ├── api/          # API routes
│   │   │   ├── render/
│   │   │   ├── check-crawler/
│   │   │   └── analytics/
│   │   └── dashboard/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── charts/
│   ├── lib/
│   │   ├── crawler-detection.ts
│   │   ├── cache.ts
│   │   └── analytics.ts
│   └── services/
│       └── renderer/
│           ├── render-engine.ts
│           ├── schema-injector.ts
│           └── html-optimizer.ts
├── workers/              # Rendering workers
│   ├── render-worker.ts
│   └── citation-tracker.ts
├── documentation/
│   ├── technical-architecture.md (this file)
│   ├── api-reference.md
│   └── deployment-guide.md
└── tests/
    ├── e2e/
    └── unit/
```

---

**Document Status**: Draft v1.0
**Last Updated**: October 23, 2025
**Owner**: Technical Architecture Team
**Review Cycle**: Bi-weekly during MVP phase
