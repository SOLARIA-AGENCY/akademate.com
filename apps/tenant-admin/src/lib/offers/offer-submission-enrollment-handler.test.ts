import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { NextOfferSubmissionEnrollmentError } from './offer-submission-enrollment-command.ts'
import { createOfferSubmissionEnrollmentHandlers } from './offer-submission-enrollment-handler.ts'

const identity = { userId: 41, tenantId: 7 }
const result = {
  submissionId: 91,
  enrollmentId: 501,
  learnerId: 301,
  status: 'confirmed' as const,
  replayed: false,
  capacityReserved: true,
}

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => identity,
    convert: async () => result,
    ...overrides,
  }
}

const context = { params: Promise.resolve({ id: '91' }) }

test('authenticates then converts without accepting client enrollment data', async () => {
  const calls: unknown[] = []
  const handlers = createOfferSubmissionEnrollmentHandlers(dependencies({
    authenticate: async () => {
      calls.push('authenticate')
      return identity
    },
    convert: async (input: unknown) => {
      calls.push(input)
      return result
    },
  }))
  const response = await handlers.POST(new Request('https://academy.test/api/next/offer-submissions/91/enrollment', {
    method: 'POST',
  }), context)
  assert.equal(response.status, 201)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), result)
  assert.deepEqual(calls, ['authenticate', { identity, submissionId: '91' }])
})

test('returns 200 for an idempotent replay', async () => {
  const handlers = createOfferSubmissionEnrollmentHandlers(dependencies({
    convert: async () => ({ ...result, replayed: true }),
  }))
  const response = await handlers.POST(new Request('https://academy.test/api/next/offer-submissions/91/enrollment', {
    method: 'POST',
  }), context)
  assert.equal(response.status, 200)
})

test('fails closed before authentication outside Next or with query/body input', async () => {
  for (const input of [
    { runtime: () => 'cep', url: 'https://academy.test/api/next/offer-submissions/91/enrollment' },
    { enabled: () => false, url: 'https://academy.test/api/next/offer-submissions/91/enrollment' },
    { url: 'https://academy.test/api/next/offer-submissions/91/enrollment?tenantId=9' },
  ]) {
    let authenticated = false
    const handlers = createOfferSubmissionEnrollmentHandlers(dependencies({
      ...input,
      authenticate: async () => {
        authenticated = true
        return identity
      },
    }))
    const response = await handlers.POST(new Request(input.url, { method: 'POST' }), context)
    assert.equal(response.status, input.url.includes('?') ? 400 : 404)
    assert.equal(authenticated, false)
  }

  const handlers = createOfferSubmissionEnrollmentHandlers(dependencies())
  const response = await handlers.POST(new Request('https://academy.test/api/next/offer-submissions/91/enrollment', {
    method: 'POST',
    body: '{}',
    headers: { 'content-type': 'application/json' },
  }), context)
  assert.equal(response.status, 400)
})

test('maps authorization, lifecycle, capacity and retryable conflicts', async () => {
  const cases: Array<[unknown, number, string]> = [
    [new NextOfferSubmissionEnrollmentError('submission_id_invalid'), 400, 'request_invalid'],
    [new NextOfferSubmissionEnrollmentError('submission_enrollment_forbidden'), 403, 'forbidden'],
    [new NextOfferSubmissionEnrollmentError('submission_not_found'), 404, 'not_found'],
    [new NextOfferSubmissionEnrollmentError('submission_not_approved'), 409, 'approval_required'],
    [new NextOfferSubmissionEnrollmentError('submission_enrollment_not_available'), 409, 'enrollment_not_available'],
    [new NextOfferSubmissionEnrollmentError('submission_capacity_full'), 409, 'capacity_full'],
    [new NextLearningInfrastructureError('principal_inactive_or_mismatched'), 401, 'unauthorized'],
    [Object.assign(new Error('serialization'), { code: '40001' }), 409, 'retryable_conflict'],
  ]
  for (const [error, status, code] of cases) {
    const handlers = createOfferSubmissionEnrollmentHandlers(dependencies({
      convert: async () => { throw error },
    }))
    const response = await handlers.POST(new Request('https://academy.test/api/next/offer-submissions/91/enrollment', {
      method: 'POST',
    }), context)
    assert.equal(response.status, status)
    assert.deepEqual(await response.json(), { error: code })
  }
})
