import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NextPublicOfferSubmissionError,
  parseNextPublicOfferSubmission,
  submitNextPublicOffer,
} from './public-offer-submission'

const validInput = {
  idempotencyKey: '018f6f52-86a7-7c8f-a477-01b9c6407a11',
  firstName: ' Ada ',
  lastName: ' Lovelace ',
  email: ' ADA@EXAMPLE.COM ',
  phone: ' +46 70 123 45 67 ',
  message: ' I would like the morning group. ',
  privacyAccepted: true,
  marketingConsent: false,
  companyWebsite: '',
}

test('normalizes a bounded consented submission and rejects unknown fields', () => {
  assert.deepEqual(parseNextPublicOfferSubmission(validInput), {
    idempotencyKey: validInput.idempotencyKey,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+46 70 123 45 67',
    message: 'I would like the morning group.',
    privacyAccepted: true,
    marketingConsent: false,
    companyWebsite: '',
  })
  assert.throws(
    () => parseNextPublicOfferSubmission({ ...validInput, tenantId: 41 }),
    (error) => error instanceof NextPublicOfferSubmissionError && error.code === 'submission_invalid',
  )
})

test('fails closed for missing consent, honeypot, malformed identity and oversized content', () => {
  for (const input of [
    { ...validInput, privacyAccepted: false },
    { ...validInput, companyWebsite: 'https://spam.example' },
    { ...validInput, email: 'not-an-email' },
    { ...validInput, idempotencyKey: 'reused-client-token' },
    { ...validInput, firstName: 'x'.repeat(81) },
    { ...validInput, message: 'x'.repeat(1001) },
  ]) {
    assert.throws(
      () => parseNextPublicOfferSubmission(input),
      (error) => error instanceof NextPublicOfferSubmissionError && error.code === 'submission_invalid',
    )
  }
})

test('submits only server-derived scope and fingerprints without forwarding the pepper', async () => {
  const calls: unknown[][] = []
  const tx = {
    unsafe: async (query: string, values: unknown[]) => {
      calls.push([query, ...values])
      return [{ submission_id: 91, submission_kind: 'interest', submission_status: 'new', replayed: false }]
    },
  }
  const result = await submitNextPublicOffer({
    tx: tx as never,
    host: 'north-star.akademate.com',
    shareSlug: 'creative-leadership',
    input: parseNextPublicOfferSubmission(validInput),
    privacyNoticeVersion: '2026-08-03',
    fingerprintPepper: 'p'.repeat(32),
  })
  assert.deepEqual(result, { submissionId: 91, kind: 'interest', status: 'new', replayed: false })
  assert.equal(calls.length, 1)
  assert.equal(JSON.stringify(calls[0]).includes('p'.repeat(32)), false)
  assert.match(String(calls[0]?.[0]), /akademate_next_submit_public_offer/)
})

test('maps database refusal without leaking whether an offer or contact exists', async () => {
  for (const [message, code] of [
    ['public_offer_submission_not_available', 'submission_not_available'],
    ['public_offer_submission_rate_limited', 'submission_rate_limited'],
    ['public_offer_submission_idempotency_conflict', 'submission_idempotency_conflict'],
  ] as const) {
    const tx = { unsafe: async () => { throw new Error(message) } }
    await assert.rejects(
      () => submitNextPublicOffer({
        tx: tx as never,
        host: 'north-star.akademate.com',
        shareSlug: 'creative-leadership',
        input: parseNextPublicOfferSubmission(validInput),
        privacyNoticeVersion: '2026-08-03',
        fingerprintPepper: 'p'.repeat(32),
      }),
      (error) => error instanceof NextPublicOfferSubmissionError && error.code === code,
    )
  }
})
