import { describe, expect, it } from 'vitest'
import {
  acceptOfferedDecision,
  applyConsentEvent,
  canLoadAnalytics,
  canLoadGoogleMarketing,
  canLoadMetaMarketing,
  emptyConsentStats,
  legalCookieCategories,
  offeredConsentCategories,
  parseVisitorConsent,
  rejectNonessentialDecision,
  resolveAdsFlags,
  serializeVisitorConsent,
} from '../website/consent'
import { DEFAULT_WEBSITE_CONSENT } from '../website/consent'

describe('website consent', () => {
  it('hides marketing categories when ads integrations are off', () => {
    const offered = offeredConsentCategories(DEFAULT_WEBSITE_CONSENT, { googleAds: false, metaAds: false })
    expect(offered.map((item) => item.id)).toEqual(['analytics'])
    expect(legalCookieCategories({ googleAds: false, metaAds: false }).map((item) => item.id)).toEqual([
      'necessary',
      'analytics',
    ])
  })

  it('offers Google and Meta only when those ads are on', () => {
    const offered = offeredConsentCategories(DEFAULT_WEBSITE_CONSENT, { googleAds: true, metaAds: true })
    expect(offered.map((item) => item.id)).toEqual(['analytics', 'marketing_google', 'marketing_meta'])
  })

  it('treats GTM as Google ads activation and pixel as Meta', () => {
    expect(resolveAdsFlags({ gtmContainerId: 'GTM-1', metaPixelId: '' })).toEqual({
      googleAds: true,
      metaAds: false,
    })
    expect(resolveAdsFlags({ googleAdsEnabled: true, metaPixelId: 'PIX' })).toEqual({
      googleAds: true,
      metaAds: true,
    })
  })

  it('gates scripts until the matching category is granted and the integration is live', () => {
    const yes = { analytics: true, marketing_google: true, marketing_meta: true, decidedAt: '2026-01-01' }
    const adsOn = { googleAds: true, metaAds: true }
    const adsOff = { googleAds: false, metaAds: false }

    expect(canLoadAnalytics(yes, 'G-1')).toBe(true)
    expect(canLoadAnalytics({ ...yes, analytics: false }, 'G-1')).toBe(false)
    expect(canLoadGoogleMarketing(yes, adsOn, 'GTM-1')).toBe(true)
    expect(canLoadGoogleMarketing(yes, adsOff, 'GTM-1')).toBe(false)
    expect(canLoadMetaMarketing(yes, adsOn, 'PIX')).toBe(true)
    expect(canLoadMetaMarketing(yes, adsOff, 'PIX')).toBe(false)
  })

  it('keeps reject-nonessential and offered-accept decisions honest', () => {
    expect(rejectNonessentialDecision()).toEqual({
      analytics: false,
      marketing_google: false,
      marketing_meta: false,
    })
    const offered = offeredConsentCategories(DEFAULT_WEBSITE_CONSENT, { googleAds: false, metaAds: true })
    expect(acceptOfferedDecision(offered)).toEqual({
      analytics: true,
      marketing_google: false,
      marketing_meta: true,
    })
  })

  it('migrates the legacy combined marketing flag without inventing PII', () => {
    expect(
      parseVisitorConsent({ analytics: true, marketing: true, decidedAt: '2026-01-01' }),
    ).toMatchObject({
      analytics: true,
      marketing_google: true,
      marketing_meta: true,
    })
  })

  it('persists category flags plus a timestamp and never stores PII', () => {
    const stored = serializeVisitorConsent(rejectNonessentialDecision(), '2026-08-21T10:00:00.000Z')
    expect(stored).toEqual({
      analytics: false,
      marketing_google: false,
      marketing_meta: false,
      decidedAt: '2026-08-21T10:00:00.000Z',
    })
    expect(JSON.stringify(stored)).not.toMatch(/email|phone|nombre|dni/i)
  })

  it('records only shown/decision rates and skips ads categories when those integrations are off', () => {
    const afterShow = applyConsentEvent(emptyConsentStats(), {
      shown: true,
      pageSlug: '/legal/cookies',
      bannerVariant: 'bar',
      ads: { googleAds: false, metaAds: false },
    })
    expect(afterShow.shown).toBe(1)
    const afterReject = applyConsentEvent(afterShow, {
      ads: { googleAds: false, metaAds: true },
      decision: rejectNonessentialDecision(),
    })
    expect(afterReject.analyticsDenied).toBe(1)
    expect(afterReject.marketingGoogleDenied).toBe(0)
    expect(afterReject.marketingMetaDenied).toBe(1)
  })
})
