-- Migration: 0002_complete_rls
-- Description: Complete Row Level Security for ALL remaining tenant-scoped tables
-- Issue: FIX-18 (Audit Remediation)
-- Blueprint Reference: Section 10 - RLS Plantilla (packages/db/src/rls/policies.sql)
-- Date: 2026-02-12
--
-- CONTEXT:
-- Migration 0001_enable_rls.sql covered 11 tables (core, catalog, enrollments, marketing).
-- Migration 0003_academic_offering_rls.sql covered 9 more (LMS + subscriptions/webhooks).
-- This migration closes the gap: billing, gamification, and operations tables (11 tables).
-- It also applies idempotent policies for all 20 tables missing from 0001, so it can
-- be run independently as a single source of truth for the RLS gap.
--
-- NOTE: All statements use IF EXISTS / DROP POLICY IF EXISTS for safe re-runs.
-- NOTE: Schema uses UUID PKs (Drizzle schema), not integers.

-- ============================================================================
-- STEP 1: Enable RLS on all missing tenant-scoped tables
-- ============================================================================

-- Core tables (not in 0001)
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhooks ENABLE ROW LEVEL SECURITY;

-- Billing tables
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_transactions ENABLE ROW LEVEL SECURITY;

-- LMS tables (not in 0001)
ALTER TABLE IF EXISTS modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grades ENABLE ROW LEVEL SECURITY;

-- Gamification tables
ALTER TABLE IF EXISTS badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_streaks ENABLE ROW LEVEL SECURITY;

-- Operations tables
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS certificates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create tenant isolation policies
-- ============================================================================
-- Pattern: tenant_id = current_setting('app.tenant_id')::uuid
-- The second parameter TRUE makes it return NULL instead of error if not set

-- -----------------------------------------------------------------------------
-- Core Tables (not in 0001)
-- -----------------------------------------------------------------------------

-- Subscriptions: Billing plans per tenant
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON subscriptions;
CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Webhooks: Integration endpoints per tenant
DROP POLICY IF EXISTS tenant_isolation_webhooks ON webhooks;
CREATE POLICY tenant_isolation_webhooks ON webhooks
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- Billing Tables
-- -----------------------------------------------------------------------------

-- Invoices: Billing records per tenant
DROP POLICY IF EXISTS tenant_isolation_invoices ON invoices;
CREATE POLICY tenant_isolation_invoices ON invoices
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payment Methods: Stored payment details per tenant
DROP POLICY IF EXISTS tenant_isolation_payment_methods ON payment_methods;
CREATE POLICY tenant_isolation_payment_methods ON payment_methods
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payment Transactions: Transaction history per tenant
DROP POLICY IF EXISTS tenant_isolation_payment_transactions ON payment_transactions;
CREATE POLICY tenant_isolation_payment_transactions ON payment_transactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- LMS Tables (not in 0001)
-- -----------------------------------------------------------------------------

-- Modules: Course content structure
DROP POLICY IF EXISTS tenant_isolation_modules ON modules;
CREATE POLICY tenant_isolation_modules ON modules
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Lessons: Video/text content
DROP POLICY IF EXISTS tenant_isolation_lessons ON lessons;
CREATE POLICY tenant_isolation_lessons ON lessons
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Materials: Downloadable resources
DROP POLICY IF EXISTS tenant_isolation_materials ON materials;
CREATE POLICY tenant_isolation_materials ON materials
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Assignments: Quizzes/essays/exams
DROP POLICY IF EXISTS tenant_isolation_assignments ON assignments;
CREATE POLICY tenant_isolation_assignments ON assignments
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Lesson Progress: Per-lesson completion tracking
DROP POLICY IF EXISTS tenant_isolation_lesson_progress ON lesson_progress;
CREATE POLICY tenant_isolation_lesson_progress ON lesson_progress
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Submissions: Assignment submissions
DROP POLICY IF EXISTS tenant_isolation_submissions ON submissions;
CREATE POLICY tenant_isolation_submissions ON submissions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Grades: Grading records
DROP POLICY IF EXISTS tenant_isolation_grades ON grades;
CREATE POLICY tenant_isolation_grades ON grades
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- Gamification Tables
-- -----------------------------------------------------------------------------

-- Badge Definitions: Achievement settings per tenant
DROP POLICY IF EXISTS tenant_isolation_badge_definitions ON badge_definitions;
CREATE POLICY tenant_isolation_badge_definitions ON badge_definitions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- User Badges: Earned achievements
DROP POLICY IF EXISTS tenant_isolation_user_badges ON user_badges;
CREATE POLICY tenant_isolation_user_badges ON user_badges
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Points Transactions: Ledger of points earned/spent
DROP POLICY IF EXISTS tenant_isolation_points_transactions ON points_transactions;
CREATE POLICY tenant_isolation_points_transactions ON points_transactions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- User Streaks: Engagement metrics
DROP POLICY IF EXISTS tenant_isolation_user_streaks ON user_streaks;
CREATE POLICY tenant_isolation_user_streaks ON user_streaks
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- Operations Tables
-- -----------------------------------------------------------------------------

-- Attendance: Class attendance records
DROP POLICY IF EXISTS tenant_isolation_attendance ON attendance;
CREATE POLICY tenant_isolation_attendance ON attendance
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Calendar Events: Schedule for the tenant
DROP POLICY IF EXISTS tenant_isolation_calendar_events ON calendar_events;
CREATE POLICY tenant_isolation_calendar_events ON calendar_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Live Sessions: Zoom/Teams links
DROP POLICY IF EXISTS tenant_isolation_live_sessions ON live_sessions;
CREATE POLICY tenant_isolation_live_sessions ON live_sessions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Certificates: Generated PDFs
DROP POLICY IF EXISTS tenant_isolation_certificates ON certificates;
CREATE POLICY tenant_isolation_certificates ON certificates
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- STEP 3: Special policies for public access (web comercial)
-- ============================================================================
-- For public web, the tenant is resolved by host but queries need to
-- access PUBLISHED content without a full session. We use a separate policy.
-- These are defined in the blueprint but were not included in 0001.

-- Course Runs: Public can read PUBLISHED/ENROLLING offerings for resolved tenant
DROP POLICY IF EXISTS public_read_published_course_runs ON course_runs;
CREATE POLICY public_read_published_course_runs ON course_runs
  FOR SELECT
  USING (
    status IN ('scheduled', 'enrolling') AND
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- Courses: Public can read published courses for resolved tenant
DROP POLICY IF EXISTS public_read_courses ON courses;
CREATE POLICY public_read_courses ON courses
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid AND
    status = 'published'
  );

-- ============================================================================
-- STEP 4: Superuser bypass note
-- ============================================================================
-- The table owner (superuser) bypasses RLS by default via BYPASSRLS attribute.
-- For non-superuser app roles, tenant isolation is enforced by the policies above.
-- Superadmin access is handled at application level (see blueprint Section 10).

-- ============================================================================
-- VERIFICATION: Confirm ALL 31 tenant-scoped tables have RLS enabled
-- ============================================================================
-- This query should return 0 rows if everything is correct.
-- Any rows returned indicate tables that are MISSING RLS.

SELECT
  tablename,
  'MISSING RLS - action required' AS issue
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    -- Core (6)
    'memberships', 'courses', 'api_keys', 'audit_logs',
    'subscriptions', 'webhooks',
    -- Billing (3)
    'invoices', 'payment_methods', 'payment_transactions',
    -- Catalog (4)
    'cycles', 'centers', 'instructors', 'course_runs',
    -- LMS (8)
    'modules', 'lessons', 'materials', 'assignments',
    'enrollments', 'lesson_progress', 'submissions', 'grades',
    -- Marketing (2)
    'leads', 'campaigns',
    -- Gamification (4)
    'badge_definitions', 'user_badges', 'points_transactions', 'user_streaks',
    -- Operations (4)
    'attendance', 'calendar_events', 'live_sessions', 'certificates'
  )
  AND rowsecurity = false
ORDER BY tablename;

-- Positive confirmation: list all tables WITH RLS enabled
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
