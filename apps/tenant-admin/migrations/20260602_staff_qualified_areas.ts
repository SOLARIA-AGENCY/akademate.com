import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "staff_rels"
      ADD COLUMN IF NOT EXISTS "areas_formativas_id" integer;

    DO $$ BEGIN
      ALTER TABLE "staff_rels" ADD CONSTRAINT "staff_rels_areas_formativas_fk"
        FOREIGN KEY ("areas_formativas_id") REFERENCES "public"."areas_formativas"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "staff_rels_areas_formativas_id_idx" ON "staff_rels" USING btree ("areas_formativas_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "staff_rels_areas_formativas_id_idx";
    ALTER TABLE "staff_rels" DROP CONSTRAINT IF EXISTS "staff_rels_areas_formativas_fk";
    ALTER TABLE "staff_rels" DROP COLUMN IF EXISTS "areas_formativas_id";
  `)
}
