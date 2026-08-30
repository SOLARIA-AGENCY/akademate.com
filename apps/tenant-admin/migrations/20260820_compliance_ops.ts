import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "region_pack_bindings" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "pack_id" varchar NOT NULL,
      "scope" varchar NOT NULL DEFAULT 'tenant',
      "scope_id" varchar NOT NULL,
      "override_json" jsonb,
      "active" boolean NOT NULL DEFAULT true,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "region_pack_bindings_tenant_idx" ON "region_pack_bindings" ("tenant_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "region_pack_bindings_scope_idx"
      ON "region_pack_bindings" ("tenant_id", "scope", "scope_id", "pack_id");

    CREATE TABLE IF NOT EXISTS "attendance_roster_entries" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "enrollment_id" integer NOT NULL,
      "session_date" timestamptz NOT NULL,
      "code" varchar NOT NULL,
      "scheduled_hours" numeric NOT NULL DEFAULT 0,
      "recorded_by_id" integer,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "attendance_roster_unique_idx"
      ON "attendance_roster_entries" ("tenant_id", "enrollment_id", "session_date");

    CREATE TABLE IF NOT EXISTS "attendance_events" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "enrollment_id" integer NOT NULL,
      "event_type" varchar NOT NULL,
      "value" numeric NOT NULL,
      "at_date" timestamptz NOT NULL,
      "acknowledged" boolean NOT NULL DEFAULT false,
      "dedupe_key" varchar NOT NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "attendance_events_dedupe_idx" ON "attendance_events" ("dedupe_key");

    CREATE TABLE IF NOT EXISTS "selection_candidacies" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "display_name" varchar NOT NULL,
      "national_id" varchar,
      "email" varchar,
      "phone" varchar,
      "sex" varchar,
      "stage" varchar NOT NULL DEFAULT 'prospect',
      "capture_channel" varchar,
      "motivation_score" numeric,
      "theory_score" numeric,
      "has_employment_file" boolean DEFAULT false,
      "has_cv" boolean DEFAULT false,
      "notes" text,
      "source_label" varchar,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "selection_candidacies_run_idx" ON "selection_candidacies" ("tenant_id", "course_run_id");

    CREATE TABLE IF NOT EXISTS "placement_agencies" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "title" varchar NOT NULL,
      "public_slug" varchar NOT NULL,
      "email" varchar NOT NULL,
      "hours_label" varchar,
      "authorization_code" varchar,
      "campus_label" varchar,
      "legal_blocks" jsonb,
      "published" boolean NOT NULL DEFAULT false,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "placement_agencies_slug_idx" ON "placement_agencies" ("tenant_id", "public_slug");

    CREATE TABLE IF NOT EXISTS "enrollment_dropouts" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "enrollment_id" integer NOT NULL,
      "reason_code" varchar NOT NULL,
      "effective_date" timestamptz NOT NULL,
      "notes" text,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS "enrollment_dropouts_enrollment_idx" ON "enrollment_dropouts" ("enrollment_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "enrollment_dropouts";
    DROP TABLE IF EXISTS "placement_agencies";
    DROP TABLE IF EXISTS "selection_candidacies";
    DROP TABLE IF EXISTS "attendance_events";
    DROP TABLE IF EXISTS "attendance_roster_entries";
    DROP TABLE IF EXISTS "region_pack_bindings";
  `)
}
