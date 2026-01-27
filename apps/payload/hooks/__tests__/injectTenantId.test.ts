/**
 * @module apps/payload/hooks/__tests__/injectTenantId
 * Tests for RLS tenant injection hooks
 */

import { describe, it, expect } from 'vitest'
import { injectTenantId, preventTenantChange } from '../injectTenantId'

// ============================================================================
// Mock Factories
// ============================================================================

interface MockUser {
  id: string
  roles?: ({ role?: string } | string)[]
  tenantId?: ({ id: string } | string)[]
}

function createMockArgs(overrides: {
  data?: Record<string, unknown>
  operation?: 'create' | 'update'
  user?: MockUser | null
  originalDoc?: Record<string, unknown>
}) {
  return {
    data: overrides.data ?? {},
    operation: overrides.operation ?? 'create',
    req: {
      user: overrides.user ?? undefined,
    },
    originalDoc: overrides.originalDoc,
  } as Parameters<typeof injectTenantId>[0]
}

function createSuperadminUser(): MockUser {
  return {
    id: 'user-superadmin',
    roles: [{ role: 'superadmin' }],
    tenantId: [{ id: 'tenant-super' }],
  }
}

function createTenantUser(tenantIds: string[] = ['tenant-1']): MockUser {
  return {
    id: 'user-regular',
    roles: [{ role: 'user' }],
    tenantId: tenantIds.map(id => ({ id })),
  }
}

// ============================================================================
// injectTenantId Tests
// ============================================================================

describe('injectTenantId', () => {
  describe('on create operation', () => {
    it('should inject tenant_id for authenticated user', async () => {
      const args = createMockArgs({
        data: { title: 'Test Item' },
        operation: 'create',
        user: createTenantUser(['tenant-user-1']),
      })

      const result = await injectTenantId(args)

      expect(result).toEqual({
        title: 'Test Item',
        tenant: 'tenant-user-1',
      })
    })

    it('should throw error for unauthenticated user without existing tenant', async () => {
      const args = createMockArgs({
        data: { title: 'Test Item' },
        operation: 'create',
        user: null,
      })

      await expect(injectTenantId(args)).rejects.toThrow('Authentication required to create resources')
    })

    it('should allow data with tenant and no user (seed/script)', async () => {
      const args = createMockArgs({
        data: { title: 'Seeded Item', tenant: 'seed-tenant' },
        operation: 'create',
        user: null,
      })

      const result = await injectTenantId(args)

      expect(result).toEqual({
        title: 'Seeded Item',
        tenant: 'seed-tenant',
      })
    })

    it('should throw error for user without tenants', async () => {
      const userNoTenant: MockUser = {
        id: 'user-no-tenant',
        roles: [{ role: 'user' }],
        tenantId: [],
      }

      const args = createMockArgs({
        data: { title: 'Test' },
        operation: 'create',
        user: userNoTenant,
      })

      await expect(injectTenantId(args)).rejects.toThrow('User must belong to at least one tenant')
    })

    it('should allow superadmin to specify tenant explicitly', async () => {
      const args = createMockArgs({
        data: { title: 'Admin Item', tenant: 'explicit-tenant' },
        operation: 'create',
        user: createSuperadminUser(),
      })

      const result = await injectTenantId(args)

      expect(result).toEqual({
        title: 'Admin Item',
        tenant: 'explicit-tenant',
      })
    })

    it('should use first tenant for user with multiple tenants', async () => {
      const args = createMockArgs({
        data: { title: 'Multi-tenant Item' },
        operation: 'create',
        user: createTenantUser(['tenant-primary', 'tenant-secondary']),
      })

      const result = await injectTenantId(args)

      expect(result).toEqual({
        title: 'Multi-tenant Item',
        tenant: 'tenant-primary',
      })
    })

    it('should handle string tenant IDs', async () => {
      const userWithStringTenants: MockUser = {
        id: 'user-str',
        roles: [{ role: 'user' }],
        tenantId: ['str-tenant-1'] as unknown as ({ id: string } | string)[],
      }

      const args = createMockArgs({
        data: { title: 'String Tenant' },
        operation: 'create',
        user: userWithStringTenants,
      })

      const result = await injectTenantId(args)

      expect(result).toEqual({
        title: 'String Tenant',
        tenant: 'str-tenant-1',
      })
    })
  })

  describe('on update operation', () => {
    it('should pass through data unchanged', async () => {
      const args = createMockArgs({
        data: { title: 'Updated Title', tenant: 'any-tenant' },
        operation: 'update',
        user: createTenantUser(),
      })

      const result = await injectTenantId(args)

      expect(result).toEqual({
        title: 'Updated Title',
        tenant: 'any-tenant',
      })
    })
  })
})

// ============================================================================
// preventTenantChange Tests
// ============================================================================

describe('preventTenantChange', () => {
  describe('on update operation', () => {
    it('should preserve original tenant for regular users', async () => {
      const args = createMockArgs({
        data: { title: 'Changed', tenant: 'new-tenant' },
        operation: 'update',
        user: createTenantUser(['original-tenant']),
        originalDoc: { id: 'doc-1', title: 'Original', tenant: 'original-tenant' },
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'Changed',
        tenant: 'original-tenant',
      })
    })

    it('should allow superadmin to change tenant', async () => {
      const args = createMockArgs({
        data: { title: 'Moved', tenant: 'new-tenant' },
        operation: 'update',
        user: createSuperadminUser(),
        originalDoc: { id: 'doc-1', title: 'Original', tenant: 'old-tenant' },
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'Moved',
        tenant: 'new-tenant',
      })
    })

    it('should allow update when tenant is not changing', async () => {
      const args = createMockArgs({
        data: { title: 'Updated', tenant: 'same-tenant' },
        operation: 'update',
        user: createTenantUser(['same-tenant']),
        originalDoc: { id: 'doc-1', title: 'Original', tenant: 'same-tenant' },
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'Updated',
        tenant: 'same-tenant',
      })
    })

    it('should allow update without tenant in data', async () => {
      const args = createMockArgs({
        data: { title: 'Title Only' },
        operation: 'update',
        user: createTenantUser(),
        originalDoc: { id: 'doc-1', title: 'Original', tenant: 'preserved-tenant' },
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'Title Only',
      })
    })
  })

  describe('on create operation', () => {
    it('should pass through data unchanged', async () => {
      const args = createMockArgs({
        data: { title: 'New Item', tenant: 'new-tenant' },
        operation: 'create',
        user: createTenantUser(),
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'New Item',
        tenant: 'new-tenant',
      })
    })
  })

  describe('edge cases', () => {
    it('should handle missing originalDoc gracefully', async () => {
      const args = createMockArgs({
        data: { title: 'No Original' },
        operation: 'update',
        user: createTenantUser(),
        originalDoc: undefined,
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'No Original',
      })
    })

    it('should handle user without roles', async () => {
      const userNoRoles: MockUser = {
        id: 'user-no-roles',
        roles: undefined,
        tenantId: [{ id: 'tenant-1' }],
      }

      const args = createMockArgs({
        data: { title: 'Test', tenant: 'new-tenant' },
        operation: 'update',
        user: userNoRoles,
        originalDoc: { tenant: 'original' },
      })

      const result = await preventTenantChange(args)

      expect(result).toEqual({
        title: 'Test',
        tenant: 'original',
      })
    })
  })
})
