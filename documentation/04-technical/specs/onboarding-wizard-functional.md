# Onboarding Wizard - Functional Specification

**Version:** 1.0
**Date:** January 2026
**Status:** Draft
**Dependencies:** Sites Management, Onboarding Strategy

---

## 1. Overview

### 1.1 Purpose

The Onboarding Wizard guides new users through setting up their first site on CrawlReady. It delivers on our "5-minute setup" promise by providing a streamlined, value-first experience that shows the problem before asking for configuration.

### 1.2 Related Documents

- [Onboarding Strategy](../../01-product/onboarding-strategy.md) - Philosophy and flow design
- [Sites Management](./dashboard-sites-functional.md) - Site data model
- [Integration Guide](./integration-guide.md) - Detailed integration docs

### 1.3 Success Criteria

| Metric | Target |
|--------|--------|
| Wizard Completion Rate | > 70% |
| Median Time to Complete | < 5 minutes |
| Verification Success Rate | > 80% |
| Day-1 Return Rate | > 50% |

---

## 2. User Flow

### 2.1 Entry Points

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   New Sign-Up   │────▶│  Org Creation   │────▶│  Wizard Step 1  │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ Dashboard Empty │────▶│  Wizard Step 1  │
│     State       │     │                 │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Crawler Checker │────▶│    Sign Up      │────▶│ Wizard Step 1   │
│   Results       │     │                 │     │ (URL pre-filled)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2 Wizard Steps

```
Step 1              Step 2              Step 3              Step 4
Add Website    ───▶ See Problem    ───▶ Integrate     ───▶ Verify
(30 sec)            (30 sec)            (3 min)             (1 min)
                                                               │
                                                               ▼
                                                          Dashboard
```

### 2.3 URL Structure

```
/onboarding/add-site          # Step 1
/onboarding/analyze           # Step 2
/onboarding/integrate         # Step 3
/onboarding/verify            # Step 4
/onboarding/complete          # Success (redirect to dashboard)
```

---

## 3. Step 1: Add Your Website

### 3.1 Purpose

Capture the user's domain and create immediate engagement through framework detection.

### 3.2 UI Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Step 1 of 4                                                         ││
│  │  ████░░░░░░░░░░░░░░░░                                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│                              🚀                                          │
│                                                                          │
│                    Let's Get Your Site Ready                             │
│                      for AI Crawlers                                     │
│                                                                          │
│         Enter your website URL to check its AI visibility                │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  https:// │ your-website.com                                        ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│                    Detected: Next.js 14 ✓                                │
│                                                                          │
│                        [Analyze My Site]                                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ✓ Works with React, Vue, Next.js, Angular, and more                     │
│  ✓ No changes to your existing code structure                            │
│  ✓ See results in under 5 minutes                                        │
│                                                                          │
│                                                                          │
│                      [Skip for now →]                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Component Specifications

#### URL Input

| Property | Specification |
|----------|---------------|
| Type | Text input with https:// prefix |
| Placeholder | "your-website.com" |
| Validation | Real-time, debounced 300ms |
| Auto-format | Strip protocol, lowercase, remove trailing slash |
| Max length | 253 characters |

#### Framework Detection Badge

| Property | Specification |
|----------|---------------|
| Trigger | Appears after URL validation succeeds |
| Loading | "Detecting framework..." with spinner |
| Success | "Detected: {Framework} ✓" |
| Unknown | "Framework: Unknown" (still proceed) |
| Error | Don't show (silent failure) |

#### Analyze Button

| Property | Specification |
|----------|---------------|
| State | Disabled until URL valid |
| Loading | "Analyzing..." with spinner |
| Timeout | 30 seconds, then show retry |

### 3.4 API Interactions

#### POST /api/onboarding/analyze-url

**Request:**
```typescript
{
  url: string;                     // Domain only, no protocol
}
```

**Response (200):**
```typescript
{
  valid: true;
  domain: string;                  // Normalized domain
  accessible: boolean;
  frameworkDetected: string | null;
  frameworkConfidence: 'high' | 'medium' | 'low';
  siteId: string;                  // Created site record
}
```

**Response (400):**
```typescript
{
  valid: false;
  error: 'INVALID_FORMAT' | 'NOT_ACCESSIBLE' | 'PRIVATE_IP' | 'TIMEOUT';
  message: string;
  suggestion?: string;
}
```

### 3.5 Error Handling

| Error | Message | Action |
|-------|---------|--------|
| Invalid URL | "Please enter a valid domain (e.g., example.com)" | Focus input |
| Not accessible | "We couldn't reach your site. Is it publicly accessible?" | Retry button |
| Private IP | "This appears to be a private URL. Enter a public domain." | Clear input |
| Timeout | "Taking longer than expected. Try again?" | Retry button |
| Already exists | "This domain is already added to your account." | Go to dashboard |

### 3.6 State Persistence

```typescript
// Save to localStorage on every change
localStorage.setItem('onboarding_step1', JSON.stringify({
  url: inputValue,
  siteId: createdSiteId,
  completedAt: timestamp,
}));

// Also save to database for cross-device
await saveOnboardingProgress(userId, { step: 1, data: { ... } });
```

---

## 4. Step 2: See the Problem

### 4.1 Purpose

Create the "aha moment" by showing users what AI crawlers see (or don't see) on their site.

### 4.2 UI Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Step 2 of 4                                                         ││
│  │  ████████░░░░░░░░░░░░                                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│         Here's what AI crawlers see when they visit your site            │
│                                                                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐      │
│  │  What Your Users See        │   │  What AI Crawlers See       │      │
│  │  ─────────────────────────  │   │  ─────────────────────────  │      │
│  │                             │   │                             │      │
│  │  [Beautiful rendered        │   │  [Blank page or             │      │
│  │   Next.js app with          │   │   loading spinner           │      │
│  │   full content]             │   │   or empty divs]            │      │
│  │                             │   │                             │      │
│  │                             │   │                             │      │
│  │                             │   │                             │      │
│  └─────────────────────────────┘   └─────────────────────────────┘      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                                                                      ││
│  │  AI Visibility Score: 12/100    ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ❌ GPTBot (ChatGPT)    ❌ ClaudeBot (Claude)    ❌ PerplexityBot         │
│                                                                          │
│  Issues Found:                                                           │
│  ─────────────────────────────────────────────────────────────────────  │
│  🔴 JavaScript content not rendered (87% of content invisible)           │
│  🟡 Missing meta description tag                                         │
│  🟡 No structured data (JSON-LD) detected                                │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Your Next.js app appears blank to ChatGPT and other AI assistants.      │
│  Let's fix this in the next 3 minutes.                                   │
│                                                                          │
│                          [Fix This Now →]                                │
│                                                                          │
│  [← Back]                                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Component Specifications

#### Side-by-Side Comparison

| Property | Specification |
|----------|---------------|
| Left Panel | Screenshot of page with JS enabled |
| Right Panel | Screenshot of page with JS disabled |
| Capture | Server-side using Puppeteer |
| Fallback | Show HTML content diff if screenshot fails |
| Size | 400x300px each, responsive |

#### Visibility Score

| Property | Specification |
|----------|---------------|
| Range | 0-100 |
| Color | Red (0-49), Yellow (50-79), Green (80-100) |
| Animation | Count up from 0 to actual score |
| Tooltip | "Based on content visibility, meta tags, and structure" |

#### Crawler Compatibility Badges

| Property | Specification |
|----------|---------------|
| Crawlers | GPTBot, ClaudeBot, PerplexityBot |
| Status | ❌ (not compatible) or ✓ (compatible) |
| Tooltip | Reason for status |

#### Issues List

| Property | Specification |
|----------|---------------|
| Max items | 5 most critical |
| Severity | 🔴 Critical, 🟡 Warning, 🔵 Info |
| Expandable | Click to see more details |

### 4.4 API Interactions

#### GET /api/onboarding/analysis/:siteId

**Response (200):**
```typescript
{
  siteId: string;
  domain: string;
  analysis: {
    visibilityScore: number;
    jsContentRatio: number;        // 0-1, how much content requires JS
    
    screenshots: {
      withJs: string;              // Base64 or URL
      withoutJs: string;
    };
    
    crawlerCompatibility: {
      gptBot: boolean;
      claudeBot: boolean;
      perplexityBot: boolean;
    };
    
    issues: Array<{
      severity: 'critical' | 'warning' | 'info';
      code: string;
      title: string;
      description: string;
      fixable: boolean;            // Can CrawlReady fix this?
    }>;
    
    meta: {
      hasTitle: boolean;
      hasDescription: boolean;
      hasCanonical: boolean;
      hasOgTags: boolean;
      hasJsonLd: boolean;
    };
  };
  analyzedAt: string;
}
```

### 4.5 Visibility Score Calculation

```typescript
function calculateVisibilityScore(analysis: Analysis): number {
  let score = 0;
  
  // Content visibility (50 points)
  // Compare text content with JS vs without JS
  const contentRatio = analysis.withoutJsContent.length / analysis.withJsContent.length;
  score += Math.min(50, Math.round(contentRatio * 50));
  
  // Meta tags (20 points)
  if (analysis.meta.hasTitle) score += 5;
  if (analysis.meta.hasDescription) score += 5;
  if (analysis.meta.hasCanonical) score += 5;
  if (analysis.meta.hasOgTags) score += 5;
  
  // Structured data (15 points)
  if (analysis.meta.hasJsonLd) score += 15;
  
  // Heading structure (15 points)
  if (analysis.hasH1) score += 5;
  if (analysis.hasProperHeadingHierarchy) score += 10;
  
  return score;
}
```

### 4.6 Issue Detection

| Issue Code | Severity | Detection | Message |
|------------|----------|-----------|---------|
| `JS_NOT_RENDERED` | critical | Content ratio < 0.2 | "JavaScript content not rendered" |
| `PARTIAL_RENDER` | warning | Content ratio 0.2-0.7 | "Partial content rendered" |
| `NO_META_DESC` | warning | Missing meta description | "Missing meta description" |
| `NO_JSON_LD` | warning | No structured data | "No structured data detected" |
| `NO_H1` | info | Missing H1 tag | "No H1 heading found" |
| `SLOW_RENDER` | info | Load time > 3s | "Slow page load time" |

---

## 5. Step 3: Integrate

### 5.1 Purpose

Guide user through adding CrawlReady middleware to their project.

### 5.2 UI Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Step 3 of 4                                                         ││
│  │  ████████████░░░░░░░░                                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│              Add CrawlReady to Your Project                              │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Integration Method                                                  ││
│  │                                                                      ││
│  │  ● Middleware (Recommended)                                          ││
│  │    Best for Next.js, Express, Fastify                                ││
│  │                                                                      ││
│  │  ○ DNS/Proxy                                                         ││
│  │    For static sites or platforms without middleware                  ││
│  │                                                                      ││
│  │  ○ API Direct                                                        ││
│  │    For custom implementations                                        ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  1. Create middleware.ts in your project root                            │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ // middleware.ts                                        [Copy All]   ││
│  │                                                                      ││
│  │ import { NextResponse } from 'next/server';                          ││
│  │ import type { NextRequest } from 'next/server';                      ││
│  │                                                                      ││
│  │ const AI_BOTS = [/GPTBot/i, /ClaudeBot/i, /PerplexityBot/i];        ││
│  │                                                                      ││
│  │ export async function middleware(req: NextRequest) {                 ││
│  │   const ua = req.headers.get('user-agent') || '';                    ││
│  │   if (!AI_BOTS.some(p => p.test(ua))) return NextResponse.next();   ││
│  │                                                                      ││
│  │   try {                                                              ││
│  │     const res = await fetch('https://api.crawlready.com/api/render',││
│  │       ...                                                            ││
│  │   }                                                                  ││
│  │ }                                                                    ││
│  │                                                                      ││
│  │ export const config = { matcher: ['/((?!_next|favicon).*)'] };       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  2. Add your API key to .env.local                                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ CRAWLREADY_API_KEY=cr_live_aBcDeFgHiJkLmNoPqRsT...      [Copy]       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ⚠️ Save this API key now — you won't be able to see it again!           │
│                                                                          │
│  3. Deploy your changes                                                  │
│                                                                          │
│  ☐ I've added the middleware and deployed my site                        │
│                                                                          │
│  Need help? [View detailed guide] [Watch 2-min video]                    │
│                                                                          │
│  [← Back]                            [Verify Integration →]              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Framework-Specific Snippets

#### Next.js (App Router)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOT_PATTERNS = [
  /GPTBot/i, /ChatGPT-User/i, /OAI-SearchBot/i,
  /ClaudeBot/i, /Claude-Web/i, /anthropic-ai/i,
  /PerplexityBot/i, /Google-Extended/i,
];

function isAIBot(userAgent: string): boolean {
  return AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

export async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  
  if (!isAIBot(userAgent)) {
    return NextResponse.next();
  }
  
  try {
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: req.nextUrl.toString() }),
    });
    
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      return new NextResponse(await response.text(), {
        headers: { 
          'Content-Type': 'text/html; charset=utf-8',
          'X-Served-By': 'CrawlReady',
        },
      });
    }
  } catch (error) {
    console.error('[CrawlReady]', error);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

#### Express.js

```javascript
// middleware/crawlready.js
const AI_BOT_PATTERNS = [
  /GPTBot/i, /ChatGPT-User/i, /ClaudeBot/i, /PerplexityBot/i, /Google-Extended/i
];

function crawlReadyMiddleware(req, res, next) {
  const ua = req.get('user-agent') || '';
  if (!AI_BOT_PATTERNS.some(p => p.test(ua))) return next();
  
  fetch('https://api.crawlready.com/api/render', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: `${req.protocol}://${req.get('host')}${req.originalUrl}` }),
  })
  .then(async (response) => {
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      res.set('Content-Type', 'text/html');
      res.set('X-Served-By', 'CrawlReady');
      return res.send(await response.text());
    }
    next();
  })
  .catch(() => next());
}

module.exports = crawlReadyMiddleware;
```

### 5.4 API Key Generation

```typescript
// Generate API key when entering Step 3
async function generateApiKeyForSite(siteId: string): Promise<{ key: string; prefix: string }> {
  const key = `cr_live_${generateRandomString(32)}`;
  const hash = await hashApiKey(key);
  const prefix = key.slice(0, 15) + '...';
  
  await db.insert(siteApiKeys).values({
    siteId,
    keyHash: hash,
    keyPrefix: prefix,
  });
  
  return { key, prefix };
}
```

### 5.5 Copy Functionality

```typescript
// Copy button component
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Track analytics
    track('onboarding_code_copied', { label });
  };
  
  return (
    <button onClick={handleCopy}>
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  );
}
```

---

## 6. Step 4: Verify

### 6.1 Purpose

Confirm the integration works and celebrate success.

### 6.2 UI Specification - Testing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Step 4 of 4                                                         ││
│  │  ████████████████░░░░                                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│                              🔍                                          │
│                                                                          │
│                   Verifying Your Integration                             │
│                                                                          │
│                        ████████████████░░░░░░░░                          │
│                              67%                                         │
│                                                                          │
│                   Sending test request to your site...                   │
│                                                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.3 UI Specification - Success

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  Step 4 of 4                                                         ││
│  │  ████████████████████                                                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│                              🎉                                          │
│                                                                          │
│            Your Site is Now Visible to AI Crawlers!                      │
│                                                                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐      │
│  │  Before                     │   │  After                      │      │
│  │  ────────────────────────── │   │  ────────────────────────── │      │
│  │                             │   │                             │      │
│  │  Visibility Score: 12      │   │  Visibility Score: 100     │      │
│  │  ████░░░░░░░░░░░░░░░░░░░░  │   │  ████████████████████████  │      │
│  │                             │   │                             │      │
│  │  ❌ GPTBot                  │   │  ✅ GPTBot                  │      │
│  │  ❌ ClaudeBot               │   │  ✅ ClaudeBot               │      │
│  │  ❌ PerplexityBot           │   │  ✅ PerplexityBot           │      │
│  │                             │   │                             │      │
│  └─────────────────────────────┘   └─────────────────────────────┘      │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ✓ Integration verified successfully                                     │
│  ✓ First render completed in 142ms                                       │
│  ✓ Your site is ready for AI crawlers                                    │
│                                                                          │
│  What's Next:                                                            │
│  • AI crawlers typically visit within 7 days                             │
│  • We'll notify you when they do                                         │
│  • Monitor activity in your dashboard                                    │
│                                                                          │
│                       [Go to Dashboard →]                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.4 UI Specification - Failure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                              ⚠️                                          │
│                                                                          │
│            We Couldn't Verify Your Integration                           │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Common issues and solutions:                                            │
│                                                                          │
│  ☐ Middleware file not created                                           │
│    → Create middleware.ts in your project root                           │
│                                                                          │
│  ☐ API key not set in environment                                        │
│    → Add CRAWLREADY_API_KEY to .env.local                                │
│                                                                          │
│  ☐ Changes not deployed                                                  │
│    → Push your changes and wait for deployment                           │
│                                                                          │
│  ☐ Middleware not matching routes                                        │
│    → Check the matcher config in middleware.ts                           │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Error details: INTEGRATION_NOT_DETECTED                                 │
│  We didn't receive a response with CrawlReady headers.                   │
│                                                                          │
│  [← Back to Integration]    [Try Again]    [Skip & Go to Dashboard]      │
│                                                                          │
│  Need help? [Contact Support] [View Troubleshooting Guide]               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Verification Logic

```typescript
async function verifyIntegration(siteId: string): Promise<VerificationResult> {
  const site = await getSite(siteId);
  const testUrl = `https://${site.domain}/`;
  
  try {
    // Make render request through our API
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getServiceKey()}`,
        'Content-Type': 'application/json',
        'X-Verification-Request': 'true',
      },
      body: JSON.stringify({ url: testUrl }),
      signal: AbortSignal.timeout(30_000),
    });
    
    const servedBy = response.headers.get('x-served-by');
    const cache = response.headers.get('x-cache');
    
    // Check for CrawlReady signature
    if (response.ok && servedBy === 'CrawlReady') {
      const html = await response.text();
      
      // Verify content was rendered
      if (html.length > 1000) {
        return {
          success: true,
          responseTime: /* measured */,
          cacheStatus: cache,
          htmlSize: html.length,
        };
      }
    }
    
    // Integration not working
    return {
      success: false,
      error: {
        code: 'INTEGRATION_NOT_DETECTED',
        message: "We didn't receive a response from CrawlReady",
        suggestion: 'Verify middleware is deployed and API key is correct',
      },
    };
    
  } catch (error) {
    if (error.name === 'TimeoutError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT',
          message: 'Request timed out after 30 seconds',
          suggestion: 'Your site may be slow to respond',
        },
      };
    }
    
    return {
      success: false,
      error: {
        code: 'REQUEST_FAILED',
        message: error.message,
        suggestion: 'Check if your site is accessible',
      },
    };
  }
}
```

### 6.6 Success Actions

```typescript
async function handleVerificationSuccess(siteId: string, result: VerificationResult) {
  // Update site status
  await db.update(sites)
    .set({ 
      status: 'active',
      verifiedAt: new Date(),
      verificationMethod: 'api_response',
    })
    .where(eq(sites.id, siteId));
  
  // Mark onboarding complete
  await markOnboardingComplete(siteId);
  
  // Send welcome email
  await sendWelcomeEmail(siteId);
  
  // Track analytics
  track('onboarding_completed', {
    siteId,
    responseTime: result.responseTime,
    timeToComplete: /* calculated */,
  });
  
  // Show confetti animation
  triggerConfetti();
}
```

---

## 7. Progress Persistence

### 7.1 State Management

```typescript
interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4;
  siteId: string | null;
  url: string | null;
  analysisComplete: boolean;
  apiKey: string | null;          // Only stored in memory, not persisted
  deploymentConfirmed: boolean;
  completedAt: string | null;
}

// Persist to localStorage
function saveProgress(state: Partial<OnboardingState>) {
  const current = getProgress();
  const updated = { ...current, ...state };
  localStorage.setItem('onboarding', JSON.stringify(updated));
}

// Also persist to database for cross-device
async function syncProgress(userId: string, state: OnboardingState) {
  await db.upsert(onboardingProgress).values({
    userId,
    ...state,
    updatedAt: new Date(),
  });
}
```

### 7.2 Recovery Flow

```typescript
// On page load, check for incomplete onboarding
function useOnboardingRecovery() {
  useEffect(() => {
    const saved = localStorage.getItem('onboarding');
    if (saved) {
      const state = JSON.parse(saved);
      if (!state.completedAt && state.siteId) {
        // Resume from last step
        router.push(`/onboarding/step-${state.currentStep}`);
      }
    }
  }, []);
}
```

---

## 8. Analytics Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `onboarding_started` | userId, source | Step 1 loaded |
| `onboarding_url_entered` | domain, framework | URL validated |
| `onboarding_analysis_viewed` | siteId, visibilityScore | Step 2 loaded |
| `onboarding_integration_started` | siteId, method | Step 3 loaded |
| `onboarding_code_copied` | siteId, snippet | Copy button clicked |
| `onboarding_api_key_copied` | siteId | Key copied |
| `onboarding_deployment_confirmed` | siteId | Checkbox checked |
| `onboarding_verification_started` | siteId | Step 4 loaded |
| `onboarding_verification_success` | siteId, responseTime | Verification passed |
| `onboarding_verification_failed` | siteId, errorCode | Verification failed |
| `onboarding_completed` | siteId, totalTime | Dashboard reached |
| `onboarding_abandoned` | siteId, lastStep | Session ended mid-wizard |

---

## 9. Error Handling

### 9.1 Network Errors

Show inline error with retry option. Don't lose progress.

### 9.2 Validation Errors

Show below input field with clear message.

### 9.3 Server Errors

Show full-page error with support contact.

### 9.4 Timeout Errors

Show progress indicator with option to continue waiting or retry.

---

## 10. Accessibility

- [ ] All steps keyboard navigable
- [ ] Progress bar has aria-valuenow
- [ ] Code blocks are screen reader friendly
- [ ] Copy success announced
- [ ] Error messages announced
- [ ] Focus managed between steps

---

## 11. Mobile Considerations

- Code snippets scroll horizontally
- Copy buttons easily tappable (44x44 min)
- Screenshots responsive
- Progress bar simplified
- Keyboard doesn't obscure inputs

---

*This specification defines the 4-step onboarding wizard. The goal is < 5 minutes from start to verified integration.*
