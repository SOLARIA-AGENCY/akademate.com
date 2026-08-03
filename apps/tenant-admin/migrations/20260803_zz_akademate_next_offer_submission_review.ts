import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const reviewSignature = '(bigint, varchar, varchar)'

// The zz segment keeps filesystem migration discovery after the public submission ledger.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "offer_submissions"
      ADD CONSTRAINT "offer_submissions_tenant_id_id_unique" UNIQUE ("tenant_id", "id");
    ALTER TABLE "offer_submissions" DROP CONSTRAINT "offer_submissions_status_check";
    ALTER TABLE "offer_submissions" ADD CONSTRAINT "offer_submissions_status_check"
      CHECK ("status" IN (
        'new', 'pending_review', 'pending_registration', 'approved', 'rejected', 'archived'
      ));

    CREATE FUNCTION "akademate_next_can_review_offer_submissions"() RETURNS boolean
      LANGUAGE sql STABLE
      AS $$
        SELECT COALESCE(current_setting('app.role', true), '')
          IN ('superadmin', 'admin', 'gestor')
      $$;

    CREATE POLICY "offer_submissions_review_update" ON "offer_submissions"
      FOR UPDATE
      USING (akademate_next_can_review_offer_submissions())
      WITH CHECK (akademate_next_can_review_offer_submissions());

    CREATE TABLE "offer_submission_review_events" (
      "id" bigserial PRIMARY KEY,
      "tenant_id" integer NOT NULL,
      "submission_id" bigint NOT NULL,
      "actor_user_id" integer NOT NULL,
      "from_status" varchar NOT NULL,
      "to_status" varchar NOT NULL,
      "note" varchar,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "offer_submission_review_events_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "offer_submission_review_events_submission_fk"
        FOREIGN KEY ("tenant_id", "submission_id")
        REFERENCES "offer_submissions"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "offer_submission_review_events_actor_fk"
        FOREIGN KEY ("tenant_id", "actor_user_id")
        REFERENCES "users"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "offer_submission_review_events_from_status_check"
        CHECK ("from_status" IN (
          'new', 'pending_review', 'pending_registration', 'approved', 'rejected', 'archived'
        )),
      CONSTRAINT "offer_submission_review_events_to_status_check"
        CHECK ("to_status" IN ('pending_review', 'approved', 'rejected', 'archived')),
      CONSTRAINT "offer_submission_review_events_note_check"
        CHECK ("note" IS NULL OR char_length("note") BETWEEN 1 AND 500)
    );

    CREATE INDEX "offer_submission_review_events_submission_idx"
      ON "offer_submission_review_events" ("tenant_id", "submission_id", "created_at" DESC);

    ALTER TABLE "offer_submission_review_events" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "offer_submission_review_events" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "offer_submission_review_events_tenant_isolation"
      ON "offer_submission_review_events"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "offer_submission_review_events_read"
      ON "offer_submission_review_events"
      FOR SELECT USING (akademate_next_can_review_offer_submissions());
    CREATE POLICY "offer_submission_review_events_insert"
      ON "offer_submission_review_events"
      FOR INSERT WITH CHECK (akademate_next_can_review_offer_submissions());

    CREATE FUNCTION "akademate_next_review_offer_submission"(
      requested_submission_id bigint,
      requested_status varchar,
      requested_note varchar
    ) RETURNS TABLE (
      submission_id bigint,
      previous_status varchar,
      submission_status varchar,
      changed boolean,
      decided_at timestamptz
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      resolved_tenant_id integer := NULLIF(current_setting('app.tenant_id', true), '')::integer;
      resolved_actor_user_id integer := NULLIF(current_setting('app.user_id', true), '')::integer;
      normalized_note varchar := NULLIF(btrim(requested_note), '');
      current_submission public.offer_submissions%ROWTYPE;
      event_timestamp timestamptz := clock_timestamp();
    BEGIN
      IF resolved_tenant_id IS NULL OR resolved_actor_user_id IS NULL
        OR NOT public.akademate_next_can_review_offer_submissions()
      THEN
        RAISE EXCEPTION 'offer_submission_review_forbidden';
      END IF;
      IF requested_status NOT IN ('pending_review', 'approved', 'rejected', 'archived') THEN
        RAISE EXCEPTION 'offer_submission_transition_invalid';
      END IF;
      IF requested_note IS NOT NULL AND (
        char_length(requested_note) > 500 OR requested_note ~ '[[:cntrl:]]'
      ) THEN
        RAISE EXCEPTION 'offer_submission_note_invalid';
      END IF;
      IF requested_status = 'rejected' AND normalized_note IS NULL THEN
        RAISE EXCEPTION 'offer_submission_rejection_note_required';
      END IF;

      SELECT * INTO current_submission
      FROM public."offer_submissions" os
      WHERE os."tenant_id" = resolved_tenant_id
        AND os."id" = requested_submission_id
      FOR UPDATE;

      IF current_submission."id" IS NULL THEN
        RAISE EXCEPTION 'offer_submission_not_found';
      END IF;
      IF current_submission.status = requested_status THEN
        RETURN QUERY SELECT current_submission.id, current_submission.status,
          current_submission.status, false, current_submission.updated_at;
        RETURN;
      END IF;
      IF NOT (
        (current_submission.status IN ('new', 'pending_registration')
          AND requested_status IN ('pending_review', 'approved', 'rejected', 'archived'))
        OR (current_submission.status = 'pending_review'
          AND requested_status IN ('approved', 'rejected', 'archived'))
        OR (current_submission.status IN ('approved', 'rejected', 'archived')
          AND requested_status = 'pending_review')
      ) THEN
        RAISE EXCEPTION 'offer_submission_transition_invalid';
      END IF;

      UPDATE public."offer_submissions"
      SET "status" = requested_status, "updated_at" = event_timestamp
      WHERE "tenant_id" = resolved_tenant_id AND "id" = current_submission.id;

      INSERT INTO public."offer_submission_review_events" (
        "tenant_id", "submission_id", "actor_user_id", "from_status", "to_status", "note", "created_at"
      ) VALUES (
        resolved_tenant_id, current_submission.id, resolved_actor_user_id,
        current_submission.status, requested_status, normalized_note, event_timestamp
      );

      RETURN QUERY SELECT current_submission.id, current_submission.status,
        requested_status, true, event_timestamp;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_can_review_offer_submissions"() FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_review_offer_submission"${sql.raw(reviewSignature)} FROM PUBLIC;
    REVOKE ALL ON "offer_submission_review_events" FROM PUBLIC;
    REVOKE ALL ON "offer_submission_review_events" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "offer_submission_review_events_id_seq" FROM ${applicationRoleIdentifier};

    GRANT EXECUTE ON FUNCTION "akademate_next_can_review_offer_submissions"()
      TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_review_offer_submission"${sql.raw(reviewSignature)}
      TO ${applicationRoleIdentifier};
    GRANT SELECT ON "offer_submission_review_events" TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "offer_submission_review_events")
        OR EXISTS (
          SELECT 1 FROM "offer_submissions"
          WHERE "status" IN ('approved', 'rejected', 'archived')
        )
      THEN
        RAISE EXCEPTION 'Cannot roll back offer submission review while review events exist';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_review_offer_submission"${sql.raw(reviewSignature)}
      FROM ${applicationRoleIdentifier};
    REVOKE ALL ON FUNCTION "akademate_next_can_review_offer_submissions"()
      FROM ${applicationRoleIdentifier};
    REVOKE SELECT ON "offer_submission_review_events" FROM ${applicationRoleIdentifier};

    DROP FUNCTION "akademate_next_review_offer_submission"${sql.raw(reviewSignature)};
    DROP POLICY "offer_submission_review_events_insert" ON "offer_submission_review_events";
    DROP POLICY "offer_submission_review_events_read" ON "offer_submission_review_events";
    DROP POLICY "offer_submission_review_events_tenant_isolation" ON "offer_submission_review_events";
    DROP TABLE "offer_submission_review_events";
    DROP POLICY "offer_submissions_review_update" ON "offer_submissions";
    DROP FUNCTION "akademate_next_can_review_offer_submissions"();

    ALTER TABLE "offer_submissions" DROP CONSTRAINT "offer_submissions_status_check";
    ALTER TABLE "offer_submissions" ADD CONSTRAINT "offer_submissions_status_check"
      CHECK ("status" IN ('new', 'pending_review', 'pending_registration'));
    ALTER TABLE "offer_submissions" DROP CONSTRAINT "offer_submissions_tenant_id_id_unique";
  `)
}
