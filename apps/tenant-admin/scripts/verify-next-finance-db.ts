import assert from 'node:assert/strict'
import postgres from 'postgres'

const ownerUrl = process.env.AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL
const appUrl = process.env.AKADEMATE_NEXT_TEST_APP_DATABASE_URL
const appRole = process.env.AKADEMATE_NEXT_DB_APP_USER
if (!ownerUrl || !appUrl || !appRole) throw new Error('Isolated finance database proof configuration is required')

const tables = [
  'finance_entities', 'finance_connections', 'finance_connection_credentials', 'finance_oauth_attempts',
  'finance_connection_candidates', 'finance_mappings', 'finance_sync_cursors', 'finance_sync_runs',
  'finance_sync_items', 'finance_external_objects', 'finance_webhook_events', 'finance_audit_events',
  'finance_payment_projections', 'finance_integration_requests', 'finance_integration_request_events',
]
const owner = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
const app = postgres(appUrl, { max: 1, onnotice: () => undefined })
const checks = new Set<string>()

try {
  const rlsRows = await owner<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]>`
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = ANY(${tables})
  `
  assert.equal(rlsRows.length, tables.length)
  assert.ok(rlsRows.every((row) => row.relrowsecurity && row.relforcerowsecurity))
  checks.add('all-finance-tables-forced-rls')

  const [role] = await app<{ current_user: string; rolsuper: boolean; rolbypassrls: boolean }[]>`
    SELECT current_user, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user
  `
  assert.equal(role?.current_user, appRole)
  assert.equal(role?.rolsuper, false)
  assert.equal(role?.rolbypassrls, false)
  checks.add('app-role-safe')

  await assert.rejects(app`INSERT INTO finance_entities (tenant_id, slug, display_name) VALUES (1, 'proof', 'Proof')`, (error: unknown) => typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '42501')
  checks.add('direct-dml-denied-without-tenant-context')

  const [unscoped] = await app<{ count: number }[]>`SELECT count(*)::integer AS count FROM finance_connections`
  assert.equal(unscoped?.count, 0)
  checks.add('unscoped-read-hidden')

  process.stdout.write(`${JSON.stringify({ postgres: '16', financeChecks: checks.size, checks: [...checks] })}\n`)
} finally {
  await Promise.allSettled([owner.end(), app.end()])
}
