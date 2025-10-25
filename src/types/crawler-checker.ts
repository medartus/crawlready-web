export type RenderResult = {
  html: string;
  textContent: string;
  contentLength: number;
  hasSchema: boolean;
  renderTime: number;
  screenshot?: string;
};

export type Issue = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  crawler: string;
  description: string;
  fix: string;
};

export type CrawlerCompatibility = {
  GPTBot: 'full' | 'partial' | 'poor';
  ClaudeBot: 'full' | 'partial' | 'poor';
  PerplexityBot: 'full' | 'partial' | 'poor';
  GoogleBot: 'full' | 'partial' | 'poor';
};

export type CategoryScores = {
  javascript: number;
  technicalSEO: number;
  schemaMetadata: number;
  contentQuality: number;
  performance: number;
  navigation: number;
  security: number;
};

export type ViewDifference = {
  type: 'javascript' | 'lazy-loading' | 'hidden-content' | 'dynamic-content';
  severity: 'critical' | 'high' | 'medium' | 'low';
  crawler: string;
  description: string;
  impact: string;
  fix: string;
};

export interface CrawlerViewComparison {
  userViewUrl: string;
  crawlerViewHtml: string;
  differences: ViewDifference[];
  statistics: {
    jsScriptsRemoved: number;
    eventHandlersRemoved: number;
    lazyImagesDetected: number;
    hiddenContentDetected: number;
    dynamicContentDetected: number;
  };
};

export type CompatibilityReport = {
  score: number; // 0-100
  issues: Issue[];
  recommendations: string[];
  crawlerCompatibility: CrawlerCompatibility;
  categoryScores?: CategoryScores; // Optional for backward compatibility
  visualComparison?: CrawlerViewComparison; // Visual comparison between user and crawler view
  userView: RenderResult;
  crawlerView: RenderResult;
  limitedJSView: RenderResult;
  checkedAt: string;
  url: string;
};

export type CheckCrawlerRequest = {
  url: string;
};

export type CheckCrawlerResponse = {
  success: boolean;
  report?: CompatibilityReport;
  error?: string;
};
