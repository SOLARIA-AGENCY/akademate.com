-- Matrículas profile extension (idempotent)
-- Adds sensitive profile fields used by enrollment detail/edit flow.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS dni VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(120);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS photo_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_photo_id_media_id_fk'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_photo_id_media_id_fk
      FOREIGN KEY (photo_id)
      REFERENCES media(id)
      ON DELETE SET NULL
      ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_dni ON leads(dni);
CREATE INDEX IF NOT EXISTS idx_leads_photo_id ON leads(photo_id);
CREATE INDEX IF NOT EXISTS idx_leads_date_of_birth ON leads(date_of_birth);
