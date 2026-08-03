import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = new URL(
  '../../apps/tenant-admin/migrations/20260803_akademate_next_offer_runtime_access.ts',
  import.meta.url,
)
const indexPath = new URL('../../apps/tenant-admin/migrations/index.ts', import.meta.url)

test('adds a monotonic Next-only offer command access migration', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /assertAkademateNextRuntime/)
  assert.match(source, /ALTER TABLE "courses" ALTER COLUMN "tenant_id" SET NOT NULL/)
  assert.match(source, /ALTER TABLE "course_runs" ALTER COLUMN "tenant_id" SET NOT NULL/)
  assert.match(source, /FORCE ROW LEVEL SECURITY/)
})

test('keeps tenant isolation restrictive and manager access explicit', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /courses_offer_tenant_isolation/)
  assert.match(source, /course_runs_offer_tenant_isolation/)
  assert.match(source, /AS RESTRICTIVE FOR ALL/)
  assert.match(source, /IN \('superadmin', 'admin', 'gestor', 'marketing'\)/)
  assert.match(source, /GRANT UPDATE \(/)
  assert.equal(/GRANT (INSERT|DELETE).*course_runs/.test(source), false)
})

test('refuses to remove the database authorization boundary under academy data', async () => {
  const source = await readFile(migrationPath, 'utf8')
  const guard = source.indexOf('Cannot roll back offer runtime access while academy offer data exists')
  const policyDrop = source.indexOf('DROP POLICY "course_runs_offer_update"')
  assert.ok(guard >= 0)
  assert.ok(guard < policyDrop)
})

test('registers runtime access after offer conversion in the Next list', async () => {
  const source = await readFile(indexPath, 'utf8')
  const conversion = "name: '20260803_akademate_next_offer_conversion_modes'"
  const access = "name: '20260803_akademate_next_offer_runtime_access'"
  assert.equal(source.split(access).length - 1, 1)
  assert.ok(source.indexOf(access) > source.indexOf(conversion))
  assert.ok(source.indexOf(access) > source.indexOf('const nextMigrations = ['))
})
