ALTER TABLE "rendered_pages" DROP CONSTRAINT "rendered_pages_api_key_id_api_keys_id_fk";
--> statement-breakpoint
ALTER TABLE "rendered_pages" ALTER COLUMN "api_key_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rendered_pages" ALTER COLUMN "storage_location" SET DEFAULT 'hot';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rendered_pages" ADD CONSTRAINT "rendered_pages_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
