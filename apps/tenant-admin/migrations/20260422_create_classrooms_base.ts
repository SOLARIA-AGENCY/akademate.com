import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * The planning migration extends `classrooms`, but the original baseline did
 * not create the collection table. Keep the base table additive so a fresh
 * staging database and an existing database follow the same chain.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "classrooms" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "capacity" numeric NOT NULL,
      "floor" numeric,
      "campus_id" integer NOT NULL,
      "active" boolean DEFAULT true,
      "notes" varchar,
      "tenant_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "classrooms_campus_idx" ON "classrooms" USING btree ("campus_id");
    CREATE INDEX IF NOT EXISTS "classrooms_tenant_idx" ON "classrooms" USING btree ("tenant_id");

    DO $$ BEGIN
      ALTER TABLE "classrooms"
        ADD CONSTRAINT "classrooms_campus_id_campuses_id_fk"
        FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "classrooms"
        ADD CONSTRAINT "classrooms_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

/**
 * Intentionally non-destructive: the table may have existed before this
 * migration was introduced, so rollback must not delete operational data.
 */
export async function down({ db: _db }: MigrateDownArgs): Promise<void> {
  // No-op by design. Removing classrooms requires an explicit data migration.
}
