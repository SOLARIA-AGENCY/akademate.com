-- Migration: 0002_add_sessions
-- Description: Add sessions table for JWT refresh token management
-- Blueprint Reference: Section 6.1 - Autenticación
-- Date: 2025-12-12
-- NOTE: Schema uses INTEGER PKs (Payload pattern)

-- ============================================================================
-- STEP 1: Create sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMPTZ
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

-- Index for looking up sessions by refresh token hash
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token_hash)
  WHERE revoked_at IS NULL;

-- Index for looking up user's active sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, expires_at)
  WHERE revoked_at IS NULL;

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- STEP 3: Enable RLS on sessions table
-- ============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Sessions are tenant-scoped
DROP POLICY IF EXISTS tenant_isolation_sessions ON sessions;
CREATE POLICY tenant_isolation_sessions ON sessions
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

-- ============================================================================
-- STEP 4: Create password_reset_tokens table
-- ============================================================================
-- Note: Payload CMS has built-in reset_password_token on users table
-- This table is for additional token management if needed

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- ============================================================================
-- STEP 5: Create login_attempts table for rate limiting
-- ============================================================================
-- Note: Payload CMS has login_attempts/lock_until on users table
-- This table provides more detailed tracking if needed

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or IP address
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'ip')),
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier, created_at DESC);

-- Auto-cleanup old login attempts (keep 30 days)
-- This should be run periodically via cron/scheduled job

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify:
-- SELECT tablename FROM pg_tables WHERE tablename IN ('sessions', 'password_reset_tokens', 'login_attempts');
-- SELECT rowsecurity FROM pg_tables WHERE tablename = 'sessions';
