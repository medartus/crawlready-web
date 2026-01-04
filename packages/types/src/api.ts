// API request/response types

// Crawler checker types
export type RenderResult = {
  html: string;
  textContent: string;
  contentLength: number;
  hasSchema: boolean;
  renderTime: number;
  screenshot?: string;
};

export type SchemaType =
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'FAQPage'
  | 'Organization'
  | 'Person'
  | 'Product'
  | 'HowTo'
  | 'BreadcrumbList'
  | 'WebPage'
  | 'WebSite'
  | 'VideoObject'
  | 'ImageObject'
  | 'Review'
  | 'AggregateRating'
  | 'Event'
  | 'Recipe'
  | 'LocalBusiness'
  | 'SoftwareApplication'
  | 'Course'
  | 'JobPosting'
  | 'Dataset'
  | 'Other';

export type SchemaFormat = 'json-ld' | 'microdata' | 'rdfa' | 'none';

export type SchemaIssue = {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'presence' | 'completeness' | 'validity' | 'ai-optimization';
  title: string;
  description: string;
  impact: string;
  fix?: string;
  example?: string;
};

export type SchemaLocation = {
  type: SchemaFormat;
  location: 'head' | 'body';
  schemaType: string;
  raw: string;
};

export type SchemaPresenceScore = {
  score: number;
  hasJsonLd: boolean;
  hasOrganization: boolean;
  hasWebPage: boolean;
  hasContentType: boolean;
  issues: string[];
};

export type SchemaCompletenessScore = {
  score: number;
  requiredFieldsPresent: number;
  requiredFieldsTotal: number;
  recommendedFieldsPresent: number;
  recommendedFieldsTotal: number;
  missingCriticalFields: string[];
  missingRecommendedFields: string[];
};

export type SchemaValidityScore = {
  score: number;
  isValidJson: boolean;
  hasValidContext: boolean;
  hasValidTypes: boolean;
  validationErrors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
};

export type SchemaAIOptimizationScore = {
  score: number;
  hasDescription: boolean;
  hasImages: boolean;
  hasAuthor: boolean;
  hasPublishDate: boolean;
  hasBreadcrumbs: boolean;
  hasStructuredContent: boolean;
  opportunities: string[];
};

export type SchemaAnalysis = {
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  hasSchema: boolean;
  schemaTypes: SchemaType[];
  schemaCount: number;
  primaryFormat: SchemaFormat;
  schemaLocations: SchemaLocation[];
  rawSchemas: any[];
  pageType: 'homepage' | 'article' | 'product' | 'service' | 'about' | 'contact' | 'blog-listing' | 'other';
  recommendedSchemas: SchemaType[];
  missingSchemas: SchemaType[];
  categories: {
    presence: SchemaPresenceScore;
    completeness: SchemaCompletenessScore;
    validity: SchemaValidityScore;
    aiOptimization: SchemaAIOptimizationScore;
  };
  issues: SchemaIssue[];
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: string;
    implementation?: string;
  }>;
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
  schemaMarkup: number;
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

export type CrawlerViewComparison = {
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
  score: number;
  issues: Issue[];
  recommendations: string[];
  crawlerCompatibility: CrawlerCompatibility;
  categoryScores?: CategoryScores;
  visualComparison?: CrawlerViewComparison;
  schemaAnalysis?: SchemaAnalysis;
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
