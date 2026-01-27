/**
 * @module apps/payload/access/__tests__/tenantAccess
 * Tests for multi-tenant access control functions
 */

import { describe, it, expect } from 'vitest'
import {
  readOwnTenant,
  createWithTenant,
  updateOwnTenant,
  deleteOwnTenant,
  superadminOnly,
  authenticated,
  publicRead,
} from '../tenantAccess'

// ============================================================================
// Mock Factories
// ============================================================================

interface MockUser {
  id: string
  roles?: Array<{ role?: string } | string>
  tenantId?: Array<{ id: string } | string>
}

function createMockReq(user?: MockUser) {
  return { user } as Parameters<typeof readOwnTenant>[0]['req']
}

function createSuperadminUser(): MockUser {
  return {
    id: 'user-superadmin',
    roles: [{ role: 'superadmin' }],
    tenantId: [{ id: 'tenant-1' }],
  }
}

function createTenantUser(tenantIds: string[] = ['tenant-1']): MockUser {
  return {
    id: 'user-regular',
    roles: [{ role: 'user' }],
    tenantId: tenantIds.map(id => ({ id })),
  }
}

function createAdminUser(tenantIds: string[] = ['tenant-1']): MockUser {
  return {
    id: 'user-admin',
    roles: [{ role: 'admin' }],
    tenantId: tenantIds.map(id => ({ id })),
  }
}

function createUserWithoutTenant(): MockUser {
  return {
    id: 'user-no-tenant',
    roles: [{ role: 'user' }],
    tenantId: [],
  }
}

// ============================================================================
// readOwnTenant Tests
// ============================================================================

describe('readOwnTenant', () => {
  it('should deny access for unauthenticated users', () => {
    const result = readOwnTenant({ req: createMockReq(undefined) })
    expect(result).toBe(false)
  })

  it('should grant full access to superadmins', () => {
    const result = readOwnTenant({ req: createMockReq(createSuperadminUser()) })
    expect(result).toBe(true)
  })

  it('should return tenant filter for regular users', () => {
    const result = readOwnTenant({ req: createMockReq(createTenantUser(['tenant-1'])) })
    expect(result).toEqual({
      tenant: { in: ['tenant-1'] },
    })
  })

  it('should return filter with multiple tenants', () => {
    const result = readOwnTenant({ req: createMockReq(createTenantUser(['tenant-1', 'tenant-2'])) })
    expect(result).toEqual({
      tenant: { in: ['tenant-1', 'tenant-2'] },
    })
  })

  it('should deny access for users without tenants', () => {
    const result = readOwnTenant({ req: createMockReq(createUserWithoutTenant()) })
    expect(result).toBe(false)
  })

  it('should handle string tenant IDs', () => {
    const user: MockUser = {
      id: 'user-string-tenants',
      roles: [{ role: 'user' }],
      tenantId: ['tenant-str-1', 'tenant-str-2'] as unknown as Array<{ id: string } | string>,
    }
    const result = readOwnTenant({ req: createMockReq(user) })
    expect(result).toEqual({
      tenant: { in: ['tenant-str-1', 'tenant-str-2'] },
    })
  })

  it('should handle string roles', () => {
    const user: MockUser = {
      id: 'user-string-roles',
      roles: ['superadmin'] as unknown as Array<{ role?: string } | string>,
      tenantId: [{ id: 'tenant-1' }],
    }
    const result = readOwnTenant({ req: createMockReq(user) })
    expect(result).toBe(true)
  })
})

// ============================================================================
// createWithTenant Tests
// ============================================================================

describe('createWithTenant', () => {
  it('should deny access for unauthenticated users', () => {
    const result = createWithTenant({ req: createMockReq(undefined) })
    expect(result).toBe(false)
  })

  it('should allow superadmins to create', () => {
    const result = createWithTenant({ req: createMockReq(createSuperadminUser()) })
    expect(result).toBe(true)
  })

  it('should allow users with tenants to create', () => {
    const result = createWithTenant({ req: createMockReq(createTenantUser()) })
    expect(result).toBe(true)
  })

  it('should deny users without tenants', () => {
    const result = createWithTenant({ req: createMockReq(createUserWithoutTenant()) })
    expect(result).toBe(false)
  })
})

// ============================================================================
// updateOwnTenant Tests
// ============================================================================

describe('updateOwnTenant', () => {
  it('should deny access for unauthenticated users', () => {
    const result = updateOwnTenant({ req: createMockReq(undefined) })
    expect(result).toBe(false)
  })

  it('should grant full access to superadmins', () => {
    const result = updateOwnTenant({ req: createMockReq(createSuperadminUser()) })
    expect(result).toBe(true)
  })

  it('should return tenant filter for regular users', () => {
    const result = updateOwnTenant({ req: createMockReq(createTenantUser(['tenant-1'])) })
    expect(result).toEqual({
      tenant: { in: ['tenant-1'] },
    })
  })

  it('should deny users without tenants', () => {
    const result = updateOwnTenant({ req: createMockReq(createUserWithoutTenant()) })
    expect(result).toBe(false)
  })
})

// ============================================================================
// deleteOwnTenant Tests
// ============================================================================

describe('deleteOwnTenant', () => {
  it('should deny access for unauthenticated users', () => {
    const result = deleteOwnTenant({ req: createMockReq(undefined) })
    expect(result).toBe(false)
  })

  it('should grant full access to superadmins', () => {
    const result = deleteOwnTenant({ req: createMockReq(createSuperadminUser()) })
    expect(result).toBe(true)
  })

  it('should deny regular users (non-admin)', () => {
    const result = deleteOwnTenant({ req: createMockReq(createTenantUser()) })
    expect(result).toBe(false)
  })

  it('should allow tenant admins to delete within their tenant', () => {
    const result = deleteOwnTenant({ req: createMockReq(createAdminUser(['tenant-1'])) })
    expect(result).toEqual({
      tenant: { in: ['tenant-1'] },
    })
  })

  it('should deny admins without tenants', () => {
    const adminNoTenant: MockUser = {
      id: 'admin-no-tenant',
      roles: [{ role: 'admin' }],
      tenantId: [],
    }
    const result = deleteOwnTenant({ req: createMockReq(adminNoTenant) })
    expect(result).toBe(false)
  })
})

// ============================================================================
// superadminOnly Tests
// ============================================================================

describe('superadminOnly', () => {
  it('should deny unauthenticated users', () => {
    const result = superadminOnly({ req: createMockReq(undefined) })
    expect(result).toBe(false)
  })

  it('should deny regular users', () => {
    const result = superadminOnly({ req: createMockReq(createTenantUser()) })
    expect(result).toBe(false)
  })

  it('should deny admin users (not superadmin)', () => {
    const result = superadminOnly({ req: createMockReq(createAdminUser()) })
    expect(result).toBe(false)
  })

  it('should allow superadmins', () => {
    const result = superadminOnly({ req: createMockReq(createSuperadminUser()) })
    expect(result).toBe(true)
  })
})

// ============================================================================
// authenticated Tests
// ============================================================================

describe('authenticated', () => {
  it('should deny unauthenticated requests', () => {
    const result = authenticated({ req: createMockReq(undefined) })
    expect(result).toBe(false)
  })

  it('should allow any authenticated user', () => {
    const result = authenticated({ req: createMockReq(createTenantUser()) })
    expect(result).toBe(true)
  })

  it('should allow users without tenants', () => {
    const result = authenticated({ req: createMockReq(createUserWithoutTenant()) })
    expect(result).toBe(true)
  })
})

// ============================================================================
// publicRead Tests
// ============================================================================

describe('publicRead', () => {
  it('should always allow access', () => {
    expect(publicRead({ req: createMockReq(undefined) })).toBe(true)
    expect(publicRead({ req: createMockReq(createTenantUser()) })).toBe(true)
    expect(publicRead({ req: createMockReq(createSuperadminUser()) })).toBe(true)
  })
})
