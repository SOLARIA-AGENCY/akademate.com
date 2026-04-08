import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLogRequest = vi.fn()
const mockListTenants = vi.fn()
const mockCreateTenant = vi.fn()

async function loadRoute() {
  vi.resetModules()
  vi.doMock('@/lib/api-logger', () => ({
    logRequest: mockLogRequest,
  }))
  vi.doMock('@/lib/ops/tenants', () => ({
    listTenants: mockListTenants,
    createTenant: mockCreateTenant,
  }))
  return import('@/app/api/ops/tenants/route')
}

function buildRequest(url: string, init?: RequestInit) {
  return new Request(url, {
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.20',
    },
    ...init,
  })
}

describe('GET /api/ops/tenants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with tenant list and default pagination', async () => {
    mockListTenants.mockResolvedValue({
      docs: [{ id: 't1', name: 'Tenant Uno' }],
      totalDocs: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    })
    const { GET } = await loadRoute()

    const response = await GET(buildRequest('http://localhost:3010/api/ops/tenants'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.docs).toHaveLength(1)
    expect(mockListTenants).toHaveBeenCalledWith({
      limit: 100,
      page: 1,
      search: undefined,
    })
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/ops/tenants', status: 200 })
    )
  })

  it('returns 400 for invalid query params', async () => {
    const { GET } = await loadRoute()

    const response = await GET(buildRequest('http://localhost:3010/api/ops/tenants?limit=0&page=0'))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Parámetros inválidos')
    expect(mockListTenants).not.toHaveBeenCalled()
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/ops/tenants', status: 400 })
    )
  })

  it('returns 500 when repository throws', async () => {
    mockListTenants.mockRejectedValue(new Error('db error'))
    const { GET } = await loadRoute()

    const response = await GET(buildRequest('http://localhost:3010/api/ops/tenants?limit=20&page=2'))
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe('Error al consultar tenants')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/ops/tenants', status: 500 })
    )
  })
})

describe('POST /api/ops/tenants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 201 and normalizes optional blank fields to null', async () => {
    mockCreateTenant.mockResolvedValue({
      id: 'tenant-123',
      name: 'Tenant Nuevo',
      slug: 'tenant-nuevo',
      domain: null,
      active: true,
      contactEmail: null,
      contactPhone: null,
      notes: null,
      limits: {
        maxUsers: 50,
        maxCourses: 100,
        maxLeadsPerMonth: 5000,
        storageQuotaMB: 10240,
      },
      createdAt: '2026-04-08T09:00:00.000Z',
      updatedAt: '2026-04-08T09:00:00.000Z',
    })
    const { POST } = await loadRoute()

    const response = await POST(
      buildRequest('http://localhost:3010/api/ops/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tenant Nuevo',
          slug: 'tenant-nuevo',
          domain: '',
          contactEmail: '',
          contactPhone: '',
          notes: '',
          limitsMaxUsers: 75,
          limitsMaxCourses: 120,
          limitsMaxLeadsPerMonth: 6000,
          limitsStorageQuotaMB: 20480,
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(payload.doc.id).toBe('tenant-123')
    expect(mockCreateTenant).toHaveBeenCalledWith({
      name: 'Tenant Nuevo',
      slug: 'tenant-nuevo',
      domain: null,
      contactEmail: null,
      contactPhone: null,
      notes: null,
      limitsMaxUsers: 75,
      limitsMaxCourses: 120,
      limitsMaxLeadsPerMonth: 6000,
      limitsStorageQuotaMB: 20480,
    })
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/api/ops/tenants',
        status: 201,
        tenantId: 'tenant-123',
      })
    )
  })

  it('returns 400 for invalid payload', async () => {
    const { POST } = await loadRoute()

    const response = await POST(
      buildRequest('http://localhost:3010/api/ops/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          slug: 'INVALID-SLUG',
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Datos inválidos')
    expect(mockCreateTenant).not.toHaveBeenCalled()
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/api/ops/tenants', status: 400 })
    )
  })

  it('returns 409 when slug already exists', async () => {
    mockCreateTenant.mockRejectedValue({ code: '23505' })
    const { POST } = await loadRoute()

    const response = await POST(
      buildRequest('http://localhost:3010/api/ops/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tenant Duplicado',
          slug: 'tenant-duplicado',
          limitsMaxUsers: 50,
          limitsMaxCourses: 100,
          limitsMaxLeadsPerMonth: 5000,
          limitsStorageQuotaMB: 10240,
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error).toBe('El slug ya existe')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/api/ops/tenants', status: 409 })
    )
  })

  it('returns 500 when create fails unexpectedly', async () => {
    mockCreateTenant.mockRejectedValue(new Error('unexpected failure'))
    const { POST } = await loadRoute()

    const response = await POST(
      buildRequest('http://localhost:3010/api/ops/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tenant Error',
          slug: 'tenant-error',
          limitsMaxUsers: 50,
          limitsMaxCourses: 100,
          limitsMaxLeadsPerMonth: 5000,
          limitsStorageQuotaMB: 10240,
        }),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe('Error al crear tenant')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: '/api/ops/tenants', status: 500 })
    )
  })
})
