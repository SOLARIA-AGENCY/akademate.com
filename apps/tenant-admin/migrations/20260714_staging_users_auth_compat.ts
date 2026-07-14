import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Payload auth compatibility for the isolated staging database.
 * The current Users collection enables API keys, while the historical staging
 * schema was created before those auth columns existed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (process.env.CAMPUS_ENVIRONMENT !== 'staging' || process.env.NODE_ENV === 'production') return

  await db.execute(sql`
    ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean DEFAULT false;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" varchar;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_index" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (process.env.CAMPUS_ENVIRONMENT !== 'staging' || process.env.NODE_ENV === 'production') return

  await db.execute(sql``)
}
