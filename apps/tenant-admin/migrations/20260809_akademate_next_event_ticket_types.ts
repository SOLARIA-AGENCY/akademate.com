import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import {
  assertAkademateNextRuntime,
  resolveNextDatabaseAppRole,
} from '../src/runtime/select-runtime-migrations'

const publicSignature = '(varchar, varchar)'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    CREATE TABLE "event_offer_ticket_types" (
      "id" bigserial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "course_run_id" integer NOT NULL,
      "slug" varchar(120) NOT NULL,
      "name" varchar(120) NOT NULL,
      "description" varchar(500),
      "ticket_kind" varchar DEFAULT 'free' NOT NULL,
      "price_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
      "deposit_amount" numeric(12, 2),
      "capacity" integer,
      "max_per_registration" integer DEFAULT 1 NOT NULL,
      "sales_start" timestamptz,
      "sales_end" timestamptz,
      "sort_order" integer DEFAULT 0 NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "event_offer_ticket_types_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "event_offer_ticket_types_run_fk"
        FOREIGN KEY ("tenant_id", "course_run_id")
        REFERENCES "course_runs"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "event_offer_ticket_types_tenant_id_id_unique"
        UNIQUE ("tenant_id", "id"),
      CONSTRAINT "event_offer_ticket_types_slug_unique"
        UNIQUE ("tenant_id", "course_run_id", "slug"),
      CONSTRAINT "event_offer_ticket_types_slug_check"
        CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND length("slug") BETWEEN 3 AND 120),
      CONSTRAINT "event_offer_ticket_types_name_check"
        CHECK (length(btrim("name")) BETWEEN 1 AND 120),
      CONSTRAINT "event_offer_ticket_types_kind_check"
        CHECK ("ticket_kind" IN ('free', 'paid', 'deposit')),
      CONSTRAINT "event_offer_ticket_types_money_check"
        CHECK (
          ("ticket_kind" = 'free' AND "price_amount" = 0 AND "deposit_amount" IS NULL)
          OR ("ticket_kind" = 'paid' AND "price_amount" > 0 AND "deposit_amount" IS NULL)
          OR (
            "ticket_kind" = 'deposit'
            AND "price_amount" > 0
            AND "deposit_amount" > 0
            AND "deposit_amount" < "price_amount"
          )
        ),
      CONSTRAINT "event_offer_ticket_types_capacity_check"
        CHECK ("capacity" IS NULL OR "capacity" > 0),
      CONSTRAINT "event_offer_ticket_types_max_check"
        CHECK ("max_per_registration" BETWEEN 1 AND 20),
      CONSTRAINT "event_offer_ticket_types_sales_window_check"
        CHECK ("sales_end" IS NULL OR "sales_start" IS NULL OR "sales_end" > "sales_start")
    );

    CREATE INDEX "event_offer_ticket_types_run_order_idx"
      ON "event_offer_ticket_types" ("tenant_id", "course_run_id", "sort_order", "id");
    CREATE INDEX "event_offer_ticket_types_public_idx"
      ON "event_offer_ticket_types" ("tenant_id", "course_run_id", "is_active")
      WHERE "is_active" = true;

    ALTER TABLE "event_offer_ticket_types" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "event_offer_ticket_types" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "event_offer_ticket_types_tenant_isolation"
      ON "event_offer_ticket_types"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);

    CREATE POLICY "event_offer_ticket_types_manager_access"
      ON "event_offer_ticket_types"
      FOR ALL
      USING (
        current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor', 'marketing')
        AND EXISTS (
          SELECT 1
          FROM "course_runs" managed_run
          WHERE managed_run."tenant_id" = "event_offer_ticket_types"."tenant_id"
            AND managed_run."id" = "event_offer_ticket_types"."course_run_id"
            AND managed_run."conversion_mode" IN ('free_registration', 'approval_required', 'paid_registration')
        )
      )
      WITH CHECK (
        current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor', 'marketing')
        AND EXISTS (
          SELECT 1
          FROM "course_runs" managed_run
          WHERE managed_run."tenant_id" = "event_offer_ticket_types"."tenant_id"
            AND managed_run."id" = "event_offer_ticket_types"."course_run_id"
            AND managed_run."conversion_mode" IN ('free_registration', 'approval_required', 'paid_registration')
        )
      );

    CREATE POLICY "event_offer_ticket_types_public_read"
      ON "event_offer_ticket_types"
      FOR SELECT
      USING (
        current_setting('app.role', true) = 'public_offer'
        AND "is_active" = true
        AND EXISTS (
          SELECT 1
          FROM "course_runs" public_run
          WHERE public_run."tenant_id" = "event_offer_ticket_types"."tenant_id"
            AND public_run."id" = "event_offer_ticket_types"."course_run_id"
            AND public_run."share_slug" = current_setting('app.public_offer_slug', true)
            AND public_run."publication_access" IN ('public', 'unlisted')
            AND public_run."status"::text IN ('published', 'enrollment_open')
            AND public_run."conversion_mode" IN ('free_registration', 'approval_required', 'paid_registration')
        )
      );

    REVOKE ALL ON "event_offer_ticket_types" FROM PUBLIC;
    REVOKE ALL ON "event_offer_ticket_types" FROM ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "event_offer_ticket_types_id_seq" FROM PUBLIC;
    REVOKE ALL ON SEQUENCE "event_offer_ticket_types_id_seq" FROM ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "event_offer_ticket_types" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "event_offer_ticket_types_id_seq" TO ${applicationRoleIdentifier};

    CREATE FUNCTION "akademate_next_get_public_offer_ticket_types"(
      request_host varchar,
      request_slug varchar
    ) RETURNS TABLE (
      ticket_id bigint,
      ticket_slug varchar,
      ticket_name varchar,
      ticket_description varchar,
      ticket_kind varchar,
      price_amount numeric,
      deposit_amount numeric,
      capacity integer,
      max_per_registration integer,
      sales_start timestamptz,
      sales_end timestamptz,
      sort_order integer
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

      IF resolved_tenant_id IS NULL THEN RETURN; END IF;

      PERFORM set_config('app.tenant_id', resolved_tenant_id::text, true);
      PERFORM set_config('app.role', 'public_offer', true);
      PERFORM set_config('app.public_offer_slug', request_slug, true);

      RETURN QUERY
      SELECT
        types."id",
        types."slug",
        types."name",
        types."description",
        types."ticket_kind",
        types."price_amount",
        types."deposit_amount",
        types."capacity",
        types."max_per_registration",
        types."sales_start",
        types."sales_end",
        types."sort_order"
      FROM public."event_offer_ticket_types" types
      WHERE types."tenant_id" = resolved_tenant_id
      ORDER BY types."sort_order", types."id";

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

    REVOKE ALL ON FUNCTION "akademate_next_get_public_offer_ticket_types"${sql.raw(publicSignature)} FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_get_public_offer_ticket_types"${sql.raw(publicSignature)}
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
      IF EXISTS (SELECT 1 FROM "event_offer_ticket_types") THEN
        RAISE EXCEPTION 'Cannot roll back event ticket types while ticket configuration exists';
      END IF;
    END
    $$;

    REVOKE ALL ON FUNCTION "akademate_next_get_public_offer_ticket_types"${sql.raw(publicSignature)}
      FROM ${applicationRoleIdentifier};
    DROP FUNCTION "akademate_next_get_public_offer_ticket_types"${sql.raw(publicSignature)};
    DROP TABLE "event_offer_ticket_types";
  `)
}
