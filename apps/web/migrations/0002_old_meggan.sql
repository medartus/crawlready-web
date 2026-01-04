ALTER TABLE "api_keys" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "org_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_user_id" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_api_keys_org_id" ON "api_keys" USING btree ("org_id");