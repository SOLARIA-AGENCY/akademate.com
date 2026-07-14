import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Internal Campus foundation. This migration is intentionally additive:
 * it does not rewrite the existing enrollment -> leads relationship.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (process.env.CAMPUS_INTERNAL_ENABLED !== 'true' || process.env.CAMPUS_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('Campus Virtual solo puede migrarse con CAMPUS_INTERNAL_ENABLED=true fuera de produccion')
  }

  await db.execute(sql`
    ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "password_hash" varchar;
    ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone;

    CREATE TABLE IF NOT EXISTS "campus_auth_tokens" (
      "id" serial PRIMARY KEY NOT NULL,
      "token_hash" varchar NOT NULL,
      "student_id" integer NOT NULL,
      "purpose" varchar DEFAULT 'setup' NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "consumed_at" timestamp(3) with time zone,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "campus_enrollments" (
      "id" serial PRIMARY KEY NOT NULL,
      "student_id" integer NOT NULL,
      "enrollment_id" integer NOT NULL,
      "status" varchar DEFAULT 'active' NOT NULL,
      "access_start" timestamp(3) with time zone,
      "access_end" timestamp(3) with time zone,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "modules" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "description" jsonb,
      "course_id" integer NOT NULL,
      "order" numeric DEFAULT 0 NOT NULL,
      "is_published" boolean DEFAULT false,
      "unlock_date" timestamp(3) with time zone,
      "estimated_duration_minutes" numeric,
      "created_by_id" integer,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "lessons" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "lesson_type" varchar DEFAULT 'video' NOT NULL,
      "module_id" integer NOT NULL,
      "content" jsonb,
      "video_url" varchar,
      "video_duration_seconds" numeric,
      "quiz_data" jsonb,
      "assignment_instructions" jsonb,
      "order" numeric DEFAULT 0 NOT NULL,
      "is_published" boolean DEFAULT false,
      "is_free_preview" boolean DEFAULT false,
      "unlock_date" timestamp(3) with time zone,
      "requires_completion" boolean DEFAULT true,
      "passing_score" numeric,
      "estimated_duration_minutes" numeric,
      "created_by_id" integer,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "materials" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "description" varchar,
      "material_type" varchar NOT NULL,
      "module_id" integer,
      "lesson_id" integer,
      "course_id" integer,
      "file_id" integer,
      "external_url" varchar,
      "order" numeric DEFAULT 0,
      "is_published" boolean DEFAULT false,
      "is_downloadable" boolean DEFAULT true,
      "download_count" numeric DEFAULT 0,
      "file_size_bytes" numeric,
      "created_by_id" integer,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "lesson_progress" (
      "id" serial PRIMARY KEY NOT NULL,
      "enrollment_id" integer NOT NULL,
      "lesson_id" integer NOT NULL,
      "is_completed" boolean DEFAULT false,
      "completed_at" timestamp(3) with time zone,
      "time_spent" numeric DEFAULT 0,
      "last_access_at" timestamp(3) with time zone,
      "last_position" numeric DEFAULT 0,
      "watched_percentage" numeric DEFAULT 0,
      "score" numeric,
      "attempts" numeric DEFAULT 0,
      "passed" boolean DEFAULT false,
      "submission_data" jsonb,
      "notes" varchar,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "campus_auth_tokens" ADD CONSTRAINT "campus_auth_tokens_student_fk"
        FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "campus_auth_tokens" ADD CONSTRAINT "campus_auth_tokens_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "campus_enrollments" ADD CONSTRAINT "campus_enrollments_student_fk"
        FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "campus_enrollments" ADD CONSTRAINT "campus_enrollments_enrollment_fk"
        FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "campus_enrollments" ADD CONSTRAINT "campus_enrollments_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "modules" ADD CONSTRAINT "modules_course_fk"
        FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "modules" ADD CONSTRAINT "modules_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_fk"
        FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "lessons" ADD CONSTRAINT "lessons_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "materials" ADD CONSTRAINT "materials_module_fk"
        FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "materials" ADD CONSTRAINT "materials_lesson_fk"
        FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "materials" ADD CONSTRAINT "materials_course_fk"
        FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "materials" ADD CONSTRAINT "materials_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_fk"
        FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_fk"
        FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "campus_auth_tokens_hash_idx" ON "campus_auth_tokens" ("token_hash");
    CREATE INDEX IF NOT EXISTS "campus_auth_tokens_student_purpose_idx" ON "campus_auth_tokens" ("student_id", "purpose");
    CREATE UNIQUE INDEX IF NOT EXISTS "campus_enrollments_student_enrollment_idx" ON "campus_enrollments" ("student_id", "enrollment_id");
    CREATE INDEX IF NOT EXISTS "campus_enrollments_student_status_idx" ON "campus_enrollments" ("student_id", "status");
    CREATE UNIQUE INDEX IF NOT EXISTS "modules_tenant_slug_idx" ON "modules" ("tenant_id", "slug");
    CREATE INDEX IF NOT EXISTS "modules_tenant_course_order_idx" ON "modules" ("tenant_id", "course_id", "order");
    CREATE UNIQUE INDEX IF NOT EXISTS "lessons_tenant_slug_idx" ON "lessons" ("tenant_id", "slug");
    CREATE INDEX IF NOT EXISTS "lessons_tenant_module_order_idx" ON "lessons" ("tenant_id", "module_id", "order");
    CREATE INDEX IF NOT EXISTS "materials_tenant_lesson_idx" ON "materials" ("tenant_id", "lesson_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_enrollment_lesson_idx" ON "lesson_progress" ("enrollment_id", "lesson_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (process.env.CAMPUS_INTERNAL_ENABLED !== 'true' || process.env.CAMPUS_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('Campus Virtual solo puede revertirse con CAMPUS_INTERNAL_ENABLED=true fuera de produccion')
  }

  await db.execute(sql`
    DROP TABLE IF EXISTS "lesson_progress";
    DROP TABLE IF EXISTS "materials";
    DROP TABLE IF EXISTS "lessons";
    DROP TABLE IF EXISTS "modules";
    DROP TABLE IF EXISTS "campus_enrollments";
    DROP TABLE IF EXISTS "campus_auth_tokens";
    ALTER TABLE "students" DROP COLUMN IF EXISTS "last_login_at";
    ALTER TABLE "students" DROP COLUMN IF EXISTS "password_hash";
  `)
}
