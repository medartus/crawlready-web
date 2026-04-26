/**
 * Visual diff engine — compares JS-rendered HTML vs bot-view HTML.
 *
 * Extracts text blocks from both, identifies content only visible
 * in the rendered view (JS-dependent), and produces a structured
 * diff result for the VisualDiff UI component.
 */

import { extractVisibleText } from './html-utils';

export type DiffBlock = {
  /** Text content of this block */
  text: string;
  /** Whether this block is present in the bot view */
  inBotView: boolean;
  /** Whether this block is present in the rendered view */
  inRenderedView: boolean;
  /** If missing from bot view, this is "js-invisible" */
  status: 'visible' | 'js-invisible' | 'bot-only';
};

export type VisualDiffResult = {
  /** Structured blocks showing what's visible vs invisible */
  blocks: DiffBlock[];
  /** Summary statistics */
  stats: {
    /** Total text blocks in rendered view */
    renderedBlockCount: number;
    /** Total text blocks in bot view */
    botBlockCount: number;
    /** Blocks only in rendered view (JS-dependent) */
    jsInvisibleCount: number;
    /** Blocks only in bot view (e.g. noscript) */
    botOnlyCount: number;
    /** Percentage of rendered content visible to bots */
    visibilityRatio: number;
    /** Rendered text length */
    renderedTextLength: number;
    /** Bot text length */
    botTextLength: number;
  };
};

/**
 * Split text into meaningful blocks (sentences / paragraphs).
 * Splits on sentence boundaries while keeping blocks >= 20 chars.
 */
function splitIntoBlocks(text: string): string[] {
  // Split on sentence-ending punctuation followed by space
  const raw = text.split(/(?<=[.!?])\s+/);
  const blocks: string[] = [];
  let buffer = '';

  for (const piece of raw) {
    buffer += (buffer ? ' ' : '') + piece;
    if (buffer.length >= 20) {
      blocks.push(buffer.trim());
      buffer = '';
    }
  }
  if (buffer.trim()) {
    blocks.push(buffer.trim());
  }

  return blocks.filter(b => b.length > 0);
}

/**
 * Normalize a block for fuzzy comparison (lowercase, collapse whitespace).
 */
function normalizeBlock(block: string): string {
  return block.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Compute the visual diff between JS-rendered HTML and bot-view HTML.
 */
export function computeVisualDiff(
  renderedHtml: string,
  botHtml: string,
): VisualDiffResult {
  const renderedText = extractVisibleText(renderedHtml);
  const botText = extractVisibleText(botHtml);

  const renderedBlocks = splitIntoBlocks(renderedText);
  const botBlocks = splitIntoBlocks(botText);

  // Create a set of normalized bot blocks for lookup
  const botBlockSet = new Set(botBlocks.map(normalizeBlock));
  const renderedBlockSet = new Set(renderedBlocks.map(normalizeBlock));

  const blocks: DiffBlock[] = [];

  // Check each rendered block against bot view
  for (const block of renderedBlocks) {
    const normalized = normalizeBlock(block);
    const inBotView = botBlockSet.has(normalized);

    blocks.push({
      text: block,
      inBotView,
      inRenderedView: true,
      status: inBotView ? 'visible' : 'js-invisible',
    });
  }

  // Check for bot-only blocks (e.g. noscript content)
  for (const block of botBlocks) {
    const normalized = normalizeBlock(block);
    if (!renderedBlockSet.has(normalized)) {
      blocks.push({
        text: block,
        inBotView: true,
        inRenderedView: false,
        status: 'bot-only',
      });
    }
  }

  const jsInvisibleCount = blocks.filter(b => b.status === 'js-invisible').length;
  const botOnlyCount = blocks.filter(b => b.status === 'bot-only').length;

  const visibilityRatio = renderedBlocks.length > 0
    ? Math.round(((renderedBlocks.length - jsInvisibleCount) / renderedBlocks.length) * 100)
    : 100;

  return {
    blocks,
    stats: {
      renderedBlockCount: renderedBlocks.length,
      botBlockCount: botBlocks.length,
      jsInvisibleCount,
      botOnlyCount,
      visibilityRatio,
      renderedTextLength: renderedText.length,
      botTextLength: botText.length,
    },
  };
}
