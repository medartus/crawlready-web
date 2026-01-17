# CrawlReady Product Strategy

**Last Updated:** January 2026
**Purpose:** Product vision, strategy, and roadmap for CrawlReady.

---

## Quick Navigation

| Document | Description | When to Use |
|----------|-------------|-------------|
| [Product Strategy](./product-strategy.md) | Product vision, principles, architecture | Understanding product direction |
| [Feature Roadmap](./feature-roadmap.md) | Prioritized features by phase | Planning, resource allocation |
| [MVP Definition](./mvp-definition.md) | What's in/out of MVP | Launch preparation |
| [Onboarding Strategy](./onboarding-strategy.md) | Onboarding philosophy and flow | User activation |

---

## Product Summary

### What We Build

**CrawlReady** is an AI crawler optimization platform that:

1. **Detects AI Crawlers** - Identifies GPTBot, ClaudeBot, PerplexityBot, and 15+ AI crawlers
2. **Renders JavaScript** - Converts dynamic content to static HTML in <200ms
3. **Tracks Citations** - Monitors when AI platforms cite your content
4. **Optimizes for LLMs** - Injects schema and markup AI models understand

### Who We Build For

| Priority | Persona | Need |
|----------|---------|------|
| Primary | Technical Founders | Fast setup, no maintenance |
| Secondary | VP Marketing | Citation tracking, competitive intel |
| Tertiary | E-commerce | Product visibility in AI |

### Core Value Proposition

> "Get cited in ChatGPT answers without rebuilding your site. Setup in 5 minutes."

---

## Product Principles

### 1. Developer Experience First
Every feature must be simple to implement. If it takes more than 5 minutes, we've failed.

### 2. AI-First Design
We build for AI crawlers, not as an afterthought. Every decision optimizes for LLM comprehension.

### 3. Performance Obsession
<200ms render speed is non-negotiable. Fast is a feature.

### 4. Transparent by Default
Public status page, clear documentation, no hidden complexity.

### 5. Build What Competitors Won't
Citation tracking, schema injection, AI analytics - these create our moat.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────>│   Gateway    │────>│   Router    │
│   Request   │     │ (Detection)  │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
              ┌─────▼─────┐              ┌─────▼─────┐              ┌──────▼──────┐
              │  Regular  │              │    AI     │              │   Static    │
              │   User    │              │  Crawler  │              │   Assets    │
              │  (Pass)   │              │ (Render)  │              │   (CDN)     │
              └───────────┘              └─────┬─────┘              └─────────────┘
                                               │
                                         ┌─────▼─────┐
                                         │  Render   │
                                         │  Worker   │
                                         └─────┬─────┘
                                               │
                                         ┌─────▼─────┐
                                         │   Cache   │
                                         │   Layer   │
                                         └───────────┘
```

---

## Related Documentation

- **Strategy:** [00-strategy/](../00-strategy/)
- **Go-to-Market:** [02-go-to-market/](../02-go-to-market/)
- **Technical Specs:** [04-technical/](../04-technical/)

---

*Product questions? Start with [Product Strategy](./product-strategy.md).*
