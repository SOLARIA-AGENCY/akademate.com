import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../../apps/tenant-admin/migrations/20260803_zzzzzz_akademate_next_dashboard_projection.ts',
  import.meta.url,
)
const leastPrivilegeMigrationUrl = new URL(
  '../../apps/tenant-admin/migrations/20260803_zzzzzzz_akademate_next_dashboard_least_privilege.ts',
  import.meta.url,
)

test('dashboard migration exposes one tenant-context projection without direct table grants', async () => {
  const source = await readFile(migrationUrl, 'utf8')

  assert.match(source, /CREATE FUNCTION "akademate_next_get_dashboard"\(\) RETURNS jsonb/)
  assert.match(source, /current_setting\('app\.tenant_id', true\)/)
  assert.match(source, /current_setting\('app\.role', true\)/)
  assert.match(source, /SECURITY DEFINER/)
  assert.match(source, /SET search_path = public, pg_temp/)
  assert.match(source, /REVOKE ALL ON FUNCTION "akademate_next_get_dashboard"\(\) FROM PUBLIC/)
  assert.match(source, /GRANT EXECUTE ON FUNCTION "akademate_next_get_dashboard"\(\)/)
  assert.doesNotMatch(source, /GRANT SELECT ON "(students|staff|offer_submissions|paid_offer_orders)"/)
})

test('dashboard projection is bounded and every aggregate is explicitly tenant scoped', async () => {
  const source = await readFile(migrationUrl, 'utf8')

  assert.match(source, /WHERE c\."tenant_id" = resolved_tenant_id/)
  assert.match(source, /WHERE s\."tenant_id" = resolved_tenant_id/)
  assert.match(source, /WHERE staff\."tenant_id" = resolved_tenant_id/)
  assert.match(source, /WHERE cr\."tenant_id" = resolved_tenant_id/)
  assert.match(source, /WHERE os\."tenant_id" = resolved_tenant_id/)
  assert.match(source, /WHERE po\."tenant_id" = resolved_tenant_id/)
  assert.match(source, /LIMIT 5/)
  assert.match(source, /assertAkademateNextRuntime/)
})

test('dashboard hardening removes direct profile-table access from the application role', async () => {
  const source = await readFile(leastPrivilegeMigrationUrl, 'utf8')

  assert.match(source, /assertAkademateNextRuntime/)
  assert.match(source, /REVOKE ALL ON "students" FROM PUBLIC/)
  assert.match(source, /REVOKE ALL ON "staff" FROM PUBLIC/)
  assert.match(source, /REVOKE ALL ON "students" FROM \$\{applicationRoleIdentifier\}/)
  assert.match(source, /REVOKE ALL ON "staff" FROM \$\{applicationRoleIdentifier\}/)
  const upBody = source.slice(source.indexOf('export async function up'), source.indexOf('export async function down'))
  assert.doesNotMatch(upBody, /GRANT (SELECT|INSERT|UPDATE|DELETE).*"(students|staff)"/)
})
