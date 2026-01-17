# CrawlReady Documentation

**Last Updated:** January 2026
**Purpose:** Central hub for all CrawlReady strategic, product, and technical documentation.

---

## Quick Navigation

### Strategic Documentation

| Section | Description | Start Here |
|---------|-------------|------------|
| [00-strategy/](./00-strategy/) | Business strategy, market analysis, personas | [Vision & Mission](./00-strategy/vision-mission.md) |
| [01-product/](./01-product/) | Product strategy, roadmap, MVP definition | [Product Strategy](./01-product/product-strategy.md) |
| [02-go-to-market/](./02-go-to-market/) | Marketing, sales, positioning | [Positioning](./02-go-to-market/positioning.md) |
| [03-brand/](./03-brand/) | Brand guidelines, visual identity | [Brand Guidelines](./03-brand/brand-guidelines.md) |

### Technical & Reference

| Section | Description | Start Here |
|---------|-------------|------------|
| [04-technical/](./04-technical/) | Architecture, specs, implementation details | [Technical Architecture](./04-technical/technical-architecture.md) |
| [05-reference/](./05-reference/) | Setup guides, environment, deployment | [Environment Variables](./05-reference/ENVIRONMENT_VARIABLES.md) |

---

## Document Structure

```
documentation/
├── 00-strategy/                     # Business Strategy
│   ├── README.md                    # Section navigation
│   ├── vision-mission.md            # Why we exist
│   ├── market-analysis.md           # TAM/SAM/SOM, trends
│   ├── user-personas.md             # Who we serve
│   ├── competitive-landscape.md     # How we differentiate
│   └── business-model.md            # How we make money
│
├── 01-product/                      # Product Strategy
│   ├── README.md                    # Section navigation
│   ├── product-strategy.md          # Product vision & principles
│   ├── feature-roadmap.md           # What we're building
│   ├── mvp-definition.md            # MVP scope
│   └── onboarding-strategy.md       # Onboarding philosophy & flow
│
├── 02-go-to-market/                 # Marketing & Sales
│   ├── README.md                    # Section navigation
│   ├── positioning.md               # Messaging framework
│   ├── marketing-playbook.md        # Channel strategy
│   └── sales-playbook.md            # Sales process
│
├── 03-brand/                        # Brand Identity
│   ├── brand-guidelines.md          # Voice, visuals, usage
│   └── assets/                      # Logo, templates
│
├── 04-technical/                    # Technical Documentation
│   ├── README.md                    # Section navigation
│   ├── technical-architecture.md    # System architecture
│   ├── ai-crawler-criteria.md       # Crawler detection logic
│   ├── schema-markup-spec.md        # LLM schema specification
│   ├── middleware-auth.md           # Auth implementation
│   ├── database-migration-guide.md  # Migration procedures
│   ├── ARCHITECTURE_UPDATE.md       # Recent architecture changes
│   ├── monorepo-refactor-plan.md    # Monorepo refactoring plan
│   ├── MONOREPO_DOCS.md             # Monorepo structure
│   ├── MONOREPO_IMPLEMENTATION...   # Migration completion notes
│   ├── README_MONOREPO.md           # Monorepo quick start
│   └── specs/                       # Detailed Specifications
│       ├── business-requirements.md
│       ├── functional-spec.md
│       ├── non-functional-requirements.md
│       ├── database-schema.md
│       ├── sites-database-schema.md     # Sites & multi-domain schema
│       ├── integration-guide.md
│       ├── user-api-endpoints.md
│       ├── dashboard-overview-functional.md      # Overview page
│       ├── dashboard-sites-functional.md         # Sites management
│       ├── dashboard-pages-functional.md         # Rendered pages browser
│       ├── dashboard-usage-functional.md         # Analytics (renamed from Usage)
│       ├── dashboard-api-keys-functional.md      # API keys (under Settings)
│       ├── dashboard-members-functional.md       # Team members
│       ├── dashboard-crawler-activity-functional.md  # Activity feed
│       ├── onboarding-wizard-functional.md       # Onboarding wizard
│       └── render-preview-functional.md          # Test render tool
│
├── 05-reference/                    # Setup & Reference
│   ├── README.md                    # Section navigation
│   ├── ENVIRONMENT_VARIABLES.md     # Environment configuration
│   ├── DEPLOYMENT.md                # Deployment guide
│   ├── DEPLOYMENT_READY.md          # Pre-deployment checklist
│   ├── VERCEL_SETUP.md              # Vercel configuration
│   ├── SUPABASE_INTEGRATION.md      # Database setup
│   ├── POSTHOG_SETUP.md             # Analytics setup
│   ├── GOOGLE_SHEETS_SETUP.md       # Google Sheets integration
│   ├── TESTING_GUIDE.md             # Testing procedures
│   └── project_summary.md           # Original project summary
│
├── research/                        # Market research files
│
└── _archive/                        # Legacy documents (consolidated)
```

---

## How to Use This Documentation

### For Team Members
1. **New to CrawlReady?** Start with [Vision & Mission](./00-strategy/vision-mission.md)
2. **Understanding the market?** Read [Market Analysis](./00-strategy/market-analysis.md)
3. **Building features?** Check [Product Strategy](./01-product/product-strategy.md) and [MVP Definition](./01-product/mvp-definition.md)
4. **Creating content?** Reference [Brand Guidelines](./03-brand/brand-guidelines.md) and [Positioning](./02-go-to-market/positioning.md)
5. **Setting up dev environment?** See [05-reference/](./05-reference/)

### For Investors
1. [Vision & Mission](./00-strategy/vision-mission.md) - Why we exist
2. [Market Analysis](./00-strategy/market-analysis.md) - Market opportunity ($750B by 2028)
3. [Business Model](./00-strategy/business-model.md) - Unit economics & pricing
4. [Competitive Landscape](./00-strategy/competitive-landscape.md) - Differentiation & moat

### For Partners
1. [Positioning](./02-go-to-market/positioning.md) - How we describe ourselves
2. [User Personas](./00-strategy/user-personas.md) - Who we serve
3. [Brand Guidelines](./03-brand/brand-guidelines.md) - Brand usage

### For Engineers
1. [Technical Architecture](./04-technical/technical-architecture.md) - System overview
2. [AI Crawler Criteria](./04-technical/ai-crawler-criteria.md) - Detection logic
3. [Specifications](./04-technical/specs/) - Detailed functional & non-functional specs
4. [Environment Setup](./05-reference/ENVIRONMENT_VARIABLES.md) - Configuration
5. [Deployment Guide](./05-reference/DEPLOYMENT.md) - Deployment procedures

---

## Key Numbers

| Metric | Value | Source |
|--------|-------|--------|
| AI Search Market (2028) | $750B | Market Analysis |
| ChatGPT Weekly Users | 800M | Market Analysis |
| AI Crawlers Rendering JS | 31% | Technical Research |
| Target Gross Margin | 80%+ | Business Model |
| Time-to-Value Target | <5 min | Product Strategy |
| Pricing (Starter) | $49/mo | Business Model |

---

## Document Inventory

| Section | Documents | Purpose |
|---------|-----------|---------|
| 00-strategy | 6 | Business foundation, market opportunity |
| 01-product | 5 | Product vision, roadmap, MVP, onboarding |
| 02-go-to-market | 4 | Marketing & sales execution |
| 03-brand | 1 | Brand consistency |
| 04-technical | 11 + 17 specs | Implementation details |
| 05-reference | 10 | Setup & deployment guides |
| _archive | 7 | Legacy docs (consolidated) |

**Total: 61 documents**

---

## Document Standards

- **Last Updated:** Include date in every document
- **Document Owner:** Assign responsibility
- **Review Cycle:** Quarterly for strategy, monthly for execution
- **Format:** Markdown with clear headers, tables, actionable content

---

*Questions? Start with the section README or ask in #product-strategy.*
