import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "staff"
      ADD COLUMN IF NOT EXISTS "first_surname" varchar,
      ADD COLUMN IF NOT EXISTS "second_surname" varchar,
      ADD COLUMN IF NOT EXISTS "address" varchar,
      ADD COLUMN IF NOT EXISTS "city" varchar,
      ADD COLUMN IF NOT EXISTS "postal_code" varchar,
      ADD COLUMN IF NOT EXISTS "base_campus_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'staff_base_campus_id_campuses_id_fk'
      ) THEN
        ALTER TABLE "staff"
          ADD CONSTRAINT "staff_base_campus_id_campuses_id_fk"
          FOREIGN KEY ("base_campus_id") REFERENCES "public"."campuses"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "staff_first_surname_idx" ON "staff" ("first_surname");
    CREATE INDEX IF NOT EXISTS "staff_second_surname_idx" ON "staff" ("second_surname");
    CREATE INDEX IF NOT EXISTS "staff_base_campus_idx" ON "staff" ("base_campus_id");

    UPDATE "staff"
    SET
      "first_surname" = COALESCE(
        NULLIF("first_surname", ''),
        NULLIF(split_part(trim("last_name"), ' ', 1), '')
      ),
      "second_surname" = COALESCE(
        NULLIF("second_surname", ''),
        NULLIF(trim(substring(trim("last_name") from length(split_part(trim("last_name"), ' ', 1)) + 2)), '')
      )
    WHERE "last_name" IS NOT NULL
      AND ("first_surname" IS NULL OR "first_surname" = '');

    UPDATE "staff" s
    SET "base_campus_id" = rel.campuses_id
    FROM (
      SELECT DISTINCT ON (parent_id) parent_id, campuses_id
      FROM "staff_rels"
      WHERE path = 'assigned_campuses'
        AND campuses_id IS NOT NULL
      ORDER BY parent_id, "order" NULLS LAST, campuses_id
    ) rel
    WHERE s.id = rel.parent_id
      AND s.base_campus_id IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "staff_base_campus_idx";
    DROP INDEX IF EXISTS "staff_second_surname_idx";
    DROP INDEX IF EXISTS "staff_first_surname_idx";

    ALTER TABLE "staff"
      DROP CONSTRAINT IF EXISTS "staff_base_campus_id_campuses_id_fk";

    ALTER TABLE "staff"
      DROP COLUMN IF EXISTS "base_campus_id",
      DROP COLUMN IF EXISTS "postal_code",
      DROP COLUMN IF EXISTS "city",
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "second_surname",
      DROP COLUMN IF EXISTS "first_surname";
  `)
}
