import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockResolveMetaRequestContext,
  mockCheckMetaHealth,
  mockFetchSolariaCampaigns,
  mockFetchCampaignInsights,
  mockFetchCampaignAds,
  mockResolveInsightsRange,
  mockBuildInsightsSummary,
  mockParseBudget,
  mockBuildAdsManagerUrl,
  mockGetPrimaryPreviewFromAds,
} = vi.hoisted(() => ({
  mockResolveMetaRequestContext: vi.fn(),
  mockCheckMetaHealth: vi.fn(),
  mockFetchSolariaCampaigns: vi.fn(),
  mockFetchCampaignInsights: vi.fn(),
  mockFetchCampaignAds: vi.fn(),
  mockResolveInsightsRange: vi.fn(),
  mockBuildInsightsSummary: vi.fn(),
  mockParseBudget: vi.fn(),
  mockBuildAdsManagerUrl: vi.fn(),
  mockGetPrimaryPreviewFromAds: vi.fn(),
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: mockResolveMetaRequestContext,
}))

vi.mock('@/app/api/meta/_lib/meta-graph', () => ({
  checkMetaHealth: mockCheckMetaHealth,
  fetchSolariaCampaigns: mockFetchSolariaCampaigns,
  fetchCampaignInsights: mockFetchCampaignInsights,
  fetchCampaignAds: mockFetchCampaignAds,
  resolveInsightsRange: mockResolveInsightsRange,
  buildInsightsSummary: mockBuildInsightsSummary,
  parseBudget: mockParseBudget,
  buildAdsManagerUrl: mockBuildAdsManagerUrl,
  getPrimaryPreviewFromAds: mockGetPrimaryPreviewFromAds,
}))

import { GET } from '@/app/api/meta/campaigns/route'

const HEALTH_OK = {
  status: 'ok',
  token_status: 'valid',
  permissions_status: 'ok',
  permissions: { ads_read: true, ads_management: true },
  ad_account_id: '730494526974837',
  ad_account_access: true,
  token_masked: 'toke...oken',
  token_expires_at: null,
  checked_at: '2026-04-14T10:00:00.000Z',
} as const

const RANGE_OK = {
  range: {
    input: '30d',
    since: '2026-03-16',
    until: '2026-04-14',
    datePreset: 'last_30d',
    key: '30d:2026-03-16:2026-04-14',
  },
  warnings: [],
} as const

const INSIGHTS_SUMMARY = {
  range: {
    input: '30d',
    since: '2026-03-16',
    until: '2026-04-14',
  },
  spend: { value: 123.45, state: 'loaded' },
  impressions: { value: 1000, state: 'loaded' },
  reach: { value: 780, state: 'loaded' },
  clicks: { value: 42, state: 'loaded' },
  ctr: { value: 4.2, state: 'loaded' },
  cpc: { value: 2.94, state: 'loaded' },
  cpm: { value: 12.1, state: 'loaded' },
  results: {
    value: 8,
    state: 'loaded',
    result_type: 'lead',
    cost_per_result: 15.43,
    cost_per_result_state: 'loaded',
  },
} as const

describe('GET /api/meta/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockResolveInsightsRange.mockReturnValue(RANGE_OK)
    mockBuildInsightsSummary.mockReturnValue(INSIGHTS_SUMMARY)
    mockParseBudget.mockReturnValue(25)
    mockBuildAdsManagerUrl.mockImplementation(
      (adAccountId: string, campaignId: string) =>
        `https://adsmanager.facebook.com/?act=${adAccountId}&campaign_ids=${campaignId}`
    )
    mockGetPrimaryPreviewFromAds.mockReturnValue({
      thumbnail_url: 'https://example.com/thumb.jpg',
      image_url: null,
      preview_state: 'loaded',
    })
  })

  it('devuelve 401 cuando no hay sesion autenticada', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: false,
      tenantId: null,
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error.code).toBe('UNAUTHORIZED')
  })

  it('devuelve estado degradado cuando healthcheck falla', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { adAccountIdNormalized: '730', marketingApiToken: 'token' },
    })

    mockCheckMetaHealth.mockResolvedValueOnce({
      ...HEALTH_OK,
      status: 'degraded',
      token_status: 'expired',
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Session has expired',
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.docs).toEqual([])
    expect(payload.totalDocs).toBe(0)
    expect(payload.error.code).toBe('TOKEN_EXPIRED')
  })

  it('mapea campanas live al nuevo contrato operativo', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { adAccountIdNormalized: '730494526974837', marketingApiToken: 'token' },
    })

    mockCheckMetaHealth.mockResolvedValueOnce(HEALTH_OK)

    mockFetchSolariaCampaigns.mockResolvedValueOnce({
      ok: true,
      data: {
        data: [
          {
            id: '12001',
            name: 'SOLARIA AGENCY - CEP - Farmacia',
            status: 'ACTIVE',
            effective_status: 'ACTIVE',
            objective: 'OUTCOME_LEADS',
            daily_budget: '2500',
            created_time: '2026-04-14T08:00:00+0000',
            updated_time: '2026-04-14T09:00:00+0000',
          },
        ],
      },
    })

    mockFetchCampaignInsights.mockResolvedValueOnce({
      ok: true,
      data: { data: [{}] },
    })

    mockFetchCampaignAds.mockResolvedValueOnce({
      ok: true,
      data: { data: [{ id: 'ad_1' }] },
    })

    const request = new NextRequest(
      'https://cepformacion.akademate.com/api/meta/campaigns?range=30d&sort=updated_time&order=desc'
    )
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.totalDocs).toBe(1)
    expect(payload.docs[0]).toMatchObject({
      campaign: {
        id: '12001',
        name: 'SOLARIA AGENCY - CEP - Farmacia',
        status: 'active',
        campaign_type: 'meta_ads',
        budget: 25,
      },
      insights_summary: {
        spend: { value: 123.45, state: 'loaded' },
        results: { value: 8, state: 'loaded' },
      },
      preview: {
        preview_state: 'loaded',
      },
      sync_status: {
        source: 'meta_live',
      },
    })
    expect(payload.docs[0].campaign.ads_manager_url).toContain('campaign_ids=12001')
    expect(payload.sort).toBe('updated_time')
    expect(payload.order).toBe('desc')
  })
})
