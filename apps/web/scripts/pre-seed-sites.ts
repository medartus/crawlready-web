#!/usr/bin/env npx tsx
/* eslint-disable no-console */
/**
 * Pre-seed ~20 popular developer tool sites via the scan API.
 *
 * Usage:
 *   npx tsx apps/web/scripts/pre-seed-sites.ts [--base-url http://localhost:3000]
 *
 * This script calls POST /api/v1/scan for each site, waits for the
 * result, and reports the score.  Runs sequentially to stay within
 * rate limits and Firecrawl quotas.
 *
 * Sites span CSR SPAs, SSR, docs, and SaaS marketing per the bead spec.
 */

const SITES = [
  // CSR / SPA heavy
  { url: 'https://app.netlify.com', category: 'CSR SPA' },
  { url: 'https://figma.com', category: 'CSR SPA' },
  { url: 'https://linear.app', category: 'CSR SPA' },

  // SSR / Hybrid
  { url: 'https://vercel.com', category: 'SSR' },
  { url: 'https://nextjs.org', category: 'SSR' },
  { url: 'https://stripe.com', category: 'SSR' },
  { url: 'https://supabase.com', category: 'SSR' },
  { url: 'https://tailwindcss.com', category: 'SSR' },

  // Documentation sites
  { url: 'https://docs.github.com', category: 'Docs' },
  { url: 'https://react.dev', category: 'Docs' },
  { url: 'https://developer.mozilla.org', category: 'Docs' },
  { url: 'https://docs.python.org/3/', category: 'Docs' },

  // SaaS marketing
  { url: 'https://notion.so', category: 'SaaS' },
  { url: 'https://slack.com', category: 'SaaS' },
  { url: 'https://github.com', category: 'SaaS' },
  { url: 'https://gitlab.com', category: 'SaaS' },
  { url: 'https://sentry.io', category: 'SaaS' },
  { url: 'https://datadog.com', category: 'SaaS' },

  // Static / Blog
  { url: 'https://astro.build', category: 'Static' },
  { url: 'https://svelte.dev', category: 'Static' },
];

type ScanResponse = {
  domain: string;
  aiReadinessScore: number;
  crawlabilityScore: number;
  agentReadinessScore: number;
  agentInteractionScore: number;
  error?: { code: string; message: string };
};

async function scanSite(
  baseUrl: string,
  url: string,
): Promise<ScanResponse | { error: string }> {
  try {
    const res = await fetch(`${baseUrl}/api/v1/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data?.error?.message ?? `HTTP ${res.status}` };
    }

    return data as ScanResponse;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrlIdx = args.indexOf('--base-url');
  const baseUrl = baseUrlIdx !== -1 && args[baseUrlIdx + 1]
    ? args[baseUrlIdx + 1]!
    : 'http://localhost:3000';

  console.log(`\n🚀 Pre-seeding ${SITES.length} sites via ${baseUrl}\n`);
  console.log(`${'#'.padEnd(4)} ${'Category'.padEnd(12)} ${'URL'.padEnd(35)} ${'AI'.padEnd(6)} ${'Crawl'.padEnd(6)} ${'Agent'.padEnd(6)} ${'Inter'.padEnd(6)} Status`);
  console.log('-'.repeat(100));

  const results: Array<{
    url: string;
    category: string;
    score: number | null;
    status: string;
  }> = [];

  for (let i = 0; i < SITES.length; i++) {
    const site = SITES[i]!;
    const result = await scanSite(baseUrl, site.url);

    if ('error' in result && typeof result.error === 'string') {
      console.log(`${String(i + 1).padEnd(4)} ${site.category.padEnd(12)} ${site.url.padEnd(35)} ${'-'.padEnd(6)} ${'-'.padEnd(6)} ${'-'.padEnd(6)} ${'-'.padEnd(6)} ❌ ${result.error}`);
      results.push({ url: site.url, category: site.category, score: null, status: result.error });
    } else {
      const r = result as ScanResponse;
      console.log(`${String(i + 1).padEnd(4)} ${site.category.padEnd(12)} ${site.url.padEnd(35)} ${String(r.aiReadinessScore).padEnd(6)} ${String(r.crawlabilityScore).padEnd(6)} ${String(r.agentReadinessScore).padEnd(6)} ${String(r.agentInteractionScore).padEnd(6)} ✅`);
      results.push({ url: site.url, category: site.category, score: r.aiReadinessScore, status: 'ok' });
    }

    // Delay between requests to respect rate limits
    if (i < SITES.length - 1) {
      await sleep(2000);
    }
  }

  // Summary
  const successful = results.filter(r => r.score !== null);
  const failed = results.filter(r => r.score === null);
  const scores = successful.map(r => r.score!);
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  console.log(`\n${'='.repeat(100)}`);
  console.log(`\n📊 Summary: ${successful.length}/${SITES.length} scanned successfully`);
  if (scores.length > 0) {
    console.log(`   Average AI Readiness Score: ${avg}/100`);
    console.log(`   Min: ${Math.min(...scores)} | Max: ${Math.max(...scores)}`);
  }
  if (failed.length > 0) {
    console.log(`\n❌ Failed (${failed.length}):`);
    for (const f of failed) {
      console.log(`   ${f.url}: ${f.status}`);
    }
  }

  console.log(`\n✅ Score pages ready at:`);
  for (const r of successful) {
    console.log(`   ${baseUrl}/score/${new URL(r.url).hostname.replace(/^www\./, '')}`);
  }
  console.log('');
}

main().catch(console.error);
