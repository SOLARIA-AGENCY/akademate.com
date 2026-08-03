import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const signature = '(varchar, varchar)'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    CREATE FUNCTION "akademate_next_get_public_offer"(
      request_host varchar,
      request_slug varchar
    ) RETURNS TABLE (
      tenant_slug varchar,
      tenant_name varchar,
      tenant_domain varchar,
      tenant_logo_url varchar,
      tenant_primary_color varchar,
      tenant_contact_email varchar,
      course_run_id integer,
      course_id integer,
      course_name varchar,
      short_description varchar,
      modality varchar,
      duration_hours numeric,
      course_image_url varchar,
      code varchar,
      starts_at timestamptz,
      ends_at timestamptz,
      enrollment_deadline timestamptz,
      schedule_time_start varchar,
      schedule_time_end varchar,
      max_students numeric,
      current_enrollments numeric,
      campus_name varchar,
      campus_city varchar,
      campus_address varchar,
      publication_access varchar,
      conversion_mode varchar,
      share_slug varchar,
      form_template_key varchar,
      external_action_url varchar,
      payment_plan varchar,
      offer_price_amount numeric,
      deposit_amount numeric,
      cta_label varchar,
      capacity_policy varchar
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, public
    AS $$
    DECLARE
      resolved_tenant_id integer;
      previous_tenant text := current_setting('app.tenant_id', true);
      previous_role text := current_setting('app.role', true);
      previous_slug text := current_setting('app.public_offer_slug', true);
    BEGIN
      SELECT t."id" INTO resolved_tenant_id
      FROM public."tenants" t
      WHERE t."active" = true
        AND (
          lower(t."domain") = lower(request_host)
          OR lower(request_host) = lower(t."slug") || '.akademate.com'
          OR lower(request_host) = lower(t."slug") || '.akademate.io'
          OR lower(request_host) = lower(t."slug") || '.localhost'
        )
      LIMIT 1;

      IF resolved_tenant_id IS NULL THEN
        RETURN;
      END IF;

      PERFORM set_config('app.tenant_id', resolved_tenant_id::text, true);
      PERFORM set_config('app.role', 'public_offer', true);
      PERFORM set_config('app.public_offer_slug', request_slug, true);

      RETURN QUERY
      SELECT
        t."slug"::varchar,
        t."name"::varchar,
        t."domain"::varchar,
        COALESCE(logo."sizes_card_url", logo."url", CASE
          WHEN logo."filename" IS NOT NULL THEN '/media/' || logo."filename"
          ELSE NULL
        END)::varchar,
        t."branding_primary_color"::varchar,
        t."contact_email"::varchar,
        cr."id"::integer,
        c."id"::integer,
        c."name"::varchar,
        c."short_description"::varchar,
        c."modality"::varchar,
        c."duration_hours"::numeric,
        COALESCE(image."sizes_hero_url", image."url", CASE
          WHEN image."filename" IS NOT NULL THEN '/media/' || image."filename"
          ELSE NULL
        END)::varchar,
        cr."codigo"::varchar,
        cr."start_date"::timestamptz,
        cr."end_date"::timestamptz,
        cr."enrollment_deadline"::timestamptz,
        cr."schedule_time_start"::varchar,
        cr."schedule_time_end"::varchar,
        cr."max_students"::numeric,
        cr."current_enrollments"::numeric,
        campus."name"::varchar,
        campus."city"::varchar,
        campus."address"::varchar,
        cr."publication_access"::varchar,
        cr."conversion_mode"::varchar,
        cr."share_slug"::varchar,
        cr."form_template_key"::varchar,
        cr."external_action_url"::varchar,
        cr."payment_plan"::varchar,
        cr."offer_price_amount"::numeric,
        cr."deposit_amount"::numeric,
        cr."cta_label"::varchar,
        cr."capacity_policy"::varchar
      FROM public."tenants" t
      JOIN public."course_runs" cr
        ON cr."tenant_id" = t."id"
      JOIN public."courses" c
        ON c."id" = cr."course_id"
       AND c."tenant_id" = t."id"
      LEFT JOIN public."campuses" campus
        ON campus."id" = cr."campus_id"
       AND campus."tenant_id" = t."id"
      LEFT JOIN public."media" image ON image."id" = c."featured_image_id"
      LEFT JOIN public."media" logo ON logo."id" = t."branding_logo_id"
      WHERE t."id" = resolved_tenant_id
        AND t."active" = true
        AND c."active" = true
        AND cr."share_slug" = request_slug
        AND cr."publication_access" IN ('public', 'unlisted')
        AND cr."status"::text IN ('published', 'enrollment_open')
      LIMIT 1;

      PERFORM set_config('app.tenant_id', COALESCE(previous_tenant, ''), true);
      PERFORM set_config('app.role', COALESCE(previous_role, ''), true);
      PERFORM set_config('app.public_offer_slug', COALESCE(previous_slug, ''), true);
    EXCEPTION WHEN OTHERS THEN
      PERFORM set_config('app.tenant_id', COALESCE(previous_tenant, ''), true);
      PERFORM set_config('app.role', COALESCE(previous_role, ''), true);
      PERFORM set_config('app.public_offer_slug', COALESCE(previous_slug, ''), true);
      RAISE;
    END
    $$;

    CREATE POLICY "courses_public_offer_read" ON "courses"
      FOR SELECT USING (
        current_setting('app.role', true) = 'public_offer'
        AND "active" = true
        AND EXISTS (
          SELECT 1 FROM "course_runs" public_run
          WHERE public_run."course_id" = "courses"."id"
            AND public_run."tenant_id" = "courses"."tenant_id"
            AND public_run."share_slug" = current_setting('app.public_offer_slug', true)
            AND public_run."publication_access" IN ('public', 'unlisted')
            AND public_run."status"::text IN ('published', 'enrollment_open')
        )
      );
    CREATE POLICY "course_runs_public_offer_read" ON "course_runs"
      FOR SELECT USING (
        current_setting('app.role', true) = 'public_offer'
        AND "share_slug" = current_setting('app.public_offer_slug', true)
        AND "publication_access" IN ('public', 'unlisted')
        AND "status"::text IN ('published', 'enrollment_open')
      );
    CREATE POLICY "campuses_public_offer_read" ON "campuses"
      FOR SELECT USING (
        current_setting('app.role', true) = 'public_offer'
        AND EXISTS (
          SELECT 1 FROM "course_runs" public_run
          WHERE public_run."campus_id" = "campuses"."id"
            AND public_run."tenant_id" = "campuses"."tenant_id"
            AND public_run."share_slug" = current_setting('app.public_offer_slug', true)
            AND public_run."publication_access" IN ('public', 'unlisted')
            AND public_run."status"::text IN ('published', 'enrollment_open')
        )
      );

    REVOKE ALL ON FUNCTION "akademate_next_get_public_offer"(varchar, varchar) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_get_public_offer"(varchar, varchar)
      TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  await db.execute(sql.raw(`
    DROP POLICY "campuses_public_offer_read" ON "campuses";
    DROP POLICY "course_runs_public_offer_read" ON "course_runs";
    DROP POLICY "courses_public_offer_read" ON "courses";
    DROP FUNCTION "akademate_next_get_public_offer"${signature};
  `))
}
