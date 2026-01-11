# CrawlReady Feature Roadmap

**Last Updated:** January 2026
**Document Owner:** Product Team
**Review Cycle:** Monthly

---

## Roadmap Philosophy

### Minimal Lovable Product (MLP)
We don't build minimum viable products. We build the smallest product that users will love and pay for.

### Prioritization Framework: ICE
- **Impact:** How much value does this create?
- **Confidence:** How sure are we this will work?
- **Ease:** How quickly can we ship it?

**Score:** (Impact × Confidence × Ease) / 3

### Release Cadence
- **Major Features:** Monthly
- **Improvements:** Weekly
- **Bug Fixes:** Daily as needed

### Strategic Principles
- **JS-First Focus:** We exclusively target JavaScript-powered applications (React, Vue, Angular, Next.js, etc.) until we have business-value features beyond rendering (like AI Citation analytics)
- **Validate Before Building:** Features requiring new personas (agencies, e-commerce) require customer signals before development
- **Architecture for Flexibility:** System design should not block future expansion even if features aren't planned

---

## Current State

### What's Built
| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | Live | Converting visitors |
| Waitlist | Live | Collecting interest |
| Core Rendering Engine | In Progress | Puppeteer-based |
| Dashboard v1 | In Progress | Basic analytics |
| Authentication | Complete | Clerk integration |
| Payments | Complete | Stripe integration |

### What's NOT Built Yet
| Feature | Status | Notes |
|---------|--------|-------|
| AI Citation Tracking | **Planned (Phase 2)** | Key differentiator, not yet implemented |
| Schema Injection | **Planned (Phase 2)** | Requires rendering engine first |

### Technical Foundation
- Next.js 14 (App Router)
- Supabase (Database)
- Clerk (Auth)
- Stripe (Payments)
- Vercel (Hosting)

---

## Phase 1: Foundation (Months 1-3)

**Goal:** Launch MVP with core rendering, get first 50 paying customers.

### Must-Have Features (P0)

| Feature | Description | ICE | Target |
|---------|-------------|-----|--------|
| **Crawler Detection** | Detect 15+ AI crawlers | 9.0 | Month 1 |
| **Rendering Engine** | <200ms Puppeteer rendering | 9.0 | Month 1 |
| **Cache Layer** | Redis + CloudFlare caching | 8.5 | Month 1 |
| **Dashboard v1** | Usage analytics, site management | 8.0 | Month 2 |
| **API v1** | REST endpoints for renders | 7.5 | Month 2 |
| **Webhook v1** | Event notifications | 7.0 | Month 2 |
| **Free Tier** | 1,000 renders/month | 8.0 | Month 2 |
| **Paid Plans** | Starter/Growth/Scale tiers | 9.0 | Month 2 |
| **Docs v1** | Setup guides, API reference | 8.5 | Month 3 |

### Nice-to-Have (P1)

| Feature | Description | ICE | Notes |
|---------|-------------|-----|-------|
| Status Page | Public uptime metrics | 6.5 | Instills trust |
| Error Alerts | Email on render failures | 6.0 | Proactive support |
| Multi-Domain | 3+ domains per account | 5.5 | Growth tier feature |
| **Basic Team Support** | Invite 1-2 team members | 6.5 | Primary persona works in 5-30 person teams |

### Phase 1 Success Criteria
- [ ] 50+ paying customers
- [ ] $3K+ MRR
- [ ] <200ms p95 render speed
- [ ] 99.9%+ uptime
- [ ] <5 min time-to-first-render

---

## Phase 2: Growth (Months 4-6)

**Goal:** Add AI-specific differentiation, reach 150 customers.

### AI Citation Tracking (P0)

| Feature | Description | ICE |
|---------|-------------|-----|
| Daily Citation Checks | Query ChatGPT/Perplexity for brand | 9.0 |
| Citation Dashboard | Visualize citation history | 8.5 |
| Competitor Comparison | Track vs competitors | 8.0 |
| Citation Alerts | Email when cited | 7.5 |

### LLM Schema Injection (P0)

| Feature | Description | ICE |
|---------|-------------|-----|
| FAQ Schema | Auto-detect and inject FAQ | 8.0 |
| HowTo Schema | Tutorial/guide schemas | 7.5 |
| Article Schema | Blog post optimization | 7.5 |
| Product Schema | E-commerce optimization | 7.0 |

### Platform Features (P1)

| Feature | Description | ICE |
|---------|-------------|-----|
| Advanced Analytics | Crawler patterns, trends | 7.0 |
| Multi-Domain | Unlimited domains (Scale tier) | 6.5 |
| **Full Team Management** | Roles, permissions, unlimited members | 7.0 |
| Audit Logs | Activity history | 5.5 |

> **Note:** Basic team support (1-2 members) should be available in Phase 1. Full team management with roles and permissions expands in Phase 2.

### Phase 2 Success Criteria
- [ ] 150+ paying customers
- [ ] $10K+ MRR
- [ ] Citation tracking live
- [ ] Schema injection working
- [ ] First enterprise customer

---

## Phase 3: Scale (Months 7-12)

**Goal:** Enterprise features, platform integrations, 300+ customers.

### Enterprise Features (P0)

| Feature | Description | ICE |
|---------|-------------|-----|
| SSO/SAML | Enterprise authentication | 7.0 |
| Custom SLAs | 99.99% uptime option | 6.5 |
| Dedicated Support | Named account manager | 6.0 |
| Custom Contracts | Annual billing, custom terms | 6.0 |
| SOC-2 Compliance | Security certification | 7.5 |

### Platform Integrations (P0)

| Feature | Description | ICE | Notes |
|---------|-------------|-----|-------|
| Vercel Integration | One-click from Vercel | 8.0 | Primary target: JS apps |
| Netlify Integration | One-click from Netlify | 7.5 | Primary target: JS apps |

### Platform Integrations - Conditional (P2)

> **Strategic Note:** E-commerce and WordPress integrations are **not planned** until we have:
> 1. Clear customer signals from these markets
> 2. Business-value features beyond rendering (AI Citation Analytics, Content Optimization)
> 
> Our core value prop (JS rendering) has limited value for server-rendered platforms.

| Feature | Description | ICE | Prerequisite |
|---------|-------------|-----|--------------|
| Shopify App | E-commerce focus | 7.0 | First e-commerce customers, AI Citation Analytics live |
| WordPress Plugin | JS-heavy WordPress sites only | 5.0 | AI Citation Analytics + Content Optimization live |

### Advanced AI Features (P1)

| Feature | Description | ICE |
|---------|-------------|-----|
| Visual Diff Tool | See crawler vs user view | 7.0 |
| Prompt Simulator | Test AI answers | 6.5 |
| Content Recommendations | AI-powered suggestions | 6.0 |

### Features Requiring Clarification ⚠️

> The following features need clearer problem definition before prioritization. They are **parked** until we validate the use case with customers.

| Feature | Current Description | Questions to Answer |
|---------|---------------------|---------------------|
| **Predictive Crawling** | Forecast crawler visits | What action can users take based on predictions? Is there a business value beyond "interesting data"? What pain point does this solve? |
| **A/B Testing Renders** | Test different render configurations | What scenarios require A/B testing renders? Is this for debugging, optimization, or something else? Who would use this and why? |
| **Custom User-Agents** | Allow custom user-agent strings | Why would users need this? What's the use case beyond our default crawler detection? Is this an edge case or common need? |

### White-Label / Agency (P2) - Conditional

> **Strategic Position:** We will **NOT** build white-label features until we have clear, validated demand from agencies.
> 
> **Current Approach:**
> - ✅ Landing page / interest capture only (if demand signals emerge)
> - ✅ Architecture should accommodate multi-tenant/white-label to not block future development
> - ❌ No product development until validated customer need
> - ❌ No dedicated agency sales or marketing

| Feature | Description | ICE | Status |
|---------|-------------|-----|--------|
| Agency Branding | Custom branding | 5.5 | **Blocked** - awaiting demand validation |
| Reseller Program | Revenue sharing | 5.0 | **Blocked** - awaiting demand validation |
| API Whitelisting | Private label API | 5.0 | **Blocked** - awaiting demand validation |

### Phase 3 Success Criteria
- [ ] 300+ paying customers
- [ ] $25K+ MRR
- [ ] 3+ platform integrations
- [ ] 5+ enterprise customers
- [ ] SOC-2 in progress

---

## Long-Term Vision (Year 2+)

### AI Visibility Platform
- Full-stack AI search optimization
- Content intelligence
- Automated optimization
- Multi-language support

### Ecosystem
- Developer marketplace
- Partner integrations
- Open-source tools
- Community contributions

### Global Expansion
- EU data residency
- Asia-Pacific presence
- Multi-language dashboard
- Local payment methods

---

## Feature Backlog (Prioritized)

### High Priority (Next Up)

| # | Feature | Category | ICE | Notes |
|---|---------|----------|-----|-------|
| 1 | Render speed optimization | Core | 9.0 | |
| 2 | Citation tracking v1 | Differentiation | 9.0 | **Key differentiator** |
| 3 | Advanced cache rules | Core | 8.5 | |
| 4 | Schema injection v1 | Differentiation | 8.5 | |
| 5 | Slack integration | Platform | 8.0 | |
| 6 | Basic team support | Platform | 7.5 | Enable 1-2 team members early |

### Medium Priority (Soon)

| # | Feature | Category | ICE | Notes |
|---|---------|----------|-----|-------|
| 7 | GraphQL API | Platform | 7.5 | |
| 8 | Bulk operations | Platform | 6.5 | |
| 9 | Data export | Platform | 6.5 | |
| 10 | Full team management | Platform | 7.0 | Roles, permissions |

### Lower Priority (Later)

| # | Feature | Category | ICE | Notes |
|---|---------|----------|-----|-------|
| 11 | AI content scoring | Advanced | 5.5 | |
| 12 | Competitive alerts | Advanced | 5.0 | |
| 13 | Custom render rules | Advanced | 5.0 | |
| 14 | Geographic routing | Scale | 4.5 | |

### Removed / Deprioritized

| Feature | Previous ICE | Reason |
|---------|--------------|--------|
| Mobile app | 5.5 | No clear use case; dashboard is desktop-first |
| Custom user-agents | 7.0 | **Parked** - needs use case clarification |
| A/B testing renders | 7.0 | **Parked** - needs use case clarification |
| Predictive crawling | 5.5 | **Parked** - needs use case clarification |

---

## Roadmap Risks

| Risk | Mitigation |
|------|------------|
| Feature creep | Strict ICE prioritization |
| Technical debt | 20% time for refactoring |
| Competitor moves | Monitor weekly, respond fast |
| Customer requests | Validate with data, not just asks |

---

## How to Request Features

### For Customers
1. Submit via dashboard feedback
2. Vote on public roadmap (future)
3. Talk to support

### For Team
1. Add to backlog with ICE score
2. Discuss in product review
3. Prioritize against existing backlog

### Evaluation Criteria
- Does it serve primary persona?
- Does it align with product principles?
- Can we ship it in 2 weeks or less?
- Does it create defensible value?

---

*Roadmap is a living document. Updated monthly based on customer feedback and market changes.*
