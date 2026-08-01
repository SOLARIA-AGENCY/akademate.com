import {
  LearningDomainError,
  type MessageInput,
  type MessageRecord,
} from '@akademate/learning'
import { z } from 'zod'

import { NextLearningCommandError } from './send-message-command'
import {
  NextLearningInfrastructureError,
  type NextLearningIdentity,
} from './next-learning-transaction'

const MAX_REQUEST_BYTES = 32_768

const messageInputSchema = z.object({
  clientMessageId: z.string().min(8).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/),
  body: z.string().max(10_000).optional(),
  // Attachments remain fail-closed until assets have tenant/course authorization.
  attachmentIds: z.array(z.never()).max(0).default([]),
}).strict()

export type SendMessageExecutionInput = {
  identity: NextLearningIdentity
  conversationId: string
  now: string
  input: MessageInput
}

export type SendMessageHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  now: () => string
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  execute: (input: SendMessageExecutionInput) => Promise<{
    record: MessageRecord
    inserted: boolean
  }>
}

type RouteContext = {
  params: Promise<{ conversationId: string }>
}

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

function responseForError(error: unknown): Response {
  if (error instanceof NextLearningInfrastructureError) {
    if (error.code === 'next_runtime_required') return json({ error: 'not_found' }, 404)
    if (error.code === 'principal_inactive_or_mismatched') return json({ error: 'unauthorized' }, 401)
    return json({ error: 'learning_service_unavailable' }, 503)
  }

  if (error instanceof NextLearningCommandError) {
    if (error.code === 'message_idempotency_conflict') return json({ error: error.code }, 409)
    if (error.code.includes('persistence') || error.code === 'message_id_unavailable') {
      return json({ error: 'learning_service_unavailable' }, 503)
    }
    return json({ error: error.code }, 400)
  }

  if (error instanceof LearningDomainError) {
    if (error.code === 'conversation_not_found') return json({ error: 'not_found' }, 404)
    const forbidden = [
      'denied',
      'inactive',
      'removed',
      'muted',
      'mismatch',
      'not_started',
      'expired',
    ].some((token) => error.code.includes(token))
    return json({ error: forbidden ? 'forbidden' : error.code }, forbidden ? 403 : 400)
  }

  const postgresCode = typeof error === 'object' && error !== null && 'code' in error
    && typeof error.code === 'string'
    ? error.code
    : null
  if (postgresCode === '40001' || postgresCode === '40P01') {
    return json({ error: 'retryable_conflict' }, 409)
  }
  if (
    postgresCode === '08000'
    || postgresCode === '08001'
    || postgresCode === '08003'
    || postgresCode === '08006'
    || postgresCode === '42501'
    || postgresCode === '42P01'
    || postgresCode === '57014'
    || postgresCode === '57P01'
    || postgresCode === '22023'
  ) {
    return json({ error: 'learning_service_unavailable' }, 503)
  }

  console.error('[Akademate Next Learning] Unhandled message error', error)
  return json({ error: 'internal_error' }, 500)
}

async function readBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > MAX_REQUEST_BYTES) {
    throw new NextLearningCommandError('request_too_large')
  }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    throw new NextLearningCommandError('request_too_large')
  }
  try {
    return JSON.parse(raw)
  } catch {
    throw new NextLearningCommandError('request_json_invalid')
  }
}

export function createSendMessageHandler(dependencies: SendMessageHandlerDependencies) {
  return async function POST(request: Request, context: RouteContext): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }

    try {
      const rawBody = await readBody(request)
      const parsed = messageInputSchema.safeParse(rawBody)
      if (!parsed.success) return json({ error: 'request_invalid' }, 400)

      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)

      const { conversationId } = await context.params
      const result = await dependencies.execute({
        identity,
        conversationId,
        now: dependencies.now(),
        input: parsed.data,
      })
      return json(result, result.inserted ? 201 : 200)
    } catch (error) {
      if (error instanceof NextLearningCommandError && error.code === 'request_too_large') {
        return json({ error: error.code }, 413)
      }
      return responseForError(error)
    }
  }
}
