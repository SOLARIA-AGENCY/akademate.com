import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "locations" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar,
      "name" varchar,
      "address_line_1" varchar,
      "address_line_2" varchar,
      "postal_code" varchar,
      "city" varchar,
      "municipality" varchar,
      "province" varchar,
      "country" varchar DEFAULT 'ES',
      "timezone" varchar DEFAULT 'Europe/Madrid',
      "latitude" numeric,
      "longitude" numeric,
      "active" boolean DEFAULT true,
      "tenant_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "legal_entities" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar,
      "legal_name" varchar,
      "trade_name" varchar,
      "tax_id_type" varchar,
      "tax_id" varchar,
      "legal_form" varchar,
      "legal_form_short" varchar,
      "entity_type" varchar,
      "country" varchar DEFAULT 'ES',
      "status" varchar DEFAULT 'ACTIVE',
      "cnae" varchar,
      "cnae_description" varchar,
      "registered_address" varchar,
      "registered_postal_code" varchar,
      "registered_city" varchar,
      "registered_municipality" varchar,
      "registered_province" varchar,
      "registered_country" varchar,
      "administrative_address" varchar,
      "administrative_postal_code" varchar,
      "administrative_city" varchar,
      "accounting_email" varchar,
      "general_email" varchar,
      "general_phone" varchar,
      "sepe_training_center_id" varchar,
      "employment_agency_id" varchar,
      "notes" varchar,
      "tenant_id" integer,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "campus_service_locations" (
      "id" serial PRIMARY KEY NOT NULL,
      "campus_id" integer NOT NULL,
      "location_id" integer NOT NULL,
      UNIQUE ("campus_id", "location_id")
    );

    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "code" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "display_name" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "campus_type" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "brand" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "campus_kind" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "legal_entity_id" integer;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "primary_location_id" integer;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "verification_status" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "accounting_email" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "training_email" varchar;
    ALTER TABLE "campuses" ADD COLUMN IF NOT EXISTS "visible_publicly" boolean;

    ALTER TABLE "course_runs" ADD COLUMN IF NOT EXISTS "location_id" integer;
    ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "campus_id" integer;
    ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "location_id" integer;
    ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "campus_id" integer;
    ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "location_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "locations_tenant_code_idx" ON "locations" ("tenant_id", "code");
    CREATE UNIQUE INDEX IF NOT EXISTS "legal_entities_tenant_tax_id_idx" ON "legal_entities" ("tenant_id", "tax_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "campus_service_locations_unique" ON "campus_service_locations" ("campus_id", "location_id");
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Additive only. Do not DROP operating-model columns.
}
