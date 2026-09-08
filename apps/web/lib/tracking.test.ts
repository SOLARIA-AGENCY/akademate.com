// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  GTM_CONTAINER_ID,
  hasAnalyticsConsent,
  parseCookieConsent,
  trackAnalyticsEvent,
} from '@/lib/tracking'

describe('public analytics consent', () => {
  it('is fail-closed until a valid analytics choice is stored', () => {
    expect(parseCookieConsent(null)).toBeNull()
    expect(parseCookieConsent('{')).toBeNull()
    expect(parseCookieConsent(JSON.stringify({ analytics: true }))).toBeNull()
    expect(hasAnalyticsConsent(null)).toBe(false)
    expect(hasAnalyticsConsent({ analytics: false, version: 1 })).toBe(false)
  })

  it('authorises GTM only after explicit analytics consent', () => {
    expect(GTM_CONTAINER_ID).toBe('GTM-TKSVM638')
    expect(parseCookieConsent(JSON.stringify({ analytics: true, version: 1 }))).toEqual({
      analytics: true,
      version: 1,
    })
    expect(hasAnalyticsConsent({ analytics: true, version: 1 })).toBe(true)
  })

  it('does not push analytics events without a browser consent store', () => {
    expect(() => trackAnalyticsEvent({ event: 'generate_lead', locale: 'en' })).not.toThrow()
  })
})
