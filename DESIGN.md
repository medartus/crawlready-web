---
name: CrawlReady
description: The AI interface layer — helps websites communicate with AI crawlers, agents, and commerce systems
---

# Design System: CrawlReady

## 1. Overview

**Creative North Star: "The Clear Signal"**

CrawlReady is the interface layer between websites and AI. In a landscape of SEO dashboards and marketing noise, every element exists to clarify a relationship the site owner has never seen: how AI systems actually perceive, parse, and interact with their site. The product is the hero, not the chrome around it.

**Scene:** A technical founder at their desk, well-lit office, 27-inch display, 15 browser tabs open. Evaluating, not browsing. Skeptical. Will leave in 10 seconds if the page looks templated.

**Theme:** Dual. Dark sections (deep indigo-black) for hero, brand storytelling, and footer. Light sections (tinted white) for evidence, data, and product surfaces. The contrast between dark brand moments and light content sections creates visual rhythm and hierarchy.

**Color strategy:** One brand hue (275, indigo-violet) at high chroma for accent, low chroma for neutrals. Dark and light surface palettes derived from the same hue. Score severity bands are the only multi-hue system.

**Key Characteristics:**
- Evidence-first: data and measured outcomes are first-class visual citizens, not decoration
- Dual-surface rhythm: dark sections command attention, light sections invite inspection
- Generous negative space: density is earned, not default
- Systematic: one type scale, one spacing scale, one color system across both themes
- Warm precision: technical without feeling cold; human without feeling soft
- Trust through transparency: openness and provability over polish

## 2. Colors

OKLCH color space. All values defined as `L% C H` triplets. One brand hue (275, indigo-violet) anchors everything. Score colors are the only exception: five distinct hues, used exclusively to encode severity.

### 2.1 Primary (Hue 275, Indigo-Violet)

| Token | OKLCH | Role |
|---|---|---|
| `--cr-primary` | `55% 0.22 275` | Buttons, links, active states, brand accents |
| `--cr-primary-hover` | `48% 0.24 275` | Hover/pressed state (darker, slightly more saturated) |
| `--cr-primary-light` | `72% 0.18 275` | Accent text on dark surfaces (hero keyword, stat numbers) |
| `--cr-primary-soft` | `92% 0.03 275` | Selected backgrounds, subtle highlights (light surfaces) |
| `--cr-primary-fg` | `98% 0.005 275` | Text on primary-colored surfaces |

### 2.2 Light Surface Neutrals (Hue 275, Low Chroma)

For evidence sections, content panels, and product UI. Every neutral carries a faint indigo undertone.

| Token | OKLCH | Role |
|---|---|---|
| `--cr-bg` | `98.5% 0.004 275` | Page background (light sections) |
| `--cr-surface` | `96% 0.006 275` | Card fills, section backgrounds |
| `--cr-surface-raised` | `93.5% 0.008 275` | Elevated surfaces (dropdowns, popovers) |
| `--cr-border` | `90% 0.01 275` | Standard borders, dividers |
| `--cr-border-subtle` | `93% 0.006 275` | Subtle separators, inactive borders |
| `--cr-fg` | `22% 0.02 275` | Primary text, headings |
| `--cr-fg-secondary` | `45% 0.015 275` | Secondary text, labels, descriptions |
| `--cr-fg-muted` | `60% 0.01 275` | Placeholder text, disabled states, captions |

### 2.3 Dark Surface Neutrals (Hue 275, Low Chroma)

For hero, brand storytelling sections, and footer. Deep indigo-black, never pure black.

| Token | OKLCH | Role |
|---|---|---|
| `--cr-dark-bg` | `16% 0.03 275` | Dark section background |
| `--cr-dark-surface` | `20% 0.035 275` | Raised surfaces on dark (cards, code blocks) |
| `--cr-dark-border` | `28% 0.03 275` | Borders, dividers on dark sections |
| `--cr-dark-fg` | `97% 0.005 275` | Primary text on dark |
| `--cr-dark-fg-secondary` | `75% 0.01 275` | Secondary text, descriptions on dark |
| `--cr-dark-fg-muted` | `55% 0.015 275` | Muted text, captions on dark |

### 2.4 Score Colors (Semantic, Severity-Only)

Each band has a foreground (text, ring strokes) and a soft variant (background tints). These colors never appear outside score-related UI.

| Band | Score Range | Foreground OKLCH | Soft OKLCH | Hue |
|---|---|---|---|---|
| Critical | 0-20 | `55% 0.22 25` | `95% 0.015 25` | Red |
| Poor | 21-40 | `62% 0.16 55` | `95% 0.015 55` | Orange |
| Fair | 41-60 | `72% 0.14 85` | `95% 0.02 85` | Yellow-olive |
| Good | 61-80 | `58% 0.14 155` | `95% 0.02 155` | Teal |
| Excellent | 81-100 | `55% 0.15 165` | `94% 0.025 165` | Cyan-teal |

### 2.5 Color Rules

- Every color use traces to a named token. If it doesn't have a token, it doesn't belong.
- Chroma decreases as lightness approaches 0% or 100%. High chroma at extremes looks garish.
- `--cr-primary-light` is for accent text on dark surfaces only (hero keyword, stat callouts). Never use it on light backgrounds.
- No gradient fills on buttons or the logo. Gradient/glow effects are permitted only on dark sections for brand illustration elements.
- Score colors are functional. They encode severity. They are never decorative.
- No pure black (`#000`) or pure white (`#fff`). Every neutral is tinted toward hue 275.

## 3. Typography

**Sans:** Geist Sans (variable weight). Loaded via `next/font/local`. Used for all text.
**Mono:** Geist Mono. Used for URLs, domains, code snippets, score numbers, technical values.

One sans-serif family throughout. Hierarchy through weight and scale, never by mixing families.

### 3.1 Type Scale

| Level | Weight | Size | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| Display | 700 | `clamp(2.25rem, 5vw, 3.5rem)` | 1.1 | -0.02em | Hero headline. One per page max. Bold, high contrast. |
| Headline | 600 | `clamp(1.5rem, 3vw, 2rem)` | 1.2 | -0.01em | Section titles |
| Title | 500 | `1.25rem` | 1.3 | 0 | Card titles, subsection headers |
| Body | 400 | `1rem` | 1.6 | 0 | Running text. Max 65-75ch per line. |
| Label | 500 | `0.875rem` | 1.4 | 0.02em | UI labels, metadata, badges, nav |
| Overline | 600 | `0.75rem` | 1.5 | 0.08em | Section category labels, uppercase. "THE PROBLEM", "THE SOLUTION". |
| Caption | 400 | `0.75rem` | 1.5 | 0.01em | Timestamps, footnotes, fine print |

### 3.2 Type Rules

- Adjacent scale levels differ by at least 1.25x. If two text elements look the same size, one is wrong.
- Body text never exceeds 75ch. Use `max-w-prose` or equivalent.
- Geist Mono for anything the user might copy, paste, or act on: URLs, code, scores, domains.
- No italic for emphasis. Use weight change (400 to 600) or color shift.
- **Accent keyword:** In the hero headline, one key phrase (e.g. "Layer") may use `--cr-primary-light` to draw the eye. Maximum one accent word per Display-level heading. Only on dark surfaces.
- **Stat callout numbers:** Large numbers in evidence sections (38%, 60%) use `--cr-primary` on light surfaces and `--cr-primary-light` on dark surfaces, Geist Mono.

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

Flat by default. Depth through tonal layering, not shadows.

**Light surfaces:** `--cr-bg` < `--cr-surface` < `--cr-surface-raised`
**Dark surfaces:** `--cr-dark-bg` < `--cr-dark-surface` (+ optional glow for brand elements)

Shadows appear only as response to state:

| State | Shadow (Light) | Shadow (Dark) | Use |
|---|---|---|---|
| Hover | `0 2px 8px oklch(22% 0.02 275 / 0.06)` | `0 2px 8px oklch(0% 0 0 / 0.3)` | Interactive card lift |
| Focus | 2px ring, `--cr-primary` at 40% opacity | 2px ring, `--cr-primary-light` at 40% opacity | Keyboard focus |
| Float | `0 4px 16px oklch(22% 0.02 275 / 0.08)` | `0 4px 16px oklch(0% 0 0 / 0.4)` | Dropdowns, popovers |
| Glow | n/a | `0 0 40px oklch(55% 0.22 275 / 0.15)` | Brand illustration halo (dark only) |

### Elevation Rules

- Flat at rest on light surfaces. If a shadow is visible without interaction, justify it or remove it.
- On dark surfaces, a soft purple glow is permitted around brand illustration elements (the 3D platform graphic, icon clusters). This is the one decorative light effect.
- Diffuse only. Large blur radius, low opacity. No hard edges, no visible shadow outlines.
- Tonal layering is the primary depth signal.

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

Lucide icons for all UI elements. Vendor bot icons (GPTBot, ClaudeBot, PerplexityBot) use their own marks in the hero and brand sections only — never in product UI or dashboard.

| Context | Size | Notes |
|---|---|---|
| Inline (labels, buttons) | 16px | Vertically centered with text |
| Standard (actions, nav) | 20px | Default |
| Feature / empty state | 24px | Paired with explanatory text |
| Hero bot icons | 32-40px | Vendor marks, dark sections only |

- Stroke width: 1.5 (Lucide default)
- Color: `currentColor` (inherits from parent text)
- Stroke-only for Lucide. Vendor bot icons may be filled.
- No emoji in product UI. Lucide icons or plain text only.

## 9. Score Gauge

The score gauge is CrawlReady's signature element. A circular SVG ring that fills clockwise from the top.

- **Background ring:** `--cr-border` stroke
- **Foreground ring:** Stroke color from the score band (Section 2.3)
- **Number:** Centered inside the ring, Geist Mono, bold
- **Band label:** Below the gauge ("Critical" / "Poor" / "Fair" / "Good" / "Excellent"), colored to match the band
- **Three sizes:** sm (80px diameter), md (120px), lg (180px)
- **Animation:** Ring fills from 0 to score on first render. 700ms, ease-out-expo.

## 10. Components

**Buttons**
- **Primary:** Solid `--cr-primary` fill, `--cr-primary-fg` text. Hover: `--cr-primary-hover`. No gradients.
- **Secondary/Ghost:** Transparent, `--cr-primary` text. Hover: `--cr-primary-soft` background.
- **Outline (light):** `--cr-border` stroke, `--cr-fg` text. Hover: `--cr-surface` background.
- **Outline (dark):** `--cr-dark-border` stroke, `--cr-dark-fg` text. Hover: `--cr-dark-surface` background.
- All buttons use `--radius` (8px). Padding: 12px vertical, 16px horizontal (sm), 24px horizontal (default).

**Inputs**
- Border: `--cr-border`. Fill: `--cr-bg`.
- Focus: 2px ring using `--cr-primary` at 40% opacity.
- Padding: 12px vertical, 16px horizontal.
- Placeholder text: `--cr-fg-muted`.

**Cards**
Used sparingly. Tonal background preferred over visible borders. No nested cards.
- Light sections: `--cr-surface` fill.
- Dark sections: `--cr-dark-surface` fill.

**Badges / Pills**
Used for feature tags ("API-FIRST", "AI-NATIVE", "BUILT FOR DEVELOPERS") and metadata.
- Outline style: 1px `--cr-dark-border` (dark) or `--cr-border` (light), `--radius-full`, Label size, uppercase.
- Icon + text: Lucide icon (16px) left of label.

**Code Blocks**
- Geist Mono font. `--cr-dark-surface` background (always dark, even within light sections).
- Language label in top-right corner (Caption size, `--cr-dark-fg-muted`).
- Copy button: ghost style, appears on hover. Confirms with checkmark icon (120ms fade), not a toast.
- Syntax highlighting: muted palette. Token colors derived from `--cr-primary` hue at varying lightness.
- Max height: 320px with vertical scroll. Never collapse entire blocks behind a toggle.

**Callout Boxes**
Used for key insights and warnings within content sections.
- Left icon (Lucide, 20px) + text, on a `--cr-primary-soft` background with `--cr-primary` icon. Or `--score-critical-soft` background with red icon for warnings.

**Navigation**
- Active state: weight change (400 to 600) or 2px bottom border in `--cr-primary`. Not a background highlight.
- Mobile: slide panel from the right edge. Not a full-screen overlay.

**Empty States**
Every surface has a designed empty state. Never show a blank container.
- Feature/empty-state icon (24px Lucide) + one sentence explaining what will appear + one action.
- `--cr-fg-muted` text. Centered vertically and horizontally within the container.

## 11. Layout

### Container
- Max width: 1280px (`max-w-7xl`)
- Horizontal padding: 16px (mobile), 24px (tablet), 32px (desktop)

### Landing Page Grid
The landing page uses a bento-style grid, not a simple vertical scroll. Alternating dark and light panels create visual rhythm:
- **Row 1:** Hero (dark, 2/3 width) + Problem panel (light, 1/3 width)
- **Row 2:** Stakes (light, 1/3 width) + Solution (dark, 1/3 width) + Platform (light, 1/3 width)
- **Footer:** Full-width dark bar
- On mobile: panels stack vertically, hero goes full-width.
- Grid gap: 0px (panels are edge-to-edge with alternating backgrounds providing separation).

### Content Width
- Prose/body text: max 65-75ch
- Data tables, comparisons: full container width
- Within bento panels: internal padding of 32-48px

### Section Rhythm
- Hero: 96px vertical padding
- Bento panels: 48px internal padding
- Major sections (non-landing): 64px vertical padding
- Sub-sections: 32-48px vertical padding
- Within sections: 16-24px component gap

## 12. Voice and Tone

Knowledgeable peer, not a vendor. Factual. Direct. Never condescending.

- State what was measured, not how you feel about it.
- Imperative and specific in recommendations. Not "Consider improving..."
- Error states explain what happened and what the user can do. Not "Something went wrong."

## 13. Brand Illustration

The hero features a 3D isometric platform graphic (CrawlReady as the interface layer between AI crawlers and a website). This is the one permitted illustrative element.

- Rendered in the brand purple palette (`--cr-primary`, `--cr-primary-light`).
- Soft purple glow behind the platform (Glow elevation token).
- Floating bot icons (GPTBot, ClaudeBot, PerplexityBot) orbit above the platform.
- The illustration only appears on `--cr-dark-bg` surfaces. It never appears on light sections.
- It is a brand asset, not a generic stock illustration. It depicts the actual product concept.

## 14. Do's and Don'ts

### Do
- Use the OKLCH token system for every color. Trace each use to a named token.
- Tint every neutral toward hue 275. No pure grays.
- Use generous negative space. Let the data breathe.
- Use Geist Mono for URLs, domains, code, scores, and any value the user might copy.
- Provide motion feedback on hover, focus, and active states.
- Design every empty state. No surface should ever appear blank or broken.
- Show evidence before interpretation. The measured data comes first; the message second.
- Alternate dark and light sections on the landing page for visual rhythm.
- Use the brand illustration on the hero dark section to communicate the product concept.
- Use vendor bot icons in brand/hero sections to establish credibility.

### Don't
- Don't use gradient fills on buttons or the logo.
- Don't use glow effects on light sections. Glow is reserved for dark brand surfaces.
- Don't use scroll-driven choreography or decorative parallax.
- Don't use accent stripes (`border-left` or `border-right` > 1px as colored accents).
- Don't use glassmorphism or decorative blur.
- Don't use `#000` or `#fff`. Every neutral is tinted toward hue 275.
- Don't use bounce or elastic easing.
- Don't animate layout properties (width, height, top, left).
- Don't use em dashes in UI copy.
- Don't use emoji in product UI.
- Don't use stock photos or generic abstract art. The brand illustration and product output are the only visual content.
- Don't use vendor bot icons in the dashboard or product UI — Lucide only there.
