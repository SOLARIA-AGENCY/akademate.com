import { z } from 'zod'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'

const REVIEWER_ROLES = new Set(['superadmin', 'admin', 'gestor'])

const resultRowSchema = z.object({
  enrollment_id: z.coerce.number().int().positive(),
  enrollment_status: z.enum(['cancelled', 'withdrawn']),
  promoted_enrollment_id: z.coerce.number().int().positive().nullable(),
  replayed: z.boolean(),
  capacity_released: z.boolean(),
  financial_follow_up_required: z.boolean(),
}).strict()

export type EnrollmentCancellationResult = {
  enrollmentId: number
  status: 'cancelled' | 'withdrawn'
  promotedEnrollmentId: number | null
  replayed: boolean
  capacityReleased: boolean
  financialFollowUpRequired: boolean
}

export class NextEnrollmentCancellationError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextEnrollmentCancellationError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextEnrollmentCancellationError(code)
}

function canonicalPositiveId(value: string | number): number {
  const raw = String(value)
  if (!/^[1-9]\d*$/.test(raw)) fail('enrollment_cancellation_request_invalid')
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed)) fail('enrollment_cancellation_request_invalid')
  return parsed
}

function canonicalReason(value: string): string {
  const reason = value.trim()
  if (reason.length < 3 || reason.length > 500) fail('enrollment_cancellation_request_invalid')
  return reason
}

function mapDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('enrollment_cancellation_forbidden')) fail('enrollment_cancellation_forbidden')
  if (message.includes('enrollment_not_found')) fail('enrollment_not_found')
  if (message.includes('enrollment_cancellation_not_available')) fail('enrollment_cancellation_not_available')
  if (message.includes('enrollment_capacity_inconsistent')) fail('enrollment_capacity_inconsistent')
  throw error
}

export async function cancelNextEnrollment({
  tx,
  principal,
  enrollmentId,
  cancellationType,
  reason,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  enrollmentId: string | number
  cancellationType: 'cancelled' | 'withdrawn'
  reason: string
}): Promise<EnrollmentCancellationResult> {
  if (!REVIEWER_ROLES.has(principal.platformRole)) fail('enrollment_cancellation_forbidden')
  if (cancellationType !== 'cancelled' && cancellationType !== 'withdrawn') {
    fail('enrollment_cancellation_request_invalid')
  }
  const id = canonicalPositiveId(enrollmentId)
  const normalizedReason = canonicalReason(reason)

  let rows: Record<string, unknown>[]
  try {
    rows = await tx.unsafe<Record<string, unknown>>(`
      SELECT enrollment_id, enrollment_status, promoted_enrollment_id,
        replayed, capacity_released, financial_follow_up_required
      FROM akademate_next_cancel_enrollment($1, $2, $3)
    `, [id, cancellationType, normalizedReason])
  } catch (error) {
    mapDatabaseError(error)
  }

  const parsed = resultRowSchema.safeParse(rows[0])
  if (!parsed.success || rows.length !== 1 || parsed.data.enrollment_id !== id) {
    fail('enrollment_cancellation_persistence_invalid')
  }
  if (parsed.data.promoted_enrollment_id !== null && !parsed.data.capacity_released) {
    fail('enrollment_cancellation_persistence_invalid')
  }

  return {
    enrollmentId: parsed.data.enrollment_id,
    status: parsed.data.enrollment_status,
    promotedEnrollmentId: parsed.data.promoted_enrollment_id,
    replayed: parsed.data.replayed,
    capacityReleased: parsed.data.capacity_released,
    financialFollowUpRequired: parsed.data.financial_follow_up_required,
  }
}
