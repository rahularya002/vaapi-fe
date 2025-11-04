-- Alternative: Disable RLS entirely (simpler but less secure)
-- Use this if you don't need Row Level Security

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
  email TEXT PRIMARY KEY,
  credits INTEGER DEFAULT 2 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on user_credits table
ALTER TABLE user_credits DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_credits_email ON user_credits(email);

