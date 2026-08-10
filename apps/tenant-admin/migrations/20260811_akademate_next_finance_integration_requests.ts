import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

import { assertAkademateNextRuntime, resolveNextDatabaseAppRole } from '../src/runtime/select-runtime-migrations'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const role = sql.raw(`"${applicationRole}"`)
  await db.execute(sql`
    CREATE TABLE "finance_integration_requests" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "requester_user_id" integer NOT NULL,
      "provider_name" varchar(160) NOT NULL,
      "provider_website" varchar(1000) NOT NULL,
      "api_documentation_url" varchar(1000),
      "country_code" varchar(2) NOT NULL,
      "currency" varchar(3) NOT NULL,
      "legal_entity_count" integer NOT NULL,
      "campus_count" integer NOT NULL,
      "monthly_transaction_band" varchar(30) NOT NULL,
      "capabilities" jsonb NOT NULL,
      "writeback_requested" boolean DEFAULT false NOT NULL,
      "sandbox_known" varchar(10) NOT NULL,
      "urgency" varchar(20) NOT NULL,
      "context" varchar(4000) NOT NULL,
      "status" varchar(30) DEFAULT 'submitted' NOT NULL,
      "classification" varchar(40),
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_integration_requests_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "finance_integration_requests_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_integration_requests_provider_check" CHECK (length(btrim("provider_name")) BETWEEN 2 AND 160),
      CONSTRAINT "finance_integration_requests_website_check" CHECK ("provider_website" ~ '^https://'),
      CONSTRAINT "finance_integration_requests_country_check" CHECK ("country_code" ~ '^[A-Z]{2}$'),
      CONSTRAINT "finance_integration_requests_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
      CONSTRAINT "finance_integration_requests_count_check" CHECK ("legal_entity_count" > 0 AND "campus_count" > 0),
      CONSTRAINT "finance_integration_requests_band_check" CHECK ("monthly_transaction_band" IN ('under_100', '100_999', '1000_9999', '10000_plus')),
      CONSTRAINT "finance_integration_requests_capabilities_check" CHECK (jsonb_typeof("capabilities") = 'array' AND jsonb_array_length("capabilities") > 0),
      CONSTRAINT "finance_integration_requests_sandbox_check" CHECK ("sandbox_known" IN ('yes', 'no', 'unknown')),
      CONSTRAINT "finance_integration_requests_urgency_check" CHECK ("urgency" IN ('exploring', 'quarter', 'sixty_days', 'thirty_days')),
      CONSTRAINT "finance_integration_requests_status_check" CHECK ("status" IN ('submitted', 'under_review', 'api_validation', 'proposal_pending', 'accepted', 'in_development', 'sandbox_validation', 'available', 'declined', 'cancelled')),
      CONSTRAINT "finance_integration_requests_classification_check" CHECK ("classification" IS NULL OR "classification" IN ('public_api_oauth', 'public_api_token', 'api_discovery_required', 'file_exchange', 'custom_middleware', 'not_feasible')),
      CONSTRAINT "finance_integration_requests_context_check" CHECK (char_length(btrim("context")) BETWEEN 20 AND 4000)
    );

    CREATE TABLE "finance_integration_request_events" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "request_id" uuid NOT NULL,
      "actor_user_id" integer,
      "from_status" varchar(30),
      "to_status" varchar(30) NOT NULL,
      "reason_code" varchar(120),
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_integration_request_events_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "finance_integration_request_events_request_fk" FOREIGN KEY ("tenant_id", "request_id") REFERENCES "finance_integration_requests"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_integration_request_events_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_integration_request_events_to_status_check" CHECK ("to_status" IN ('submitted', 'under_review', 'api_validation', 'proposal_pending', 'accepted', 'in_development', 'sandbox_validation', 'available', 'declined', 'cancelled'))
    );
    CREATE INDEX "finance_integration_requests_tenant_created_idx" ON "finance_integration_requests" ("tenant_id", "created_at" DESC);
    CREATE INDEX "finance_integration_request_events_request_created_idx" ON "finance_integration_request_events" ("tenant_id", "request_id", "created_at" ASC);

    ALTER TABLE "finance_integration_requests" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_integration_requests" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_integration_request_events" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_integration_request_events" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "finance_integration_requests_tenant_isolation" ON "finance_integration_requests" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_integration_request_events_tenant_isolation" ON "finance_integration_request_events" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_integration_requests_manager_access" ON "finance_integration_requests" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_integration_requests_submit_access" ON "finance_integration_requests" FOR INSERT
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_integration_requests_cancel_access" ON "finance_integration_requests" FOR UPDATE
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_integration_request_events_manager_read" ON "finance_integration_request_events" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_integration_request_events_submit_insert" ON "finance_integration_request_events" FOR INSERT
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));

    REVOKE ALL ON "finance_integration_requests", "finance_integration_request_events" FROM PUBLIC;
    REVOKE ALL ON "finance_integration_requests", "finance_integration_request_events" FROM ${role};
    CREATE FUNCTION "akademate_next_cancel_finance_integration_request"(request_id uuid)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = pg_catalog, public
      AS $$
      DECLARE current_status varchar;
      BEGIN
        SELECT status INTO current_status
        FROM public.finance_integration_requests
        WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::integer
          AND id = request_id
        FOR UPDATE;
        IF current_status IS NULL THEN RAISE EXCEPTION 'finance_request_not_found'; END IF;
        IF current_status NOT IN ('submitted', 'under_review', 'proposal_pending') THEN
          RAISE EXCEPTION 'finance_request_cannot_cancel';
        END IF;
        UPDATE public.finance_integration_requests
        SET status = 'cancelled', updated_at = now()
        WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::integer
          AND id = request_id;
        INSERT INTO public.finance_integration_request_events (tenant_id, request_id, actor_user_id, from_status, to_status, reason_code)
        VALUES (
          NULLIF(current_setting('app.tenant_id', true), '')::integer,
          request_id,
          NULLIF(current_setting('app.user_id', true), '')::integer,
          current_status,
          'cancelled',
          'tenant_cancelled'
        );
      END
      $$;
    REVOKE ALL ON FUNCTION "akademate_next_cancel_finance_integration_request"(uuid) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_cancel_finance_integration_request"(uuid) TO ${role};
    GRANT SELECT, INSERT ON "finance_integration_requests" TO ${role};
    GRANT SELECT, INSERT ON "finance_integration_request_events" TO ${role};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const role = sql.raw(`"${applicationRole}"`)
  await db.execute(sql`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM "finance_integration_requests" LIMIT 1) THEN
        RAISE EXCEPTION 'Cannot roll back finance integration requests while data exists';
      END IF;
    END $$;
    REVOKE ALL ON FUNCTION "akademate_next_cancel_finance_integration_request"(uuid) FROM ${role};
    DROP FUNCTION "akademate_next_cancel_finance_integration_request"(uuid);
    REVOKE ALL ON "finance_integration_request_events", "finance_integration_requests" FROM ${role};
    DROP TABLE "finance_integration_request_events";
    DROP TABLE "finance_integration_requests";
  `)
}
