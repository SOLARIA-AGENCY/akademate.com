import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import {
  NextEnrollmentCancellationError,
  cancelNextEnrollment,
} from './enrollment-cancellation-command.ts'

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

test('executes one cancellation command and maps a promoted waitlisted enrollment', async () => {
  const { calls, client } = fakeClient(() => [{
    enrollment_id: 501,
    enrollment_status: 'cancelled',
    promoted_enrollment_id: 502,
    replayed: false,
    capacity_released: true,
    financial_follow_up_required: true,
  }])
  const result = await cancelNextEnrollment({
    tx: client,
    principal,
    enrollmentId: '501',
    cancellationType: 'cancelled',
    reason: 'La persona solicita cancelar su plaza.',
  })
  assert.deepEqual(calls[0]?.params, [501, 'cancelled', 'La persona solicita cancelar su plaza.'])
  assert.match(calls[0]?.query ?? '', /akademate_next_cancel_enrollment\(\$1, \$2, \$3\)/)
  assert.deepEqual(result, {
    enrollmentId: 501,
    status: 'cancelled',
    promotedEnrollmentId: 502,
    replayed: false,
    capacityReleased: true,
    financialFollowUpRequired: true,
  })
})

test('maps an idempotent waitlist withdrawal without capacity or finance changes', async () => {
  const { client } = fakeClient(() => [{
    enrollment_id: 501,
    enrollment_status: 'withdrawn',
    promoted_enrollment_id: null,
    replayed: true,
    capacity_released: false,
    financial_follow_up_required: false,
  }])
  assert.deepEqual(await cancelNextEnrollment({
    tx: client,
    principal,
    enrollmentId: 501,
    cancellationType: 'withdrawn',
    reason: 'Baja solicitada por la persona interesada.',
  }), {
    enrollmentId: 501,
    status: 'withdrawn',
    promotedEnrollmentId: null,
    replayed: true,
    capacityReleased: false,
    financialFollowUpRequired: false,
  })
})

test('rejects unauthorized roles, malformed identifiers and unsafe reasons before SQL', async () => {
  for (const input of [
    { principal: { ...principal, platformRole: 'marketing' }, enrollmentId: '501', reason: 'Motivo operativo válido.' },
    { principal, enrollmentId: '0', reason: 'Motivo operativo válido.' },
    { principal, enrollmentId: '5e2', reason: 'Motivo operativo válido.' },
    { principal, enrollmentId: '501', reason: 'no' },
    { principal, enrollmentId: '501', reason: 'x'.repeat(501) },
  ]) {
    const { calls, client } = fakeClient(() => { throw new Error('must not execute') })
    await assert.rejects(
      cancelNextEnrollment({
        tx: client,
        principal: input.principal,
        enrollmentId: input.enrollmentId,
        cancellationType: 'cancelled',
        reason: input.reason,
      }),
      (error: unknown) => error instanceof NextEnrollmentCancellationError,
    )
    assert.equal(calls.length, 0)
  }
})

test('fails closed for malformed persistence and maps lifecycle decisions', async () => {
  for (const rows of [
    [],
    [{ enrollment_id: 501, enrollment_status: 'cancelled' }],
    [{
      enrollment_id: 502,
      enrollment_status: 'cancelled',
      promoted_enrollment_id: null,
      replayed: false,
      capacity_released: true,
      financial_follow_up_required: false,
    }],
  ]) {
    const { client } = fakeClient(() => rows)
    await assert.rejects(
      cancelNextEnrollment({
        tx: client,
        principal,
        enrollmentId: 501,
        cancellationType: 'cancelled',
        reason: 'Motivo de cancelación correctamente documentado.',
      }),
      (error: unknown) => error instanceof NextEnrollmentCancellationError
        && error.code === 'enrollment_cancellation_persistence_invalid',
    )
  }

  for (const [message, code] of [
    ['enrollment_cancellation_forbidden', 'enrollment_cancellation_forbidden'],
    ['enrollment_not_found', 'enrollment_not_found'],
    ['enrollment_cancellation_not_available', 'enrollment_cancellation_not_available'],
    ['enrollment_capacity_inconsistent', 'enrollment_capacity_inconsistent'],
  ] as const) {
    const { client } = fakeClient(() => { throw new Error(message) })
    await assert.rejects(
      cancelNextEnrollment({
        tx: client,
        principal,
        enrollmentId: 501,
        cancellationType: 'cancelled',
        reason: 'Motivo de cancelación correctamente documentado.',
      }),
      (error: unknown) => error instanceof NextEnrollmentCancellationError && error.code === code,
    )
  }
})
