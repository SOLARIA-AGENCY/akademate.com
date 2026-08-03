import type { NextLearningIdentity } from './next-learning-transaction.ts'
import { NextLearningInfrastructureError } from './next-learning-transaction.ts'
import type { NextSessionProfile } from './next-session-profile.ts'
import { NextSessionProfileError } from './next-session-profile.ts'

export type NextSessionHandlerDependencies = {
  runtime: () => string | undefined
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  read: (input: { identity: NextLearningIdentity }) => Promise<NextSessionProfile>
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function responseForError(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    return json({ error: 'session_service_unavailable' }, 503)
  }
  if (error instanceof NextSessionProfileError) return json({ error: 'unauthorized' }, 401)
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
  if (['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01'].includes(code)) {
    return json({ error: 'session_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Session] Unhandled profile error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createNextSessionHandlers(dependencies: NextSessionHandlerDependencies) {
  async function GET(request: Request): Promise<Response> {
    if (dependencies.runtime() !== 'next') return json({ error: 'not_found' }, 404)
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
