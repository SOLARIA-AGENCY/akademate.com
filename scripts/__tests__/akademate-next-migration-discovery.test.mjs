import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const nextDir = path.join(root, 'apps/tenant-admin/migrations-next')
const payloadConfigText = readFileSync(
  path.join(root, 'apps/tenant-admin/src/payload.config.ts'),
  'utf8',
)

const EXPECTED_NEXT_MIGRATIONS = [
  '20251207_081627.ts',
  '20260428_students_tenant.ts',
  '20260730_akademate_next_learning.ts',
  '20260731_akademate_next_message_consistency.ts',
  '20260802_akademate_next_signage.ts',
  '20260803_akademate_next_offer_conversion_modes.ts',
  '20260803_akademate_next_offer_runtime_access.ts',
  '20260803_akademate_next_public_offer_projection.ts',
  '20260803_akademate_next_public_offer_submissions.ts',
  '20260803_zz_akademate_next_offer_submission_review.ts',
  '20260803_zzz_akademate_next_offer_enrollment_conversion.ts',
]

test('exposes an exact physical migration directory to the Payload Next runtime', () => {
  assert.deepEqual(
    readdirSync(nextDir).filter((file) => file.endsWith('.ts')).sort(),
    EXPECTED_NEXT_MIGRATIONS,
  )
})

test('routes Payload migration discovery through the exact runtime boundary', () => {
  assert.match(
    payloadConfigText,
    /migrationDir:\s*path\.resolve\(\s*__dirname,\s*isAkademateNextRuntime\(runtime\)[\s\S]*?migrations-next[\s\S]*?migrations/,
  )
})

test('keeps every Next migration wrapper free of CEP and legacy-only imports', () => {
  for (const file of EXPECTED_NEXT_MIGRATIONS) {
    const text = readFileSync(path.join(nextDir, file), 'utf8')
    assert.equal(/cep|staging|campus_virtual|planning_v1/i.test(text), false, file)
    assert.match(text, /^export \{ down, up \} from '\.\.\/migrations\/[A-Za-z0-9_]+'\s*$/)
  }
})
