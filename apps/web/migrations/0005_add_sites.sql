-- Migration: Create sites tables for multi-domain support
-- Version: 0005_add_sites
-- Date: 2026-01-11

-- Create enums
DO $$ BEGIN
    CREATE TYPE site_status AS ENUM ('pending', 'active', 'error', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('dns_txt', 'meta_tag', 'api_response', 'auto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crawler_type AS ENUM ('search', 'ai', 'social', 'monitoring', 'unknown', 'direct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    status site_status NOT NULL DEFAULT 'pending',
    status_reason TEXT,
    status_changed_at TIMESTAMPTZ,
    verification_token VARCHAR(64),
    verification_method verification_method,
    verified_at TIMESTAMPTZ,
    framework_detected VARCHAR(100),
    framework_version VARCHAR(50),
    framework_confidence VARCHAR(20),
    settings JSONB NOT NULL DEFAULT '{"cacheTtl":21600,"enabledCrawlers":["GPTBot","ClaudeBot","PerplexityBot","Google-Extended"],"excludedPaths":[],"notifications":{"emailOnError":true,"emailOnFirstCrawler":true,"emailWeeklyDigest":true},"rendering":{"waitForSelector":null,"timeout":30000,"blockResources":["image","font"]}}'::jsonb,
    renders_count INTEGER NOT NULL DEFAULT 0,
    renders_this_month INTEGER NOT NULL DEFAULT 0,
    renders_month_reset_at TIMESTAMPTZ,
    last_render_at TIMESTAMPTZ,
    last_crawler_visit_at TIMESTAMPTZ,
    last_error_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT sites_org_domain_unique UNIQUE (org_id, domain)
);

-- Create indexes for sites
CREATE INDEX IF NOT EXISTS idx_sites_org_id ON sites(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sites_last_crawler_visit ON sites(last_crawler_visit_at DESC) WHERE deleted_at IS NULL;

-- Create site_api_keys table
CREATE TABLE IF NOT EXISTS site_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    key_hash VARCHAR(64) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,
    key_suffix VARCHAR(8),
    name VARCHAR(100),
    last_used_at TIMESTAMPTZ,
    use_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create indexes for site_api_keys
CREATE INDEX IF NOT EXISTS idx_site_api_keys_hash ON site_api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_site_api_keys_site_id ON site_api_keys(site_id);
CREATE INDEX IF NOT EXISTS idx_site_api_keys_active ON site_api_keys(site_id, is_active) WHERE is_active = TRUE;

-- Create site_status_history table for audit trail
CREATE TABLE IF NOT EXISTS site_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    from_status site_status,
    to_status site_status NOT NULL,
    reason TEXT,
    changed_by VARCHAR(255),
    change_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for site_status_history
CREATE INDEX IF NOT EXISTS idx_site_status_history_site_id ON site_status_history(site_id);
CREATE INDEX IF NOT EXISTS idx_site_status_history_created ON site_status_history(created_at DESC);

-- Create site_verifications table for verification attempts
CREATE TABLE IF NOT EXISTS site_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    method verification_method NOT NULL,
    success BOOLEAN NOT NULL,
    expected_value TEXT NOT NULL,
    found_value TEXT,
    error_code VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for site_verifications
CREATE INDEX IF NOT EXISTS idx_site_verifications_site_id ON site_verifications(site_id);
CREATE INDEX IF NOT EXISTS idx_site_verifications_created ON site_verifications(created_at DESC);

-- Add optional site_id and crawler attribution to cache_accesses table
ALTER TABLE cache_accesses 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS crawler_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS crawler_type crawler_type,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Create index for site_id on cache_accesses
CREATE INDEX IF NOT EXISTS idx_cache_accesses_site_id ON cache_accesses(site_id) WHERE site_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cache_accesses_crawler_type ON cache_accesses(crawler_type) WHERE crawler_type IS NOT NULL;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sites updated_at
DROP TRIGGER IF EXISTS sites_updated_at ON sites;
CREATE TRIGGER sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();


