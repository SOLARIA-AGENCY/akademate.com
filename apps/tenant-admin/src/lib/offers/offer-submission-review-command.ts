import { z } from 'zod'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'

const REVIEWER_ROLES = new Set(['superadmin', 'admin', 'gestor'])
const DECISION_STATUSES = ['pending_review', 'approved', 'rejected', 'archived'] as const
const SUBMISSION_STATUSES = [
  'new',
  'pending_review',
  'pending_registration',
  'approved',
  'rejected',
  'archived',
] as const

const decisionSchema = z.object({
  status: z.enum(DECISION_STATUSES),
  note: z.string().max(500).nullable().optional(),
}).strict()

const resultRowSchema = z.object({
  submission_id: z.coerce.number().int().positive(),
  previous_status: z.enum(SUBMISSION_STATUSES),
  submission_status: z.enum(SUBMISSION_STATUSES),
  changed: z.boolean(),
  decided_at: z.union([z.string(), z.date()]),
}).strict()

export type OfferSubmissionDecisionStatus = (typeof DECISION_STATUSES)[number]
export type OfferSubmissionDecision = {
  status: OfferSubmissionDecisionStatus
  note: string | null
}
export type OfferSubmissionDecisionResult = {
  submissionId: number
  previousStatus: (typeof SUBMISSION_STATUSES)[number]
  status: (typeof SUBMISSION_STATUSES)[number]
  changed: boolean
  decidedAt: string
}

export class NextOfferSubmissionReviewError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextOfferSubmissionReviewError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextOfferSubmissionReviewError(code)
}

function canonicalPositiveId(value: string | number): number {
  const raw = String(value)
  if (!/^[1-9]\d*$/.test(raw)) fail('submission_id_invalid')
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed)) fail('submission_id_invalid')
  return parsed
}

export function parseOfferSubmissionDecision(raw: unknown): OfferSubmissionDecision {
  const parsed = decisionSchema.safeParse(raw)
  if (!parsed.success) fail('submission_decision_invalid')
  const note = parsed.data.note?.trim() || null
  if (note && /[\u0000-\u001f\u007f]/.test(note)) fail('submission_decision_invalid')
  if (parsed.data.status === 'rejected' && !note) fail('submission_decision_invalid')
  return { status: parsed.data.status, note }
}

function mapDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('offer_submission_review_forbidden')) fail('submission_decision_forbidden')
  if (message.includes('offer_submission_not_found')) fail('submission_not_found')
  if (message.includes('offer_submission_transition_invalid')) fail('submission_transition_invalid')
  if (
    message.includes('offer_submission_rejection_note_required')
    || message.includes('offer_submission_note_invalid')
  ) fail('submission_decision_invalid')
  throw error
}

export async function reviewNextOfferSubmission({
  tx,
  principal,
  submissionId,
  decision,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  submissionId: string | number
  decision: OfferSubmissionDecision
}): Promise<OfferSubmissionDecisionResult> {
  if (!REVIEWER_ROLES.has(principal.platformRole)) fail('submission_decision_forbidden')
  const id = canonicalPositiveId(submissionId)

  let rows: Record<string, unknown>[]
  try {
    rows = await tx.unsafe<Record<string, unknown>>(`
      SELECT submission_id, previous_status, submission_status, changed, decided_at
      FROM akademate_next_review_offer_submission($1, $2, $3)
    `, [id, decision.status, decision.note])
  } catch (error) {
    mapDatabaseError(error)
  }

  const parsed = resultRowSchema.safeParse(rows[0])
  if (!parsed.success || rows.length !== 1 || parsed.data.submission_id !== id) {
    fail('submission_decision_persistence_invalid')
  }
  const decidedAt = parsed.data.decided_at instanceof Date
    ? parsed.data.decided_at
    : new Date(parsed.data.decided_at)
  if (!Number.isFinite(decidedAt.getTime())) fail('submission_decision_persistence_invalid')
  return {
    submissionId: parsed.data.submission_id,
    previousStatus: parsed.data.previous_status,
    status: parsed.data.submission_status,
    changed: parsed.data.changed,
    decidedAt: decidedAt.toISOString(),
  }
}
