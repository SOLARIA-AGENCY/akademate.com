import assert from 'node:assert/strict'
import test from 'node:test'

import { NextEnrollmentDetailError, type NextEnrollmentDetail } from './enrollment-detail-command.ts'
import { createEnrollmentDetailHandlers } from './enrollment-detail-handler.ts'

const identity = { userId: 41, tenantId: 7 }
const detail: NextEnrollmentDetail = {
  id: 501,
  status: 'confirmed',
  payment_status: 'pending',
  total_amount: 0,
  amount_paid: 0,
  financial_aid_applied: false,
  financial_aid_amount: 0,
  financial_aid_status: null,
  notes: null,
  cancellation_reason: null,
  enrolled_at: '2026-08-03T10:00:00.000Z',
  confirmed_at: null,
  completed_at: null,
  cancelled_at: null,
  lead: { id: 301, first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.test', phone: '' },
  course_run: {
    id: 12,
    code: 'QA-RUN',
    status: 'enrollment_open',
    start_date: '2099-09-12T09:00:00.000Z',
    end_date: '2099-09-13T17:00:00.000Z',
    max_students: 24,
    current_enrollments: 17,
  },
  course: { id: 2, name: 'Applied Learning Lab' },
  campus: { id: null, name: null },
}
const context = { params: Promise.resolve({ id: '501' }) }

function dependencies(overrides: Record<string, unknown> = {}) {
  return {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => identity,
    read: async () => detail,
    ...overrides,
  }
}

test('authenticates and reads without client tenant input', async () => {
  const calls: unknown[] = []
  const handlers = createEnrollmentDetailHandlers(dependencies({ read: async (input: unknown) => {
    calls.push(input)
    return detail
  } }))
  const response = await handlers.GET(new Request('https://academy.test/api/next/enrollments/501'), context)
  assert.equal(response.status, 200)
  assert.deepEqual(calls, [{ identity, enrollmentId: '501' }])
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})

test('fails closed outside Next and maps missing or forbidden rows', async () => {
  for (const [overrides, url, expected] of [
    [{ runtime: () => 'cep' }, 'https://academy.test/api/next/enrollments/501', 404],
    [{}, 'https://academy.test/api/next/enrollments/501?tenantId=9', 400],
    [{ authenticate: async () => null }, 'https://academy.test/api/next/enrollments/501', 401],
    [{ read: async () => { throw new NextEnrollmentDetailError('enrollment_not_found') } }, 'https://academy.test/api/next/enrollments/501', 404],
    [{ read: async () => { throw new NextEnrollmentDetailError('enrollment_detail_forbidden') } }, 'https://academy.test/api/next/enrollments/501', 403],
  ] as const) {
    const handlers = createEnrollmentDetailHandlers(dependencies(overrides))
    const response = await handlers.GET(new Request(url), context)
    assert.equal(response.status, expected)
  }
})
