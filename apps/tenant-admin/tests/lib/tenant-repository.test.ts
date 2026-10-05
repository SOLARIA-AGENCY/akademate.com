// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'
import { createTenantRepository } from '@/lib/server/tenant-repository'

vi.mock('server-only', () => ({}))

const principal = {
  userId: 'user-1', tenantId: 'tenant-1', roles: ['admin'], sessionVersion: 1,
  sessionId: 'session-1', issuedAt: 1, expiresAt: 2,
}

describe('tenant Payload repository', () => {
  it('injects tenant filters and ignores caller attempts to select another tenant', async () => {
    const payload = {
      find: vi.fn(async () => ({ docs: [] })), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    }
    const repository = createTenantRepository(payload, principal, { collection: 'users' })

    await repository.find({ where: { tenant: { equals: 'tenant-evil' } } })

    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users',
      overrideAccess: true,
      where: { and: [
        { tenant: { equals: 'tenant-1' } },
        { tenant: { equals: 'tenant-evil' } },
      ] },
    }))
  })

  it('overwrites tenant fields on create', async () => {
    const payload = {
      find: vi.fn(), create: vi.fn(async (args) => args.data), update: vi.fn(), delete: vi.fn(),
    }
    const repository = createTenantRepository(payload, principal, { collection: 'users' })

    await repository.create({ email: 'user@test.invalid', tenant: 'tenant-evil' })

    expect(payload.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenant: 'tenant-1' }),
    }))
  })

  it('returns null for a missing object without an unscoped lookup', async () => {
    const payload = {
      find: vi.fn(async () => ({ docs: [] })), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    }
    const repository = createTenantRepository(payload, principal, { collection: 'users' })

    await expect(repository.findById('missing')).resolves.toBeNull()
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { and: [
        { tenant: { equals: 'tenant-1' } },
        { id: { equals: 'missing' } },
      ] },
    }))
  })

  it('keeps the tenant and object id in the same update operation', async () => {
    const payload = {
      find: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    }
    const repository = createTenantRepository(payload, principal, { collection: 'users' })

    await repository.update('user-2', { name: 'Updated', tenant: 'tenant-evil' })

    expect(payload.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenant: 'tenant-1' }),
      where: { and: [
        { tenant: { equals: 'tenant-1' } },
        { id: { equals: 'user-2' } },
      ] },
    }))
  })
})
