import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mockHeaders = vi.fn()
const mockGetSession = vi.fn()
const mockLogRequest = vi.fn()
const mockCreateImpersonationAudit = vi.fn()

async function loadRoute() {
  vi.resetModules()
  vi.doMock('next/headers', () => ({
    headers: mockHeaders,
  }))
  vi.doMock('@/lib/auth', () => ({
    auth: {
      api: {
        getSession: mockGetSession,
      },
    },
  }))
  vi.doMock('@/lib/api-logger', () => ({
    logRequest: mockLogRequest,
  }))
  vi.doMock('@/lib/ops/impersonation', () => ({
    createImpersonationAudit: mockCreateImpersonationAudit,
  }))
  return import('@/app/api/ops/impersonation/route')
}

function buildRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3010/api/ops/impersonation', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ops/impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('returns 401 when there is no authenticated session', async () => {
    mockGetSession.mockResolvedValue(null)
    const { POST } = await loadRoute()

    const response = await POST(buildRequest({ tenantId: 't1', accessType: 'dashboard' }))
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('No autenticado')
    expect(mockCreateImpersonationAudit).not.toHaveBeenCalled()
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, path: '/api/ops/impersonation' })
    )
  })

  it('returns 400 for invalid payload', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u1', email: 'ops@akademate.com', name: 'Ops User' },
    })
    const { POST } = await loadRoute()

    const response = await POST(buildRequest({ tenantId: '', accessType: 'invalid' }))
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toBe('Payload invalido')
    expect(payload.details).toBeDefined()
    expect(mockCreateImpersonationAudit).not.toHaveBeenCalled()
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: 400, path: '/api/ops/impersonation' })
    )
  })

  it('returns 404 when tenant is not found', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u2', email: 'ops@akademate.com', name: 'Ops User' },
    })
    mockCreateImpersonationAudit.mockResolvedValue(null)
    const { POST } = await loadRoute()

    const response = await POST(
      buildRequest({ tenantId: 'missing-tenant', accessType: 'dashboard', reason: 'debug' })
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error).toBe('Tenant no encontrado')
    expect(mockCreateImpersonationAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'missing-tenant',
        accessType: 'dashboard',
        actorUserId: 'u2',
        actorEmail: 'ops@akademate.com',
        reason: 'debug',
      })
    )
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        tenantId: 'missing-tenant',
        path: '/api/ops/impersonation',
      })
    )
  })

  it('returns 200 with audit payload when successful', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u3', email: 'ops@akademate.com', name: 'Ops User' },
    })
    mockCreateImpersonationAudit.mockResolvedValue({
      auditId: 77,
      targetUrl: 'https://tenant.akademate.com/admin',
      accessType: 'payload',
      tenant: {
        id: 'tenant-1',
        name: 'Tenant Uno',
        slug: 'tenant-uno',
        domain: 'tenant.akademate.com',
        active: true,
      },
      environment: 'production',
      destination: {
        reachable: true,
        status: 200,
        checkedAt: '2026-04-08T08:00:00.000Z',
      },
    })
    const { POST } = await loadRoute()

    const response = await POST(
      buildRequest({ tenantId: 'tenant-1', accessType: 'payload', reason: 'incidente p1' })
    )
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.audit).toEqual({
      id: 77,
      checkedAt: '2026-04-08T08:00:00.000Z',
    })
    expect(payload.targetUrl).toBe('https://tenant.akademate.com/admin')
    expect(payload.accessType).toBe('payload')
    expect(payload.environment).toBe('production')
    expect(payload.destination).toEqual(
      expect.objectContaining({
        reachable: true,
        status: 200,
      })
    )
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, tenantId: 'tenant-1' })
    )
  })

  it('returns 500 when an unexpected error occurs', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'u4', email: 'ops@akademate.com', name: 'Ops User' },
    })
    mockCreateImpersonationAudit.mockRejectedValue(new Error('db error'))
    const { POST } = await loadRoute()

    const response = await POST(buildRequest({ tenantId: 'tenant-1', accessType: 'dashboard' }))
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toBe('Error interno')
    expect(mockLogRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500, path: '/api/ops/impersonation' })
    )
  })
})
