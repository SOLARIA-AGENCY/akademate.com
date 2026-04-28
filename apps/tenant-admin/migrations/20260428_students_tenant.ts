import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "tenant_id" integer;

    UPDATE "students" s
    SET "tenant_id" = COALESCE(
      s."tenant_id",
      u."tenant_id",
      (SELECT id FROM "tenants" ORDER BY id ASC LIMIT 1)
    )
    FROM "users" u
    WHERE s."created_by_id" = u."id"
      AND s."tenant_id" IS NULL;

    UPDATE "students"
    SET "tenant_id" = (SELECT id FROM "tenants" ORDER BY id ASC LIMIT 1)
    WHERE "tenant_id" IS NULL;

    CREATE INDEX IF NOT EXISTS "students_tenant_idx" ON "students" USING btree ("tenant_id");

    DO $$ BEGIN
      ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_tenant_id_tenants_id_fk";
    DROP INDEX IF EXISTS "students_tenant_idx";
    ALTER TABLE "students" DROP COLUMN IF EXISTS "tenant_id";
  `);
}
