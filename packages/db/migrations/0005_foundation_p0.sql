-- Foundation P0 expand migration.
-- Backward compatible. No DROP. No rename. Safe to re-run.

DO $$ BEGIN
  CREATE TYPE "deployment_mode" AS ENUM ('managed_cloud', 'dedicated_cloud', 'on_premise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "organization_model" AS ENUM ('single_tenant', 'multi_location', 'multi_tenant_group', 'franchise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "actor_type" AS ENUM ('human', 'ai_agent', 'service', 'device');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "location_kind" AS ENUM ('physical', 'virtual', 'mobile');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "campus_kind" AS ENUM ('physical', 'virtual', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "policy_kind" AS ENUM (
    'attendance', 'cancellation', 'access', 'payment', 'ai', 'privacy', 'campus_adoption', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "capability_source" AS ENUM ('blueprint', 'plan', 'override');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "organization_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "organization_groups_slug_unique" UNIQUE ("slug")
);

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "organization_group_id" uuid;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "blueprint_key" text DEFAULT 'professional_training' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "blueprint_version" integer DEFAULT 1 NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "parent_blueprint_key" text;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "organization_model" "organization_model" DEFAULT 'single_tenant' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deployment_mode" "deployment_mode" DEFAULT 'managed_cloud' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "region_id" text DEFAULT 'eu' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "cell_id" text DEFAULT 'eu-01' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deployment_id" text DEFAULT 'eu-01' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "timezone" text DEFAULT 'Europe/Madrid' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "locale" text DEFAULT 'es-ES' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'EUR' NOT NULL;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "config" jsonb DEFAULT '{}'::jsonb NOT NULL;

DO $$ BEGIN
  ALTER TABLE "tenants"
    ADD CONSTRAINT "tenants_organization_group_id_organization_groups_id_fk"
    FOREIGN KEY ("organization_group_id") REFERENCES "organization_groups"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "given_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "family_name" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "locale" text DEFAULT 'es-ES';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "timezone" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;

DO $$ BEGIN
  ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_user_tenant_unique" UNIQUE ("user_id", "tenant_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "organization_group_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_group_id" uuid NOT NULL REFERENCES "organization_groups"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "org_group_memberships_group_user_unique" UNIQUE ("organization_group_id", "user_id")
);

ALTER TABLE "feature_flags" ADD COLUMN IF NOT EXISTS "purpose" text DEFAULT 'rollout' NOT NULL;

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "organization_group_id" uuid;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_type" "actor_type" DEFAULT 'human' NOT NULL;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "purpose" text;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "correlation_id" uuid;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "channel" text;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "policy_decision" text;

DO $$ BEGIN
  ALTER TABLE "audit_logs"
    ADD CONSTRAINT "audit_logs_organization_group_id_organization_groups_id_fk"
    FOREIGN KEY ("organization_group_id") REFERENCES "organization_groups"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "centers" ADD COLUMN IF NOT EXISTS "location_kind" "location_kind" DEFAULT 'physical' NOT NULL;
ALTER TABLE "centers" ADD COLUMN IF NOT EXISTS "timezone" text;
ALTER TABLE "centers" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "legal_entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "legal_name" text NOT NULL,
  "tax_id" text,
  "tax_id_type" text,
  "jurisdiction" text DEFAULT 'ES' NOT NULL,
  "address" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "tax_profile" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_primary" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "legal_entities_tenant_id_unique" UNIQUE ("tenant_id")
);

CREATE TABLE IF NOT EXISTS "campuses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "kind" "campus_kind" DEFAULT 'hybrid' NOT NULL,
  "location_id" uuid REFERENCES "centers"("id") ON DELETE SET NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "campuses_tenant_slug_unique" UNIQUE ("tenant_id", "slug")
);

CREATE TABLE IF NOT EXISTS "blueprints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "base_blueprint_key" text,
  "version" integer DEFAULT 1 NOT NULL,
  "default_capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "vocabulary_pack" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "blueprints_key_version_unique" UNIQUE ("key", "version")
);

CREATE TABLE IF NOT EXISTS "capabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "description" text NOT NULL,
  "category" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "capabilities_key_unique" UNIQUE ("key")
);

CREATE TABLE IF NOT EXISTS "tenant_capabilities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "capability_key" text NOT NULL,
  "enabled" boolean NOT NULL,
  "source" "capability_source" DEFAULT 'override' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tenant_capabilities_tenant_key_unique" UNIQUE ("tenant_id", "capability_key")
);

CREATE TABLE IF NOT EXISTS "policies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid REFERENCES "tenants"("id") ON DELETE CASCADE,
  "organization_group_id" uuid REFERENCES "organization_groups"("id") ON DELETE CASCADE,
  "kind" "policy_kind" NOT NULL,
  "key" text NOT NULL,
  "document" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "tenants_organization_group_id_idx" ON "tenants" ("organization_group_id");
CREATE INDEX IF NOT EXISTS "tenants_region_cell_idx" ON "tenants" ("region_id", "cell_id");
CREATE INDEX IF NOT EXISTS "audit_logs_correlation_id_idx" ON "audit_logs" ("correlation_id");
CREATE INDEX IF NOT EXISTS "campuses_tenant_id_idx" ON "campuses" ("tenant_id");
CREATE INDEX IF NOT EXISTS "legal_entities_tenant_id_idx" ON "legal_entities" ("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_capabilities_tenant_id_idx" ON "tenant_capabilities" ("tenant_id");

INSERT INTO "organization_groups" ("id", "name", "slug", "status")
SELECT gen_random_uuid(), t."name", t."slug", 'active'
FROM "tenants" t
WHERE t."organization_group_id" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "organization_groups" g WHERE g."slug" = t."slug")
ON CONFLICT ("slug") DO NOTHING;

UPDATE "tenants" t
SET "organization_group_id" = g."id"
FROM "organization_groups" g
WHERE t."slug" = g."slug"
  AND t."organization_group_id" IS NULL;

INSERT INTO "legal_entities" ("tenant_id", "legal_name", "jurisdiction", "is_primary")
SELECT t."id", t."name", 'ES', true
FROM "tenants" t
WHERE NOT EXISTS (SELECT 1 FROM "legal_entities" le WHERE le."tenant_id" = t."id");

INSERT INTO "campuses" ("tenant_id", "name", "slug", "kind", "is_default")
SELECT t."id", t."name", 'default', 'hybrid', true
FROM "tenants" t
WHERE NOT EXISTS (
  SELECT 1 FROM "campuses" c WHERE c."tenant_id" = t."id" AND c."slug" = 'default'
);

INSERT INTO "blueprints" ("key", "name", "version", "default_capabilities", "is_active")
VALUES (
  'professional_training',
  'Formacion profesional / regulada',
  1,
  '["academic.courses","academic.phases","academic.regulated_programmes","academic.external_practices","resources.rooms","finance.funding","learning.lms","assessment.exams","credentials.digital"]'::jsonb,
  true
)
ON CONFLICT ("key", "version") DO NOTHING;

INSERT INTO "capabilities" ("key", "description", "category") VALUES
  ('academic.courses', 'cursos/cohortes', 'academic'),
  ('academic.phases', 'fases', 'academic'),
  ('academic.recurring_sessions', 'sesiones recurrentes', 'academic'),
  ('academic.one_to_one', '1:1', 'academic'),
  ('academic.multi_instructor', 'varios docentes', 'academic'),
  ('academic.external_practices', 'practicas externas', 'academic'),
  ('academic.regulated_programmes', 'formacion regulada', 'academic'),
  ('academic.levels', 'niveles', 'academic'),
  ('academic.teams', 'equipos', 'academic'),
  ('academic.seasons', 'temporadas', 'academic'),
  ('academic.guardians', 'tutores/menores', 'academic'),
  ('resources.rooms', 'aulas', 'resources'),
  ('resources.vehicles', 'vehiculos', 'resources'),
  ('resources.external_venues', 'venues externos', 'resources'),
  ('resources.travel_constraints', 'desplazamientos', 'resources'),
  ('commerce.memberships', 'membresias', 'commerce'),
  ('commerce.session_packs', 'bonos', 'commerce'),
  ('commerce.store', 'tienda', 'commerce'),
  ('commerce.events', 'eventos/clinics', 'commerce'),
  ('finance.advanced', 'finanzas avanzadas', 'finance'),
  ('finance.multi_payer', 'varios pagadores', 'finance'),
  ('finance.funding', 'becas/subvenciones', 'finance'),
  ('learning.lms', 'contenido/campus learning', 'learning'),
  ('learning.video', 'video', 'learning'),
  ('assessment.tests', 'tests', 'assessment'),
  ('assessment.exams', 'examenes', 'assessment'),
  ('credentials.digital', 'credenciales digitales', 'credentials'),
  ('access.qr', 'QR', 'access'),
  ('access.nfc', 'NFC', 'access'),
  ('communication.in_app', 'mensajeria interna', 'communication'),
  ('integrations.api', 'API', 'integrations'),
  ('integrations.webhooks', 'webhooks', 'integrations'),
  ('agents.mcp', 'MCP', 'agents'),
  ('agents.webmcp', 'WebMCP', 'agents'),
  ('agents.ai_assistant', 'asistentes IA', 'agents'),
  ('organization.multi_tenant_group', 'grupos multiempresa', 'organization'),
  ('organization.franchise', 'franquicia', 'organization'),
  ('platform.seasonal_standby', 'standby estacional', 'platform')
ON CONFLICT ("key") DO NOTHING;

ALTER TABLE "legal_entities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "campuses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tenant_capabilities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policies" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_legal_entities ON legal_entities
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_campuses ON campuses
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_tenant_capabilities ON tenant_capabilities
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY tenant_isolation_policies ON policies
    FOR ALL
    USING (
      tenant_id IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)::uuid
    )
    WITH CHECK (
      tenant_id IS NULL
      OR tenant_id = current_setting('app.tenant_id', true)::uuid
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
