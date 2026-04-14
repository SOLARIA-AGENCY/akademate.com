import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockResolveMetaRequestContext,
  mockCheckMetaHealth,
  mockResolveInsightsRange,
  mockFetchCampaignById,
  mockFetchCampaignInsights,
  mockFetchCampaignAdSets,
  mockFetchCampaignAds,
  mockBuildInsightsSummary,
  mockParseBudget,
  mockBuildAdsManagerUrl,
} = vi.hoisted(() => ({
  mockResolveMetaRequestContext: vi.fn(),
  mockCheckMetaHealth: vi.fn(),
  mockResolveInsightsRange: vi.fn(),
  mockFetchCampaignById: vi.fn(),
  mockFetchCampaignInsights: vi.fn(),
  mockFetchCampaignAdSets: vi.fn(),
  mockFetchCampaignAds: vi.fn(),
  mockBuildInsightsSummary: vi.fn(),
  mockParseBudget: vi.fn(),
  mockBuildAdsManagerUrl: vi.fn(),
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: mockResolveMetaRequestContext,
}))

vi.mock('@/app/api/meta/_lib/meta-graph', () => ({
  checkMetaHealth: mockCheckMetaHealth,
  resolveInsightsRange: mockResolveInsightsRange,
  fetchCampaignById: mockFetchCampaignById,
  fetchCampaignInsights: mockFetchCampaignInsights,
  fetchCampaignAdSets: mockFetchCampaignAdSets,
  fetchCampaignAds: mockFetchCampaignAds,
  buildInsightsSummary: mockBuildInsightsSummary,
  parseBudget: mockParseBudget,
  buildAdsManagerUrl: mockBuildAdsManagerUrl,
}))

import { GET } from '@/app/api/meta/campaigns/[campaignId]/route'

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
  spend: { value: 0, state: 'zero_real' },
  impressions: { value: 0, state: 'zero_real' },
  reach: { value: 0, state: 'zero_real' },
  clicks: { value: 0, state: 'zero_real' },
  ctr: { value: 0, state: 'zero_real' },
  cpc: { value: 0, state: 'zero_real' },
  cpm: { value: 0, state: 'zero_real' },
  results: {
    value: 0,
    state: 'zero_real',
    result_type: 'lead',
    cost_per_result: 0,
    cost_per_result_state: 'zero_real',
  },
} as const

describe('GET /api/meta/campaigns/[campaignId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockResolveInsightsRange.mockReturnValue(RANGE_OK)
    mockBuildInsightsSummary.mockReturnValue(INSIGHTS_SUMMARY)
    mockParseBudget.mockReturnValue(25)
    mockBuildAdsManagerUrl.mockImplementation(
      (adAccountId: string, campaignId: string) =>
        `https://adsmanager.facebook.com/?act=${adAccountId}&campaign_ids=${campaignId}`
    )
  })

  it('devuelve 401 cuando no hay sesion', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: false,
      tenantId: null,
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns/12001')
    const response = await GET(request, { params: Promise.resolve({ campaignId: '12001' }) })
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error.code).toBe('UNAUTHORIZED')
  })

  it('bloquea campanas fuera del prefijo SOLARIA', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { adAccountIdNormalized: '730494526974837', marketingApiToken: 'token' },
    })
    mockCheckMetaHealth.mockResolvedValueOnce(HEALTH_OK)
    mockFetchCampaignById.mockResolvedValueOnce({
      ok: true,
      data: {
        id: '12001',
        name: 'OTRA AGENCIA - Brand awareness',
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns/12001')
    const response = await GET(request, { params: Promise.resolve({ campaignId: '12001' }) })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.code).toBe('AD_ACCOUNT_ACCESS_DENIED')
  })

  it('devuelve detalle completo con adsets, ads y creatives', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { adAccountIdNormalized: '730494526974837', marketingApiToken: 'token' },
    })
    mockCheckMetaHealth.mockResolvedValueOnce(HEALTH_OK)

    mockFetchCampaignById.mockResolvedValueOnce({
      ok: true,
      data: {
        id: '12001',
        name: 'SOLARIA AGENCY - CEP - Farmacia',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        objective: 'OUTCOME_LEADS',
        daily_budget: '2500',
      },
    })

    mockFetchCampaignInsights.mockResolvedValueOnce({
      ok: true,
      data: { data: [{}] },
    })

    mockFetchCampaignAdSets.mockResolvedValueOnce({
      ok: true,
      data: {
        data: [
          {
            id: 'adset_1',
            name: 'Adset Campus',
            status: 'ACTIVE',
            effective_status: 'ACTIVE',
            daily_budget: '2500',
          },
        ],
      },
    })

    mockFetchCampaignAds.mockResolvedValueOnce({
      ok: true,
      data: {
        data: [
          {
            id: 'ad_1',
            name: 'Ad principal',
            status: 'ACTIVE',
            effective_status: 'ACTIVE',
            adset_id: 'adset_1',
            creative: {
              id: 'creative_1',
              name: 'Creative principal',
              thumbnail_url: 'https://example.com/thumb.jpg',
              image_url: null,
              video_id: null,
            },
          },
        ],
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns/12001?range=30d')
    const response = await GET(request, { params: Promise.resolve({ campaignId: '12001' }) })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.campaign).toMatchObject({
      id: '12001',
      name: 'SOLARIA AGENCY - CEP - Farmacia',
      campaign_type: 'meta_ads',
      budget: 25,
    })
    expect(payload.insights_summary.results.state).toBe('zero_real')
    expect(payload.adsets).toHaveLength(1)
    expect(payload.ads).toHaveLength(1)
    expect(payload.creatives[0]).toMatchObject({
      id: 'creative_1',
      preview_state: 'loaded',
    })
  })
})
