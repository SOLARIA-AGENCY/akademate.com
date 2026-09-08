export const CONSENT_STORAGE_KEY = 'akademate_cookie_consent_v1'
export const CONSENT_CHANGE_EVENT = 'akademate:consent'
export const GTM_CONTAINER_ID = 'GTM-TKSVM638'
export const CONSENT_VERSION = 1 as const
/** GA4 recommended + custom events. GTM should map these to GA4, with no Ads/Meta tags. */
export const ANALYTICS_EVENTS = {
  generateLead: 'generate_lead',
  ctaDemo: 'cta_demo',
  selectContent: 'select_content',
} as const

export type CookieConsent = {
  analytics: boolean
  version: typeof CONSENT_VERSION
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function parseCookieConsent(raw: string | null | undefined): CookieConsent | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>
    if (parsed.version !== CONSENT_VERSION || typeof parsed.analytics !== 'boolean') return null
    return { analytics: parsed.analytics, version: CONSENT_VERSION }
  } catch {
    return null
  }
}

export function readStoredCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  return parseCookieConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY))
}

export function writeStoredCookieConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent))
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
}

export function hasAnalyticsConsent(consent: CookieConsent | null | undefined): boolean {
  return consent?.version === CONSENT_VERSION && consent.analytics === true
}

export function trackAnalyticsEvent(payload: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (!hasAnalyticsConsent(readStoredCookieConsent())) return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(payload)
}
