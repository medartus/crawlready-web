<!-- SEED — re-run $impeccable document once there's code to capture the actual tokens and components. -->
---
name: CrawlReady
description: AI readiness platform that scores and optimizes websites for AI crawlers
---

# Design System: CrawlReady

## 1. Overview

**Creative North Star: "The Clear Signal"**

In a landscape of SEO hype and AI marketing noise, CrawlReady is the clear signal. The interface strips away everything that doesn't serve the user's immediate question: "Can AI see my site?" Every element exists to clarify, not to decorate. Every interaction gives feedback, not theater.

The visual system draws from the open-source developer tool tradition (Plausible, PostHog, Cal.com): warm enough to feel human, precise enough to feel trustworthy, restrained enough to let the data breathe. It is not a Webflow template. It is not a design portfolio. Scroll-driven choreography, decorative gradients, and illustration-heavy layouts are absent by design. The tool is the hero, not the chrome around it.

The palette uses 3-4 deliberate color roles anchored in muted indigo and slate-violet. Color is used with intention: to signal state, to guide attention, to encode meaning. It is never used to fill space.

**Key Characteristics:**
- Data-forward: scores, diffs, and recommendations are first-class citizens, not afterthoughts
- Generous negative space: the interface breathes; density is earned, not default
- Systematic: consistent type scale, predictable spacing, repeatable component patterns
- Warm precision: technical without feeling cold; human without feeling soft

## 2. Colors

A full palette with 3-4 named roles. Muted indigo / slate-violet as the anchor hue. Colors are deliberate, not decorative.

### Primary
- **[to be resolved during implementation]**: The anchor. Muted indigo / slate-violet. Used for primary actions, active states, and key interactive elements. Should feel thoughtful and precise, not electric or urgent.

### Secondary
- **[to be resolved during implementation]**: A complementary warm accent for success states, positive scores, and confirmation. Should contrast the cool primary without clashing.

### Tertiary
- **[to be resolved during implementation]**: A diagnostic/warning tone for surfacing problems, low scores, and attention-requiring states. Functional, not alarming.

### Neutral
- **[to be resolved during implementation]**: Tinted neutrals, not pure gray. Every neutral carries a faint indigo undertone so backgrounds, borders, and text feel cohesive with the primary. No pure black. No pure white.

**The Full Palette Rule.** Three to four named color roles, each with a defined job. Every color use must trace back to one of the named roles. If a color doesn't have a role, it doesn't belong.

**The Tinted Neutral Rule.** Every neutral is tinted toward the primary hue (chroma 0.005-0.01 in OKLCH). Pure gray is prohibited. This is what makes the palette feel cohesive instead of assembled.

## 3. Typography

**Display Font:** [font pairing to be chosen at implementation] — technical sans-serif (candidates: Inter, Geist, IBM Plex Sans)
**Body Font:** Same family as display
**Label/Mono Font:** [monospace to be chosen at implementation] — for code snippets, URLs, technical values (candidates: JetBrains Mono, Geist Mono, IBM Plex Mono)

**Character:** A single technical sans-serif used throughout. The type does the structural work: hierarchy comes from weight and scale contrast, not from mixing families. The system feels like a well-organized technical document, not a magazine spread.

### Hierarchy
- **Display** (light/300, clamp(2.25rem, 5vw, 3.5rem), 1.1): Hero headlines only. Used sparingly. The restraint is the point.
- **Headline** (semibold/600, clamp(1.5rem, 3vw, 2rem), 1.2): Section titles, major feature headings.
- **Title** (medium/500, 1.25rem, 1.3): Card titles, subsection headers, dashboard labels.
- **Body** (regular/400, 1rem, 1.6): All running text. Max line length: 65-75ch.
- **Label** (medium/500, 0.875rem, 1.4, slight letter-spacing): UI labels, metadata, badges, navigation items.

**The Scale Contrast Rule.** Adjacent hierarchy levels must differ by at least a 1.25 ratio. If two text elements look the same size, one of them is wrong.

## 4. Elevation

Flat by default. Depth is conveyed through tonal layering (subtle background shifts between surface levels), not through shadows. Shadows appear only as a response to state: hover lifts, active focus, dropdown menus. At rest, the interface is calm and level.

When shadows are used, they are diffuse and low-contrast. No hard-edged drop shadows. No visible shadow edges. The goal is "gentle lift," not "floating card."

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, dropdown open, drag). If a shadow is visible without interaction, justify it or remove it.

## 5. Components

<!-- No components exist yet. This section will be populated on the next scan-mode run of $impeccable document. -->

To be captured from implementation. When built, components should follow these principles:

- **Buttons**: solid primary with clear hover feedback (subtle lift or background shift, not glow). Ghost and outline variants for secondary actions. No gradient fills.
- **Inputs**: clean stroke borders, visible focus rings using the primary color, generous internal padding. Not cramped.
- **Cards**: if used at all, minimal. No nested cards. Tonal background differentiation over borders when possible.
- **Navigation**: understated. Active state via weight or underline, not background highlight. Mobile: sheet or slide, not hamburger-into-full-overlay.
- **Data displays**: the diagnostic diff, score breakdowns, and recommendations are the signature components. They should feel like first-class designed elements, not afterthought data dumps.

## 6. Do's and Don'ts

### Do:
- **Do** use the full palette deliberately: every color use traces to a named role (primary, secondary, tertiary, neutral).
- **Do** tint every neutral toward the primary indigo hue. Cohesion comes from this discipline.
- **Do** let the diagnostic tool and score results be the visual centerpiece. The tool IS the landing page hero, not a screenshot of it.
- **Do** use generous negative space. Density is earned through content value, not crammed in by default.
- **Do** provide responsive motion: hover feedback, smooth transitions, subtle entrance animations. Motion confirms interaction, it doesn't perform.
- **Do** use monospace type for URLs, code snippets, and technical values. It signals "this is data you can act on."
- **Do** respect reduced-motion preferences for all animations (WCAG 2.1 AA).

### Don't:
- **Don't** use generic SaaS template layouts: hero + three feature cards + pricing grid. CrawlReady should feel built, not assembled.
- **Don't** replicate SEO tool dashboard density (Ahrefs, SEMrush). Walls of metrics that overwhelm instead of clarify. Show less, show it better.
- **Don't** use neon-on-dark developer hype aesthetics: glow effects, particle backgrounds, terminal-cosplay styling. CrawlReady is a serious tool, not a tech demo.
- **Don't** use Webflow/Framer template patterns: heavy scroll-driven animations, decorative gradients, illustration-heavy sections. Style over substance is the opposite of "show, don't tell."
- **Don't** use border-left or border-right greater than 1px as colored accent stripes on cards, callouts, or alerts.
- **Don't** use gradient text (background-clip: text with gradient backgrounds).
- **Don't** use glassmorphism decoratively. Blurs and glass cards without clear functional purpose.
- **Don't** use pure black (#000) or pure white (#fff). Every neutral is tinted.
- **Don't** use bounce or elastic easing. Ease out with exponential curves only.
- **Don't** animate CSS layout properties (width, height, top, left). Use transform and opacity.
- **Don't** use em dashes in UI copy. Use commas, colons, semicolons, periods, or parentheses.
