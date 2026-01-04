// Render job types for BullMQ queue

export type RenderJobData = {
  jobId: string;
  url: string;
  normalizedUrl: string;
  apiKeyId: string;
  waitForSelector?: string;
  timeout?: number;
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
