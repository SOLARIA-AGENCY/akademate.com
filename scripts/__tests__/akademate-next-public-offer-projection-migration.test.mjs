import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const migration = readFileSync(path.join(
  root,
  'apps/tenant-admin/migrations/20260803_akademate_next_public_offer_projection.ts',
), 'utf8')
const wrapper = readFileSync(path.join(
  root,
  'apps/tenant-admin/migrations-next/20260803_akademate_next_public_offer_projection.ts',
), 'utf8')
const index = readFileSync(path.join(root, 'apps/tenant-admin/migrations/index.ts'), 'utf8')

test('creates a bounded security-definer projection instead of granting public table reads', () => {
  assert.match(migration, /CREATE FUNCTION "akademate_next_get_public_offer"/)
  assert.match(migration, /SECURITY DEFINER/)
  assert.match(migration, /SET search_path = pg_catalog, public/)
  assert.match(migration, /REVOKE ALL ON FUNCTION "akademate_next_get_public_offer"/)
  assert.match(migration, /GRANT EXECUTE ON FUNCTION "akademate_next_get_public_offer"/)
  assert.equal(/GRANT SELECT ON ("tenants"|"courses"|"course_runs")/.test(migration), false)
})
test('filters by active tenant, exact host, exact slug, public visibility and publishable status', () => {
  for (const contract of [
    /t\."active" = true/,
    /cr\."share_slug" = request_slug/,
    /cr\."publication_access" IN \('public', 'unlisted'\)/,
    /cr\."status"::text IN \('published', 'enrollment_open'\)/,
    /c\."active" = true/,
    /c\."tenant_id" = t\."id"/,
    /cr\."tenant_id" = t\."id"/,
  ]) assert.match(migration, contract)
})

test('is Next-only, monotonic and registered after runtime offer access', () => {
  assert.match(migration, /assertAkademateNextRuntime\(process\.env\.AKADEMATE_RUNTIME\)/)
  assert.match(migration, /resolveNextDatabaseAppRole/)
  assert.match(wrapper, /export \{ down, up \}/)
  const access = index.indexOf("name: '20260803_akademate_next_offer_runtime_access'")
  const projection = index.indexOf("name: '20260803_akademate_next_public_offer_projection'")
  assert.ok(access >= 0 && projection > access)
})
