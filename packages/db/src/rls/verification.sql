-- ============================================================================
-- RLS VERIFICATION SCRIPT - P0-002-C
-- ============================================================================
-- Run this script to verify RLS is properly enabled on all tables
-- ============================================================================

-- Check RLS is enabled on all tenant-scoped tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'memberships', 'courses', 'api_keys', 'audit_logs',
    'subscriptions', 'webhooks', 'cycles', 'centers',
    'instructors', 'course_runs', 'modules', 'lessons',
    'materials', 'assignments', 'enrollments', 'lesson_progress',
    'submissions', 'grades', 'leads', 'campaigns',
    'badge_definitions', 'user_badges', 'points_transactions',
    'user_streaks', 'attendance', 'calendar_events',
    'live_sessions', 'certificates', 'invoices',
    'payment_methods', 'payment_transactions'
  )
ORDER BY tablename;

-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    WHEN cmd = '*' THEN 'ALL'
    ELSE cmd
  END AS command_type,
  qual AS using_clause,
  with_check AS check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables WITHOUT RLS but WITH tenant_id (should be 0)
SELECT
  tablename,
  'MISSING RLS' AS issue
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'memberships', 'courses', 'api_keys', 'audit_logs',
    'subscriptions', 'webhooks', 'cycles', 'centers',
    'instructors', 'course_runs', 'modules', 'lessons',
    'materials', 'assignments', 'enrollments', 'lesson_progress',
    'submissions', 'grades', 'leads', 'campaigns',
    'badge_definitions', 'user_badges', 'points_transactions',
    'user_streaks', 'attendance', 'calendar_events',
    'live_sessions', 'certificates', 'invoices',
    'payment_methods', 'payment_transactions'
  )
  AND rowsecurity = false;
