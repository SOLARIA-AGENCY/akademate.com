import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const { mockRequireV1Auth, mockGetPublicCatalog, mockGetPublicContentVersion } = vi.hoisted(() => ({
  mockRequireV1Auth: vi.fn(),
  mockGetPublicCatalog: vi.fn(),
  mockGetPublicContentVersion: vi.fn(),
}))

vi.mock('@/lib/v1Auth', () => ({
  requireV1Auth: mockRequireV1Auth,
}))

vi.mock('@/app/lib/server/public-catalog', () => ({
  getPublicCatalog: mockGetPublicCatalog,
  getPublicCatalogSqlFallback: vi.fn(),
  getPublicContentVersion: mockGetPublicContentVersion,
  resolvePublicCatalogHost: () => 'cepformacion.akademate.com',
  PUBLIC_CATALOG_TTL_SECONDS: 60,
  PublicCatalogError: class PublicCatalogError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
      this.name = 'PublicCatalogError'
    }
  },
}))

describe('GET /api/public/v1/health', () => {
  it('returns 200 without an API key', async () => {
    mockGetPublicContentVersion.mockResolvedValue({
      version: 'abc',
      generatedAt: '2026-09-02T00:00:00.000Z',
      tenant: 'cepformacion',
    })
    const { GET } = await import('@/app/api/public/v1/health/route')
    const response = await GET(new Request('http://localhost/api/public/v1/health'))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.status).toBe('healthy')
    expect(body.catalogVersion).toBe('abc')
  })
})

describe('GET /api/public/v1/catalog', () => {
  beforeEach(() => {
    mockRequireV1Auth.mockReset()
    mockGetPublicCatalog.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('rejects requests without an API key', async () => {
    mockRequireV1Auth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Missing API key', code: 'MISSING_API_KEY' }, { status: 401 }),
    })
    const { GET } = await import('@/app/api/public/v1/catalog/route')
    const response = await GET(new NextRequest('http://localhost/api/public/v1/catalog'))
    expect(response.status).toBe(401)
    expect(mockGetPublicCatalog).not.toHaveBeenCalled()
  })

  it('returns a catalog snapshot for catalog:read', async () => {
    mockRequireV1Auth.mockResolvedValue({
      ok: true,
      auth: { valid: true, tenantId: '1', scopes: ['catalog:read'], keyId: 'key-1' },
    })
    mockGetPublicCatalog.mockResolvedValue({
      meta: {
        tenant: 'cepformacion',
        host: 'cepformacion.akademate.com',
        generatedAt: '2026-09-02T00:00:00.000Z',
        version: 'deadbeef',
        cacheTtlSeconds: 60,
      },
      data: {
        branding: {},
        navigation: {},
        seo: {},
        courses: [],
        cycles: [],
        convocatorias: [],
        campuses: [],
        teachers: [],
        pages: [],
        sitemap: [],
      },
    })
    const { GET } = await import('@/app/api/public/v1/catalog/route')
    const response = await GET(
      new NextRequest('http://localhost/api/public/v1/catalog', {
        headers: { authorization: 'Bearer test-key' },
      }),
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.meta.version).toBe('deadbeef')
    expect(response.headers.get('etag')).toBe('"deadbeef"')
  })
})

describe('middleware public origin API', () => {
  it('allows anonymous GET /api/public/v1/health', async () => {
    const { middleware } = await import('@/middleware')
    const request = new NextRequest('https://cepformacion-app.akademate.com/api/public/v1/health')
    const response = middleware(request)
    expect(response.status).toBe(200)
  })
})
