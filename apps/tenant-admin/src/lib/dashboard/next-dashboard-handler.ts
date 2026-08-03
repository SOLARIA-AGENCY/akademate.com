import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextDashboardError,
  type NextDashboard,
} from './next-dashboard-command.ts'

export type NextDashboardHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  read: (input: { identity: NextLearningIdentity }) => Promise<NextDashboard>
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function postgresCode(error: unknown): string | null {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && typeof error.code === 'string'
    ? error.code
    : null
}

function responseForError(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    return json({ error: 'dashboard_service_unavailable' }, 503)
  }
  if (error instanceof NextDashboardError) {
    if (error.code === 'dashboard_forbidden') return json({ error: 'forbidden' }, 403)
    return json({ error: 'dashboard_service_unavailable' }, 503)
  }
  const code = postgresCode(error)
  if (code === '42501') return json({ error: 'forbidden' }, 403)
  if (['08000', '08001', '08003', '08006', '42P01', '57014', '57P01'].includes(code ?? '')) {
    return json({ error: 'dashboard_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Dashboard] Unhandled dashboard error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createNextDashboardHandlers(dependencies: NextDashboardHandlerDependencies) {
  async function GET(request: Request): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.read({ identity }), 200)
    } catch (error) {
      return responseForError(error)
    }
  }
  return { GET }
}
