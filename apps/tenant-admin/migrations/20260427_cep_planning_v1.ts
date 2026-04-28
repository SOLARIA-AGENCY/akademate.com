import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_classrooms_usage_policy" AS ENUM('private_only', 'fped_only', 'cycle_only', 'mixed', 'restricted');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_classrooms_enabled_shifts" AS ENUM('morning', 'afternoon', 'evening_extra');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_classrooms_data_quality_status" AS ENUM('complete', 'pending_validation');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_courses_operational_status" AS ENUM('active', 'inactive', 'pending_validation');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_courses_price_source" AS ENUM('course_default', 'manual_import', 'unknown');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_course_runs_shift" AS ENUM('morning', 'afternoon', 'evening_extra');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_course_runs_training_type" AS ENUM('private', 'fped', 'cycle', 'other');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_course_runs_planning_status" AS ENUM('draft', 'pending_validation', 'validated', 'published', 'cancelled', 'completed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_course_runs_price_source" AS ENUM('course_default', 'run_override', 'manual_import', 'unknown');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_staff_data_quality_status" AS ENUM('complete', 'pending_validation');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_planning_conflicts_type" AS ENUM('classroom_overlap', 'instructor_overlap', 'room_usage_policy', 'cep_norte_private_room', 'cep_norte_fped_room', 'room_capacity_exceeded', 'capacity_exceeded', 'invalid_dates', 'other');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_planning_conflicts_severity" AS ENUM('blocker', 'warning');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_planning_conflicts_status" AS ENUM('open', 'resolved', 'ignored');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TYPE "public"."enum_staff_staff_type" ADD VALUE IF NOT EXISTS 'jefatura_administracion';
    ALTER TYPE "public"."enum_staff_staff_type" ADD VALUE IF NOT EXISTS 'academico';

    ALTER TABLE "classrooms" ADD COLUMN IF NOT EXISTS "code" varchar;
    ALTER TABLE "classrooms" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;
    ALTER TABLE "classrooms" ADD COLUMN IF NOT EXISTS "usage_policy" "public"."enum_classrooms_usage_policy" DEFAULT 'mixed' NOT NULL;
    ALTER TABLE "classrooms" ADD COLUMN IF NOT EXISTS "data_quality_status" "public"."enum_classrooms_data_quality_status" DEFAULT 'complete' NOT NULL;
    ALTER TABLE "classrooms" ADD COLUMN IF NOT EXISTS "operational_notes" varchar;
    UPDATE "classrooms" SET "is_active" = COALESCE("is_active", "active", true) WHERE "is_active" IS NULL;
    UPDATE "classrooms" SET "code" = CONCAT('LEGACY-', "id"::text) WHERE "code" IS NULL OR BTRIM("code") = '';
    ALTER TABLE "classrooms" ALTER COLUMN "code" SET NOT NULL;

    DO $$ BEGIN
      ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_code_unique" UNIQUE("code");
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "classrooms_enabled_shifts" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "public"."enum_classrooms_enabled_shifts",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "classrooms_resources" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" varchar,
      "id" serial PRIMARY KEY NOT NULL
    );

    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "enrollment_fee" numeric;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "installment_amount" numeric;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "installment_count" numeric;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "price_notes" varchar;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "price_source" "public"."enum_courses_price_source" DEFAULT 'unknown';
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "operational_status" "public"."enum_courses_operational_status" DEFAULT 'active' NOT NULL;

    ALTER TABLE "staff" ALTER COLUMN "email" DROP NOT NULL;
    ALTER TABLE "staff" ALTER COLUMN "hire_date" DROP NOT NULL;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "data_quality_status" "public"."enum_staff_data_quality_status" DEFAULT 'complete' NOT NULL;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "source" varchar;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "alias_names" varchar;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "detected_courses" varchar;

    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "classroom_id" integer;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "shift" "public"."enum_course_runs_shift" DEFAULT 'morning';
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "training_type" "public"."enum_course_runs_training_type" DEFAULT 'private' NOT NULL;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "planning_status" "public"."enum_course_runs_planning_status" DEFAULT 'draft' NOT NULL;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "price_snapshot" numeric;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "enrollment_fee_snapshot" numeric;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "installment_amount_snapshot" numeric;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "installment_count_snapshot" numeric;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "price_source" "public"."enum_course_runs_price_source" DEFAULT 'course_default';
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "administrative_owner_id" integer;

    CREATE TABLE IF NOT EXISTS "course_runs_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "staff_id" integer
    );

    CREATE TABLE IF NOT EXISTS "planning_conflicts" (
      "id" serial PRIMARY KEY NOT NULL,
      "course_run_id" integer NOT NULL,
      "type" "public"."enum_planning_conflicts_type" NOT NULL,
      "severity" "public"."enum_planning_conflicts_severity" DEFAULT 'warning' NOT NULL,
      "status" "public"."enum_planning_conflicts_status" DEFAULT 'open' NOT NULL,
      "message" varchar NOT NULL,
      "detected_at" timestamp(3) with time zone DEFAULT now(),
      "resolved_at" timestamp(3) with time zone,
      "tenant_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "classrooms_usage_policy_idx" ON "classrooms" USING btree ("usage_policy");
    CREATE INDEX IF NOT EXISTS "classrooms_data_quality_status_idx" ON "classrooms" USING btree ("data_quality_status");
    CREATE INDEX IF NOT EXISTS "classrooms_code_idx" ON "classrooms" USING btree ("code");
    CREATE INDEX IF NOT EXISTS "classrooms_is_active_idx" ON "classrooms" USING btree ("is_active");
    CREATE INDEX IF NOT EXISTS "classrooms_enabled_shifts_order_idx" ON "classrooms_enabled_shifts" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "classrooms_enabled_shifts_parent_idx" ON "classrooms_enabled_shifts" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "classrooms_resources_order_idx" ON "classrooms_resources" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "classrooms_resources_parent_idx" ON "classrooms_resources" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "courses_operational_status_idx" ON "courses" USING btree ("operational_status");
    CREATE INDEX IF NOT EXISTS "course_runs_classroom_idx" ON "course_runs" USING btree ("classroom_id");
    CREATE INDEX IF NOT EXISTS "course_runs_training_type_idx" ON "course_runs" USING btree ("training_type");
    CREATE INDEX IF NOT EXISTS "course_runs_planning_status_idx" ON "course_runs" USING btree ("planning_status");
    CREATE INDEX IF NOT EXISTS "course_runs_administrative_owner_idx" ON "course_runs" USING btree ("administrative_owner_id");
    CREATE INDEX IF NOT EXISTS "planning_conflicts_course_run_idx" ON "planning_conflicts" USING btree ("course_run_id");
    CREATE INDEX IF NOT EXISTS "planning_conflicts_status_idx" ON "planning_conflicts" USING btree ("status");

    DO $$ BEGIN
      ALTER TABLE "classrooms_enabled_shifts" ADD CONSTRAINT "classrooms_enabled_shifts_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "classrooms_resources" ADD CONSTRAINT "classrooms_resources_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_runs" ADD CONSTRAINT "course_runs_administrative_owner_id_staff_id_fk" FOREIGN KEY ("administrative_owner_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_runs_rels" ADD CONSTRAINT "course_runs_rels_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "course_runs_rels" ADD CONSTRAINT "course_runs_rels_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "planning_conflicts" ADD CONSTRAINT "planning_conflicts_course_run_id_fk" FOREIGN KEY ("course_run_id") REFERENCES "public"."course_runs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "planning_conflicts_id" integer;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_planning_conflicts_id_idx" ON "payload_locked_documents_rels" USING btree ("planning_conflicts_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_planning_conflicts_fk" FOREIGN KEY ("planning_conflicts_id") REFERENCES "public"."planning_conflicts"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "planning_conflicts_id";

    DROP TABLE IF EXISTS "planning_conflicts";
    DROP TABLE IF EXISTS "course_runs_rels";
    DROP TABLE IF EXISTS "classrooms_resources";
    DROP TABLE IF EXISTS "classrooms_enabled_shifts";

    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "administrative_owner_id";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "price_source";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "installment_count_snapshot";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "installment_amount_snapshot";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "enrollment_fee_snapshot";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "price_snapshot";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "planning_status";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "training_type";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "shift";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "classroom_id";

    ALTER TABLE "staff" DROP COLUMN IF EXISTS "source";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "alias_names";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "detected_courses";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "data_quality_status";

    ALTER TABLE "courses" DROP COLUMN IF EXISTS "operational_status";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "price_source";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "price_notes";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "installment_count";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "installment_amount";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "enrollment_fee";

    ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "operational_notes";
    ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "data_quality_status";
    ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "usage_policy";
    ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "is_active";
    ALTER TABLE "classrooms" DROP COLUMN IF EXISTS "code";
  `);
}
