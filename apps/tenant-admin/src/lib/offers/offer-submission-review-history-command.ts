import { z } from 'zod'

import type { LearningSqlClient, NextLearningPrincipal } from '../learning/next-learning-transaction.ts'

const REVIEWER_ROLES = new Set(['superadmin', 'admin', 'gestor'])
const HISTORY_LIMIT = 100
const SUBMISSION_STATUSES = [
  'new', 'pending_review', 'pending_registration', 'approved', 'rejected', 'archived',
] as const

const submissionRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(SUBMISSION_STATUSES),
  created_at: z.union([z.string(), z.date()]),
}).strict()

const eventRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  actor_user_id: z.coerce.number().int().positive(),
  actor_name: z.string().min(1).max(240),
  from_status: z.enum(SUBMISSION_STATUSES),
  to_status: z.enum(['pending_review', 'approved', 'rejected', 'archived']),
  note: z.string().min(1).max(500).nullable(),
  created_at: z.union([z.string(), z.date()]),
}).strict()

type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export type OfferSubmissionHistoryEvent = {
  id: number
  actorUserId: number
  actorName: string
  fromStatus: SubmissionStatus
  toStatus: 'pending_review' | 'approved' | 'rejected' | 'archived'
  note: string | null
  createdAt: string
}

export type OfferSubmissionHistoryResult = {
  submissionId: number
  status: SubmissionStatus
  receivedAt: string
  events: OfferSubmissionHistoryEvent[]
  truncated: boolean
}

export class NextOfferSubmissionHistoryError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextOfferSubmissionHistoryError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextOfferSubmissionHistoryError(code)
}

function canonicalPositiveId(value: string | number): number {
  const raw = String(value)
  if (!/^[1-9]\d*$/.test(raw)) fail('submission_history_id_invalid')
  const parsed = Number(raw)
  if (!Number.isSafeInteger(parsed)) fail('submission_history_id_invalid')
  return parsed
}

function isoDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) fail('submission_history_persistence_invalid')
  return date.toISOString()
}

export async function getNextOfferSubmissionHistory({
  tx,
  principal,
  submissionId,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  submissionId: string | number
}): Promise<OfferSubmissionHistoryResult> {
  if (!REVIEWER_ROLES.has(principal.platformRole)) fail('submission_history_forbidden')
  const id = canonicalPositiveId(submissionId)
  const submissionRows = await tx.unsafe<Record<string, unknown>>(`
    SELECT id, status, created_at
    FROM offer_submissions
    WHERE tenant_id = $1 AND id = $2
    LIMIT 1
  `, [principal.tenantId, id])
  const submission = submissionRowSchema.safeParse(submissionRows[0])
  if (!submission.success) {
    if (submissionRows.length === 0) fail('submission_history_not_found')
    fail('submission_history_persistence_invalid')
  }
  if (submissionRows.length !== 1 || submission.data.id !== id) {
    fail('submission_history_persistence_invalid')
  }

  const eventRows = await tx.unsafe<Record<string, unknown>>(`
    SELECT
      e.id,
      e.actor_user_id,
      u.name AS actor_name,
      e.from_status,
      e.to_status,
      e.note,
      e.created_at
    FROM offer_submission_review_events e
    INNER JOIN users u
      ON u.tenant_id = e.tenant_id AND u.id = e.actor_user_id
    WHERE e.tenant_id = $1 AND e.submission_id = $2
    ORDER BY e.created_at DESC, e.id DESC
    LIMIT $3
  `, [principal.tenantId, id, HISTORY_LIMIT + 1])
  const events = eventRows.slice(0, HISTORY_LIMIT).map((raw) => {
    const parsed = eventRowSchema.safeParse(raw)
    if (!parsed.success) fail('submission_history_persistence_invalid')
    return {
      id: parsed.data.id,
      actorUserId: parsed.data.actor_user_id,
      actorName: parsed.data.actor_name,
      fromStatus: parsed.data.from_status,
      toStatus: parsed.data.to_status,
      note: parsed.data.note,
      createdAt: isoDate(parsed.data.created_at),
    }
  })
  return {
    submissionId: id,
    status: submission.data.status,
    receivedAt: isoDate(submission.data.created_at),
    events,
    truncated: eventRows.length > HISTORY_LIMIT,
  }
}
