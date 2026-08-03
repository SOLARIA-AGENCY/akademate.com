import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    CREATE FUNCTION "akademate_next_get_dashboard"() RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $$
      DECLARE
        resolved_tenant_id integer;
        resolved_role varchar;
      BEGIN
        resolved_tenant_id := NULLIF(current_setting('app.tenant_id', true), '')::integer;
        resolved_role := COALESCE(current_setting('app.role', true), '');

        IF resolved_tenant_id IS NULL OR resolved_role NOT IN (
          'superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura'
        ) THEN
          RAISE EXCEPTION 'akademate_next_dashboard_forbidden';
        END IF;

        RETURN jsonb_build_object(
          'generatedAt', to_char(clock_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'metrics', jsonb_build_object(
            'courses', (SELECT count(*)::integer FROM "courses" c
              WHERE c."tenant_id" = resolved_tenant_id AND c."active" = true),
            'activeStudents', (SELECT count(*)::integer FROM "students" s
              WHERE s."tenant_id" = resolved_tenant_id AND s."status"::text = 'active'),
            'activeTeachers', (SELECT count(*)::integer FROM "staff" staff
              WHERE staff."tenant_id" = resolved_tenant_id
                AND staff."staff_type"::text = 'profesor' AND staff."is_active" = true),
            'campuses', (SELECT count(*)::integer FROM "campuses" campus
              WHERE campus."tenant_id" = resolved_tenant_id),
            'activeCourseRuns', (SELECT count(*)::integer FROM "course_runs" cr
              WHERE cr."tenant_id" = resolved_tenant_id
                AND cr."status"::text IN ('published', 'enrollment_open', 'enrollment_closed', 'in_progress')),
            'confirmedEnrollments', (SELECT count(*)::integer FROM "enrollments" enrollment
              WHERE enrollment."tenant_id" = resolved_tenant_id
                AND enrollment."status"::text IN ('confirmed', 'completed')),
            'pendingRequests', (SELECT count(*)::integer FROM "offer_submissions" os
              WHERE os."tenant_id" = resolved_tenant_id
                AND os."status" IN ('new', 'pending_review', 'pending_registration'))
          ),
          'attention', jsonb_build_object(
            'pendingReview', (SELECT count(*)::integer FROM "offer_submissions" os
              WHERE os."tenant_id" = resolved_tenant_id AND os."status" = 'pending_review'),
            'waitlisted', (SELECT count(*)::integer FROM "enrollments" enrollment
              WHERE enrollment."tenant_id" = resolved_tenant_id
                AND enrollment."status"::text = 'waitlisted'),
            'paymentReview', (SELECT count(*)::integer FROM "paid_offer_orders" po
              WHERE po."tenant_id" = resolved_tenant_id AND po."status" = 'requires_review')
          ),
          'upcomingRuns', COALESCE((
            SELECT jsonb_agg(run_item.item ORDER BY run_item.starts_at, run_item.id)
            FROM (
              SELECT cr."id" AS id, cr."start_date" AS starts_at, jsonb_build_object(
                'id', cr."id",
                'courseName', c."name",
                'code', cr."codigo",
                'status', cr."status"::text,
                'startsAt', to_char(cr."start_date" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                'availablePlaces', CASE
                  WHEN cr."capacity_policy"::text = 'unlimited' THEN NULL
                  ELSE greatest(
                    cr."max_students" - cr."current_enrollments" - cr."current_checkout_holds",
                    0
                  )::integer
                END
              ) AS item
              FROM "course_runs" cr
              INNER JOIN "courses" c
                ON c."id" = cr."course_id" AND c."tenant_id" = cr."tenant_id"
              WHERE cr."tenant_id" = resolved_tenant_id
                AND cr."status"::text IN ('published', 'enrollment_open', 'enrollment_closed', 'in_progress')
                AND cr."end_date" >= now()
              ORDER BY cr."start_date", cr."id"
              LIMIT 5
            ) run_item
          ), '[]'::jsonb),
          'recentActivity', COALESCE((
            SELECT jsonb_agg(activity.item ORDER BY activity.occurred_at DESC, activity.id DESC)
            FROM (
              SELECT os."id" AS id, os."created_at" AS occurred_at, jsonb_build_object(
                'id', 'submission-' || os."id"::text,
                'kind', os."submission_kind",
                'title', CASE os."submission_kind"
                  WHEN 'application' THEN 'Nueva solicitud recibida'
                  WHEN 'registration_request' THEN 'Nueva petición de matrícula'
                  ELSE 'Nueva consulta sobre un curso'
                END,
                'detail', c."name",
                'occurredAt', to_char(os."created_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
                'href', '/dashboard/cursos/solicitudes'
              ) AS item
              FROM "offer_submissions" os
              INNER JOIN "course_runs" cr
                ON cr."id" = os."course_run_id" AND cr."tenant_id" = os."tenant_id"
              INNER JOIN "courses" c
                ON c."id" = cr."course_id" AND c."tenant_id" = os."tenant_id"
              WHERE os."tenant_id" = resolved_tenant_id
              ORDER BY os."created_at" DESC, os."id" DESC
              LIMIT 5
            ) activity
          ), '[]'::jsonb)
        );
      END
      $$;

    REVOKE ALL ON FUNCTION "akademate_next_get_dashboard"() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_get_dashboard"()
      TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    REVOKE ALL ON FUNCTION "akademate_next_get_dashboard"() FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_get_dashboard"();
  `)
}
