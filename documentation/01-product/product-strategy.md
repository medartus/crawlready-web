# CrawlReady Product Strategy

**Last Updated:** January 2026
**Document Owner:** Product Team
**Review Cycle:** Quarterly

---

## Product Vision

**"The essential infrastructure layer for AI search visibility."**

We envision a world where every website—regardless of technology—can be discovered, understood, and cited by AI platforms.

---

## Product Mission

**"Make JavaScript websites visible to AI crawlers in 5 minutes."**

We accomplish this by:
- Detecting AI crawlers automatically
- Rendering JavaScript content instantly
- **[Planned]** Tracking AI citations in real-time
- **[Planned]** Optimizing content for LLM comprehension

> **Current State (January 2026):** We have infrastructure for AI crawler detection and JavaScript rendering. Citation tracking and content optimization are key differentiators planned for Phase 2.

---

## Product Principles

### 1. Developer Experience Above All

**What This Means:**
- 5-minute setup (one line of code)
- Comprehensive, searchable documentation
- Open-source SDKs for every major language
- API-first with webhooks
- Clear error messages

**Test:** Can a developer go from signup to first render in under 5 minutes without help?

### 2. AI-First, Not SEO-First

**What This Means:**
- Every feature designed for AI crawlers
- LLM comprehension over search engine optimization
- Citation tracking, not just ranking
- Schema optimized for AI understanding

**Test:** Does this feature help content appear in AI answers?

### 3. Performance is a Feature

**What This Means:**
- <200ms render speed (non-negotiable)
- 99.97% uptime SLA
- 70%+ cache hit rate
- Global edge distribution

**Test:** Is this faster than competitors?

### 4. Radical Transparency

**What This Means:**
- Public status page
- Real-time usage dashboards
- Clear pricing (no hidden fees)
- Honest about limitations

**Test:** Would we be embarrassed if a customer saw this metric?

### 5. Build Moats, Not Parity

**What This Means:**
- Unique features competitors can't easily copy
- Citation tracking (requires LLM expertise)
- Schema injection (requires AI knowledge)
- Deep analytics (requires specialized detection)

**Test:** Can Prerender.io ship this in 3 months?

---

## Core Value Proposition

### For Technical Founders
> "Get your JavaScript site visible to ChatGPT in 5 minutes—no rebuild required."

### For VP Marketing
> "Track when AI platforms cite your competitors instead of you."

### For E-commerce
> "Get your products recommended in AI shopping answers."

---

## Product Architecture

### System Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Gateway** | Request routing, crawler detection | Express, Node.js |
| **Render Workers** | Headless Chrome rendering | Puppeteer, Playwright |
| **Cache Layer** | Response caching | Redis, CloudFlare |
| **Analytics** | Usage tracking, citation monitoring | PostgreSQL, TimescaleDB |
| **Dashboard** | Customer-facing UI | Next.js, React |
| **API** | Programmatic access | REST, GraphQL |

### Crawler Detection

**Detected AI Crawlers (15+):**
| Crawler | Platform | Priority |
|---------|----------|----------|
| GPTBot | OpenAI/ChatGPT | P0 |
| OAI-SearchBot | ChatGPT Search | P0 |
| ChatGPT-User | ChatGPT Live | P0 |
| ClaudeBot | Anthropic | P0 |
| PerplexityBot | Perplexity | P0 |
| Google-Extended | Gemini | P1 |
| CCBot | Common Crawl | P1 |
| Applebot-Extended | Apple AI | P1 |
| Bytespider | TikTok AI | P2 |
| Meta-ExternalAgent | Meta AI | P2 |

### Rendering Pipeline

```
1. Request received
2. Crawler detection (user-agent + behavioral)
3. Cache check (Redis)
   └── Cache hit → Return cached HTML
   └── Cache miss → Continue
4. Queue render job (BullMQ)
5. Render with Puppeteer
   └── Wait for network idle
   └── Execute JavaScript
   └── Extract HTML
6. Post-processing
   └── Schema injection
   └── Metadata optimization
7. Cache response (TTL based on plan)
8. Return HTML to crawler
```

---

## Feature Categories

### Core Features (Table Stakes) - MVP

| Feature | Description | Status | Built? |
|---------|-------------|--------|--------|
| Crawler Detection | Identify 15+ AI crawlers | MVP | ✅ In Progress |
| JavaScript Rendering | <200ms headless Chrome | MVP | ✅ In Progress |
| Smart Caching | Redis + CDN layer | MVP | ✅ In Progress |
| Usage Analytics | Render counts, cache hits | MVP | ✅ In Progress |
| API Access | REST API for programmatic use | MVP | 🔜 Planned |

### Onboarding & Activation Features - MVP (NEW)

| Feature | Description | Status | Built? |
|---------|-------------|--------|--------|
| **4-Step Wizard** | Guided setup in < 5 minutes | MVP | 🔜 Planned |
| **Problem Visualization** | Side-by-side crawler view comparison | MVP | 🔜 Planned |
| **Framework Detection** | Auto-detect Next.js, React, Vue, etc. | MVP | 🔜 Planned |
| **Integration Verification** | Automated test with retry | MVP | 🔜 Planned |
| **Dashboard Overview** | At-a-glance health & activity | MVP | 🔜 Planned |
| **Sites Management** | Multi-domain configuration | MVP | 🔜 Planned |
| **Test Render Tool** | Preview what crawlers see | MVP | 🔜 Planned |
| **Crawler Activity Feed** | Real-time crawler visit log | MVP | 🔜 Planned |

> **Rationale:** These features directly impact Time-to-Value metrics. A user who doesn't complete setup quickly is unlikely to convert.

### Differentiation Features (Moat) - Phase 2+

> **Important:** These features are our key differentiators but are **not yet built**. They are planned for Phase 2.

| Feature | Description | Status | Built? |
|---------|-------------|--------|--------|
| AI Citation Tracking | Monitor ChatGPT/Perplexity citations | Growth | ❌ **Planned** |
| LLM Schema Injection | Auto-add FAQ, HowTo, Article schemas | Growth | ❌ **Planned** |
| Visual Diff Tool | See crawler vs user view | Growth | ❌ **Planned** |
| Competitor Tracking | Compare citations vs competitors | Scale | ❌ **Planned** |
| Content Optimization Guidance | Help users optimize for AI comprehension | Growth | ❌ **Planned** |

### Platform Features (Scale)

| Feature | Description | Status | Built? |
|---------|-------------|--------|--------|
| Dashboard | Real-time analytics UI | MVP | ✅ In Progress |
| Webhooks | Event notifications | MVP | 🔜 Planned |
| Multi-Domain | Multiple sites per account | Growth | 🔜 Planned |
| Team Management | Invite team members | Growth (basic in MVP) | 🔜 Planned |
| White-Label | Agency branding | Scale | ❌ **Blocked** (needs demand validation) |
| Integrations | Vercel, Netlify | Scale | 🔜 Planned |

### Dashboard Navigation Structure

**Current Navigation:**
```
Home | API Keys | Usage | Pages | Members | Settings
```

**New Navigation (MVP):**
```
Overview | Sites | Pages | Analytics | Settings
```

| Section | Purpose |
|---------|---------|
| Overview | At-a-glance health, activity feed, quick stats |
| Sites | Add/manage domains, configure settings |
| Pages | Browse rendered pages, cache management |
| Analytics | Usage metrics, trends, insights |
| Settings | Profile, Team Members, API Keys, Billing, Notifications |

---

## Success Metrics

### Product Health

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Render Speed | <200ms p95 | Performance promise |
| Uptime | 99.97% | Reliability |
| Cache Hit Rate | 70%+ | Cost efficiency |
| Error Rate | <0.1% | Quality |

### Time-to-Value Metrics (NEW)

These metrics measure how quickly users realize value from CrawlReady. They are critical to our "5-minute promise."

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Wizard Completion Rate** | **70%+** | Users who complete setup / Started |
| **Median Time to Complete** | **< 5 min** | 5-minute promise delivery |
| **Time to First Render** | **< 5 min** | First value realization |
| **Verification Success Rate** | **80%+** | Integration works on first try |
| **Day-1 Return Rate** | **50%+** | Users return within 24 hours |
| **First Crawler Activity** | **< 7 days** | Real-world value confirmation |

**Funnel Breakdown:**
| Step | Target | Calculation |
|------|--------|-------------|
| Step 1 → Step 2 | 95% | URL analysis succeeds |
| Step 2 → Step 3 | 90% | User proceeds after seeing problem |
| Step 3 → Step 4 | 80% | User attempts verification |
| Step 4 → Complete | 88% | Verification succeeds (80% of 80%) |
| **Overall** | **70%** | End-to-end completion |

### User Success

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Activation Rate | 40%+ | Trial effectiveness |
| Feature Adoption | 60%+ | Value realization |
| NPS | 50+ | Customer satisfaction |

### Business Impact

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Trial→Paid | 12%+ | Conversion |
| Monthly Churn | <5% | Retention |
| NRR | 110%+ | Expansion |
| Support Tickets/User | <0.5/mo | Product quality |

---

## Technical Decisions

### Why Puppeteer (Not Playwright)

| Factor | Puppeteer | Playwright |
|--------|-----------|------------|
| Ecosystem | More mature | Growing |
| Chrome Support | Native | Excellent |
| Bundle Size | Smaller | Larger |
| Lambda Compat | Proven | Needs work |
| **Decision** | **Selected** | Evaluate later |

### Why Redis (Not Memcached)

| Factor | Redis | Memcached |
|--------|-------|-----------|
| Data Structures | Rich | Basic |
| Persistence | Yes | No |
| Pub/Sub | Yes | No |
| Upstash | Serverless | No option |
| **Decision** | **Selected** | - |

### Why Vercel (Not AWS)

| Factor | Vercel | AWS |
|--------|--------|-----|
| DX | Excellent | Complex |
| Next.js | Native | Manual |
| Cost (Early) | Lower | Variable |
| Scale | Growing | Proven |
| **Decision** | **Selected** | Migrate if needed |

---

## Product Roadmap Summary

### Phase 1: Foundation (MVP)
- Core rendering engine
- **4-step onboarding wizard** (5-minute promise)
- **Dashboard Overview with health score**
- **Sites management & test render tool**
- **Crawler activity feed**
- Basic analytics
- Stripe integration
- Basic team support (1-2 members)

### Phase 2: Growth
- Citation tracking
- Schema injection
- Advanced analytics
- Multi-domain support
- Full team management
- **Content Optimization Guidance**

### Phase 3: Scale
- Enterprise features
- Platform integrations (Vercel, Netlify)
- Advanced AI features

> **Note:** White-label/Agency features and E-commerce integrations (Shopify, WordPress) are **not planned** until we have validated demand.

*See [Feature Roadmap](./feature-roadmap.md) for details.*

---

## Content Optimization Guidance (Planned Feature)

### The Gap

Currently, CrawlReady focuses on **making content visible** to AI crawlers through JavaScript rendering. However, visibility alone doesn't guarantee AI platforms will **understand, cite, or recommend** the content.

Users need guidance on **how to optimize their content** for better AI comprehension—not just rendering.

### Proposed Approach

#### Phase 2A: Passive Analysis & Recommendations

**What:** Analyze rendered pages and provide actionable recommendations.

| Analysis Area | What We Check | Recommendation Example |
|--------------|---------------|------------------------|
| **Content Structure** | Heading hierarchy, paragraph length, content organization | "Your page lacks clear H2/H3 structure. AI models use headings to understand content hierarchy." |
| **Schema Markup** | Missing or incomplete structured data | "Add FAQ schema to your /pricing page. Pages with FAQ schema are 2.3x more likely to be cited." |
| **Answer-Ready Content** | Does content directly answer common questions? | "Consider adding a direct answer to 'What is [product]?' in the first paragraph." |
| **Readability** | Complex sentences, jargon, passive voice | "Simplify sentences in section 3. AI models prefer clear, direct language." |
| **Entity Clarity** | Are key entities (brand, product, concepts) clearly defined? | "Define 'CrawlReady' explicitly on this page. AI models need clear entity definitions." |

**Implementation:**
1. Run analysis post-render as background job
2. Store recommendations in database
3. Display in dashboard with severity levels (Critical/Important/Suggestion)
4. Provide "AI Readiness Score" per page

#### Phase 2B: Schema Injection (Automated)

**What:** Automatically inject structured data based on content analysis.

| Content Type | Auto-Detected Schema | Value |
|-------------|---------------------|-------|
| FAQ sections | FAQPage schema | Higher likelihood of appearing in AI Q&A |
| How-to guides | HowTo schema | Step-by-step instructions for AI assistants |
| Product pages | Product schema | Product recommendations in AI shopping |
| Articles/Blog | Article schema | News/content citations |
| Company info | Organization schema | Brand knowledge in AI models |

**User Control:**
- Enable/disable auto-injection per domain
- Preview injected schema before going live
- Override detected schema with custom markup

#### Phase 3: Content Recommendations (AI-Powered)

**What:** Use AI to suggest content improvements based on:
- What AI models are being asked about in your industry
- Gap analysis: Topics your competitors are cited for that you're not
- Trending questions in your domain

**Example Output:**
> "Users are asking AI about 'JavaScript rendering for SEO' but your content doesn't address this. Consider adding a page targeting this topic."

### Success Metrics for Content Optimization

| Metric | Target | How Measured |
|--------|--------|--------------|
| AI Readiness Score adoption | 60%+ of users check score | Dashboard analytics |
| Recommendation implementation | 30%+ of critical recommendations implemented | Before/after page analysis |
| Citation improvement | 20%+ lift in citations for optimized pages | Citation tracking (Phase 2) |

### Why This Matters

1. **Completes the value chain:** Render → Analyze → Optimize → Track Citations
2. **Deepens moat:** Competitors can copy rendering; content intelligence is harder
3. **Increases stickiness:** Users return to dashboard for ongoing optimization
4. **Aligns with vision:** "Thrive in AI search" requires more than just visibility

---

## Competitive Product Analysis

### vs Prerender.io

| Dimension | CrawlReady | Prerender.io |
|-----------|-----------|--------------|
| Focus | AI crawlers | SEO (Google) |
| Citation Tracking | **Planned (Phase 2)** | No |
| Schema Injection | **Planned (Phase 2)** | No |
| Render Speed | <200ms | ~300ms |
| Price | $49/mo | $49/mo |
| Overages | $0.50/1K | $0.75-1.50/1K |

> **Honest Assessment:** At MVP launch, our differentiation is positioning (AI-first vs SEO-first) and price parity with better focus. Feature moats (citation tracking, schema injection) will be built in Phase 2.

### Product Moat (Planned Differentiators)

What competitors can't easily replicate (planned for Phase 2+):

1. **AI Citation Tracking** - Requires LLM API integration, parsing, ongoing costs *(Planned: Phase 2)*
2. **LLM Schema Injection** - Requires AI/ML expertise for content analysis *(Planned: Phase 2)*
3. **AI Crawler Behavioral Analytics** - Requires specialized detection algorithms *(Planned: Phase 2)*
4. **Content Optimization Guidance** - Actionable recommendations to improve AI comprehension *(Planned: Phase 2)*
5. **AI-First Positioning** - Requires repositioning entire brand *(Active now)*

> **Current Competitive Advantage:** AI-first positioning and focus on AI crawlers (vs. SEO-first competitors). Feature moats will be built in Phase 2.

---

## Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Render failures on complex JS | Medium | High | Extensive testing, fallbacks |
| AI crawlers start rendering JS | Low | High | Build value beyond rendering |
| Prerender.io copies features | High | Medium | Move faster, deeper moat |
| Scale issues | Medium | Medium | Proven architecture, gradual scaling |

---

*Product strategy reviewed quarterly. Major changes require leadership approval.*
