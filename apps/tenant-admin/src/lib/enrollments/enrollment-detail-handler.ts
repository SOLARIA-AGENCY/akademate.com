import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { NextEnrollmentDetailError, type NextEnrollmentDetail } from './enrollment-detail-command.ts'

export type EnrollmentDetailHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  read: (input: { identity: NextLearningIdentity; enrollmentId: string }) => Promise<NextEnrollmentDetail>
}

type RouteContext = { params: Promise<{ id: string }> }

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function errorResponse(error: unknown) {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    return json({ error: 'enrollment_service_unavailable' }, 503)
  }
  if (error instanceof NextEnrollmentDetailError) {
    if (error.code === 'enrollment_detail_request_invalid') return json({ error: 'request_invalid' }, 400)
    if (error.code === 'enrollment_detail_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'enrollment_not_found') return json({ error: 'not_found' }, 404)
    return json({ error: 'enrollment_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Enrollments] Unhandled detail error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createEnrollmentDetailHandlers(dependencies: EnrollmentDetailHandlerDependencies) {
  async function GET(request: Request, context: RouteContext): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) return json({ error: 'not_found' }, 404)
    if (new URL(request.url).searchParams.size > 0) return json({ error: 'request_invalid' }, 400)
    try {
      const { id } = await context.params
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.read({ identity, enrollmentId: id }), 200)
    } catch (error) {
      return errorResponse(error)
    }
  }
  return { GET }
}
