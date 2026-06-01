import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "course_run_sessions" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "course_run_id" integer NOT NULL,
      "session_date" timestamp(3) with time zone NOT NULL,
      "weekday" varchar NOT NULL,
      "time_start" varchar NOT NULL,
      "time_end" varchar NOT NULL,
      "campus_id" integer,
      "classroom_id" integer,
      "instructor_id" integer,
      "status" varchar DEFAULT 'scheduled' NOT NULL,
      "notes" varchar,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_course_run_id_course_runs_id_fk"
        FOREIGN KEY ("course_run_id") REFERENCES "public"."course_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_campus_id_campuses_id_fk"
        FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_classroom_id_classrooms_id_fk"
        FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_instructor_id_staff_id_fk"
        FOREIGN KEY ("instructor_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_weekday_check"
        CHECK ("weekday" IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_run_sessions" ADD CONSTRAINT "course_run_sessions_status_check"
        CHECK ("status" IN ('scheduled', 'completed', 'cancelled', 'rescheduled'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "course_run_sessions_tenant_date_idx" ON "course_run_sessions" USING btree ("tenant_id", "session_date");
    CREATE INDEX IF NOT EXISTS "course_run_sessions_course_run_idx" ON "course_run_sessions" USING btree ("course_run_id");
    CREATE INDEX IF NOT EXISTS "course_run_sessions_classroom_date_idx" ON "course_run_sessions" USING btree ("tenant_id", "classroom_id", "session_date");
    CREATE INDEX IF NOT EXISTS "course_run_sessions_instructor_date_idx" ON "course_run_sessions" USING btree ("tenant_id", "instructor_id", "session_date");
    CREATE UNIQUE INDEX IF NOT EXISTS "course_run_sessions_unique_slot_idx" ON "course_run_sessions" USING btree ("tenant_id", "course_run_id", "session_date", "time_start", "time_end");
    CREATE INDEX IF NOT EXISTS "course_run_sessions_updated_at_idx" ON "course_run_sessions" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "course_run_sessions_created_at_idx" ON "course_run_sessions" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "course_run_sessions";
  `)
}
