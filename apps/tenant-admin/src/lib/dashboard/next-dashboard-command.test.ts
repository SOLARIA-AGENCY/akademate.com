import assert from 'node:assert/strict'
import test from 'node:test'

import { getNextDashboard, NextDashboardError } from './next-dashboard-command.ts'
import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'

const projection = {
  generatedAt: '2026-08-03T16:00:00.000Z',
  metrics: {
    courses: 4,
    activeStudents: 28,
    activeTeachers: 6,
    campuses: 2,
    activeCourseRuns: 3,
    confirmedEnrollments: 24,
    pendingRequests: 5,
  },
  attention: { pendingReview: 2, waitlisted: 1, paymentReview: 0 },
  upcomingRuns: [
    {
      id: 91,
      courseName: 'Creative Leadership',
      code: 'CL-SEP',
      status: 'enrollment_open',
      startsAt: '2026-09-12T09:00:00.000Z',
      availablePlaces: 8,
    },
  ],
  recentActivity: [
    {
      id: 'submission-72',
      kind: 'application',
      title: 'Nueva solicitud recibida',
      detail: 'Creative Leadership',
      occurredAt: '2026-08-03T15:30:00.000Z',
      href: '/dashboard/cursos/solicitudes',
    },
  ],
}

test('loads one bounded dashboard projection without a client supplied tenant selector', async () => {
  const calls: Array<{ query: string; params?: unknown[] }> = []
  const tx: LearningSqlClient = {
    unsafe: async <T extends Record<string, unknown>>(query: string, params?: unknown[]) => {
      calls.push({ query, params })
      return [{ projection }] as unknown as T[]
    },
  }

  const result = await getNextDashboard({
    tx,
    principal: { userId: 7, tenantId: 3, active: true, platformRole: 'admin' },
  })

  assert.deepEqual(result, projection)
  assert.equal(calls.length, 1)
  assert.match(calls[0]!.query, /akademate_next_get_dashboard\(\)/)
  assert.deepEqual(calls[0]!.params, [])
})

test('rejects unknown roles before querying and rejects malformed persisted projections', async () => {
  let queried = false
  const tx: LearningSqlClient = {
    unsafe: async <T extends Record<string, unknown>>() => {
      queried = true
      return [{ projection }] as unknown as T[]
    },
  }

  await assert.rejects(
    getNextDashboard({
      tx,
      principal: { userId: 7, tenantId: 3, active: true, platformRole: 'student' },
    }),
    (error) => error instanceof NextDashboardError && error.code === 'dashboard_forbidden'
  )
  assert.equal(queried, false)

  await assert.rejects(
    getNextDashboard({
      tx: {
        unsafe: async <T extends Record<string, unknown>>() =>
          [
            {
              projection: { ...projection, metrics: { courses: -1 } },
            },
          ] as unknown as T[],
      },
      principal: { userId: 7, tenantId: 3, active: true, platformRole: 'lectura' },
    }),
    (error) => error instanceof NextDashboardError && error.code === 'dashboard_projection_invalid'
  )
})
