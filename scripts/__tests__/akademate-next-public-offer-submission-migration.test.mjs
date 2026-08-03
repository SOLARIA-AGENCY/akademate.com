import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = 'apps/tenant-admin/migrations/20260803_akademate_next_public_offer_submissions.ts'
const source = await readFile(migrationPath, 'utf8')

test('creates a Next-only tenant-scoped submission ledger with no public grants', () => {
  assert.match(source, /CREATE TABLE "offer_submissions"/)
  assert.match(source, /tenant_id.*NOT NULL/)
  assert.match(source, /course_run_id.*NOT NULL/)
  assert.match(source, /privacy_notice_version.*NOT NULL/)
  assert.match(source, /idempotency.*UNIQUE/)
  assert.match(source, /ENABLE ROW LEVEL SECURITY/)
  assert.match(source, /FORCE ROW LEVEL SECURITY/)
  assert.match(source, /REVOKE ALL ON "offer_submissions" FROM \$\{applicationRoleIdentifier\}/)
  assert.match(source, /GRANT SELECT ON "offer_submissions" TO \$\{applicationRoleIdentifier\}/)
  assert.doesNotMatch(source, /GRANT INSERT ON "offer_submissions"/)
})

test('limits the public command to consented actionable modes, idempotency and rate control', () => {
  assert.match(source, /akademate_next_submit_public_offer/)
  assert.match(source, /SECURITY DEFINER/)
  assert.match(source, /interest_form.*approval_required.*free_registration/s)
  assert.match(source, /public_offer_submission_not_available/)
  assert.match(source, /public_offer_submission_idempotency_conflict/)
  assert.match(source, /public_offer_submission_rate_limited/)
  assert.match(source, /privacy_accepted IS DISTINCT FROM true/)
  assert.match(source, /created_at.*interval '1 hour'/s)
})

test('is append-only after the public projection and rollback is data-safe', async () => {
  const index = await readFile('apps/tenant-admin/migrations/index.ts', 'utf8')
  assert.ok(index.indexOf("name: '20260803_akademate_next_public_offer_submissions'") > index.indexOf("name: '20260803_akademate_next_public_offer_projection'"))
  assert.match(source, /Cannot roll back public offer submissions while submission data exists/)
  assert.match(source, /assertAkademateNextRuntime/)
})
