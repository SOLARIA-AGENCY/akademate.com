import { NextLearningInfrastructureError } from '@/src/lib/learning/next-learning-transaction'
import { withNextPublicOfferWriteTransaction } from '@/src/lib/offers/public-offer-database'
import {
  NextPublicOfferSubmissionError,
  parseNextPublicOfferSubmission,
  submitNextPublicOffer,
} from '@/src/lib/offers/public-offer-submission'
import { currentNextPublicSubmissionConfig } from '@/src/lib/offers/public-offer-submission-config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BODY_BYTES = 8_192

function response(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Host',
      ...headers,
    },
  })
}

function requestHost(request: Request): string {
  return request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')?.trim()
    || ''
}

async function readBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new NextPublicOfferSubmissionError('submission_too_large')
  }
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new NextPublicOfferSubmissionError('submission_too_large')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new NextPublicOfferSubmissionError('submission_invalid')
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED !== 'true'
    || process.env.AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED !== 'true'
  ) return response({ error: 'not_found' }, 404)

  const config = currentNextPublicSubmissionConfig()
  if (!config) return response({ error: 'submission_service_unavailable' }, 503)

  try {
    const [{ slug }, body] = await Promise.all([context.params, readBody(request)])
    const input = parseNextPublicOfferSubmission(body)
    const result = await withNextPublicOfferWriteTransaction((tx) => submitNextPublicOffer({
      tx,
      host: requestHost(request),
      shareSlug: slug,
      input,
      privacyNoticeVersion: config.privacyNoticeVersion,
      fingerprintPepper: config.fingerprintPepper,
    }))
    return response({
      accepted: true,
      kind: result.kind,
      status: result.status,
    }, result.replayed ? 200 : 201)
  } catch (error) {
    if (error instanceof NextPublicOfferSubmissionError) {
      if (error.code === 'submission_too_large') return response({ error: error.code }, 413)
      if (error.code === 'submission_invalid') return response({ error: error.code }, 400)
      if (error.code === 'submission_rate_limited') {
        return response({ error: error.code }, 429, { 'Retry-After': '3600' })
      }
      if (error.code === 'submission_idempotency_conflict') return response({ error: error.code }, 409)
      if (error.code === 'submission_not_available') return response({ error: 'not_found' }, 404)
      return response({ error: 'submission_service_unavailable' }, 503)
    }
    if (error instanceof NextLearningInfrastructureError) {
      return response({ error: 'submission_service_unavailable' }, 503)
    }
    console.error('[Akademate Next Public Offers] Unhandled submission error', error)
    return response({ error: 'internal_error' }, 500)
  }
}
