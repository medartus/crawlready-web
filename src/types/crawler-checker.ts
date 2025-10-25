export interface RenderResult {
  html: string;
  textContent: string;
  contentLength: number;
  hasSchema: boolean;
  renderTime: number;
  screenshot?: string;
}

export interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  crawler: string;
  description: string;
  fix: string;
}

export interface CrawlerCompatibility {
  GPTBot: 'full' | 'partial' | 'poor';
  ClaudeBot: 'full' | 'partial' | 'poor';
  PerplexityBot: 'full' | 'partial' | 'poor';
  GoogleBot: 'full' | 'partial' | 'poor';
}

export interface CompatibilityReport {
  score: number; // 0-100
  issues: Issue[];
  recommendations: string[];
  crawlerCompatibility: CrawlerCompatibility;
  userView: RenderResult;
  crawlerView: RenderResult;
  limitedJSView: RenderResult;
  checkedAt: string;
  url: string;
}

export interface CheckCrawlerRequest {
  url: string;
}

export interface CheckCrawlerResponse {
  success: boolean;
  report?: CompatibilityReport;
  error?: string;
}
