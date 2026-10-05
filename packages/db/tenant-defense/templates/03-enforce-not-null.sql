-- REM-033 TEMPLATE ONLY. Run only after 02-backfill-and-verify.sql succeeds.
-- CHECK/VALIDATE reduces the lock held by the final SET NOT NULL operation.
BEGIN;
ALTER TABLE "__TABLE__"
  ADD CONSTRAINT "__TABLE___tenant_id_nn" CHECK (tenant_id IS NOT NULL) NOT VALID;
ALTER TABLE "__TABLE__" VALIDATE CONSTRAINT "__TABLE___tenant_id_nn";
ALTER TABLE "__TABLE__" ALTER COLUMN tenant_id SET NOT NULL;
COMMIT;
