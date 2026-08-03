import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionHistoryError,
  type OfferSubmissionHistoryResult,
} from './offer-submission-review-history-command.ts'

export type OfferSubmissionHistoryHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  history: (input: {
    identity: NextLearningIdentity
    submissionId: string
  }) => Promise<OfferSubmissionHistoryResult>
}

type RouteContext = { params: Promise<{ id: string }> }

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
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  if (error instanceof NextOfferSubmissionHistoryError) {
    if (error.code === 'submission_history_id_invalid') return json({ error: 'request_invalid' }, 400)
    if (error.code === 'submission_history_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'submission_history_not_found') return json({ error: 'not_found' }, 404)
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
  if (['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01'].includes(code)) {
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Offers] Unhandled submission history error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createOfferSubmissionHistoryHandlers(
  dependencies: OfferSubmissionHistoryHandlerDependencies,
) {
  async function GET(request: Request, context: RouteContext): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }
    try {
      const url = new URL(request.url)
      if ([...url.searchParams.keys()].length > 0) {
        return json({ error: 'request_invalid' }, 400)
      }
      const { id } = await context.params
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.history({ identity, submissionId: id }), 200)
    } catch (error) {
      return responseForError(error)
    }
  }
  return { GET }
}
