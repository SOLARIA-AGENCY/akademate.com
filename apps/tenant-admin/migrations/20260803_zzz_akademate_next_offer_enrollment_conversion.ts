import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const conversionSignature = '(bigint)'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "enrollments"
      ADD COLUMN "tenant_id" integer,
      ADD COLUMN "offer_submission_id" bigint;

    UPDATE "enrollments" enrollment
    SET "tenant_id" = run."tenant_id"
    FROM "course_runs" run
    WHERE enrollment."course_run_id" = run."id";

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM "enrollments" enrollment
        LEFT JOIN "course_runs" run ON run."id" = enrollment."course_run_id"
        LEFT JOIN "leads" learner ON learner."id" = enrollment."student_id"
        WHERE enrollment."tenant_id" IS NULL
          OR learner."tenant_id" IS NULL
          OR learner."tenant_id" <> enrollment."tenant_id"
          OR run."tenant_id" <> enrollment."tenant_id"
      ) THEN
        RAISE EXCEPTION 'Cannot tenant-scope enrollments with missing or mismatched ownership';
      END IF;
    END
    $$;

    ALTER TABLE "enrollments" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "leads"
      ADD CONSTRAINT "leads_tenant_id_id_unique" UNIQUE ("tenant_id", "id");
    ALTER TABLE "enrollments"
      ADD CONSTRAINT "enrollments_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      ADD CONSTRAINT "enrollments_tenant_student_fk"
        FOREIGN KEY ("tenant_id", "student_id")
        REFERENCES "leads"("tenant_id", "id") ON DELETE RESTRICT,
      ADD CONSTRAINT "enrollments_tenant_course_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE RESTRICT,
      ADD CONSTRAINT "enrollments_offer_submission_fk"
        FOREIGN KEY ("tenant_id", "offer_submission_id")
        REFERENCES "offer_submissions"("tenant_id", "id") ON DELETE RESTRICT,
      ADD CONSTRAINT "enrollments_offer_submission_unique"
        UNIQUE ("offer_submission_id"),
      ADD CONSTRAINT "enrollments_tenant_student_run_unique"
        UNIQUE ("tenant_id", "student_id", "course_run_id");

    CREATE INDEX "enrollments_tenant_created_idx"
      ON "enrollments" ("tenant_id", "created_at" DESC);

    ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "enrollments" FORCE ROW LEVEL SECURITY;
    CREATE POLICY "enrollments_tenant_isolation" ON "enrollments"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "enrollments_authenticated_read" ON "enrollments"
      FOR SELECT USING (COALESCE(current_setting('app.role', true), '') IN (
        'superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura'
      ));
    CREATE POLICY "enrollments_reviewer_insert" ON "enrollments"
      FOR INSERT WITH CHECK (akademate_next_can_review_offer_submissions());

    CREATE FUNCTION "akademate_next_convert_offer_submission_to_enrollment"(
      requested_submission_id bigint
    ) RETURNS TABLE (
      submission_id bigint,
      enrollment_id integer,
      learner_id integer,
      enrollment_status varchar,
      replayed boolean,
      capacity_reserved boolean
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      resolved_tenant_id integer := NULLIF(current_setting('app.tenant_id', true), '')::integer;
      resolved_actor_user_id integer := NULLIF(current_setting('app.user_id', true), '')::integer;
      current_submission public.offer_submissions%ROWTYPE;
      current_run public.course_runs%ROWTYPE;
      existing_enrollment public.enrollments%ROWTYPE;
      created_enrollment public.enrollments%ROWTYPE;
      created_learner public.leads%ROWTYPE;
      resolved_enrollment_status public.enum_enrollments_status;
      reserves_capacity boolean;
      event_timestamp timestamptz := clock_timestamp();
    BEGIN
      IF resolved_tenant_id IS NULL OR resolved_actor_user_id IS NULL
        OR NOT public.akademate_next_can_review_offer_submissions()
      THEN
        RAISE EXCEPTION 'offer_submission_enrollment_forbidden';
      END IF;

      SELECT * INTO current_submission
      FROM public."offer_submissions" submission
      WHERE submission."tenant_id" = resolved_tenant_id
        AND submission."id" = requested_submission_id
      FOR UPDATE;

      IF current_submission."id" IS NULL THEN
        RAISE EXCEPTION 'offer_submission_not_found';
      END IF;

      SELECT * INTO existing_enrollment
      FROM public."enrollments" enrollment
      WHERE enrollment."tenant_id" = resolved_tenant_id
        AND enrollment."offer_submission_id" = current_submission."id";

      IF existing_enrollment."id" IS NOT NULL THEN
        RETURN QUERY SELECT current_submission."id", existing_enrollment."id",
          existing_enrollment."student_id", existing_enrollment."status"::varchar,
          true, existing_enrollment."status" = 'confirmed';
        RETURN;
      END IF;

      IF current_submission.status <> 'approved' THEN
        RAISE EXCEPTION 'offer_submission_not_approved';
      END IF;

      SELECT * INTO current_run
      FROM public."course_runs" run
      WHERE run."tenant_id" = resolved_tenant_id
        AND run."id" = current_submission."course_run_id"
      FOR UPDATE;

      IF current_run."id" IS NULL THEN
        RAISE EXCEPTION 'offer_submission_not_found';
      END IF;
      IF current_run.conversion_mode::text NOT IN ('approval_required', 'free_registration')
        OR current_run.status::text NOT IN ('published', 'enrollment_open')
        OR (current_run.enrollment_deadline IS NOT NULL AND current_run.enrollment_deadline < now())
      THEN
        RAISE EXCEPTION 'offer_submission_enrollment_not_available';
      END IF;

      IF current_run.capacity_policy::text = 'limited'
        AND current_run.current_enrollments >= current_run.max_students
      THEN
        RAISE EXCEPTION 'offer_submission_capacity_full';
      END IF;

      IF current_run.capacity_policy::text = 'waitlist'
        AND current_run.current_enrollments >= current_run.max_students
      THEN
        resolved_enrollment_status := 'waitlisted';
        reserves_capacity := false;
      ELSE
        resolved_enrollment_status := 'confirmed';
        reserves_capacity := true;
      END IF;

      INSERT INTO public."leads" (
        "first_name", "last_name", "email", "phone", "course_id", "message",
        "gdpr_consent", "privacy_policy_accepted", "marketing_consent",
        "consent_timestamp", "status", "priority", "tenant_id", "updated_at", "created_at"
      ) VALUES (
        current_submission."first_name", current_submission."last_name",
        current_submission."email", COALESCE(current_submission."phone", ''),
        current_run."course_id", current_submission."message",
        true, true, current_submission."marketing_consent",
        current_submission."created_at", 'converted', 'medium', resolved_tenant_id,
        event_timestamp, event_timestamp
      ) RETURNING * INTO created_learner;

      INSERT INTO public."enrollments" (
        "tenant_id", "student_id", "course_run_id", "offer_submission_id",
        "status", "payment_status", "total_amount", "amount_paid",
        "enrolled_at", "created_by_id", "updated_at", "created_at"
      ) VALUES (
        resolved_tenant_id, created_learner."id", current_run."id", current_submission."id",
        resolved_enrollment_status, 'pending', 0, 0,
        event_timestamp, resolved_actor_user_id, event_timestamp, event_timestamp
      ) RETURNING * INTO created_enrollment;

      IF reserves_capacity THEN
        UPDATE public."course_runs"
        SET "current_enrollments" = "current_enrollments" + 1,
            "updated_at" = event_timestamp
        WHERE "tenant_id" = resolved_tenant_id AND "id" = current_run."id";
      END IF;

      RETURN QUERY SELECT current_submission."id", created_enrollment."id",
        created_learner."id", created_enrollment."status"::varchar,
        false, reserves_capacity;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_convert_offer_submission_to_enrollment"${sql.raw(conversionSignature)} FROM PUBLIC;
    REVOKE ALL ON "enrollments" FROM PUBLIC;
    REVOKE ALL ON "enrollments" FROM ${applicationRoleIdentifier};
    GRANT SELECT ON "enrollments" TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_convert_offer_submission_to_enrollment"${sql.raw(conversionSignature)}
      TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "enrollments") THEN
        RAISE EXCEPTION 'Cannot roll back offer enrollment conversion while converted enrollments exist';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_convert_offer_submission_to_enrollment"${sql.raw(conversionSignature)}
      FROM ${applicationRoleIdentifier};
    REVOKE SELECT ON "enrollments" FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_convert_offer_submission_to_enrollment"${sql.raw(conversionSignature)};
    DROP POLICY "enrollments_reviewer_insert" ON "enrollments";
    DROP POLICY "enrollments_authenticated_read" ON "enrollments";
    DROP POLICY "enrollments_tenant_isolation" ON "enrollments";
    ALTER TABLE "enrollments" NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE "enrollments" DISABLE ROW LEVEL SECURITY;
    DROP INDEX "enrollments_tenant_created_idx";
    ALTER TABLE "enrollments"
      DROP CONSTRAINT "enrollments_tenant_student_run_unique",
      DROP CONSTRAINT "enrollments_offer_submission_unique",
      DROP CONSTRAINT "enrollments_offer_submission_fk",
      DROP CONSTRAINT "enrollments_tenant_course_run_fk",
      DROP CONSTRAINT "enrollments_tenant_student_fk",
      DROP CONSTRAINT "enrollments_tenant_fk",
      DROP COLUMN "offer_submission_id",
      DROP COLUMN "tenant_id";
    ALTER TABLE "leads" DROP CONSTRAINT "leads_tenant_id_id_unique";
  `)
}
