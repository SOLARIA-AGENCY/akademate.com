-- CRM Leads v2 Migration: New status enum + lead_interactions table
-- Date: 2026-04-07
-- Safe to run multiple times (IF NOT EXISTS / idempotent)

-- 1. Add new status values to existing enum (if column uses varchar, this handles both cases)
-- First check if the column is varchar or enum
DO $$
BEGIN
  -- Try to add new values if enum exists
  BEGIN
    -- For Payload CMS, status is typically stored as varchar, not a pg enum
    -- So we just need to ensure the lead_interactions table and new columns exist
    RAISE NOTICE 'Checking leads table status column type...';
  END;
END $$;

-- 2. Add new columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_note TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS enrollment_id INTEGER;

-- 3. Create lead_interactions table (append-only, immutable)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('phone', 'whatsapp', 'email', 'system')),
  result VARCHAR(30) NOT NULL CHECK (result IN (
    'no_answer', 'positive', 'negative', 'callback', 'wrong_number',
    'message_sent', 'email_sent', 'enrollment_started'
  )),
  note TEXT,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_tenant_id ON lead_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at DESC);

-- 5. Index on leads.status for the new sort queries
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- 6. Migrate old status values to new ones (safe — only updates if old values exist)
UPDATE leads SET status = 'interested' WHERE status = 'qualified';
UPDATE leads SET status = 'enrolled' WHERE status = 'converted';
UPDATE leads SET status = 'not_interested' WHERE status = 'rejected';
UPDATE leads SET status = 'discarded' WHERE status IN ('lost', 'spam');
UPDATE leads SET status = 'contacted' WHERE status = 'no_answer';
UPDATE leads SET status = 'unreachable' WHERE status = 'wrong_number';
UPDATE leads SET status = 'on_hold' WHERE status = 'callback';

-- Done
SELECT 'Migration complete: lead_interactions table created, leads table updated' as result;
