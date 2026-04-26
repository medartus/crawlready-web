-- Add visual_diff and warnings columns to scans table
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "visual_diff" jsonb;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "warnings" jsonb;
