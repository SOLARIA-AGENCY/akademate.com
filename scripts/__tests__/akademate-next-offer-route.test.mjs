import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const route = readFileSync(path.join(
  root,
  'apps/tenant-admin/app/api/next/course-runs/[id]/offer/route.ts',
), 'utf8')
const handler = readFileSync(path.join(
  root,
  'apps/tenant-admin/src/lib/offers/offer-configuration-handler.ts',
), 'utf8')

test('wires the offer route only to the dedicated Next session and transaction boundary', () => {
  assert.match(route, /authenticateNextLearningRequest/)
  assert.match(route, /withNextLearningTransaction/)
  assert.equal(route.includes('getAuthenticatedUserContext'), false)
  assert.equal(route.includes('cep_session'), false)
  assert.equal(route.includes('/api/leads/_lib/auth'), false)
  assert.equal(route.toLowerCase().includes('cepformacion'), false)
})

test('keeps offer configuration default-off behind an exact flag and runtime', () => {
  assert.match(route, /AKADEMATE_NEXT_OFFERS_ENABLED === 'true'/)
  assert.match(handler, /dependencies\.runtime\(\) === 'next' && dependencies\.enabled\(\)/)
})

test('exposes only read and bounded update methods', () => {
  assert.match(route, /export const GET = handlers\.GET/)
  assert.match(route, /export const PATCH = handlers\.PATCH/)
  assert.equal(/export const (POST|PUT|DELETE)/.test(route), false)
  assert.equal(route.includes('payload.update'), false)
})
