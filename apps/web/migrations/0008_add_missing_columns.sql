-- Migration: Add columns identified in architecture review
-- See docs/architecture/architectural-gap-analysis.md

-- 1. crawler_visits: add source and verified columns
ALTER TABLE "crawler_visits" ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'middleware';
ALTER TABLE "crawler_visits" ADD COLUMN IF NOT EXISTS "verified" boolean NOT NULL DEFAULT true;

-- 2. scans: add status, correlation_id, error tracking, cost tracking
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'complete';
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "correlation_id" text;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "error_code" text;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "error_message" text;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "firecrawl_cost_cents" integer;

-- Update scoring_version default to 2 for new rows
ALTER TABLE "scans" ALTER COLUMN "scoring_version" SET DEFAULT 2;

-- Make score columns nullable (for future async scans with PENDING status)
ALTER TABLE "scans" ALTER COLUMN "ai_readiness_score" DROP NOT NULL;
ALTER TABLE "scans" ALTER COLUMN "crawlability_score" DROP NOT NULL;
ALTER TABLE "scans" ALTER COLUMN "agent_readiness_score" DROP NOT NULL;
ALTER TABLE "scans" ALTER COLUMN "agent_interaction_score" DROP NOT NULL;

-- 3. sites: add integration_method and beacon_version
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "integration_method" text NOT NULL DEFAULT 'middleware';
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "beacon_version" integer NOT NULL DEFAULT 1;
