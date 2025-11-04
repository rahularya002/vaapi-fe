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

-- Allow public read/write for users (adjust based on your security needs)
CREATE POLICY IF NOT EXISTS "Allow public access to users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- User credits table (already referenced in code)
CREATE TABLE IF NOT EXISTS user_credits (
  email TEXT PRIMARY KEY,
  credits INTEGER DEFAULT 2 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on user_credits table or configure policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Allow public access to user_credits (users can only access their own credits)
-- For now, allow all operations (adjust for production with proper auth)
CREATE POLICY IF NOT EXISTS "Allow public access to user_credits" ON user_credits
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_credits_email ON user_credits(email);

