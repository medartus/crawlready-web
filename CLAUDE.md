# CrawlReady

An API-first AI readiness platform that scores, monitors, and optimizes websites for AI crawlers and agents. Produces a headline AI Readiness Score (0-100) with three sub-scores: Crawlability (50%), Agent Readiness (25%), Agent Interaction (25%). Positioned as "the AI interface layer" between websites and AI.

## Status

Research complete (April 2026). Ready to build Phase 0. No code exists yet.

Phase 0 scope: landing page + working diagnostic + analytics onboarding with ingest at crawlready.app.

## Documentation Map

```
docs/
├── product/                 # Product strategy (what & why)
│   ├── vision.md            #   Phased roadmap, bandwidth reality check
│   ├── problem.md           #   Pain points, ICP segmentation
│   ├── solution.md          #   Technical approach, bot verification, cache
│   ├── business-model.md    #   Pricing, unit economics, revenue targets
│   └── market.md            #   17+ competitors, landscape analysis
│
├── architecture/            # Technical specs (how to build it)
│   ├── api-first.md         #   API-first architecture, endpoints, data model
│   ├── scoring-algorithm.md #   Unified AI Readiness Score algorithm
│   ├── scoring-detail.md    #   Implementable scoring rubrics (check-by-check)
│   ├── crawling-provider.md #   Crawling SaaS provider comparison
│   ├── analytics-onboarding.md # Clerk auth + site registration flow
│   ├── multi-format-serving.md  # Multi-format content serving per AI client
│   ├── crawler-analytics.md #   AI Crawler Analytics feature spec
│   └── scan-output-specification.md # Scan output rules: evidence, interpretation, actions
│
├── research/                # Market research & deep dives
│   ├── agent-readiness.md   #   Agent Readiness Score design
│   ├── ai-crawler-pain.md   #   Scale of the AI crawler problem
│   ├── differentiation.md   #   Diagnostic-first + transparency strategy
│   ├── distribution-strategy.md # 12-channel distribution plan
│   ├── dual-web.md          #   Cloaking risk analysis
│   ├── eu-ai-act-compliance.md  # EU AI Act Article 50 messaging
│   ├── geo-landscape.md     #   GEO market size and players
│   ├── monitoring-integration.md # B2B2B "fix layer" partnerships
│   ├── validation-experiment.md  # Phase 0 experiment design
│   └── sources.md           #   Research source list
│
└── decisions/               # Decision records
    ├── open-questions.md    #   All 34 questions answered with sources
    ├── key-decisions.md     #   Every major product/tech/business decision
    └── review-findings.md   #   Findings from all 5 review rounds
```

## Start Here

For any new session, read in this order based on what you need:

**Building the product:**
1. `docs/architecture/api-first.md` — Phase 0 API spec, endpoints, data model
2. `docs/architecture/scoring-detail.md` — implementable scoring rubrics (check-by-check)
3. `docs/architecture/crawling-provider.md` — crawling SaaS provider comparison
4. `docs/architecture/analytics-onboarding.md` — Clerk auth + site registration
5. `docs/architecture/scan-output-specification.md` — scan output rules, recommendation engine, visual diff spec
6. `docs/product/solution.md` — technical approach, bot verification matrix

**Understanding the business:**
1. `docs/product/problem.md` — the pain point
2. `docs/product/vision.md` — phased roadmap
3. `docs/product/market.md` — competitive landscape (17+ competitors)
4. `docs/product/business-model.md` — pricing, unit economics

**Reviewing decisions:**
1. `docs/decisions/key-decisions.md` — all major decisions in one place
2. `docs/decisions/review-findings.md` — findings from 5 review rounds
3. `docs/decisions/open-questions.md` — full 34-question research log

## Key Constraints

- Phase 0 = landing page + diagnostic + analytics onboarding with ingest. See `docs/product/vision.md` for canonical scope.
- Solo founder, 15-20 hrs/week. Scope discipline is survival.
- Crawling SaaS provider for crawling (no self-hosted Playwright until Phase 2). See `docs/architecture/crawling-provider.md`.
- Pricing: Starter $29/mo (500 crawls), Pro $49/mo (2,500), Business $199/mo (10K)
- Validate crawling provider costs in week 1 with 100 test crawls
- Two genuinely unique differentiators: (1) visual diff diagnostic, (2) public shareable score URLs
- ICP: all JS-heavy sites (CSR + SSR + hybrid), not just pure CSR SPAs

## Tech Stack (Phase 0)

- Framework: Next.js (App Router)
- Language: TypeScript
- Database: Supabase (PostgreSQL) — database only, no Supabase Auth
- Auth: Clerk (`@clerk/nextjs`) — site registration, analytics onboarding
- Crawling: Crawling SaaS provider (see `docs/architecture/crawling-provider.md`)
- Deployment: Vercel
- Domain: crawlready.app

## Commands

_To be added when code exists._

## Conventions

- All docs are Markdown, no HTML
- Factual, direct language — no marketing copy
- Every doc ends with a `## Decisions` section
- Use `## Key Facts` sections with bullet-point data

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
