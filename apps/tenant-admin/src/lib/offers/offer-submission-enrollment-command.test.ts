import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionEnrollmentError,
  convertNextOfferSubmissionToEnrollment,
} from './offer-submission-enrollment-command.ts'

type Row = Record<string, unknown>

const principal: NextLearningPrincipal = {
  userId: 41,
  tenantId: 7,
  active: true,
  platformRole: 'gestor',
}

function fakeClient(respond: (query: string, params: unknown[]) => Row[]) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const client: LearningSqlClient = {
    async unsafe<T extends Row>(query: string, params: unknown[] = []) {
      const normalized = query.replace(/\s+/g, ' ').trim()
      calls.push({ query: normalized, params })
      return respond(normalized, params) as T[]
    },
  }
  return { calls, client }
}

test('executes one database command and maps a confirmed capacity reservation', async () => {
  const { calls, client } = fakeClient(() => [{
    submission_id: 91,
    enrollment_id: 501,
    learner_id: 301,
    enrollment_status: 'confirmed',
    replayed: false,
    capacity_reserved: true,
  }])
  const result = await convertNextOfferSubmissionToEnrollment({
    tx: client,
    principal,
    submissionId: '91',
  })
  assert.deepEqual(calls[0]?.params, [91])
  assert.match(calls[0]?.query ?? '', /akademate_next_convert_offer_submission_to_enrollment\(\$1\)/)
  assert.deepEqual(result, {
    submissionId: 91,
    enrollmentId: 501,
    learnerId: 301,
    status: 'confirmed',
    replayed: false,
    capacityReserved: true,
  })
})

test('maps an idempotent waitlist replay without changing capacity', async () => {
  const { client } = fakeClient(() => [{
    submission_id: 91,
    enrollment_id: 502,
    learner_id: 302,
    enrollment_status: 'waitlisted',
    replayed: true,
    capacity_reserved: false,
  }])
  assert.deepEqual(await convertNextOfferSubmissionToEnrollment({
    tx: client,
    principal,
    submissionId: 91,
  }), {
    submissionId: 91,
    enrollmentId: 502,
    learnerId: 302,
    status: 'waitlisted',
    replayed: true,
    capacityReserved: false,
  })
})

test('rejects unauthorized roles and malformed identifiers before SQL', async () => {
  for (const input of [
    { principal: { ...principal, platformRole: 'marketing' }, submissionId: '91' },
    { principal, submissionId: '0' },
    { principal, submissionId: '1e2' },
  ]) {
    const { calls, client } = fakeClient(() => { throw new Error('must not execute') })
    await assert.rejects(
      convertNextOfferSubmissionToEnrollment({
        tx: client,
        principal: input.principal,
        submissionId: input.submissionId,
      }),
      (error: unknown) => error instanceof NextOfferSubmissionEnrollmentError,
    )
    assert.equal(calls.length, 0)
  }
})

test('fails closed for malformed persistence results and maps database decisions', async () => {
  for (const rows of [
    [],
    [{ submission_id: 91, enrollment_id: 1 }],
    [{
      submission_id: 92,
      enrollment_id: 1,
      learner_id: 2,
      enrollment_status: 'confirmed',
      replayed: false,
      capacity_reserved: true,
    }],
  ]) {
    const { client } = fakeClient(() => rows)
    await assert.rejects(
      convertNextOfferSubmissionToEnrollment({ tx: client, principal, submissionId: 91 }),
      (error: unknown) => error instanceof NextOfferSubmissionEnrollmentError
        && error.code === 'submission_enrollment_persistence_invalid',
    )
  }

  for (const [message, code] of [
    ['offer_submission_enrollment_forbidden', 'submission_enrollment_forbidden'],
    ['offer_submission_not_found', 'submission_not_found'],
    ['offer_submission_not_approved', 'submission_not_approved'],
    ['offer_submission_enrollment_not_available', 'submission_enrollment_not_available'],
    ['offer_submission_capacity_full', 'submission_capacity_full'],
  ] as const) {
    const { client } = fakeClient(() => { throw new Error(message) })
    await assert.rejects(
      convertNextOfferSubmissionToEnrollment({ tx: client, principal, submissionId: 91 }),
      (error: unknown) => error instanceof NextOfferSubmissionEnrollmentError
        && error.code === code,
    )
  }
})
