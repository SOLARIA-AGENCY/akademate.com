import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_course_runs_enrollment_status" AS ENUM('open', 'closed', 'scheduled', 'always_open');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "course_runs"
      ADD COLUMN IF NOT EXISTS "enrollment_status" "public"."enum_course_runs_enrollment_status";

    UPDATE "course_runs"
    SET "enrollment_status" = CASE
      WHEN "status" IN ('cancelled', 'completed', 'enrollment_closed') THEN 'closed'::"public"."enum_course_runs_enrollment_status"
      ELSE 'open'::"public"."enum_course_runs_enrollment_status"
    END
    WHERE "enrollment_status" IS NULL;

    ALTER TABLE "course_runs"
      ALTER COLUMN "enrollment_status" SET DEFAULT 'open',
      ALTER COLUMN "enrollment_status" SET NOT NULL;

    CREATE INDEX IF NOT EXISTS "course_runs_enrollment_status_idx" ON "course_runs" USING btree ("enrollment_status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "course_runs_enrollment_status_idx";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "enrollment_status";
    DROP TYPE IF EXISTS "public"."enum_course_runs_enrollment_status";
  `)
}
