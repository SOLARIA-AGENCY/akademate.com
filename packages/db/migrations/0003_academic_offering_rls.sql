-- Migration: 0003_academic_offering_rls
-- Description: Add RLS to remaining LMS tables + publication workflow enum
-- EPIC-C: Oferta Académica + Publicación
-- Date: 2025-12-12

-- ============================================================================
-- STEP 1: Add publication_status enum if not exists
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE publication_status AS ENUM ('draft', 'review', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STEP 2: Add publication fields to courses (if not exist)
-- ============================================================================
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS featured_image TEXT,
  ADD COLUMN IF NOT EXISTS duration INTEGER,
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS objectives JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 3: Enable RLS on remaining LMS tables
-- ============================================================================
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Also enable on subscriptions and webhooks (core tables)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create tenant isolation policies for LMS tables
-- ============================================================================

-- Modules
DROP POLICY IF EXISTS tenant_isolation_modules ON modules;
CREATE POLICY tenant_isolation_modules ON modules
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Lessons
DROP POLICY IF EXISTS tenant_isolation_lessons ON lessons;
CREATE POLICY tenant_isolation_lessons ON lessons
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Materials
DROP POLICY IF EXISTS tenant_isolation_materials ON materials;
CREATE POLICY tenant_isolation_materials ON materials
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Assignments
DROP POLICY IF EXISTS tenant_isolation_assignments ON assignments;
CREATE POLICY tenant_isolation_assignments ON assignments
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Lesson Progress
DROP POLICY IF EXISTS tenant_isolation_lesson_progress ON lesson_progress;
CREATE POLICY tenant_isolation_lesson_progress ON lesson_progress
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Submissions
DROP POLICY IF EXISTS tenant_isolation_submissions ON submissions;
CREATE POLICY tenant_isolation_submissions ON submissions
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Grades
DROP POLICY IF EXISTS tenant_isolation_grades ON grades;
CREATE POLICY tenant_isolation_grades ON grades
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Subscriptions
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON subscriptions;
CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- Webhooks
DROP POLICY IF EXISTS tenant_isolation_webhooks ON webhooks;
CREATE POLICY tenant_isolation_webhooks ON webhooks
  FOR ALL USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::UUID);

-- ============================================================================
-- STEP 5: Create publication workflow indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_tenant_status ON courses(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_published_at ON courses(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_course_runs_status ON course_runs(status);
CREATE INDEX IF NOT EXISTS idx_course_runs_tenant_status ON course_runs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_course_runs_dates ON course_runs(start_date, end_date);

-- ============================================================================
-- VERIFICATION: Check all RLS-enabled tables
-- ============================================================================
-- Run: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
