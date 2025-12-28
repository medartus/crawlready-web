# CrawlReady: Business Requirements Specification (BRS)

**Version**: 1.0  
**Date**: December 28, 2024  
**Status**: Draft - Pending Approval

---

## 1. Product Vision

### 1.1 Purpose

Enable websites to maximize their visibility in AI language models (ChatGPT, Claude, Perplexity, Gemini) by pre-rendering pages optimized for AI crawler consumption.

**Problem Statement**: Modern websites built with JavaScript frameworks (React, Vue, Angular) are often invisible or partially visible to AI crawlers because:
- AI bots may not execute JavaScript properly
- Dynamic content loads after initial page load
- Server-side rendering is complex and expensive to implement
- Websites lack control over how AI bots see their content

**Solution**: CrawlReady provides a simple API-based pre-rendering service that:
- Renders JavaScript-heavy pages using headless Chrome
- Stores pre-rendered HTML permanently (no re-crawling needed)
- Serves cached pages instantly to AI bots (<100ms)
- Works with any website stack (no code changes to site itself)

### 1.2 Target Customers

**Primary Segments**:

1. **E-commerce Sites**
   - Want product pages visible in AI shopping assistants
   - Need dynamic pricing and inventory visible to AI
   - Revenue impact: Direct correlation between AI visibility and sales

2. **SaaS Companies**
   - Need documentation discoverable by AI for developer queries
   - Want product features visible in AI recommendations
   - Use case: "What's the best project management tool with Gantt charts?"

3. **Content Publishers**
   - Maximize article citations in AI responses
   - Track which content AI bots access most
   - Revenue model: Ad impressions, subscriptions driven by AI referrals

4. **Digital Agencies**
   - Manage AI visibility for multiple client sites
   - Need white-label or multi-tenant solution (Phase 2+)
   - Billing: Pass-through costs + markup

**Secondary Segments** (Post-MVP):
- Local businesses (restaurants, services)
- Enterprise companies (custom deployment)
- Developer platforms (API documentation sites)

### 1.3 Value Proposition

**Core Value**: Pre-render once, serve forever to all AI bots.

**Key Benefits**:
1. **Permanent Storage**: Never re-render unless you update content
2. **Universal Compatibility**: Same pre-rendered HTML for all AI bots (ChatGPT, Claude, Perplexity)
3. **Zero Infrastructure**: No server setup, just API calls
4. **Pay-Per-Use**: Only pay for renders, not storage or bandwidth
5. **Instant Serving**: <100ms cache hit latency from hot cache

**Competitive Advantages**:
- Two-tier storage (hot + cold) vs competitors' time-based cache expiry
- API-first (works with any stack) vs platform-specific solutions
- Simplified pricing (renders only) vs compute-hour billing

---

## 2. MVP Scope

### 2.1 Features That WILL Be Built in MVP

#### Feature 1: Pre-rendering API
**Status**: Planned - Week 2-3  
**Priority**: P0 (Critical)

**Description**: Core API endpoint that accepts a URL and returns pre-rendered HTML.

**Functionality**:
- Endpoint: `POST /api/render`
- Authentication: Bearer token (API key)
- Input: URL + optional rendering options (wait selector, timeout)
- Output: Pre-rendered HTML (200) or job ID for async processing (202)
- Support: JavaScript-heavy SPAs (React, Vue, Angular, Svelte)

**Success Criteria**:
- Renders 95%+ of submitted URLs successfully
- <5s render completion time (p95)
- Handles complex JavaScript applications
- Returns valid HTML5 markup

**Technical Constraints**:
- 30s timeout (default), 60s max (enterprise)
- Max page size: 10MB HTML output
- No support for Flash, Java applets, or other legacy plugins

---

#### Feature 2: Two-Tier Storage System
**Status**: Planned - Week 2  
**Priority**: P0 (Critical)

**Description**: Intelligent caching system with hot (Redis) and cold (Supabase Storage) tiers.

**Functionality**:
- **Hot Cache**: 1000 most recently accessed pages in Redis (LRU eviction)
  - Access time: <50ms p95
  - No TTL (evicted by LRU algorithm only)
  - Automatic promotion from cold storage on access

- **Cold Storage**: Permanent storage in Supabase Storage
  - Access time: <300ms p95
  - Retention: Forever (until customer deletes)
  - Cost: $0.021/GB (~$1/mo for 100k pages @ 500KB avg)

**Success Criteria**:
- Cache hit rate: >50% from hot cache after 1 week
- Cold storage retrieval: <300ms p95
- Zero data loss (99.99% durability from Supabase)
- Automatic promotion works >95% of time

**Technical Constraints**:
- Hot cache limited to 1000 pages (configurable post-MVP)
- Cold storage retrieval adds ~200-250ms latency vs hot cache
- Promotion to hot cache is async (doesn't block response)

---

#### Feature 3: Cache Management APIs
**Status**: Planned - Week 3  
**Priority**: P1 (High)

**Description**: APIs for customers to inspect and invalidate cached content.

**Functionality**:
- `GET /api/cache/status?url={url}`: Check if URL is cached, where (hot/cold), last rendered time
- `DELETE /api/cache?url={url}`: Purge cached version from both Redis and Supabase

**Use Cases**:
- Customer updates their site, wants to invalidate old cached version
- Check if a page is already cached before requesting render
- Debugging: Verify which version of page is cached

**Success Criteria**:
- Status check: <100ms response time
- Invalidation: Removes from both tiers within 5 seconds
- Accurate metadata (last rendered, access count, size)

---

#### Feature 4: Simple Admin Interface
**Status**: Planned - Week 4  
**Priority**: P1 (High)

**Description**: Basic web UI for API key management and usage monitoring.

**Functionality**:
- **API Key Generation**: Enter customer email → generates `sk_live_*` key
- **Usage Dashboard**: Shows per-key metrics:
  - Renders today / this month
  - Cache hit rate
  - Storage used (GB)
  - Top rendered URLs
- **No Authentication**: Obscured URL path (e.g., `/admin-{random-secret}`)

**Success Criteria**:
- Generate API key in <2 clicks
- Display real-time usage stats (updated every 5 minutes)
- Works on mobile devices (responsive design)

**Technical Constraints**:
- No user login/registration for MVP (manual customer management)
- Admin URL kept secret (not public)
- Basic auth added in Phase 2 for security

---

#### Feature 5: Rate Limiting
**Status**: Planned - Week 2  
**Priority**: P0 (Critical)

**Description**: Per-API-key rate limits to prevent abuse and control costs.

**Functionality**:
- Redis-based sliding window counter
- Limits by tier:
  - **Free**: 100 renders/day
  - **Pro**: 10,000 renders/day
  - **Enterprise**: Custom (configurable)
- HTTP 429 response with `Retry-After` header when limit exceeded

**Success Criteria**:
- Rate limits enforced with <5ms overhead
- Accurate counting (no double-counting on retries)
- Clear error messages when limit hit

---

#### Feature 6: Basic Analytics
**Status**: Planned - Week 4  
**Priority**: P2 (Medium)

**Description**: Simple metrics for customers to track usage and performance.

**Metrics Tracked**:
- Total renders (lifetime, monthly, daily)
- Cache hit/miss ratio
- Storage used (GB)
- Average render time
- Top 10 rendered URLs
- Error rate

**Success Criteria**:
- Data aggregated daily (not real-time for MVP)
- Dashboard loads in <2s
- Accurate to within 1% of actual usage

---

### 2.2 Features That WILL NOT Be Built in MVP

#### Non-Feature 1: User Dashboard with Authentication
**Status**: Deferred to Phase 2  
**Reason**: Keep MVP simple, manual onboarding for first 20 customers

**Excluded Functionality**:
- User registration/login
- Password recovery
- Email verification
- Team collaboration (multiple users per account)
- Role-based access control

**Workaround for MVP**: Admin manually creates API keys and emails them to customers.

**Future Implementation**: Target for Month 4-6 post-launch.

---

#### Non-Feature 2: Bot-Specific Rendering
**Status**: Deferred to Phase 2  
**Reason**: 95% of customers need identical HTML for all AI bots

**Excluded Functionality**:
- Detect which bot is requesting (ChatGPT vs Claude vs Perplexity)
- Serve different HTML based on bot type
- Bot-specific optimizations (e.g., different schema markup per bot)

**Workaround for MVP**: Same pre-rendered HTML served to all bots.

**Cost Benefit**: Reduces cache entries by ~5x (one per URL vs one per URL per bot).

**Future Implementation**: If customers demonstrate need for bot-specific content (e.g., Claude prefers different schema format), add in Phase 2.

---

#### Non-Feature 3: Webhook Callbacks
**Status**: Deferred to Phase 2  
**Reason**: Simple polling sufficient for MVP scale

**Excluded Functionality**:
- Register webhook URL for job completion notifications
- Retry logic for webhook delivery
- Webhook signature verification

**Workaround for MVP**: Customer polls `GET /api/status/:jobId` every 1-2 seconds until job completes.

**Future Implementation**: Add when customers request async workflows (e.g., bulk rendering 1000s of URLs overnight).

---

#### Non-Feature 4: Custom Domains
**Status**: Deferred to Phase 3  
**Reason**: Enterprise feature, not needed for validation

**Excluded Functionality**:
- Customer uses their own domain (e.g., `render.customer.com`)
- SSL certificate management for custom domains
- CNAME configuration

**Workaround for MVP**: All API requests via `api.crawlready.com`.

**Future Implementation**: Enterprise tier feature (Month 9-12).

---

#### Non-Feature 5: Advanced Bot Detection Service
**Status**: Deferred to Phase 2  
**Reason**: Customer knows their traffic best; we provide rendering, they handle detection

**Excluded Functionality**:
- Built-in middleware for Next.js, Express, etc.
- User-agent pattern matching service
- DNS verification for bot authenticity
- Server log analysis

**Workaround for MVP**: Customer implements bot detection in their code, then calls our API. We provide example code in integration guide.

**Future Implementation**: If many customers request it, package as separate SDK (e.g., `@crawlready/middleware`).

---

#### Non-Feature 6: Schema Markup Injection
**Status**: Deferred to Phase 2  
**Reason**: Feature creep; focus on core rendering first

**Excluded Functionality**:
- Automatically detect page type (Product, Article, FAQ, etc.)
- Inject appropriate Schema.org JSON-LD
- Validate existing schema markup
- Recommendations for schema improvements

**Workaround for MVP**: Render HTML as-is from customer site. If customer wants schema, they add it to their site before rendering.

**Future Implementation**: Phase 2 feature based on existing `/documentation/schema-markup-spec.md`.

---

#### Non-Feature 7: Multi-Region Workers
**Status**: Deferred to Phase 2  
**Reason**: Cost optimization; 80% of early customers in US

**Excluded Functionality**:
- Deploy workers in EU, Asia, Australia
- Geographic routing (route to nearest region)
- Multi-region failover

**Workaround for MVP**: Single US-West region (Fly.io sjc). Acceptable latency for global customers (render jobs are async anyway).

**Future Implementation**: Add EU region when >20% of traffic from Europe.

---

#### Non-Feature 8: Billing Automation
**Status**: Deferred to Phase 2  
**Reason**: First 20 customers handled manually; need to validate pricing

**Excluded Functionality**:
- Stripe integration for payments
- Automated invoicing
- Usage-based billing calculations
- Self-service plan upgrades

**Workaround for MVP**: 
- Track usage in database
- Admin exports CSV monthly
- Send invoices manually via email
- Collect payment via Stripe Invoices (not automated)

**Future Implementation**: Automate when >30 paying customers (Month 4-6).

---

## 3. Success Criteria

### 3.1 Acquisition Metrics (12 weeks from start)

**Primary Metrics**:
- **Paying Customers**: 20 customers (manual onboarding)
- **Monthly Recurring Revenue**: $1,000 MRR minimum
- **Pages Rendered**: 10,000+ total pages rendered across all customers

**Secondary Metrics**:
- Free tier signups: 50+ API keys generated
- Conversion rate: 40% free → paid (20 paid / 50 free)
- Average revenue per customer: $50/month

**Leading Indicators** (Week 4):
- 5 beta customers actively using API
- 1,000+ pages rendered in beta period
- Positive feedback from beta users (NPS >40)

---

### 3.2 Technical Metrics

**Reliability** (P0 - Must Achieve):
- API uptime: 99% (7.2 hours downtime/month acceptable for MVP)
- Render success rate: >95% (exclude customer site errors)
- Data durability: 99.99% (Supabase guarantee)

**Performance** (P0 - Must Achieve):
- Cache hit latency (hot): p95 <100ms, p99 <200ms
- Cache hit latency (cold): p95 <300ms, p99 <500ms
- Fresh render completion: p95 <5s, p99 <10s

**Efficiency** (P1 - Should Achieve):
- Cache hit rate: >50% after first week of customer usage
- Worker throughput: >100 renders/hour per worker
- Queue processing time: <30s wait time when <10 jobs queued

**Scalability** (P2 - Nice to Have):
- Support 1,000 renders/day with single worker
- Scale to 10,000 renders/day with 3 workers (linear scaling)

---

### 3.3 Product Metrics

**User Experience** (P0):
- Integration time: <30 minutes from API key to first successful render
- Error rate: <5% (excluding customer site errors)
- Documentation clarity: Customers can integrate without support call

**Customer Satisfaction** (P1):
- Net Promoter Score: >40 (calculated from beta customers)
- Support tickets: <2 tickets per customer per month
- Churn rate: <5% monthly churn

**Product-Market Fit Signals** (P1):
- Customers actively use API (>10 renders/week)
- Customers refer other customers (1+ referral in 12 weeks)
- Customers renew after first month (>80% retention)

---

## 4. Pricing Strategy (MVP)

### 4.1 Pricing Tiers

**Free Tier**:
- 100 renders/day
- 24-hour cache TTL equivalent (LRU eviction from hot cache)
- Email support (48-hour response time)
- Price: $0/month
- **Goal**: Lead generation, conversion to paid

**Pro Tier**:
- 10,000 renders/day
- Permanent storage (cold storage never expires)
- Priority queue (renders process first)
- Email support (24-hour response time)
- Price: **$49/month**
- **Target**: Small-medium businesses, agencies

**Enterprise Tier**:
- 100,000 renders/day (custom limits available)
- Permanent storage + dedicated cache allocation
- Priority queue + SLA (99.5% uptime guarantee)
- Dedicated support (Slack/Discord channel)
- Custom contract, optional on-premise deployment (Phase 3)
- Price: **$299/month**
- **Target**: Large e-commerce, enterprise companies

### 4.2 Pricing Assumptions

**Cost Per Render** (fully loaded):
- Worker compute: $0.0001 (Fly.io)
- Storage (amortized): $0.00001 (Supabase)
- Egress/bandwidth: $0.00001
- **Total**: ~$0.00012 per render

**Unit Economics**:
- Pro customer at $49/mo: 10k renders/day = 300k renders/month
- Cost: 300k * $0.00012 = $36/month
- Gross margin: ($49 - $36) / $49 = **26.5%** (acceptable for MVP, improve with scale)

**Break-Even**:
- Fixed costs: ~$120/month (infrastructure)
- Need 3 Pro customers to cover fixed costs ($147 revenue > $120 fixed + $108 variable)
- Profitable from customer #4 onward

---

## 5. Go-to-Market Strategy (MVP Phase)

### 5.1 Customer Acquisition (Weeks 1-12)

**Channel 1: Direct Outreach** (Primary for MVP)
- Target: 50 potential customers from personal network
- Message: Beta access to pre-rendering API, first month free
- Goal: 20 responses, 10 demos, 5 paying customers
- Timeline: Weeks 1-6

**Channel 2: Content Marketing** (Lead generation)
- Existing blog content on AI crawlers (already deployed at crawlready.com/blog)
- Add "Try Free Render API" CTA to blog posts
- Goal: 25 free tier signups
- Timeline: Ongoing from Week 1

**Channel 3: Community Engagement** (Weeks 6-12)
- Post in Indie Hackers, Reddit (r/webdev, r/nextjs)
- HackerNews "Show HN" post (Week 8)
- Goal: 15 free tier signups, 3 paid conversions
- Timeline: Weeks 6-12

**Channel 4: Partner Referrals** (Weeks 8-12)
- Reach out to web agencies (manage 10+ client sites)
- Offer 20% referral commission for first 6 months
- Goal: 2 agency customers, 5 referred customers
- Timeline: Weeks 8-12

### 5.2 Sales Process (MVP)

**Step 1: Lead Qualification** (<5 min)
- Inbound: Free tier signup via website
- Outbound: Email to targeted list
- Qualify: Do they have JS-heavy site? Care about AI visibility?

**Step 2: Product Demo** (30 min Zoom)
- Show live render of their site
- Compare: Original HTML source vs pre-rendered HTML
- Explain: How AI bots see their site now vs with CrawlReady
- Demo: API integration (5 lines of code)

**Step 3: Beta Trial** (1 week)
- Manually create API key (Pro tier features, no charge)
- Provide integration support (Slack/email)
- Monitor usage daily

**Step 4: Conversion** (Week 2)
- If >10 renders in trial week → send invoice ($49 for first month)
- If <10 renders → follow-up call to understand blockers

**Step 5: Onboarding** (Ongoing)
- Weekly check-in for first month
- Collect feedback for product improvements
- Ask for referrals / testimonials

---

## 6. Risks and Mitigations

### 6.1 Technical Risks

**Risk 1: Render Reliability <95%**
- **Impact**: High - Customers churn if renders fail frequently
- **Mitigation**:
  - Extensive testing of top 1000 websites before launch
  - Implement retry logic (3 attempts with exponential backoff)
  - Fallback to simple fetch if Puppeteer fails
  - Monitor error rates, alert if >5%

**Risk 2: Rendering Too Slow (>10s p99)**
- **Impact**: Medium - Customers frustrated with wait times
- **Mitigation**:
  - Resource blocking (images, fonts, ads) to speed up renders
  - Optimize Puppeteer flags (--disable-dev-shm-usage, etc.)
  - Queue system to handle load spikes
  - Set expectations: Document typical render times (3-5s)

**Risk 3: Storage Costs Exceed Projections**
- **Impact**: Medium - Unit economics break if storage >2x estimates
- **Mitigation**:
  - HTML optimization (minify, remove scripts) reduces size by ~40%
  - Monitor storage per customer, alert if >5GB
  - Compression (gzip) before storing in Supabase
  - Add storage limits per tier in Phase 2

### 6.2 Business Risks

**Risk 1: Low Conversion Rate (Free → Paid <20%)**
- **Impact**: High - Can't reach revenue targets
- **Mitigation**:
  - Aggressive free tier limits (100/day) to force upgrade
  - Proactive outreach to free tier users (week 2, week 4)
  - Case studies showing ROI of AI visibility
  - Offer discount for annual prepay (2 months free)

**Risk 2: Customers Don't Understand Value**
- **Impact**: High - Can't acquire customers if value prop unclear
- **Mitigation**:
  - Lead with problem ("Your site is invisible to ChatGPT")
  - Show before/after (HTML source vs rendered)
  - Provide free AI visibility checker tool (lead gen)
  - ROI calculator (estimate AI traffic increase)

**Risk 3: Competitors Launch Similar Service**
- **Impact**: Medium - Pricing pressure, differentiation challenge
- **Mitigation**:
  - Move fast (8 weeks to launch vs 6 months for competitors)
  - Build moat: Permanent storage (vs time-based expiry), two-tier cache
  - Customer lock-in: Integration effort, cached content value
  - Expand features rapidly (schema injection, analytics)

### 6.3 Security Risks

**Risk 1: SSRF Attacks (Critical)**
- **Impact**: Critical - Attacker could access internal services, cloud metadata
- **Mitigation**:
  - Comprehensive URL validation (block private IPs, localhost)
  - DNS resolution check before fetching
  - Render workers in isolated network (no access to internal services)
  - Regular security audits

**Risk 2: API Key Theft**
- **Impact**: High - Attacker uses stolen key, customer gets billed
- **Mitigation**:
  - SHA-256 hash keys in database
  - Rate limiting prevents massive abuse
  - Anomaly detection (unusual usage patterns)
  - Customer can regenerate keys instantly

**Risk 3: DDoS on API**
- **Impact**: Medium - Service downtime affects all customers
- **Mitigation**:
  - Cloudflare WAF in front of API
  - Rate limiting (per IP + per API key)
  - Queue system absorbs traffic spikes
  - Auto-scaling workers based on queue depth

---

## 7. Out of Scope (Not Planned)

### 7.1 Features Explicitly Excluded

**Not Building (Any Phase)**:
1. **Browser Automation for Customer Sites**: We render, not automate (no form filling, clicking, etc.)
2. **SEO Analysis Tools**: Focus is AI visibility, not traditional SEO
3. **A/B Testing of Rendered Pages**: Out of scope, use Optimizely/VWO
4. **Real-Time Rendering (No Cache)**: Always cache, never re-render on every request
5. **Wordpress Plugin**: API-first, no platform-specific plugins for MVP
6. **Mobile App**: Web-based admin only, no native mobile apps

### 7.2 Integrations Not Planned

**Third-Party Integrations (Deferred)**:
1. Zapier / Make.com (Phase 3)
2. Google Analytics / GA4 (Phase 2)
3. Shopify App Store (Phase 3)
4. WordPress.org plugin directory (Phase 3)

**Reason**: Focus on core API first, integrations are marketing/distribution (not product validation).

---

## 8. Approval and Next Steps

### 8.1 Stakeholder Sign-Off

This document requires approval from:
- [ ] Technical Lead (Backend/Infrastructure)
- [ ] Product Owner
- [ ] Business/Finance (Pricing validation)

**Approval Deadline**: End of Week 1 (before infrastructure setup begins)

### 8.2 Dependencies for Implementation

**Blockers** (Must complete before Week 2):
1. Functional specification document (API contracts, cache logic)
2. Non-functional requirements (performance targets, security)
3. Database schema specification (PostgreSQL structure)
4. Integration guide (customer code examples)

**Next Steps**:
1. Review this document with stakeholders (1-hour meeting)
2. Incorporate feedback (1-2 days)
3. Final approval (by end of Week 1)
4. Begin infrastructure setup (Week 2)

---

## 9. Change Log

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2024-12-28 | 1.0 | System | Initial draft based on refined plan |

---

## 10. Appendix

### 10.1 Glossary

- **AI Crawler**: Automated bot from AI companies (OpenAI, Anthropic, Perplexity) that indexes web content
- **Pre-rendering**: Process of executing JavaScript and generating final HTML using headless browser
- **Hot Cache**: Fast in-memory cache (Redis) for frequently accessed pages
- **Cold Storage**: Permanent object storage (Supabase) for all rendered pages
- **LRU**: Least Recently Used eviction policy (removes oldest unaccessed items first)
- **SSRF**: Server-Side Request Forgery attack (trick server into making internal network requests)

### 10.2 Reference Documents

- Functional Specification: `documentation/specs/functional-spec.md` (to be written)
- Technical Architecture: `documentation/technical-architecture.md` (existing)
- Database Schema: `documentation/specs/database-schema.md` (to be written)
- Integration Guide: `documentation/specs/integration-guide.md` (to be written)

---

**Document Status**: DRAFT - Awaiting stakeholder review and approval before implementation begins.

