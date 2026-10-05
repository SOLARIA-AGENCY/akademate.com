import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 1;

    UPDATE "users"
    SET "session_version" = 1
    WHERE "session_version" IS NULL;
  `)
}

// Expand migrations are intentionally non-destructive during Release A rollback.
export async function down(_args: MigrateDownArgs): Promise<void> {}
