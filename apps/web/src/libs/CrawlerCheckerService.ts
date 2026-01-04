/**
 * CrawlerCheckerService - Re-export from modular structure
 *
 * This file maintains backward compatibility while the service has been
 * refactored into a modular architecture at /libs/crawler-checker/
 *
 * New structure provides:
 * - 25+ enhanced checks based on AI crawler research
 * - Modular, testable components
 * - Weighted scoring (25% JS, 20% Tech SEO, 20% Schema, etc.)
 * - Better separation of concerns
 */

export { CrawlerCheckerService, crawlerCheckerService } from './crawler-checker';
export type {
  CanonicalCheck,
  CategoryScores,
  ContentQualityCheck,
  EnhancedCheckResult,
  EnhancedSchemaCheck,
  JavaScriptCheck,
  MetaRobotsCheck,
  MetaTagsCheck,
  NavigationCheck,
  PerformanceCheck,
  RobotsTxtCheck,
  SemanticHTMLCheck,
} from './crawler-checker/types';
