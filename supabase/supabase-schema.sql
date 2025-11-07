-- Users table for storing user accounts
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on users table (or configure policies if you need authentication)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then create it (PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY)
DROP POLICY IF EXISTS "Allow public access to users" ON users;

-- Allow public read/write for users (adjust based on your security needs)
CREATE POLICY "Allow public access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- User credits table (already referenced in code)
CREATE TABLE IF NOT EXISTS user_credits (
  email TEXT PRIMARY KEY,
  credits INTEGER DEFAULT 2 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on user_credits table or configure policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Drop policy if it exists, then create it (PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY)
DROP POLICY IF EXISTS "Allow public access to user_credits" ON user_credits;

-- Allow public access to user_credits (users can only access their own credits)
-- For now, allow all operations (adjust for production with proper auth)
CREATE POLICY "Allow public access to user_credits" ON user_credits
  FOR ALL USING (true) WITH CHECK (true);

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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_credits_email ON user_credits(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_name ON campaigns(name);
CREATE INDEX IF NOT EXISTS idx_campaigns_industry ON campaigns(industry);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

