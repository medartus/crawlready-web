/**
 * Firecrawl adapter — implements CrawlProvider using Firecrawl SaaS.
 *
 * One crawl = one Firecrawl credit (JS-rendered scrape).
 * Returns HTML + Markdown + metadata.
 */

import FirecrawlApp from '@mendable/firecrawl-js';

import { Env } from '@/libs/Env';

import type { CrawlProvider, CrawlResult } from './provider';
import { CrawlProviderError } from './provider';

let _client: FirecrawlApp | null = null;

function getClient(): FirecrawlApp {
  if (_client) {
    return _client;
  }
  const apiKey = Env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new CrawlProviderError(
      'FIRECRAWL_API_KEY is not configured',
      undefined,
      'firecrawl',
    );
  }
  _client = new FirecrawlApp({ apiKey });
  return _client;
}

let _provider: CrawlProvider | null = null;

export function createFirecrawlProvider(): CrawlProvider {
  if (_provider) {
    return _provider;
  }
  const provider: CrawlProvider = {
    name: 'firecrawl',

    scrape: async (url: string): Promise<CrawlResult> => {
      const client = getClient();

      try {
        const doc = await client.scrape(url, {
          formats: ['html', 'markdown'],
        });

        return {
          html: doc.html ?? '',
          markdown: doc.markdown ?? '',
          url: doc.metadata?.sourceURL ?? url,
          statusCode: doc.metadata?.statusCode ?? 200,
          metadata: {
            title: doc.metadata?.title,
            description: doc.metadata?.description,
            language: doc.metadata?.language,
            ogImage: doc.metadata?.ogImage,
          },
        };
      } catch (error) {
        if (error instanceof CrawlProviderError) {
          throw error;
        }

        throw new CrawlProviderError(
          error instanceof Error ? error.message : 'Unknown Firecrawl error',
          502,
          'firecrawl',
        );
      }
    },
  };
  _provider = provider;
  return provider;
}
