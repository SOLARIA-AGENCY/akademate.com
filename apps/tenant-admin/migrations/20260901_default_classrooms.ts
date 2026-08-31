import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    INSERT INTO "classrooms" (
      "code",
      "name",
      "capacity",
      "campus_id",
      "tenant_id",
      "usage_policy",
      "data_quality_status",
      "is_active",
      "created_at",
      "updated_at"
    )
    SELECT
      CONCAT('SEDE-', c.id, '-A1'),
      'Aula principal',
      30,
      c.id,
      c.tenant_id,
      'mixed',
      'complete',
      true,
      NOW(),
      NOW()
    FROM "campuses" c
    WHERE NOT EXISTS (
      SELECT 1
      FROM "classrooms" r
      WHERE r."campus_id" = c.id
    )
    ON CONFLICT ("code") DO NOTHING;
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Additive and idempotent. Do not remove classrooms created by this migration.
}
