import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextOfferSubmissionInboxError,
  type OfferSubmissionInboxQuery,
  type OfferSubmissionInboxResult,
  parseOfferSubmissionInboxQuery,
} from './offer-submission-inbox-command.ts'

export type OfferSubmissionInboxHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  list: (input: {
    identity: NextLearningIdentity
    query: OfferSubmissionInboxQuery
  }) => Promise<OfferSubmissionInboxResult>
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
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  if (error instanceof NextOfferSubmissionInboxError) {
    if (error.code === 'submission_query_invalid') return json({ error: 'request_invalid' }, 400)
    if (error.code === 'submission_inbox_forbidden') return json({ error: 'forbidden' }, 403)
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  const code = postgresCode(error)
  if (code === '40001' || code === '40P01') return json({ error: 'retryable_conflict' }, 409)
  if (['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01'].includes(code ?? '')) {
    return json({ error: 'submission_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Offers] Unhandled submission inbox error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createOfferSubmissionInboxHandlers(
  dependencies: OfferSubmissionInboxHandlerDependencies,
) {
  async function GET(request: Request): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }
    let query: OfferSubmissionInboxQuery
    try {
      query = parseOfferSubmissionInboxQuery(new URL(request.url).searchParams)
    } catch (error) {
      return responseForError(error)
    }
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      return json(await dependencies.list({ identity, query }), 200)
    } catch (error) {
      return responseForError(error)
    }
  }
  return { GET }
}
