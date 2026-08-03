import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routePath = 'apps/tenant-admin/app/api/next/enrollments/[id]/cancel/route.ts'
const detailRoutePath = 'apps/tenant-admin/app/api/next/enrollments/[id]/route.ts'
const detailPagePath = 'apps/tenant-admin/app/(app)/(dashboard)/matriculas/[id]/page.tsx'

test('registers cancellation through the isolated transactional Next command', async () => {
  const source = await readFile(routePath, 'utf8')
  assert.match(source, /authenticateNextLearningRequest/)
  assert.match(source, /withNextLearningTransaction/)
  assert.match(source, /cancelNextEnrollment/)
  assert.match(source, /AKADEMATE_NEXT_ENROLLMENTS_ENABLED/)
  assert.doesNotMatch(source, /api\/matriculas|payment_status|amount_paid|stripe|paypal|cep|payload\.update/i)
})

test('loads the Next detail first and permits legacy fallback only on not found', async () => {
  const [route, page] = await Promise.all([
    readFile(detailRoutePath, 'utf8'),
    readFile(detailPagePath, 'utf8'),
  ])
  assert.match(route, /authenticateNextLearningRequest/)
  assert.match(route, /withNextLearningTransaction/)
  assert.match(route, /getNextEnrollmentDetail/)
  assert.doesNotMatch(route, /api\/matriculas|cep|payload\.find/i)
  assert.match(page, /fetch\(`\/api\/next\/enrollments\/\$\{id\}`/)
  assert.match(page, /res\.status === 404/)
  assert.match(page, /fetch\(`\/api\/matriculas\/\$\{id\}`/)
})
