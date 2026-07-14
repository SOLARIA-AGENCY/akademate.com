import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Staging-only compatibility for fields already declared by current collections.
 * The historical migration chain did not create these columns, which prevents
 * Payload from reading or updating documents in a fresh isolated database.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  if (process.env.CAMPUS_ENVIRONMENT !== 'staging' || process.env.NODE_ENV === 'production') return

  await db.execute(sql`
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "integrations_gtm_container_id" varchar;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "integrations_meta_ad_account_id" varchar;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "integrations_meta_business_id" varchar;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "integrations_meta_conversions_api_token" varchar;
    ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "integrations_meta_marketing_api_token" varchar;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "audit_logs_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "classrooms_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "campus_enrollments_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "modules_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "lessons_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "lesson_progress_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "materials_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "submissions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "attendance_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "certificates_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "badges_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "user_badges_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "points_transactions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "user_streaks_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "api_keys_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "course_types_id" integer;

    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'isCompleted')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'is_completed') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "isCompleted" TO "is_completed";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'completedAt')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'completed_at') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "completedAt" TO "completed_at";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'timeSpent')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'time_spent') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "timeSpent" TO "time_spent";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'lastAccessAt')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'last_access_at') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "lastAccessAt" TO "last_access_at";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'lastPosition')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'last_position') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "lastPosition" TO "last_position";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'watchedPercentage')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'watched_percentage') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "watchedPercentage" TO "watched_percentage";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'submissionData')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'submission_data') THEN
        ALTER TABLE "lesson_progress" RENAME COLUMN "submissionData" TO "submission_data";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (process.env.CAMPUS_ENVIRONMENT !== 'staging' || process.env.NODE_ENV === 'production') return

  // Keep this rollback non-destructive: these fields may be populated by a later
  // staging exercise and their removal is not required to disable the campus.
  await db.execute(sql``)
}
