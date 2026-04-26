import { schema } from '@crawlready/database';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { normalizeDomain } from '@/lib/crawl/normalize-url';
import { db } from '@/libs/DB';

export async function GET(
  _request: Request,
  { params }: { params: { domain: string } },
) {
  let domain: string;
  try {
    domain = normalizeDomain(params.domain);
  } catch {
    return NextResponse.json(
      { code: 'INVALID_DOMAIN', message: 'Invalid domain format.' },
      { status: 400 },
    );
  }

  const rows = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.domain, domain))
    .orderBy(desc(schema.scans.scannedAt))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return NextResponse.json(
      { code: 'NOT_FOUND', message: `No scan found for domain: ${domain}` },
      { status: 404 },
    );
  }

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
    rawHtmlSize: row.rawHtmlSize,
    markdownSize: row.markdownSize,
    scannedAt: row.scannedAt.toISOString(),
    scoringVersion: row.scoringVersion,
  });
}
