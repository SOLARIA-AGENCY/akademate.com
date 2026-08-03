import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const routePath = 'apps/tenant-admin/app/api/next/offer-submissions/route.ts'
const pagePath = 'apps/tenant-admin/app/(app)/(dashboard)/cursos/solicitudes/page.tsx'
const sessionRoutePath = 'apps/tenant-admin/app/api/next/session/route.ts'
const dashboardLayoutPath = 'apps/tenant-admin/app/(app)/(dashboard)/layout.tsx'

test('registers a dedicated authenticated Next route without importing CEP APIs', async () => {
  const source = await readFile(routePath, 'utf8')
  assert.match(source, /authenticateNextLearningRequest/)
  assert.match(source, /withNextLearningTransaction/)
  assert.match(source, /listNextOfferSubmissions/)
  assert.match(source, /AKADEMATE_RUNTIME/)
  assert.match(source, /AKADEMATE_NEXT_OFFERS_ENABLED/)
  assert.doesNotMatch(source, /api\/leads|cep|payload\.find/i)
})

test('uses the dedicated Next session profile with legacy fallback only on not found', async () => {
  const [route, layout] = await Promise.all([
    readFile(sessionRoutePath, 'utf8'),
    readFile(dashboardLayoutPath, 'utf8'),
  ])
  assert.match(route, /authenticateNextLearningRequest/)
  assert.match(route, /getNextSessionProfile/)
  assert.doesNotMatch(route, /cep_session|akademate_session|payload-token/)
  assert.match(layout, /fetch\('\/api\/next\/session'/)
  assert.match(layout, /status === 404/)
  assert.match(layout, /fetch\('\/api\/auth\/session'/)
})

test('renders an authenticated dashboard destination backed by the canonical shared UI', async () => {
  const source = await readFile(pagePath, 'utf8')
  assert.match(source, /@akademate\/ui/)
  assert.match(source, /OfferSubmissionInbox/)
  assert.doesNotMatch(source, /@payload-config\/components\/ui/)
})
