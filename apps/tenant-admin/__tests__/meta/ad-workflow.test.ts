import { describe, expect, it } from 'vitest'
import { activateMetaAd, buildMetaAdUrlParameters, buildPreview, normalizeAdPreflightBody, normalizeAdWorkflowBody, publishToMeta, resolveConvocatoriaPlan } from '../../app/api/meta/ads/_workflow'

const request = {
  nextUrl: new URL('https://demo.akademate.com/api/meta/ads/preview'),
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

  it('normalizes preflight without requiring creative assets', () => {
    const body = normalizeAdPreflightBody({
      convocatoria_id: 2,
      daily_budget: 2000,
      strategy: 'new_campaign',
    })
    expect(body).toMatchObject({
      convocatoria_id: 2,
      daily_budget: 2000,
      strategy: 'new_campaign',
    })
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
      status: 'enrollment_open',
      training_type: 'private',
      start_date: futureStop.toISOString(),
      course: { name: 'CFGS Higiene Bucodental' },
    }
    const plan = resolveConvocatoriaPlan({ request, body, convocatoria })
    const preview = buildPreview({ body, convocatoria, plan })
    expect(plan.stopIso).toBe(futureStop.toISOString())
    expect(preview.status_after_publish).toBe('PAUSED')
    expect(preview.lifecycle.created_in_meta_status).toBe('PAUSED')
    expect(preview.lifecycle.manual_activation_required).toBe(true)
    expect(preview.lifecycle.auto_stop_at).toBe(futureStop.toISOString())
    expect(preview.tracking.public_form_connected).toBe(true)
    expect(preview.tracking.crm_lead_connected).toBe(true)
    expect(preview.tracking.meta_campaign_id_url_tags).toBe(true)
    expect(preview.review_checklist).toContain('La campana no se activa hasta confirmacion manual')
    expect(preview.tracking.traffic_events).toContain('lead')
    expect(preview.landing_url).toContain('/p/convocatorias/SC-2026-002')
    expect(preview.landing_url).toContain('utm_source=facebook')
    expect(preview.placements).toEqual([
      'facebook_feed',
      'facebook_story',
      'facebook_reels',
      'instagram_stream',
      'instagram_story',
      'instagram_reels',
    ])
    expect(preview.placements).not.toContain('right_column')
    expect(preview.campaign_name).toMatch(/^TEST AGENCY - /)
  })

  it('builds landing URLs from the current tenant host instead of global app env', () => {
    const previousTenantUrl = process.env.NEXT_PUBLIC_TENANT_URL
    process.env.NEXT_PUBLIC_TENANT_URL = 'https://app.akademate.com'
    try {
      const body = validBody()
      const convocatoria = {
        id: 2,
        codigo: 'SC-2026-CEP',
        status: 'published',
        start_date: body.stop_time,
        course: { name: 'CFGM Farmacia y Parafarmacia' },
      }
      const plan = resolveConvocatoriaPlan({ request, body, convocatoria })
      expect(plan.landingUrl).toContain('https://demo.akademate.com/p/convocatorias/SC-2026-CEP')
      expect(plan.landingUrl).not.toContain('https://app.akademate.com')
    } finally {
      process.env.NEXT_PUBLIC_TENANT_URL = previousTenantUrl
    }
  })

  it('adds Meta campaign identifiers to ad URL parameters for CRM attribution', () => {
    const params = new URLSearchParams(buildMetaAdUrlParameters({
      utmCampaign: 'SA-SC-TEST',
      metaCampaignId: '6966251962240',
      ratio: '9:16',
    }))
    expect(params.get('utm_campaign')).toBe('SA-SC-TEST')
    expect(params.get('meta_campaign_id')).toBe('6966251962240')
    expect(params.get('campaign_id')).toBe('6966251962240')
    expect(params.get('utm_id')).toBe('6966251962240')
    expect(params.get('utm_content')).toBe('9:16')
  })

  it('blocks activation windows when convocatoria already started', () => {
    const body = validBody({ stop_time: '2020-01-01T00:00:00.000Z' })
    expect(() => resolveConvocatoriaPlan({ request, body, convocatoria: { codigo: 'OLD', start_date: '2020-01-01' } })).toThrow(/ya ha comenzado/i)
  })

  it('blocks Meta advertising when the public convocatoria landing is not available', () => {
    const body = validBody()
    expect(() =>
      resolveConvocatoriaPlan({
        request,
        body,
        convocatoria: {
          codigo: 'DRAFT-2026',
          status: 'draft',
          start_date: body.stop_time,
        },
      })
    ).toThrow(/publicada o abierta/i)
  })

  it('blocks Meta creation until the operator confirms review', async () => {
    await expect(publishToMeta({ request, body: validBody({ review_confirmed: false }) })).rejects.toThrow(/confirmar la revision/i)
  })

  it('blocks activation until the operator confirms manual launch', async () => {
    await expect(activateMetaAd({ request, draftId: 1, confirmed: false })).rejects.toThrow(/confirmar manualmente/i)
  })
})
