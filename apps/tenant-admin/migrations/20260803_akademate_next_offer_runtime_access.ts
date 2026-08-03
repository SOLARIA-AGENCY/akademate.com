import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "courses" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "course_runs" ALTER COLUMN "tenant_id" SET NOT NULL;

    CREATE FUNCTION "akademate_next_can_manage_offers"() RETURNS boolean
      LANGUAGE sql STABLE
      AS $$
        SELECT COALESCE(current_setting('app.role', true), '')
          IN ('superadmin', 'admin', 'gestor', 'marketing')
      $$;

    REVOKE ALL ON FUNCTION "akademate_next_can_manage_offers"() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_can_manage_offers"()
      TO ${applicationRoleIdentifier};

    ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "courses" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "course_runs" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "course_runs" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "courses_offer_tenant_isolation" ON "courses"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "courses_offer_read" ON "courses"
      FOR SELECT USING (akademate_next_can_manage_offers());

    CREATE POLICY "course_runs_offer_tenant_isolation" ON "course_runs"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "course_runs_offer_read" ON "course_runs"
      FOR SELECT USING (akademate_next_can_manage_offers());
    CREATE POLICY "course_runs_offer_update" ON "course_runs"
      FOR UPDATE
      USING (akademate_next_can_manage_offers())
      WITH CHECK (akademate_next_can_manage_offers());

    REVOKE ALL ON "courses" FROM PUBLIC;
    REVOKE ALL ON "course_runs" FROM PUBLIC;
    REVOKE ALL ON "courses" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON "course_runs" FROM ${applicationRoleIdentifier};

    GRANT SELECT ON "courses" TO ${applicationRoleIdentifier};
    GRANT SELECT ON "course_runs" TO ${applicationRoleIdentifier};
    GRANT UPDATE (
      "publication_access",
      "conversion_mode",
      "share_slug",
      "form_template_key",
      "external_action_url",
      "payment_plan",
      "offer_price_amount",
      "deposit_amount",
      "cta_label",
      "capacity_policy",
      "updated_at"
    ) ON "course_runs" TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "course_runs") OR EXISTS (SELECT 1 FROM "courses") THEN
        RAISE EXCEPTION
          'Cannot roll back offer runtime access while academy offer data exists';
      END IF;
    END
    $$;

    REVOKE ALL ON "course_runs" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON "courses" FROM ${applicationRoleIdentifier};

    DROP POLICY "course_runs_offer_update" ON "course_runs";
    DROP POLICY "course_runs_offer_read" ON "course_runs";
    DROP POLICY "course_runs_offer_tenant_isolation" ON "course_runs";
    ALTER TABLE "course_runs" NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE "course_runs" DISABLE ROW LEVEL SECURITY;

    DROP POLICY "courses_offer_read" ON "courses";
    DROP POLICY "courses_offer_tenant_isolation" ON "courses";
    ALTER TABLE "courses" NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;

    REVOKE ALL ON FUNCTION "akademate_next_can_manage_offers"() FROM PUBLIC;
    DROP FUNCTION "akademate_next_can_manage_offers"();

    ALTER TABLE "course_runs" ALTER COLUMN "tenant_id" DROP NOT NULL;
    ALTER TABLE "courses" ALTER COLUMN "tenant_id" DROP NOT NULL;
  `)
}
