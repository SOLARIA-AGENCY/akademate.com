import { z } from 'zod'

import type { NextLearningIdentity } from '../learning/next-learning-transaction.ts'
import { NextLearningInfrastructureError } from '../learning/next-learning-transaction.ts'
import {
  NextEnrollmentCancellationError,
  type EnrollmentCancellationResult,
} from './enrollment-cancellation-command.ts'

const bodySchema = z.object({
  cancellationType: z.enum(['cancelled', 'withdrawn']),
  reason: z.string().trim().min(3).max(500),
}).strict()

export type EnrollmentCancellationHandlerDependencies = {
  runtime: () => string | undefined
  enabled: () => boolean
  authenticate: (request: Request) => Promise<NextLearningIdentity | null>
  cancel: (input: {
    identity: NextLearningIdentity
    enrollmentId: string
    cancellationType: 'cancelled' | 'withdrawn'
    reason: string
  }) => Promise<EnrollmentCancellationResult>
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
    return json({ error: 'enrollment_service_unavailable' }, 503)
  }
  if (error instanceof NextEnrollmentCancellationError) {
    if (error.code === 'enrollment_cancellation_request_invalid') return json({ error: 'request_invalid' }, 400)
    if (error.code === 'enrollment_cancellation_forbidden') return json({ error: 'forbidden' }, 403)
    if (error.code === 'enrollment_not_found') return json({ error: 'not_found' }, 404)
    if (error.code === 'enrollment_cancellation_not_available') return json({ error: 'cancellation_not_available' }, 409)
    if (error.code === 'enrollment_capacity_inconsistent') return json({ error: 'capacity_inconsistent' }, 409)
    return json({ error: 'enrollment_service_unavailable' }, 503)
  }
  const code = postgresCode(error)
  if (code === '40001' || code === '40P01') return json({ error: 'retryable_conflict' }, 409)
  if (['08000', '08001', '08003', '08006', '42501', '42P01', '57014', '57P01'].includes(code ?? '')) {
    return json({ error: 'enrollment_service_unavailable' }, 503)
  }
  console.error('[Akademate Next Enrollments] Unhandled cancellation error', error)
  return json({ error: 'internal_error' }, 500)
}

export function createEnrollmentCancellationHandlers(
  dependencies: EnrollmentCancellationHandlerDependencies,
) {
  async function POST(request: Request, context: RouteContext): Promise<Response> {
    if (dependencies.runtime() !== 'next' || !dependencies.enabled()) {
      return json({ error: 'not_found' }, 404)
    }
    if (new URL(request.url).searchParams.size > 0) return json({ error: 'request_invalid' }, 400)

    let parsedBody: z.infer<typeof bodySchema>
    try {
      const text = await request.text()
      if (text.length === 0 || text.length > 2048) return json({ error: 'request_invalid' }, 400)
      const parsed = bodySchema.safeParse(JSON.parse(text))
      if (!parsed.success) return json({ error: 'request_invalid' }, 400)
      parsedBody = parsed.data
    } catch {
      return json({ error: 'request_invalid' }, 400)
    }

    try {
      const { id } = await context.params
      const identity = await dependencies.authenticate(request)
      if (!identity) return json({ error: 'unauthorized' }, 401)
      const result = await dependencies.cancel({
        identity,
        enrollmentId: id,
        cancellationType: parsedBody.cancellationType,
        reason: parsedBody.reason,
      })
      return json(result, 200)
    } catch (error) {
      return responseForError(error)
    }
  }
  return { POST }
}
