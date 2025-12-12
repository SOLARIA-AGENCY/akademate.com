-- Migration: 0001_enable_rls
-- Description: Enable Row Level Security on all tenant-scoped tables
-- Blueprint Reference: Section 10 - RLS Plantilla
-- Date: 2025-12-12
-- NOTE: Schema uses INTEGER PKs (Payload pattern), not UUIDs

-- ============================================================================
-- STEP 1: Disable existing RLS first (clean slate)
-- ============================================================================
ALTER TABLE IF EXISTS memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Enable RLS on all tenant-scoped tables
-- ============================================================================

-- Core tables
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Catalog tables
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_runs ENABLE ROW LEVEL SECURITY;

-- LMS tables (existing)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Marketing tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create tenant isolation policies
-- ============================================================================
-- Pattern: tenant_id = current_setting('app.tenant_id')::INTEGER
-- The second parameter TRUE makes it return NULL instead of error if not set

-- Core Tables
DROP POLICY IF EXISTS tenant_isolation_memberships ON memberships;
CREATE POLICY tenant_isolation_memberships ON memberships
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_courses ON courses;
CREATE POLICY tenant_isolation_courses ON courses
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_api_keys ON api_keys;
CREATE POLICY tenant_isolation_api_keys ON api_keys
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_audit_logs ON audit_logs;
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

-- Catalog Tables
DROP POLICY IF EXISTS tenant_isolation_cycles ON cycles;
CREATE POLICY tenant_isolation_cycles ON cycles
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_centers ON centers;
CREATE POLICY tenant_isolation_centers ON centers
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_instructors ON instructors;
CREATE POLICY tenant_isolation_instructors ON instructors
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_course_runs ON course_runs;
CREATE POLICY tenant_isolation_course_runs ON course_runs
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

-- LMS Tables
DROP POLICY IF EXISTS tenant_isolation_enrollments ON enrollments;
CREATE POLICY tenant_isolation_enrollments ON enrollments
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

-- Marketing Tables
DROP POLICY IF EXISTS tenant_isolation_leads ON leads;
CREATE POLICY tenant_isolation_leads ON leads
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

DROP POLICY IF EXISTS tenant_isolation_campaigns ON campaigns;
CREATE POLICY tenant_isolation_campaigns ON campaigns
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::INTEGER);

-- ============================================================================
-- STEP 4: Create superuser bypass policy (for Payload admin operations)
-- ============================================================================
-- The table owner (superuser) bypasses RLS by default
-- For non-superuser app roles, we need explicit bypass policies

-- Create bypass policy for each table (applied to app service role if needed)
-- This is handled by BYPASSRLS attribute on the carlosjperez role

-- ============================================================================
-- STEP 5: Create development tenant for local testing
-- ============================================================================
-- This tenant is used in development mode to ensure RLS works correctly
-- ID = 1 is reserved for development tenant

INSERT INTO tenants (id, name, slug, plan, status)
VALUES (
  1,
  'Development Tenant',
  'dev',
  'enterprise',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  plan = EXCLUDED.plan,
  status = EXCLUDED.status;

-- ============================================================================
-- VERIFICATION: Check RLS is enabled
-- ============================================================================
-- Run this query to verify:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = true;
