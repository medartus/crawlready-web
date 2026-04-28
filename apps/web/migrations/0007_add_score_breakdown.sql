-- Add score_breakdown column to scans table for per-check scoring data
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "score_breakdown" jsonb;
