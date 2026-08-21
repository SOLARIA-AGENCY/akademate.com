import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "testimonials" (
      "id" serial PRIMARY KEY NOT NULL,
      "quote" varchar(800) NOT NULL,
      "name" varchar(120) NOT NULL,
      "role" varchar(160),
      "image_id" integer,
      "status" varchar DEFAULT 'draft' NOT NULL,
      "order" numeric DEFAULT 0,
      "tenant_id" integer,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "testimonials_status_idx" ON "testimonials" ("status");
    CREATE INDEX IF NOT EXISTS "testimonials_tenant_idx" ON "testimonials" ("tenant_id");

    CREATE TABLE IF NOT EXISTS "website_forms" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar(160) NOT NULL,
      "subtitle" varchar(400),
      "source" varchar(80) NOT NULL,
      "page_slug" varchar(80),
      "status" varchar DEFAULT 'draft' NOT NULL,
      "tenant_id" integer,
      "updated_at" timestamptz DEFAULT now() NOT NULL,
      "created_at" timestamptz DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "website_forms_status_idx" ON "website_forms" ("status");
    CREATE INDEX IF NOT EXISTS "website_forms_tenant_idx" ON "website_forms" ("tenant_id");

    ALTER TABLE "enrollments" ADD COLUMN IF NOT EXISTS "lead_id" integer;

    UPDATE "enrollments" e
    SET "lead_id" = e."student_id"
    WHERE e."lead_id" IS NULL
      AND EXISTS (SELECT 1 FROM "leads" l WHERE l."id" = e."student_id");

    INSERT INTO "students" (
      "first_name",
      "last_name",
      "email",
      "phone",
      "gdpr_consent",
      "privacy_policy_accepted",
      "status",
      "updated_at",
      "created_at"
    )
    SELECT DISTINCT
      COALESCE(NULLIF(l."first_name", ''), 'Alumno'),
      COALESCE(NULLIF(l."last_name", ''), 'Sin apellido'),
      lower(l."email"),
      COALESCE(NULLIF(l."phone", ''), '+34 600 000 000'),
      true,
      true,
      'active',
      now(),
      now()
    FROM "enrollments" e
    INNER JOIN "leads" l ON l."id" = e."lead_id"
    WHERE l."email" IS NOT NULL
      AND l."email" <> ''
      AND NOT EXISTS (
        SELECT 1 FROM "students" s WHERE lower(s."email") = lower(l."email")
      );

    UPDATE "enrollments" e
    SET "student_id" = s."id"
    FROM "leads" l
    INNER JOIN "students" s ON lower(s."email") = lower(l."email")
    WHERE e."lead_id" = l."id";

    ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_id_leads_id_fk";

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_student_id_students_id_fk'
      ) THEN
        ALTER TABLE "enrollments"
          ADD CONSTRAINT "enrollments_student_id_students_id_fk"
          FOREIGN KEY ("student_id") REFERENCES "students"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_id_students_id_fk";

    UPDATE "enrollments" e
    SET "student_id" = e."lead_id"
    WHERE e."lead_id" IS NOT NULL;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_student_id_leads_id_fk'
      ) THEN
        ALTER TABLE "enrollments"
          ADD CONSTRAINT "enrollments_student_id_leads_id_fk"
          FOREIGN KEY ("student_id") REFERENCES "leads"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;

    DROP TABLE IF EXISTS "website_forms";
    DROP TABLE IF EXISTS "testimonials";
  `)
}
