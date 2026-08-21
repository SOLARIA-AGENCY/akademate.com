import { afterEach, describe, expect, it } from 'vitest'
import {
  inferPaidCampaignFromPath,
  isPaidMetaLanding,
  leadCapiCustomData,
  resolveMetaFbc,
  shouldTrackPublicPageView,
} from '../meta-event-params'

describe('meta-event-params', () => {
  afterEach(() => {
    delete process.env.META_PAID_LANDING_CAMPAIGN_MAP
  })

  it('builds fb.1.{unix}.{fbclid} when _fbc is missing', () => {
    expect(resolveMetaFbc(null, 'abc123', 1_700_000_000_000)).toBe('fb.1.1700000000.abc123')
  })

  it('tracks paid PageView without analytics consent and blocks organic without consent', () => {
    expect(shouldTrackPublicPageView({
      attribution: { utm_source: 'facebook', utm_medium: 'paid' },
      analyticsConsent: false,
    })).toBe(true)
    expect(shouldTrackPublicPageView({
      attribution: { utm_source: 'google', utm_medium: 'organic' },
      analyticsConsent: false,
    })).toBe(false)
  })

  it('does not infer campaign ids from path unless paid and the tenant map is configured', () => {
    const paid = { utm_source: 'facebook', utm_medium: 'paid' }
    expect(inferPaidCampaignFromPath('/p/convocatorias/SC-2026-001', paid)).toBeNull()
    expect(inferPaidCampaignFromPath('/p/convocatorias/SC-2026-001', paid, { 'SC-2026-001': '111' })).toBe('111')
    expect(inferPaidCampaignFromPath('/p/convocatorias/SC-2026-001', { utm_source: 'google', utm_medium: 'organic' }, { 'SC-2026-001': '111' })).toBeNull()
    expect(isPaidMetaLanding({ utm_source: 'facebook', utm_medium: 'cpc' })).toBe(false)
  })

  it('keeps Lead CAPI value at EUR 50', () => {
    expect(leadCapiCustomData()).toMatchObject({ value: 50, currency: 'EUR' })
  })
})
