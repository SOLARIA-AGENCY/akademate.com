import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Production compatibility for releases that registered CampusEnrollments
 * before its feature gate existed. The column is nullable and no foreign key
 * is created because the Campus table is intentionally absent in production.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "campus_enrollments_id" integer;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // This rollout is intentionally non-destructive. Keeping the nullable
  // compatibility column makes rollback to the prior image safe.
  await db.execute(sql``)
}
