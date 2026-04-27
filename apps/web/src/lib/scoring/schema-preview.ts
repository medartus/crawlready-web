/**
 * Schema Preview — detect existing JSON-LD types and suggest generatable ones.
 *
 * See docs/architecture/api-first.md § scan response: schema_preview.
 */

import { extractJsonLd, extractVisibleText } from './html-utils';

export type SchemaDetection = {
  type: string;
  properties: number;
};

export type SchemaGeneratable = {
  type: string;
  confidence: number;
  reason: string;
};

export type SchemaPreviewResult = {
  detectedTypes: SchemaDetection[];
  generatable: SchemaGeneratable[];
};

// Heuristic patterns for generatable schema types
const FAQ_PATTERN = /faq|frequently\s+asked|questions?\s+(?:and|&)\s+answers?/i;
const PRODUCT_PATTERN = /pricing|plans?|tier|subscription|per\s+month|\/mo/i;
const HOWTO_PATTERN = /how\s+to|step\s+\d|getting\s+started|tutorial|guide/i;
const ARTICLE_PATTERN = /published|author|reading\s+time|min\s+read/i;

export function analyzeSchemaPreview(botHtml: string, renderedHtml: string): SchemaPreviewResult {
  const jsonLds = extractJsonLd(botHtml);

  // Detect existing types
  const detectedTypes: SchemaDetection[] = [];
  for (const ld of jsonLds) {
    if (typeof ld !== 'object' || ld === null || !('@type' in ld)) {
      continue;
    }
    const rec = ld as Record<string, unknown>;
    const typeVal = rec['@type'];
    const types = Array.isArray(typeVal) ? typeVal : [typeVal];
    for (const t of types) {
      if (typeof t === 'string') {
        const props = Object.keys(rec).filter(k => !k.startsWith('@')).length;
        detectedTypes.push({ type: t, properties: props });
      }
    }
  }

  // Suggest generatable types based on page content
  const generatable: SchemaGeneratable[] = [];
  const text = extractVisibleText(renderedHtml);

  // Detect FAQ-like content — require both explicit FAQ heading AND question marks
  const questionMarks = (text.match(/\?/g) || []).length;
  if (FAQ_PATTERN.test(text) && questionMarks >= 3) {
    generatable.push({
      type: 'FAQPage',
      confidence: 0.87,
      reason: `FAQ section with ${questionMarks} questions detected`,
    });
  }

  // Detect Product/Pricing content — require pricing keywords AND actual price tokens
  if (PRODUCT_PATTERN.test(text)) {
    const priceMatches = (text.match(/\$[\d,.]+|\u20AC[\d,.]+|\u00A3[\d,.]+/g) || []).length;
    if (priceMatches >= 1) {
      generatable.push({
        type: 'Product',
        confidence: priceMatches >= 2 ? 0.92 : 0.7,
        reason: `${priceMatches} price points detected`,
      });
    }
  }

  // Detect HowTo content — require keyword AND numbered steps
  if (HOWTO_PATTERN.test(text)) {
    const stepMatches = (text.match(/step\s+\d|^\d+\./gim) || []).length;
    if (stepMatches >= 2) {
      generatable.push({
        type: 'HowTo',
        confidence: 0.75,
        reason: `${stepMatches} step-by-step patterns detected`,
      });
    }
  }

  // Detect Article content
  if (ARTICLE_PATTERN.test(text)) {
    generatable.push({
      type: 'Article',
      confidence: 0.8,
      reason: 'Article metadata patterns detected',
    });
  }

  // Filter out types that already exist
  const existingTypeSet = new Set(detectedTypes.map(d => d.type.toLowerCase()));
  const filteredGeneratable = generatable.filter(
    g => !existingTypeSet.has(g.type.toLowerCase()),
  );

  return {
    detectedTypes,
    generatable: filteredGeneratable,
  };
}
