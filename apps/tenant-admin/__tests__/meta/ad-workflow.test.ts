import { describe, expect, it } from 'vitest'
import { buildPreview, normalizeAdWorkflowBody, resolveConvocatoriaPlan } from '../../app/api/meta/ads/_workflow'

const request = {
  nextUrl: new URL('https://cepformacion.akademate.com/api/meta/ads/preview'),
} as any

function validBody(overrides = {}) {
  const futureStop = new Date()
  futureStop.setUTCFullYear(futureStop.getUTCFullYear() + 1)
  return normalizeAdWorkflowBody({
    convocatoria_id: 2,
    strategy: 'refresh_existing_ad',
    campaign_id: '6966257948240',
    adset_id: '6966257948640',
    daily_budget: 2000,
    stop_time: futureStop.toISOString(),
    copy: {
      primary_texts: ['Estudia Higiene Bucodental en Tenerife. Plazas limitadas.'],
      headlines: ['Grado Superior Higiene Bucodental'],
      descriptions: ['Titulación oficial.'],
      cta: 'SIGN_UP',
    },
    assets: [
      { media_id: 101, ratio: '1:1', type: 'image' },
      { media_id: 102, ratio: '9:16', type: 'image' },
      { media_id: 103, ratio: '16:9', type: 'image' },
    ],
    ...overrides,
  } as any)
}

describe('Meta ad workflow', () => {
  it('normalizes required copy, budget and placement assets', () => {
    const body = validBody({ daily_budget: 2500 })
    expect(body.daily_budget).toBe(2500)
    expect(body.copy.cta).toBe('SIGN_UP')
    expect(body.assets.map((asset) => asset.ratio)).toEqual(['1:1', '9:16', '16:9'])
  })

  it('requires square and vertical assets before preview/publish', () => {
    expect(() => validBody({ assets: [{ media_id: 101, ratio: '1:1', type: 'image' }] })).toThrow(/1:1 y 9:16/i)
  })

  it('defaults to a new campaign when no existing Meta ids are provided', () => {
    const body = validBody({ strategy: undefined, campaign_id: undefined, adset_id: undefined })
    expect(body.strategy).toBe('new_campaign')
  })

  it('requires existing campaign and adset ids for refresh strategies', () => {
    expect(() => validBody({ strategy: 'refresh_existing_ad', campaign_id: undefined, adset_id: undefined })).toThrow(/campaign_id y adset_id/i)
    expect(() => validBody({ strategy: 'new_ad_existing_adset', campaign_id: undefined, adset_id: '123' })).toThrow(/campaign_id y adset_id/i)
  })

  it('uses convocatoria start_date as stop_time and builds tracking preview', () => {
    const body = validBody({ stop_time: undefined })
    const futureStop = new Date()
    futureStop.setUTCFullYear(futureStop.getUTCFullYear() + 1)
    const convocatoria = {
      id: 2,
      codigo: 'SC-2026-002',
      start_date: futureStop.toISOString(),
      course: { name: 'CFGS Higiene Bucodental' },
    }
    const plan = resolveConvocatoriaPlan({ request, body, convocatoria })
    const preview = buildPreview({ body, convocatoria, plan })
    expect(plan.stopIso).toBe(futureStop.toISOString())
    expect(preview.status_after_publish).toBe('PAUSED')
    expect(preview.tracking.traffic_events).toContain('lead')
    expect(preview.landing_url).toContain('/p/convocatorias/SC-2026-002')
    expect(preview.landing_url).toContain('utm_source=facebook')
  })

  it('builds landing URLs from the current tenant host instead of global app env', () => {
    const previousTenantUrl = process.env.NEXT_PUBLIC_TENANT_URL
    process.env.NEXT_PUBLIC_TENANT_URL = 'https://app.akademate.com'
    try {
      const body = validBody()
      const convocatoria = {
        id: 2,
        codigo: 'SC-2026-CEP',
        start_date: body.stop_time,
        course: { name: 'CFGM Farmacia y Parafarmacia' },
      }
      const plan = resolveConvocatoriaPlan({ request, body, convocatoria })
      expect(plan.landingUrl).toContain('https://cepformacion.akademate.com/p/convocatorias/SC-2026-CEP')
      expect(plan.landingUrl).not.toContain('https://app.akademate.com')
    } finally {
      process.env.NEXT_PUBLIC_TENANT_URL = previousTenantUrl
    }
  })

  it('blocks activation windows when convocatoria already started', () => {
    const body = validBody({ stop_time: '2020-01-01T00:00:00.000Z' })
    expect(() => resolveConvocatoriaPlan({ request, body, convocatoria: { codigo: 'OLD', start_date: '2020-01-01' } })).toThrow(/ya ha comenzado/i)
  })
})
