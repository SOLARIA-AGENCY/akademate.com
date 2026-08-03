import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveNextPublicSubmissionConfig } from './public-offer-submission-config'

const valid = {
  AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED: 'true',
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL: 'https://akademate.com/legal/privacy',
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION: '2026-08-03',
  AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER: 'p'.repeat(32),
}

test('returns one complete server configuration without weakening the privacy URL', () => {
  assert.deepEqual(resolveNextPublicSubmissionConfig(valid), {
    privacyNoticeUrl: 'https://akademate.com/legal/privacy',
    privacyNoticeVersion: '2026-08-03',
    fingerprintPepper: 'p'.repeat(32),
  })
})

test('fails closed when any submission, consent or fingerprint setting is incomplete', () => {
  for (const environment of [
    { ...valid, AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED: 'false' },
    { ...valid, AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL: 'http://akademate.com/privacy' },
    { ...valid, AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL: 'javascript:alert(1)' },
    { ...valid, AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION: '../latest' },
    { ...valid, AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER: 'too-short' },
  ]) assert.equal(resolveNextPublicSubmissionConfig(environment), null)
})
