# CrawlReady Business Model

**Last Updated:** January 2026
**Document Owner:** Finance/Strategy Team
**Review Cycle:** Quarterly

---

## Business Model Overview

**Type:** B2B SaaS (Subscription + Usage-Based Hybrid)

**Revenue Model:** Monthly recurring subscription with usage-based overages

**Why Hybrid Pricing:**
- Base subscription: Predictable revenue, customer budget planning
- Usage overages: Capture growth, align with value
- Research shows 44% higher ARPU vs flat-rate models

---

## Pricing Strategy

### Pricing Tiers

| Tier | Monthly Price | Annual Price | Renders/Month | Target Segment |
|------|--------------|--------------|---------------|----------------|
| **Free** | $0 | $0 | 1,000 | Validation, viral growth |
| **Starter** | $49 | $470 (20% off) | 25,000 | Indie hackers, small sites |
| **Growth** | $149 | $1,430 (20% off) | 100,000 | Growing SaaS, e-commerce |
| **Scale** | $399 | $3,830 (20% off) | 500,000 | High-traffic sites |
| **Enterprise** | Custom | Custom | Custom | Large companies, agencies |

### Feature Breakdown by Tier

| Feature | Free | Starter | Growth | Scale | Enterprise |
|---------|------|---------|--------|-------|------------|
| AI Crawler Detection | 5 crawlers | 15+ | 15+ | 15+ | All |
| Render Speed | <500ms | <200ms | <200ms | <200ms | <100ms |
| Cache Duration | 48hr | 24hr | 12hr | 6hr | Custom |
| Analytics | Basic | Standard | Advanced | Advanced | Custom |
| Citation Tracking | - | - | Yes | Yes | Yes |
| Schema Injection | - | - | Yes | Yes | Custom |
| Support | Community | Email | Priority | Dedicated | SLA |
| API Access | Limited | Full | Full | Full | Full |
| Webhooks | - | Yes | Yes | Yes | Yes |
| Custom Domains | 1 | 3 | 10 | Unlimited | Unlimited |

### Overage Pricing

| Usage Type | Price |
|------------|-------|
| Additional Renders | $0.50 per 1,000 |
| Additional Citation Checks | $0.10 per check |

**Comparison to Competitors:**
- Prerender.io: $0.75-1.50 per 1,000 renders
- CrawlReady: $0.50 per 1,000 renders
- **Advantage:** 46% cheaper

### Pricing Philosophy

1. **Transparent:** No hidden fees, no surprises
2. **Generous Free Tier:** Let users experience value before paying
3. **Aligned with Growth:** Usage-based captures expanding customers
4. **Proactive Alerts:** 80% usage warning prevents bill shock

---

## Unit Economics

### Cost Structure

| Cost Category | Per 1,000 Renders | Notes |
|--------------|-------------------|-------|
| Chrome Instance | $0.05 | Puppeteer compute |
| Infrastructure | $0.03 | Hosting, bandwidth |
| Cache/CDN | $0.02 | CloudFlare, Redis |
| Overhead | $0.05 | Support, monitoring |
| **Total COGS** | **$0.15** | |

### Gross Margin Analysis

| Tier | Price/1K Renders | COGS | Gross Margin |
|------|-----------------|------|--------------|
| Starter | $1.96 | $0.15 | **92%** |
| Growth | $1.49 | $0.15 | **90%** |
| Scale | $0.80 | $0.15 | **81%** |
| Overages | $0.50 | $0.15 | **70%** |

**Target Gross Margin:** 70-85% (aligned with SaaS benchmarks)

### Customer Acquisition Cost (CAC)

**Target CAC by Channel:**
| Channel | Target CAC | LTV:CAC |
|---------|-----------|---------|
| Organic/Content | $50 | 20:1+ |
| Product Hunt/HN | $100 | 10:1+ |
| Referrals | $75 | 13:1+ |
| Paid (future) | $250 | 4:1 |

**Blended Target CAC:** <$150

### Lifetime Value (LTV)

**LTV Calculation:**
```
LTV = (ARPU × Gross Margin) / Monthly Churn Rate

Assumptions:
- Average ARPU: $120/mo (blended across tiers)
- Gross Margin: 80%
- Monthly Churn: 5%

LTV = ($120 × 0.80) / 0.05 = $1,920
```

**Target LTV:** $1,500-2,500

### LTV:CAC Ratio

| Scenario | LTV | CAC | Ratio | Assessment |
|----------|-----|-----|-------|------------|
| Conservative | $1,500 | $150 | 10:1 | Excellent |
| Target | $1,920 | $120 | 16:1 | Excellent |
| Optimistic | $2,500 | $100 | 25:1 | Exceptional |

**Series A Benchmark:** 4:1+ (we exceed this significantly)

### CAC Payback Period

```
CAC Payback = CAC / (ARPU × Gross Margin)
            = $150 / ($120 × 0.80)
            = 1.56 months
```

**Target CAC Payback:** <6 months
**Series A Benchmark:** <21 months

---

## Revenue Model

### Year 1-3 Projections

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Customers | 150 | 500 | 1,500 |
| ARPU | $100/mo | $120/mo | $140/mo |
| MRR | $15K | $60K | $210K |
| ARR | $180K | $720K | $2.5M |
| Growth Rate | - | 300% | 250% |

### Revenue Mix Assumptions

| Source | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Subscription | 85% | 80% | 75% |
| Overages | 15% | 20% | 25% |

### Scenario Analysis

**Conservative Scenario:**
- 100 customers Year 1
- 3% monthly churn
- $90 ARPU
- **Year 1 ARR:** $108K

**Target Scenario:**
- 150 customers Year 1
- 5% monthly churn
- $100 ARPU
- **Year 1 ARR:** $180K

**Optimistic Scenario:**
- 200 customers Year 1
- 4% monthly churn
- $120 ARPU
- **Year 1 ARR:** $288K

---

## Key Metrics Dashboard

### Growth Metrics

| Metric | Target | Series A Benchmark |
|--------|--------|-------------------|
| Monthly Growth (CMGR) | 15%+ | 15%+ |
| Net New Customers | 10+/mo | Varies |
| Website Traffic | 10K/mo | Varies |
| Trial Signups | 200/mo | Varies |
| Trial→Paid Conversion | 12%+ | 12%+ |

### Financial Metrics

| Metric | Target | Series A Benchmark |
|--------|--------|-------------------|
| Gross Margin | 75%+ | 70-85% |
| CAC Payback | <6 mo | <21 mo |
| LTV:CAC | 10:1+ | 4:1+ |
| Rule of 40 | 40%+ | 40%+ |

### Retention Metrics

| Metric | Target | Series A Benchmark |
|--------|--------|-------------------|
| Monthly Churn | <5% | <5% |
| Logo Retention | 95%+ | 90%+ |
| NRR | 110%+ | 106%+ |
| GRR | 90%+ | 85%+ |

### Product Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Time-to-Value | <5 min | PLG success |
| Activation Rate | 40%+ | Trial effectiveness |
| DAU/MAU | 30%+ | Engagement |
| Feature Adoption | 60%+ | Stickiness |

---

## Pricing Experiments Roadmap

### Experiment 1: Free Tier Limits
**Hypothesis:** 1,000 renders is optimal for conversion
**Test:** A/B test 500 vs 1,000 vs 2,000 free renders
**Success Metric:** Trial→Paid conversion rate

### Experiment 2: Annual Discount
**Hypothesis:** 20% annual discount maximizes revenue
**Test:** A/B test 15% vs 20% vs 25% discounts
**Success Metric:** Annual plan adoption rate

### Experiment 3: Enterprise Pricing
**Hypothesis:** Custom pricing unlocks $500+/mo deals
**Test:** Sales-led vs self-serve for accounts >50K renders
**Success Metric:** Enterprise ACV

---

## Financial Operations

### Billing Infrastructure
- **Platform:** Stripe Billing
- **Metering:** Custom usage tracking + Stripe meters
- **Dunning:** Automated retry + customer notification

### Revenue Recognition
- **Subscription:** Recognized monthly
- **Overages:** Recognized at usage
- **Annual:** Amortized over contract period

### Cash Flow Considerations
- **Annual Plans:** Front-loaded cash, but deferred revenue
- **Monthly Plans:** Predictable but smaller per-customer
- **Target:** 30% annual plan adoption for cash efficiency

---

## Path to Series A

### Series A Readiness Checklist

| Metric | Target | Current |
|--------|--------|---------|
| ARR | $500K+ | TBD |
| Monthly Growth | 15%+ | TBD |
| Gross Margin | 70%+ | TBD |
| LTV:CAC | 4:1+ | TBD |
| NRR | 106%+ | TBD |
| Customers | 100+ | TBD |

### What Investors Look For

1. **Revenue Velocity:** Consistent monthly growth
2. **Unit Economics:** Strong LTV:CAC, gross margins
3. **Retention:** Low churn, high NRR
4. **Market Timing:** Large, growing market
5. **Team:** Execution capability
6. **Moat:** Defensible differentiation

---

## Revenue Diversification (Future)

### Potential Revenue Streams

| Stream | Timing | Potential |
|--------|--------|-----------|
| **Core SaaS** | Now | 80% of revenue |
| **Enterprise** | Month 6+ | 15% of revenue |
| **Agency White-Label** | Month 9+ | 10% of revenue |
| **Platform Integrations** | Month 12+ | 5% of revenue |
| **API Marketplace** | Year 2+ | 5% of revenue |

---

## Summary

### Business Model Strengths
- High gross margins (80%+)
- Strong unit economics (16:1 LTV:CAC)
- Fast payback (<2 months)
- Transparent, competitive pricing
- Usage-based upside capture

### Areas to Optimize
- Increase annual plan adoption (cash efficiency)
- Expand enterprise segment (higher ACV)
- Reduce churn (improve NRR)
- Build referral engine (lower CAC)

---

*Financial projections are estimates. Actual results will vary based on execution and market conditions.*
