-- REM-033 reversible staging rollback. It removes only REM-033 policies.
DO $rem033$
DECLARE
  policy record;
BEGIN
  FOR policy IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname LIKE 'rem033_observe_%'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', policy.policyname, policy.schemaname, policy.tablename);
  END LOOP;
END
$rem033$;
