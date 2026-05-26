import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "nif" varchar(20);
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "inactive_reason" text;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "inactive_at" timestamp(3) with time zone;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "reactivated_at" timestamp(3) with time zone;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "last_import_batch" varchar(255);
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "import_review_status" varchar(32) DEFAULT 'validated' NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "staff_nif_unique_idx" ON "staff" ("nif") WHERE "nif" IS NOT NULL AND "nif" <> '';
    CREATE INDEX IF NOT EXISTS "staff_import_review_status_idx" ON "staff" ("import_review_status");
    CREATE INDEX IF NOT EXISTS "staff_last_import_batch_idx" ON "staff" ("last_import_batch");

    DO $$ BEGIN
      ALTER TABLE "staff" ADD CONSTRAINT "staff_import_review_status_check"
        CHECK ("import_review_status" IN ('validated', 'pending_review', 'ambiguous', 'retired_candidate'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "staff_status_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "staff_id" integer NOT NULL,
      "previous_status" varchar(32) NOT NULL,
      "new_status" varchar(32) NOT NULL,
      "reason" text NOT NULL,
      "source" varchar(32) DEFAULT 'manual' NOT NULL,
      "import_batch" varchar(255),
      "changed_by_id" integer,
      "changed_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "notes" text,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "staff_status_events" ADD CONSTRAINT "staff_status_events_staff_id_staff_id_fk"
        FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "staff_status_events" ADD CONSTRAINT "staff_status_events_changed_by_id_users_id_fk"
        FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "staff_status_events" ADD CONSTRAINT "staff_status_events_previous_status_check"
        CHECK ("previous_status" IN ('active', 'temporary_leave', 'inactive', 'created'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "staff_status_events" ADD CONSTRAINT "staff_status_events_new_status_check"
        CHECK ("new_status" IN ('active', 'temporary_leave', 'inactive', 'created'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "staff_status_events" ADD CONSTRAINT "staff_status_events_source_check"
        CHECK ("source" IN ('manual', 'excel_import', 'audit', 'system'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "staff_status_events_staff_changed_idx" ON "staff_status_events" ("staff_id", "changed_at");
    CREATE INDEX IF NOT EXISTS "staff_status_events_import_batch_idx" ON "staff_status_events" ("import_batch");
    CREATE INDEX IF NOT EXISTS "staff_status_events_source_idx" ON "staff_status_events" ("source");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "staff_status_events";
    DROP INDEX IF EXISTS "staff_nif_unique_idx";
    DROP INDEX IF EXISTS "staff_import_review_status_idx";
    DROP INDEX IF EXISTS "staff_last_import_batch_idx";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "nif";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "inactive_reason";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "inactive_at";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "reactivated_at";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "last_import_batch";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "import_review_status";
  `)
}

