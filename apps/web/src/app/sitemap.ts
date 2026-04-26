import { schema } from '@crawlready/database';
import { desc, sql } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

import { db } from '@/libs/DB';
import { getBaseUrl } from '@/utils/Helpers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  // Dynamic score pages — get distinct domains with latest scan date
  try {
    const domainRows = await db
      .select({
        domain: schema.scans.domain,
        lastScanned: sql<Date>`max(${schema.scans.scannedAt})`.as('last_scanned'),
      })
      .from(schema.scans)
      .groupBy(schema.scans.domain)
      .orderBy(desc(sql`max(${schema.scans.scannedAt})`))
      .limit(1000);

    const scorePages: MetadataRoute.Sitemap = domainRows.map(row => ({
      url: `${baseUrl}/score/${row.domain}`,
      lastModified: row.lastScanned ? new Date(row.lastScanned) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...scorePages];
  } catch {
    return staticPages;
  }
}
