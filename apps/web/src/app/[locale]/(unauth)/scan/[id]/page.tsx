import { schema } from '@crawlready/database';
import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { getScoreBand } from '@/components/score/score-utils';
import { db } from '@/libs/DB';
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/20">
          <p className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
            Scan Not Found
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            This scan result does not exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  const scanData = {
    id: row.id,
    url: row.url,
    domain: row.domain,
    aiReadinessScore: row.aiReadinessScore,
    crawlabilityScore: row.crawlabilityScore,
    agentReadinessScore: row.agentReadinessScore,
    agentInteractionScore: row.agentInteractionScore,
    euAiAct: (row.euAiAct ?? { passed: 0, total: 4, checks: [] }) as {
      passed: number;
      total: number;
      checks: Array<{ name: string; passed: boolean }>;
    },
    recommendations: (row.recommendations ?? []) as Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      description: string;
      impact: string;
    }>,
    schemaPreview: (row.schemaPreview ?? { detectedTypes: [], generatable: [] }) as {
      detectedTypes: Array<{ type: string; properties: number }>;
      generatable: Array<{ type: string; confidence: number; reason: string }>;
    },
    rawHtmlSize: row.rawHtmlSize,
    markdownSize: row.markdownSize,
    scannedAt: row.scannedAt.toISOString(),
    scoreUrl: `https://crawlready.app/score/${row.domain}`,
  };

  return <ScanResultPageClient scan={scanData} />;
}
