import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetPayloadHMR,
  mockResolveMetaRequestContext,
  mockCheckMetaHealth,
  mockCreateCampaign,
  mockCreateAdSet,
  mockCreateAdCreative,
  mockCreateAd,
  mockUploadAdImage,
  mockBuildLandingUrl,
  mockBuildUtmParams,
  mockBuildCampaignName,
} = vi.hoisted(() => ({
  mockGetPayloadHMR: vi.fn(),
  mockResolveMetaRequestContext: vi.fn(),
  mockCheckMetaHealth: vi.fn(),
  mockCreateCampaign: vi.fn(),
  mockCreateAdSet: vi.fn(),
  mockCreateAdCreative: vi.fn(),
  mockCreateAd: vi.fn(),
  mockUploadAdImage: vi.fn(),
  mockBuildLandingUrl: vi.fn(),
  mockBuildUtmParams: vi.fn(),
  mockBuildCampaignName: vi.fn(),
}))

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: mockResolveMetaRequestContext,
}))

vi.mock('@/app/api/meta/_lib/meta-graph', () => ({
  checkMetaHealth: mockCheckMetaHealth,
}))

vi.mock('@/src/lib/meta-marketing', () => ({
  createCampaign: mockCreateCampaign,
  createAdSet: mockCreateAdSet,
  createAdCreative: mockCreateAdCreative,
  createAd: mockCreateAd,
  uploadAdImage: mockUploadAdImage,
  buildLandingUrl: mockBuildLandingUrl,
  buildUtmParams: mockBuildUtmParams,
  buildCampaignName: mockBuildCampaignName,
}))

import { POST } from '@/app/api/meta/ads/route'

describe('POST /api/meta/ads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBuildLandingUrl.mockReturnValue('https://cepformacion.akademate.com/p/convocatorias/CFGM-FARM')
    mockBuildUtmParams.mockReturnValue('utm_source=facebook')
    mockBuildCampaignName.mockReturnValue('SOLARIA AGENCY - CFGM Farmacia')
  })

  it('bloquea creación cuando no hay permisos ads_management', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: {
        adAccountIdNormalized: '730494526974837',
        marketingApiToken: 'token',
      },
    })
    mockCheckMetaHealth.mockResolvedValueOnce({
      status: 'degraded',
      token_status: 'valid',
      permissions_status: 'missing_ads_management',
      permissions: { ads_read: true, ads_management: false },
      ad_account_id: '730494526974837',
      ad_account_access: true,
      token_masked: 'toke...oken',
      token_expires_at: null,
      checked_at: '2026-04-14T10:00:00.000Z',
      error: {
        code: 'MISSING_PERMISSIONS',
        message: 'El token no tiene permiso ads_management.',
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/ads', {
      method: 'POST',
      body: JSON.stringify({
        convocatoriaId: 15,
        dailyBudget: 20,
        headlines: ['Titulo'],
        primaryTexts: ['Texto'],
        descriptions: ['Descripcion'],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.code).toBe('MISSING_PERMISSIONS')
  })

  it('crea campaña en Meta cuando healthcheck está OK', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: {
        adAccountIdNormalized: '730494526974837',
        marketingApiToken: 'token-valido',
        pixelId: '1189071876088388',
      },
    })
    mockCheckMetaHealth.mockResolvedValueOnce({
      status: 'ok',
      token_status: 'valid',
      permissions_status: 'ok',
      permissions: { ads_read: true, ads_management: true },
      ad_account_id: '730494526974837',
      ad_account_access: true,
      token_masked: 'toke...lido',
      token_expires_at: null,
      checked_at: '2026-04-14T10:00:00.000Z',
    })
    mockGetPayloadHMR.mockResolvedValueOnce({
      findByID: vi.fn().mockResolvedValue({
        id: 10,
        campaign_code: 'CFGM-FARM',
        course: { name: 'CFGM Farmacia' },
      }),
    })
    mockCreateCampaign.mockResolvedValueOnce({ success: true, data: { id: 'cmp-1' } })
    mockCreateAdSet.mockResolvedValueOnce({ success: true, data: { id: 'adset-1' } })
    mockCreateAdCreative.mockResolvedValueOnce({ success: true, data: { id: 'creative-1' } })
    mockCreateAd.mockResolvedValueOnce({ success: true, data: { id: 'ad-1' } })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/ads', {
      method: 'POST',
      body: JSON.stringify({
        convocatoriaId: 10,
        dailyBudget: 25,
        headlines: ['Farmacia 2026'],
        primaryTexts: ['Matricúlate ahora'],
        descriptions: ['Plazas limitadas'],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.metaCampaignId).toBe('cmp-1')
    expect(mockCreateCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        adAccountId: '730494526974837',
        accessToken: 'token-valido',
      }),
    )
  })
})
