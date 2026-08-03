import { OfferPublicationInputSchema } from '@akademate/operations/offer-publication'
import { ZodError } from 'zod'

import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextOfferConfigurationError,
  type OfferConfigurationRecord,
} from './offer-configuration-command.ts'

const MAX_REQUEST_BYTES = 32_768
const requestSchema = OfferPublicationInputSchema.strict()

export type OfferConfigurationExecutionInput = {
  identity: NextLearningIdentity
  courseRunId: string
}

export type OfferConfigurationHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  read: (input: OfferConfigurationExecutionInput) => Promise<OfferConfigurationRecord>
  update: (
    input: OfferConfigurationExecutionInput & { input: unknown },
  ) => Promise<OfferConfigurationRecord>
}

type RouteContext = { params: Promise<{ id: string }> }

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
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    return json({ error: 'offer_service_unavailable' }, 503)
  }

  if (error instanceof NextOfferConfigurationError) {
    if (error.code === 'offer_configuration_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'offer_not_found') return json({ error: 'not_found' }, 404)
    if (error.code === 'course_run_id_invalid') return json({ error: 'request_invalid' }, 400)
    return json({ error: 'offer_service_unavailable' }, 503)
  }

  if (error instanceof ZodError) return json({ error: 'request_invalid' }, 400)

  const code = postgresCode(error)
  if (code === '40001' || code === '40P01') return json({ error: 'retryable_conflict' }, 409)
  if (code === '23505') return json({ error: 'share_slug_conflict' }, 409)
  if (
    code === '08000'
    || code === '08001'
    || code === '08003'
    || code === '08006'
    || code === '42501'
    || code === '42P01'
    || code === '57014'
    || code === '57P01'
    || code === '23514'
  ) {
    return json({ error: 'offer_service_unavailable' }, 503)
  }

  console.error('[Akademate Next Offers] Unhandled configuration error', error)
  return json({ error: 'internal_error' }, 500)
}

async function readBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_REQUEST_BYTES) {
    throw new NextOfferConfigurationError('request_too_large')
  }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    throw new NextOfferConfigurationError('request_too_large')
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new NextOfferConfigurationError('request_json_invalid')
  }
}

export function createOfferConfigurationHandlers(
  dependencies: OfferConfigurationHandlerDependencies,
) {
  const available = () => dependencies.runtime() === 'next' && dependencies.enabled()

  async function GET(request: Request, context: RouteContext): Promise<Response> {
    if (!available()) return json({ error: 'not_found' }, 404)
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const { id } = await context.params
      const record = await dependencies.read({ identity, courseRunId: id })
      return json({ record }, 200)
    } catch (error) {
      return responseForError(error)
    }
  }

  async function PATCH(request: Request, context: RouteContext): Promise<Response> {
    if (!available()) return json({ error: 'not_found' }, 404)
    try {
      const raw = await readBody(request)
      const parsed = requestSchema.safeParse(raw)
      if (!parsed.success) return json({ error: 'request_invalid' }, 400)
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const { id } = await context.params
      const record = await dependencies.update({
        identity,
        courseRunId: id,
        input: parsed.data,
      })
      return json({ record }, 200)
    } catch (error) {
      if (
        error instanceof NextOfferConfigurationError
        && error.code === 'request_too_large'
      ) {
        return json({ error: error.code }, 413)
      }
      if (
        error instanceof NextOfferConfigurationError
        && error.code === 'request_json_invalid'
      ) {
        return json({ error: error.code }, 400)
      }
      return responseForError(error)
    }
  }

  return { GET, PATCH }
}
