-- Fix CRM lead statuses for enrollment flow
-- Ensures PostgreSQL enum_leads_status accepts CRM v2 statuses
-- Safe to run multiple times

DO $$
DECLARE
  status_value text;
  crm_statuses text[] := ARRAY[
    'following_up',
    'interested',
    'on_hold',
    'enrolling',
    'enrolled',
    'not_interested',
    'unreachable',
    'discarded'
  ];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'enum_leads_status'
      AND n.nspname = 'public'
  ) THEN
    FOREACH status_value IN ARRAY crm_statuses LOOP
      BEGIN
        EXECUTE format(
          'ALTER TYPE "public"."enum_leads_status" ADD VALUE IF NOT EXISTS %L',
          status_value
        );
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END;
    END LOOP;
  END IF;
END $$;

-- Normalize legacy statuses to CRM v2 naming
UPDATE leads SET status = 'interested' WHERE status = 'qualified';
UPDATE leads SET status = 'enrolled' WHERE status = 'converted';
UPDATE leads SET status = 'not_interested' WHERE status = 'rejected';
UPDATE leads SET status = 'discarded' WHERE status = 'spam';

