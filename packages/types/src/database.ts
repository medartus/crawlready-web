// Database table types - will be generated from Drizzle schema
// These are placeholder exports that will be replaced by actual Drizzle types

export type ApiKey = {
  id: string;
  userId: string;
  orgId: string | null;
  customerEmail: string;
  keyHash: string;
  keyPrefix: string;
  tier: 'free' | 'pro' | 'enterprise';
  rateLimitDaily: number;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export type NewApiKey = Omit<ApiKey, 'id' | 'createdAt'>;

export type RenderJob = {
  id: string;
  apiKeyId: string;
  url: string;
  normalizedUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  queuedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  renderDurationMs: number | null;
  htmlSizeBytes: number | null;
  storageKey: string | null;
  errorMessage: string | null;
  retryCount: number;
  workerId: string | null;
  puppeteerVersion: string | null;
};

export type NewRenderJob = Omit<RenderJob, 'id' | 'queuedAt' | 'status' | 'retryCount'>;

export type CacheAccess = {
  id: string;
  apiKeyId: string;
  normalizedUrl: string;
  cacheLocation: 'hot' | 'cold' | 'none';
  accessedAt: Date;
  responseTimeMs: number;
};

export type NewCacheAccess = Omit<CacheAccess, 'id' | 'accessedAt'>;

export type UsageDaily = {
  id: string;
  apiKeyId: string;
  date: Date;
  cacheHits: number;
  cacheMisses: number;
  rendersCompleted: number;
  rendersFailed: number;
  avgCacheHitTimeMs: number | null;
  avgRenderTimeMs: number | null;
  storageBytesAdded: number;
  totalStorageBytes: number;
};

export type NewUsageDaily = Omit<UsageDaily, 'id'>;

export type RenderedPage = {
  id: string;
  normalizedUrl: string;
  storageKey: string;
  storageLocation: 'hot' | 'cold' | 'none';
  apiKeyId: string | null;
  htmlSizeBytes: number;
  firstRenderedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  inRedis: boolean;
};

export type NewRenderedPage = Omit<RenderedPage, 'id' | 'firstRenderedAt' | 'lastAccessedAt'>;
