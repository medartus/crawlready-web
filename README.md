# CrawlReady

An API-first AI readiness platform that scores, monitors, and optimizes websites for AI crawlers and agents.

## The Problem

Modern websites built with JavaScript frameworks (React, Next.js, Vue) are partially or completely invisible to AI crawlers. Bots from ChatGPT, Claude, Perplexity, and Google AI Overviews read only server-rendered HTML — they do not execute JavaScript. Dynamically loaded content is never seen by AI engines, and the site gets ignored in AI-generated answers.

## The Solution

CrawlReady produces a free **AI Readiness Score** (0-100) with a visual diff showing exactly what AI crawlers see versus what humans see. The paid tier intercepts AI crawler requests and serves clean, structured, format-appropriate content while human visitors see the normal site.

## Status

**Research complete. Building Phase 0** — landing page + working diagnostic at [crawlready.app](https://crawlready.app).

## Documentation

### Product Strategy
- [Problem](docs/product/problem.md) — why AI crawler invisibility is a real and growing issue
- [Solution](docs/product/solution.md) — technical approach and product design
- [Market](docs/product/market.md) — competitive landscape (17+ competitors)
- [Business Model](docs/product/business-model.md) — pricing, ICP, unit economics
- [Vision](docs/product/vision.md) — phased roadmap

### Technical Architecture
- [API-First Architecture](docs/architecture/api-first.md) — endpoints, data model, auth
- [Scoring Algorithm](docs/architecture/scoring-algorithm.md) — AI Readiness Score design
- [Multi-Format Serving](docs/architecture/multi-format-serving.md) — per-client content optimization
- [Crawler Analytics](docs/architecture/crawler-analytics.md) — middleware and dashboard spec

### Research
- [Differentiation](docs/research/differentiation.md) — competitive strategy
- [Distribution](docs/research/distribution-strategy.md) — 12-channel go-to-market
- [Validation Experiment](docs/research/validation-experiment.md) — Phase 0 experiment design
- [All research docs](docs/research/)

### Decisions
- [Key Decisions](docs/decisions/key-decisions.md) — all major product/tech/business decisions
- [Review Findings](docs/decisions/review-findings.md) — findings from 5 review rounds
- [Open Questions](docs/decisions/open-questions.md) — 34 questions answered with sources
