#!/usr/bin/env npx tsx
/* eslint-disable no-console */
/**
 * Firecrawl 100-crawl validation — M1 hard gate.
 *
 * Crawls 100 sites across 4 categories (CSR SPA, SSR, Documentation, SaaS marketing)
 * and records cost, latency, HTML quality, Markdown quality per crawl.
 *
 * Usage:
 *   FIRECRAWL_API_KEY=fc-xxx npx tsx apps/web/scripts/validate-firecrawl.ts
 *   FIRECRAWL_API_KEY=fc-xxx npx tsx apps/web/scripts/validate-firecrawl.ts --output=report.json
 *
 * Pass criteria (per docs/milestones.md):
 *   - Avg latency < 15s
 *   - Output quality sufficient for scoring (HTML > 500 chars, Markdown > 100 chars)
 *   - Success rate > 90%
 */

import FirecrawlApp from '@mendable/firecrawl-js';

type Category = 'CSR SPA' | 'SSR' | 'Documentation' | 'SaaS Marketing';

type TestSite = { url: string; category: Category };

const TEST_SITES: TestSite[] = [
  // CSR SPA (25)
  { url: 'https://app.netlify.com', category: 'CSR SPA' },
  { url: 'https://figma.com', category: 'CSR SPA' },
  { url: 'https://linear.app', category: 'CSR SPA' },
  { url: 'https://notion.so', category: 'CSR SPA' },
  { url: 'https://airtable.com', category: 'CSR SPA' },
  { url: 'https://miro.com', category: 'CSR SPA' },
  { url: 'https://canva.com', category: 'CSR SPA' },
  { url: 'https://monday.com', category: 'CSR SPA' },
  { url: 'https://asana.com', category: 'CSR SPA' },
  { url: 'https://trello.com', category: 'CSR SPA' },
  { url: 'https://todoist.com', category: 'CSR SPA' },
  { url: 'https://clickup.com', category: 'CSR SPA' },
  { url: 'https://retool.com', category: 'CSR SPA' },
  { url: 'https://bubble.io', category: 'CSR SPA' },
  { url: 'https://webflow.com', category: 'CSR SPA' },
  { url: 'https://framer.com', category: 'CSR SPA' },
  { url: 'https://loom.com', category: 'CSR SPA' },
  { url: 'https://pitch.com', category: 'CSR SPA' },
  { url: 'https://coda.io', category: 'CSR SPA' },
  { url: 'https://excalidraw.com', category: 'CSR SPA' },
  { url: 'https://figma.com/design', category: 'CSR SPA' },
  { url: 'https://app.diagrams.net', category: 'CSR SPA' },
  { url: 'https://codesandbox.io', category: 'CSR SPA' },
  { url: 'https://stackblitz.com', category: 'CSR SPA' },
  { url: 'https://replit.com', category: 'CSR SPA' },

  // SSR / Hybrid (25)
  { url: 'https://vercel.com', category: 'SSR' },
  { url: 'https://nextjs.org', category: 'SSR' },
  { url: 'https://stripe.com', category: 'SSR' },
  { url: 'https://supabase.com', category: 'SSR' },
  { url: 'https://tailwindcss.com', category: 'SSR' },
  { url: 'https://clerk.com', category: 'SSR' },
  { url: 'https://remix.run', category: 'SSR' },
  { url: 'https://nuxt.com', category: 'SSR' },
  { url: 'https://svelte.dev', category: 'SSR' },
  { url: 'https://solidjs.com', category: 'SSR' },
  { url: 'https://angular.dev', category: 'SSR' },
  { url: 'https://vuejs.org', category: 'SSR' },
  { url: 'https://kit.svelte.dev', category: 'SSR' },
  { url: 'https://turso.tech', category: 'SSR' },
  { url: 'https://planetscale.com', category: 'SSR' },
  { url: 'https://neon.tech', category: 'SSR' },
  { url: 'https://railway.app', category: 'SSR' },
  { url: 'https://render.com', category: 'SSR' },
  { url: 'https://fly.io', category: 'SSR' },
  { url: 'https://deno.com', category: 'SSR' },
  { url: 'https://bun.sh', category: 'SSR' },
  { url: 'https://hono.dev', category: 'SSR' },
  { url: 'https://trpc.io', category: 'SSR' },
  { url: 'https://orm.drizzle.team', category: 'SSR' },
  { url: 'https://www.prisma.io', category: 'SSR' },

  // Documentation (25)
  { url: 'https://docs.github.com', category: 'Documentation' },
  { url: 'https://react.dev', category: 'Documentation' },
  { url: 'https://developer.mozilla.org', category: 'Documentation' },
  { url: 'https://docs.python.org/3/', category: 'Documentation' },
  { url: 'https://docusaurus.io', category: 'Documentation' },
  { url: 'https://www.gitbook.com', category: 'Documentation' },
  { url: 'https://readthedocs.org', category: 'Documentation' },
  { url: 'https://docs.astro.build', category: 'Documentation' },
  { url: 'https://docs.nestjs.com', category: 'Documentation' },
  { url: 'https://docs.expo.dev', category: 'Documentation' },
  { url: 'https://docs.flutter.dev', category: 'Documentation' },
  { url: 'https://kubernetes.io/docs/', category: 'Documentation' },
  { url: 'https://docs.docker.com', category: 'Documentation' },
  { url: 'https://docs.aws.amazon.com', category: 'Documentation' },
  { url: 'https://cloud.google.com/docs', category: 'Documentation' },
  { url: 'https://learn.microsoft.com', category: 'Documentation' },
  { url: 'https://docs.stripe.com', category: 'Documentation' },
  { url: 'https://docs.sentry.io', category: 'Documentation' },
  { url: 'https://docs.netlify.com', category: 'Documentation' },
  { url: 'https://docs.vercel.com', category: 'Documentation' },
  { url: 'https://vitest.dev', category: 'Documentation' },
  { url: 'https://playwright.dev', category: 'Documentation' },
  { url: 'https://jestjs.io', category: 'Documentation' },
  { url: 'https://eslint.org', category: 'Documentation' },
  { url: 'https://prettier.io', category: 'Documentation' },

  // SaaS Marketing (25)
  { url: 'https://github.com', category: 'SaaS Marketing' },
  { url: 'https://gitlab.com', category: 'SaaS Marketing' },
  { url: 'https://slack.com', category: 'SaaS Marketing' },
  { url: 'https://zoom.us', category: 'SaaS Marketing' },
  { url: 'https://discord.com', category: 'SaaS Marketing' },
  { url: 'https://intercom.com', category: 'SaaS Marketing' },
  { url: 'https://hubspot.com', category: 'SaaS Marketing' },
  { url: 'https://zendesk.com', category: 'SaaS Marketing' },
  { url: 'https://datadog.com', category: 'SaaS Marketing' },
  { url: 'https://sentry.io', category: 'SaaS Marketing' },
  { url: 'https://launchdarkly.com', category: 'SaaS Marketing' },
  { url: 'https://posthog.com', category: 'SaaS Marketing' },
  { url: 'https://amplitude.com', category: 'SaaS Marketing' },
  { url: 'https://segment.com', category: 'SaaS Marketing' },
  { url: 'https://mixpanel.com', category: 'SaaS Marketing' },
  { url: 'https://auth0.com', category: 'SaaS Marketing' },
  { url: 'https://okta.com', category: 'SaaS Marketing' },
  { url: 'https://twilio.com', category: 'SaaS Marketing' },
  { url: 'https://sendgrid.com', category: 'SaaS Marketing' },
  { url: 'https://algolia.com', category: 'SaaS Marketing' },
  { url: 'https://elastic.co', category: 'SaaS Marketing' },
  { url: 'https://cloudflare.com', category: 'SaaS Marketing' },
  { url: 'https://fastly.com', category: 'SaaS Marketing' },
  { url: 'https://digitalocean.com', category: 'SaaS Marketing' },
  { url: 'https://heroku.com', category: 'SaaS Marketing' },
];

type CrawlRecord = {
  url: string;
  category: Category;
  success: boolean;
  latencyMs: number;
  htmlLength: number;
  markdownLength: number;
  statusCode: number;
  error?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('❌ Set FIRECRAWL_API_KEY environment variable');
    process.exit(1);
  }

  const outputArg = process.argv.find(a => a.startsWith('--output='));
  const outputFile = outputArg?.split('=')[1] ?? null;

  const client = new FirecrawlApp({ apiKey });

  console.log(`\n🔥 Firecrawl 100-Crawl Validation (M1 Hard Gate)\n`);
  console.log(`   Sites: ${TEST_SITES.length}`);
  console.log(`   Categories: CSR SPA (25), SSR (25), Documentation (25), SaaS Marketing (25)\n`);
  console.log('─'.repeat(90));

  const records: CrawlRecord[] = [];

  for (let i = 0; i < TEST_SITES.length; i++) {
    const site = TEST_SITES[i]!;
    const idx = `[${String(i + 1).padStart(3)}/${TEST_SITES.length}]`;

    process.stdout.write(`${idx} ${site.category.padEnd(16)} ${site.url.padEnd(40)} `);

    const start = Date.now();
    try {
      const doc = await client.scrape(site.url, { formats: ['html', 'markdown'] });
      const latencyMs = Date.now() - start;

      const htmlLen = (doc.html ?? '').length;
      const mdLen = (doc.markdown ?? '').length;
      const statusCode = doc.metadata?.statusCode ?? 200;

      records.push({
        url: site.url,
        category: site.category,
        success: true,
        latencyMs,
        htmlLength: htmlLen,
        markdownLength: mdLen,
        statusCode,
      });

      console.log(`✅ ${latencyMs}ms | HTML:${htmlLen} MD:${mdLen} | ${statusCode}`);
    } catch (err) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      records.push({
        url: site.url,
        category: site.category,
        success: false,
        latencyMs,
        htmlLength: 0,
        markdownLength: 0,
        statusCode: 0,
        error: errorMsg,
      });

      console.log(`❌ ${latencyMs}ms | ${errorMsg}`);
    }

    // Small delay between crawls
    if (i < TEST_SITES.length - 1) {
      await sleep(500);
    }
  }

  // Generate report
  console.log(`\n${'═'.repeat(90)}`);
  console.log('\n📊 VALIDATION REPORT\n');

  const successful = records.filter(r => r.success);
  const failed = records.filter(r => !r.success);

  console.log(`Overall: ${successful.length}/${records.length} successful (${Math.round(successful.length / records.length * 100)}%)`);

  // Per-category stats
  const categories: Category[] = ['CSR SPA', 'SSR', 'Documentation', 'SaaS Marketing'];
  for (const cat of categories) {
    const catRecords = records.filter(r => r.category === cat);
    const catOk = catRecords.filter(r => r.success);
    const catLatencies = catOk.map(r => r.latencyMs);
    const avgLatency = catLatencies.length > 0
      ? Math.round(catLatencies.reduce((a, b) => a + b, 0) / catLatencies.length)
      : 0;
    const avgHtml = catOk.length > 0
      ? Math.round(catOk.reduce((a, b) => a + b.htmlLength, 0) / catOk.length)
      : 0;
    const avgMd = catOk.length > 0
      ? Math.round(catOk.reduce((a, b) => a + b.markdownLength, 0) / catOk.length)
      : 0;

    console.log(`\n  ${cat} (${catOk.length}/${catRecords.length}):`);
    console.log(`    Avg latency: ${avgLatency}ms`);
    console.log(`    Avg HTML size: ${avgHtml} chars`);
    console.log(`    Avg Markdown size: ${avgMd} chars`);
  }

  // Overall metrics
  const allLatencies = successful.map(r => r.latencyMs);
  const avgLatency = allLatencies.length > 0
    ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length)
    : 0;
  const p95Latency = allLatencies.length > 0
    ? allLatencies.sort((a, b) => a - b)[Math.floor(allLatencies.length * 0.95)]!
    : 0;
  const lowQualityHtml = successful.filter(r => r.htmlLength < 500).length;
  const lowQualityMd = successful.filter(r => r.markdownLength < 100).length;

  console.log('\n  Overall Metrics:');
  console.log(`    Avg latency: ${avgLatency}ms`);
  console.log(`    P95 latency: ${p95Latency}ms`);
  console.log(`    Low-quality HTML (<500 chars): ${lowQualityHtml}`);
  console.log(`    Low-quality Markdown (<100 chars): ${lowQualityMd}`);

  // Pass/fail criteria
  console.log('\n  PASS/FAIL:');
  const successRate = successful.length / records.length;
  const latencyPass = avgLatency < 15000;
  const successPass = successRate >= 0.9;

  console.log(`    [${successPass ? 'PASS' : 'FAIL'}] Success rate: ${Math.round(successRate * 100)}% (need ≥90%)`);
  console.log(`    [${latencyPass ? 'PASS' : 'FAIL'}] Avg latency: ${avgLatency}ms (need <15000ms)`);
  console.log(`    [${lowQualityHtml <= 5 ? 'PASS' : 'WARN'}] Low-quality HTML: ${lowQualityHtml} (acceptable ≤5)`);
  console.log(`    [${lowQualityMd <= 5 ? 'PASS' : 'WARN'}] Low-quality Markdown: ${lowQualityMd} (acceptable ≤5)`);

  const overallPass = successPass && latencyPass;
  console.log(`\n  🏁 Overall: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);

  if (failed.length > 0) {
    console.log('\n  Failed sites:');
    for (const f of failed) {
      console.log(`    - [${f.category}] ${f.url}: ${f.error}`);
    }
  }

  // Write JSON report if requested
  if (outputFile) {
    const { writeFileSync } = await import('node:fs');
    const report = {
      timestamp: new Date().toISOString(),
      totalSites: records.length,
      successful: successful.length,
      failed: failed.length,
      successRate,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      overallPass,
      categories: Object.fromEntries(
        categories.map((cat) => {
          const catRecords = records.filter(r => r.category === cat);
          const catOk = catRecords.filter(r => r.success);
          return [cat, {
            total: catRecords.length,
            successful: catOk.length,
            avgLatencyMs: catOk.length > 0
              ? Math.round(catOk.reduce((a, b) => a + b.latencyMs, 0) / catOk.length)
              : 0,
          }];
        }),
      ),
      records,
    };
    writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`\n  📄 Report saved to: ${outputFile}`);
  }

  console.log('');
  process.exit(overallPass ? 0 : 1);
}

main().catch(console.error);
