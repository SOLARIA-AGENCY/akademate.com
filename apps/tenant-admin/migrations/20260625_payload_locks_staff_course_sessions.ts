import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "course_run_sessions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "staff_status_events_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_course_run_sessions_id_idx"
      ON "payload_locked_documents_rels" USING btree ("course_run_sessions_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_staff_status_events_id_idx"
      ON "payload_locked_documents_rels" USING btree ("staff_status_events_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_course_run_sessions_fk"
        FOREIGN KEY ("course_run_sessions_id")
        REFERENCES "public"."course_run_sessions"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_staff_status_events_fk"
        FOREIGN KEY ("staff_status_events_id")
        REFERENCES "public"."staff_status_events"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_course_run_sessions_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_staff_status_events_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_course_run_sessions_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_staff_status_events_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "course_run_sessions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "staff_status_events_id";
  `)
}
