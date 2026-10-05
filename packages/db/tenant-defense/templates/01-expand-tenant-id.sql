-- REM-033 TEMPLATE ONLY. Replace __TABLE__ and __FK_NAME__ after ownership review.
-- Expansion phase: additive and nullable. Do not combine with backfill or NOT NULL.
BEGIN;
ALTER TABLE "__TABLE__" ADD COLUMN IF NOT EXISTS tenant_id uuid;
ALTER TABLE "__TABLE__"
  ADD CONSTRAINT "__FK_NAME__"
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT
  NOT VALID;
COMMIT;

-- Validate separately after the application can populate tenant_id.
-- ALTER TABLE "__TABLE__" VALIDATE CONSTRAINT "__FK_NAME__";
