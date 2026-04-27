import { schema } from '@crawlready/database';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getScoreBand } from '@/components/score/score-utils';
import { db } from '@/libs/DB';
import type { EuAiActData, RecommendationData, ScanWarningData, SchemaPreviewData, VisualDiffData } from '@/types/scan';
import { getBaseUrl } from '@/utils/Helpers';

import { ScanResultPageClient } from './ScanResultPageClient';

type Props = {
  params: { id: string; locale: string };
};

async function getScanById(id: string) {
  const numericId = Number.parseInt(id, 10);
  if (Number.isNaN(numericId)) {
    return null;
  }

  const rows = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.id, numericId))
    .limit(1);

  return rows[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getScanById(params.id);
  const baseUrl = getBaseUrl();

  if (!row) {
    return {
      title: 'Scan Not Found | CrawlReady',
      description: 'This scan result could not be found.',
    };
  }

  const band = getScoreBand(row.aiReadinessScore);
  const title = `${row.domain} scored ${row.aiReadinessScore}/100 on AI Readiness | CrawlReady`;
  const description = `${row.domain} AI Readiness Score: ${row.aiReadinessScore}/100 (${band.label}). Crawlability: ${row.crawlabilityScore}, Agent Readiness: ${row.agentReadinessScore}, Agent Interaction: ${row.agentInteractionScore}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${row.domain}: ${row.aiReadinessScore}/100 AI Readiness Score`,
      description,
      url: `${baseUrl}/score/${row.domain}`,
      siteName: 'CrawlReady',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${row.domain}: ${row.aiReadinessScore}/100 AI Readiness`,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/score/${row.domain}`,
    },
  };
}

export default async function ScanResultPage({ params }: Props) {
  const row = await getScanById(params.id);

  if (!row) {
    notFound();
  }

  const scanData = {
    id: row.id,
    url: row.url,
    domain: row.domain,
    aiReadinessScore: row.aiReadinessScore,
    crawlabilityScore: row.crawlabilityScore,
    agentReadinessScore: row.agentReadinessScore,
    agentInteractionScore: row.agentInteractionScore,
    euAiAct: (row.euAiAct ?? { passed: 0, total: 4, checks: [] }) as EuAiActData,
    recommendations: (row.recommendations ?? []) as RecommendationData[],
    schemaPreview: (row.schemaPreview ?? { detectedTypes: [], generatable: [] }) as SchemaPreviewData,
    rawHtmlSize: row.rawHtmlSize,
    markdownSize: row.markdownSize,
    scannedAt: row.scannedAt.toISOString(),
    scoreUrl: `${getBaseUrl()}/score/${row.domain}`,
    warnings: (row.warnings ?? []) as ScanWarningData[],
    visualDiff: (row.visualDiff ?? null) as VisualDiffData | null,
  };

  return <ScanResultPageClient scan={scanData} />;
}
