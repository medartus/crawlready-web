/**
 * Static content map for scoring checks.
 *
 * Provides human-readable labels, descriptions, fix guidance,
 * and optional learn-more URLs for all 12 sub-checks and
 * 4 EU AI Act transparency checks.
 */

export type CheckContent = {
  label: string;
  description: string;
  fixHint: string;
  learnMoreUrl?: string;
};

export const SCORE_CHECK_CONTENT: Record<string, CheckContent> = {
  // ── Crawlability (C1–C4) ───────────────────────────────────────
  c1: {
    label: 'Content Visibility',
    description: 'Percentage of your rendered content visible to AI crawlers without JavaScript execution.',
    fixHint: 'Implement server-side rendering (SSR) or static generation so content is present in the initial HTML response.',
  },
  c2: {
    label: 'Structural Clarity',
    description: 'Quality of semantic HTML structure: headings, paragraphs, lists, and meta description.',
    fixHint: 'Add a single <h1>, clear <h2> subheadings, descriptive <p> paragraphs, and a <meta name="description"> tag.',
  },
  c3: {
    label: 'Noise Ratio',
    description: 'Ratio of useful content to total HTML payload. Lower noise means AI crawlers process your content more efficiently.',
    fixHint: 'Move inline scripts to external files, minimize CSS in the HTML, and improve the content-to-markup ratio.',
  },
  c4: {
    label: 'Schema.org Presence',
    description: 'Presence and richness of Schema.org JSON-LD structured data in the bot-visible HTML.',
    fixHint: 'Add JSON-LD with Organization, Product, or Article schema including key properties like name, description, and offers.',
  },

  // ── Agent Readiness (A1–A4) ────────────────────────────────────
  a1: {
    label: 'Structured Data',
    description: 'Completeness of OpenGraph, Twitter Card, Schema.org metadata, and canonical URL.',
    fixHint: 'Add og:title, og:description, og:image, twitter:card, canonical link, and rich Schema.org properties.',
  },
  a2: {
    label: 'Content Negotiation',
    description: 'Whether your server can serve content in AI-friendly formats like Markdown, and whether you have an llms.txt file.',
    fixHint: 'Create an /llms.txt file describing your site. Consider serving Markdown responses for Accept: text/markdown requests.',
  },
  a3: {
    label: 'Machine-Actionable Data',
    description: 'Whether pricing, features, and CTAs are in machine-readable HTML or Schema.org — not just rendered visually.',
    fixHint: 'Put pricing in HTML tables, use descriptive CTA link text, and add Schema.org Product or SoftwareApplication markup.',
  },
  a4: {
    label: 'Standards Adoption',
    description: 'Adoption of AI-specific standards: robots.txt AI bot rules, sitemap.xml, MCP server card, and API catalog.',
    fixHint: 'Add explicit GPTBot/ClaudeBot rules to robots.txt, ensure sitemap.xml is accessible, and consider /.well-known/mcp/server-card.json.',
    learnMoreUrl: 'https://www.contentsignals.org/',
  },

  // ── Agent Interaction (I1–I4) ──────────────────────────────────
  i1: {
    label: 'Semantic HTML',
    description: 'Use of semantic HTML5 elements like <nav>, <main>, <header>, <footer> that help AI agents understand page structure.',
    fixHint: 'Wrap content in semantic elements: <main>, <nav>, <header>, <footer>, <article>. Use <button> instead of clickable <div>.',
  },
  i2: {
    label: 'Accessibility',
    description: 'Whether buttons, links, and form inputs have proper labels so AI agents can identify interactive elements.',
    fixHint: 'Add aria-label to icon buttons, associate form inputs with <label> elements, and ensure all buttons have text content.',
  },
  i3: {
    label: 'Navigation & Structure',
    description: 'Skip navigation links, internal nav links, and whether content is accessible without infinite scroll.',
    fixHint: 'Add a skip-to-content link, ensure <nav> has 3+ internal links, and avoid infinite scroll for primary content.',
  },
  i4: {
    label: 'Visual-Semantic Consistency',
    description: 'Whether visual elements match their semantic meaning: image alt text, icon labels, and no hidden text.',
    fixHint: 'Add alt text to images, label icon fonts with aria-label, and remove hidden text that affects layout.',
  },
};

export const EU_AI_ACT_CONTENT: Record<string, CheckContent> = {
  content_provenance: {
    label: 'Content Provenance',
    description: 'Your page identifies its author via <meta name="author"> or Schema.org author property.',
    fixHint: 'Add <meta name="author" content="Your Name"> or include an "author" property in your JSON-LD structured data.',
    learnMoreUrl: 'https://artificialintelligenceact.eu/article/50/',
  },
  content_transparency: {
    label: 'Content Transparency',
    description: 'Your page discloses how it was created via a generator meta tag or visible About/Imprint link.',
    fixHint: 'Add <meta name="generator" content="Your CMS"> or include a visible link to your About or Imprint page.',
    learnMoreUrl: 'https://artificialintelligenceact.eu/article/50/',
  },
  machine_readable_marking: {
    label: 'Machine-Readable Marking',
    description: 'Your page includes Schema.org JSON-LD with a @type property, making content type machine-readable.',
    fixHint: 'Add a <script type="application/ld+json"> block with at least a @type property (e.g., "WebPage", "Article").',
    learnMoreUrl: 'https://artificialintelligenceact.eu/article/50/',
  },
  structured_data_provenance: {
    label: 'Structured Data Provenance',
    description: 'Your Schema.org JSON-LD includes a publisher or creator property, attributing content origin.',
    fixHint: 'Add a "publisher" or "creator" property to your JSON-LD with name and url of the publishing organization.',
    learnMoreUrl: 'https://artificialintelligenceact.eu/article/50/',
  },
};

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  crawlability: 'Can AI crawlers see your content? Measures how much of your page is visible without JavaScript.',
  agentReadiness: 'Can AI agents act on your content? Measures structured data, content formats, and standards adoption.',
  agentInteraction: 'Can visual AI agents navigate your site? Measures semantic HTML, accessibility, and navigation quality.',
};
