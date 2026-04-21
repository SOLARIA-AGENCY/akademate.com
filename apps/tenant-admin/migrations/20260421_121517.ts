import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      constraint_record RECORD;
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lead_interactions'
      ) THEN
        ALTER TABLE "lead_interactions" DROP CONSTRAINT IF EXISTS "lead_interactions_result_check";

        FOR constraint_record IN
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'public'
            AND t.relname = 'lead_interactions'
            AND c.contype = 'c'
            AND pg_get_constraintdef(c.oid) ILIKE '%result%'
        LOOP
          EXECUTE format('ALTER TABLE "lead_interactions" DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        END LOOP;

        ALTER TABLE "lead_interactions"
          ADD CONSTRAINT "lead_interactions_result_check"
          CHECK ("result" IN (
            'no_answer',
            'positive',
            'negative',
            'callback',
            'wrong_number',
            'message_sent',
            'email_sent',
            'enrollment_started',
            'status_changed',
            'note_added'
          ));
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    DECLARE
      constraint_record RECORD;
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'lead_interactions'
      ) THEN
        UPDATE "lead_interactions"
        SET "result" = 'message_sent'
        WHERE "result" IN ('status_changed', 'note_added');

        ALTER TABLE "lead_interactions" DROP CONSTRAINT IF EXISTS "lead_interactions_result_check";

        FOR constraint_record IN
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'public'
            AND t.relname = 'lead_interactions'
            AND c.contype = 'c'
            AND pg_get_constraintdef(c.oid) ILIKE '%result%'
        LOOP
          EXECUTE format('ALTER TABLE "lead_interactions" DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        END LOOP;

        ALTER TABLE "lead_interactions"
          ADD CONSTRAINT "lead_interactions_result_check"
          CHECK ("result" IN (
            'no_answer',
            'positive',
            'negative',
            'callback',
            'wrong_number',
            'message_sent',
            'email_sent',
            'enrollment_started'
          ));
      END IF;
    END $$;
  `)
}
