import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionReviewError,
  type OfferSubmissionDecision,
  type OfferSubmissionDecisionResult,
  parseOfferSubmissionDecision,
} from './offer-submission-review-command.ts'

export type OfferSubmissionReviewHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  review: (input: {
    identity: NextLearningIdentity
    submissionId: string
    decision: OfferSubmissionDecision
  }) => Promise<OfferSubmissionDecisionResult>
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
  if (error instanceof NextOfferSubmissionReviewError) {
    if (['submission_id_invalid', 'submission_decision_invalid'].includes(error.code)) {
      return json({ error: 'request_invalid' }, 400)
    }
    if (error.code === 'submission_decision_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'submission_not_found') return json({ error: 'not_found' }, 404)
    if (error.code === 'submission_transition_invalid') return json({ error: 'transition_conflict' }, 409)
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  const code = postgresCode(error)
  if (code === '40001' || code === '40P01') return json({ error: 'retryable_conflict' }, 409)
  if (['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01'].includes(code ?? '')) {
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Offers] Unhandled submission review error', error)
  return json({ error: 'internal_error' }, 500)
}

async function readDecision(request: Request): Promise<OfferSubmissionDecision> {
  const declaredLength = Number(request.headers.get('content-length') || '0')
  if (!Number.isFinite(declaredLength) || declaredLength > 2048) {
    throw new NextOfferSubmissionReviewError('submission_decision_invalid')
  }
  const text = await request.text()
  if (!text || text.length > 2048) throw new NextOfferSubmissionReviewError('submission_decision_invalid')
  try {
    return parseOfferSubmissionDecision(JSON.parse(text))
  } catch (error) {
    if (error instanceof NextOfferSubmissionReviewError) throw error
    throw new NextOfferSubmissionReviewError('submission_decision_invalid')
  }
}

export function createOfferSubmissionReviewHandlers(
  dependencies: OfferSubmissionReviewHandlerDependencies,
) {
  async function PATCH(request: Request, context: RouteContext): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }
    try {
      const [{ id }, decision] = await Promise.all([context.params, readDecision(request)])
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.review({ identity, submissionId: id, decision }), 200)
    } catch (error) {
      return responseForError(error)
    }
  }
  return { PATCH }
}
