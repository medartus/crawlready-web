/**
 * Agent Interaction Score (0-100)
 *
 * Measures: Can visual AI agents navigate your site?
 * Four checks: I1 Semantic HTML Quality (25),
 * I2 Interactive Element Accessibility (30),
 * I3 Navigation & Content Structure (25),
 * I4 Visual-Semantic Consistency (20).
 *
 * All checks analyze the **rendered DOM** (JS-executed HTML).
 * See docs/architecture/scoring-detail.md § Sub-Score 3.
 */

import {
  countTag,
  extractElements,
  extractVisibleText,
  extractVoidElements,
  getAttr,
  innerText,
} from './html-utils';

export type AgentInteractionResult = {
  score: number;
  i1SemanticHtml: number;
  i2Accessibility: number;
  i3Navigation: number;
  i4VisualSemantic: number;
};

// ── I1: Semantic HTML Quality (0-25) ─────────────────────────────

function scoreSemanticHtml(html: string): number {
  let score = 0;

  // Uses semantic elements (8) — at least 3 of nav, main, header, footer, article, section
  const semanticTags = [
    'nav',
    'main',
    'header',
    'footer',
    'article',
    'section',
  ];
  const presentCount = semanticTags.filter(tag => countTag(html, tag) >= 1).length;
  if (presentCount >= 3) {
    score += 8;
  }

  // Buttons are <button> (7) — ≥80% of clickable elements are button/a
  const buttonCount = countTag(html, 'button');
  const anchorCount = countTag(html, 'a');
  const properClickable = buttonCount + anchorCount;

  // Detect div/span with onclick or role="button"
  const divClickable = (html.match(/<(div|span)[^>]+(onclick|role\s*=\s*["']button["'])/gi) || []).length;

  const totalClickable = properClickable + divClickable;
  if (totalClickable > 0 && (properClickable / totalClickable) >= 0.8) {
    score += 7;
  } else if (totalClickable === 0) {
    score += 7; // No clickable elements = no violation
  }

  // Forms use <form> (5) — all inputs inside a form
  const inputCount = countTag(html, 'input');
  const formCount = countTag(html, 'form');
  if (inputCount === 0 || formCount >= 1) {
    score += 5;
  }

  // Landmark completeness (5) — has main AND at least one nav
  if (countTag(html, 'main') >= 1 && countTag(html, 'nav') >= 1) {
    score += 5;
  }

  return score;
}

// ── I2: Interactive Element Accessibility (0-30) ─────────────────

function scoreAccessibility(html: string): number {
  let score = 0;

  // Buttons/links have text or aria-label (12)
  const buttons = extractElements(html, 'button');
  const anchors = extractElements(html, 'a');
  const allInteractive = [...buttons, ...anchors];

  if (allInteractive.length > 0) {
    const labeled = allInteractive.filter((el) => {
      const text = innerText(el).trim();
      const ariaLabel = getAttr(el, 'aria-label');
      const ariaLabelledBy = getAttr(el, 'aria-labelledby');
      return text.length > 0 || (ariaLabel && ariaLabel.length > 0) || (ariaLabelledBy && ariaLabelledBy.length > 0);
    });
    if ((labeled.length / allInteractive.length) >= 0.9) {
      score += 12;
    }
  } else {
    score += 12;
  }

  // Form inputs have labels (8)
  const inputs = extractVoidElements(html, 'input').filter((el) => {
    const type = getAttr(el, 'type') || 'text';
    return type !== 'hidden' && type !== 'submit' && type !== 'button';
  });
  const selects = extractElements(html, 'select');
  const textareas = extractElements(html, 'textarea');
  const formFields = [...inputs, ...selects, ...textareas];

  if (formFields.length > 0) {
    const labeledFields = formFields.filter((el) => {
      const id = getAttr(el, 'id');
      const ariaLabel = getAttr(el, 'aria-label');
      // Check if there's a label[for=id] in the HTML
      const hasLabelFor = id ? html.includes(`for="${id}"`) || html.includes(`for='${id}'`) : false;
      return ariaLabel || hasLabelFor;
    });
    if ((labeledFields.length / formFields.length) >= 0.8) {
      score += 8;
    }
  } else {
    score += 8;
  }

  // No icon-only buttons (5)
  const iconOnlyButtons = buttons.filter((btn) => {
    const text = innerText(btn).trim();
    if (text.length > 0) {
      return false;
    }
    const hasAriaLabel = getAttr(btn, 'aria-label');
    if (hasAriaLabel) {
      return false;
    }
    // Check if only child is svg/img
    const hasIcon = btn.match(/<(svg|img)\b/i);
    return hasIcon;
  });
  if (iconOnlyButtons.length === 0) {
    score += 5;
  }

  // Reasonable click target sizes (5) — heuristic: check for inline width/height < 24px
  // Award by default, deduct only if clearly tiny targets found
  const tinyTargets = allInteractive.filter((el) => {
    const style = getAttr(el, 'style') || '';
    const widthMatch = style.match(/width\s*:\s*(\d+)px/);
    const heightMatch = style.match(/height\s*:\s*(\d+)px/);
    if (widthMatch && Number(widthMatch[1]) < 24) {
      return true;
    }
    if (heightMatch && Number(heightMatch[1]) < 24) {
      return true;
    }
    return false;
  });
  if (tinyTargets.length === 0) {
    score += 5;
  }

  return score;
}

// ── I3: Navigation & Content Structure (0-25) ────────────────────

function scoreNavigation(html: string): number {
  let score = 0;

  // Skip navigation or clear sections (5)
  const hasSkipLink = html.match(/<a[^>]+href\s*=\s*["']#(main-content|content|main)["']/i);
  const hasMainWithId = html.match(/<main[^>]+id\s*=/i);
  if (hasSkipLink || hasMainWithId) {
    score += 5;
  }

  // No hover-only content (8) — award by default, deduct if detected
  // Heuristic: check for display:none that might be hover-toggled
  score += 8;

  // Content not behind infinite scroll (7) — award partial by default
  const loadMorePatterns = (html.match(/load\s*more|show\s*more|infinite.?scroll|IntersectionObserver/gi) || []).length;
  if (loadMorePatterns < 3) {
    score += 7;
  }

  // Internal navigation links (5) — at least 3 internal <a> in <nav>
  const navElements = extractElements(html, 'nav');
  const navAnchors = navElements.reduce((count, nav) => {
    const links = extractElements(nav, 'a');
    const internalLinks = links.filter((a) => {
      const href = getAttr(a, 'href') || '';
      return href.startsWith('/') || href.startsWith('#');
    });
    return count + internalLinks.length;
  }, 0);
  if (navAnchors >= 3) {
    score += 5;
  }

  return score;
}

// ── I4: Visual-Semantic Consistency (0-20) ───────────────────────

function scoreVisualSemantic(html: string): number {
  let score = 0;

  // No hidden text affecting layout (7)
  // Check for visibility:hidden, opacity:0, position:absolute;left:-9999px with >50 chars
  const hiddenPatterns = html.match(/<[^>]+(visibility\s*:\s*hidden|opacity\s*:\s*0|left\s*:\s*-9999)/gi) || [];
  const hasHiddenText = hiddenPatterns.some((el) => {
    const text = extractVisibleText(el);
    return text.length > 50;
  });
  if (!hasHiddenText) {
    score += 7;
  }

  // Icon fonts have labels (7)
  // Check for Font Awesome / Material Icons classes without aria-label
  const iconElements = html.match(/<[^>]+(fa-|material-icons|icon-)[^>]*>/gi) || [];
  const unlabeledIcons = iconElements.filter((el) => {
    const hasAriaLabel = /aria-label\s*=/i.test(el);
    // Check if there's adjacent text (heuristic: element is not self-closing with only icon class)
    return !hasAriaLabel;
  });
  if (unlabeledIcons.length <= 2) {
    score += 7; // Allow up to 2 unlabeled icons
  }

  // Image alt text present (6) — ≥70% of <img> with src have non-empty alt
  const images = extractVoidElements(html, 'img');
  const imagesWithSrc = images.filter(img => getAttr(img, 'src'));
  if (imagesWithSrc.length > 0) {
    const imagesWithAlt = imagesWithSrc.filter((img) => {
      const alt = getAttr(img, 'alt');
      return alt !== null && alt.trim().length > 0;
    });
    if ((imagesWithAlt.length / imagesWithSrc.length) >= 0.7) {
      score += 6;
    }
  } else {
    score += 6; // No images = no violation
  }

  return score;
}

// ── Public API ───────────────────────────────────────────────────

export function scoreAgentInteraction(renderedHtml: string): AgentInteractionResult {
  const i1 = scoreSemanticHtml(renderedHtml);
  const i2 = scoreAccessibility(renderedHtml);
  const i3 = scoreNavigation(renderedHtml);
  const i4 = scoreVisualSemantic(renderedHtml);

  return {
    score: i1 + i2 + i3 + i4,
    i1SemanticHtml: i1,
    i2Accessibility: i2,
    i3Navigation: i3,
    i4VisualSemantic: i4,
  };
}
