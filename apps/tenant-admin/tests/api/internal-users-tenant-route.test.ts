// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  requirePrincipal: vi.fn(),
  requireAnyRole: vi.fn(),
  repositoryFind: vi.fn(),
  repositoryCreate: vi.fn(),
  queryRows: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({})) }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/lib/server/tenant-access', () => ({
  requirePrincipal: mocks.requirePrincipal,
  requireAnyRole: mocks.requireAnyRole,
  TenantAccessError: class TenantAccessError extends Error {},
}))
vi.mock('@/lib/server/tenant-repository', () => ({
  createTenantRepository: () => ({ find: mocks.repositoryFind, create: mocks.repositoryCreate }),
}))
vi.mock('@payload-config/lib/db', () => ({ queryRows: mocks.queryRows }))
vi.mock('@/@payload-config/lib/db', () => ({ queryRows: mocks.queryRows }))

import { GET, POST } from '@/app/api/internal/users/route'

describe('internal users tenant route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePrincipal.mockResolvedValue({ tenantId: 'tenant-1', roles: ['admin'] })
    mocks.repositoryFind.mockResolvedValue({ docs: [] })
    mocks.queryRows.mockResolvedValue([])
  })

  it('lists users and pending invitations only for the verified tenant', async () => {
    const response = await GET(new NextRequest('https://app.test/api/internal/users', {
      headers: { 'x-tenant-id': 'tenant-evil' },
    }))

    expect(response.status).toBe(200)
    expect(mocks.repositoryFind).toHaveBeenCalled()
    expect(mocks.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('tenant_id = $1'),
      ['tenant-1'],
    )
  })

  it('creates through the scoped repository without accepting a client tenant', async () => {
    mocks.repositoryCreate.mockResolvedValue({ id: 'new-user', email: 'new@test.invalid' })
    const response = await POST(new NextRequest('https://app.test/api/internal/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-tenant-id': 'tenant-evil' },
      body: JSON.stringify({
        name: 'New User', email: 'new@test.invalid', password: 'Valid123!', role: 'lectura',
        tenantId: 'tenant-evil',
      }),
    }))

    expect(response.status).toBe(200)
    expect(mocks.repositoryCreate).toHaveBeenCalledWith(expect.not.objectContaining({ tenant: expect.anything() }))
    expect(mocks.requireAnyRole).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 'tenant-1' }), ['admin'])
  })
})
