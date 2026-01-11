# CrawlReady MVP Definition

**Last Updated:** January 2026
**Document Owner:** Product Team
**Status:** In Development

---

## MVP Philosophy

### Minimal Lovable Product (MLP)

We're not building a minimum viable product—we're building the smallest product that users will **love** and **pay for**.

**The Test:** Would a user recommend this to a colleague?

### Core Principle
> "If it doesn't help users become visible to AI crawlers, it's not in the MVP."

### What MVP Does vs. Doesn't Do

| MVP Does | MVP Does NOT |
|----------|--------------|
| ✅ Make JavaScript sites visible to AI crawlers | ❌ Track AI citations (Phase 2) |
| ✅ Detect 15+ AI crawlers | ❌ Inject schema markup (Phase 2) |
| ✅ Provide usage analytics | ❌ Provide content optimization guidance (Phase 2) |
| ✅ Enable fast <200ms rendering | ❌ Compare against competitors (Phase 2) |

> **Important:** Citation tracking and content optimization are key differentiators planned for **Phase 2**, not MVP. MVP focuses on the foundational problem: making JavaScript content visible to AI crawlers.

---

## MVP Scope

### In-Scope Features

#### 1. Core Rendering Engine
| Component | Requirement | Target |
|-----------|-------------|--------|
| Crawler Detection | 15+ AI crawlers | GPTBot, ClaudeBot, PerplexityBot, etc. |
| Render Speed | p95 latency | <200ms |
| Success Rate | Render completion | >99% |
| Cache Hit Rate | Cached responses | >70% |
| Uptime | Availability | 99.9% |

#### 2. Onboarding Experience (NEW - P0)

| Feature | Description | Priority |
|---------|-------------|----------|
| 4-Step Wizard | Guided setup in < 5 minutes | **P0** |
| Problem Visualization | Side-by-side "what crawlers see" | **P0** |
| Auto Framework Detection | Detect Next.js, React, Vue, etc. | **P0** |
| Integration Verification | Automated verification with retry | **P0** |
| API Key Generation | Auto-generated, copy-paste ready | **P0** |

> **Rationale:** Onboarding is the critical path to activation. A user who doesn't complete setup in 5 minutes is unlikely to convert. This feature directly impacts our 70% wizard completion target.

#### 3. Customer Dashboard
| Feature | Description | Priority |
|---------|-------------|----------|
| Dashboard Overview | At-a-glance site health & activity | **P0** |
| Site Management | Add/remove domains | P0 |
| Usage Analytics | Render counts, cache hits | P0 |
| Crawler Activity | Which AI crawlers visited | P0 |
| Settings | Cache TTL, user-agent config | P0 |
| Account Management | Plan, billing, team (v2) | P0 |
| Test Render Tool | Preview what crawlers see | P0 |

#### 4. Developer Tools
| Feature | Description | Priority |
|---------|-------------|----------|
| REST API | Programmatic render control | P0 |
| API Keys | Secure authentication | P0 |
| Webhooks | Event notifications | P0 |
| Documentation | Setup guides, API reference | P0 |
| SDKs | Node.js (Python, Go in v2) | P1 |

#### 5. Billing & Accounts
| Feature | Description | Priority |
|---------|-------------|----------|
| Free Tier | 1,000 renders/month | P0 |
| Paid Plans | Starter $49, Growth $149, Scale $399 | P0 |
| Usage Metering | Real-time render counting | P0 |
| Overage Billing | $0.50/1K additional renders | P0 |
| Annual Billing | 20% discount | P1 |

---

### Out-of-Scope (Explicitly Not in MVP)

| Feature | Why Not | When |
|---------|---------|------|
| AI Citation Tracking | Complex, requires LLM APIs | Phase 2 |
| Schema Injection | Needs content analysis | Phase 2 |
| Visual Diff Tool | Nice-to-have, not core | Phase 2 |
| Multi-Domain (unlimited) | Growth tier feature | Phase 2 |
| Team Management | Solo users first | Phase 2 |
| SSO/SAML | Enterprise feature | Phase 3 |
| Platform Integrations | Need PMF first | Phase 3 |
| White-Label | Scale feature | Phase 3 |
| Mobile App | Web-first | Future |
| GraphQL API | REST is sufficient | Future |

---

## Technical Requirements

### Performance Requirements

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| Render Speed (p50) | <100ms | DataDog/PostHog |
| Render Speed (p95) | <200ms | DataDog/PostHog |
| Render Speed (p99) | <500ms | DataDog/PostHog |
| Uptime | 99.9% | StatusPage |
| Error Rate | <0.1% | Sentry |
| Cache Hit Rate | >70% | Redis metrics |

### Scalability Requirements

| Metric | MVP Target | Notes |
|--------|-----------|-------|
| Concurrent Renders | 100 | Per second |
| Daily Renders | 1M | Total capacity |
| Storage | 10GB | Cached pages |
| Domains | 500 | Total customers |

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| HTTPS Only | Enforced everywhere |
| API Authentication | Bearer tokens |
| Data Encryption | At rest and in transit |
| Rate Limiting | Per API key |
| Input Validation | All user inputs |

---

## User Stories

### As a Technical Founder...

**Story 1: Quick Setup (via Onboarding Wizard)**
> "I can integrate CrawlReady with my React site in under 5 minutes using the guided setup wizard."

**Acceptance Criteria:**
- [ ] 4-step onboarding wizard guides me through setup
- [ ] I see what AI crawlers currently see (problem visualization)
- [ ] Code snippets are auto-generated for my framework
- [ ] Integration is verified automatically
- [ ] Time to first render <5 minutes
- [ ] 70%+ wizard completion rate

**Story 2: See Results**
> "I can see which AI crawlers are visiting my site and verify they're getting rendered content."

**Acceptance Criteria:**
- [ ] Dashboard shows crawler visits
- [ ] Filter by crawler type
- [ ] See render success/failure
- [ ] Real-time updates

**Story 3: Control Costs**
> "I know exactly what I'm paying for and get warnings before overages."

**Acceptance Criteria:**
- [ ] Clear usage dashboard
- [ ] 80% usage warning email
- [ ] No surprise bills
- [ ] Transparent overage pricing

### As a Developer...

**Story 4: API Access**
> "I can programmatically manage renders and get real-time events via webhooks."

**Acceptance Criteria:**
- [ ] REST API documentation
- [ ] API key management
- [ ] Webhook configuration
- [ ] Event payloads documented

**Story 5: Troubleshooting**
> "When something goes wrong, I can quickly diagnose and fix the issue."

**Acceptance Criteria:**
- [ ] Error messages are clear
- [ ] Logs available in dashboard
- [ ] Documentation for common issues
- [ ] Support response <24hr

---

## Success Criteria

### Launch Readiness Checklist

#### Technical
- [ ] Render speed <200ms p95
- [ ] 99.9% uptime achieved in testing
- [ ] 15+ AI crawlers detected
- [ ] Cache layer operational
- [ ] Error handling complete
- [ ] Security audit passed

#### Product
- [ ] Dashboard functional (Overview, Sites, Activity, Analytics)
- [ ] Onboarding wizard complete (4 steps)
- [ ] Test render tool working
- [ ] API documented
- [ ] Webhooks working
- [ ] Documentation complete
- [ ] 70%+ wizard completion rate in testing

#### Business
- [ ] Pricing live in Stripe
- [ ] Free tier configured
- [ ] Overage billing working
- [ ] Terms of service published
- [ ] Privacy policy published

#### Marketing
- [ ] Landing page updated
- [ ] Launch blog post ready
- [ ] Email sequences configured
- [ ] Social assets created
- [ ] HN/PH posts drafted

### Post-Launch Success Metrics

| Metric | 30-Day Target | 90-Day Target |
|--------|---------------|---------------|
| Signups | 200 | 500 |
| **Wizard Completion Rate** | **70%** | **75%** |
| **Median Time to Complete** | **< 5 min** | **< 4 min** |
| Trial→Paid | 10% | 12% |
| Paying Customers | 20 | 50 |
| MRR | $1K | $3K |
| NPS | 40+ | 50+ |
| Day-1 Return Rate | 50% | 60% |
| Churn | <10% | <5% |

---

## MVP Development Timeline

### Week 1-2: Core Engine
- [ ] Puppeteer rendering pipeline
- [ ] Crawler detection logic
- [ ] Redis cache implementation
- [ ] Basic error handling

### Week 3-4: Infrastructure
- [ ] CloudFlare CDN setup
- [ ] Rate limiting
- [ ] Monitoring/alerting
- [ ] Load testing

### Week 5-6: Onboarding & Dashboard
- [ ] 4-step onboarding wizard
- [ ] Dashboard Overview page
- [ ] Site management UI
- [ ] Test render tool
- [ ] Usage analytics
- [ ] Settings pages

### Week 7-8: Developer Tools
- [ ] API endpoints
- [ ] Webhook system
- [ ] API documentation
- [ ] SDK (Node.js)

### Week 9-10: Billing
- [ ] Stripe integration
- [ ] Usage metering
- [ ] Plan management
- [ ] Overage handling

### Week 11-12: Polish & Launch
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation review
- [ ] Launch preparation

---

## Known Limitations (MVP)

### Technical
| Limitation | Workaround | Fix In |
|------------|------------|--------|
| Single region | CloudFlare caching | Phase 2 |
| Basic error messages | Documentation | Phase 2 |
| Limited customization | Default configs work well | Phase 2 |

### Product
| Limitation | Workaround | Fix In |
|------------|------------|--------|
| **No citation tracking** | Manual checking via ChatGPT/Perplexity | **Phase 2 (key differentiator)** |
| **No schema injection** | Manual implementation by users | **Phase 2 (key differentiator)** |
| **No content optimization guidance** | General best practices documentation | **Phase 2 (key differentiator)** |
| Limited team support | Share credentials or basic invite (P1) | Phase 2 (full team mgmt) |
| 3 domains max (starter) | Upgrade to Growth | Phase 2 |

> **Strategic Note:** The "limitations" above (citation tracking, schema injection, content optimization) are actually our **planned differentiators**. MVP focuses on the foundation; Phase 2 builds the moat.

---

## MVP Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Rendering fails on complex sites | Medium | High | Extensive testing, fallback to raw HTML |
| Performance issues at scale | Medium | Medium | Load testing, auto-scaling |
| Security vulnerabilities | Low | High | Security audit, rate limiting |
| Poor activation rate | Medium | High | User interviews, onboarding optimization |

---

## Definition of Done

### Feature Complete When:
1. Code reviewed and merged
2. Tests passing (unit + integration)
3. Documentation updated
4. Deployed to staging
5. QA approved
6. Deployed to production
7. Monitoring configured

### MVP Complete When:
1. All P0 features shipped
2. All acceptance criteria met
3. Launch readiness checklist complete
4. Team confident in stability
5. First paying customer acquired

---

*MVP scope locked. Changes require product/engineering alignment.*
