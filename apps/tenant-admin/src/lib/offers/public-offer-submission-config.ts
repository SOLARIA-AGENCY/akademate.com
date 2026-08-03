type PublicSubmissionEnvironment = {
  AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED?: string
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL?: string
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION?: string
  AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER?: string
}

export type NextPublicSubmissionConfig = {
  privacyNoticeUrl: string
  privacyNoticeVersion: string
  fingerprintPepper: string
}

export function resolveNextPublicSubmissionConfig(
  environment: PublicSubmissionEnvironment,
): NextPublicSubmissionConfig | null {
  if (environment.AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED !== 'true') return null
  const version = environment.AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION ?? ''
  const pepper = environment.AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER ?? ''
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/.test(version) || pepper.length < 32) return null
  try {
    const url = new URL(environment.AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL ?? '')
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return {
      privacyNoticeUrl: url.toString(),
      privacyNoticeVersion: version,
      fingerprintPepper: pepper,
    }
  } catch {
    return null
  }
}

export function currentNextPublicSubmissionConfig(): NextPublicSubmissionConfig | null {
  return resolveNextPublicSubmissionConfig({
    AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED: process.env.AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED,
    AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL: process.env.AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL,
    AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION: process.env.AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION,
    AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER: process.env.AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER,
  })
}
