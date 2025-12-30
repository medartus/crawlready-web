ALTER TABLE "rendered_pages" ADD COLUMN "api_key_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "rendered_pages" ADD COLUMN "storage_location" "cache_location" DEFAULT 'redis' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rendered_pages" ADD CONSTRAINT "rendered_pages_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rendered_pages_api_key_id" ON "rendered_pages" USING btree ("api_key_id");