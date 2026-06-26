import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_staff_contract_type"
    ADD VALUE IF NOT EXISTS 'general_regime';
  `)
}

export async function down({}: MigrateDownArgs): Promise<void> {
  // PostgreSQL cannot remove enum values safely without rebuilding the type.
}
