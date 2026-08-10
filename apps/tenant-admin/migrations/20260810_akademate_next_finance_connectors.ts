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
    CREATE UNIQUE INDEX IF NOT EXISTS "paid_offer_payment_events_tenant_id_unique"
      ON "paid_offer_payment_events" ("tenant_id", "id");

    CREATE TABLE "finance_entities" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "slug" varchar(120) NOT NULL,
      "display_name" varchar(240) NOT NULL,
      "country_code" varchar(2),
      "currency" varchar(3) DEFAULT 'EUR' NOT NULL,
      "created_by" integer,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_entities_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "finance_entities_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_entities_slug_unique" UNIQUE ("tenant_id", "slug"),
      CONSTRAINT "finance_entities_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
      CONSTRAINT "finance_entities_name_check" CHECK (length(btrim("display_name")) BETWEEN 1 AND 240),
      CONSTRAINT "finance_entities_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$'),
      CONSTRAINT "finance_entities_country_check" CHECK ("country_code" IS NULL OR "country_code" ~ '^[A-Z]{2}$')
    );

    CREATE TABLE "finance_connections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "finance_entity_id" uuid NOT NULL,
      "provider" varchar(40) NOT NULL,
      "mode" varchar(20) DEFAULT 'scaffold' NOT NULL,
      "status" varchar(20) DEFAULT 'pending' NOT NULL,
      "external_organization_id" varchar(240),
      "external_organization_name" varchar(240),
      "last_health_check_at" timestamptz,
      "last_error_code" varchar(120),
      "created_by" integer,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_connections_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "finance_connections_entity_fk" FOREIGN KEY ("tenant_id", "finance_entity_id") REFERENCES "finance_entities"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_connections_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_connections_provider_check" CHECK ("provider" IN ('holded', 'xero', 'quickbooks')),
      CONSTRAINT "finance_connections_mode_check" CHECK ("mode" IN ('scaffold', 'read_only', 'read_write')),
      CONSTRAINT "finance_connections_status_check" CHECK ("status" IN ('pending', 'connected', 'degraded', 'revoked', 'disconnected'))
    );
    CREATE UNIQUE INDEX "finance_connections_active_provider_unique"
      ON "finance_connections" ("tenant_id", "finance_entity_id", "provider")
      WHERE "status" IN ('pending', 'connected', 'degraded');

    CREATE TABLE "finance_connection_credentials" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "purpose" varchar(40) NOT NULL,
      "key_version" integer NOT NULL,
      "ciphertext" text NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      "rotated_at" timestamptz,
      CONSTRAINT "finance_credentials_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_credentials_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_credentials_purpose_check" CHECK ("purpose" IN ('api_key', 'oauth_state', 'oauth_verifier', 'refresh_token', 'webhook_secret')),
      CONSTRAINT "finance_credentials_key_version_check" CHECK ("key_version" > 0),
      CONSTRAINT "finance_credentials_ciphertext_check" CHECK (length("ciphertext") > 20),
      CONSTRAINT "finance_credentials_unique_purpose" UNIQUE ("tenant_id", "connection_id", "purpose")
    );

    CREATE TABLE "finance_oauth_attempts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid,
      "actor_user_id" integer NOT NULL,
      "provider" varchar(40) NOT NULL,
      "state_digest" varchar(64) NOT NULL,
      "redirect_uri" varchar(1000) NOT NULL,
      "requested_scopes" jsonb NOT NULL,
      "expires_at" timestamptz NOT NULL,
      "consumed_at" timestamptz,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_oauth_attempts_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "finance_oauth_attempts_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_oauth_attempts_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_oauth_attempts_provider_check" CHECK ("provider" IN ('xero', 'quickbooks')),
      CONSTRAINT "finance_oauth_attempts_state_digest_check" CHECK ("state_digest" ~ '^[0-9a-f]{64}$'),
      CONSTRAINT "finance_oauth_attempts_redirect_check" CHECK (length("redirect_uri") BETWEEN 1 AND 1000),
      CONSTRAINT "finance_oauth_attempts_scopes_array_check" CHECK (jsonb_typeof("requested_scopes") = 'array'),
      CONSTRAINT "finance_oauth_attempts_state_unique" UNIQUE ("state_digest")
    );

    CREATE TABLE "finance_connection_candidates" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "external_organization_id" varchar(240) NOT NULL,
      "external_organization_name" varchar(240) NOT NULL,
      "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "selected_at" timestamptz,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_candidates_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_candidates_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_candidates_org_unique" UNIQUE ("tenant_id", "connection_id", "external_organization_id")
    );

    CREATE TABLE "finance_mappings" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "mapping_kind" varchar(80) NOT NULL,
      "internal_key" varchar(240) NOT NULL,
      "external_key" varchar(240) NOT NULL,
      "retired_at" timestamptz,
      "created_by" integer,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_mappings_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_mappings_tenant_id_unique" UNIQUE ("tenant_id", "id")
    );
    CREATE UNIQUE INDEX "finance_mappings_active_unique"
      ON "finance_mappings" ("tenant_id", "connection_id", "mapping_kind", "internal_key")
      WHERE "retired_at" IS NULL;

    CREATE TABLE "finance_sync_cursors" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "provider_resource" varchar(120) NOT NULL,
      "cursor_value" varchar(1000),
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_cursors_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_cursors_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_cursors_resource_unique" UNIQUE ("tenant_id", "connection_id", "provider_resource")
    );

    CREATE TABLE "finance_sync_runs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "provider_resource" varchar(120) NOT NULL,
      "status" varchar(20) DEFAULT 'queued' NOT NULL,
      "requested_by" integer,
      "worker_id" varchar(120),
      "lease_until" timestamptz,
      "attempt_count" integer DEFAULT 0 NOT NULL,
      "next_attempt_at" timestamptz,
      "started_at" timestamptz,
      "finished_at" timestamptz,
      "error_code" varchar(120),
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_sync_runs_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_sync_runs_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_sync_runs_status_check" CHECK ("status" IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
      CONSTRAINT "finance_sync_runs_attempt_check" CHECK ("attempt_count" >= 0)
    );

    CREATE TABLE "finance_sync_items" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "sync_run_id" uuid NOT NULL,
      "provider_resource" varchar(120) NOT NULL,
      "external_id" varchar(240) NOT NULL,
      "external_version" varchar(240),
      "outcome" varchar(20) NOT NULL,
      "redacted_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "error_code" varchar(120),
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_sync_items_run_fk" FOREIGN KEY ("tenant_id", "sync_run_id") REFERENCES "finance_sync_runs"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_sync_items_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_sync_items_outcome_check" CHECK ("outcome" IN ('created', 'updated', 'unchanged', 'rejected', 'failed'))
    );

    CREATE TABLE "finance_external_objects" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "provider_resource" varchar(120) NOT NULL,
      "external_id" varchar(240) NOT NULL,
      "external_version" varchar(240),
      "redacted_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "first_seen_at" timestamptz DEFAULT now() NOT NULL,
      "last_seen_at" timestamptz DEFAULT now() NOT NULL,
      "supersedes_id" uuid,
      CONSTRAINT "finance_external_objects_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_external_objects_supersedes_fk" FOREIGN KEY ("tenant_id", "supersedes_id") REFERENCES "finance_external_objects"("tenant_id", "id") ON DELETE SET NULL,
      CONSTRAINT "finance_external_objects_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_external_objects_current_unique" UNIQUE ("tenant_id", "connection_id", "provider_resource", "external_id"),
      CONSTRAINT "finance_external_objects_version_unique" UNIQUE ("tenant_id", "connection_id", "provider_resource", "external_id", "external_version")
    );

    CREATE TABLE "finance_webhook_events" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid NOT NULL,
      "provider_event_id" varchar(240) NOT NULL,
      "payload_digest" varchar(64) NOT NULL,
      "signature_valid" boolean NOT NULL,
      "processed_at" timestamptz,
      "redacted_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_webhook_events_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE CASCADE,
      CONSTRAINT "finance_webhook_events_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_webhook_events_provider_unique" UNIQUE ("tenant_id", "connection_id", "provider_event_id"),
      CONSTRAINT "finance_webhook_events_digest_check" CHECK ("payload_digest" ~ '^[0-9a-f]{64}$')
    );

    CREATE TABLE "finance_audit_events" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "connection_id" uuid,
      "actor_user_id" integer,
      "event_kind" varchar(100) NOT NULL,
      "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "supersedes_id" uuid,
      "created_at" timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT "finance_audit_events_tenant_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
      CONSTRAINT "finance_audit_events_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE SET NULL,
      CONSTRAINT "finance_audit_events_supersedes_fk" FOREIGN KEY ("tenant_id", "supersedes_id") REFERENCES "finance_audit_events"("tenant_id", "id") ON DELETE SET NULL,
      CONSTRAINT "finance_audit_events_tenant_id_unique" UNIQUE ("tenant_id", "id")
    );

    CREATE TABLE "finance_payment_projections" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "tenant_id" integer NOT NULL,
      "payment_event_id" bigint NOT NULL,
      "connection_id" uuid,
      "provider" varchar(40) NOT NULL,
      "external_payment_id" varchar(240),
      "status" varchar(20) NOT NULL,
      "amount_cents" integer NOT NULL,
      "currency" varchar(3) NOT NULL,
      "projected_at" timestamptz DEFAULT now() NOT NULL,
      "supersedes_id" uuid,
      CONSTRAINT "finance_payment_projection_event_fk" FOREIGN KEY ("tenant_id", "payment_event_id") REFERENCES "paid_offer_payment_events"("tenant_id", "id") ON DELETE RESTRICT,
      CONSTRAINT "finance_payment_projection_connection_fk" FOREIGN KEY ("tenant_id", "connection_id") REFERENCES "finance_connections"("tenant_id", "id") ON DELETE SET NULL,
      CONSTRAINT "finance_payment_projection_supersedes_fk" FOREIGN KEY ("tenant_id", "supersedes_id") REFERENCES "finance_payment_projections"("tenant_id", "id") ON DELETE SET NULL,
      CONSTRAINT "finance_payment_projection_tenant_id_unique" UNIQUE ("tenant_id", "id"),
      CONSTRAINT "finance_payment_projection_event_unique" UNIQUE ("tenant_id", "payment_event_id"),
      CONSTRAINT "finance_payment_projection_status_check" CHECK ("status" IN ('processing', 'succeeded', 'failed', 'cancelled', 'requires_review')),
      CONSTRAINT "finance_payment_projection_money_check" CHECK ("amount_cents" >= 0 AND "currency" ~ '^[A-Z]{3}$')
    );

    CREATE INDEX "finance_connections_tenant_status_idx" ON "finance_connections" ("tenant_id", "status");
    CREATE INDEX "finance_sync_runs_connection_created_idx" ON "finance_sync_runs" ("tenant_id", "connection_id", "created_at" DESC);
    CREATE INDEX "finance_audit_events_tenant_created_idx" ON "finance_audit_events" ("tenant_id", "created_at" DESC);
    CREATE INDEX "finance_external_objects_connection_resource_idx" ON "finance_external_objects" ("tenant_id", "connection_id", "provider_resource");

    ALTER TABLE "finance_entities" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_connections" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_connection_credentials" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_oauth_attempts" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_connection_candidates" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_mappings" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_sync_cursors" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_sync_runs" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_sync_items" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_external_objects" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_webhook_events" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_audit_events" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "finance_payment_projections" ENABLE ROW LEVEL SECURITY;

    ALTER TABLE "finance_entities" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_connections" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_connection_credentials" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_oauth_attempts" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_connection_candidates" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_mappings" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_sync_cursors" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_sync_runs" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_sync_items" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_external_objects" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_webhook_events" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_audit_events" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "finance_payment_projections" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "finance_entities_tenant_isolation" ON "finance_entities" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_connections_tenant_isolation" ON "finance_connections" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_credentials_tenant_isolation" ON "finance_connection_credentials" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_oauth_attempts_tenant_isolation" ON "finance_oauth_attempts" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_candidates_tenant_isolation" ON "finance_connection_candidates" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_mappings_tenant_isolation" ON "finance_mappings" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_cursors_tenant_isolation" ON "finance_sync_cursors" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_runs_tenant_isolation" ON "finance_sync_runs" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_items_tenant_isolation" ON "finance_sync_items" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_external_objects_tenant_isolation" ON "finance_external_objects" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_webhook_events_tenant_isolation" ON "finance_webhook_events" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_audit_events_tenant_isolation" ON "finance_audit_events" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);
    CREATE POLICY "finance_payment_projection_tenant_isolation" ON "finance_payment_projections" AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer)
      WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::integer);

    CREATE POLICY "finance_entities_manager_access" ON "finance_entities" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_connections_manager_access" ON "finance_connections" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_credentials_manager_access" ON "finance_connection_credentials" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_credentials_insert_access" ON "finance_connection_credentials" FOR INSERT
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_credentials_delete_access" ON "finance_connection_credentials" FOR DELETE
      USING (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_oauth_manager_access" ON "finance_oauth_attempts" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_candidates_manager_access" ON "finance_connection_candidates" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_mappings_manager_access" ON "finance_mappings" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_sync_manager_access" ON "finance_sync_cursors" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_runs_manager_access" ON "finance_sync_runs" FOR ALL
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'))
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin'));
    CREATE POLICY "finance_items_manager_read" ON "finance_sync_items" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_external_objects_manager_read" ON "finance_external_objects" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_webhook_events_manager_read" ON "finance_webhook_events" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_audit_manager_read" ON "finance_audit_events" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_audit_manager_insert" ON "finance_audit_events" FOR INSERT
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_projection_manager_read" ON "finance_payment_projections" FOR SELECT
      USING (current_setting('app.role', true) IN ('superadmin', 'admin', 'gestor'));
    CREATE POLICY "finance_projection_manager_insert" ON "finance_payment_projections" FOR INSERT
      WITH CHECK (current_setting('app.role', true) IN ('superadmin', 'admin'));

    REVOKE ALL ON "finance_entities", "finance_connections", "finance_connection_credentials", "finance_oauth_attempts", "finance_connection_candidates", "finance_mappings", "finance_sync_cursors", "finance_sync_runs", "finance_sync_items", "finance_external_objects", "finance_webhook_events", "finance_audit_events", "finance_payment_projections" FROM PUBLIC;
    REVOKE ALL ON "finance_entities", "finance_connections", "finance_connection_credentials", "finance_oauth_attempts", "finance_connection_candidates", "finance_mappings", "finance_sync_cursors", "finance_sync_runs", "finance_sync_items", "finance_external_objects", "finance_webhook_events", "finance_audit_events", "finance_payment_projections" FROM ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "finance_entities", "finance_connections", "finance_connection_credentials", "finance_oauth_attempts", "finance_connection_candidates", "finance_mappings", "finance_sync_cursors", "finance_sync_runs" TO ${applicationRoleIdentifier};
    GRANT SELECT, INSERT ON "finance_sync_items", "finance_external_objects", "finance_webhook_events", "finance_audit_events", "finance_payment_projections" TO ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "finance_connections" LIMIT 1)
        OR EXISTS (SELECT 1 FROM "finance_payment_projections" LIMIT 1)
      THEN
        RAISE EXCEPTION 'Cannot roll back finance connectors while data exists';
      END IF;
    END
    $$;
    REVOKE ALL ON "finance_entities", "finance_connections", "finance_connection_credentials", "finance_oauth_attempts", "finance_connection_candidates", "finance_mappings", "finance_sync_cursors", "finance_sync_runs", "finance_sync_items", "finance_external_objects", "finance_webhook_events", "finance_audit_events", "finance_payment_projections" FROM ${applicationRoleIdentifier};
    DROP TABLE "finance_payment_projections";
    DROP TABLE "finance_audit_events";
    DROP TABLE "finance_webhook_events";
    DROP TABLE "finance_external_objects";
    DROP TABLE "finance_sync_items";
    DROP TABLE "finance_sync_runs";
    DROP TABLE "finance_sync_cursors";
    DROP TABLE "finance_mappings";
    DROP TABLE "finance_connection_candidates";
    DROP TABLE "finance_oauth_attempts";
    DROP TABLE "finance_connection_credentials";
    DROP TABLE "finance_connections";
    DROP TABLE "finance_entities";
    DROP INDEX "paid_offer_payment_events_tenant_id_unique";
  `)
}
