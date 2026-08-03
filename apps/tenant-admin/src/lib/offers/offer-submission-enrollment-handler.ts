import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionEnrollmentError,
  type OfferSubmissionEnrollmentResult,
} from './offer-submission-enrollment-command.ts'

export type OfferSubmissionEnrollmentHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  convert: (input: {
    identity: NextLearningIdentity
    submissionId: string
  }) => Promise<OfferSubmissionEnrollmentResult>
}

type RouteContext = { params: Promise<{ id: string }> }

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function postgresCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : null
}

function responseForError(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  if (error instanceof NextOfferSubmissionEnrollmentError) {
    if (error.code === 'submission_id_invalid') return json({ error: 'request_invalid' }, 400)
    if (error.code === 'submission_enrollment_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'submission_not_found') return json({ error: 'not_found' }, 404)
    if (error.code === 'submission_not_approved') return json({ error: 'approval_required' }, 409)
    if (error.code === 'submission_enrollment_not_available') return json({ error: 'enrollment_not_available' }, 409)
    if (error.code === 'submission_capacity_full') return json({ error: 'capacity_full' }, 409)
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  const code = postgresCode(error)
  if (code === '40001' || code === '40P01') return json({ error: 'retryable_conflict' }, 409)
  if (['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01'].includes(code ?? '')) {
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Offers] Unhandled submission enrollment error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createOfferSubmissionEnrollmentHandlers(
  dependencies: OfferSubmissionEnrollmentHandlerDependencies,
) {
  async function POST(request: Request, context: RouteContext): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }
    if (new URL(request.url).searchParams.size > 0) return json({ error: 'request_invalid' }, 400)
    if ((await request.text()).length > 0) return json({ error: 'request_invalid' }, 400)

    try {
      const { id } = await context.params
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const result = await dependencies.convert({ identity, submissionId: id })
      return json(result, result.replayed ? 200 : 201)
    } catch (error) {
      return responseForError(error)
    }
  }
  return { POST }
}
