-- Run as a privileged staging observer before policy activation decisions.
-- Result set 1: schema, nullability, RLS state, and REM-033 policy presence.
WITH tenant_tables(table_name) AS (
  VALUES
    ('memberships'), ('courses'), ('api_keys'), ('audit_logs'), ('subscriptions'), ('webhooks'),
    ('invoices'), ('payment_methods'), ('payment_transactions'), ('cycles'), ('centers'),
    ('instructors'), ('course_runs'), ('modules'), ('lessons'), ('materials'), ('assignments'),
    ('enrollments'), ('lesson_progress'), ('submissions'), ('grades'), ('leads'), ('campaigns'),
    ('badge_definitions'), ('user_badges'), ('points_transactions'), ('user_streaks'),
    ('attendance'), ('calendar_events'), ('live_sessions'), ('certificates')
)
SELECT
  expected.table_name,
  columns.is_nullable AS tenant_id_nullable,
  classes.relrowsecurity AS rls_enabled,
  classes.relforcerowsecurity AS rls_forced,
  policies.policyname AS observation_policy
FROM tenant_tables AS expected
LEFT JOIN information_schema.columns AS columns
  ON columns.table_schema = 'public'
 AND columns.table_name = expected.table_name
 AND columns.column_name = 'tenant_id'
LEFT JOIN pg_class AS classes ON classes.oid = to_regclass('public.' || expected.table_name)
LEFT JOIN pg_policies AS policies
  ON policies.schemaname = 'public'
 AND policies.tablename = expected.table_name
 AND policies.policyname = 'rem033_observe_' || expected.table_name
ORDER BY expected.table_name;

-- Result set 2: execute once per table after replacing __TABLE__ and __TENANT_UUID__.
SELECT
  count(*) AS total_rows,
  count(*) FILTER (WHERE tenant_id IS NULL) AS null_tenant_rows,
  count(*) FILTER (WHERE tenant_id = '__TENANT_UUID__'::uuid) AS expected_visible_rows,
  count(*) FILTER (WHERE tenant_id <> '__TENANT_UUID__'::uuid) AS other_tenant_rows
FROM "__TABLE__";

-- Compare expected_visible_rows with this observer-role query in a separate
-- transaction after: SET LOCAL app.tenant_id = '__TENANT_UUID__';
SELECT count(*) AS policy_visible_rows FROM "__TABLE__";
