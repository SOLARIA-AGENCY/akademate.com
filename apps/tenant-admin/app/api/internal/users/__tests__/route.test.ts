import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { payloadMock, authMock, queryRowsMock } = vi.hoisted(() => ({
  payloadMock: {
    find: vi.fn(),
    create: vi.fn(),
  },
  authMock: vi.fn(),
  queryRowsMock: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => payloadMock) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/app/api/leads/_lib/auth', () => ({ getAuthenticatedUserContext: authMock }))
vi.mock('@/@payload-config/lib/db', () => ({ queryRows: queryRowsMock }))

async function loadRoute() {
  vi.resetModules()
  return import('../route')
}

describe('/api/internal/users authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ userId: 9, tenantId: 17, role: 'gestor' })
    payloadMock.find.mockResolvedValue({ docs: [] })
    payloadMock.create.mockResolvedValue({ id: 55, email: 'new@example.com' })
    queryRowsMock.mockResolvedValue([])
  })

  it('rejects unauthenticated reads before querying users', async () => {
    authMock.mockResolvedValue(null)
    const { GET } = await loadRoute()
    const response = await GET(new NextRequest('http://localhost/api/internal/users'))

    expect(response.status).toBe(401)
    expect(payloadMock.find).not.toHaveBeenCalled()
  })

  it('scopes user and invitation reads to the authenticated tenant', async () => {
    const { GET } = await loadRoute()
    const response = await GET(new NextRequest('http://localhost/api/internal/users'))

    expect(response.status).toBe(200)
    expect(payloadMock.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      where: { tenant: { equals: 17 } },
    }))
    expect(queryRowsMock).toHaveBeenCalledWith(expect.stringContaining('tenant_id = $1'), [17])
  })

  it('uses the authenticated tenant instead of the legacy fixed tenant', async () => {
    const { POST } = await loadRoute()
    const response = await POST(new NextRequest('http://localhost/api/internal/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nueva Persona',
        email: 'new@example.com',
        password: 'Strong-password-123',
        role: 'marketing',
      }),
    }))

    expect(response.status).toBe(200)
    expect(payloadMock.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenant: 17, role: 'marketing' }),
    }))
  })

  it('prevents a gestor from creating an administrator', async () => {
    const { POST } = await loadRoute()
    const response = await POST(new NextRequest('http://localhost/api/internal/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin Elevado',
        email: 'admin@example.com',
        password: 'Strong-password-123',
        role: 'admin',
      }),
    }))

    expect(response.status).toBe(403)
    expect(payloadMock.create).not.toHaveBeenCalled()
  })
})
