import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { NextEnrollmentCancellationError } from './enrollment-cancellation-command.ts'
import { createEnrollmentCancellationHandlers } from './enrollment-cancellation-handler.ts'

const identity = { userId: 41, tenantId: 7 }
const result = {
  enrollmentId: 501,
  status: 'cancelled' as const,
  promotedEnrollmentId: 502,
  replayed: false,
  capacityReleased: true,
  financialFollowUpRequired: false,
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => identity,
    cancel: async () => result,
    ...overrides,
  }
}

const context = { params: Promise.resolve({ id: '501' }) }

test('accepts only cancellation intent and never client capacity or payment state', async () => {
  const calls: unknown[] = []
  const handlers = createEnrollmentCancellationHandlers(dependencies({
    cancel: async (input: unknown) => {
      calls.push(input)
      return result
    },
  }))
  const response = await handlers.POST(new Request('https://academy.test/api/next/enrollments/501/cancel', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ cancellationType: 'cancelled', reason: 'Cambio de disponibilidad personal.' }),
  }), context)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), result)
  assert.deepEqual(calls, [{
    identity,
    enrollmentId: '501',
    cancellationType: 'cancelled',
    reason: 'Cambio de disponibilidad personal.',
  }])

  for (const injected of [
    { cancellationType: 'cancelled', reason: 'Motivo operativo válido.', tenantId: 9 },
    { cancellationType: 'cancelled', reason: 'Motivo operativo válido.', paymentStatus: 'refunded' },
    { cancellationType: 'cancelled', reason: 'Motivo operativo válido.', currentEnrollments: 0 },
  ]) {
    const rejected = await handlers.POST(new Request('https://academy.test/api/next/enrollments/501/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(injected),
    }), context)
    assert.equal(rejected.status, 400)
  }
})

test('fails closed outside Next, without auth, with query input or malformed JSON', async () => {
  for (const [overrides, url, expected] of [
    [{ runtime: () => 'cep' }, 'https://academy.test/api/next/enrollments/501/cancel', 404],
    [{ enabled: () => false }, 'https://academy.test/api/next/enrollments/501/cancel', 404],
    [{ authenticate: async () => null }, 'https://academy.test/api/next/enrollments/501/cancel', 401],
    [{}, 'https://academy.test/api/next/enrollments/501/cancel?tenantId=9', 400],
  ] as const) {
    const handlers = createEnrollmentCancellationHandlers(dependencies(overrides))
    const response = await handlers.POST(new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cancellationType: 'cancelled', reason: 'Motivo operativo válido.' }),
    }), context)
    assert.equal(response.status, expected)
  }

  const handlers = createEnrollmentCancellationHandlers(dependencies())
  const malformed = await handlers.POST(new Request('https://academy.test/api/next/enrollments/501/cancel', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  }), context)
  assert.equal(malformed.status, 400)
})

test('maps authorization, lifecycle, capacity, infrastructure and retry conflicts', async () => {
  const cases: Array<[unknown, number, string]> = [
    [new NextEnrollmentCancellationError('enrollment_cancellation_request_invalid'), 400, 'request_invalid'],
    [new NextEnrollmentCancellationError('enrollment_cancellation_forbidden'), 403, 'forbidden'],
    [new NextEnrollmentCancellationError('enrollment_not_found'), 404, 'not_found'],
    [new NextEnrollmentCancellationError('enrollment_cancellation_not_available'), 409, 'cancellation_not_available'],
    [new NextEnrollmentCancellationError('enrollment_capacity_inconsistent'), 409, 'capacity_inconsistent'],
    [new NextLearningInfrastructureError('principal_inactive_or_mismatched'), 401, 'unauthorized'],
    [Object.assign(new Error('serialization'), { code: '40001' }), 409, 'retryable_conflict'],
  ]
  for (const [error, status, code] of cases) {
    const handlers = createEnrollmentCancellationHandlers(dependencies({
      cancel: async () => { throw error },
    }))
    const response = await handlers.POST(new Request('https://academy.test/api/next/enrollments/501/cancel', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cancellationType: 'cancelled', reason: 'Motivo operativo válido.' }),
    }), context)
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error: code })
  }
})
