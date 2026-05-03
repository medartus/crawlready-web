---
name: CrawlReady
description: AI readiness platform — scores and optimizes websites for AI crawlers and agents
---

# Design System: CrawlReady

## 1. Overview

**Creative North Star: "The Clear Signal"**

In a landscape of SEO hype and AI marketing noise, CrawlReady is the clear signal. Every element exists to clarify, not to decorate. The tool is the hero, not the chrome around it.

**Scene:** A technical founder at their desk, well-lit office, 27-inch display, 15 browser tabs open. Evaluating, not browsing. Skeptical. Will leave in 10 seconds if the page looks templated.

**Theme:** Light. The user works in ambient daylight. Dark mode is not a Phase 0 priority.

**Color strategy:** Restrained. Tinted neutrals plus one accent color (indigo-violet, hue 275). Score severity bands are the only multi-color system, and they are purely functional.

**Key Characteristics:**
- Data-forward: scores, diffs, and recommendations are first-class visual citizens
- Generous negative space: density is earned, not default
- Systematic: one type scale, one spacing scale, one color system
- Warm precision: technical without feeling cold; human without feeling soft

## 2. Colors

OKLCH color space. All values defined as `L% C H` triplets. One brand hue (275, indigo-violet) anchors everything. Score colors are the only exception: five distinct hues, used exclusively to encode severity.

### 2.1 Primary (Hue 275, Indigo-Violet)

| Token | OKLCH | Role |
|---|---|---|
| `--cr-primary` | `52% 0.14 275` | Buttons, links, active states, brand accents |
| `--cr-primary-hover` | `45% 0.16 275` | Hover/pressed state (darker, slightly more saturated) |
| `--cr-primary-soft` | `92% 0.03 275` | Selected backgrounds, subtle highlights |
| `--cr-primary-fg` | `98% 0.005 275` | Text on primary-colored surfaces |

### 2.2 Neutrals (Hue 275, Low Chroma)

Every neutral carries a faint indigo undertone. No pure black, no pure white.

| Token | OKLCH | Role |
|---|---|---|
| `--cr-bg` | `98.5% 0.004 275` | Page background |
| `--cr-surface` | `96% 0.006 275` | Section backgrounds, card fills |
| `--cr-surface-raised` | `93.5% 0.008 275` | Elevated surfaces (dropdowns, popovers) |
| `--cr-border` | `90% 0.01 275` | Standard borders, dividers |
| `--cr-border-subtle` | `93% 0.006 275` | Subtle separators, inactive borders |
| `--cr-fg` | `22% 0.02 275` | Primary text, headings |
| `--cr-fg-secondary` | `45% 0.015 275` | Secondary text, labels, descriptions |
| `--cr-fg-muted` | `60% 0.01 275` | Placeholder text, disabled states, captions |

### 2.3 Score Colors (Semantic, Severity-Only)

Each band has a foreground (text, ring strokes) and a soft variant (background tints). These colors never appear outside score-related UI.

| Band | Score Range | Foreground OKLCH | Soft OKLCH | Hue |
|---|---|---|---|---|
| Critical | 0-20 | `55% 0.22 25` | `95% 0.015 25` | Red |
| Poor | 21-40 | `62% 0.16 55` | `95% 0.015 55` | Orange |
| Fair | 41-60 | `72% 0.14 85` | `95% 0.02 85` | Yellow-olive |
| Good | 61-80 | `58% 0.14 155` | `95% 0.02 155` | Teal |
| Excellent | 81-100 | `55% 0.15 165` | `94% 0.025 165` | Cyan-teal |

### 2.4 Color Rules

- Every color use traces to a named token. If it doesn't have a token, it doesn't belong.
- Chroma decreases as lightness approaches 0% or 100%. High chroma at extremes looks garish.
- No gradients between brand colors. No gradient fills on buttons, text, or the logo.
- Score colors are functional. They encode severity. They are never decorative.

## 3. Typography

**Sans:** Geist Sans (variable weight). Loaded via `next/font/local`. Used for all text.
**Mono:** Geist Mono. Used for URLs, domains, code snippets, score numbers, technical values.

One sans-serif family throughout. Hierarchy through weight and scale, never by mixing families.

### 3.1 Type Scale

| Level | Weight | Size | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| Display | 300 | `clamp(2.25rem, 5vw, 3.5rem)` | 1.1 | -0.02em | Hero headline. One per page max. |
| Headline | 600 | `clamp(1.5rem, 3vw, 2rem)` | 1.2 | -0.01em | Section titles |
| Title | 500 | `1.25rem` | 1.3 | 0 | Card titles, subsection headers |
| Body | 400 | `1rem` | 1.6 | 0 | Running text. Max 65-75ch per line. |
| Label | 500 | `0.875rem` | 1.4 | 0.02em | UI labels, metadata, badges, nav |
| Caption | 400 | `0.75rem` | 1.5 | 0.01em | Timestamps, footnotes, fine print |

### 3.2 Type Rules

- Adjacent scale levels differ by at least 1.25x. If two text elements look the same size, one is wrong.
- Body text never exceeds 75ch. Use `max-w-prose` or equivalent.
- Geist Mono for anything the user might copy, paste, or act on: URLs, code, scores, domains.
- No italic for emphasis. Use weight change (400 to 600) or color shift (`--cr-fg` to `--cr-fg-secondary` inverse).

## 4. Spacing

8px base unit. All spacing derives from this scale. Use Tailwind's spacing utilities (`space-1` = 4px, `space-2` = 8px, etc.).

| Token | Value | Typical Use |
|---|---|---|
| 1 | 4px | Inline gaps, icon-to-text spacing |
| 2 | 8px | Tight component internal padding |
| 3 | 12px | Input padding, compact gaps |
| 4 | 16px | Standard component padding |
| 6 | 24px | Section inner padding, card padding |
| 8 | 32px | Component-to-component gaps |
| 12 | 48px | Section gaps |
| 16 | 64px | Major section vertical spacing |
| 24 | 96px | Hero section vertical padding |

### Spacing Rules

- Vary spacing for rhythm. Same padding everywhere is monotony.
- Tighter inside, looser outside. Component internal padding < gap between components < section separation.
- No arbitrary values (`mt-[37px]`). If it's not on the scale, it doesn't belong.

## 5. Elevation

Flat by default. Depth through tonal layering (`--cr-bg` < `--cr-surface` < `--cr-surface-raised`), not shadows.

Shadows appear only as response to state:

| State | Shadow | Use |
|---|---|---|
| Hover | `0 2px 8px oklch(22% 0.02 275 / 0.06)` | Interactive card lift |
| Focus | 2px ring, `--cr-primary` at 40% opacity | Keyboard focus indicator |
| Float | `0 4px 16px oklch(22% 0.02 275 / 0.08)` | Dropdowns, popovers, modals |

### Elevation Rules

- Flat at rest. If a shadow is visible without interaction, justify it or remove it.
- Diffuse only. Large blur radius, low opacity. No hard edges, no visible shadow outlines.
- Tonal layering is the primary depth signal. Three levels (bg, surface, surface-raised) cover most needs.

## 6. Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius` | 8px (0.5rem) | Default for all interactive elements |
| `--radius-sm` | 6px (0.375rem) | Badges, inline tags |
| `--radius-lg` | 12px (0.75rem) | Cards, modals, major containers |
| `--radius-full` | 9999px | Pills, avatar circles, score gauges |

## 7. Motion

All animations respect `prefers-reduced-motion: reduce`. When active, all transitions resolve at duration 0.

### 7.1 Easing Curves

| Name | Value | Use |
|---|---|---|
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Primary settle curve (panels, reveals) |
| `ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Subtle settles (hover feedback) |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Reversible transitions (tabs, toggles) |

### 7.2 Durations

| Token | Duration | Use |
|---|---|---|
| Fast | 120ms | Hover color changes, small state feedback |
| Normal | 200ms | Standard transitions (button press, tab switch) |
| Slow | 350ms | Panel reveals, major state changes |
| Score | 700ms | Score gauge ring fill (signature animation) |

### 7.3 Motion Rules

- No bounce. No elastic. Ease out with exponential curves only.
- Never animate layout properties (width, height, top, left). Use `transform` and `opacity`.
- The score gauge ring fill is the single permitted "moment": the ring fills from 0 to the score value on first render, `ease-out-expo`, 700ms. This is the product's signature animation.

## 8. Iconography

Lucide icons throughout.

| Context | Size | Notes |
|---|---|---|
| Inline (labels, buttons) | 16px | Vertically centered with text |
| Standard (actions, nav) | 20px | Default |
| Feature / empty state | 24px | Paired with explanatory text |

- Stroke width: 1.5 (Lucide default)
- Color: `currentColor` (inherits from parent text)
- Stroke-only. No filled icon variants.
- No emoji in product UI. Lucide icons or plain text only.

## 9. Score Visualization

The score system is CrawlReady's signature UI. It must be consistent everywhere it appears: score pages, scan results, OG images, badges.

### 9.1 Score Gauge

A circular SVG ring that fills clockwise from the top.

- **Background ring:** `--cr-border` stroke
- **Foreground ring:** Stroke color from the score band (Section 2.3)
- **Number:** Centered inside the ring, Geist Mono, bold
- **Band label:** Below the gauge ("Critical" / "Poor" / "Fair" / "Good" / "Excellent"), colored to match the band
- **Three sizes:** sm (80px diameter), md (120px), lg (180px)
- **Animation:** Ring fills from 0 to score on first render. 700ms, ease-out-expo.

### 9.2 Score Page Hierarchy

1. **Headline:** AI Readiness Score, large gauge (lg size). One number. This is the shareable moment.
2. **Sub-scores:** Three smaller gauges (Crawlability, Agent Readiness, Agent Interaction) on a single row. Equal visual weight. Not stacked.
3. **Detail:** Per-check breakdown. Pass/fail indicators using score band colors.
4. **Recommendations:** Prioritized list. Severity-coded with band colors. Actionable, not diagnostic.

### 9.3 Score Messages

| Band | Message |
|---|---|
| Critical | "Your site is invisible to AI crawlers. Immediate action required." |
| Poor | "AI crawlers struggle to read your site. Major improvements needed." |
| Fair | "Partially visible to AI, but significant gaps remain." |
| Good | "AI crawlers can see most of your content. Small optimizations left." |
| Excellent | "Your site is fully optimized for AI crawlers." |

## 10. Components

### Buttons
- **Primary:** Solid `--cr-primary` fill, `--cr-primary-fg` text. Hover: `--cr-primary-hover`. No gradients.
- **Secondary/Ghost:** Transparent, `--cr-primary` text. Hover: `--cr-primary-soft` background.
- **Outline:** `--cr-border` stroke, `--cr-fg` text. Hover: `--cr-surface` background.
- All buttons use `--radius` (8px). Padding: 12px vertical, 16px horizontal (sm), 24px horizontal (default).

### Inputs
- Border: `--cr-border`. Fill: `--cr-bg`.
- Focus: 2px ring using `--cr-primary` at 40% opacity.
- Padding: 12px vertical, 16px horizontal.
- Placeholder text: `--cr-fg-muted`.

### Cards
Used sparingly. Tonal background (`--cr-surface`) preferred over visible borders. No nested cards. No decorative borders. No accent stripes.

### Navigation
- Active state: weight change (400 to 600) or 2px bottom border in `--cr-primary`. Not a background highlight.
- Mobile: slide panel from the right edge. Not a full-screen overlay.

### The Diagnostic Tool
The landing page hero is the working diagnostic input. A real URL field that triggers a real scan. Not a screenshot, not a mock, not an illustration. The tool demonstrates its own value.

## 11. Layout

### Container
- Max width: 1280px (`max-w-7xl`)
- Horizontal padding: 16px (mobile), 24px (tablet), 32px (desktop)

### Content Width
- Prose/body text: max 65-75ch
- Data tables, comparisons: full container width
- Score pages: centered, narrower than full container

### Section Rhythm
- Hero: 96px vertical padding
- Major sections: 64px vertical padding
- Sub-sections: 32-48px vertical padding
- Within sections: 16-24px component gap

## 12. Do's and Don'ts

### Do
- Use the OKLCH token system for every color. Trace each use to a named token.
- Tint every neutral toward hue 275. No pure grays.
- Put the working diagnostic tool in the landing hero, not a screenshot.
- Use generous negative space. Let the data breathe.
- Use Geist Mono for URLs, domains, code, and score numbers.
- Provide motion feedback on hover, focus, and active states.
- Use real scan data in all examples and marketing screenshots.

### Don't
- Don't use gradient text (`background-clip: text`).
- Don't use gradient fills on buttons, logos, or backgrounds.
- Don't use generic SaaS template layouts (hero + three cards + pricing).
- Don't replicate SEO dashboard density.
- Don't use neon-on-dark aesthetics, glow effects, or particle backgrounds.
- Don't use scroll-driven choreography or decorative parallax.
- Don't use accent stripes (`border-left` or `border-right` > 1px as colored accents).
- Don't use glassmorphism or decorative blur.
- Don't use `#000` or `#fff`. Every neutral is tinted.
- Don't use bounce or elastic easing.
- Don't animate layout properties (width, height, top, left).
- Don't use em dashes in UI copy.
- Don't use emoji in product UI.
- Don't use stock photos, illustrations, or abstract art. The product's own output is the visual content.
