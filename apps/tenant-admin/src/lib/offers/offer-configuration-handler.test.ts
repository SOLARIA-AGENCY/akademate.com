import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  createOfferConfigurationHandlers,
  type OfferConfigurationHandlerDependencies,
} from './offer-configuration-handler.ts'
import { NextOfferConfigurationError } from './offer-configuration-command.ts'

const identity = { userId: 41, tenantId: 7 }
const offer = {
  courseRunId: 12,
  courseId: 5,
  courseName: 'Creative Leadership',
  code: 'CL-2026-09',
  startsAt: '2026-09-12T09:00:00.000Z',
  endsAt: '2026-09-13T17:00:00.000Z',
  publicationAccess: 'private' as const,
  conversionMode: 'information_only' as const,
  shareSlug: null,
  formTemplateKey: null,
  externalActionUrl: null,
  paymentPlan: null,
  priceAmount: null,
  depositAmount: null,
  ctaLabel: null,
  capacityPolicy: 'limited' as const,
}

function setup(overrides: Partial<OfferConfigurationHandlerDependencies> = {}) {
  const calls = { authenticated: 0, read: 0, update: 0 }
  const dependencies: OfferConfigurationHandlerDependencies = {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => {
      calls.authenticated += 1
      return identity
    },
    read: async () => {
      calls.read += 1
      return offer
    },
    update: async () => {
      calls.update += 1
      return { ...offer, conversionMode: 'free_registration' }
    },
    ...overrides,
  }
  return { calls, handlers: createOfferConfigurationHandlers(dependencies) }
}

const context = { params: Promise.resolve({ id: '12' }) }

function patchRequest(body: unknown, headers: HeadersInit = {}) {
  return new Request('http://localhost/api/next/course-runs/12/offer', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

test('is invisible outside the exact Next runtime or while default-off', async () => {
  for (const overrides of [
    { runtime: () => 'cep' },
    { enabled: () => false },
  ]) {
    const current = setup(overrides)
    const response = await current.handlers.GET(new Request('http://localhost'), context)
    assert.equal(response.status, 404)
    assert.equal(current.calls.authenticated, 0)
    assert.equal(current.calls.read, 0)
  }
})

test('requires a verified Next session for reads and writes', async () => {
  const current = setup({ authenticate: async () => null })
  const get = await current.handlers.GET(new Request('http://localhost'), context)
  const patch = await current.handlers.PATCH(patchRequest({
    publicationAccess: 'private',
    conversionMode: 'information_only',
    capacityPolicy: 'limited',
  }), context)
  assert.equal(get.status, 401)
  assert.equal(patch.status, 401)
  assert.equal(current.calls.read, 0)
  assert.equal(current.calls.update, 0)
})

test('rejects client-supplied identity and unknown fields before authentication', async () => {
  const current = setup()
  const response = await current.handlers.PATCH(patchRequest({
    publicationAccess: 'private',
    conversionMode: 'information_only',
    capacityPolicy: 'limited',
    tenantId: 999,
    userId: 999,
    role: 'superadmin',
  }), context)
  assert.equal(response.status, 400)
  assert.equal(current.calls.authenticated, 0)
  assert.equal(current.calls.update, 0)
})

test('accepts a valid conditional configuration and passes only server identity', async () => {
  const captured: unknown[] = []
  const current = setup({
    update: async (input) => {
      captured.push(input)
      return { ...offer, conversionMode: 'approval_required' }
    },
  })
  const response = await current.handlers.PATCH(patchRequest({
    publicationAccess: 'unlisted',
    conversionMode: 'approval_required',
    shareSlug: 'creative-leadership-weekend',
    formTemplateKey: 'application-standard',
    ctaLabel: 'Apply now',
    capacityPolicy: 'waitlist',
  }), context)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(captured[0], {
    identity,
    courseRunId: '12',
    input: {
      publicationAccess: 'unlisted',
      conversionMode: 'approval_required',
      shareSlug: 'creative-leadership-weekend',
      formTemplateKey: 'application-standard',
      ctaLabel: 'Apply now',
      capacityPolicy: 'waitlist',
    },
  })
})

test('maps authorization, tenant hiding, serialization and infrastructure errors', async () => {
  const cases = [
    { error: new NextOfferConfigurationError('offer_configuration_forbidden'), status: 403 },
    { error: new NextOfferConfigurationError('offer_not_found'), status: 404 },
    { error: new NextLearningInfrastructureError('principal_inactive_or_mismatched'), status: 401 },
    { error: new NextLearningInfrastructureError('database_role_unsafe'), status: 503 },
    { error: Object.assign(new Error('serialization'), { code: '40001' }), status: 409 },
    { error: Object.assign(new Error('duplicate slug'), { code: '23505' }), status: 409 },
  ]

  for (const item of cases) {
    const current = setup({ read: async () => { throw item.error } })
    const response = await current.handlers.GET(new Request('http://localhost'), context)
    assert.equal(response.status, item.status)
  }
})

test('rejects malformed and oversized JSON before authentication', async () => {
  const current = setup()
  const malformed = await current.handlers.PATCH(patchRequest('{not-json'), context)
  const oversized = await current.handlers.PATCH(patchRequest('x'.repeat(32_769)), context)
  assert.equal(malformed.status, 400)
  assert.equal(oversized.status, 413)
  assert.equal(current.calls.authenticated, 0)
})
