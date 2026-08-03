import { z } from 'zod'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'

const REVIEWER_ROLES = new Set(['superadmin', 'admin', 'gestor'])

const resultRowSchema = z.object({
  submission_id: z.coerce.number().int().positive(),
  enrollment_id: z.coerce.number().int().positive(),
  learner_id: z.coerce.number().int().positive(),
  enrollment_status: z.enum(['confirmed', 'waitlisted']),
  replayed: z.boolean(),
  capacity_reserved: z.boolean(),
}).strict()

export type OfferSubmissionEnrollmentResult = {
  submissionId: number
  enrollmentId: number
  learnerId: number
  status: 'confirmed' | 'waitlisted'
  replayed: boolean
  capacityReserved: boolean
}

export class NextOfferSubmissionEnrollmentError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextOfferSubmissionEnrollmentError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextOfferSubmissionEnrollmentError(code)
}

function canonicalPositiveId(value: string | number): number {
  const raw = String(value)
  if (!/^[1-9]\d*$/.test(raw)) fail('submission_id_invalid')
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed)) fail('submission_id_invalid')
  return parsed
}

function mapDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('offer_submission_enrollment_forbidden')) fail('submission_enrollment_forbidden')
  if (message.includes('offer_submission_not_found')) fail('submission_not_found')
  if (message.includes('offer_submission_not_approved')) fail('submission_not_approved')
  if (message.includes('offer_submission_enrollment_not_available')) fail('submission_enrollment_not_available')
  if (message.includes('offer_submission_capacity_full')) fail('submission_capacity_full')
  throw error
}

export async function convertNextOfferSubmissionToEnrollment({
  tx,
  principal,
  submissionId,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  submissionId: string | number
}): Promise<OfferSubmissionEnrollmentResult> {
  if (!REVIEWER_ROLES.has(principal.platformRole)) fail('submission_enrollment_forbidden')
  const id = canonicalPositiveId(submissionId)

  let rows: Record<string, unknown>[]
  try {
    rows = await tx.unsafe<Record<string, unknown>>(`
      SELECT submission_id, enrollment_id, learner_id, enrollment_status,
        replayed, capacity_reserved
      FROM akademate_next_convert_offer_submission_to_enrollment($1)
    `, [id])
  } catch (error) {
    mapDatabaseError(error)
  }

  const parsed = resultRowSchema.safeParse(rows[0])
  if (!parsed.success || rows.length !== 1 || parsed.data.submission_id !== id) {
    fail('submission_enrollment_persistence_invalid')
  }
  if (parsed.data.enrollment_status === 'confirmed' && !parsed.data.capacity_reserved) {
    fail('submission_enrollment_persistence_invalid')
  }
  if (parsed.data.enrollment_status === 'waitlisted' && parsed.data.capacity_reserved) {
    fail('submission_enrollment_persistence_invalid')
  }

  return {
    submissionId: parsed.data.submission_id,
    enrollmentId: parsed.data.enrollment_id,
    learnerId: parsed.data.learner_id,
    status: parsed.data.enrollment_status,
    replayed: parsed.data.replayed,
    capacityReserved: parsed.data.capacity_reserved,
  }
}
