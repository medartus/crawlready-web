import { relations } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// ==========================================
// Organization (Clerk + Stripe integration)
// ==========================================

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);

// ==========================================
// CrawlReady Phase 0: Diagnostic + Analytics
// ==========================================

// Sites registered for analytics (Clerk auth required)
export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  domain: text('domain').notNull(),
  siteKey: text('site_key').notNull().unique(),
  tier: text('tier').notNull().default('free'),
  integrationMethod: text('integration_method').notNull().default('middleware'),
  beaconVersion: integer('beacon_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  clerkUserDomainUnique: unique('sites_clerk_user_domain_unique').on(table.clerkUserId, table.domain),
  clerkUserIdx: index('idx_sites_clerk_user').on(table.clerkUserId),
  domainIdx: index('idx_sites_domain').on(table.domain),
  siteKeyIdx: index('idx_sites_key').on(table.siteKey),
}));

// Diagnostic scan results
export const scans = pgTable('scans', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  url: text('url').notNull(),
  domain: text('domain').notNull(),
  status: text('status').notNull().default('pending'),
  correlationId: text('correlation_id'),
  scoringVersion: integer('scoring_version').notNull().default(2),
  aiReadinessScore: integer('ai_readiness_score'),
  crawlabilityScore: integer('crawlability_score'),
  agentReadinessScore: integer('agent_readiness_score'),
  agentInteractionScore: integer('agent_interaction_score'),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  firecrawlCostCents: integer('firecrawl_cost_cents'),
  euAiActPassed: integer('eu_ai_act_passed').notNull().default(0),
  euAiAct: jsonb('eu_ai_act'),
  recommendations: jsonb('recommendations'),
  schemaPreview: jsonb('schema_preview'),
  rawHtmlSize: integer('raw_html_size'),
  markdownSize: integer('markdown_size'),
  visualDiff: jsonb('visual_diff'),
  warnings: jsonb('warnings'),
  // Raw crawl data (cached to avoid re-crawling during scoring iteration)
  crawlHtml: text('crawl_html'),
  crawlMarkdown: text('crawl_markdown'),
  botHtml: text('bot_html'),
  botStatusCode: integer('bot_status_code'),
  botHeaders: jsonb('bot_headers'),
  standardsProbes: jsonb('standards_probes'),
  scoreBreakdown: jsonb('score_breakdown'),
  scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  domainScannedAtIdx: index('idx_scans_domain').on(table.domain, table.scannedAt),
  urlScannedAtIdx: index('idx_scans_url').on(table.url, table.scannedAt),
}));

// AI crawler visit logs (from middleware ingest)
export const crawlerVisits = pgTable('crawler_visits', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  bot: text('bot').notNull(),
  source: text('source').notNull().default('middleware'),
  verified: boolean('verified').notNull().default(true),
  visitedAt: timestamp('visited_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  siteBotVisitedIdx: index('idx_crawler_visits_site_bot').on(table.siteId, table.bot, table.visitedAt),
  sitePathVisitedIdx: index('idx_crawler_visits_site_path').on(table.siteId, table.path, table.visitedAt),
}));

// Email subscribers (lightweight capture, no account)
export const subscribers = pgTable('subscribers', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull(),
  domain: text('domain'),
  source: text('source'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  emailDomainUnique: unique('idx_subscribers_email_domain').on(table.email, table.domain),
}));

// ==========================================
// Type Exports
// ==========================================

export type Organization = typeof organizationSchema.$inferSelect;
export type NewOrganization = typeof organizationSchema.$inferInsert;

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

export type Scan = typeof scans.$inferSelect;
export type NewScan = typeof scans.$inferInsert;

export type CrawlerVisit = typeof crawlerVisits.$inferSelect;
export type NewCrawlerVisit = typeof crawlerVisits.$inferInsert;

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

// ==========================================
// Relations
// ==========================================

export const sitesRelations = relations(sites, ({ many }) => ({
  crawlerVisits: many(crawlerVisits),
}));

export const crawlerVisitsRelations = relations(crawlerVisits, ({ one }) => ({
  site: one(sites, {
    fields: [crawlerVisits.siteId],
    references: [sites.id],
  }),
}));

// Export schema object with all tables and relations for proper type inference
export const schema = {
  organizationSchema,
  sites,
  scans,
  crawlerVisits,
  subscribers,
  sitesRelations,
  crawlerVisitsRelations,
};
