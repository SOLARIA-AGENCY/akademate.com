import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'
import { NextEnrollmentDetailError, getNextEnrollmentDetail } from './enrollment-detail-command.ts'

const principal: NextLearningPrincipal = { userId: 41, tenantId: 7, active: true, platformRole: 'gestor' }

function fakeClient(rows: Record<string, unknown>[]) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const client: LearningSqlClient = {
    async unsafe<T extends Record<string, unknown>>(query: string, params: unknown[] = []) {
      calls.push({ query: query.replace(/\s+/g, ' ').trim(), params })
      return rows as T[]
    },
  }
  return { calls, client }
}

test('reads one tenant-scoped enrollment projection for the dashboard', async () => {
  const { calls, client } = fakeClient([{
    id: 501, status: 'confirmed', payment_status: 'pending', total_amount: '0', amount_paid: '0',
    financial_aid_applied: false, financial_aid_amount: '0', financial_aid_status: null,
    notes: null, cancellation_reason: null, enrolled_at: '2026-08-03T10:00:00.000Z',
    confirmed_at: null, completed_at: null, cancelled_at: null,
    student_id: 301, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.test', phone: '',
    course_run_id: 12, course_run_code: 'QA-RUN', course_run_status: 'enrollment_open',
    course_run_start_date: '2099-09-12T09:00:00.000Z', course_run_end_date: '2099-09-13T17:00:00.000Z',
    max_students: '24', current_enrollments: '17', course_id: 2, course_name: 'Applied Learning Lab',
    campus_id: null, campus_name: null,
  }])
  const result = await getNextEnrollmentDetail({ tx: client, principal, enrollmentId: '501' })
  assert.deepEqual(calls[0]?.params, [501, 7])
  assert.match(calls[0]?.query ?? '', /enrollment\.tenant_id = \$2/)
  assert.equal(result.id, 501)
  assert.equal(result.lead.first_name, 'Ada')
  assert.equal(result.course_run.current_enrollments, 17)
})

test('rejects non-reviewers and malformed ids before SQL, and hides missing rows', async () => {
  for (const input of [
    { principal: { ...principal, platformRole: 'marketing' }, enrollmentId: '501' },
    { principal, enrollmentId: '0' },
  ]) {
    const { calls, client } = fakeClient([])
    await assert.rejects(
      getNextEnrollmentDetail({ tx: client, principal: input.principal, enrollmentId: input.enrollmentId }),
      (error: unknown) => error instanceof NextEnrollmentDetailError,
    )
    assert.equal(calls.length, 0)
  }
  const { client } = fakeClient([])
  await assert.rejects(
    getNextEnrollmentDetail({ tx: client, principal, enrollmentId: 501 }),
    (error: unknown) => error instanceof NextEnrollmentDetailError && error.code === 'enrollment_not_found',
  )
})
