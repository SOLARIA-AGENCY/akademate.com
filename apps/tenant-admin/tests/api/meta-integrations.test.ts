import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockQueryFirst,
  mockQueryRows,
  mockGetPayloadHMR,
  mockGetAuthenticatedUserContext,
} = vi.hoisted(() => ({
  mockQueryFirst: vi.fn(),
  mockQueryRows: vi.fn(),
  mockGetPayloadHMR: vi.fn(),
  mockGetAuthenticatedUserContext: vi.fn(),
}))

vi.mock('@/@payload-config/lib/db', () => ({
  queryFirst: mockQueryFirst,
  queryRows: mockQueryRows,
}))

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: mockGetAuthenticatedUserContext,
}))

import {
  getTenantIntegrations,
  maskSecret,
  normalizeMetaAdAccountId,
  resolveMetaRequestContext,
  updateTenantIntegrations,
} from '@/app/api/meta/_lib/integrations'

describe('meta integrations helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryRows.mockResolvedValue([])
    mockGetPayloadHMR.mockResolvedValue({})
    mockGetAuthenticatedUserContext.mockResolvedValue(null)
  })

  it('normaliza ad account eliminando prefijo act_', () => {
    expect(normalizeMetaAdAccountId(' act_12345 ')).toBe('12345')
  })

  it('enmascara secretos largos', () => {
    expect(maskSecret('EAAz1234567890TOKEN')).toBe('EAAz...OKEN')
  })

  it('lee integraciones desde columnas integrations_meta_*', async () => {
    mockQueryFirst.mockResolvedValueOnce({
      id: '2',
      raw: {
        integrations_meta_ad_account_id: '730494526974837',
        integrations_meta_marketing_api_token: 'token-largo-123456',
        integrations_meta_pixel_id: 'PIX-1',
      },
    })

    const result = await getTenantIntegrations('2')

    expect(result).toEqual(
      expect.objectContaining({
        metaAdAccountId: '730494526974837',
        metaMarketingApiToken: 'token-largo-123456',
        metaPixelId: 'PIX-1',
      }),
    )
  })

  it('usa fallback legacy branding.integrations si no hay columnas', async () => {
    mockQueryFirst.mockResolvedValueOnce({
      id: '2',
      raw: {
        branding: {
          integrations: {
            metaAdAccountId: '999',
            metaMarketingApiToken: 'legacy-token',
          },
        },
      },
    })

    const result = await getTenantIntegrations('2')

    expect(result).toEqual(
      expect.objectContaining({
        metaAdAccountId: '999',
        metaMarketingApiToken: 'legacy-token',
      }),
    )
  })

  it('actualiza columnas de integraciones cuando existen en esquema', async () => {
    mockQueryRows.mockResolvedValueOnce([
      { column_name: 'integrations_meta_ad_account_id' },
      { column_name: 'integrations_meta_marketing_api_token' },
      { column_name: 'updated_at' },
    ])
    mockQueryFirst.mockResolvedValue(undefined)

    await updateTenantIntegrations('2', {
      ga4MeasurementId: '',
      gtmContainerId: '',
      metaPixelId: '',
      metaAdAccountId: '730',
      metaBusinessId: '',
      metaConversionsApiToken: '',
      metaMarketingApiToken: 'token',
      mailchimpApiKey: '',
      whatsappBusinessId: '',
    })

    expect(mockQueryFirst).toHaveBeenCalledWith(
      expect.stringContaining('integrations_meta_ad_account_id'),
      expect.arrayContaining(['2', '730', 'token']),
    )
  })

  it('resuelve tenant desde sesión autenticada y carga credenciales meta', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValueOnce({
      userId: 'user-1',
      tenantId: 8,
    })
    mockQueryFirst.mockResolvedValueOnce({
      id: '8',
      raw: {
        integrations_meta_ad_account_id: '730494526974837',
        integrations_meta_marketing_api_token: 'token-super-largo',
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns')
    const context = await resolveMetaRequestContext(request)

    expect(context.authenticated).toBe(true)
    expect(context.tenantId).toBe('8')
    expect(context.source).toBe('session')
    expect(context.meta.adAccountIdNormalized).toBe('730494526974837')
    expect(context.meta.tokenMasked).toBe('toke...argo')
  })
})
