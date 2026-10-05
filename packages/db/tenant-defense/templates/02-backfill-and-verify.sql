-- REM-033 TEMPLATE ONLY. Replace placeholders with a reviewed ownership join.
-- The predicate makes the backfill idempotent. The verification block fails closed.
BEGIN;
UPDATE "__TABLE__" AS target
SET tenant_id = owner.tenant_id
FROM "__OWNER_TABLE__" AS owner
WHERE target."__OWNER_FK__" = owner.id
  AND target.tenant_id IS NULL;
COMMIT;

DO $rem033$
BEGIN
  IF EXISTS (SELECT 1 FROM "__TABLE__" WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'REM-033: __TABLE__ still contains NULL tenant_id rows';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "__TABLE__" AS target
    LEFT JOIN tenants ON tenants.id = target.tenant_id
    WHERE tenants.id IS NULL
  ) THEN
    RAISE EXCEPTION 'REM-033: __TABLE__ contains orphan tenant_id rows';
  END IF;
END
$rem033$;
