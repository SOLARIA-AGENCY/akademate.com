export type LegalField = {
  label: string
  value: string | null
  publicNote: string
}

const pending = (label: string, publicNote: string): LegalField => ({
  label,
  value: null,
  publicNote,
})

export const legalCompany = {
  name: 'SOLARIA AGENCY OÜ',
  registryCode: pending(
    'Estonian registry code',
    'Pending documentary validation before final publication.'
  ),
  vatId: pending(
    'Tax / VAT identifier',
    'Pending tax validation before final publication.'
  ),
  registeredOffice: pending(
    'Registered office in Estonia',
    'Pending registry validation before final publication.'
  ),
  operatingAddress: pending(
    'Operating address in Malmö',
    'Pending internal validation before final publication.'
  ),
  privacyContact: pending(
    'Privacy contact',
    'Dedicated channel pending validation. In the meantime, enquiries may be sent to info@akademate.com.'
  ),
} as const

export const legalLastUpdated = '29 July 2026'

export const legalDraftNotice =
  'Working legal information under professional review. Final registry, tax, address and privacy contact details will be published after documentary validation.'

export const legalLinks = [
  { title: 'Privacy', href: '/legal/privacidad' },
  { title: 'Terms', href: '/legal/terminos' },
  { title: 'Cookies', href: '/legal/cookies' },
  { title: 'Subprocessors and providers', href: '/legal/subencargados' },
  { title: 'AI transparency', href: '/legal/ia' },
] as const

export const trackingPolicy = {
  currentStatus: 'no-non-essential-trackers',
  statement:
    'The public website does not currently load third-party analytics or marketing. No consent manager is installed because there are no non-essential purposes to authorise.',
  activationGate:
    'Before GA4, GTM, Meta Pixel or equivalent technology is introduced, granular fail-closed consent must be added, the cookie inventory updated and the absence of pre-consent tracking demonstrated.',
} as const

export function formatLegalField(field: LegalField) {
  return field.value ?? field.publicNote
}
