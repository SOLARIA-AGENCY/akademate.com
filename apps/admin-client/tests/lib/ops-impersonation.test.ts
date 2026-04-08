import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetTenantById = vi.fn()
const mockQuery = vi.fn()

async function loadModule() {
  vi.resetModules()
  vi.doMock('@/lib/ops/tenants', () => ({
    getTenantById: mockGetTenantById,
  }))
  vi.doMock('@/lib/db', () => ({
    getDb: () => ({
      query: mockQuery,
    }),
  }))
  return import('@/lib/ops/impersonation')
}

describe('createImpersonationAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.NEXT_PUBLIC_TENANT_ADMIN_URL

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('INSERT INTO ops_impersonation_audit')) {
        return { rows: [{ id: 123 }] }
      }
      return { rows: [] }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when tenant does not exist', async () => {
    mockGetTenantById.mockResolvedValue(null)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { createImpersonationAudit } = await loadModule()
    const result = await createImpersonationAudit({
      tenantId: 'missing',
      accessType: 'dashboard',
      actorUserId: 'u1',
      actorEmail: 'ops@akademate.com',
    })

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('builds dashboard URL from tenant domain and stores audit entry', async () => {
    mockGetTenantById.mockResolvedValue({
      id: 't1',
      name: 'Tenant Uno',
      slug: 'tenant-uno',
      domain: 'tenant-uno.akademate.com',
      active: true,
    })
    const fetchMock = vi.fn().mockResolvedValue({ status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const { createImpersonationAudit } = await loadModule()
    const result = await createImpersonationAudit({
      tenantId: 't1',
      accessType: 'dashboard',
      actorUserId: 'u1',
      actorEmail: 'ops@akademate.com',
      reason: 'diagnostico',
    })

    expect(result).not.toBeNull()
    expect(result?.targetUrl).toBe('https://tenant-uno.akademate.com')
    expect(result?.environment).toBe('production')
    expect(result?.destination.reachable).toBe(true)
    expect(result?.destination.status).toBe(200)
    expect(mockQuery).toHaveBeenCalledTimes(2)
    const insertCall = mockQuery.mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO ops_impersonation_audit')
    )
    expect(insertCall).toBeDefined()
    expect(insertCall?.[1]).toEqual(
      expect.arrayContaining([
        't1',
        'tenant-uno',
        'tenant-uno.akademate.com',
        'Tenant Uno',
        'dashboard',
        'https://tenant-uno.akademate.com',
        true,
        200,
        'u1',
        'ops@akademate.com',
        null,
        'diagnostico',
      ])
    )
  })

  it('builds payload URL and infers staging environment', async () => {
    mockGetTenantById.mockResolvedValue({
      id: 't2',
      name: 'Tenant Preview',
      slug: 'tenant-preview',
      domain: 'preview.tenant-preview.akademate.com',
      active: true,
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 204 }))

    const { createImpersonationAudit } = await loadModule()
    const result = await createImpersonationAudit({
      tenantId: 't2',
      accessType: 'payload',
      actorUserId: 'u2',
      actorEmail: 'ops@akademate.com',
    })

    expect(result?.targetUrl).toBe('https://preview.tenant-preview.akademate.com/admin')
    expect(result?.environment).toBe('staging')
    expect(result?.accessType).toBe('payload')
  })

  it('uses fallback URL when tenant has no domain', async () => {
    process.env.NEXT_PUBLIC_TENANT_ADMIN_URL = 'http://akademate-tenant:3009/'
    mockGetTenantById.mockResolvedValue({
      id: 't3',
      name: 'Tenant Sin Dominio',
      slug: 'tenant-sin-dominio',
      domain: null,
      active: true,
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))

    const { createImpersonationAudit } = await loadModule()
    const result = await createImpersonationAudit({
      tenantId: 't3',
      accessType: 'dashboard',
      actorUserId: 'u3',
      actorEmail: 'ops@akademate.com',
    })

    expect(result?.targetUrl).toBe('http://akademate-tenant:3009')
    expect(result?.environment).toBe('development')
  })

  it('marks destination as unreachable when fetch throws', async () => {
    mockGetTenantById.mockResolvedValue({
      id: 't4',
      name: 'Tenant Error',
      slug: 'tenant-error',
      domain: 'tenant-error.akademate.com',
      active: true,
    })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    const { createImpersonationAudit } = await loadModule()
    const result = await createImpersonationAudit({
      tenantId: 't4',
      accessType: 'dashboard',
      actorUserId: 'u4',
      actorEmail: 'ops@akademate.com',
    })

    expect(result?.destination.reachable).toBe(false)
    expect(result?.destination.status).toBeNull()
  })

  it('creates audit table only once per module instance', async () => {
    mockGetTenantById.mockResolvedValue({
      id: 't5',
      name: 'Tenant Cinco',
      slug: 'tenant-cinco',
      domain: 'tenant5.akademate.com',
      active: true,
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200 }))

    const { createImpersonationAudit } = await loadModule()

    await createImpersonationAudit({
      tenantId: 't5',
      accessType: 'dashboard',
      actorUserId: 'u5',
      actorEmail: 'ops@akademate.com',
    })
    await createImpersonationAudit({
      tenantId: 't5',
      accessType: 'payload',
      actorUserId: 'u5',
      actorEmail: 'ops@akademate.com',
    })

    const createTableCalls = mockQuery.mock.calls.filter(([sql]) =>
      String(sql).includes('CREATE TABLE IF NOT EXISTS ops_impersonation_audit')
    )
    const insertCalls = mockQuery.mock.calls.filter(([sql]) =>
      String(sql).includes('INSERT INTO ops_impersonation_audit')
    )

    expect(createTableCalls).toHaveLength(1)
    expect(insertCalls).toHaveLength(2)
  })
})
