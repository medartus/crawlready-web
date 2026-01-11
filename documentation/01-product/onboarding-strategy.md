# CrawlReady Onboarding Strategy

**Last Updated:** January 2026
**Document Owner:** Product Team
**Review Cycle:** Monthly

---

## Executive Summary

This document defines CrawlReady's onboarding strategy, designed to deliver on our core promise: **"Get visible to AI crawlers in 5 minutes."** The strategy prioritizes showing value before asking for configuration, creating an immediate "aha moment" that demonstrates the problem we solve.

---

## Onboarding Philosophy

### The 5-Minute Promise

Our core promise is "Get visible to AI crawlers in 5 minutes." Every onboarding decision must serve this promise. If something adds friction without proportional value, remove it.

**Time Budget Allocation:**
| Step | Target Time | Purpose |
|------|-------------|---------|
| Step 1: Add Website | 30 seconds | Capture domain, create engagement |
| Step 2: See Problem | 30 seconds | Create "aha moment" |
| Step 3: Integrate | 3 minutes | One-time setup |
| Step 4: Verify | 1 minute | Prove it works, celebrate |
| **Total** | **5 minutes** | **Complete setup** |

### Value-First Approach

Show value BEFORE asking for configuration:

1. **User enters their URL** - Minimal friction entry point
2. **We show what AI crawlers currently see** - The problem visualization
3. **We show what they COULD see** - The solution preview
4. **THEN we ask them to integrate** - Motivated action

This inverts the traditional "sign up → configure → maybe see value" flow that kills activation rates.

### Aha Moment Definition

The "aha moment" occurs when a user sees the **side-by-side comparison**:

- **Left Panel:** What users see (beautiful JavaScript app with full content)
- **Right Panel:** What GPTBot sees (blank page or partial content)

This creates visceral understanding of the problem we solve. Users don't need to read documentation or trust our marketing—they SEE the problem with their own site.

**Aha Moment Success Criteria:**
- User expresses surprise ("I had no idea!")
- User immediately wants to fix the problem
- User understands why this matters for AI search

---

## Onboarding Entry Points

### 1. New Sign-Up Flow

```
Landing Page → Sign Up → Create Organization → Onboarding Wizard → Dashboard
```

**Trigger:** User completes Clerk sign-up
**Redirect:** `/onboarding/add-site` (Step 1 of wizard)
**Skip Option:** None for new users (wizard is mandatory)

### 2. Existing User, No Sites

```
Dashboard → Empty State → "Add Your First Site" CTA → Onboarding Wizard
```

**Trigger:** User has organization but no sites configured
**Display:** Empty state with clear CTA and value proposition
**UX:** Cannot access other dashboard features until site is added

### 3. Free Tool Conversion

```
Crawler Checker Results → "Fix This Now" CTA → Sign Up → Onboarding Wizard (pre-filled)
```

**Trigger:** User runs free crawler checker and sees problems
**Advantage:** URL is pre-filled, problem is already visualized
**Conversion Message:** "You're 3 minutes away from fixing this"

### 4. Add Additional Site

```
Dashboard → Sites → "+ Add Site" → Simplified Wizard (Steps 1, 3, 4)
```

**Trigger:** Existing user wants to add another domain
**Simplified:** Skip Step 2 (they already understand the problem)

---

## The 4-Step Onboarding Wizard

### Step 1: Add Your Website

**Target Time:** 30 seconds
**Purpose:** Capture the domain and create immediate engagement

#### UI Elements

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                    🚀 Let's Get Started                                  │
│                                                                          │
│         Enter your website URL to check AI crawler visibility            │
│                                                                          │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ https:// │ your-website.com                            │ [Analyze] │
│    └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                     Detected: Next.js 14 ✓                               │
│                                                                          │
│    ────────────────────────────────────────────────────                  │
│                                                                          │
│    ✓ Works with React, Vue, Next.js, Angular, and more                   │
│    ✓ No code changes to your existing site                               │
│    ✓ See results in under 5 minutes                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

| Element | Specification |
|---------|---------------|
| URL Input | Auto-prepends `https://`, validates URL format |
| Analyze Button | Primary CTA, disabled until valid URL |
| Framework Badge | Auto-detected from response headers/meta tags |
| Loading State | "Analyzing your site..." with progress indicator |

#### Backend Actions

1. Validate URL format and accessibility
2. Create `site` record in database (status: `pending`)
3. Trigger instant analysis (reuse crawler-checker logic)
4. Auto-detect framework from:
   - `x-powered-by` header
   - Meta generator tag
   - Script patterns (React, Vue, Angular signatures)
5. Calculate initial visibility score

#### Success State

- URL validated and accessible ✓
- Framework detected (or "Unknown Framework")
- Site record created in database
- Proceed to Step 2

#### Error States

| Error | Message | Action |
|-------|---------|--------|
| Invalid URL | "Please enter a valid URL (e.g., example.com)" | Focus input |
| Site Unreachable | "We couldn't reach your site. Is it publicly accessible?" | Retry button |
| Timeout (>10s) | "Analysis is taking longer than expected" | Continue anyway option |
| Private IP | "This appears to be a private/internal URL" | Explain requirement |

---

### Step 2: See the Problem

**Target Time:** 30 seconds
**Purpose:** Create the "aha moment" - visual proof of the problem

#### UI Elements

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   Here's what AI crawlers see when they visit your site                  │
│                                                                          │
│   ┌─────────────────────────┐    ┌─────────────────────────┐            │
│   │ What Your Users See     │    │ What AI Crawlers See    │            │
│   ├─────────────────────────┤    ├─────────────────────────┤            │
│   │                         │    │                         │            │
│   │  [Beautiful rendered    │    │  [Blank or minimal      │            │
│   │   React/Vue app with    │    │   content - just        │            │
│   │   full content]         │    │   loading spinner or    │            │
│   │                         │    │   empty divs]           │            │
│   │                         │    │                         │            │
│   └─────────────────────────┘    └─────────────────────────┘            │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  AI Visibility Score: 12/100  ████░░░░░░░░░░░░░░░░              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ❌ GPTBot (ChatGPT)      ❌ ClaudeBot      ❌ PerplexityBot            │
│                                                                          │
│   Issues Found:                                                          │
│   • JavaScript content not rendered (87% of content invisible)           │
│   • Missing meta description                                             │
│   • No structured data detected                                          │
│                                                                          │
│   Your Next.js app appears blank to ChatGPT and other AI assistants.     │
│   Let's fix this in the next 3 minutes.                                  │
│                                                                          │
│                        [Fix This Now →]                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Component Specifications

| Element | Specification |
|---------|---------------|
| User View Panel | Screenshot or sandboxed iframe of live site |
| Crawler View Panel | HTML-only render (JavaScript disabled) |
| Visibility Score | 0-100, color coded (Red < 50, Yellow 50-79, Green 80+) |
| Crawler Badges | Show compatibility with top 3 AI crawlers |
| Issues List | Max 5 most critical issues |

#### Backend Actions

1. Fetch page with JS enabled (Puppeteer/Playwright)
2. Fetch page with JS disabled (simple HTTP request)
3. Calculate visibility score based on:
   - Content parity (JS vs non-JS)
   - Meta tag presence
   - Structured data presence
   - Heading structure
4. Detect specific issues
5. Store analysis results for comparison after setup

#### Visibility Score Calculation

```typescript
function calculateVisibilityScore(analysis: PageAnalysis): number {
  let score = 0;
  
  // Content visibility (50 points max)
  const contentRatio = analysis.nonJsContent.length / analysis.jsContent.length;
  score += Math.min(50, contentRatio * 50);
  
  // Meta tags (20 points max)
  if (analysis.hasMetaTitle) score += 5;
  if (analysis.hasMetaDescription) score += 5;
  if (analysis.hasCanonical) score += 5;
  if (analysis.hasOgTags) score += 5;
  
  // Structured data (15 points max)
  if (analysis.hasJsonLd) score += 10;
  if (analysis.hasSchemaOrg) score += 5;
  
  // Heading structure (15 points max)
  if (analysis.hasH1) score += 5;
  if (analysis.hasProperHeadingHierarchy) score += 10;
  
  return Math.round(score);
}
```

#### Key Messaging Templates

| Scenario | Message |
|----------|---------|
| Score < 20 | "Your {framework} app appears completely blank to AI crawlers" |
| Score 20-50 | "AI crawlers can only see {score}% of your content" |
| Score 50-79 | "Your site is partially visible but missing key elements" |
| Score 80+ | "Your site has good visibility! Let's make it even better" |

---

### Step 3: Integrate

**Target Time:** 3 minutes
**Purpose:** Guide user through one-time setup

#### UI Elements

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   Step 3 of 4: Add CrawlReady to Your Project                           │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ Integration Method                                               │   │
│   │                                                                  │   │
│   │   ● Middleware (Recommended for Next.js)                         │   │
│   │   ○ DNS/Proxy                                                    │   │
│   │   ○ API Direct                                                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   1. Create middleware.ts in your project root:                          │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ // middleware.ts                                    [Copy All]   │   │
│   │                                                                  │   │
│   │ import { NextResponse } from 'next/server';                      │   │
│   │ import type { NextRequest } from 'next/server';                  │   │
│   │                                                                  │   │
│   │ const AI_BOTS = [/GPTBot/i, /ClaudeBot/i, /PerplexityBot/i];    │   │
│   │                                                                  │   │
│   │ export async function middleware(req: NextRequest) {             │   │
│   │   const ua = req.headers.get('user-agent') || '';                │   │
│   │   if (!AI_BOTS.some(p => p.test(ua))) return NextResponse.next();│   │
│   │   ...                                                            │   │
│   │ }                                                                │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   2. Add to your environment variables:                                  │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │ CRAWLREADY_API_KEY=cr_live_aBcDeFgHiJkLmNoPqRsT    [Copy]        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ⚠️ Save this key now - you won't see it again!                         │
│                                                                          │
│   3. Deploy your changes                                                 │
│                                                                          │
│   ☐ I've added the code and deployed                                     │
│                                                                          │
│   Need help? [View detailed guide] [Watch video tutorial]                │
│                                                                          │
│                        [← Back]    [Verify Integration →]                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Integration Methods

| Method | Best For | Complexity |
|--------|----------|------------|
| **Middleware** | Next.js, Express, Fastify | Low - Copy/paste code |
| **DNS/Proxy** | Static sites, platforms without middleware | Medium - DNS configuration |
| **API Direct** | Custom implementations, edge cases | High - Custom code |

#### Framework-Specific Code Snippets

**Next.js (App Router) - Primary:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AI_BOT_PATTERNS = [
  /GPTBot/i, /ChatGPT-User/i, /OAI-SearchBot/i,
  /ClaudeBot/i, /Claude-Web/i, /anthropic-ai/i,
  /PerplexityBot/i, /Google-Extended/i,
];

export async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  
  if (!AI_BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
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
        headers: { 'Content-Type': 'text/html', 'X-Served-By': 'CrawlReady' },
      });
    }
  } catch (error) {
    console.error('[CrawlReady] Error:', error);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$).*)'],
};
```

**Express.js:**
```javascript
const AI_BOT_PATTERNS = [/GPTBot/i, /ClaudeBot/i, /PerplexityBot/i];

app.use(async (req, res, next) => {
  const ua = req.get('user-agent') || '';
  if (!AI_BOT_PATTERNS.some(p => p.test(ua))) return next();
  
  try {
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRAWLREADY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: `${req.protocol}://${req.get('host')}${req.originalUrl}` }),
    });
    
    if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
      res.set('Content-Type', 'text/html');
      return res.send(await response.text());
    }
  } catch (error) {
    console.error('[CrawlReady]', error);
  }
  next();
});
```

#### API Key Generation

- Auto-generated when user reaches Step 3
- Format: `cr_live_` + 32 random characters
- Linked to the site being configured
- Shown once with copy button
- Warning about saving the key

#### Deployment Confirmation

- Checkbox: "I've added the code and deployed"
- Required to proceed to Step 4
- Help links for common deployment platforms

---

### Step 4: Verify & Celebrate

**Target Time:** 1 minute
**Purpose:** Prove integration works, create success moment

#### UI Elements - Testing State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   Step 4 of 4: Verify Your Integration                                   │
│                                                                          │
│                         🔍                                               │
│                                                                          │
│                Testing your integration...                               │
│                                                                          │
│                [████████████░░░░░░░░]  60%                               │
│                                                                          │
│                Sending test request to your site                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### UI Elements - Success State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                         🎉                                               │
│                                                                          │
│              Your Site is Now Visible to AI Crawlers!                    │
│                                                                          │
│   ┌─────────────────────────┐    ┌─────────────────────────┐            │
│   │ Before                  │    │ After                   │            │
│   ├─────────────────────────┤    ├─────────────────────────┤            │
│   │ Visibility: 12/100      │    │ Visibility: 100/100     │            │
│   │ ❌ GPTBot               │    │ ✅ GPTBot               │            │
│   │ ❌ ClaudeBot            │    │ ✅ ClaudeBot            │            │
│   │ ❌ PerplexityBot        │    │ ✅ PerplexityBot        │            │
│   └─────────────────────────┘    └─────────────────────────┘            │
│                                                                          │
│   ✓ First render completed in 145ms                                      │
│   ✓ Content fully rendered                                               │
│   ✓ All AI crawlers can now see your site                                │
│                                                                          │
│   What's Next:                                                           │
│   • AI crawlers typically visit within 7 days                            │
│   • We'll notify you when they do                                        │
│   • Monitor activity in your dashboard                                   │
│                                                                          │
│                      [Go to Dashboard →]                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### UI Elements - Failure State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                         ⚠️                                               │
│                                                                          │
│              We Couldn't Verify Your Integration                         │
│                                                                          │
│   Common Issues:                                                         │
│                                                                          │
│   ☐ Middleware file not in project root                                  │
│   ☐ Environment variable not set                                         │
│   ☐ Changes not deployed yet                                             │
│   ☐ Middleware not matching routes                                       │
│                                                                          │
│   Troubleshooting Steps:                                                 │
│   1. Verify middleware.ts is in your project root                        │
│   2. Check CRAWLREADY_API_KEY is in .env.local                           │
│   3. Redeploy your application                                           │
│   4. Try the test again                                                  │
│                                                                          │
│            [Try Again]    [Skip for Now]    [Get Help]                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Backend Actions

1. Make actual render request to user's site
2. Check response headers for CrawlReady signature (`X-Served-By: CrawlReady`)
3. Verify HTML content is rendered (not blank)
4. Update site status to `connected`
5. Calculate new visibility score
6. Record successful verification timestamp

#### Verification Logic

```typescript
async function verifyIntegration(siteId: string, domain: string): Promise<VerificationResult> {
  const testUrl = `https://${domain}/`;
  
  try {
    const response = await fetch('https://api.crawlready.com/api/render', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${internalServiceKey}`,
        'Content-Type': 'application/json',
        'X-Verification-Request': 'true',
      },
      body: JSON.stringify({ url: testUrl }),
    });
    
    const servedBy = response.headers.get('x-served-by');
    const cacheStatus = response.headers.get('x-cache');
    
    if (response.ok && servedBy === 'CrawlReady') {
      const html = await response.text();
      const hasContent = html.length > 1000; // Basic content check
      
      if (hasContent) {
        return {
          success: true,
          responseTime: /* measured */,
          cacheStatus,
          newVisibilityScore: 100,
        };
      }
    }
    
    return {
      success: false,
      error: 'INTEGRATION_NOT_DETECTED',
      suggestion: 'Check that middleware is deployed and API key is correct',
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'REQUEST_FAILED',
      suggestion: 'Your site may not be accessible. Check deployment status.',
    };
  }
}
```

#### Success Celebration

- Confetti animation (subtle, not overwhelming)
- Before/After comparison showing improvement
- Clear "what happens next" messaging
- Strong CTA to dashboard

---

## Post-Onboarding Experience

### Immediate Actions

1. **Redirect to Dashboard Overview** - Not empty state, shows new site
2. **Show "Setup Complete" toast** - Positive reinforcement
3. **Highlight crawler activity section** - Sets expectation for what to watch

### Automated Follow-Up

| Trigger | Action | Timing |
|---------|--------|--------|
| First crawler visit | Email + in-app notification | Real-time |
| No activity after 7 days | Proactive email with suggestions | Day 7 |
| Weekly digest | Summary of crawler activity | Every Monday |
| High cache hit rate achieved | Celebration email | When >80% for 7 days |

### Email Templates

**First Crawler Visit:**
```
Subject: 🎉 GPTBot just visited your site!

Great news! Your first AI crawler visit happened:

🤖 GPTBot (ChatGPT) visited /pricing
📅 Today at 2:34 PM
✓ Served pre-rendered content successfully

This means ChatGPT can now see and understand your content.
Expect more visits as AI crawlers continue indexing your site.

[View Activity in Dashboard →]
```

**No Activity After 7 Days:**
```
Subject: Still waiting for AI crawlers?

It's been 7 days since you set up mysite.com on CrawlReady,
and we haven't detected any AI crawler visits yet.

This is normal - crawlers visit on their own schedule. Here's
what you can do to speed things up:

1. Submit your sitemap to search engines
2. Share your content on social media
3. Use our Test Render tool to verify your setup

[Test Your Setup Now →]

Questions? Reply to this email - we're here to help.
```

---

## Success Metrics

### Onboarding Funnel

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Wizard Start Rate | 90% | Users who start wizard / Total signups |
| Step 1 → Step 2 | 95% | Successful URL analysis |
| Step 2 → Step 3 | 90% | Users who proceed after seeing problem |
| Step 3 → Step 4 | 80% | Users who attempt verification |
| Verification Success | 80% | Successful verifications / Attempts |
| **Overall Completion** | **70%** | Users who finish wizard / Started |

### Time Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Median Time to Complete | < 5 min | Timestamp difference |
| 90th Percentile | < 10 min | For slower users |
| Abandon Rate per Step | < 10% | Drop-off tracking |

### Activation Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Day-1 Return Rate | 50% | Return within 24 hours |
| First Crawler Activity | < 7 days | Time until first real visit |
| Week-1 Dashboard Visits | 3+ | Average visits per user |

---

## Error Recovery

### Abandoned Wizard

**Detection:** User closes browser or navigates away mid-wizard

**Recovery:**
1. Save progress at each step (database + localStorage)
2. Show "Continue Setup" banner on dashboard
3. Email reminder after 24 hours with direct link
4. Track abandonment point for improvement

**Dashboard Banner:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Your setup isn't complete. AI crawlers can't see your site yet.      │
│    [Continue Setup →]                                            [✕]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Failed Verification

**Common Causes:**
1. Middleware file in wrong location
2. Environment variable not set or deployed
3. Route matcher excluding the test URL
4. Deployment not complete

**Recovery Options:**
1. Detailed troubleshooting checklist
2. "Test Again" button (unlimited retries)
3. "Skip for Now" option (marks setup incomplete)
4. Live chat support trigger

### No Crawler Activity After 7 Days

**Actions:**
1. Proactive email with suggestions
2. Dashboard alert with actionable steps
3. Offer manual cache warming
4. Check if integration is still working

---

## A/B Testing Plan

### Tests to Run

| Test | Hypothesis | Metrics |
|------|------------|---------|
| Skip Step 2 for returning users | Faster completion without value loss | Completion rate, time |
| Video vs text instructions | Video may be clearer | Step 3 success rate |
| API key visibility duration | Longer visibility reduces support | Key copy rate, support tickets |
| Celebration intensity | More celebration = higher satisfaction | NPS, return rate |

### Instrumentation

Track these events:
- `onboarding_started`
- `onboarding_step_completed` (with step number)
- `onboarding_step_error` (with error type)
- `onboarding_abandoned` (with last step)
- `onboarding_completed`
- `onboarding_verification_success`
- `onboarding_verification_failed`

---

## Implementation Checklist

### Phase 1: Core Wizard (Week 1-2)

- [ ] Create wizard page structure (`/onboarding/[step]`)
- [ ] Implement Step 1: URL input and analysis
- [ ] Implement Step 2: Problem visualization
- [ ] Implement Step 3: Integration instructions
- [ ] Implement Step 4: Verification
- [ ] Add progress persistence (database + localStorage)
- [ ] Add error handling and recovery

### Phase 2: Polish (Week 3)

- [ ] Add framework detection
- [ ] Create code snippets for all frameworks
- [ ] Implement celebration animation
- [ ] Add email triggers
- [ ] Add dashboard banner for incomplete setup

### Phase 3: Optimization (Ongoing)

- [ ] Set up funnel analytics
- [ ] Implement A/B testing framework
- [ ] Monitor and iterate based on data

---

## Related Documents

- [MVP Definition](./mvp-definition.md) - Onboarding is P0
- [Product Strategy](./product-strategy.md) - Time-to-Value metrics
- [Onboarding Wizard Spec](../04-technical/specs/onboarding-wizard-functional.md) - Technical spec
- [Integration Guide](../04-technical/specs/integration-guide.md) - Detailed integration docs

---

*This document guides all onboarding decisions. When in doubt, ask: "Does this help users see value in under 5 minutes?"*
