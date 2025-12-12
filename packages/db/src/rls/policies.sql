-- ============================================================================
-- AKADEMATE.COM - Row Level Security (RLS) Policies
-- ============================================================================
-- Blueprint Reference: Section 10 - RLS Plantilla
--
-- INVARIANTE: Todas las tablas con tenant_id deben tener RLS habilitado.
-- El contexto se establece via set_config('app.tenant_id', ..., true) en cada transacción.
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all tenant-scoped tables
-- ============================================================================

-- Core tables
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Catalog tables
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_runs ENABLE ROW LEVEL SECURITY;

-- LMS tables
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Marketing tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create standard tenant isolation policies
-- ============================================================================

-- Pattern: tenant_id = current_setting('app.tenant_id')::uuid
-- This enforces that all queries only see/modify data for the current tenant

-- -----------------------------------------------------------------------------
-- Core Tables
-- -----------------------------------------------------------------------------

-- Memberships: Access to user-tenant relationships
CREATE POLICY tenant_isolation_memberships ON memberships
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Courses: Course catalog per tenant
CREATE POLICY tenant_isolation_courses ON courses
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- API Keys: Tenant-scoped API access
CREATE POLICY tenant_isolation_api_keys ON api_keys
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Audit Logs: Compliance and traceability
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Subscriptions: Billing per tenant
CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Webhooks: Integration endpoints per tenant
CREATE POLICY tenant_isolation_webhooks ON webhooks
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- Catalog Tables
-- -----------------------------------------------------------------------------

-- Cycles: Academic cycles (Grado Superior/Medio)
CREATE POLICY tenant_isolation_cycles ON cycles
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Centers: Physical locations (multi-sede)
CREATE POLICY tenant_isolation_centers ON centers
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Instructors: Teacher profiles
CREATE POLICY tenant_isolation_instructors ON instructors
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Course Runs: Scheduled course instances (convocatorias)
CREATE POLICY tenant_isolation_course_runs ON course_runs
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- LMS Tables
-- -----------------------------------------------------------------------------

-- Modules: Course content structure
CREATE POLICY tenant_isolation_modules ON modules
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Lessons: Video/text content
CREATE POLICY tenant_isolation_lessons ON lessons
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Materials: Downloadable resources
CREATE POLICY tenant_isolation_materials ON materials
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Assignments: Quizzes/essays/exams
CREATE POLICY tenant_isolation_assignments ON assignments
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Enrollments: Student enrollment tracking
CREATE POLICY tenant_isolation_enrollments ON enrollments
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Lesson Progress: Per-lesson completion
CREATE POLICY tenant_isolation_lesson_progress ON lesson_progress
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Submissions: Assignment submissions
CREATE POLICY tenant_isolation_submissions ON submissions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Grades: Grading records
CREATE POLICY tenant_isolation_grades ON grades
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- Marketing Tables
-- -----------------------------------------------------------------------------

-- Leads: Prospect management
CREATE POLICY tenant_isolation_leads ON leads
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Campaigns: Marketing campaigns
CREATE POLICY tenant_isolation_campaigns ON campaigns
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ============================================================================
-- STEP 3: Special policies for public access (web comercial)
-- ============================================================================
-- For public web, the tenant is resolved by host but queries need to
-- access PUBLISHED content without a session. We use a separate policy.

-- Course Runs: Public can read PUBLISHED offerings for resolved tenant
CREATE POLICY public_read_published_course_runs ON course_runs
  FOR SELECT
  USING (
    status = 'published' AND
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- Courses: Public can read courses that have published runs
CREATE POLICY public_read_courses ON courses
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid AND
    status = 'published'
  );

-- ============================================================================
-- STEP 4: Superadmin bypass (for platform-ops impersonation)
-- ============================================================================
-- Note: Superadmin access should be handled at application level.
-- If needed, create a separate role 'akademate_superadmin' with BYPASSRLS.
-- This is intentionally NOT implemented in SQL to force audit via application.

-- ============================================================================
-- VERIFICATION QUERIES (run after applying policies)
-- ============================================================================

-- Check RLS is enabled on all tenant tables
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN (
--   'memberships', 'courses', 'api_keys', 'audit_logs', 'subscriptions',
--   'webhooks', 'cycles', 'centers', 'instructors', 'course_runs',
--   'modules', 'lessons', 'materials', 'assignments', 'enrollments',
--   'lesson_progress', 'submissions', 'grades', 'leads', 'campaigns'
-- );

-- List all policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';
