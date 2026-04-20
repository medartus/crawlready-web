# Research: Unified AI Readiness Score — Algorithm and Weighting

Design specification for CrawlReady's unified AI Readiness Score — a single 0-100 headline metric that consolidates the three sub-scores (Crawlability, Agent Readiness, Agent Interaction) into one shareable number. Compiled April 2026 as part of the VP Innovation Strategic Analysis.

---

## Why a Unified Score

### The Problem With Three Scores

The current diagnostic design displays three separate numeric scores:
- Crawlability Score (0-100)
- Agent Readiness Score (0-100)
- Agent Interaction Score (0-100)

Plus an EU AI Act Transparency Checklist (X/4).

This is five distinct information layers on a first visit. HubSpot Website Grader — the stated model for CrawlReady's diagnostic — uses **one number**. The guiding principle in `docs/product/vision.md` states: "The aha moment must happen in under 60 seconds." Three numeric scores compete for attention and dilute the viral sharing moment.

### What a Unified Score Enables

- **One number to share:** "My AI Readiness Score is 31" is tweetable. "My crawlability is 23, agent readiness is 12, and interaction is 45" is not.
- **One number to improve:** The CTA "Improve your score" is clear. "Improve your three scores" is muddled.
- **One number for the badge:** The opt-in badge displays a single metric: `AI Score: 72/100`.
- **One number for the URL:** `crawlready.app/score/stripe.com` shows one headline metric that visitors immediately understand.
- **One number for the MCP server:** `crawlready_scan` returns a single score that developers can reason about.
- **One number for Show HN:** "We scanned 20 SaaS sites — average AI Readiness Score: 34/100" is a stronger headline than listing three metrics.

### Sub-Scores Remain

The unified score does **not** replace the sub-scores. It is a weighted composite. The sub-scores are available on drill-down for users who want to understand where to focus their optimization efforts. The hierarchy is:

1. **Headline:** AI Readiness Score (0-100) — the shareable, viral metric
2. **Drill-down:** Three sub-scores explaining the breakdown
3. **Detail:** Per-factor scoring rubrics with specific recommendations
4. **Secondary:** EU AI Act Transparency Checklist (binary, expandable)

---

## Algorithm Design

### Weighted Composite

The unified AI Readiness Score is a weighted average of the three sub-scores:

```
AI Readiness Score = (w1 × Crawlability) + (w2 × Agent Readiness) + (w3 × Agent Interaction)
```

Where `w1 + w2 + w3 = 1.0`.

### Weight Selection Rationale

The weights must reflect:
1. **Current market reality** — crawlability is the most acute problem today (CSR invisibility)
2. **Future trajectory** — agent readiness and interaction are growing in importance
3. **CrawlReady's Phase 0 hook** — the CSR aha moment must dominate the headline score for Phase 0

**Selected weights:**

| Sub-Score | Weight | Rationale |
|---|---|---|
| Crawlability Score | **0.50** (50%) | The core problem CrawlReady solves. CSR sites scoring 0-20 on crawlability must see this reflected in the headline. The Phase 0 hook depends on crawlability driving the unified score. |
| Agent Readiness Score | **0.25** (25%) | The "there's more" moment. Structured data, content negotiation, and machine-actionable data are increasingly important as agents evaluate products. |
| Agent Interaction Score | **0.25** (25%) | The visual agent modality. Growing fast (Operator, Computer Use) but still earlier stage than text crawlers. Equal weight to Agent Readiness since both measure distinct agent capabilities. |

**Example calculations:**

| Site Type | Crawlability | Agent Readiness | Agent Interaction | Unified Score |
|---|---|---|---|---|
| Pure CSR SPA (no SSR) | 8 | 5 | 40 | **15** |
| SSR site with no Schema | 65 | 15 | 55 | **50** |
| Well-optimized SSR + Schema | 85 | 70 | 75 | **79** |
| Ideal (full optimization) | 95 | 90 | 90 | **93** |

The pure CSR SPA gets a devastating 15/100 — driven down by the 50% crawlability weight. This preserves the "your site is invisible" aha moment. The SSR site lands at 50/100 — mediocre, with clear room to improve on agent readiness.

### Why Not Equal Weights (33/33/33)?

Equal weights would give the pure CSR SPA a score of 18 instead of 15. More critically, an SSR site with decent semantic HTML (Agent Interaction: 70) but zero structured data (Agent Readiness: 5) and average content (Crawlability: 50) would score 42 — which doesn't feel "bad enough" to drive action. The 50% crawlability weight ensures that content visibility problems dominate the headline score, matching CrawlReady's Phase 0 messaging.

### Weight Evolution

The weights are not permanent. As the market evolves:
- If AI crawlers start rendering JavaScript (reducing the CSR problem), reduce the Crawlability weight
- If agent commerce takes off (UCP adoption continues accelerating), increase Agent Readiness weight
- If visual agents become dominant, increase Agent Interaction weight

The weights should be revisited after Phase 0 validation based on which sub-score resonates most with users (measured by score page engagement and drill-down click rates).

---

## Score Display Design

### Public Score Page (`crawlready.app/score/{domain}`)

```
┌─────────────────────────────────────────────────┐
│                                                   │
│            AI Readiness Score                     │
│                                                   │
│                  31                                │
│                 ───                                │
│                 100                                │
│                                                   │
│         "Your site is barely AI-ready"            │
│                                                   │
│  ┌───────────┬───────────┬──────────────┐        │
│  │ Crawl: 23 │ Agent: 12 │ Interact: 45 │        │
│  │  ■□□□□    │  ■□□□□    │  ■■□□□       │        │
│  └───────────┴───────────┴──────────────┘        │
│                                                   │
│  EU AI Act: 1/4 checks passed [expand ▼]         │
│                                                   │
│  [Run full diagnostic →]  [Fix this score →]     │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Score Interpretation Bands

| Range | Label | Color | Description |
|---|---|---|---|
| 0-20 | Critical | Red | Your site is invisible or broken for AI systems |
| 21-40 | Poor | Orange | Major gaps — AI crawlers and agents struggle with your content |
| 41-60 | Fair | Yellow | Partially visible — significant room for improvement |
| 61-80 | Good | Light green | Most content is AI-accessible with minor gaps |
| 81-100 | Excellent | Green | Fully AI-ready — crawlable, actionable, navigable |

### Score Messaging (Headline Text)

| Range | Message |
|---|---|
| 0-20 | "Your site is invisible to AI" |
| 21-40 | "Your site is barely AI-ready" |
| 41-60 | "Your site is partially AI-ready" |
| 61-80 | "Your site is mostly AI-ready" |
| 81-100 | "Your site is fully AI-ready" |

---

## Sub-Score Drill-Down

When a user clicks on a sub-score, the page expands to show the component breakdown:

### Crawlability Drill-Down (0-100)

Existing design from `docs/product/vision.md`:
- Content visibility ratio (what % of human-visible text is in the raw HTML)
- Structural clarity (headings, lists, semantic markup present?)
- Noise ratio (scripts, styles, tracking code as % of payload)
- Schema.org presence

### Agent Readiness Drill-Down (0-100)

Existing design from `docs/research/agent-readiness.md`:
- Structured Data Completeness (0-30 points)
- Content Negotiation Readiness (0-30 points)
- Machine-Actionable Data Availability (0-40 points)

### Agent Interaction Drill-Down (0-100)

Existing design from `docs/product/solution.md`:
- Semantic HTML Quality (0-25 points)
- Interactive Element Accessibility (0-30 points)
- Navigation & Content Structure (0-25 points)
- Visual-Semantic Consistency (0-20 points)

---

## Diagnostic Result Page — What's Visible vs. Gated (Phase 0)

The diagnostic result page has two visibility tiers: public (no email) and email-gated.

### Visible Without Email (Public)

Everything needed for the "aha moment" and sharing:

- **AI Readiness Score** — headline number with band label and color
- **Three sub-scores** — Crawlability, Agent Readiness, Agent Interaction with band labels
- **EU AI Act checklist** — X/4 checks passed, expandable to see which passed/failed
- **Visual diff** — side-by-side of browser view vs. AI crawler view, with missing sections highlighted
- **Top 3 recommendations** — text only, highest severity first
- **Schema generation preview** — "We detected 0 Schema.org types. CrawlReady can generate: FAQPage, Product." (detection + count, no JSON preview)
- **Shareable URL** — `crawlready.app/score/{domain}` displayed prominently with copy button
- **"Track your AI crawler visits" CTA** — links to Clerk sign-up for analytics onboarding

### Gated Behind Email (Lightweight Capture)

User enters email in a modal/inline form. No account creation. Stored in `subscribers` table.

- **Full recommendation list** — all recommendations with severity, detail, and fix instructions
- **Schema generation JSON preview** — expandable JSON-LD preview for each detectable type
- **PDF export** — downloadable report of the full diagnostic
- **"Notify me when score changes"** — opt-in for periodic rescan notifications

### Not Built in Phase 0

- Historical score tracking ("your score over time")
- Alerts ("GPTBot visited /pricing 89 times")
- Dashboard analytics
- Schema generation + injection (paid tier, Phase 1-2)

### Conversion Flow

```
Enter URL → Scan → Result Page (public)
                      │
                      ├── Share URL → viral loop
                      ├── "See full recommendations" → email capture
                      ├── "Track AI crawlers" → Clerk sign-up (analytics onboarding)
                      └── "Fix this score" → email capture (leads for Phase 2 paid tier)
```

---

## Integration Points

### Score URL

The public score URL displays the unified score as the headline:
`crawlready.app/score/stripe.com` → "AI Readiness Score: 31/100"

### Opt-In Badge

The badge displays the unified score:
`AI Score: 31/100` (clean) or `AI Score: 31/100 · Powered by CrawlReady` (branded)

### MCP Server

The `crawlready_scan` tool returns the unified score as the primary metric:
```json
{
  "ai_readiness_score": 31,
  "crawlability": 23,
  "agent_readiness": 12,
  "agent_interaction": 45,
  "eu_ai_act_checks": { "passed": 1, "total": 4 }
}
```

### npm CLI

```
$ npx crawlready scan https://example.com

AI Readiness Score: 31/100
  Crawlability:     23/100  ■□□□□
  Agent Readiness:  12/100  ■□□□□
  Agent Interaction: 45/100  ■■□□□

Full report: https://crawlready.app/score/example.com
```

### AI Crawler Analytics Dashboard

The analytics dashboard references the unified score in alerts:
```
GPTBot visited /pricing 89 times this month.
Your AI Readiness Score for /pricing is 15/100 (Critical).
[Fix this →]
```

---

## Backward Compatibility With Existing Documentation

The existing documentation defines three separate scores with a display hierarchy (primary/secondary/tertiary). The unified score sits **above** this hierarchy as a composite:

- **Old:** Crawlability Score (primary) → Agent Readiness + Agent Interaction (secondary) → EU compliance (tertiary)
- **New:** AI Readiness Score (headline, unified) → Crawlability Score (primary sub-score) → Agent Readiness + Agent Interaction (secondary sub-scores) → EU compliance (tertiary)

The sub-scores and their rubrics remain unchanged. The unified score is purely additive — a weighted composite that provides a single headline metric without removing any existing detail.

---

## Decisions

- **Weight selection:** 50/25/25 (Crawlability/Agent Readiness/Agent Interaction). Crawlability dominates because it is the Phase 0 hook. Weights are revisited after Phase 0 based on user engagement data.
- **Score name:** "AI Readiness Score" — not "AI Crawlability Score" (too narrow) or "CrawlReady Score" (too branded for a metric).
- **Display:** Unified score is the headline on all surfaces (score page, badge, MCP, CLI). Sub-scores are on drill-down.
- **Rounding:** Unified score is rounded to the nearest integer. No decimal points.
- **Minimum sub-score floor:** The unified score cannot exceed 60 if any sub-score is below 20. This prevents a site with excellent semantic HTML (Interaction: 90) but invisible content (Crawlability: 5) from getting a misleadingly high unified score. The floor ensures that critical problems in any dimension keep the headline score in the "Poor" or "Fair" range.
