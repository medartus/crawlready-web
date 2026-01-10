# Technical Documentation

**Last Updated:** January 2026
**Purpose:** Technical architecture, specifications, and implementation details for CrawlReady.

---

## Quick Navigation

| Document | Description |
|----------|-------------|
| [technical-architecture.md](./technical-architecture.md) | System architecture overview |
| [ai-crawler-criteria.md](./ai-crawler-criteria.md) | AI crawler detection logic and user-agent patterns |
| [schema-markup-spec.md](./schema-markup-spec.md) | LLM-optimized schema specification |
| [middleware-auth.md](./middleware-auth.md) | Authentication middleware implementation |
| [database-migration-guide.md](./database-migration-guide.md) | Database migration procedures |

---

## Architecture Documents

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_UPDATE.md](./ARCHITECTURE_UPDATE.md) | Recent architecture changes |
| [monorepo-refactor-plan.md](./monorepo-refactor-plan.md) | Monorepo refactoring plan |
| [MONOREPO_DOCS.md](./MONOREPO_DOCS.md) | Monorepo structure documentation |
| [MONOREPO_IMPLEMENTATION_COMPLETE.md](./MONOREPO_IMPLEMENTATION_COMPLETE.md) | Monorepo migration completion notes |
| [README_MONOREPO.md](./README_MONOREPO.md) | Monorepo quick start guide |

---

## Specifications (specs/)

Detailed functional and non-functional requirements.

| Document | Description |
|----------|-------------|
| [specs/business-requirements.md](./specs/business-requirements.md) | Business requirements document |
| [specs/functional-spec.md](./specs/functional-spec.md) | Functional specifications |
| [specs/non-functional-requirements.md](./specs/non-functional-requirements.md) | NFRs (performance, security, etc.) |
| [specs/database-schema.md](./specs/database-schema.md) | Database schema design |
| [specs/integration-guide.md](./specs/integration-guide.md) | Integration guide |
| [specs/user-api-endpoints.md](./specs/user-api-endpoints.md) | API endpoint specifications |

### Dashboard Specifications

| Document | Description |
|----------|-------------|
| [specs/dashboard-pages-functional.md](./specs/dashboard-pages-functional.md) | Pages dashboard - functional spec |
| [specs/dashboard-pages-nfr.md](./specs/dashboard-pages-nfr.md) | Pages dashboard - NFRs |
| [specs/dashboard-usage-functional.md](./specs/dashboard-usage-functional.md) | Usage dashboard - functional spec |
| [specs/dashboard-usage-nfr.md](./specs/dashboard-usage-nfr.md) | Usage dashboard - NFRs |
| [specs/dashboard-api-keys-functional.md](./specs/dashboard-api-keys-functional.md) | API keys - functional spec |
| [specs/dashboard-api-keys-nfr.md](./specs/dashboard-api-keys-nfr.md) | API keys - NFRs |

---

## Key Technical Decisions

### Rendering Engine
- **Technology:** Puppeteer (headless Chrome)
- **Target:** <200ms p95 render speed
- **Caching:** Redis with 70%+ cache hit rate

### AI Crawler Detection
- **Coverage:** 15+ AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
- **Method:** User-agent pattern matching
- **Fallback:** Graceful degradation to raw HTML

### Infrastructure
- **CDN:** CloudFlare
- **Database:** Supabase (PostgreSQL)
- **Queue:** BullMQ
- **Monitoring:** PostHog + Sentry

---

## Related Documentation

- **Product Requirements:** [01-product/mvp-definition.md](../01-product/mvp-definition.md)
- **Setup Guides:** [05-reference/](../05-reference/)

---

*Technical questions? Check the specific document or ask in #engineering.*
