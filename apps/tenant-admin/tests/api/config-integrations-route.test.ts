import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetTenantIntegrations, mockUpdateTenantIntegrations } = vi.hoisted(() => ({
  mockGetTenantIntegrations: vi.fn(),
  mockUpdateTenantIntegrations: vi.fn(),
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  EMPTY_INTEGRATIONS: {
    ga4MeasurementId: '',
    gtmContainerId: '',
    metaPixelId: '',
    metaAdAccountId: '',
    metaBusinessId: '',
    metaConversionsApiToken: '',
    metaMarketingApiToken: '',
    mailchimpApiKey: '',
    whatsappBusinessId: '',
  },
  getTenantIntegrations: mockGetTenantIntegrations,
  updateTenantIntegrations: mockUpdateTenantIntegrations,
}))

import { GET, PUT } from '@/app/api/config/route'

describe('config integrations section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET section=integrations devuelve datos desde columnas reales del tenant', async () => {
    mockGetTenantIntegrations.mockResolvedValueOnce({
      ga4MeasurementId: 'G-123',
      gtmContainerId: '',
      metaPixelId: 'PIX-123',
      metaAdAccountId: '730494526974837',
      metaBusinessId: 'BUS-10',
      metaConversionsApiToken: 'capi-token',
      metaMarketingApiToken: 'marketing-token',
      mailchimpApiKey: '',
      whatsappBusinessId: '',
    })

    const request = new NextRequest(
      'http://localhost:3000/api/config?section=integrations&tenantId=2'
    )
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.metaAdAccountId).toBe('730494526974837')
    expect(mockGetTenantIntegrations).toHaveBeenCalledWith('2')
  })

  it('PUT section=integrations persiste en columnas integrations_meta_*', async () => {
    mockGetTenantIntegrations.mockResolvedValueOnce({
      ga4MeasurementId: '',
      gtmContainerId: '',
      metaPixelId: '',
      metaAdAccountId: '',
      metaBusinessId: '',
      metaConversionsApiToken: '',
      metaMarketingApiToken: '',
      mailchimpApiKey: '',
      whatsappBusinessId: '',
    })
    mockUpdateTenantIntegrations.mockResolvedValueOnce(undefined)

    const request = new NextRequest('http://localhost:3000/api/config', {
      method: 'PUT',
      body: JSON.stringify({
        section: 'integrations',
        tenantId: '2',
        data: {
          ga4MeasurementId: '',
          gtmContainerId: '',
          metaPixelId: 'PIX-555',
          metaAdAccountId: '730',
          metaBusinessId: '',
          metaConversionsApiToken: '',
          metaMarketingApiToken: 'token-updated',
          mailchimpApiKey: '',
          whatsappBusinessId: '',
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PUT(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(mockUpdateTenantIntegrations).toHaveBeenCalledWith(
      '2',
      expect.objectContaining({
        metaAdAccountId: '730',
        metaMarketingApiToken: 'token-updated',
      }),
    )
  })
})
