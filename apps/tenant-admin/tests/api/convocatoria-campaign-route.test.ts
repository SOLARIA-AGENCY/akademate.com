import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, metaContextMock, metaGraphMock } = vi.hoisted(() => ({
  payloadMock: {
    auth: vi.fn(),
    find: vi.fn(),
    findByID: vi.fn(),
    db: { drizzle: { execute: vi.fn() } },
  },
  metaContextMock: vi.fn(),
  metaGraphMock: {
    buildAdsManagerUrl: vi.fn(
      (account: string, campaign: string) =>
        `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${account}&campaign_ids=${campaign}`
    ),
    buildInsightsSummary: vi.fn(),
    checkMetaHealth: vi.fn(),
    fetchCampaignAds: vi.fn(),
    fetchCampaignById: vi.fn(),
    fetchCampaignInsights: vi.fn(),
    resolveInsightsRange: vi.fn(),
  },
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => payloadMock) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('jose', () => ({ jwtVerify: vi.fn() }))
vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: metaContextMock,
}))
vi.mock('@/app/api/meta/_lib/meta-graph', () => metaGraphMock)

async function loadRoute() {
  vi.resetModules()
  return import('../../app/api/convocatorias/[convocatoriaId]/campaign/route')
}

function request() {
  return new NextRequest('http://localhost/api/convocatorias/41/campaign')
}

function params() {
  return { params: Promise.resolve({ convocatoriaId: '41' }) }
}

function directDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: 9,
    status: 'active',
    meta_campaign_id: 'meta-9001',
    meta_adset_id: 'adset-1',
    meta_ad_id: 'ad-1',
    meta_ads: [],
    created_at: '2026-07-20T10:00:00.000Z',
    updated_at: '2026-07-20T10:00:00.000Z',
    ...overrides,
  }
}

describe('GET /api/convocatorias/:id/campaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED = 'true'
    process.env.AKADEMATE_CEP_MULTI_ENTITY_ENVIRONMENT = 'staging'
    payloadMock.auth.mockResolvedValue({ user: { id: 12, tenant: 7 } })
    payloadMock.findByID.mockResolvedValue({ id: 41, tenant: 7, course: null })
    payloadMock.find.mockResolvedValue({ docs: [] })
    payloadMock.db.drizzle.execute.mockResolvedValue({ rows: [directDraft()] })
    metaContextMock.mockResolvedValue({
      authenticated: true,
      tenantId: '7',
      source: 'session',
      meta: {
        adAccountIdNormalized: '123',
        marketingApiToken: 'secret-token',
      },
    })
    metaGraphMock.checkMetaHealth.mockResolvedValue({ status: 'ok' })
    metaGraphMock.fetchCampaignById.mockResolvedValue({
      ok: true,
      data: { id: 'meta-9001', name: 'Ciclo activo', effective_status: 'ACTIVE' },
    })
    metaGraphMock.resolveInsightsRange.mockReturnValue({
      range: { input: '30d', datePreset: 'last_30d', since: '2026-06-27', until: '2026-07-26' },
      warnings: [],
    })
    metaGraphMock.fetchCampaignInsights.mockResolvedValue({
      ok: false,
      error: { code: 'NETWORK_ERROR' },
    })
    metaGraphMock.fetchCampaignAds.mockResolvedValue({
      ok: true,
      data: { data: [{ id: 'ad-1', name: 'Ad principal' }] },
    })
    metaGraphMock.buildInsightsSummary.mockReturnValue({
      spend: { value: null },
      impressions: { value: null },
      reach: { value: null },
      clicks: { value: null },
      ctr: { value: null },
      cpc: { value: null },
      results: { value: null, result_type: null, cost_per_result: null },
    })
  })

  it('keeps the new endpoint disabled unless both safety gates are enabled', async () => {
    delete process.env.AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED
    const { GET } = await loadRoute()
    const response = await GET(request(), params())
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('CONVOCATORIA_CAMPAIGN_READ_DISABLED')
    expect(payloadMock.auth).not.toHaveBeenCalled()
  })

  it('resolves a cycle without course from the tenant-scoped direct draft', async () => {
    const { GET } = await loadRoute()
    const response = await GET(request(), params())
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      linkStatus: 'linked',
      metaCampaignId: 'meta-9001',
      deliveryStatus: 'active',
      campaignName: 'Ciclo activo',
      primaryMetaAdId: 'ad-1',
      adCount: 1,
      source: 'meta_live',
    })
    expect(metaGraphMock.fetchCampaignInsights).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: 'meta-9001' })
    )
    expect(metaGraphMock.fetchCampaignAds).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: 'meta-9001' })
    )
    expect(body.metrics).toEqual(
      expect.objectContaining({ spend: null, conversions: null, roas: null })
    )
    expect(body.internalDetailUrl).toBe('/campanas/meta-9001')
    expect(body.adsManagerUrl).not.toContain('secret-token')
  })

  it('does not select between two explicit campaigns', async () => {
    payloadMock.db.drizzle.execute.mockResolvedValue({
      rows: [directDraft(), directDraft({ id: 8, meta_campaign_id: 'meta-9002' })],
    })
    const { GET } = await loadRoute()
    const body = await (await GET(request(), params())).json()

    expect(body).toMatchObject({ linkStatus: 'ambiguous', metaCampaignId: null })
    expect(metaGraphMock.fetchCampaignById).not.toHaveBeenCalled()
  })

  it('returns candidates without treating course heuristics as a link', async () => {
    payloadMock.db.drizzle.execute.mockResolvedValue({ rows: [] })
    payloadMock.findByID.mockResolvedValue({ id: 41, tenant: 7, course: { id: 187 } })
    payloadMock.find.mockResolvedValue({ docs: [{ id: 501, name: 'Campaña candidata' }] })
    const { GET } = await loadRoute()
    const body = await (await GET(request(), params())).json()

    expect(body).toMatchObject({
      linkStatus: 'not_linked',
      metaCampaignId: null,
      candidateCount: 1,
    })
    expect(body.candidates).toEqual([
      { localCampaignId: '501', name: 'Campaña candidata', reason: 'course_heuristic' },
    ])
    expect(payloadMock.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [{ tenant: { equals: 7 } }, { course: { equals: 187 } }],
        },
      })
    )
    expect(metaGraphMock.fetchCampaignById).not.toHaveBeenCalled()
  })

  it('does not resolve a convocatoria that belongs to another tenant', async () => {
    payloadMock.findByID.mockResolvedValue({ id: 41, tenant: 8, course: { id: 187 } })
    const { GET } = await loadRoute()
    const response = await GET(request(), params())
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error.code).toBe('CONVOCATORIA_NOT_FOUND')
    expect(payloadMock.db.drizzle.execute).not.toHaveBeenCalled()
    expect(payloadMock.find).not.toHaveBeenCalled()
    expect(metaGraphMock.fetchCampaignById).not.toHaveBeenCalled()
  })

  it('does not translate an unavailable draft table into no campaign', async () => {
    payloadMock.db.drizzle.execute.mockRejectedValue(new Error('relation missing'))
    const { GET } = await loadRoute()
    const body = await (await GET(request(), params())).json()

    expect(body).toMatchObject({ linkStatus: 'unavailable', source: 'unavailable' })
    expect(body.linkStatus).not.toBe('not_linked')
  })

  it('rejects a tenant context mismatch before querying Meta', async () => {
    metaContextMock.mockResolvedValue({
      authenticated: true,
      tenantId: '8',
      source: 'session',
      meta: { adAccountIdNormalized: '999', marketingApiToken: 'other-token' },
    })
    const { GET } = await loadRoute()
    const body = await (await GET(request(), params())).json()

    expect(body).toMatchObject({ linkStatus: 'linked', source: 'unavailable' })
    expect(metaGraphMock.fetchCampaignById).not.toHaveBeenCalled()
  })
})
