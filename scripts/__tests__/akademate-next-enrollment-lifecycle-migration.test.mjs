import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = 'apps/tenant-admin/migrations/20260803_zzzz_akademate_next_enrollment_lifecycle.ts'

test('adds a tenant-scoped immutable enrollment lifecycle ledger', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /enrollments_tenant_id_id_unique/)
  assert.match(source, /CREATE TABLE "enrollment_lifecycle_events"/)
  assert.match(source, /FOREIGN KEY \("tenant_id", "enrollment_id"\)/)
  assert.match(source, /ENABLE ROW LEVEL SECURITY/)
  assert.match(source, /FORCE ROW LEVEL SECURITY/)
  assert.match(source, /GRANT SELECT ON "enrollment_lifecycle_events"/)
  assert.doesNotMatch(source, /GRANT (INSERT|UPDATE|DELETE) ON "enrollment_lifecycle_events"/)
})

test('cancels, reconciles capacity and promotes one oldest waiter in one locked command', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /akademate_next_cancel_enrollment/)
  assert.match(source, /SECURITY DEFINER/)
  assert.match(source, /FROM public\."enrollments" enrollment[\s\S]*FOR UPDATE/)
  assert.match(source, /FROM public\."course_runs" run[\s\S]*FOR UPDATE/)
  assert.match(source, /current_enrollments" = "current_enrollments" - 1/)
  assert.match(source, /status" = 'confirmed'/)
  assert.match(source, /ORDER BY candidate\."enrolled_at" ASC NULLS LAST, candidate\."id" ASC/)
  assert.match(source, /LIMIT 1[\s\S]*FOR UPDATE SKIP LOCKED/)
  assert.match(source, /financial_follow_up_required/)
  assert.doesNotMatch(source, /SET "payment_status"/)
})

test('registers the append-only migration and refuses destructive rollback with ledger data', async () => {
  const [migration, index, reexport] = await Promise.all([
    readFile(migrationPath, 'utf8'),
    readFile('apps/tenant-admin/migrations/index.ts', 'utf8'),
    readFile('apps/tenant-admin/migrations-next/20260803_zzzz_akademate_next_enrollment_lifecycle.ts', 'utf8'),
  ])
  assert.match(migration, /Cannot roll back enrollment lifecycle while lifecycle events exist/)
  assert.ok(index.indexOf("name: '20260803_zzzz_akademate_next_enrollment_lifecycle'") > index.indexOf("name: '20260803_zzz_akademate_next_offer_enrollment_conversion'"))
  assert.match(reexport, /export \{ down, up \}/)
})
