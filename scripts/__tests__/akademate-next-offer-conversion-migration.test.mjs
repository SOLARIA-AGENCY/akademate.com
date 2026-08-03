import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = new URL(
  '../../apps/tenant-admin/migrations/20260803_akademate_next_offer_conversion_modes.ts',
  import.meta.url
)
const indexPath = new URL('../../apps/tenant-admin/migrations/index.ts', import.meta.url)

test('adds one append-only Next migration for offer conversion modes', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /assertAkademateNextRuntime/)
  assert.match(source, /ADD COLUMN "publication_access"/)
  assert.match(source, /ADD COLUMN "conversion_mode"/)
  assert.match(source, /course_runs_tenant_share_slug_unique/)
})

test('enforces form, redirect and payment mode invariants in PostgreSQL', async () => {
  const source = await readFile(migrationPath, 'utf8')
  for (const constraint of [
    'course_runs_public_share_slug_check',
    'course_runs_form_mode_check',
    'course_runs_external_action_check',
    'course_runs_payment_mode_check',
    'course_runs_capacity_policy_check',
  ]) {
    assert.match(source, new RegExp(constraint))
  }
  assert.match(source, /"external_action_url" IS NOT NULL/)
  assert.match(source, /"payment_plan" IS NOT NULL/)
  assert.match(source, /ADD COLUMN "offer_price_amount" numeric\(12, 2\)/)
  assert.equal(source.includes('"price_snapshot"'), false)
  assert.match(source, /"offer_price_amount" IS NOT NULL/)
  assert.match(source, /"deposit_amount" IS NOT NULL/)
  assert.match(source, /"deposit_amount" < "offer_price_amount"/)
})

test('refuses destructive rollback while configured offers exist', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(
    source,
    /Cannot roll back offer conversion modes while configured course offers exist/
  )
  assert.ok(source.indexOf('Cannot roll back') < source.indexOf('DROP COLUMN "publication_access"'))
})

test('registers the migration only in the Next migration list', async () => {
  const source = await readFile(indexPath, 'utf8')
  const marker = "name: '20260803_akademate_next_offer_conversion_modes'"
  assert.equal(source.split(marker).length - 1, 1)
  assert.ok(source.indexOf(marker) > source.indexOf('const nextMigrations = ['))
})
