import { ZodError } from 'zod'

import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import { NextEventTicketTypeError } from './event-ticket-type.ts'

export type EventTicketTypeHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  list: (input: { identity: NextLearningIdentity; courseRunId: string }) => Promise<unknown>
  upsert: (input: {
    identity: NextLearningIdentity
    courseRunId: string
    body: unknown
  }) => Promise<unknown>
  remove: (input: {
    identity: NextLearningIdentity
    courseRunId: string
    ticketTypeId: string
  }) => Promise<void>
}

type RouteContext = { params: Promise<{ id: string; ticketTypeId?: string }> }

const MAX_BODY_BYTES = 32_768

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function postgresCode(error: unknown): string | null {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : null
}

function responseForError(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    if (error.code === 'principal_inactive_or_mismatched')
      return json({ error: 'unauthorized' }, 401)
    return json({ error: 'ticket_service_unavailable' }, 503)
  }
  if (error instanceof NextEventTicketTypeError) {
    if (error.code === 'ticket_types_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code.endsWith('_invalid') || error.code === 'ticket_input_invalid') {
      return json({ error: 'request_invalid' }, 400)
    }
    if (error.code === 'ticket_type_not_found') return json({ error: 'not_found' }, 404)
    return json({ error: 'ticket_service_unavailable' }, 503)
  }
  if (error instanceof ZodError) return json({ error: 'request_invalid' }, 400)
  const code = postgresCode(error)
  if (code === '40001' || code === '40P01') return json({ error: 'retryable_conflict' }, 409)
  if (code === '23505') return json({ error: 'ticket_slug_conflict' }, 409)
  if (
    ['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01', '23514'].includes(
      code ?? ''
    )
  ) {
    return json({ error: 'ticket_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Event Tickets] Unhandled error', error)
  return json({ error: 'internal_error' }, 500)
}

async function readBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_BODY_BYTES) {
    throw new NextEventTicketTypeError('ticket_request_too_large')
  }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new NextEventTicketTypeError('ticket_request_too_large')
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new NextEventTicketTypeError('ticket_request_json_invalid')
  }
}

export function createEventTicketTypeHandlers(dependencies: EventTicketTypeHandlerDependencies) {
  const available = () => dependencies.runtime() === 'next' && dependencies.enabled()

  async function GET(request: Request, context: RouteContext): Promise<Response> {
    if (!available()) return json({ error: 'not_found' }, 404)
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const { id } = await context.params
      return json({ items: await dependencies.list({ identity, courseRunId: id }) }, 200)
    } catch (error) {
      return responseForError(error)
    }
  }

  async function POST(request: Request, context: RouteContext): Promise<Response> {
    if (!available()) return json({ error: 'not_found' }, 404)
    try {
      const body = await readBody(request)
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const { id } = await context.params
      return json({ record: await dependencies.upsert({ identity, courseRunId: id, body }) }, 200)
    } catch (error) {
      if (error instanceof NextEventTicketTypeError && error.code === 'ticket_request_too_large') {
        return json({ error: error.code }, 413)
      }
      if (
        error instanceof NextEventTicketTypeError &&
        error.code === 'ticket_request_json_invalid'
      ) {
        return json({ error: error.code }, 400)
      }
      return responseForError(error)
    }
  }

  async function DELETE(request: Request, context: RouteContext): Promise<Response> {
    if (!available()) return json({ error: 'not_found' }, 404)
    try {
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const { id, ticketTypeId } = await context.params
      if (!ticketTypeId) return json({ error: 'request_invalid' }, 400)
      await dependencies.remove({ identity, courseRunId: id, ticketTypeId })
      return json({ deleted: true }, 200)
    } catch (error) {
      return responseForError(error)
    }
  }

  return { GET, POST, DELETE }
}
