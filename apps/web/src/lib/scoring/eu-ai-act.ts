/**
 * EU AI Act Transparency Checklist (4 binary checks)
 *
 * Does NOT affect the numeric score. Displayed separately.
 * All checks use bot HTML.
 *
 * See docs/architecture/scoring-detail.md § EU AI Act Transparency Checklist.
 */

import { extractJsonLd, extractMetaTags } from './html-utils';

export type EuAiActCheck = {
  name: string;
  passed: boolean;
};

export type EuAiActResult = {
  passed: number;
  total: number;
  checks: EuAiActCheck[];
};

export function scoreEuAiAct(botHtml: string): EuAiActResult {
  const metas = extractMetaTags(botHtml);
  const jsonLds = extractJsonLd(botHtml);

  // 1. Content Provenance — meta author or Schema.org author
  const hasMetaAuthor = !!metas.get('author');
  const hasSchemaAuthor = jsonLds.some(
    ld => typeof ld === 'object' && ld !== null && 'author' in ld,
  );
  const contentProvenance = hasMetaAuthor || hasSchemaAuthor;

  // 2. Content Transparency — meta generator or visible "About"/"Imprint" link
  const hasGenerator = !!metas.get('generator');
  const hasAboutLink = /href\s*=\s*["'][^"']*(?:about|imprint|impressum)["']/i.test(botHtml);
  const contentTransparency = hasGenerator || hasAboutLink;

  // 3. Machine-Readable Marking — any JSON-LD with @type
  const machineReadable = jsonLds.some(
    ld => typeof ld === 'object' && ld !== null && '@type' in ld,
  );

  // 4. Structured Data Provenance — JSON-LD includes publisher or creator
  const structuredProvenance = jsonLds.some((ld) => {
    if (typeof ld !== 'object' || ld === null) {
      return false;
    }
    return 'publisher' in ld || 'creator' in ld;
  });

  const checks: EuAiActCheck[] = [
    { name: 'content_provenance', passed: contentProvenance },
    { name: 'content_transparency', passed: contentTransparency },
    { name: 'machine_readable_marking', passed: machineReadable },
    { name: 'structured_data_provenance', passed: structuredProvenance },
  ];

  return {
    passed: checks.filter(c => c.passed).length,
    total: 4,
    checks,
  };
}
