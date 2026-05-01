import { schema } from '@crawlready/database';
import { desc, eq } from 'drizzle-orm';
import type { Metadata } from 'next';

import { ScanForm } from '@/components/score/ScanForm';
import { normalizeDomain } from '@/lib/crawl/normalize-url';
import { db } from '@/libs/DB';
import type { RecommendationData, VisualDiffData, VisualDiffStatsData } from '@/types/scan';
import { getBaseUrl } from '@/utils/Helpers';

import { ScorePageContent } from './ScorePageContent';

type Props = {
  params: Promise<{ domain: string; locale: string }>;
};

const BAND_LABELS = ['Critical', 'Poor', 'Fair', 'Good', 'Excellent'] as const;
function bandLabel(score: number) {
  if (score <= 20) {
    return BAND_LABELS[0];
  }
  if (score <= 40) {
    return BAND_LABELS[1];
  }
  if (score <= 60) {
    return BAND_LABELS[2];
  }
  if (score <= 80) {
    return BAND_LABELS[3];
  }
  return BAND_LABELS[4];
}

async function getLatestScan(rawDomain: string) {
  let domain: string;
  try {
    domain = normalizeDomain(rawDomain);
  } catch {
    return null;
  }

  try {
    const rows = await db
      .select()
      .from(schema.scans)
      .where(eq(schema.scans.domain, domain))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(1);

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { domain: rawDomain } = await props.params;
  const row = await getLatestScan(rawDomain);
  const baseUrl = getBaseUrl();
  const domain = decodeURIComponent(rawDomain);

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

  const label = bandLabel(row.aiReadinessScore);
  const title = `${domain} scored ${row.aiReadinessScore}/100 on AI Readiness | CrawlReady`;
  const description = `${domain} AI Readiness Score: ${row.aiReadinessScore}/100 (${label}). Crawlability: ${row.crawlabilityScore}, Agent Readiness: ${row.agentReadinessScore}, Agent Interaction: ${row.agentInteractionScore}.`;

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

export default async function ScoreResultPage(props: Props) {
  const { domain: rawDomain } = await props.params;
  const row = await getLatestScan(rawDomain);
  const domain = decodeURIComponent(rawDomain);
  const baseUrl = getBaseUrl();

  /* ── No scan found ───────────────────────────────────────── */
  if (!row) {
    return (
      <div
        className="bg-cr-bg flex min-h-screen flex-col items-center justify-center px-5"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
      >
        <div className="w-full max-w-md text-center">
          <p className="text-cr-fg-muted text-sm font-medium">No scan found for</p>
          <p className="text-cr-fg mt-1 font-mono text-lg">{domain}</p>
          <p className="text-cr-fg-secondary mt-3 text-sm">
            Run a scan to see how AI crawlers see this site.
          </p>
          <div className="mt-8">
            <ScanForm />
          </div>
        </div>
      </div>
    );
  }

  /* ── Has scan data ───────────────────────────────────────── */
  const visualDiff = row.visualDiff as VisualDiffData | null;

  return (
    <ScorePageContent
      domain={row.domain}
      url={row.url}
      aiReadinessScore={row.aiReadinessScore}
      crawlabilityScore={row.crawlabilityScore}
      agentReadinessScore={row.agentReadinessScore}
      agentInteractionScore={row.agentInteractionScore}
      recommendations={(row.recommendations ?? []) as RecommendationData[]}
      visualDiffStats={visualDiff?.stats as VisualDiffStatsData | null ?? null}
      scannedAt={row.scannedAt.toISOString()}
      scoreUrl={`${baseUrl}/score/${row.domain}`}
      scanId={row.id}
    />
  );
}
