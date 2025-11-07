-- Campaigns table for storing campaign configurations
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  goal TEXT NOT NULL,
  opening_script TEXT NOT NULL,
  localize_tone BOOLEAN DEFAULT false,
  compliance_check BOOLEAN DEFAULT true,
  cadence BOOLEAN DEFAULT false,
  quality BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then create it (PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY)
DROP POLICY IF EXISTS "Allow public access to campaigns" ON campaigns;

-- Allow public access to campaigns (adjust based on your security needs)
CREATE POLICY "Allow public access to campaigns" ON campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);
CREATE INDEX IF NOT EXISTS idx_campaigns_industry ON campaigns(industry);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

