CREATE TYPE "public"."api_key_tier" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."cache_location" AS ENUM('hot', 'cold', 'none');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"tier" "api_key_tier" DEFAULT 'free' NOT NULL,
	"rate_limit_daily" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cache_accesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"normalized_url" text NOT NULL,
	"cache_location" "cache_location" NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"response_time_ms" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "render_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"url" text NOT NULL,
	"normalized_url" text NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"render_duration_ms" integer,
	"html_size_bytes" integer,
	"storage_key" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"worker_id" varchar(100),
	"puppeteer_version" varchar(20)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rendered_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_url" text NOT NULL,
	"storage_key" text NOT NULL,
	"html_size_bytes" integer NOT NULL,
	"first_rendered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"access_count" integer DEFAULT 0 NOT NULL,
	"in_redis" boolean DEFAULT true NOT NULL,
	CONSTRAINT "rendered_pages_normalized_url_unique" UNIQUE("normalized_url"),
	CONSTRAINT "idx_rendered_pages_normalized_url" UNIQUE("normalized_url")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"date" date NOT NULL,
	"cache_hits" integer DEFAULT 0 NOT NULL,
	"cache_misses" integer DEFAULT 0 NOT NULL,
	"renders_completed" integer DEFAULT 0 NOT NULL,
	"renders_failed" integer DEFAULT 0 NOT NULL,
	"avg_cache_hit_time_ms" integer,
	"avg_render_time_ms" integer,
	"storage_bytes_added" bigint DEFAULT 0 NOT NULL,
	"total_storage_bytes" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_daily_api_key_date_unique" UNIQUE("api_key_id","date")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cache_accesses" ADD CONSTRAINT "cache_accesses_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_daily" ADD CONSTRAINT "usage_daily_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_key_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_customer_email" ON "api_keys" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_is_active" ON "api_keys" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cache_accesses_api_key_date" ON "cache_accesses" USING btree ("api_key_id","accessed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cache_accesses_normalized_url" ON "cache_accesses" USING btree ("normalized_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cache_accesses_accessed_at" ON "cache_accesses" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_render_jobs_api_key_status" ON "render_jobs" USING btree ("api_key_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_render_jobs_normalized_url" ON "render_jobs" USING btree ("normalized_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_render_jobs_queued_at" ON "render_jobs" USING btree ("queued_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_render_jobs_status_created" ON "render_jobs" USING btree ("status","queued_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rendered_pages_last_accessed" ON "rendered_pages" USING btree ("last_accessed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rendered_pages_access_count" ON "rendered_pages" USING btree ("access_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rendered_pages_in_redis" ON "rendered_pages" USING btree ("in_redis");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_daily_api_key_date" ON "usage_daily" USING btree ("api_key_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_daily_date" ON "usage_daily" USING btree ("date");