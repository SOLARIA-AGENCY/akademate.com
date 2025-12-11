import type { Access, FieldAccess } from 'payload'

/**
 * Multi-Tenant Access Control Utilities
 *
 * These functions provide tenant-aware access control for all collections.
 * They ensure that users can only access data within their assigned tenant,
 * while SuperAdmin has access to all tenants.
 *
 * Usage:
 * ```ts
 * import { tenantFilteredAccess, tenantFieldAccess } from '@/access/tenantAccess'
 *
 * export const MyCollection: CollectionConfig = {
 *   access: {
 *     read: tenantFilteredAccess.read,
 *     create: tenantFilteredAccess.create,
 *     update: tenantFilteredAccess.update,
 *     delete: tenantFilteredAccess.delete,
 *   }
 * }
 * ```
 */

/**
 * Check if user is SuperAdmin
 */
export const isSuperAdmin = (user: any): boolean => {
  return user?.role === 'superadmin'
}

/**
 * Check if user is Admin or higher
 */
export const isAdminOrHigher = (user: any): boolean => {
  return user?.role === 'superadmin' || user?.role === 'admin'
}

/**
 * Get user's tenant ID
 * Returns null for SuperAdmin (they don't have a tenant)
 */
export const getUserTenantId = (user: any): string | number | null => {
  if (!user) return null
  if (user.role === 'superadmin') return null
  return user.tenant?.id || user.tenant || null
}

/**
 * Tenant-filtered read access
 * - SuperAdmin: Can read all documents
 * - Others: Can only read documents from their tenant
 */
export const tenantReadAccess: Access = ({ req }) => {
  if (!req.user) return false

  // SuperAdmin sees everything
  if (isSuperAdmin(req.user)) return true

  // Others only see their tenant's data
  const tenantId = getUserTenantId(req.user)
  if (!tenantId) return false

  return {
    tenant: {
      equals: tenantId,
    },
  }
}

/**
 * Tenant-filtered create access
 * - SuperAdmin: Can create in any tenant (must specify tenant)
 * - Admin/Gestor: Can create within their tenant
 * - Others: Cannot create
 */
export const tenantCreateAccess: Access = ({ req }) => {
  if (!req.user) return false

  // SuperAdmin can create anywhere
  if (isSuperAdmin(req.user)) return true

  // Admin and Gestor can create within their tenant
  if (req.user.role === 'admin' || req.user.role === 'gestor') {
    return !!getUserTenantId(req.user)
  }

  return false
}

/**
 * Tenant-filtered update access
 * - SuperAdmin: Can update any document
 * - Admin/Gestor: Can update documents within their tenant
 * - Others: Cannot update
 */
export const tenantUpdateAccess: Access = ({ req }) => {
  if (!req.user) return false

  // SuperAdmin can update anything
  if (isSuperAdmin(req.user)) return true

  // Admin and Gestor can update within their tenant
  if (req.user.role === 'admin' || req.user.role === 'gestor') {
    const tenantId = getUserTenantId(req.user)
    if (!tenantId) return false

    return {
      tenant: {
        equals: tenantId,
      },
    }
  }

  return false
}

/**
 * Tenant-filtered delete access
 * - SuperAdmin: Can delete any document
 * - Admin: Can delete documents within their tenant
 * - Others: Cannot delete
 */
export const tenantDeleteAccess: Access = ({ req }) => {
  if (!req.user) return false

  // SuperAdmin can delete anything
  if (isSuperAdmin(req.user)) return true

  // Only Admin can delete within their tenant
  if (req.user.role === 'admin') {
    const tenantId = getUserTenantId(req.user)
    if (!tenantId) return false

    return {
      tenant: {
        equals: tenantId,
      },
    }
  }

  return false
}

/**
 * Bundled tenant access controls
 */
export const tenantFilteredAccess = {
  read: tenantReadAccess,
  create: tenantCreateAccess,
  update: tenantUpdateAccess,
  delete: tenantDeleteAccess,
}

/**
 * Field access for tenant field
 * - SuperAdmin: Can set/change tenant on any document
 * - Others: Tenant is auto-assigned, cannot be changed
 */
export const tenantFieldAccess: FieldAccess = ({ req }) => {
  if (!req.user) return false
  return isSuperAdmin(req.user)
}

/**
 * Hook to auto-assign tenant on document creation
 * Used in beforeChange hooks
 */
export const autoAssignTenant = ({ req, data }: { req: any; data: any }) => {
  // If tenant is already set (by SuperAdmin), keep it
  if (data?.tenant) return data

  // Get user's tenant
  const tenantId = getUserTenantId(req.user)
  if (tenantId) {
    return {
      ...data,
      tenant: tenantId,
    }
  }

  return data
}

/**
 * Reusable tenant field definition for collections
 */
export const tenantField = {
  name: 'tenant',
  type: 'relationship' as const,
  relationTo: 'tenants',
  required: true,
  index: true,
  admin: {
    position: 'sidebar' as const,
    description: 'Academia/Organización propietaria',
    // Hide field for non-superadmin (auto-assigned)
    condition: (data: any, siblingData: any, { user }: { user: any }) => {
      return user?.role === 'superadmin'
    },
  },
  access: {
    read: () => true,
    update: tenantFieldAccess,
  },
  hooks: {
    beforeChange: [
      ({ req, value, data }: { req: any; value: any; data: any }) => {
        // If value is set (by SuperAdmin), use it
        if (value) return value

        // Otherwise, use user's tenant
        const tenantId = getUserTenantId(req.user)
        return tenantId || value
      },
    ],
  },
}
