import assert from 'node:assert/strict'
import test from 'node:test'

import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { NextDashboardError } from './next-dashboard-command.ts'
import { createNextDashboardHandlers } from './next-dashboard-handler.ts'

const request = new Request('https://tenant.example/api/next/dashboard')
const dashboard = {
  generatedAt: '2026-08-03T16:00:00.000Z',
  metrics: { courses: 0, activeStudents: 0, activeTeachers: 0, campuses: 0, activeCourseRuns: 0, confirmedEnrollments: 0, pendingRequests: 0 },
  attention: { pendingReview: 0, waitlisted: 0, paymentReview: 0 },
  upcomingRuns: [],
  recentActivity: [],
}

function dependencies(overrides = {}) {
  return {
    runtime: () => 'next',
    enabled: () => true,
    authenticate: async () => ({ userId: 7, tenantId: 3 }),
    read: async () => dashboard,
    ...overrides,
  }
}

test('is default-off outside Next and requires an authenticated session', async () => {
  assert.equal((await createNextDashboardHandlers(dependencies({ runtime: () => 'legacy' })).GET(request)).status, 404)
  assert.equal((await createNextDashboardHandlers(dependencies({ enabled: () => false })).GET(request)).status, 404)
  assert.equal((await createNextDashboardHandlers(dependencies({ authenticate: async () => null })).GET(request)).status, 401)
})

test('returns a private no-store projection and maps authorization and infrastructure failures', async () => {
  const response = await createNextDashboardHandlers(dependencies()).GET(request)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), dashboard)

  const forbidden = await createNextDashboardHandlers(dependencies({
    read: async () => { throw new NextDashboardError('dashboard_forbidden') },
  })).GET(request)
  assert.equal(forbidden.status, 403)

  const unavailable = await createNextDashboardHandlers(dependencies({
    read: async () => { throw new NextLearningInfrastructureError('database_role_unsafe') },
  })).GET(request)
  assert.equal(unavailable.status, 503)
})
