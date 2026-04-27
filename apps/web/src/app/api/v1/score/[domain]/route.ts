import { schema } from '@crawlready/database';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { normalizeDomain } from '@/lib/crawl/normalize-url';
import { apiError } from '@/lib/utils/api-helpers';
import { db } from '@/libs/DB';
import { getBaseUrl } from '@/utils/Helpers';

export async function GET(
  _request: Request,
  { params }: { params: { domain: string } },
) {
  let domain: string;
  try {
    domain = normalizeDomain(params.domain);
  } catch {
    return apiError('INVALID_DOMAIN', 'Invalid domain format.', 400);
  }

  const rows = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.domain, domain))
    .orderBy(desc(schema.scans.scannedAt))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return apiError('NOT_FOUND', `No scan found for domain: ${domain}`, 404);
  }

  const baseUrl = getBaseUrl();

  return NextResponse.json({
    id: row.id,
    url: row.url,
    domain: row.domain,
    aiReadinessScore: row.aiReadinessScore,
    crawlabilityScore: row.crawlabilityScore,
    agentReadinessScore: row.agentReadinessScore,
    agentInteractionScore: row.agentInteractionScore,
    euAiAct: row.euAiAct ?? { passed: 0, total: 4, checks: [] },
    recommendations: row.recommendations ?? [],
    schemaPreview: row.schemaPreview ?? { detectedTypes: [], generatable: [] },
    visualDiff: row.visualDiff ?? null,
    warnings: row.warnings ?? [],
    scoreUrl: `${baseUrl}/score/${row.domain}`,
    rawHtmlSize: row.rawHtmlSize,
    markdownSize: row.markdownSize,
    scannedAt: row.scannedAt.toISOString(),
    scoringVersion: row.scoringVersion,
  });
}
