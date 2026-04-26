import { schema } from '@crawlready/database';
import { desc, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { ScanForm } from '@/components/score/ScanForm';
import { ScanResultCard } from '@/components/score/ScanResultCard';
import { getScoreBand } from '@/components/score/score-utils';
import { normalizeDomain } from '@/lib/crawl/normalize-url';
import { db } from '@/libs/DB';
import { getBaseUrl } from '@/utils/Helpers';

type Props = {
  params: { domain: string; locale: string };
};

async function getLatestScan(rawDomain: string) {
  let domain: string;
  try {
    domain = normalizeDomain(rawDomain);
  } catch {
    return null;
  }

  const rows = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.domain, domain))
    .orderBy(desc(schema.scans.scannedAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getLatestScan(params.domain);
  const baseUrl = getBaseUrl();
  const domain = decodeURIComponent(params.domain);

  if (!row) {
    return {
      title: `AI Readiness Score for ${domain} | CrawlReady`,
      description: `Check the AI Readiness Score for ${domain}. See how well this site is optimized for AI crawlers like GPTBot, ClaudeBot, and PerplexityBot.`,
      openGraph: {
        title: `AI Readiness Score for ${domain}`,
        description: `Check the AI Readiness Score for ${domain}. See how well this site is optimized for AI crawlers.`,
        url: `${baseUrl}/score/${domain}`,
        siteName: 'CrawlReady',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `AI Readiness Score for ${domain}`,
        description: `Check the AI Readiness Score for ${domain}.`,
      },
      alternates: {
        canonical: `${baseUrl}/score/${domain}`,
      },
    };
  }

  const band = getScoreBand(row.aiReadinessScore);
  const title = `${domain} scored ${row.aiReadinessScore}/100 on AI Readiness | CrawlReady`;
  const description = `${domain} AI Readiness Score: ${row.aiReadinessScore}/100 (${band.label}). Crawlability: ${row.crawlabilityScore}, Agent Readiness: ${row.agentReadinessScore}, Agent Interaction: ${row.agentInteractionScore}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${domain}: ${row.aiReadinessScore}/100 AI Readiness Score`,
      description,
      url: `${baseUrl}/score/${domain}`,
      siteName: 'CrawlReady',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${domain}: ${row.aiReadinessScore}/100 AI Readiness`,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/score/${domain}`,
    },
  };
}

export default async function ScoreResultPage({ params }: Props) {
  const row = await getLatestScan(params.domain);
  const domain = decodeURIComponent(params.domain);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            CrawlReady
          </span>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {!row && (
          <div className="mx-auto max-w-lg space-y-8 py-12">
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950/20">
              <p className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
                No scan found for
                {' '}
                <span className="font-mono">{domain}</span>
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Run a scan to generate a score for this domain.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
                Scan a URL
              </h3>
              <ScanForm />
            </div>
          </div>
        )}

        {row && (
          <ScanResultCard
            result={{
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
              scannedAt: row.scannedAt.toISOString(),
              scoreUrl: `https://crawlready.app/score/${row.domain}`,
            }}
          />
        )}

        {/* CTA: Check your site */}
        {row && (
          <div className="mt-12 rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
              Check your site&apos;s AI readiness
            </h3>
            <div className="mx-auto max-w-xl">
              <ScanForm />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
