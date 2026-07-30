-- Generalized multi-entity model for Akademate's UUID/Drizzle data plane.
-- Payload's integer schema has its own equivalent migration under apps/tenant-admin/migrations.

DO $$ BEGIN CREATE TYPE legal_entity_kind AS ENUM ('operator', 'employer', 'funder', 'vendor', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE operating_scope_kind AS ENUM ('virtual_entity', 'department', 'project', 'cost_center');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE entity_site_role AS ENUM ('primary_operator', 'shared_operator', 'employer', 'resource_manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE finance_entry_type AS ENUM ('income', 'expense', 'payroll', 'subsidy', 'intercompany', 'adjustment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS legal_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  legal_name text,
  tax_id text,
  kind legal_entity_kind NOT NULL DEFAULT 'operator',
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS operating_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  legal_entity_id uuid NOT NULL REFERENCES legal_entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  kind operating_scope_kind NOT NULL DEFAULT 'virtual_entity',
  internal_only boolean NOT NULL DEFAULT true CHECK (internal_only),
  active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE centers ADD COLUMN IF NOT EXISTS public_visibility text NOT NULL DEFAULT 'public';

CREATE TABLE IF NOT EXISTS site_entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  center_id uuid NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  legal_entity_id uuid NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
  role entity_site_role NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  valid_from timestamptz,
  valid_to timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

ALTER TABLE course_runs ADD COLUMN IF NOT EXISTS owner_legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE RESTRICT;
ALTER TABLE course_runs ADD COLUMN IF NOT EXISTS managing_legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE SET NULL;
ALTER TABLE course_runs ADD COLUMN IF NOT EXISTS funding_legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE SET NULL;
ALTER TABLE course_runs ADD COLUMN IF NOT EXISTS operating_scope_id uuid REFERENCES operating_scopes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS scoped_role_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE CASCADE,
  center_id uuid REFERENCES centers(id) ON DELETE CASCADE,
  operating_scope_id uuid REFERENCES operating_scopes(id) ON DELETE CASCADE,
  course_run_id uuid REFERENCES course_runs(id) ON DELETE CASCADE,
  permissions jsonb NOT NULL DEFAULT '[]',
  valid_from timestamptz,
  valid_to timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(legal_entity_id, center_id, operating_scope_id, course_run_id) <= 1),
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);

CREATE TABLE IF NOT EXISTS financial_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  legal_entity_id uuid NOT NULL REFERENCES legal_entities(id) ON DELETE RESTRICT,
  counterparty_legal_entity_id uuid REFERENCES legal_entities(id) ON DELETE RESTRICT,
  center_id uuid REFERENCES centers(id) ON DELETE SET NULL,
  operating_scope_id uuid REFERENCES operating_scopes(id) ON DELETE SET NULL,
  course_run_id uuid REFERENCES course_runs(id) ON DELETE SET NULL,
  reference text NOT NULL,
  date timestamptz NOT NULL,
  type finance_entry_type NOT NULL,
  amount decimal(14,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'draft',
  description text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (type <> 'intercompany' OR counterparty_legal_entity_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS site_entity_one_current_primary_idx
  ON site_entity_relationships (tenant_id, center_id)
  WHERE active AND is_primary AND valid_to IS NULL;
CREATE INDEX IF NOT EXISTS site_entity_tenant_entity_idx ON site_entity_relationships (tenant_id, legal_entity_id);
CREATE INDEX IF NOT EXISTS scoped_role_tenant_user_idx ON scoped_role_bindings (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS financial_entries_tenant_entity_date_idx ON financial_entries (tenant_id, legal_entity_id, date);
CREATE INDEX IF NOT EXISTS course_runs_owner_legal_entity_idx ON course_runs (owner_legal_entity_id);

ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_entity_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoped_role_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_legal_entities ON legal_entities;
CREATE POLICY tenant_isolation_legal_entities ON legal_entities FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
DROP POLICY IF EXISTS tenant_isolation_operating_scopes ON operating_scopes;
CREATE POLICY tenant_isolation_operating_scopes ON operating_scopes FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
DROP POLICY IF EXISTS tenant_isolation_site_entity_relationships ON site_entity_relationships;
CREATE POLICY tenant_isolation_site_entity_relationships ON site_entity_relationships FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
DROP POLICY IF EXISTS tenant_isolation_scoped_role_bindings ON scoped_role_bindings;
CREATE POLICY tenant_isolation_scoped_role_bindings ON scoped_role_bindings FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
DROP POLICY IF EXISTS tenant_isolation_financial_entries ON financial_entries;
CREATE POLICY tenant_isolation_financial_entries ON financial_entries FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
