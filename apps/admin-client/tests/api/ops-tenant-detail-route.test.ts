import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLogRequest = vi.fn()
const mockGetTenantById = vi.fn()
const mockUpdateTenant = vi.fn()

async function loadRoute() {
  vi.resetModules()
  vi.doMock('@/lib/api-logger', () => ({
    logRequest: mockLogRequest,
  }))
  vi.doMock('@/lib/ops/tenants', () => ({
    getTenantById: mockGetTenantById,
    updateTenant: mockUpdateTenant,
  }))
  return import('@/app/api/ops/tenants/[id]/route')
}

function buildRequest(url: string, init?: RequestInit) {
  return new Request(url, {
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.21',
    },
    ...init,
  })
}

describe('GET /api/ops/tenants/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with tenant detail', async () => {
    mockGetTenantById.mockResolvedValue({
      id: 'tenant-1',
      name: 'Tenant Uno',
      slug: 'tenant-uno',
      domain: 'tenant-uno.akademate.com',
      active: true,
    })
    const { GET } = await loadRoute()

    const response = await GET(buildRequest('http://localhost:3010/api/ops/tenants/tenant-1'), {
      params: Promise.resolve({ id: 'tenant-1' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.doc.id).toBe('tenant-1')
    expect(mockGetTenantById).toHaveBeenCalledWith('tenant-1')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/api/ops/tenants/[id]',
        status: 200,
        tenantId: 'tenant-1',
      })
    )
  })

  it('returns 404 when tenant does not exist', async () => {
    mockGetTenantById.mockResolvedValue(null)
    const { GET } = await loadRoute()

    const response = await GET(buildRequest('http://localhost:3010/api/ops/tenants/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe('Tenant no encontrado')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/ops/tenants/[id]', status: 404 })
    )
  })

  it('returns 500 when loading tenant fails', async () => {
    mockGetTenantById.mockRejectedValue(new Error('db failure'))
    const { GET } = await loadRoute()

    const response = await GET(buildRequest('http://localhost:3010/api/ops/tenants/tenant-1'), {
      params: Promise.resolve({ id: 'tenant-1' }),
    })
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe('Error al cargar tenant')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/api/ops/tenants/[id]', status: 500 })
    )
  })
})

describe('PATCH /api/ops/tenants/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 and normalizes empty optional values to null', async () => {
    mockUpdateTenant.mockResolvedValue({
      id: 'tenant-2',
      name: 'Tenant Dos',
      slug: 'tenant-dos',
      domain: null,
      active: false,
    })
    const { PATCH } = await loadRoute()

    const response = await PATCH(
      buildRequest('http://localhost:3010/api/ops/tenants/tenant-2', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Tenant Dos',
          slug: 'tenant-dos',
          domain: '',
          contactEmail: '',
          contactPhone: '',
          notes: '',
          active: false,
          limitsMaxUsers: 80,
          limitsMaxCourses: 150,
          limitsMaxLeadsPerMonth: 7000,
          limitsStorageQuotaMB: 30720,
        }),
      }),
      { params: Promise.resolve({ id: 'tenant-2' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.doc.id).toBe('tenant-2')
    expect(mockUpdateTenant).toHaveBeenCalledWith('tenant-2', {
      name: 'Tenant Dos',
      slug: 'tenant-dos',
      domain: null,
      contactEmail: null,
      contactPhone: null,
      notes: null,
      active: false,
      limitsMaxUsers: 80,
      limitsMaxCourses: 150,
      limitsMaxLeadsPerMonth: 7000,
      limitsStorageQuotaMB: 30720,
    })
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        path: '/api/ops/tenants/[id]',
        status: 200,
        tenantId: 'tenant-2',
      })
    )
  })

  it('returns 400 for invalid payload', async () => {
    const { PATCH } = await loadRoute()

    const response = await PATCH(
      buildRequest('http://localhost:3010/api/ops/tenants/tenant-2', {
        method: 'PATCH',
        body: JSON.stringify({
          name: '',
          slug: 'INVALID',
          active: true,
          limitsMaxUsers: 0,
          limitsMaxCourses: 0,
          limitsMaxLeadsPerMonth: 0,
          limitsStorageQuotaMB: 0,
        }),
      }),
      { params: Promise.resolve({ id: 'tenant-2' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Datos inválidos')
    expect(mockUpdateTenant).not.toHaveBeenCalled()
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 400 })
    )
  })

  it('returns 404 when tenant to update does not exist', async () => {
    mockUpdateTenant.mockResolvedValue(null)
    const { PATCH } = await loadRoute()

    const response = await PATCH(
      buildRequest('http://localhost:3010/api/ops/tenants/missing', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Tenant Missing',
          slug: 'tenant-missing',
          active: true,
          limitsMaxUsers: 50,
          limitsMaxCourses: 100,
          limitsMaxLeadsPerMonth: 5000,
          limitsStorageQuotaMB: 10240,
        }),
      }),
      { params: Promise.resolve({ id: 'missing' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe('Tenant no encontrado')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 404 })
    )
  })

  it('returns 409 on slug conflict', async () => {
    mockUpdateTenant.mockRejectedValue({ code: '23505' })
    const { PATCH } = await loadRoute()

    const response = await PATCH(
      buildRequest('http://localhost:3010/api/ops/tenants/tenant-3', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Tenant Tres',
          slug: 'tenant-tres',
          active: true,
          limitsMaxUsers: 50,
          limitsMaxCourses: 100,
          limitsMaxLeadsPerMonth: 5000,
          limitsStorageQuotaMB: 10240,
        }),
      }),
      { params: Promise.resolve({ id: 'tenant-3' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(409)
    expect(payload.error).toBe('El slug ya existe')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 409 })
    )
  })

  it('returns 500 for unexpected errors', async () => {
    mockUpdateTenant.mockRejectedValue(new Error('unexpected'))
    const { PATCH } = await loadRoute()

    const response = await PATCH(
      buildRequest('http://localhost:3010/api/ops/tenants/tenant-4', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Tenant Cuatro',
          slug: 'tenant-cuatro',
          active: true,
          limitsMaxUsers: 50,
          limitsMaxCourses: 100,
          limitsMaxLeadsPerMonth: 5000,
          limitsStorageQuotaMB: 10240,
        }),
      }),
      { params: Promise.resolve({ id: 'tenant-4' }) }
    )
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe('Error al actualizar tenant')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'PATCH', path: '/api/ops/tenants/[id]', status: 500 })
    )
  })
})
