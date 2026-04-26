/**
 * Recommendations Engine — generate fix suggestions ranked by severity.
 *
 * Recommendations are derived from the scoring results.
 * Top 3 are shown for free; the rest are gated behind email capture.
 *
 * See docs/architecture/scoring-detail.md.
 */

import type { AgentInteractionResult } from './agent-interaction';
import type { AgentReadinessResult } from './agent-readiness';
import type { CrawlabilityResult } from './crawlability';

export type Recommendation = {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'crawlability' | 'agent_readiness' | 'agent_interaction';
  title: string;
  description: string;
  impact: string;
};

type ScoringResults = {
  crawlability: CrawlabilityResult;
  agentReadiness: AgentReadinessResult;
  agentInteraction: AgentInteractionResult;
};

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function generateRecommendations(results: ScoringResults): Recommendation[] {
  const recs: Recommendation[] = [];
  const { crawlability, agentReadiness, agentInteraction } = results;

  // ── Crawlability recommendations ────────────────────────────────

  if (crawlability.c1ContentVisibility <= 8) {
    recs.push({
      id: 'c1-low-visibility',
      severity: crawlability.c1ContentVisibility === 0 ? 'critical' : 'high',
      category: 'crawlability',
      title: 'Content invisible to AI crawlers',
      description: 'Most of your content requires JavaScript to render. AI crawlers like GPTBot see very little of your page.',
      impact: 'Implement server-side rendering (SSR) or static generation to make content available without JS execution.',
    });
  }

  if (crawlability.c2StructuralClarity < 15) {
    recs.push({
      id: 'c2-weak-structure',
      severity: 'medium',
      category: 'crawlability',
      title: 'Weak semantic HTML structure',
      description: 'Your bot-visible HTML lacks proper heading hierarchy, paragraphs, or meta description.',
      impact: 'Add a single H1, clear H2 subheadings, descriptive paragraphs, and a meta description tag.',
    });
  }

  if (crawlability.c3NoiseRatio < 14) {
    recs.push({
      id: 'c3-noisy-html',
      severity: 'medium',
      category: 'crawlability',
      title: 'High HTML noise ratio',
      description: 'Scripts, styles, and navigation markup dominate your HTML payload. Useful content is a small fraction.',
      impact: 'Move inline scripts to external files, minimize CSS in the HTML, and ensure content-to-markup ratio improves.',
    });
  }

  if (crawlability.c4SchemaPresence < 10) {
    recs.push({
      id: 'c4-no-schema',
      severity: crawlability.c4SchemaPresence === 0 ? 'high' : 'medium',
      category: 'crawlability',
      title: 'Missing or incomplete Schema.org markup',
      description: 'No JSON-LD structured data found, or it lacks rich types and properties.',
      impact: 'Add JSON-LD with Organization, Product, or Article schema including key properties.',
    });
  }

  // ── Agent Readiness recommendations ─────────────────────────────

  if (agentReadiness.a1StructuredData < 12) {
    recs.push({
      id: 'a1-incomplete-metadata',
      severity: 'high',
      category: 'agent_readiness',
      title: 'Incomplete structured metadata',
      description: 'Missing OpenGraph tags, Twitter Card metadata, canonical URL, or rich Schema.org properties.',
      impact: 'Add og:title, og:description, og:image, twitter:card, and a canonical link tag.',
    });
  }

  if (agentReadiness.a2ContentNegotiation < 12) {
    recs.push({
      id: 'a2-no-content-negotiation',
      severity: 'medium',
      category: 'agent_readiness',
      title: 'No AI-friendly content formats',
      description: 'Your server does not respond to Markdown content negotiation and has no llms.txt file.',
      impact: 'Create an /llms.txt file describing your site for AI agents. Consider serving Markdown for text/markdown Accept headers.',
    });
  }

  if (agentReadiness.a3MachineActionable < 15) {
    recs.push({
      id: 'a3-data-not-actionable',
      severity: 'medium',
      category: 'agent_readiness',
      title: 'Key data not machine-actionable',
      description: 'Pricing, features, or contact info is not in structured HTML or Schema.org. CTAs may not be discoverable.',
      impact: 'Put pricing in HTML tables, ensure CTAs use descriptive link text, and add Schema.org Product or SoftwareApplication markup.',
    });
  }

  if (agentReadiness.a4StandardsAdoption < 8) {
    recs.push({
      id: 'a4-low-standards',
      severity: 'low',
      category: 'agent_readiness',
      title: 'Low AI standards adoption',
      description: 'Missing AI-specific robots.txt rules, sitemap.xml, or emerging standards like MCP server card.',
      impact: 'Add explicit GPTBot/ClaudeBot rules to robots.txt, ensure sitemap.xml is accessible, and consider adding /.well-known/mcp/server-card.json.',
    });
  }

  // ── Agent Interaction recommendations ───────────────────────────

  if (agentInteraction.i1SemanticHtml < 15) {
    recs.push({
      id: 'i1-poor-semantics',
      severity: 'medium',
      category: 'agent_interaction',
      title: 'Weak semantic HTML for visual agents',
      description: 'Your page uses few semantic elements (nav, main, header, footer). Visual AI agents struggle to understand page structure.',
      impact: 'Wrap content in semantic HTML5 elements: <main>, <nav>, <header>, <footer>, <article>.',
    });
  }

  if (agentInteraction.i2Accessibility < 18) {
    recs.push({
      id: 'i2-accessibility-gaps',
      severity: 'high',
      category: 'agent_interaction',
      title: 'Interactive elements lack accessibility',
      description: 'Buttons, links, or form inputs are missing labels. Icon-only buttons lack aria-label attributes.',
      impact: 'Add aria-label to icon buttons, associate form inputs with labels, and ensure all interactive elements have text content.',
    });
  }

  if (agentInteraction.i3Navigation < 15) {
    recs.push({
      id: 'i3-navigation-issues',
      severity: 'low',
      category: 'agent_interaction',
      title: 'Navigation structure needs improvement',
      description: 'Missing skip navigation links, excessive "load more" patterns, or insufficient internal navigation links.',
      impact: 'Add a skip-to-content link, ensure main nav has 3+ internal links, and avoid infinite scroll for primary content.',
    });
  }

  if (agentInteraction.i4VisualSemantic < 12) {
    recs.push({
      id: 'i4-visual-semantic-mismatch',
      severity: 'low',
      category: 'agent_interaction',
      title: 'Visual-semantic inconsistencies',
      description: 'Hidden text, unlabeled icon fonts, or images missing alt text create confusion for visual AI agents.',
      impact: 'Add alt text to images, label icon fonts with aria-label, and remove hidden text that is not decorative.',
    });
  }

  // Sort by severity
  recs.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return recs;
}
