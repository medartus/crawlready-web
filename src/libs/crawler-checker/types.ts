/**
 * Type definitions for Crawler Checker
 */

export type RobotsTxtCheck = {
  exists: boolean;
  allowsGPTBot: boolean;
  allowsClaudeBot: boolean;
  allowsPerplexityBot: boolean;
  blocksAllBots: boolean;
  hasSitemap: boolean;
  issues: string[];
};

export type MetaRobotsCheck = {
  hasNoIndex: boolean;
  hasNoFollow: boolean;
  hasNoSnippet: boolean;
  blockedBy: string[];
};

export type CanonicalCheck = {
  hasCanonical: boolean;
  canonicalUrl: string | null;
  matchesRequestUrl: boolean;
  isValid: boolean;
};

export type EnhancedSchemaCheck = {
  hasSchema: boolean;
  schemaTypes: string[];
  hasAuthor: boolean;
  hasDatePublished: boolean;
  hasPublisher: boolean;
  isJSONLD: boolean;
  aiOptimized: boolean;
};

export type MetaTagsCheck = {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  hasOpenGraph: boolean;
  hasLangAttribute: boolean;
};

export type SemanticHTMLCheck = {
  h1Count: number;
  hasMain: boolean;
  hasArticle: boolean;
  hasNav: boolean;
  hasHeader: boolean;
  hasFooter: boolean;
  issues: string[];
};

export type ContentQualityCheck = {
  wordCount: number;
  paragraphCount: number;
  hasAuthorInfo: boolean;
  hasDateInfo: boolean;
  issues: string[];
};

export type NavigationCheck = {
  linkCount: number;
  hasGoodStructure: boolean;
  hasNav: boolean;
};

export type JavaScriptCheck = {
  requiresJS: boolean;
  hasEmptyRoot: boolean;
  hasJSMessage: boolean;
  hasLowContent: boolean;
  framework: string | null;
};

export type PerformanceCheck = {
  responseTime: number;
  htmlSize: number;
  contentType: string;
  isHTML: boolean;
  hasCompression: boolean;
  isCacheable: boolean;
  ttfb: number;
  scriptCount: number;
  stylesheetCount: number;
  imageCount: number;
  totalResourcesEstimate: number;
  issues: string[];
};

export type FreshnessCheck = {
  hasDatePublished: boolean;
  hasDateModified: boolean;
  publishedDate: string | null;
  modifiedDate: string | null;
  ageInDays: number | null;
  isStale: boolean;
  hasLastModifiedHeader: boolean;
  hasCurrentYearReference: boolean;
  issues: string[];
};

export type MediaCheck = {
  imageCount: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  altTextQuality: {
    tooShort: number;
    tooLong: number;
    optimal: number;
  };
  modernFormats: {
    webp: number;
    avif: number;
    svg: number;
  };
  lazyLoadingUsed: boolean;
  responsiveImagesUsed: boolean;
  imageDimensionsSpecified: number;
  videoCount: number;
  videosWithSchema: number;
  issues: string[];
};

export type SecurityCheck = {
  isHTTPS: boolean;
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  hasReferrerPolicy: boolean;
  hasPermissionsPolicy: boolean;
  mixedContentDetected: boolean;
  trustSignals: {
    hasPrivacyPolicy: boolean;
    hasTermsOfService: boolean;
    hasAboutPage: boolean;
    hasContactPage: boolean;
    hasCookieConsent: boolean;
  };
  securityScore: number;
  issues: string[];
};

export type EEATCheck = {
  hasAuthorBio: boolean;
  hasCredentials: boolean;
  hasAboutPage: boolean;
  hasContactPage: boolean;
  hasPrivacyPolicy: boolean;
  hasSourceCitations: boolean;
  hasSocialProof: boolean;
  hasOriginalContent: boolean;
  score: number;
  issues: string[];
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

export type EnhancedCheckResult = {
  score: number;
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    crawler: string;
    description: string;
    fix: string;
  }>;
  categoryScores: CategoryScores;
  visualComparison: CrawlerViewComparison;
  checks: {
    robotsTxt: RobotsTxtCheck;
    metaRobots: MetaRobotsCheck;
    canonical: CanonicalCheck;
    schema: EnhancedSchemaCheck;
    metaTags: MetaTagsCheck;
    semanticHTML: SemanticHTMLCheck;
    contentQuality: ContentQualityCheck;
    navigation: NavigationCheck;
    javascript: JavaScriptCheck;
    performance: PerformanceCheck;
    freshness: FreshnessCheck;
    media: MediaCheck;
    security: SecurityCheck;
    eeat: EEATCheck;
  };
};
