import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_form" varchar(120);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_page" text;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lead_type" varchar(32);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "campaign_code" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "convocatoria_id" integer;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "cycle_id" integer;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "meta_campaign_id" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "ad_id" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "adset_id" varchar(64);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fbclid" varchar(255);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fbc" varchar(255);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "fbp" varchar(255);
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "is_test" boolean DEFAULT false;
    ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_details" jsonb;

    UPDATE "leads" SET "is_test" = false WHERE "is_test" IS NULL;
    ALTER TABLE "leads" ALTER COLUMN "is_test" SET DEFAULT false;
    ALTER TABLE "leads" ALTER COLUMN "is_test" SET NOT NULL;

    CREATE INDEX IF NOT EXISTS "idx_leads_source_form" ON "leads" USING btree ("source_form");
    CREATE INDEX IF NOT EXISTS "idx_leads_lead_type" ON "leads" USING btree ("lead_type");
    CREATE INDEX IF NOT EXISTS "idx_leads_campaign_code" ON "leads" USING btree ("campaign_code");
    CREATE INDEX IF NOT EXISTS "idx_leads_convocatoria_id" ON "leads" USING btree ("convocatoria_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_cycle_id" ON "leads" USING btree ("cycle_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_meta_campaign_id" ON "leads" USING btree ("meta_campaign_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_ad_id" ON "leads" USING btree ("ad_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_adset_id" ON "leads" USING btree ("adset_id");
    CREATE INDEX IF NOT EXISTS "idx_leads_fbclid" ON "leads" USING btree ("fbclid");
    CREATE INDEX IF NOT EXISTS "idx_leads_is_test" ON "leads" USING btree ("is_test");

    UPDATE "leads"
    SET "source_page" = COALESCE(
      NULLIF("source_page", ''),
      NULLIF("source_details"->>'source_page', ''),
      NULLIF("source_details"->>'path', '')
    )
    WHERE "source_page" IS NULL OR BTRIM("source_page") = '';

    UPDATE "leads"
    SET "source_form" = COALESCE(
      NULLIF("source_form", ''),
      NULLIF("source_details"->>'source_form', ''),
      CASE
        WHEN LOWER(COALESCE("source_page", '')) LIKE '%/convocatorias%' THEN 'preinscripcion_convocatoria'
        WHEN LOWER(COALESCE("source_page", '')) LIKE '%/ciclos%' THEN 'preinscripcion_ciclo'
        WHEN LOWER(COALESCE("source_page", '')) LIKE '%/contacto%' THEN 'contacto'
        WHEN LOWER(COALESCE("source_page", '')) LIKE '%/landing/%' THEN 'landing_contact_form'
        ELSE 'web_form'
      END
    )
    WHERE "source_form" IS NULL OR BTRIM("source_form") = '';

    UPDATE "leads"
    SET "lead_type" = COALESCE(
      NULLIF("lead_type", ''),
      NULLIF("source_details"->>'lead_type', ''),
      CASE
        WHEN LOWER(COALESCE("source_form", '')) LIKE '%preinscripcion%' THEN 'inscripcion'
        WHEN LOWER(COALESCE("source_page", '')) LIKE '%/convocatorias%' THEN 'inscripcion'
        WHEN LOWER(COALESCE("source_page", '')) LIKE '%/ciclos%' THEN 'inscripcion'
        ELSE 'lead'
      END
    )
    WHERE "lead_type" IS NULL OR BTRIM("lead_type") = '';

    UPDATE "leads"
    SET "campaign_code" = COALESCE(
      NULLIF("campaign_code", ''),
      NULLIF("source_details"->>'campaign_code', ''),
      NULLIF("source_details"->>'utm_campaign', ''),
      NULLIF("utm_campaign", '')
    )
    WHERE "campaign_code" IS NULL OR BTRIM("campaign_code") = '';

    UPDATE "leads"
    SET "source_details" = COALESCE("source_details", '{}'::jsonb) || jsonb_build_object(
      'source_form', COALESCE(NULLIF("source_form", ''), "source_details"->>'source_form'),
      'source_page', COALESCE(NULLIF("source_page", ''), "source_details"->>'source_page'),
      'lead_type', COALESCE(NULLIF("lead_type", ''), "source_details"->>'lead_type'),
      'campaign_code', COALESCE(NULLIF("campaign_code", ''), "source_details"->>'campaign_code'),
      'utm_source', COALESCE(NULLIF("utm_source", ''), "source_details"->>'utm_source'),
      'utm_medium', COALESCE(NULLIF("utm_medium", ''), "source_details"->>'utm_medium'),
      'utm_campaign', COALESCE(NULLIF("utm_campaign", ''), "source_details"->>'utm_campaign')
    )
    WHERE "source_details" IS NULL
      OR (COALESCE("source_details"->>'source_form', '') = '')
      OR (COALESCE("source_details"->>'source_page', '') = '')
      OR (COALESCE("source_details"->>'lead_type', '') = '')
      OR (COALESCE("source_details"->>'campaign_code', '') = '');

    UPDATE "leads"
    SET "source_details" = COALESCE("source_details", '{}'::jsonb) || jsonb_build_object(
      'phone_needs_update', true,
      'phone_placeholder_detected_at', NOW()::text
    )
    WHERE regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g') IN ('34000000000', '000000000')
      AND COALESCE("source_details"->>'phone_needs_update', 'false') <> 'true';
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lead_interactions'
      ) THEN
        BEGIN
          WITH reconstructed AS (
            SELECT
              l.id AS lead_id,
              COALESCE(l.tenant_id, 1) AS tenant_id,
              COALESCE(
                (SELECT u.id FROM users u WHERE u.tenant_id = l.tenant_id ORDER BY u.id ASC LIMIT 1),
                (SELECT u.id FROM users u ORDER BY u.id ASC LIMIT 1)
              ) AS actor_id,
              CONCAT(
                'Origen reconstruido automaticamente: formulario=',
                COALESCE(NULLIF(l.source_form, ''), 'desconocido'),
                ' | pagina=',
                COALESCE(NULLIF(l.source_page, ''), 'N/D'),
                ' | campana=',
                COALESCE(NULLIF(l.campaign_code, ''), 'N/D')
              ) AS note
            FROM leads l
          )
          INSERT INTO lead_interactions (lead_id, user_id, channel, result, note, tenant_id)
          SELECT r.lead_id, r.actor_id, 'system', 'status_changed', r.note, r.tenant_id
          FROM reconstructed r
          WHERE r.actor_id IS NOT NULL
            AND NOT EXISTS (
              SELECT 1
              FROM lead_interactions li
              WHERE li.lead_id = r.lead_id
                AND li.channel = 'system'
                AND li.note = r.note
            );
        EXCEPTION
          WHEN others THEN
            NULL;
        END;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "idx_leads_is_test";
    DROP INDEX IF EXISTS "idx_leads_fbclid";
    DROP INDEX IF EXISTS "idx_leads_adset_id";
    DROP INDEX IF EXISTS "idx_leads_ad_id";
    DROP INDEX IF EXISTS "idx_leads_meta_campaign_id";
    DROP INDEX IF EXISTS "idx_leads_cycle_id";
    DROP INDEX IF EXISTS "idx_leads_convocatoria_id";
    DROP INDEX IF EXISTS "idx_leads_campaign_code";
    DROP INDEX IF EXISTS "idx_leads_lead_type";
    DROP INDEX IF EXISTS "idx_leads_source_form";

    ALTER TABLE "leads" DROP COLUMN IF EXISTS "source_details";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "is_test";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "fbp";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "fbc";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "fbclid";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "adset_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "ad_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "meta_campaign_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "cycle_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "convocatoria_id";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "campaign_code";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "lead_type";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "source_page";
    ALTER TABLE "leads" DROP COLUMN IF EXISTS "source_form";
  `)
}
