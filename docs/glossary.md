# Glossary — Canonical Terminology

Single source of truth for CrawlReady terminology. All docs, UI, blog posts, and code should use these exact terms.

---

## Scores

| Canonical Term | Definition | NOT This |
|---|---|---|
| **AI Readiness Score** | Unified headline metric (0-100). Weighted composite: 50% Crawlability + 25% Agent Readiness + 25% Agent Interaction. | "AI Crawlability Score" (old name), "CrawlReady Score" |
| **Crawlability Score** | Sub-score (0-100). Can AI crawlers see your content? | "AI Crawlability Score" (drop the "AI" prefix for sub-scores) |
| **Agent Readiness Score** | Sub-score (0-100). Can AI agents act on your content? | |
| **Agent Interaction Score** | Sub-score (0-100). Can visual AI agents navigate your site? | |
| **EU AI Act Transparency Checklist** | Binary checklist (X/4 checks passed). Not a numeric score. | "EU compliance score", "transparency score" |

## Product

| Canonical Term | Definition | NOT This |
|---|---|---|
| **Diagnostic** | The free URL scan tool — enter a URL, get scores + visual diff + recommendations. | "scanner", "audit" |
| **Score page** | Public page at `crawlready.app/score/{domain}`. | "score URL", "results page" |
| **Visual diff** | Side-by-side comparison of browser view vs. AI crawler view. | "side-by-side", "diff view" |
| **Schema generation preview** | Phase 0 display-only feature showing what Schema.org types CrawlReady could generate. | "Schema audit" |

## Architecture

| Canonical Term | Definition | NOT This |
|---|---|---|
| **Crawling SaaS provider** | The external service used for JS-rendered page scraping. Provider-agnostic — currently evaluating Firecrawl, Scrape.do, etc. | "Firecrawl" (unless referring to the specific provider) |
| **Site key** | The `cr_live_...` key issued to registered sites for the ingest endpoint. | "API key" (misleading — it's semi-public) |
| **Ingest endpoint** | `POST /api/v1/ingest` — receives AI crawler visit beacons from customer middleware. | "analytics endpoint", "beacon endpoint" |
| **Canonical base URL** | `crawlready.app/api/v1/*` — no subdomain, no separate API host. | `api.crawlready.app/v1/*` (old, wrong) |

## Auth

| Canonical Term | Definition | NOT This |
|---|---|---|
| **Clerk** | Authentication provider for site registration, analytics onboarding, future dashboard. | "Supabase Auth" (deprecated — Supabase is DB only) |
| **Email capture** | Lightweight email collection for diagnostic gated features. No account creation. | "signup", "registration" (those imply Clerk account) |

## Scope

| Canonical Term | Definition | NOT This |
|---|---|---|
| **Phase 0** | Landing page + diagnostic + analytics onboarding with ingest. Three deliverables. | "2 deliverables" (old, superseded) |
| **Pre-seeded sites** | 20 sites scanned before launch for screenshots and Show HN content. | "200 sites" (old — 200 is Phase 1) |
| **Show HN** | Sole Phase 0 distribution channel. | "Product Hunt", "multi-channel launch" |

---

## Decisions

- **"AI Readiness Score"** is the only headline metric name. "AI Crawlability Score" is retired as a headline — it now refers only to the Crawlability sub-score.
- **Sub-scores do not have the "AI" prefix.** It's "Crawlability Score", not "AI Crawlability Score."
- **"Firecrawl"** should only appear when referring to the specific provider. Generic references use "crawling SaaS provider" or "crawling provider."
- **"Supabase Auth"** is no longer part of the stack. Clerk handles all authentication.
- **Ingest URL** is `crawlready.app/api/v1/ingest` — no subdomain.
