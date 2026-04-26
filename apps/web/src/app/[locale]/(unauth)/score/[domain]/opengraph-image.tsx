import { schema } from '@crawlready/database';
import { desc, eq } from 'drizzle-orm';
import { ImageResponse } from 'next/og';

import { normalizeDomain } from '@/lib/crawl/normalize-url';
import { db } from '@/libs/DB';

export const runtime = 'nodejs';
export const alt = 'AI Readiness Score';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const SCORE_COLORS: Array<[number, string]> = [
  [20, '#dc2626'],
  [40, '#ea580c'],
  [60, '#ca8a04'],
  [80, '#16a34a'],
  [Infinity, '#059669'],
];

const SCORE_LABELS: Array<[number, string]> = [
  [20, 'Critical'],
  [40, 'Poor'],
  [60, 'Fair'],
  [80, 'Good'],
  [Infinity, 'Excellent'],
];

function getScoreColor(score: number): string {
  return SCORE_COLORS.find(([max]) => score <= max)?.[1] ?? '#059669';
}

function getScoreLabel(score: number): string {
  return SCORE_LABELS.find(([max]) => score <= max)?.[1] ?? 'Excellent';
}

export default async function OGImage({
  params,
}: {
  params: { domain: string };
}) {
  const rawDomain = decodeURIComponent(params.domain);
  let domain: string;
  try {
    domain = normalizeDomain(rawDomain);
  } catch {
    domain = rawDomain;
  }

  const rows = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.domain, domain))
    .orderBy(desc(schema.scans.scannedAt))
    .limit(1);

  const row = rows[0];
  const score = row?.aiReadinessScore ?? 0;
  const scoreColor = getScoreColor(score);
  const scoreLabel = row ? getScoreLabel(score) : 'Not Scanned';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          padding: '60px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '40px',
            opacity: 0.9,
          }}
        >
          CrawlReady
        </div>

        {/* Score circle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px',
            height: '200px',
            borderRadius: '100px',
            border: `8px solid ${scoreColor}`,
            marginBottom: '30px',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '72px', fontWeight: 800, color: scoreColor }}>
              {row ? score : '?'}
            </span>
            <span style={{ fontSize: '18px', opacity: 0.7 }}>/100</span>
          </div>
        </div>

        {/* Domain */}
        <div
          style={{
            display: 'flex',
            fontSize: '36px',
            fontWeight: 700,
            marginBottom: '12px',
          }}
        >
          {domain}
        </div>

        {/* Score label */}
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            color: scoreColor,
            fontWeight: 600,
          }}
        >
          AI Readiness:
          {' '}
          {scoreLabel}
        </div>

        {/* Sub-scores */}
        {row && (
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: '30px',
              fontSize: '18px',
              opacity: 0.8,
            }}
          >
            <span>
              Crawlability:
              {' '}
              {row.crawlabilityScore}
            </span>
            <span>
              Agent Readiness:
              {' '}
              {row.agentReadinessScore}
            </span>
            <span>
              Agent Interaction:
              {' '}
              {row.agentInteractionScore}
            </span>
          </div>
        )}

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            marginTop: '40px',
            fontSize: '16px',
            opacity: 0.6,
          }}
        >
          crawlready.app — Check your site&apos;s AI readiness
        </div>
      </div>
    ),
    { ...size },
  );
}
