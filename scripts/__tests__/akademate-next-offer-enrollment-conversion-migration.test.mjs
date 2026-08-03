import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationPath = 'apps/tenant-admin/migrations/20260803_zzz_akademate_next_offer_enrollment_conversion.ts'

test('adds tenant ownership and an immutable submission link to canonical enrollments', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /ALTER TABLE "enrollments"[\s\S]*ADD COLUMN "tenant_id" integer/)
  assert.match(source, /ADD COLUMN "offer_submission_id" bigint/)
  assert.match(source, /enrollments_offer_submission_unique/)
  assert.match(source, /enrollments_tenant_student_run_unique/)
  assert.match(source, /REFERENCES "offer_submissions"\("tenant_id", "id"\)/)
  assert.match(source, /REFERENCES "course_runs"\("tenant_id", "id"\)/)
  assert.match(source, /REFERENCES "leads"\("tenant_id", "id"\)/)
})

test('converts only approved registration submissions under one locked transaction', async () => {
  const source = await readFile(migrationPath, 'utf8')
  assert.match(source, /akademate_next_convert_offer_submission_to_enrollment/)
  assert.match(source, /SECURITY DEFINER/)
  assert.match(source, /akademate_next_can_review_offer_submissions/)
  assert.match(source, /current_submission\.status <> 'approved'/)
  assert.match(source, /conversion_mode::text NOT IN \('approval_required', 'free_registration'\)/)
  assert.match(source, /FROM public\."course_runs"[\s\S]*FOR UPDATE/)
  assert.match(source, /capacity_policy::text = 'limited'/)
  assert.match(source, /capacity_policy::text = 'waitlist'/)
  assert.match(source, /UPDATE public\."course_runs"[\s\S]*"current_enrollments" = "current_enrollments" \+ 1/)
  assert.match(source, /existing_enrollment\."id" IS NOT NULL[\s\S]*true, existing_enrollment\."status" = 'confirmed'/)
  assert.doesNotMatch(source, /WHEN unique_violation/)
})

test('grants only command execution and refuses destructive rollback with converted data', async () => {
  const [migration, index, reexport] = await Promise.all([
    readFile(migrationPath, 'utf8'),
    readFile('apps/tenant-admin/migrations/index.ts', 'utf8'),
    readFile('apps/tenant-admin/migrations-next/20260803_zzz_akademate_next_offer_enrollment_conversion.ts', 'utf8'),
  ])
  assert.match(migration, /GRANT EXECUTE ON FUNCTION "akademate_next_convert_offer_submission_to_enrollment"/)
  assert.doesNotMatch(migration, /GRANT (INSERT|UPDATE|DELETE) ON "enrollments"/)
  assert.match(migration, /Cannot roll back offer enrollment conversion while converted enrollments exist/)
  assert.ok(index.indexOf("name: '20260803_zzz_akademate_next_offer_enrollment_conversion'") > index.indexOf("name: '20260803_zz_akademate_next_offer_submission_review'"))
  assert.match(reexport, /export \{ down, up \}/)
})
