import type { Access, Field, FieldAccess, FieldHook } from 'payload'
import type { Tenant } from '../payload-types'

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

/** Valid user roles in the system */
type UserRole = 'superadmin' | 'admin' | 'gestor' | 'marketing' | 'asesor' | 'lectura'

/** Type guard to check if an object is a User with a role */
interface UserLike {
  role?: UserRole
  tenant?: number | null | Tenant
}

/** Type guard to check if tenant is a populated Tenant object */
function isTenantObject(tenant: number | null | Tenant | undefined): tenant is Tenant {
  return typeof tenant === 'object' && tenant !== null && 'id' in tenant
}

/**
 * Check if user is SuperAdmin
 */
export const isSuperAdmin = (user: UserLike | null | undefined): boolean => {
  return user?.role === 'superadmin'
}

/**
 * Check if user is Admin or higher
 */
export const isAdminOrHigher = (user: UserLike | null | undefined): boolean => {
  return user?.role === 'superadmin' || user?.role === 'admin'
}

/**
 * Get user's tenant ID
 * Returns null for SuperAdmin (they don't have a tenant)
 */
export const getUserTenantId = (user: UserLike | null | undefined): number | null => {
  if (!user) return null
  if (user.role === 'superadmin') return null
  if (isTenantObject(user.tenant)) {
    return user.tenant.id
  }
  return user.tenant ?? null
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

/** Request type with optional user */
interface RequestWithUser {
  user?: UserLike | null
}

/** Data object with optional tenant field */
interface DataWithTenant {
  tenant?: number | null
  [key: string]: unknown
}

/**
 * Hook to auto-assign tenant on document creation
 * Used in beforeChange hooks
 */
export const autoAssignTenant = ({ req, data }: { req: RequestWithUser; data: DataWithTenant | null | undefined }): DataWithTenant | null | undefined => {
  // If tenant is already set (by SuperAdmin), keep it
  if (data?.tenant) return data

  // Get user's tenant
  const tenantId = getUserTenantId(req.user)
  if (tenantId && data) {
    return {
      ...data,
      tenant: tenantId,
    }
  }

  return data
}

const assignTenant: FieldHook = ({ req, value }): number | null => {
  // If value is set (by SuperAdmin), use it
  if (value !== null && value !== undefined) {
    return value as number
  }

  // Otherwise, use user's tenant
  const tenantId = getUserTenantId(req.user)
  return tenantId ?? null
}

/** Admin condition context type */
interface AdminConditionContext {
  user: UserLike | null
}

/**
 * Reusable tenant field definition for collections
 */
export const tenantField: Field = {
  name: 'tenant',
  type: 'relationship' as const,
  relationTo: 'tenants' as const,
  required: true,
  index: true,
  admin: {
    position: 'sidebar' as const,
    description: 'Academia/Organización propietaria',
    // Hide field for non-superadmin (auto-assigned)
    condition: (_data: Record<string, unknown>, _siblingData: Record<string, unknown>, context: AdminConditionContext): boolean => {
      return context.user?.role === 'superadmin'
    },
  },
  access: {
    read: () => true,
    update: tenantFieldAccess,
  },
  hooks: {
    beforeChange: [
      assignTenant,
    ],
  },
}
