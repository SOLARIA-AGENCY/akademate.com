import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const signature = '(varchar, varchar, uuid, varchar, varchar, varchar, varchar, varchar, boolean, boolean, varchar, varchar, varchar)'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    CREATE TABLE "offer_submissions" (
      "id" bigserial PRIMARY KEY,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "submission_kind" varchar NOT NULL,
      "status" varchar NOT NULL,
      "first_name" varchar NOT NULL,
      "last_name" varchar NOT NULL,
      "email" varchar NOT NULL,
      "phone" varchar,
      "message" varchar,
      "privacy_accepted" boolean NOT NULL,
      "privacy_notice_version" varchar NOT NULL,
      "marketing_consent" boolean DEFAULT false NOT NULL,
      "source_host" varchar NOT NULL,
      "source_slug" varchar NOT NULL,
      "idempotency_key" uuid NOT NULL,
      "payload_fingerprint" varchar NOT NULL,
      "contact_fingerprint" varchar NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "offer_submissions_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "offer_submissions_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "offer_submissions_kind_check"
        CHECK ("submission_kind" IN ('interest', 'application', 'registration_request')),
      CONSTRAINT "offer_submissions_status_check"
        CHECK ("status" IN ('new', 'pending_review', 'pending_registration')),
      CONSTRAINT "offer_submissions_privacy_check"
        CHECK ("privacy_accepted" = true),
      CONSTRAINT "offer_submissions_identity_bounds_check" CHECK (
        char_length("first_name") BETWEEN 1 AND 80
        AND char_length("last_name") BETWEEN 1 AND 120
        AND char_length("email") BETWEEN 3 AND 254
        AND "email" = lower("email")
        AND ("phone" IS NULL OR char_length("phone") BETWEEN 4 AND 32)
        AND ("message" IS NULL OR char_length("message") <= 1000)
      ),
      CONSTRAINT "offer_submissions_source_bounds_check" CHECK (
        char_length("source_host") BETWEEN 1 AND 253
        AND char_length("source_slug") BETWEEN 3 AND 160
        AND char_length("privacy_notice_version") BETWEEN 3 AND 64
      ),
      CONSTRAINT "offer_submissions_payload_fingerprint_check"
        CHECK ("payload_fingerprint" ~ '^[0-9a-f]{64}$'),
      CONSTRAINT "offer_submissions_contact_fingerprint_check"
        CHECK ("contact_fingerprint" ~ '^[0-9a-f]{64}$'),
      CONSTRAINT "offer_submissions_idempotency_UNIQUE"
        UNIQUE ("tenant_id", "course_run_id", "idempotency_key")
    );

    CREATE INDEX "offer_submissions_tenant_created_idx"
      ON "offer_submissions" ("tenant_id", "created_at" DESC);
    CREATE INDEX "offer_submissions_rate_idx"
      ON "offer_submissions" ("tenant_id", "course_run_id", "contact_fingerprint", "created_at" DESC);

    ALTER TABLE "offer_submissions" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "offer_submissions" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "offer_submissions_tenant_isolation" ON "offer_submissions"
      AS RESTRICTIVE FOR ALL USING (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer
      ) WITH CHECK (
        "tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer
      );

    CREATE POLICY "offer_submissions_manage_read" ON "offer_submissions"
      FOR SELECT USING (akademate_next_can_manage_offers());

    CREATE FUNCTION "akademate_next_submit_public_offer"(
      request_host varchar,
      request_slug varchar,
      request_idempotency_key uuid,
      request_first_name varchar,
      request_last_name varchar,
      request_email varchar,
      request_phone varchar,
      request_message varchar,
      privacy_accepted boolean,
      marketing_consent boolean,
      privacy_notice_version varchar,
      request_payload_fingerprint varchar,
      request_contact_fingerprint varchar
    ) RETURNS TABLE (
      submission_id bigint,
      submission_kind varchar,
      submission_status varchar,
      replayed boolean
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      resolved_tenant_id integer;
      resolved_course_run_id integer;
      resolved_mode varchar;
      resolved_capacity varchar;
      resolved_max_students numeric;
      resolved_current_enrollments numeric;
      existing_submission public.offer_submissions%ROWTYPE;
      created_submission public.offer_submissions%ROWTYPE;
    BEGIN
      IF privacy_accepted IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'public_offer_submission_not_available';
      END IF;

      SELECT t."id", cr."id", cr."conversion_mode"::varchar,
        cr."capacity_policy"::varchar, cr."max_students", cr."current_enrollments"
      INTO resolved_tenant_id, resolved_course_run_id, resolved_mode,
        resolved_capacity, resolved_max_students, resolved_current_enrollments
      FROM public."tenants" t
      JOIN public."course_runs" cr ON cr."tenant_id" = t."id"
      JOIN public."courses" c
        ON c."id" = cr."course_id" AND c."tenant_id" = t."id"
      WHERE t."active" = true
        AND c."active" = true
        AND (
          lower(t."domain") = lower(request_host)
          OR lower(request_host) = lower(t."slug") || '.akademate.com'
          OR lower(request_host) = lower(t."slug") || '.akademate.io'
          OR lower(request_host) = lower(t."slug") || '.localhost'
        )
        AND cr."share_slug" = request_slug
        AND cr."publication_access" IN ('public', 'unlisted')
        AND cr."status"::text IN ('published', 'enrollment_open')
        AND cr."conversion_mode"::text IN ('interest_form', 'approval_required', 'free_registration')
        AND (cr."enrollment_deadline" IS NULL OR cr."enrollment_deadline" >= now())
      LIMIT 1;

      IF resolved_course_run_id IS NULL THEN
        RAISE EXCEPTION 'public_offer_submission_not_available';
      END IF;
      IF resolved_mode = 'free_registration'
        AND resolved_capacity = 'limited'
        AND resolved_current_enrollments >= resolved_max_students
      THEN
        RAISE EXCEPTION 'public_offer_submission_not_available';
      END IF;

      SELECT * INTO existing_submission
      FROM public."offer_submissions" os
      WHERE os."tenant_id" = resolved_tenant_id
        AND os."course_run_id" = resolved_course_run_id
        AND os."idempotency_key" = request_idempotency_key;

      IF existing_submission."id" IS NOT NULL THEN
        IF existing_submission."payload_fingerprint" <> request_payload_fingerprint THEN
          RAISE EXCEPTION 'public_offer_submission_idempotency_conflict';
        END IF;
        RETURN QUERY SELECT existing_submission."id", existing_submission."submission_kind",
          existing_submission."status", true;
        RETURN;
      END IF;

      IF (
        SELECT count(*)
        FROM public."offer_submissions" recent
        WHERE recent."tenant_id" = resolved_tenant_id
          AND recent."course_run_id" = resolved_course_run_id
          AND recent."contact_fingerprint" = request_contact_fingerprint
          AND recent."created_at" >= now() - interval '1 hour'
      ) >= 5 THEN
        RAISE EXCEPTION 'public_offer_submission_rate_limited';
      END IF;

      INSERT INTO public."offer_submissions" (
        "tenant_id", "course_run_id", "submission_kind", "status",
        "first_name", "last_name", "email", "phone", "message",
        "privacy_accepted", "privacy_notice_version", "marketing_consent",
        "source_host", "source_slug", "idempotency_key", "payload_fingerprint",
        "contact_fingerprint"
      ) VALUES (
        resolved_tenant_id,
        resolved_course_run_id,
        CASE resolved_mode
          WHEN 'interest_form' THEN 'interest'
          WHEN 'approval_required' THEN 'application'
          ELSE 'registration_request'
        END,
        CASE resolved_mode
          WHEN 'interest_form' THEN 'new'
          WHEN 'approval_required' THEN 'pending_review'
          ELSE 'pending_registration'
        END,
        request_first_name, request_last_name, request_email, request_phone, request_message,
        privacy_accepted, privacy_notice_version, marketing_consent,
        request_host, request_slug, request_idempotency_key, request_payload_fingerprint,
        request_contact_fingerprint
      ) RETURNING * INTO created_submission;

      RETURN QUERY SELECT created_submission."id", created_submission."submission_kind",
        created_submission."status", false;
    END
    $$;

    REVOKE ALL ON "offer_submissions" FROM PUBLIC;
    REVOKE ALL ON "offer_submissions" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "offer_submissions_id_seq" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON FUNCTION "akademate_next_submit_public_offer"${sql.raw(signature)} FROM PUBLIC;
    GRANT SELECT ON "offer_submissions" TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_submit_public_offer"${sql.raw(signature)}
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
      IF EXISTS (SELECT 1 FROM "offer_submissions") THEN
        RAISE EXCEPTION 'Cannot roll back public offer submissions while submission data exists';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_submit_public_offer"${sql.raw(signature)}
      FROM ${applicationRoleIdentifier};
    REVOKE SELECT ON "offer_submissions" FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_submit_public_offer"${sql.raw(signature)};
    DROP POLICY "offer_submissions_manage_read" ON "offer_submissions";
    DROP POLICY "offer_submissions_tenant_isolation" ON "offer_submissions";
    DROP TABLE "offer_submissions";
  `)
}
