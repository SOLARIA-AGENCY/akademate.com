import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockResolveMetaRequestContext } = vi.hoisted(() => ({
  mockResolveMetaRequestContext: vi.fn(),
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: mockResolveMetaRequestContext,
  normalizeMetaAdAccountId: (value: string) => value.replace(/^act_/i, ''),
}))

import { GET } from '@/app/api/meta/ad-accounts/route'

describe('GET /api/meta/ad-accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when session is not authenticated', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: false,
      tenantId: null,
      meta: { marketingApiToken: '' },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/ad-accounts')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error.code).toBe('UNAUTHORIZED')
  })

  it('filters out inactive ad accounts by default', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { marketingApiToken: 'token' },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              { id: 'act_100', account_id: '100', name: 'Cuenta activa', account_status: 1 },
              { id: 'act_200', account_id: '200', name: 'Cuenta pausada', account_status: 2 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/ad-accounts')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.totalDocs).toBe(1)
    expect(payload.docs[0]).toMatchObject({
      id: '100',
      account_id: '100',
      active: true,
    })
  })

  it('includes inactive accounts when include_inactive=true', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { marketingApiToken: 'token' },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              { id: 'act_100', account_id: '100', name: 'Cuenta activa', account_status: 1 },
              { id: 'act_200', account_id: '200', name: 'Cuenta pausada', account_status: 2 },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/ad-accounts?include_inactive=true')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.totalDocs).toBe(2)
  })

  it('returns graceful error payload when Meta API fails', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { marketingApiToken: 'token' },
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'Invalid OAuth access token.' } }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/ad-accounts')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.docs).toEqual([])
    expect(payload.error.code).toBe('META_API_ERROR')
  })
})
