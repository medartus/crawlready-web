/**
 * Example scan output fixtures.
 *
 * Two realistic scenarios showing the complete structured output
 * that a user receives after a scan. These serve as:
 * 1. Visual reference for the product team
 * 2. Test fixtures for scoring and rendering tests
 * 3. Living documentation of the scan-output-specification.md
 *
 * See docs/architecture/scan-output-specification.md for the full spec.
 */

import type { EuAiActResult } from '../eu-ai-act';
import type { Recommendation } from '../recommendations';
import type { SchemaPreviewResult } from '../schema-preview';
import type { VisualDiffResult } from '../visual-diff';

// ─── Shared types (from scan-output-specification.md) ────────────

type Severity = 'critical' | 'warning' | 'good' | 'excellent';

type CheckOutput = {
  id: string;
  name: string;
  category: 'crawlability' | 'agent_readiness' | 'agent_interaction';
  points: number;
  maxPoints: number;
  severity: Severity;
  evidence: Record<string, unknown>;
  interpretation: string;
  action: string | null;
};

type ScoreBreakdown = {
  version: number;
  computedAt: string;
  frameworkDetected: string | null;
  crawlability: {
    score: number;
    checks: Record<string, CheckOutput>;
  };
  agentReadiness: {
    score: number;
    checks: Record<string, CheckOutput>;
  };
  agentInteraction: {
    score: number;
    checks: Record<string, CheckOutput>;
  };
};

type ScanOutputExample = {
  label: string;
  description: string;
  url: string;
  domain: string;
  aiReadinessScore: number;
  floorCapped: boolean;
  bandLabel: string;
  bandMessage: string;
  scoreBreakdown: ScoreBreakdown;
  visualDiff: VisualDiffResult;
  recommendations: Recommendation[];
  schemaPreview: SchemaPreviewResult;
  euAiAct: EuAiActResult;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 1: React CRA SPA — "Your site is invisible to AI"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const csrSpaExample: ScanOutputExample = {
  label: 'React CRA SPA (Client-Side Rendered)',
  description:
    'A typical B2B SaaS site built with Create React App. '
    + 'All content renders via JavaScript. AI crawlers see an empty div.',
  url: 'https://acme-saas.com',
  domain: 'acme-saas.com',

  // Composite: (0.5 × 8) + (0.25 × 5) + (0.25 × 45) = 4 + 1.25 + 11.25 = 16.5 → 17
  // Floor rule: crawlability (8) < 20 → capped at 60. 17 < 60, no effect.
  aiReadinessScore: 17,
  floorCapped: false,
  bandLabel: 'Critical',
  bandMessage: 'Your site is invisible to AI',

  scoreBreakdown: {
    version: 2,
    computedAt: '2026-05-03T21:00:00Z',
    frameworkDetected: 'react-cra',

    // ── Crawlability: 8/100 ──────────────────────────────────────
    crawlability: {
      score: 8,
      checks: {
        c1_visibility: {
          id: 'c1_visibility',
          name: 'Content Visibility',
          category: 'crawlability',
          points: 0,
          maxPoints: 35,
          severity: 'critical',
          evidence: {
            rendered_text_length: 4_280,
            bot_text_length: 127,
            visibility_ratio: 0.03,
            invisible_sections: ['Hero', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'Footer'],
            bot_status_code: 200,
          },
          interpretation:
            'AI crawlers see almost nothing. Your page has 4,280 characters of content '
            + 'for humans, but only 127 characters in the raw HTML. 6 content sections '
            + 'are completely invisible.',
          action:
            'Your page content is invisible to AI crawlers. Add server-side rendering '
            + 'to make your content accessible. Your site uses client-side React without '
            + 'server rendering. AI crawlers receive an empty <div id="root"></div>.',
        },
        c2_structural_clarity: {
          id: 'c2_structural_clarity',
          name: 'Structural Clarity',
          category: 'crawlability',
          points: 0,
          maxPoints: 25,
          severity: 'critical',
          evidence: {
            has_h1: false,
            h1_count: 0,
            has_heading_hierarchy: false,
            skipped_levels: [],
            paragraph_count: 0,
            has_lists_or_tables: false,
            has_meta_description: false,
            meta_description_length: 0,
          },
          interpretation:
            'Your page is missing a <h1> heading. No content paragraphs found. '
            + 'No structured data elements (lists or tables). Missing meta description. '
            + 'AI crawlers find zero structured text content.',
          action:
            'Add a single <h1> element containing the primary topic of this page. '
            + 'This requires server-side rendering first — the <h1> exists in your '
            + 'React components but is invisible to bots.',
        },
        c3_noise_ratio: {
          id: 'c3_noise_ratio',
          name: 'Noise Ratio',
          category: 'crawlability',
          points: 0,
          maxPoints: 20,
          severity: 'critical',
          evidence: {
            content_tokens: 12,
            total_tokens: 847,
            noise_ratio: 0.99,
            html_size_bytes: 14_200,
            estimated_content_bytes: 127,
          },
          interpretation:
            'Your content is buried: only 1% of your HTML (12 tokens) is actual '
            + 'content. The remaining 99% is scripts, styles, and the React bootstrap bundle.',
          action:
            'Remove inline <script> and <style> blocks from your initial HTML. '
            + 'With server-side rendering, the content-to-markup ratio will improve '
            + 'dramatically as real text replaces empty containers.',
        },
        c4_schema_presence: {
          id: 'c4_schema_presence',
          name: 'Schema.org Presence',
          category: 'crawlability',
          points: 0,
          maxPoints: 20,
          severity: 'critical',
          evidence: {
            json_ld_blocks: 0,
            valid_json_ld: false,
            types_found: [],
            is_rich_type: false,
            property_count: 0,
            raw_json_ld: [],
          },
          // Note: blocked by C1 < 25%
          interpretation:
            'No Schema.org markup detected. AI systems cannot extract structured '
            + 'facts (product type, pricing, organization) from your page.',
          action: null, // Blocked — fix visibility first
        },
      },
    },

    // ── Agent Readiness: 5/100 ───────────────────────────────────
    agentReadiness: {
      score: 5,
      checks: {
        a1_structured_data: {
          id: 'a1_structured_data',
          name: 'Structured Data Completeness',
          category: 'agent_readiness',
          points: 0,
          maxPoints: 25,
          severity: 'critical',
          evidence: {
            og_basics: { title: false, description: false, image: false },
            og_type: false,
            schema_key_props: { present: false, count: 0 },
            product_pricing: { detected: false, format: 'none' },
            twitter_card: { card: false, title: false },
            canonical_url: { present: false, url: null },
          },
          interpretation:
            'No OpenGraph metadata, no Twitter Card, no canonical URL, no structured '
            + 'Schema.org properties. AI search engines have zero metadata to work with.',
          action: null, // Blocked — fix visibility first
        },
        a2_content_negotiation: {
          id: 'a2_content_negotiation',
          name: 'Content Negotiation',
          category: 'agent_readiness',
          points: 0,
          maxPoints: 25,
          severity: 'critical',
          evidence: {
            markdown_probe: {
              status_code: 200,
              content_type: 'text/html',
              is_markdown: false,
              response_size: 14_200,
            },
            llms_txt: {
              found: false,
              url_tried: ['/.well-known/llms.txt', '/llms.txt'],
              content_size: null,
            },
            json_feed_or_api_docs: { found: false, type: null, url: null },
          },
          interpretation:
            'Your server returns HTML regardless of format request. '
            + 'llms.txt file not found at /.well-known/llms.txt or /llms.txt. '
            + 'No machine-readable API or documentation link detected.',
          action: null, // Blocked — fix visibility first
        },
        a3_machine_actionable: {
          id: 'a3_machine_actionable',
          name: 'Machine-Actionable Data',
          category: 'agent_readiness',
          points: 0,
          maxPoints: 30,
          severity: 'critical',
          evidence: {
            key_facts_structured: { found: false, types: [], format: 'text_only' },
            heading_hierarchy: { clean: false, max_skip: 0 },
            actionable_ctas: { found: [], count: 0, in_bot_html: false },
            js_gated_data: {
              has_pricing_in_rendered: true,
              has_pricing_in_bot: false,
              structured_visibility_ratio: 0.03,
            },
          },
          interpretation:
            'Key business information (pricing, features, contact) is not in a '
            + 'machine-readable format. Your pricing data is only visible after '
            + 'JavaScript renders, invisible to AI crawlers.',
          action: null, // Blocked — fix visibility first
        },
        a4_standards_adoption: {
          id: 'a4_standards_adoption',
          name: 'Standards Adoption',
          category: 'agent_readiness',
          points: 5,
          maxPoints: 20,
          severity: 'critical',
          evidence: {
            robots_txt: {
              found: true,
              has_ai_bot_rules: false,
              ai_bots_mentioned: [],
              has_generic_only: true,
              raw_relevant_lines: ['User-agent: *', 'Allow: /'],
            },
            content_signals: { found: false, parameters: [] },
            sitemap: { found: true, status_code: 200, content_type: 'application/xml' },
            link_headers: { found: false, rel_values: [] },
            mcp_server_card: { found: false, status_code: 404 },
            api_catalog: { found: false, status_code: 404 },
          },
          interpretation:
            'robots.txt has only generic rules. Content Signals directive not found. '
            + 'sitemap.xml found. HTTP Link headers not present. MCP Server Card: not found. '
            + 'API Catalog: not found. 2/6 AI agent standards adopted. '
            + 'The typical B2B SaaS site supports 2-3.',
          // A4 is NEVER blocked, always actionable
          action:
            'Add explicit User-agent rules in robots.txt for AI crawlers '
            + '(GPTBot, ClaudeBot, PerplexityBot). Specify what you allow and disallow.',
        },
      },
    },

    // ── Agent Interaction: 45/100 ────────────────────────────────
    // (analyzed from rendered DOM, so JS content IS visible here)
    agentInteraction: {
      score: 45,
      checks: {
        i1_semantic_html: {
          id: 'i1_semantic_html',
          name: 'Semantic HTML Quality',
          category: 'agent_interaction',
          points: 8,
          maxPoints: 25,
          severity: 'warning',
          evidence: {
            semantic_elements: { found: ['nav', 'footer'], count: 2 },
            clickable_div_ratio: {
              div_span_clickable: 8,
              button_anchor: 12,
              ratio: 0.6,
            },
            forms_valid: { inputs_in_form: 2, inputs_total: 2, ratio: 1 },
            landmarks: { has_main: false, has_nav: true },
          },
          interpretation:
            'Found 2 semantic elements (nav, footer). Missing key landmarks like '
            + '<main>. 60% of clickable elements use proper <button> or <a> tags. '
            + '8 use <div> or <span> with click handlers, which AI agents cannot '
            + 'reliably identify as interactive.',
          action:
            'Replace <div onclick> and <span role="button"> elements with native '
            + '<button> or <a> tags. AI agents identify interactive elements by their '
            + 'HTML tag, not by CSS or JavaScript behavior.',
        },
        i2_accessibility: {
          id: 'i2_accessibility',
          name: 'Interactive Element Accessibility',
          category: 'agent_interaction',
          points: 12,
          maxPoints: 30,
          severity: 'warning',
          evidence: {
            labeled_interactive: { labeled: 10, total: 20, ratio: 0.5 },
            form_labels: { labeled: 2, total: 2, ratio: 1 },
            icon_only_buttons: {
              count: 3,
              examples: ['hamburger menu icon', 'close icon', 'search icon'],
            },
            small_click_targets: { count: 0, examples: [] },
          },
          interpretation:
            '50% of buttons and links have accessible text or aria-label. '
            + '10 interactive elements have no label and are invisible to AI agents. '
            + '3 button(s) contain only an icon with no text label. AI agents cannot '
            + 'determine their purpose. Examples: hamburger menu icon, close icon, '
            + 'search icon.',
          action:
            'Add aria-label to icon-only buttons. Example: '
            + '<button aria-label="Open menu"><svg>...</svg></button>.',
        },
        i3_navigation: {
          id: 'i3_navigation',
          name: 'Navigation & Content Structure',
          category: 'agent_interaction',
          points: 15,
          maxPoints: 25,
          severity: 'warning',
          evidence: {
            skip_link: false,
            hover_only_content: { detected: false, count: 0 },
            infinite_scroll: { detected: false, pattern_count: 0 },
            internal_nav_links: { count: 6, in_nav_element: true },
          },
          interpretation:
            'Skip navigation link not found. No hover-only content detected. '
            + 'No infinite scroll patterns detected. 6 internal navigation links found, '
            + 'properly wrapped in <nav>.',
          action:
            'Add a skip-to-content link: '
            + '<a href="#main-content" class="sr-only">Skip to content</a> '
            + 'as the first focusable element.',
        },
        i4_visual_semantic: {
          id: 'i4_visual_semantic',
          name: 'Visual-Semantic Consistency',
          category: 'agent_interaction',
          points: 10,
          maxPoints: 20,
          severity: 'warning',
          evidence: {
            hidden_text: { count: 0, total_chars: 0, examples: [] },
            unlabeled_icons: {
              count: 5,
              examples: ['fa-twitter', 'fa-github', 'fa-linkedin'],
            },
            image_alt_text: { with_alt: 3, total: 8, ratio: 0.375 },
          },
          interpretation:
            'No visually hidden text detected. 5 icon font element(s) without '
            + 'accessible labels. AI agents see these as empty elements. '
            + '37% of images have alt text (3/8).',
          action:
            'Add aria-label attributes to icon font elements. '
            + 'Example: <i class="fa fa-twitter" aria-label="Twitter"></i>. '
            + 'Add descriptive alt attributes to the 5 images missing them.',
        },
      },
    },
  },

  // ── Visual Diff ────────────────────────────────────────────────
  visualDiff: {
    blocks: [
      { text: 'Acme SaaS — The platform for modern teams.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'Trusted by 2,000+ companies worldwide.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'Features that set us apart. Collaboration, analytics, automation — all in one place.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'Starter plan at $29/mo for small teams. Pro plan at $79/mo for growing businesses. Enterprise — custom pricing for large organizations.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'What our customers say. "Acme transformed how our team works." — Jane D., VP Engineering', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'Frequently asked questions. How do I get started? Sign up for a free trial — no credit card required.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
    ],
    stats: {
      renderedBlockCount: 6,
      botBlockCount: 0,
      jsInvisibleCount: 6,
      botOnlyCount: 0,
      visibilityRatio: 0,
      renderedTextLength: 4_280,
      botTextLength: 127,
    },
  },

  // ── Recommendations (sorted by severity) ───────────────────────
  recommendations: [
    {
      id: 'c1-low-visibility',
      severity: 'critical',
      category: 'crawlability',
      title: 'Your entire page is invisible to AI crawlers',
      description:
        '97% of your content (4,153 characters) is rendered by JavaScript and '
        + 'invisible to GPTBot, ClaudeBot, and PerplexityBot. AI crawlers receive '
        + 'an empty <div id="root"></div> with 127 characters of boilerplate.',
      impact:
        'Migrate to Next.js or add react-snap for static prerendering. '
        + 'This is the single highest-impact change — no other fix matters '
        + 'until AI crawlers can see your content. '
        + 'Estimated impact: +25-35 points on Crawlability.',
    },
    {
      id: 'i2-accessibility-gaps',
      severity: 'high',
      category: 'agent_interaction',
      title: '3 icon-only buttons have no accessible labels',
      description:
        'Hamburger menu, close, and search buttons contain only SVG icons. '
        + 'AI agents cannot determine their purpose.',
      impact:
        'Add aria-label to each: <button aria-label="Open menu">. '
        + 'Estimated impact: +5-10 points on Agent Interaction.',
    },
    {
      id: 'a4-low-standards',
      severity: 'medium',
      category: 'agent_readiness',
      title: 'No AI-specific rules in robots.txt',
      description:
        'Your robots.txt has only a generic User-agent: * rule. '
        + 'AI crawlers cannot tell if you welcome or block them.',
      impact:
        'Add explicit GPTBot, ClaudeBot, and PerplexityBot User-agent rules. '
        + 'This improves how AI systems discover your site, but fixing content '
        + 'visibility (above) has higher impact. '
        + 'Estimated impact: +2-5 points on Agent Readiness.',
    },
    {
      id: 'i1-poor-semantics',
      severity: 'medium',
      category: 'agent_interaction',
      title: 'Page missing <main> landmark',
      description:
        'Found nav and footer, but no <main> element. Visual AI agents use '
        + '<main> as the primary landmark to locate page content.',
      impact:
        'Wrap your primary content in a <main> element. '
        + 'Estimated impact: +5 points on Agent Interaction.',
    },
    {
      id: 'i4-visual-semantic-mismatch',
      severity: 'low',
      category: 'agent_interaction',
      title: '5 images missing alt text',
      description:
        'Only 37% of images (3/8) have alt text. AI agents cannot interpret '
        + 'the content of unlabeled images.',
      impact:
        'Add descriptive alt attributes to images. Use alt="" for decorative images. '
        + 'Estimated impact: +3-6 points on Agent Interaction.',
    },
  ],

  // ── Schema Preview ─────────────────────────────────────────────
  schemaPreview: {
    detectedTypes: [],
    generatable: [
      { type: 'FAQPage', confidence: 0.87, reason: 'FAQ section with 5 questions detected' },
      { type: 'Product', confidence: 0.92, reason: '3 price points detected' },
    ],
  },

  // ── EU AI Act ──────────────────────────────────────────────────
  euAiAct: {
    passed: 0,
    total: 4,
    checks: [
      { name: 'content_provenance', passed: false },
      { name: 'content_transparency', passed: false },
      { name: 'machine_readable_marking', passed: false },
      { name: 'structured_data_provenance', passed: false },
    ],
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXAMPLE 2: Next.js SSR site with gaps — "Partially AI-ready"
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ssrWithGapsExample: ScanOutputExample = {
  label: 'Next.js SSR site with gaps',
  description:
    'A B2B SaaS marketing site using Next.js App Router. Server-rendered '
    + 'content is mostly visible, but pricing is in a client component, '
    + 'Schema.org is missing, and there is no llms.txt.',
  url: 'https://bettercrm.io',
  domain: 'bettercrm.io',

  // Composite: (0.5 × 55) + (0.25 × 23) + (0.25 × 72) = 27.5 + 5.75 + 18 = 51.25 → 51
  // Floor rule: agentReadiness (23) ≥ 20, all pass. No cap.
  aiReadinessScore: 51,
  floorCapped: false,
  bandLabel: 'Fair',
  bandMessage: 'Your site is partially AI-ready',

  scoreBreakdown: {
    version: 2,
    computedAt: '2026-05-03T21:10:00Z',
    frameworkDetected: 'next.js',

    // ── Crawlability: 55/100 ─────────────────────────────────────
    crawlability: {
      score: 55,
      checks: {
        c1_visibility: {
          id: 'c1_visibility',
          name: 'Content Visibility',
          category: 'crawlability',
          points: 25,
          maxPoints: 35,
          severity: 'good',
          evidence: {
            rendered_text_length: 6_400,
            bot_text_length: 4_920,
            visibility_ratio: 0.77,
            invisible_sections: ['Pricing Comparison Table', 'Interactive Demo'],
            bot_status_code: 200,
          },
          interpretation:
            '77% of your visible text reaches AI crawlers. Some sections '
            + '(2 detected) are JavaScript-rendered and invisible to GPTBot, '
            + 'ClaudeBot, and PerplexityBot.',
          action:
            'Move the 2 JavaScript-rendered sections to server-side rendering. '
            + 'In Next.js App Router, remove the \'use client\' directive from '
            + 'PricingTable and InteractiveDemo components, or fetch data server-side '
            + 'and pass it as props.',
        },
        c2_structural_clarity: {
          id: 'c2_structural_clarity',
          name: 'Structural Clarity',
          category: 'crawlability',
          points: 20,
          maxPoints: 25,
          severity: 'good',
          evidence: {
            has_h1: true,
            h1_count: 1,
            has_heading_hierarchy: true,
            skipped_levels: [],
            paragraph_count: 8,
            has_lists_or_tables: true,
            has_meta_description: true,
            meta_description_length: 152,
          },
          interpretation:
            'Your page has a <h1> heading with a clean hierarchy, '
            + '8 content paragraphs, structured data elements (lists or tables), '
            + 'and a meta description (152 chars). AI crawlers can parse the '
            + 'structure and extract content effectively.',
          action: null,
        },
        c3_noise_ratio: {
          id: 'c3_noise_ratio',
          name: 'Noise Ratio',
          category: 'crawlability',
          points: 7,
          maxPoints: 20,
          severity: 'warning',
          evidence: {
            content_tokens: 980,
            total_tokens: 3_640,
            noise_ratio: 0.73,
            html_size_bytes: 48_200,
            estimated_content_bytes: 12_800,
          },
          interpretation:
            'Moderate noise: 73% of your HTML is scripts, styles, and navigation. '
            + 'AI crawlers extract content from 980 useful tokens out of 3,640.',
          action:
            'Consider deferring non-critical scripts and moving inline styles '
            + 'to external files to reduce HTML payload.',
        },
        c4_schema_presence: {
          id: 'c4_schema_presence',
          name: 'Schema.org Presence',
          category: 'crawlability',
          points: 5,
          maxPoints: 20,
          severity: 'warning',
          evidence: {
            json_ld_blocks: 1,
            valid_json_ld: true,
            types_found: ['WebPage'],
            is_rich_type: false,
            property_count: 3,
            raw_json_ld: [
              { '@context': 'https://schema.org', '@type': 'WebPage', 'name': 'BetterCRM — CRM for modern teams', 'url': 'https://bettercrm.io' },
            ],
          },
          interpretation:
            'Schema.org markup found: WebPage. This provides basic identity signals '
            + 'but lacks the attribute-rich data (pricing, FAQs, specs) that drives '
            + 'AI citations.',
          action:
            'Upgrade your WebPage Schema to include more properties. Add '
            + 'Product with offers for your pricing page. Attribute-rich Schema '
            + 'drives 62% citation rate vs. 42% for generic.',
        },
      },
    },

    // ── Agent Readiness: 23/100 ──────────────────────────────────
    agentReadiness: {
      score: 23,
      checks: {
        a1_structured_data: {
          id: 'a1_structured_data',
          name: 'Structured Data Completeness',
          category: 'agent_readiness',
          points: 10,
          maxPoints: 25,
          severity: 'warning',
          evidence: {
            og_basics: { title: true, description: true, image: true },
            og_type: false,
            schema_key_props: { present: false, count: 2 },
            product_pricing: { detected: true, format: 'table' },
            twitter_card: { card: true, title: true },
            canonical_url: { present: true, url: 'https://bettercrm.io' },
          },
          interpretation:
            'OpenGraph metadata: title, description, image present. '
            + 'Missing og:type. 2 Schema.org properties found (basic). '
            + 'Pricing data is in an HTML table. Twitter Card metadata is complete. '
            + 'Canonical URL is set to https://bettercrm.io.',
          action:
            'Add og:type meta tag and upgrade your Schema.org JSON-LD with at '
            + 'least 3 meaningful properties beyond @type and name.',
        },
        a2_content_negotiation: {
          id: 'a2_content_negotiation',
          name: 'Content Negotiation',
          category: 'agent_readiness',
          points: 0,
          maxPoints: 25,
          severity: 'critical',
          evidence: {
            markdown_probe: {
              status_code: 200,
              content_type: 'text/html',
              is_markdown: false,
              response_size: 48_200,
            },
            llms_txt: {
              found: false,
              url_tried: ['/.well-known/llms.txt', '/llms.txt'],
              content_size: null,
            },
            json_feed_or_api_docs: {
              found: true,
              type: 'docs_link',
              url: '/docs',
            },
          },
          interpretation:
            'Your server returns HTML regardless of format request. '
            + 'llms.txt file not found at /.well-known/llms.txt or /llms.txt. '
            + 'Machine-readable documentation link found (docs_link: /docs).',
          action:
            'Create an llms.txt file at /.well-known/llms.txt describing your '
            + 'site\'s content for AI systems. Keep it under 8,000 tokens for '
            + 'agent context windows.',
        },
        a3_machine_actionable: {
          id: 'a3_machine_actionable',
          name: 'Machine-Actionable Data',
          category: 'agent_readiness',
          points: 8,
          maxPoints: 30,
          severity: 'warning',
          evidence: {
            key_facts_structured: {
              found: true,
              types: ['pricing', 'features'],
              format: 'table',
            },
            heading_hierarchy: { clean: true, max_skip: 0 },
            actionable_ctas: {
              found: ['Get Started', 'Book a Demo', 'View Docs'],
              count: 3,
              in_bot_html: true,
            },
            js_gated_data: {
              has_pricing_in_rendered: true,
              has_pricing_in_bot: false,
              structured_visibility_ratio: 0.65,
            },
          },
          interpretation:
            'Key business information (pricing, features) is in table format. '
            + 'Content hierarchy is clean. 3 actionable links found (Get Started, '
            + 'Book a Demo, View Docs). All are visible in the raw HTML. '
            + 'Your pricing data is only visible after JavaScript renders, '
            + 'invisible to AI crawlers.',
          action:
            'Your pricing section is only available after JavaScript runs. '
            + 'Move it to server-rendered HTML so AI agents can extract it. '
            + 'In Next.js, remove \'use client\' from PricingTable or fetch '
            + 'pricing data in a Server Component and pass it as props.',
        },
        a4_standards_adoption: {
          id: 'a4_standards_adoption',
          name: 'Standards Adoption',
          category: 'agent_readiness',
          points: 5,
          maxPoints: 20,
          severity: 'warning',
          evidence: {
            robots_txt: {
              found: true,
              has_ai_bot_rules: false,
              ai_bots_mentioned: [],
              has_generic_only: true,
              raw_relevant_lines: ['User-agent: *', 'Disallow: /api/', 'Sitemap: https://bettercrm.io/sitemap.xml'],
            },
            content_signals: { found: false, parameters: [] },
            sitemap: { found: true, status_code: 200, content_type: 'application/xml' },
            link_headers: { found: false, rel_values: [] },
            mcp_server_card: { found: false, status_code: 404 },
            api_catalog: { found: false, status_code: 404 },
          },
          interpretation:
            'robots.txt has only generic rules. Content Signals directive not found. '
            + 'sitemap.xml found. HTTP Link headers not present. '
            + 'MCP Server Card: not found. API Catalog: not found. '
            + '2/6 AI agent standards adopted. The typical B2B SaaS site supports 2-3.',
          action:
            'Add explicit User-agent rules in robots.txt for AI crawlers '
            + '(GPTBot, ClaudeBot, PerplexityBot). Specify what you allow and disallow.',
        },
      },
    },

    // ── Agent Interaction: 72/100 ────────────────────────────────
    agentInteraction: {
      score: 72,
      checks: {
        i1_semantic_html: {
          id: 'i1_semantic_html',
          name: 'Semantic HTML Quality',
          category: 'agent_interaction',
          points: 20,
          maxPoints: 25,
          severity: 'good',
          evidence: {
            semantic_elements: { found: ['nav', 'main', 'header', 'footer', 'section'], count: 5 },
            clickable_div_ratio: {
              div_span_clickable: 2,
              button_anchor: 18,
              ratio: 0.9,
            },
            forms_valid: { inputs_in_form: 3, inputs_total: 3, ratio: 1 },
            landmarks: { has_main: true, has_nav: true },
          },
          interpretation:
            'Found 5 semantic elements (nav, main, header, footer, section). '
            + 'Good variety. 90% of clickable elements use proper <button> or <a> tags. '
            + 'All form inputs are inside <form> wrappers. '
            + 'Page has <main> and <nav> landmarks.',
          action:
            'Replace the remaining 2 <div onclick> elements with native <button> '
            + 'or <a> tags.',
        },
        i2_accessibility: {
          id: 'i2_accessibility',
          name: 'Interactive Element Accessibility',
          category: 'agent_interaction',
          points: 20,
          maxPoints: 30,
          severity: 'good',
          evidence: {
            labeled_interactive: { labeled: 17, total: 20, ratio: 0.85 },
            form_labels: { labeled: 3, total: 3, ratio: 1 },
            icon_only_buttons: {
              count: 1,
              examples: ['theme toggle icon'],
            },
            small_click_targets: { count: 0, examples: [] },
          },
          interpretation:
            '85% of buttons and links have accessible text or aria-label. '
            + '3 interactive elements have no label. 1 button contains only an icon '
            + '(theme toggle). Form labels are complete.',
          action:
            'Add aria-label to the theme toggle button: '
            + '<button aria-label="Toggle dark mode"><svg>...</svg></button>.',
        },
        i3_navigation: {
          id: 'i3_navigation',
          name: 'Navigation & Content Structure',
          category: 'agent_interaction',
          points: 20,
          maxPoints: 25,
          severity: 'good',
          evidence: {
            skip_link: true,
            hover_only_content: { detected: false, count: 0 },
            infinite_scroll: { detected: false, pattern_count: 0 },
            internal_nav_links: { count: 8, in_nav_element: true },
          },
          interpretation:
            'Skip navigation link found. No hover-only content. No infinite scroll. '
            + '8 internal navigation links, properly wrapped in <nav>.',
          action: null,
        },
        i4_visual_semantic: {
          id: 'i4_visual_semantic',
          name: 'Visual-Semantic Consistency',
          category: 'agent_interaction',
          points: 12,
          maxPoints: 20,
          severity: 'warning',
          evidence: {
            hidden_text: { count: 1, total_chars: 68, examples: ['sr-only: Skip to content'] },
            unlabeled_icons: { count: 2, examples: ['lucide-check', 'lucide-x'] },
            image_alt_text: { with_alt: 5, total: 6, ratio: 0.83 },
          },
          interpretation:
            '1 element with 68 characters of visually hidden text detected '
            + '(screen reader text — appropriate). 2 icon elements without labels '
            + '(lucide-check, lucide-x). 83% of images have alt text (5/6).',
          action:
            'Add aria-label to the 2 unlabeled Lucide icons. Add alt text '
            + 'to the remaining image.',
        },
      },
    },
  },

  // ── Visual Diff ────────────────────────────────────────────────
  visualDiff: {
    blocks: [
      { text: 'BetterCRM — The CRM built for modern sales teams.', inBotView: true, inRenderedView: true, status: 'visible' },
      { text: 'Everything your team needs to close deals faster. Pipeline management, forecasting, and automation in one platform.', inBotView: true, inRenderedView: true, status: 'visible' },
      { text: 'Features. Visual Pipeline — drag-and-drop deal management. Smart Forecasting — AI-powered revenue predictions. Workflow Automation — eliminate repetitive tasks.', inBotView: true, inRenderedView: true, status: 'visible' },
      { text: 'Starter at $29/mo — 5 users, basic pipeline. Growth at $79/mo — 25 users, forecasting. Enterprise — custom pricing, SSO, dedicated support.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'Try the interactive demo — see BetterCRM in action with sample data.', inBotView: false, inRenderedView: true, status: 'js-invisible' },
      { text: 'Trusted by 500+ sales teams. "BetterCRM doubled our close rate in 3 months." — Sarah K., Head of Sales at TechCorp', inBotView: true, inRenderedView: true, status: 'visible' },
      { text: 'Get Started — 14-day free trial, no credit card required.', inBotView: true, inRenderedView: true, status: 'visible' },
    ],
    stats: {
      renderedBlockCount: 7,
      botBlockCount: 5,
      jsInvisibleCount: 2,
      botOnlyCount: 0,
      visibilityRatio: 71,
      renderedTextLength: 6_400,
      botTextLength: 4_920,
    },
  },

  // ── Recommendations (sorted by severity) ───────────────────────
  recommendations: [
    {
      id: 'a2-no-content-negotiation',
      severity: 'high',
      category: 'agent_readiness',
      title: 'No llms.txt file and no Markdown content negotiation',
      description:
        'Your server returns HTML regardless of format request. '
        + 'llms.txt file not found. AI agents have no summary of your site.',
      impact:
        'Create /.well-known/llms.txt describing your product in < 8,000 tokens. '
        + 'In Next.js, add a route handler at app/.well-known/llms.txt/route.ts. '
        + 'Estimated impact: +7-12 points on Agent Readiness.',
    },
    {
      id: 'c1-partial-visibility',
      severity: 'high',
      category: 'crawlability',
      title: 'Pricing and demo sections invisible to AI crawlers',
      description:
        'Your pricing comparison table (1,480 chars) and interactive demo section '
        + 'are rendered by JavaScript and invisible to GPTBot, ClaudeBot, and '
        + 'PerplexityBot. The rest of your content (77%) is server-rendered and visible.',
      impact:
        'In Next.js App Router, remove \'use client\' from PricingTable or fetch '
        + 'pricing data in a Server Component:\n'
        + '  export default async function Pricing() {\n'
        + '    const plans = await getPlans();\n'
        + '    return <PricingTable plans={plans} />;\n'
        + '  }\n'
        + 'Estimated impact: +10-15 points on Crawlability.',
    },
    {
      id: 'a3-js-gated-pricing',
      severity: 'high',
      category: 'agent_readiness',
      title: 'Pricing data only available after JavaScript',
      description:
        'Your pricing section ($29/mo Starter, $79/mo Growth, custom Enterprise) '
        + 'is only visible after JavaScript renders. AI agents cannot extract it.',
      impact:
        'Move pricing to server-rendered HTML. This is the single highest-impact '
        + 'fix for agent readiness. '
        + 'Estimated impact: +7-9 points on Agent Readiness.',
    },
    {
      id: 'c4-weak-schema',
      severity: 'medium',
      category: 'crawlability',
      title: 'Schema.org markup is generic (WebPage only)',
      description:
        'Your JSON-LD has a WebPage type with only 3 properties. '
        + 'CrawlReady detected patterns for FAQPage and Product.',
      impact:
        'Add Product schema with offers property for your pricing tiers. '
        + 'Estimated impact: +5-10 points on Crawlability.',
    },
    {
      id: 'a4-no-ai-bot-rules',
      severity: 'medium',
      category: 'agent_readiness',
      title: 'No AI-specific rules in robots.txt',
      description:
        'Your robots.txt only has generic User-agent: * rules. '
        + 'AI crawlers cannot tell if you welcome or restrict them.',
      impact:
        'Add explicit GPTBot, ClaudeBot, and PerplexityBot User-agent rules. '
        + 'Estimated impact: +2-5 points on Agent Readiness.',
    },
    {
      id: 'i4-unlabeled-icons',
      severity: 'low',
      category: 'agent_interaction',
      title: '2 Lucide icons and 1 image missing labels',
      description:
        'lucide-check and lucide-x icons have no aria-label. '
        + '1 image (out of 6) is missing alt text.',
      impact:
        'Add aria-label to icons and alt to the image. '
        + 'Estimated impact: +2-4 points on Agent Interaction.',
    },
  ],

  // ── Schema Preview ─────────────────────────────────────────────
  schemaPreview: {
    detectedTypes: [{ type: 'WebPage', properties: 2 }],
    generatable: [
      { type: 'Product', confidence: 0.92, reason: '3 price points detected' },
      { type: 'FAQPage', confidence: 0.75, reason: 'FAQ section with 4 questions detected' },
      { type: 'Organization', confidence: 0.7, reason: 'Logo, company name, and social links detected' },
    ],
  },

  // ── EU AI Act ──────────────────────────────────────────────────
  euAiAct: {
    passed: 2,
    total: 4,
    checks: [
      { name: 'content_provenance', passed: false },
      { name: 'content_transparency', passed: true },
      { name: 'machine_readable_marking', passed: true },
      { name: 'structured_data_provenance', passed: false },
    ],
  },
};
