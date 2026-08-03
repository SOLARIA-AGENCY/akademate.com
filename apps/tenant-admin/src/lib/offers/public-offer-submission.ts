import { createHmac } from 'node:crypto'
import { z } from 'zod'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import { normalizePublicOfferHost, normalizeShareSlug } from './public-offer-query.ts'

const SubmissionSchema = z.object({
  idempotencyKey: z.string().uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(4).max(32).optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
  privacyAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
  companyWebsite: z.string().max(200).default(''),
}).strict()

export type NextPublicOfferSubmissionInput = z.infer<typeof SubmissionSchema>
type SubmissionRow = {
  submission_id: number
  submission_kind: 'interest' | 'application' | 'registration_request'
  submission_status: 'new' | 'pending_review' | 'pending_registration'
  replayed: boolean
}

export class NextPublicOfferSubmissionError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextPublicOfferSubmissionError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextPublicOfferSubmissionError(code)
}

export function parseNextPublicOfferSubmission(value: unknown): NextPublicOfferSubmissionInput {
  const parsed = SubmissionSchema.safeParse(value)
  if (!parsed.success || parsed.data.companyWebsite !== '') fail('submission_invalid')
  return parsed.data
}

function requireServerValue(value: string, pattern: RegExp, code: string): string {
  if (!pattern.test(value)) fail(code)
  return value
}

function fingerprint(pepper: string, purpose: string, value: string): string {
  requireServerValue(pepper, /^.{32,}$/, 'submission_pepper_invalid')
  return createHmac('sha256', pepper).update(`${purpose}\0${value}`).digest('hex')
}

function mapDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('public_offer_submission_rate_limited')) fail('submission_rate_limited')
  if (message.includes('public_offer_submission_idempotency_conflict')) fail('submission_idempotency_conflict')
  if (message.includes('public_offer_submission_not_available')) fail('submission_not_available')
  throw error
}

export async function submitNextPublicOffer({
  tx,
  host,
  shareSlug,
  input,
  privacyNoticeVersion,
  fingerprintPepper,
}: {
  tx: LearningSqlClient
  host: string
  shareSlug: string
  input: NextPublicOfferSubmissionInput
  privacyNoticeVersion: string
  fingerprintPepper: string
}): Promise<{ submissionId: number; kind: SubmissionRow['submission_kind']; status: SubmissionRow['submission_status']; replayed: boolean }> {
  const normalizedHost = normalizePublicOfferHost(host)
  const normalizedSlug = normalizeShareSlug(shareSlug)
  const noticeVersion = requireServerValue(privacyNoticeVersion, /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/, 'privacy_notice_version_invalid')
  const payload = JSON.stringify({
    host: normalizedHost,
    slug: normalizedSlug,
    ...input,
    companyWebsite: undefined,
    privacyNoticeVersion: noticeVersion,
  })
  const payloadFingerprint = fingerprint(fingerprintPepper, 'offer-submission-payload', payload)
  const contactFingerprint = fingerprint(
    fingerprintPepper,
    'offer-submission-contact',
    `${normalizedHost}\0${normalizedSlug}\0${input.email}`,
  )

  try {
    const rows = await tx.unsafe<SubmissionRow>(`
      SELECT *
      FROM akademate_next_submit_public_offer(
        $1, $2, $3::uuid, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13
      )
    `, [
      normalizedHost,
      normalizedSlug,
      input.idempotencyKey,
      input.firstName,
      input.lastName,
      input.email,
      input.phone || null,
      input.message || null,
      input.privacyAccepted,
      input.marketingConsent,
      noticeVersion,
      payloadFingerprint,
      contactFingerprint,
    ])
    const row = rows[0]
    if (!row) fail('submission_not_available')
    return {
      submissionId: Number(row.submission_id),
      kind: row.submission_kind,
      status: row.submission_status,
      replayed: row.replayed,
    }
  } catch (error) {
    mapDatabaseError(error)
  }
}
