// Render job types for BullMQ queue

export type CrawlerType = 'search' | 'ai' | 'social' | 'monitoring' | 'unknown' | 'direct';

export type CrawlerInfo = {
  name: string | null;
  type: CrawlerType;
  userAgent: string | null;
};

export type RenderJobData = {
  jobId: string;
  url: string;
  normalizedUrl: string;
  apiKeyId: string;
  waitForSelector?: string;
  timeout?: number;
  // Crawler attribution
  userAgent?: string;
  crawlerName?: string;
  crawlerType?: CrawlerType;
  siteId?: string;
};

export type RenderJobResult = {
  success: boolean;
  htmlSizeBytes?: number;
  renderDurationMs?: number;
  cacheKey?: string;
  error?: string;
};

export type RenderOptions = {
  waitForSelector?: string;
  timeout?: number;
  blockResources?: boolean;
  autoScroll?: boolean;
};

export type RenderPageResult = {
  html: string;
  renderTime: number;
  screenshot?: string;
};
