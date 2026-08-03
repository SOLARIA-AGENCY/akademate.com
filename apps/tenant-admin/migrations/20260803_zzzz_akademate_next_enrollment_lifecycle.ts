import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const cancellationSignature = '(bigint, varchar, varchar)'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    ALTER TABLE "enrollments"
      ADD CONSTRAINT "enrollments_tenant_id_id_unique" UNIQUE ("tenant_id", "id");

    CREATE TABLE "enrollment_lifecycle_events" (
      "id" bigserial PRIMARY KEY,
      "tenant_id" integer NOT NULL,
      "enrollment_id" integer NOT NULL,
      "action" varchar(24) NOT NULL,
      "reason" varchar(500) NOT NULL,
      "actor_user_id" integer NOT NULL,
      "related_enrollment_id" integer,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "enrollment_lifecycle_events_action_check"
        CHECK ("action" IN ('cancelled', 'withdrawn', 'promoted')),
      CONSTRAINT "enrollment_lifecycle_events_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "enrollment_lifecycle_events_enrollment_fk"
        FOREIGN KEY ("tenant_id", "enrollment_id")
        REFERENCES "enrollments"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "enrollment_lifecycle_events_related_enrollment_fk"
        FOREIGN KEY ("tenant_id", "related_enrollment_id")
        REFERENCES "enrollments"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "enrollment_lifecycle_events_actor_fk"
        FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
      CONSTRAINT "enrollment_lifecycle_events_single_transition_unique"
        UNIQUE ("enrollment_id", "action")
    );

    CREATE INDEX "enrollment_lifecycle_events_tenant_created_idx"
      ON "enrollment_lifecycle_events" ("tenant_id", "created_at" DESC, "id" DESC);

    ALTER TABLE "enrollment_lifecycle_events" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "enrollment_lifecycle_events" FORCE ROW LEVEL SECURITY;
    CREATE POLICY "enrollment_lifecycle_events_tenant_isolation" ON "enrollment_lifecycle_events"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "enrollment_lifecycle_events_reviewer_read" ON "enrollment_lifecycle_events"
      FOR SELECT USING (COALESCE(current_setting('app.role', true), '') IN (
        'superadmin', 'admin', 'gestor'
      ));
    CREATE POLICY "enrollment_lifecycle_events_reviewer_insert" ON "enrollment_lifecycle_events"
      FOR INSERT WITH CHECK (COALESCE(current_setting('app.role', true), '') IN (
        'superadmin', 'admin', 'gestor'
      ));
    CREATE POLICY "enrollments_reviewer_update" ON "enrollments"
      FOR UPDATE
      USING (COALESCE(current_setting('app.role', true), '') IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (COALESCE(current_setting('app.role', true), '') IN ('superadmin', 'admin', 'gestor'));

    CREATE FUNCTION "akademate_next_cancel_enrollment"(
      requested_enrollment_id bigint,
      requested_action varchar,
      requested_reason varchar
    ) RETURNS TABLE (
      enrollment_id integer,
      enrollment_status varchar,
      promoted_enrollment_id integer,
      replayed boolean,
      capacity_released boolean,
      financial_follow_up_required boolean
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      resolved_tenant_id integer := NULLIF(current_setting('app.tenant_id', true), '')::integer;
      resolved_actor_user_id integer := NULLIF(current_setting('app.user_id', true), '')::integer;
      current_enrollment public.enrollments%ROWTYPE;
      current_run public.course_runs%ROWTYPE;
      promoted_enrollment public.enrollments%ROWTYPE;
      existing_event public.enrollment_lifecycle_events%ROWTYPE;
      event_timestamp timestamptz := clock_timestamp();
      released_capacity boolean := false;
      needs_financial_follow_up boolean := false;
    BEGIN
      IF resolved_tenant_id IS NULL OR resolved_actor_user_id IS NULL
        OR COALESCE(current_setting('app.role', true), '') NOT IN ('superadmin', 'admin', 'gestor')
      THEN
        RAISE EXCEPTION 'enrollment_cancellation_forbidden';
      END IF;
      IF requested_action NOT IN ('cancelled', 'withdrawn')
        OR requested_reason IS NULL
        OR char_length(btrim(requested_reason)) NOT BETWEEN 3 AND 500
      THEN
        RAISE EXCEPTION 'enrollment_cancellation_request_invalid';
      END IF;

      SELECT * INTO current_enrollment
      FROM public."enrollments" enrollment
      WHERE enrollment."tenant_id" = resolved_tenant_id
        AND enrollment."id" = requested_enrollment_id
      FOR UPDATE;

      IF current_enrollment."id" IS NULL THEN
        RAISE EXCEPTION 'enrollment_not_found';
      END IF;

      SELECT * INTO existing_event
      FROM public."enrollment_lifecycle_events" event
      WHERE event."tenant_id" = resolved_tenant_id
        AND event."enrollment_id" = current_enrollment."id"
        AND event."action" = requested_action;

      needs_financial_follow_up := current_enrollment."amount_paid" > 0
        OR current_enrollment."payment_status"::text IN ('partial', 'paid');

      IF current_enrollment."status"::text = requested_action
        AND existing_event."id" IS NOT NULL
      THEN
        RETURN QUERY SELECT current_enrollment."id", current_enrollment."status"::varchar,
          existing_event."related_enrollment_id", true,
          existing_event."related_enrollment_id" IS NOT NULL,
          needs_financial_follow_up;
        RETURN;
      END IF;

      IF current_enrollment."status"::text NOT IN ('pending', 'confirmed', 'waitlisted') THEN
        RAISE EXCEPTION 'enrollment_cancellation_not_available';
      END IF;

      SELECT * INTO current_run
      FROM public."course_runs" run
      WHERE run."tenant_id" = resolved_tenant_id
        AND run."id" = current_enrollment."course_run_id"
      FOR UPDATE;

      IF current_run."id" IS NULL THEN
        RAISE EXCEPTION 'enrollment_not_found';
      END IF;
      IF current_enrollment."status" = 'confirmed' AND current_run."current_enrollments" <= 0 THEN
        RAISE EXCEPTION 'enrollment_capacity_inconsistent';
      END IF;

      UPDATE public."enrollments"
      SET "status" = requested_action::public.enum_enrollments_status,
          "cancellation_reason" = btrim(requested_reason),
          "cancelled_at" = COALESCE("cancelled_at", event_timestamp),
          "updated_at" = event_timestamp
      WHERE "tenant_id" = resolved_tenant_id AND "id" = current_enrollment."id";

      IF current_enrollment."status" = 'confirmed' THEN
        UPDATE public."course_runs"
        SET "current_enrollments" = "current_enrollments" - 1,
            "updated_at" = event_timestamp
        WHERE "tenant_id" = resolved_tenant_id AND "id" = current_run."id";
        released_capacity := true;

        SELECT * INTO promoted_enrollment
        FROM public."enrollments" candidate
        WHERE candidate."tenant_id" = resolved_tenant_id
          AND candidate."course_run_id" = current_run."id"
          AND candidate."status" = 'waitlisted'
        ORDER BY candidate."enrolled_at" ASC NULLS LAST, candidate."id" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;

        IF promoted_enrollment."id" IS NOT NULL THEN
          UPDATE public."enrollments"
          SET "status" = 'confirmed',
              "confirmed_at" = COALESCE("confirmed_at", event_timestamp),
              "updated_at" = event_timestamp
          WHERE "tenant_id" = resolved_tenant_id AND "id" = promoted_enrollment."id";

          UPDATE public."course_runs"
          SET "current_enrollments" = "current_enrollments" + 1,
              "updated_at" = event_timestamp
          WHERE "tenant_id" = resolved_tenant_id AND "id" = current_run."id";

          INSERT INTO public."enrollment_lifecycle_events" (
            "tenant_id", "enrollment_id", "action", "reason", "actor_user_id",
            "related_enrollment_id", "created_at"
          ) VALUES (
            resolved_tenant_id, promoted_enrollment."id", 'promoted',
            'Promoción automática tras liberarse una plaza', resolved_actor_user_id,
            current_enrollment."id", event_timestamp
          );
        END IF;
      END IF;

      INSERT INTO public."enrollment_lifecycle_events" (
        "tenant_id", "enrollment_id", "action", "reason", "actor_user_id",
        "related_enrollment_id", "created_at"
      ) VALUES (
        resolved_tenant_id, current_enrollment."id", requested_action,
        btrim(requested_reason), resolved_actor_user_id, promoted_enrollment."id", event_timestamp
      );

      RETURN QUERY SELECT current_enrollment."id", requested_action,
        promoted_enrollment."id", false, released_capacity, needs_financial_follow_up;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_cancel_enrollment"${sql.raw(cancellationSignature)} FROM PUBLIC;
    REVOKE ALL ON "enrollment_lifecycle_events" FROM PUBLIC;
    REVOKE ALL ON "enrollment_lifecycle_events" FROM ${applicationRoleIdentifier};
    GRANT SELECT ON "enrollment_lifecycle_events" TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_cancel_enrollment"${sql.raw(cancellationSignature)}
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
      IF EXISTS (SELECT 1 FROM "enrollment_lifecycle_events") THEN
        RAISE EXCEPTION 'Cannot roll back enrollment lifecycle while lifecycle events exist';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_cancel_enrollment"${sql.raw(cancellationSignature)}
      FROM ${applicationRoleIdentifier};
    REVOKE SELECT ON "enrollment_lifecycle_events" FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_cancel_enrollment"${sql.raw(cancellationSignature)};
    DROP POLICY "enrollments_reviewer_update" ON "enrollments";
    DROP POLICY "enrollment_lifecycle_events_reviewer_insert" ON "enrollment_lifecycle_events";
    DROP POLICY "enrollment_lifecycle_events_reviewer_read" ON "enrollment_lifecycle_events";
    DROP POLICY "enrollment_lifecycle_events_tenant_isolation" ON "enrollment_lifecycle_events";
    ALTER TABLE "enrollment_lifecycle_events" NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE "enrollment_lifecycle_events" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "enrollment_lifecycle_events";
    ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_tenant_id_id_unique";
  `)
}
