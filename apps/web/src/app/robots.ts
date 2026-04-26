import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/utils/Helpers';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/score/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/score/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/score/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
