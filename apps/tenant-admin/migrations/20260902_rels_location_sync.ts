import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

/**
 * Migration: rels_location_sync
 *
 * Closes schema gaps introduced when the Campuses.service_locations (hasMany)
 * and CourseRuns.location / CourseRuns.cycle relationship fields were added to
 * the codebase without a matching DB migration.
 *
 * Gap 1 — campuses_rels.locations_id
 *   Payload stores hasMany relationships in the collection's `_rels` table.
 *   The 20260831_operating_model migration created a parallel manual
 *   `campus_service_locations` join table instead of extending `campuses_rels`.
 *   That manual table is left in place (additive-only); it does not conflict
 *   because Payload reads/writes `service_locations` exclusively via
 *   `campuses_rels WHERE path = 'service_locations'`.
 *
 * Gap 2 — course_runs.location_id FK + index
 *   20260831_operating_model added the bare column (IF NOT EXISTS) but omitted
 *   the FK constraint and index that Payload's adapter generates.
 *
 * Gap 3 — course_runs.cycle_id
 *   The CourseRuns.cycle relationship field (relationTo: 'cycles') was added
 *   to the collection without a corresponding column migration.
 *
 * Gap 4 — payload_locked_documents_rels
 *   The `locations` and `legal_entities` collections introduced by
 *   20260831_operating_model were not registered in Payload's lock-tracking
 *   table.
 *
 * All statements are idempotent: ADD COLUMN IF NOT EXISTS, CREATE INDEX IF NOT
 * EXISTS, and DO $$ BEGIN … EXCEPTION WHEN duplicate_object THEN null; END $$.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- =========================================================================
    -- Gap 1: campuses_rels.locations_id
    --   Payload needs this column to store campuses.service_locations (hasMany).
    --   Convention matches campuses_rels.staff_id already present in that table.
    -- =========================================================================
    ALTER TABLE "campuses_rels"
      ADD COLUMN IF NOT EXISTS "locations_id" integer;

    DO $$ BEGIN
      ALTER TABLE "campuses_rels"
        ADD CONSTRAINT "campuses_rels_locations_fk"
        FOREIGN KEY ("locations_id")
        REFERENCES "public"."locations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "campuses_rels_locations_id_idx"
      ON "campuses_rels" USING btree ("locations_id");

    -- =========================================================================
    -- Gap 2: course_runs.location_id — FK + index
    --   The column was added by 20260831_operating_model (IF NOT EXISTS),
    --   but the FK constraint and index were not. The ADD COLUMN below is
    --   guarded so the migration is safe on a fresh DB too.
    -- =========================================================================
    ALTER TABLE "course_runs"
      ADD COLUMN IF NOT EXISTS "location_id" integer;

    DO $$ BEGIN
      ALTER TABLE "course_runs"
        ADD CONSTRAINT "course_runs_location_id_locations_id_fk"
        FOREIGN KEY ("location_id")
        REFERENCES "public"."locations"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "course_runs_location_idx"
      ON "course_runs" USING btree ("location_id");

    -- =========================================================================
    -- Gap 3: course_runs.cycle_id
    --   CourseRuns.cycle relationship (relationTo: 'cycles') has no DB column.
    --   Pattern matches course_runs.campus_id and course_runs.course_id.
    -- =========================================================================
    ALTER TABLE "course_runs"
      ADD COLUMN IF NOT EXISTS "cycle_id" integer;

    DO $$ BEGIN
      ALTER TABLE "course_runs"
        ADD CONSTRAINT "course_runs_cycle_id_cycles_id_fk"
        FOREIGN KEY ("cycle_id")
        REFERENCES "public"."cycles"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "course_runs_cycle_idx"
      ON "course_runs" USING btree ("cycle_id");

    -- =========================================================================
    -- Gap 4: payload_locked_documents_rels — register new collections
    --   Follows the pattern set in the initial migration for every other
    --   collection (e.g., campuses_id, courses_id, course_runs_id …).
    -- =========================================================================
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "locations_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_locations_id_idx"
      ON "payload_locked_documents_rels" USING btree ("locations_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_locations_fk"
        FOREIGN KEY ("locations_id")
        REFERENCES "public"."locations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "legal_entities_id" integer;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_legal_entities_id_idx"
      ON "payload_locked_documents_rels" USING btree ("legal_entities_id");

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_legal_entities_fk"
        FOREIGN KEY ("legal_entities_id")
        REFERENCES "public"."legal_entities"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Additive-only. Dropping these columns would destroy relationship data
  // (service_locations, course location assignments) and violate the
  // "never roll back operating-model changes" policy established in
  // 20260831_operating_model.ts. Reverse manually if ever needed.
}
