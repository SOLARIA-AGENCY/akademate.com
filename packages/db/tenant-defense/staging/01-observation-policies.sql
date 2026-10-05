-- REM-033 STAGING ONLY.
-- Prerequisite: provision a NOLOGIN group role named rem033_observer and grant it
-- only to the staging observer login. This file does not enable or force RLS.
-- Policies are intentionally table-by-table and restricted to that role.
DO $rem033$
DECLARE
  table_name text;
  tenant_tables constant text[] := ARRAY[
    'memberships', 'courses', 'api_keys', 'audit_logs', 'subscriptions', 'webhooks',
    'invoices', 'payment_methods', 'payment_transactions', 'cycles', 'centers',
    'instructors', 'course_runs', 'modules', 'lessons', 'materials', 'assignments',
    'enrollments', 'lesson_progress', 'submissions', 'grades', 'leads', 'campaigns',
    'badge_definitions', 'user_badges', 'points_transactions', 'user_streaks',
    'attendance', 'calendar_events', 'live_sessions', 'certificates'
  ];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rem033_observer') THEN
    RAISE EXCEPTION 'REM-033: required staging role rem033_observer is missing';
  END IF;

  FOREACH table_name IN ARRAY tenant_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'rem033_observe_' || table_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I AS RESTRICTIVE FOR ALL TO rem033_observer USING (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''app.tenant_id'', true), '''')::uuid)',
        'rem033_observe_' || table_name,
        table_name
      );
    END IF;
  END LOOP;
END
$rem033$;
