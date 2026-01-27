import type { Access, Where } from 'payload'

interface UserWithTenants {
  id: string
  roles?: Array<{ role?: string } | string>
  tenantId?: Array<{ id: string } | string>
}

/**
 * Obtiene los IDs de tenant del usuario actual
 */
const getUserTenantIds = (user: UserWithTenants | undefined): string[] => {
  if (!user?.tenantId) return []

  return user.tenantId.map((t) => (typeof t === 'object' ? t.id : t)).filter(Boolean)
}

/**
 * Verifica si el usuario es superadmin
 */
const isSuperadmin = (user: UserWithTenants | undefined): boolean => {
  if (!user?.roles) return false

  const roles = user.roles.map((r) => (typeof r === 'string' ? r : r.role))
  return roles.includes('superadmin')
}

/**
 * Access control: Solo lectura de recursos del tenant del usuario
 *
 * - Superadmins: acceso a todos los recursos
 * - Usuarios normales: solo recursos de sus tenants
 * - No autenticados: sin acceso
 */
export const readOwnTenant: Access = ({ req }) => {
  const user = req?.user as UserWithTenants | undefined

  if (!user) {
    return false
  }

  if (isSuperadmin(user)) {
    return true
  }

  const tenantIds = getUserTenantIds(user)

  if (tenantIds.length === 0) {
    return false
  }

  // Devuelve un filtro Where que limita los resultados
  return {
    tenant: {
      in: tenantIds,
    },
  } satisfies Where
}

/**
 * Access control: Creación solo para usuarios autenticados con tenant
 */
export const createWithTenant: Access = ({ req }) => {
  const user = req?.user as UserWithTenants | undefined

  if (!user) {
    return false
  }

  // Superadmins siempre pueden crear
  if (isSuperadmin(user)) {
    return true
  }

  // Usuarios normales necesitan al menos un tenant
  const tenantIds = getUserTenantIds(user)
  return tenantIds.length > 0
}

/**
 * Access control: Update solo para recursos del tenant del usuario
 */
export const updateOwnTenant: Access = ({ req }) => {
  const user = req?.user as UserWithTenants | undefined

  if (!user) {
    return false
  }

  if (isSuperadmin(user)) {
    return true
  }

  const tenantIds = getUserTenantIds(user)

  if (tenantIds.length === 0) {
    return false
  }

  return {
    tenant: {
      in: tenantIds,
    },
  } satisfies Where
}

/**
 * Access control: Delete solo para admins del tenant o superadmins
 */
export const deleteOwnTenant: Access = ({ req }) => {
  const user = req?.user as UserWithTenants | undefined

  if (!user) {
    return false
  }

  if (isSuperadmin(user)) {
    return true
  }

  // Solo admins de tenant pueden eliminar
  const userRoles = user.roles?.map((r) => (typeof r === 'string' ? r : r.role)) ?? []
  if (!userRoles.includes('admin')) {
    return false
  }

  const tenantIds = getUserTenantIds(user)

  if (tenantIds.length === 0) {
    return false
  }

  return {
    tenant: {
      in: tenantIds,
    },
  } satisfies Where
}

/**
 * Access control: Solo superadmins
 */
export const superadminOnly: Access = ({ req }) => {
  const user = req?.user as UserWithTenants | undefined
  return isSuperadmin(user)
}

/**
 * Access control: Usuarios autenticados
 */
export const authenticated: Access = ({ req }) => {
  return Boolean(req?.user)
}

/**
 * Access control: Público (lectura sin autenticación)
 */
export const publicRead: Access = () => true
