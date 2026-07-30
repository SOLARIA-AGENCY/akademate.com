import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN CREATE TYPE "enum_legal_entities_kind" AS ENUM ('operator', 'employer', 'funder', 'vendor', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "enum_operating_scopes_kind" AS ENUM ('virtual_entity', 'department', 'project', 'cost_center');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "enum_site_entity_relationships_role" AS ENUM ('primary_operator', 'shared_operator', 'employer', 'resource_manager');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "enum_scoped_role_bindings_role" AS ENUM ('admin', 'gestor', 'marketing', 'asesor', 'lectura');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "enum_finance_entries_type" AS ENUM ('income', 'expense', 'payroll', 'subsidy', 'intercompany', 'adjustment');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "enum_finance_entries_status" AS ENUM ('draft', 'posted', 'void');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN CREATE TYPE "enum_campuses_public_visibility" AS ENUM ('public', 'internal');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "legal_entities" (
      "id" serial PRIMARY KEY,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "legal_name" varchar,
      "tax_id" varchar,
      "kind" "enum_legal_entities_kind" DEFAULT 'operator' NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "notes" varchar,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "operating_scopes" (
      "id" serial PRIMARY KEY,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "kind" "enum_operating_scopes_kind" DEFAULT 'virtual_entity' NOT NULL,
      "legal_entity_id" integer NOT NULL REFERENCES "legal_entities"("id") ON DELETE CASCADE,
      "internal_only" boolean DEFAULT true NOT NULL CHECK ("internal_only" = true),
      "active" boolean DEFAULT true NOT NULL,
      "notes" varchar,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "site_entity_relationships" (
      "id" serial PRIMARY KEY,
      "campus_id" integer NOT NULL REFERENCES "campuses"("id") ON DELETE CASCADE,
      "legal_entity_id" integer NOT NULL REFERENCES "legal_entities"("id") ON DELETE RESTRICT,
      "role" "enum_site_entity_relationships_role" NOT NULL,
      "is_primary" boolean DEFAULT false NOT NULL,
      "valid_from" timestamptz(3),
      "valid_to" timestamptz(3),
      "active" boolean DEFAULT true NOT NULL,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL,
      CONSTRAINT "site_entity_relationships_dates_check" CHECK ("valid_to" IS NULL OR "valid_from" IS NULL OR "valid_to" >= "valid_from")
    );

    CREATE TABLE IF NOT EXISTS "staff_employment_relationships" (
      "id" serial PRIMARY KEY,
      "staff_id" integer NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
      "legal_entity_id" integer NOT NULL REFERENCES "legal_entities"("id") ON DELETE RESTRICT,
      "position" varchar NOT NULL,
      "contract_reference" varchar,
      "is_primary" boolean DEFAULT true NOT NULL,
      "valid_from" timestamptz(3),
      "valid_to" timestamptz(3),
      "active" boolean DEFAULT true NOT NULL,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL,
      CONSTRAINT "staff_employment_dates_check" CHECK ("valid_to" IS NULL OR "valid_from" IS NULL OR "valid_to" >= "valid_from")
    );

    CREATE TABLE IF NOT EXISTS "staff_site_assignments" (
      "id" serial PRIMARY KEY,
      "staff_id" integer NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
      "campus_id" integer NOT NULL REFERENCES "campuses"("id") ON DELETE CASCADE,
      "legal_entity_id" integer REFERENCES "legal_entities"("id") ON DELETE RESTRICT,
      "operating_scope_id" integer REFERENCES "operating_scopes"("id") ON DELETE SET NULL,
      "allocation_percentage" numeric DEFAULT 100 NOT NULL CHECK ("allocation_percentage" > 0 AND "allocation_percentage" <= 100),
      "valid_from" timestamptz(3),
      "valid_to" timestamptz(3),
      "active" boolean DEFAULT true NOT NULL,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL,
      CONSTRAINT "staff_site_assignment_dates_check" CHECK ("valid_to" IS NULL OR "valid_from" IS NULL OR "valid_to" >= "valid_from")
    );

    CREATE TABLE IF NOT EXISTS "resource_allocations" (
      "id" serial PRIMARY KEY,
      "classroom_id" integer REFERENCES "classrooms"("id") ON DELETE CASCADE,
      "campus_id" integer NOT NULL REFERENCES "campuses"("id") ON DELETE CASCADE,
      "legal_entity_id" integer NOT NULL REFERENCES "legal_entities"("id") ON DELETE RESTRICT,
      "operating_scope_id" integer REFERENCES "operating_scopes"("id") ON DELETE SET NULL,
      "allocation_percentage" numeric DEFAULT 100 NOT NULL CHECK ("allocation_percentage" > 0 AND "allocation_percentage" <= 100),
      "notes" varchar,
      "valid_from" timestamptz(3),
      "valid_to" timestamptz(3),
      "active" boolean DEFAULT true NOT NULL,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL,
      CONSTRAINT "resource_allocation_dates_check" CHECK ("valid_to" IS NULL OR "valid_from" IS NULL OR "valid_to" >= "valid_from")
    );

    CREATE TABLE IF NOT EXISTS "scoped_role_bindings" (
      "id" serial PRIMARY KEY,
      "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "role" "enum_scoped_role_bindings_role" NOT NULL,
      "legal_entity_id" integer REFERENCES "legal_entities"("id") ON DELETE CASCADE,
      "campus_id" integer REFERENCES "campuses"("id") ON DELETE CASCADE,
      "operating_scope_id" integer REFERENCES "operating_scopes"("id") ON DELETE CASCADE,
      "course_run_id" integer REFERENCES "course_runs"("id") ON DELETE CASCADE,
      "valid_from" timestamptz(3),
      "valid_to" timestamptz(3),
      "active" boolean DEFAULT true NOT NULL,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL,
      CONSTRAINT "scoped_role_binding_scope_check" CHECK (num_nonnulls("legal_entity_id", "campus_id", "operating_scope_id", "course_run_id") <= 1),
      CONSTRAINT "scoped_role_binding_dates_check" CHECK ("valid_to" IS NULL OR "valid_from" IS NULL OR "valid_to" >= "valid_from")
    );

    CREATE TABLE IF NOT EXISTS "scoped_role_bindings_texts" (
      "id" serial PRIMARY KEY,
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL REFERENCES "scoped_role_bindings"("id") ON DELETE CASCADE,
      "path" varchar NOT NULL,
      "text" varchar
    );

    CREATE TABLE IF NOT EXISTS "finance_entries" (
      "id" serial PRIMARY KEY,
      "reference" varchar NOT NULL,
      "date" timestamptz(3) NOT NULL,
      "type" "enum_finance_entries_type" NOT NULL,
      "legal_entity_id" integer NOT NULL REFERENCES "legal_entities"("id") ON DELETE RESTRICT,
      "counterparty_legal_entity_id" integer REFERENCES "legal_entities"("id") ON DELETE RESTRICT,
      "campus_id" integer REFERENCES "campuses"("id") ON DELETE SET NULL,
      "operating_scope_id" integer REFERENCES "operating_scopes"("id") ON DELETE SET NULL,
      "course_run_id" integer REFERENCES "course_runs"("id") ON DELETE SET NULL,
      "amount" numeric NOT NULL CHECK ("amount" >= 0),
      "currency" varchar DEFAULT 'EUR' NOT NULL,
      "status" "enum_finance_entries_status" DEFAULT 'draft' NOT NULL,
      "description" varchar,
      "metadata" jsonb,
      "tenant_id" integer NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
      "updated_at" timestamptz(3) DEFAULT now() NOT NULL,
      "created_at" timestamptz(3) DEFAULT now() NOT NULL,
      CONSTRAINT "finance_intercompany_counterparty_check" CHECK ("type" <> 'intercompany' OR "counterparty_legal_entity_id" IS NOT NULL)
    );

    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "public_visibility" "enum_campuses_public_visibility" DEFAULT 'public' NOT NULL;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "owner_legal_entity_id" integer REFERENCES "legal_entities"("id") ON DELETE SET NULL;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "managing_legal_entity_id" integer REFERENCES "legal_entities"("id") ON DELETE SET NULL;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "funding_legal_entity_id" integer REFERENCES "legal_entities"("id") ON DELETE SET NULL;
    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "operating_scope_id" integer REFERENCES "operating_scopes"("id") ON DELETE SET NULL;
    ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "tenant_id" integer REFERENCES "tenants"("id") ON DELETE SET NULL;

    UPDATE "staff" AS s
    SET "tenant_id" = inferred."tenant_id"
    FROM (
      SELECT sr."parent_id" AS "staff_id", min(c."tenant_id") AS "tenant_id"
      FROM "staff_rels" sr
      JOIN "campuses" c ON c."id" = sr."campuses_id"
      WHERE sr."path" = 'assigned_campuses' AND c."tenant_id" IS NOT NULL
      GROUP BY sr."parent_id"
      HAVING count(DISTINCT c."tenant_id") = 1
    ) inferred
    WHERE s."id" = inferred."staff_id" AND s."tenant_id" IS NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS "legal_entities_tenant_slug_idx" ON "legal_entities" ("tenant_id", "slug");
    CREATE INDEX IF NOT EXISTS "legal_entities_slug_idx" ON "legal_entities" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "operating_scopes_tenant_slug_idx" ON "operating_scopes" ("tenant_id", "slug");
    CREATE INDEX IF NOT EXISTS "operating_scopes_slug_idx" ON "operating_scopes" ("slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "site_entity_one_current_primary_idx" ON "site_entity_relationships" ("tenant_id", "campus_id") WHERE "active" AND "is_primary" AND "valid_to" IS NULL;
    CREATE INDEX IF NOT EXISTS "site_entity_tenant_entity_idx" ON "site_entity_relationships" ("tenant_id", "legal_entity_id");
    CREATE INDEX IF NOT EXISTS "staff_employment_tenant_staff_idx" ON "staff_employment_relationships" ("tenant_id", "staff_id");
    CREATE INDEX IF NOT EXISTS "staff_site_tenant_staff_idx" ON "staff_site_assignments" ("tenant_id", "staff_id");
    CREATE INDEX IF NOT EXISTS "resource_allocation_tenant_site_idx" ON "resource_allocations" ("tenant_id", "campus_id");
    CREATE INDEX IF NOT EXISTS "scoped_role_tenant_user_idx" ON "scoped_role_bindings" ("tenant_id", "user_id");
    CREATE INDEX IF NOT EXISTS "scoped_role_bindings_texts_order_parent" ON "scoped_role_bindings_texts" ("order", "parent_id");
    CREATE INDEX IF NOT EXISTS "finance_entries_tenant_entity_date_idx" ON "finance_entries" ("tenant_id", "legal_entity_id", "date");
    CREATE INDEX IF NOT EXISTS "campuses_public_visibility_idx" ON "campuses" ("public_visibility");
    CREATE INDEX IF NOT EXISTS "course_runs_owner_legal_entity_idx" ON "course_runs" ("owner_legal_entity_id");
    CREATE INDEX IF NOT EXISTS "course_runs_managing_legal_entity_idx" ON "course_runs" ("managing_legal_entity_id");
    CREATE INDEX IF NOT EXISTS "course_runs_funding_legal_entity_idx" ON "course_runs" ("funding_legal_entity_id");
    CREATE INDEX IF NOT EXISTS "course_runs_operating_scope_idx" ON "course_runs" ("operating_scope_id");
    CREATE INDEX IF NOT EXISTS "staff_tenant_idx" ON "staff" ("tenant_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "staff_tenant_idx";
    ALTER TABLE "staff" DROP COLUMN IF EXISTS "tenant_id";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "operating_scope_id";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "funding_legal_entity_id";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "managing_legal_entity_id";
    ALTER TABLE "course_runs" DROP COLUMN IF EXISTS "owner_legal_entity_id";
    ALTER TABLE "campuses" DROP COLUMN IF EXISTS "public_visibility";
    DROP TABLE IF EXISTS "finance_entries" CASCADE;
    DROP TABLE IF EXISTS "scoped_role_bindings_texts" CASCADE;
    DROP TABLE IF EXISTS "scoped_role_bindings" CASCADE;
    DROP TABLE IF EXISTS "resource_allocations" CASCADE;
    DROP TABLE IF EXISTS "staff_site_assignments" CASCADE;
    DROP TABLE IF EXISTS "staff_employment_relationships" CASCADE;
    DROP TABLE IF EXISTS "site_entity_relationships" CASCADE;
    DROP TABLE IF EXISTS "operating_scopes" CASCADE;
    DROP TABLE IF EXISTS "legal_entities" CASCADE;
    DROP TYPE IF EXISTS "enum_campuses_public_visibility";
    DROP TYPE IF EXISTS "enum_finance_entries_status";
    DROP TYPE IF EXISTS "enum_finance_entries_type";
    DROP TYPE IF EXISTS "enum_scoped_role_bindings_role";
    DROP TYPE IF EXISTS "enum_site_entity_relationships_role";
    DROP TYPE IF EXISTS "enum_operating_scopes_kind";
    DROP TYPE IF EXISTS "enum_legal_entities_kind";
  `)
}
