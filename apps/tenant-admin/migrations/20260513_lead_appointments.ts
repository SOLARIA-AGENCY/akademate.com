import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "lead_appointments" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" integer NOT NULL,
      "lead_id" integer NOT NULL,
      "created_by_user_id" integer NOT NULL,
      "assigned_to_user_id" integer NOT NULL,
      "title" varchar(255) NOT NULL,
      "appointment_type" varchar(32) DEFAULT 'call' NOT NULL,
      "reason" varchar(32) DEFAULT 'follow_up' NOT NULL,
      "status" varchar(32) DEFAULT 'pending' NOT NULL,
      "starts_at" timestamp(3) with time zone NOT NULL,
      "ends_at" timestamp(3) with time zone NOT NULL,
      "duration_minutes" integer DEFAULT 30 NOT NULL,
      "notes" text,
      "outcome_notes" text,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "cancelled_at" timestamp(3) with time zone
    );

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_tenant_id_tenants_id_fk"
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_lead_id_leads_id_fk"
        FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_created_by_user_id_users_id_fk"
        FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_assigned_to_user_id_users_id_fk"
        FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_type_check"
        CHECK ("appointment_type" IN ('call', 'whatsapp', 'video', 'presential', 'email_followup'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_reason_check"
        CHECK ("reason" IN ('follow_up', 'info_meeting', 'lead_recovery', 'send_information', 'enrollment_close', 'other'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_status_check"
        CHECK ("status" IN ('pending', 'confirmed', 'completed', 'no_show', 'rescheduled', 'cancelled'));
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "lead_appointments" ADD CONSTRAINT "lead_appointments_duration_check"
        CHECK ("duration_minutes" BETWEEN 5 AND 480);
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "lead_appointments_tenant_starts_idx" ON "lead_appointments" ("tenant_id", "starts_at");
    CREATE INDEX IF NOT EXISTS "lead_appointments_tenant_lead_idx" ON "lead_appointments" ("tenant_id", "lead_id");
    CREATE INDEX IF NOT EXISTS "lead_appointments_tenant_assigned_starts_idx" ON "lead_appointments" ("tenant_id", "assigned_to_user_id", "starts_at");
    CREATE INDEX IF NOT EXISTS "lead_appointments_tenant_status_idx" ON "lead_appointments" ("tenant_id", "status");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "lead_appointments";
  `)
}
