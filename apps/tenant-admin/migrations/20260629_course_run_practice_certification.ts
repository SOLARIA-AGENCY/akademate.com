import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "practice_hours" varchar;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "certification_type" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "certification_type";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "practice_hours";
  `)
}
