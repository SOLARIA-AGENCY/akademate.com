import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "landing_enabled" boolean DEFAULT false;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "dossier_pdf_id" integer;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "landing_target_audience" varchar;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "landing_access_requirements" varchar;
    ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "landing_outcomes" varchar;

    CREATE TABLE IF NOT EXISTS "courses_landing_objectives" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "text" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "courses_landing_program_blocks" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "title" varchar NOT NULL,
      "body" varchar
    );

    CREATE TABLE IF NOT EXISTS "courses_landing_program_blocks_items" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "text" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "courses_landing_faqs" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "question" varchar NOT NULL,
      "answer" varchar NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "courses" ADD CONSTRAINT "courses_dossier_pdf_id_media_id_fk"
        FOREIGN KEY ("dossier_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "courses_landing_objectives" ADD CONSTRAINT "courses_landing_objectives_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "courses_landing_program_blocks" ADD CONSTRAINT "courses_landing_program_blocks_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "courses_landing_program_blocks_items" ADD CONSTRAINT "courses_landing_program_blocks_items_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_landing_program_blocks"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "courses_landing_faqs" ADD CONSTRAINT "courses_landing_faqs_parent_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "courses_dossier_pdf_idx" ON "courses" USING btree ("dossier_pdf_id");
    CREATE INDEX IF NOT EXISTS "courses_landing_objectives_order_idx" ON "courses_landing_objectives" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "courses_landing_objectives_parent_idx" ON "courses_landing_objectives" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "courses_landing_objectives_path_idx" ON "courses_landing_objectives" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "courses_landing_program_blocks_order_idx" ON "courses_landing_program_blocks" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "courses_landing_program_blocks_parent_idx" ON "courses_landing_program_blocks" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "courses_landing_program_blocks_path_idx" ON "courses_landing_program_blocks" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "courses_landing_program_blocks_items_order_idx" ON "courses_landing_program_blocks_items" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "courses_landing_program_blocks_items_parent_idx" ON "courses_landing_program_blocks_items" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "courses_landing_program_blocks_items_path_idx" ON "courses_landing_program_blocks_items" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "courses_landing_faqs_order_idx" ON "courses_landing_faqs" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "courses_landing_faqs_parent_idx" ON "courses_landing_faqs" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "courses_landing_faqs_path_idx" ON "courses_landing_faqs" USING btree ("path");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "courses_landing_faqs" CASCADE;
    DROP TABLE IF EXISTS "courses_landing_program_blocks_items" CASCADE;
    DROP TABLE IF EXISTS "courses_landing_program_blocks" CASCADE;
    DROP TABLE IF EXISTS "courses_landing_objectives" CASCADE;

    ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_dossier_pdf_id_media_id_fk";
    DROP INDEX IF EXISTS "courses_dossier_pdf_idx";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "landing_enabled";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "dossier_pdf_id";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "landing_target_audience";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "landing_access_requirements";
    ALTER TABLE "courses" DROP COLUMN IF EXISTS "landing_outcomes";
  `);
}
