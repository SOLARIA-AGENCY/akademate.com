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
    ALTER TABLE "campuses" ALTER COLUMN "tenant_id" SET NOT NULL;
    ALTER TABLE "campuses"
      ADD CONSTRAINT "campuses_tenant_id_id_unique" UNIQUE ("tenant_id", "id");

    CREATE TABLE "signage_displays" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "site_id" integer NOT NULL,
      "display_key" varchar NOT NULL,
      "name" varchar NOT NULL,
      "status" varchar DEFAULT 'provisioning' NOT NULL,
      "orientation" varchar DEFAULT 'landscape' NOT NULL,
      "resolution_width" integer,
      "resolution_height" integer,
      "provider_key" varchar,
      "provider_display_reference" varchar,
      "last_seen_at" timestamp(3) with time zone,
      "lock_version" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "signage_displays_key_check"
        CHECK ("display_key" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
      CONSTRAINT "signage_displays_name_check"
        CHECK (length(btrim("name")) BETWEEN 1 AND 200),
      CONSTRAINT "signage_displays_status_check"
        CHECK ("status" IN ('provisioning', 'active', 'suspended', 'revoked')),
      CONSTRAINT "signage_displays_orientation_check"
        CHECK ("orientation" IN ('landscape', 'portrait')),
      CONSTRAINT "signage_displays_resolution_check"
        CHECK (
          ("resolution_width" IS NULL AND "resolution_height" IS NULL)
          OR
          ("resolution_width" BETWEEN 1 AND 32768 AND "resolution_height" BETWEEN 1 AND 32768)
        ),
      CONSTRAINT "signage_displays_lock_version_check"
        CHECK ("lock_version" BETWEEN 0 AND 2147483647),
      CONSTRAINT "signage_displays_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "signage_displays_site_fk"
        FOREIGN KEY ("tenant_id", "site_id")
        REFERENCES "campuses"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_displays_scope_unique"
        UNIQUE ("tenant_id", "site_id", "id"),
      CONSTRAINT "signage_displays_key_unique"
        UNIQUE ("tenant_id", "site_id", "display_key")
    );

    CREATE TABLE "signage_playlists" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "site_id" integer NOT NULL,
      "playlist_key" varchar NOT NULL,
      "name" varchar NOT NULL,
      "timezone" varchar NOT NULL,
      "revision" integer DEFAULT 1 NOT NULL,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "created_by_user_id" integer NOT NULL,
      "lock_version" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "signage_playlists_key_check"
        CHECK ("playlist_key" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
      CONSTRAINT "signage_playlists_name_check"
        CHECK (length(btrim("name")) BETWEEN 1 AND 200),
      CONSTRAINT "signage_playlists_timezone_check"
        CHECK (length(btrim("timezone")) BETWEEN 1 AND 100),
      CONSTRAINT "signage_playlists_revision_check"
        CHECK ("revision" BETWEEN 1 AND 2147483647),
      CONSTRAINT "signage_playlists_status_check"
        CHECK ("status" IN ('draft', 'published', 'archived')),
      CONSTRAINT "signage_playlists_lock_version_check"
        CHECK ("lock_version" BETWEEN 0 AND 2147483647),
      CONSTRAINT "signage_playlists_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "signage_playlists_site_fk"
        FOREIGN KEY ("tenant_id", "site_id")
        REFERENCES "campuses"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_playlists_creator_fk"
        FOREIGN KEY ("tenant_id", "created_by_user_id")
        REFERENCES "users"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_playlists_scope_unique"
        UNIQUE ("tenant_id", "site_id", "id"),
      CONSTRAINT "signage_playlists_key_unique"
        UNIQUE ("tenant_id", "site_id", "playlist_key")
    );

    CREATE TABLE "signage_playlist_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "site_id" integer NOT NULL,
      "playlist_id" integer NOT NULL,
      "item_key" varchar NOT NULL,
      "asset_key" varchar NOT NULL,
      "duration_seconds" integer NOT NULL,
      "priority" integer DEFAULT 0 NOT NULL,
      "position" integer NOT NULL,
      "valid_from" timestamp(3) with time zone,
      "valid_until" timestamp(3) with time zone,
      "schedule_days_mask" smallint,
      "start_minute" integer,
      "end_minute" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "signage_playlist_items_key_check"
        CHECK ("item_key" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
      CONSTRAINT "signage_playlist_items_asset_check"
        CHECK ("asset_key" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
      CONSTRAINT "signage_playlist_items_duration_check"
        CHECK ("duration_seconds" BETWEEN 1 AND 86400),
      CONSTRAINT "signage_playlist_items_priority_check"
        CHECK ("priority" BETWEEN -2147483647 AND 2147483647),
      CONSTRAINT "signage_playlist_items_position_check"
        CHECK ("position" BETWEEN 0 AND 2147483647),
      CONSTRAINT "signage_playlist_items_validity_check"
        CHECK ("valid_until" IS NULL OR "valid_from" IS NULL OR "valid_until" > "valid_from"),
      CONSTRAINT "signage_playlist_items_schedule_days_check"
        CHECK ("schedule_days_mask" IS NULL OR "schedule_days_mask" BETWEEN 1 AND 127),
      CONSTRAINT "signage_playlist_items_schedule_window_check"
        CHECK (
          ("start_minute" IS NULL AND "end_minute" IS NULL)
          OR (
            "start_minute" BETWEEN 0 AND 1439
            AND "end_minute" BETWEEN 0 AND 1439
            AND "start_minute" <> "end_minute"
          )
        ),
      CONSTRAINT "signage_playlist_items_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "signage_playlist_items_site_fk"
        FOREIGN KEY ("tenant_id", "site_id")
        REFERENCES "campuses"("tenant_id", "id") ON DELETE cascade,
      CONSTRAINT "signage_playlist_items_playlist_fk"
        FOREIGN KEY ("tenant_id", "site_id", "playlist_id")
        REFERENCES "signage_playlists"("tenant_id", "site_id", "id") ON DELETE cascade,
      CONSTRAINT "signage_playlist_items_scope_unique"
        UNIQUE ("tenant_id", "site_id", "id"),
      CONSTRAINT "signage_playlist_items_key_unique"
        UNIQUE ("tenant_id", "site_id", "playlist_id", "item_key")
    );

    CREATE TABLE "signage_publications" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "site_id" integer NOT NULL,
      "display_id" integer NOT NULL,
      "playlist_id" integer NOT NULL,
      "playlist_revision" integer NOT NULL,
      "publication_key" varchar NOT NULL,
      "manifest_url" varchar NOT NULL,
      "manifest_digest" varchar NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "status" varchar DEFAULT 'queued' NOT NULL,
      "provider_reference" varchar,
      "failure_reason" varchar,
      "retry_after_seconds" integer,
      "revoked_at" timestamp(3) with time zone,
      "created_by_user_id" integer NOT NULL,
      "lock_version" integer DEFAULT 0 NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "signage_publications_key_check"
        CHECK ("publication_key" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
      CONSTRAINT "signage_publications_revision_check"
        CHECK ("playlist_revision" BETWEEN 1 AND 2147483647),
      CONSTRAINT "signage_publications_url_check"
        CHECK ("manifest_url" ~ '^https://[^[:space:]#]+$'),
      CONSTRAINT "signage_publications_digest_check"
        CHECK ("manifest_digest" ~ '^sha256:[a-f0-9]{64}$'),
      CONSTRAINT "signage_publications_expiry_check"
        CHECK ("expires_at" > "created_at"),
      CONSTRAINT "signage_publications_status_check"
        CHECK ("status" IN ('queued', 'accepted', 'rejected', 'unavailable', 'revoked')),
      CONSTRAINT "signage_publications_retry_check"
        CHECK ("retry_after_seconds" IS NULL OR "retry_after_seconds" BETWEEN 0 AND 2147483647),
      CONSTRAINT "signage_publications_lock_version_check"
        CHECK ("lock_version" BETWEEN 0 AND 2147483647),
      CONSTRAINT "signage_publications_state_fields_check"
        CHECK (
          ("status" = 'queued' AND "provider_reference" IS NULL AND "failure_reason" IS NULL AND "retry_after_seconds" IS NULL AND "revoked_at" IS NULL)
          OR ("status" = 'accepted' AND "provider_reference" IS NOT NULL AND length(btrim("provider_reference")) > 0 AND "failure_reason" IS NULL AND "retry_after_seconds" IS NULL AND "revoked_at" IS NULL)
          OR ("status" = 'rejected' AND "provider_reference" IS NULL AND "failure_reason" IS NOT NULL AND length(btrim("failure_reason")) > 0 AND "retry_after_seconds" IS NULL AND "revoked_at" IS NULL)
          OR ("status" = 'unavailable' AND "provider_reference" IS NULL AND "failure_reason" IS NULL AND "revoked_at" IS NULL)
          OR ("status" = 'revoked' AND "revoked_at" IS NOT NULL AND "retry_after_seconds" IS NULL)
        ),
      CONSTRAINT "signage_publications_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "signage_publications_site_fk"
        FOREIGN KEY ("tenant_id", "site_id")
        REFERENCES "campuses"("tenant_id", "id") ON DELETE cascade,
      CONSTRAINT "signage_publications_display_fk"
        FOREIGN KEY ("tenant_id", "site_id", "display_id")
        REFERENCES "signage_displays"("tenant_id", "site_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_publications_playlist_fk"
        FOREIGN KEY ("tenant_id", "site_id", "playlist_id")
        REFERENCES "signage_playlists"("tenant_id", "site_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_publications_creator_fk"
        FOREIGN KEY ("tenant_id", "created_by_user_id")
        REFERENCES "users"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_publications_scope_unique"
        UNIQUE ("tenant_id", "site_id", "id"),
      CONSTRAINT "signage_publications_idempotency_unique"
        UNIQUE ("tenant_id", "site_id", "display_id", "publication_key")
    );

    CREATE TABLE "signage_device_principals" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "site_id" integer NOT NULL,
      "display_id" integer NOT NULL,
      "credential_key" varchar NOT NULL,
      "credential_version" integer NOT NULL,
      "secret_hash" char(64) NOT NULL,
      "secret_hint" char(8) NOT NULL,
      "status" varchar DEFAULT 'active' NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "last_used_at" timestamp(3) with time zone,
      "revoked_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "signage_device_principals_key_check"
        CHECK ("credential_key" ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
      CONSTRAINT "signage_device_principals_version_check"
        CHECK ("credential_version" BETWEEN 1 AND 2147483647),
      CONSTRAINT "signage_device_principals_hash_check"
        CHECK ("secret_hash" ~ '^[a-f0-9]{64}$'),
      CONSTRAINT "signage_device_principals_hint_check"
        CHECK ("secret_hint" ~ '^[A-Za-z0-9_-]{8}$'),
      CONSTRAINT "signage_device_principals_status_check"
        CHECK ("status" IN ('active', 'revoked')),
      CONSTRAINT "signage_device_principals_revoked_check"
        CHECK (("status" = 'revoked') = ("revoked_at" IS NOT NULL)),
      CONSTRAINT "signage_device_principals_expiry_check"
        CHECK ("expires_at" > "created_at"),
      CONSTRAINT "signage_device_principals_tenant_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade,
      CONSTRAINT "signage_device_principals_site_fk"
        FOREIGN KEY ("tenant_id", "site_id")
        REFERENCES "campuses"("tenant_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_device_principals_display_fk"
        FOREIGN KEY ("tenant_id", "site_id", "display_id")
        REFERENCES "signage_displays"("tenant_id", "site_id", "id") ON DELETE restrict,
      CONSTRAINT "signage_device_principals_scope_unique"
        UNIQUE ("tenant_id", "site_id", "id"),
      CONSTRAINT "signage_device_principals_key_unique"
        UNIQUE ("tenant_id", "site_id", "credential_key"),
      CONSTRAINT "signage_device_principals_version_unique"
        UNIQUE ("tenant_id", "site_id", "display_id", "credential_version")
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signage_displays_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signage_playlists_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signage_playlist_items_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signage_publications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "signage_device_principals_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "pld_rels_signage_displays_fk"
      FOREIGN KEY ("signage_displays_id") REFERENCES "signage_displays"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "pld_rels_signage_playlists_fk"
      FOREIGN KEY ("signage_playlists_id") REFERENCES "signage_playlists"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "pld_rels_signage_playlist_items_fk"
      FOREIGN KEY ("signage_playlist_items_id") REFERENCES "signage_playlist_items"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "pld_rels_signage_publications_fk"
      FOREIGN KEY ("signage_publications_id") REFERENCES "signage_publications"("id") ON DELETE cascade;
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "pld_rels_signage_device_principals_fk"
      FOREIGN KEY ("signage_device_principals_id") REFERENCES "signage_device_principals"("id") ON DELETE cascade;

    CREATE INDEX "signage_displays_status_idx"
      ON "signage_displays" ("tenant_id", "site_id", "status", "name");
    CREATE INDEX "signage_playlists_status_idx"
      ON "signage_playlists" ("tenant_id", "site_id", "status", "updated_at" DESC);
    CREATE INDEX "signage_playlist_items_order_idx"
      ON "signage_playlist_items" ("tenant_id", "site_id", "playlist_id", "priority" DESC, "position", "item_key");
    CREATE INDEX "signage_publications_display_status_idx"
      ON "signage_publications" ("tenant_id", "site_id", "display_id", "status", "created_at" DESC);
    CREATE UNIQUE INDEX "signage_publications_one_accepted_per_display"
      ON "signage_publications" ("tenant_id", "site_id", "display_id")
      WHERE "status" = 'accepted';
    CREATE INDEX "signage_device_principals_display_status_idx"
      ON "signage_device_principals" ("tenant_id", "site_id", "display_id", "status", "credential_version" DESC);
    CREATE UNIQUE INDEX "signage_device_principals_one_active_per_display"
      ON "signage_device_principals" ("tenant_id", "site_id", "display_id")
      WHERE "status" = 'active';
    CREATE INDEX "pld_rels_signage_displays_idx" ON "payload_locked_documents_rels" ("signage_displays_id");
    CREATE INDEX "pld_rels_signage_playlists_idx" ON "payload_locked_documents_rels" ("signage_playlists_id");
    CREATE INDEX "pld_rels_signage_playlist_items_idx" ON "payload_locked_documents_rels" ("signage_playlist_items_id");
    CREATE INDEX "pld_rels_signage_publications_idx" ON "payload_locked_documents_rels" ("signage_publications_id");
    CREATE INDEX "pld_rels_signage_device_principals_idx" ON "payload_locked_documents_rels" ("signage_device_principals_id");

    CREATE FUNCTION "akademate_next_current_site_id"() RETURNS integer
      LANGUAGE sql STABLE
      AS $$
        SELECT CASE
          WHEN pg_input_is_valid(current_setting('app.site_id', true), 'integer')
          THEN CASE
            WHEN CAST(current_setting('app.site_id', true) AS integer) > 0
            THEN CAST(current_setting('app.site_id', true) AS integer)
            ELSE NULL
          END
          ELSE NULL
        END
      $$;

    CREATE FUNCTION "akademate_next_can_manage_signage"() RETURNS boolean
      LANGUAGE sql STABLE
      AS $$
        SELECT COALESCE(current_setting('app.role', true), '') IN ('admin', 'gestor')
      $$;

    CREATE FUNCTION "akademate_next_guard_signage_publication_update"() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF OLD."tenant_id" IS DISTINCT FROM NEW."tenant_id"
          OR OLD."site_id" IS DISTINCT FROM NEW."site_id"
          OR OLD."display_id" IS DISTINCT FROM NEW."display_id"
          OR OLD."playlist_id" IS DISTINCT FROM NEW."playlist_id"
          OR OLD."playlist_revision" IS DISTINCT FROM NEW."playlist_revision"
          OR OLD."publication_key" IS DISTINCT FROM NEW."publication_key"
          OR OLD."manifest_url" IS DISTINCT FROM NEW."manifest_url"
          OR OLD."manifest_digest" IS DISTINCT FROM NEW."manifest_digest"
          OR OLD."expires_at" IS DISTINCT FROM NEW."expires_at"
          OR OLD."created_by_user_id" IS DISTINCT FROM NEW."created_by_user_id"
          OR OLD."created_at" IS DISTINCT FROM NEW."created_at"
        THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Signage publication snapshot fields are immutable';
        END IF;
        IF OLD."status" = 'revoked' AND NEW IS DISTINCT FROM OLD THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Signage publication revocation is terminal';
        END IF;
        IF OLD."status" IN ('accepted', 'rejected') THEN
          IF NEW."status" = OLD."status" AND NEW IS DISTINCT FROM OLD THEN
            RAISE EXCEPTION USING
              ERRCODE = 'P0001',
              MESSAGE = 'Terminal signage publication state is immutable';
          ELSIF NEW."status" NOT IN (OLD."status", 'revoked') THEN
            RAISE EXCEPTION USING
              ERRCODE = 'P0001',
              MESSAGE = 'Terminal signage publication state can only be revoked';
          END IF;
        ELSIF OLD."status" = 'queued'
          AND NEW."status" NOT IN ('queued', 'accepted', 'rejected', 'unavailable', 'revoked')
        THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Invalid queued signage publication transition';
        ELSIF OLD."status" = 'unavailable'
          AND NEW."status" NOT IN ('unavailable', 'queued', 'accepted', 'rejected', 'revoked')
        THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Invalid unavailable signage publication transition';
        END IF;
        RETURN NEW;
      END
      $$;

    CREATE FUNCTION "akademate_next_guard_signage_principal_update"() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF OLD."tenant_id" IS DISTINCT FROM NEW."tenant_id"
          OR OLD."site_id" IS DISTINCT FROM NEW."site_id"
          OR OLD."display_id" IS DISTINCT FROM NEW."display_id"
          OR OLD."credential_key" IS DISTINCT FROM NEW."credential_key"
          OR OLD."credential_version" IS DISTINCT FROM NEW."credential_version"
          OR OLD."secret_hash" IS DISTINCT FROM NEW."secret_hash"
          OR OLD."secret_hint" IS DISTINCT FROM NEW."secret_hint"
          OR OLD."created_at" IS DISTINCT FROM NEW."created_at"
        THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Signage device principal identity fields are immutable';
        END IF;
        IF OLD."status" = 'revoked' AND NEW IS DISTINCT FROM OLD THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Signage device principal revocation is terminal';
        END IF;
        IF OLD."status" = 'active' AND NEW."status" NOT IN ('active', 'revoked') THEN
          RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'Invalid signage device principal transition';
        END IF;
        RETURN NEW;
      END
      $$;

    CREATE TRIGGER "signage_publications_immutable_snapshot"
      BEFORE UPDATE ON "signage_publications"
      FOR EACH ROW EXECUTE FUNCTION "akademate_next_guard_signage_publication_update"();
    CREATE TRIGGER "signage_device_principals_immutable_identity"
      BEFORE UPDATE ON "signage_device_principals"
      FOR EACH ROW EXECUTE FUNCTION "akademate_next_guard_signage_principal_update"();

    REVOKE ALL ON FUNCTION "akademate_next_current_site_id"() FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_can_manage_signage"() FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_guard_signage_publication_update"() FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_guard_signage_principal_update"() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION "akademate_next_current_site_id"() TO ${applicationRoleIdentifier};
    GRANT EXECUTE ON FUNCTION "akademate_next_can_manage_signage"() TO ${applicationRoleIdentifier};

    ALTER TABLE "campuses" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "campuses" FORCE ROW LEVEL SECURITY;
    CREATE POLICY "campuses_tenant_isolation" ON "campuses"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id());
    CREATE POLICY "campuses_manage" ON "campuses"
      FOR ALL USING (akademate_next_can_manage_signage())
      WITH CHECK (akademate_next_can_manage_signage());

    ALTER TABLE "signage_displays" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "signage_displays" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "signage_playlists" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "signage_playlists" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "signage_playlist_items" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "signage_playlist_items" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "signage_publications" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "signage_publications" FORCE ROW LEVEL SECURITY;
    ALTER TABLE "signage_device_principals" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "signage_device_principals" FORCE ROW LEVEL SECURITY;

    CREATE POLICY "signage_displays_tenant_site_isolation" ON "signage_displays"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id());
    CREATE POLICY "signage_displays_manage" ON "signage_displays"
      FOR ALL USING (akademate_next_can_manage_signage())
      WITH CHECK (akademate_next_can_manage_signage());

    CREATE POLICY "signage_playlists_tenant_site_isolation" ON "signage_playlists"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id());
    CREATE POLICY "signage_playlists_manage" ON "signage_playlists"
      FOR ALL USING (akademate_next_can_manage_signage())
      WITH CHECK (akademate_next_can_manage_signage());

    CREATE POLICY "signage_playlist_items_tenant_site_isolation" ON "signage_playlist_items"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id());
    CREATE POLICY "signage_playlist_items_manage" ON "signage_playlist_items"
      FOR ALL USING (akademate_next_can_manage_signage())
      WITH CHECK (akademate_next_can_manage_signage());

    CREATE POLICY "signage_publications_tenant_site_isolation" ON "signage_publications"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id());
    CREATE POLICY "signage_publications_manage" ON "signage_publications"
      FOR ALL USING (akademate_next_can_manage_signage())
      WITH CHECK (akademate_next_can_manage_signage());

    CREATE POLICY "signage_device_principals_tenant_site_isolation" ON "signage_device_principals"
      AS RESTRICTIVE FOR ALL
      USING ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id())
      WITH CHECK ("tenant_id" = akademate_next_current_tenant_id() AND "site_id" = akademate_next_current_site_id());
    CREATE POLICY "signage_device_principals_manage" ON "signage_device_principals"
      FOR ALL USING (akademate_next_can_manage_signage())
      WITH CHECK (akademate_next_can_manage_signage());

    REVOKE ALL ON "campuses" FROM PUBLIC;
    REVOKE ALL ON "signage_displays" FROM PUBLIC;
    REVOKE ALL ON "signage_playlists" FROM PUBLIC;
    REVOKE ALL ON "signage_playlist_items" FROM PUBLIC;
    REVOKE ALL ON "signage_publications" FROM PUBLIC;
    REVOKE ALL ON "signage_device_principals" FROM PUBLIC;
    REVOKE ALL ON "signage_device_principals" FROM ${applicationRoleIdentifier};

    GRANT SELECT, INSERT, UPDATE, DELETE ON "campuses" TO ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "signage_displays" TO ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "signage_playlists" TO ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "signage_playlist_items" TO ${applicationRoleIdentifier};
    GRANT SELECT, INSERT, UPDATE, DELETE ON "signage_publications" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "signage_displays_id_seq" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "signage_playlists_id_seq" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "signage_playlist_items_id_seq" TO ${applicationRoleIdentifier};
    GRANT USAGE, SELECT ON SEQUENCE "signage_publications_id_seq" TO ${applicationRoleIdentifier};
    REVOKE ALL ON SEQUENCE "signage_device_principals_id_seq" FROM ${applicationRoleIdentifier};
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  assertAkademateNextRuntime(process.env.AKADEMATE_RUNTIME)
  const applicationRole = resolveNextDatabaseAppRole(process.env.AKADEMATE_NEXT_DB_APP_USER)
  const applicationRoleIdentifier = sql.raw(`"${applicationRole}"`)

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM "signage_device_principals")
        OR EXISTS (SELECT 1 FROM "signage_publications")
        OR EXISTS (SELECT 1 FROM "signage_playlist_items")
        OR EXISTS (SELECT 1 FROM "signage_playlists")
        OR EXISTS (SELECT 1 FROM "signage_displays")
      THEN
        RAISE EXCEPTION 'Cannot roll back Akademate Next signage: operational data exists';
      END IF;
    END
    $$;

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "signage_device_principals_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "signage_publications_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "signage_playlist_items_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "signage_playlists_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "signage_displays_id";

    DROP TABLE "signage_device_principals";
    DROP TABLE "signage_publications";
    DROP TABLE "signage_playlist_items";
    DROP TABLE "signage_playlists";
    DROP TABLE "signage_displays";

    DROP POLICY "campuses_manage" ON "campuses";
    DROP POLICY "campuses_tenant_isolation" ON "campuses";
    REVOKE SELECT, INSERT, UPDATE, DELETE ON "campuses" FROM ${applicationRoleIdentifier};
    ALTER TABLE "campuses" NO FORCE ROW LEVEL SECURITY;
    ALTER TABLE "campuses" DISABLE ROW LEVEL SECURITY;

    REVOKE ALL ON FUNCTION "akademate_next_can_manage_signage"() FROM PUBLIC;
    REVOKE ALL ON FUNCTION "akademate_next_current_site_id"() FROM PUBLIC;
    DROP FUNCTION "akademate_next_can_manage_signage"();
    DROP FUNCTION "akademate_next_current_site_id"();
    DROP FUNCTION "akademate_next_guard_signage_principal_update"();
    DROP FUNCTION "akademate_next_guard_signage_publication_update"();

    ALTER TABLE "campuses" DROP CONSTRAINT "campuses_tenant_id_id_unique";
    ALTER TABLE "campuses" ALTER COLUMN "tenant_id" DROP NOT NULL;
  `)
}
