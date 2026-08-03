import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = 'apps/tenant-admin/migrations/20260803_zz_akademate_next_offer_submission_review.ts'

test('adds an append-only tenant-scoped review ledger and bounded lifecycle states', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /CREATE TABLE "offer_submission_review_events"/)
  assert.match(source, /approved.*rejected.*archived/s)
  assert.match(source, /ENABLE ROW LEVEL SECURITY/)
  assert.match(source, /FORCE ROW LEVEL SECURITY/)
  assert.match(source, /actor_user_id/)
  assert.match(source, /from_status/)
  assert.match(source, /to_status/)
  assert.doesNotMatch(source, /GRANT (INSERT|UPDATE|DELETE) ON "offer_submission_review_events"/)
})

test('exposes only a security-definer transition command with role and tenant checks', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /akademate_next_review_offer_submission/)
  assert.match(source, /SECURITY DEFINER/)
  assert.match(source, /akademate_next_can_review_offer_submissions/)
  assert.match(source, /current_setting\('app\.tenant_id'/)
  assert.match(source, /current_setting\('app\.user_id'/)
  assert.match(source, /FOR UPDATE/)
  assert.match(source, /offer_submission_transition_invalid/)
  assert.match(source, /offer_submission_rejection_note_required/)
  assert.match(source, /current_submission\.status = requested_status/)
})

test('registers the review migration after public submissions in Next only', async () => {
  const [migration, index, nextReexport] = await Promise.all([
    readFile(migrationPath, 'utf8'),
    readFile('apps/tenant-admin/migrations/index.ts', 'utf8'),
    readFile('apps/tenant-admin/migrations-next/20260803_zz_akademate_next_offer_submission_review.ts', 'utf8'),
  ])
  assert.ok(index.indexOf("name: '20260803_zz_akademate_next_offer_submission_review'") > index.indexOf("name: '20260803_akademate_next_public_offer_submissions'"))
  assert.match(migration, /assertAkademateNextRuntime/)
  assert.match(nextReexport, /export \{ down, up \}/)
  assert.match(migration, /Cannot roll back offer submission review while review events exist/)
})
