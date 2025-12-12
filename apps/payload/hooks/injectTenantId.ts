import type { CollectionBeforeValidateHook } from 'payload'

/**
 * Hook RLS: Inyecta tenant_id automáticamente en operaciones de creación
 *
 * Este hook implementa el patrón PAT-002 de multitenancy:
 * - En CREATE: obtiene tenant_id del usuario actual y lo inyecta
 * - Previene que usuarios manipulen el tenant_id manualmente
 * - Superadmins pueden especificar tenant_id explícitamente
 */
export const injectTenantId: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  // Solo aplicar en operaciones de creación
  if (operation !== 'create') {
    return data
  }

  // Si ya viene con tenant y no hay usuario (seed/script), permitir
  if (data?.tenant && !req?.user) {
    return data
  }

  const user = req?.user

  // Si no hay usuario autenticado, denegar
  if (!user) {
    throw new Error('Authentication required to create resources')
  }

  // Obtener roles del usuario
  const userRoles = Array.isArray(user.roles)
    ? user.roles.map((r: { role?: string } | string) => (typeof r === 'string' ? r : r.role))
    : []

  const isSuperadmin = userRoles.includes('superadmin')

  // Superadmins pueden especificar tenant_id explícitamente
  if (isSuperadmin && data?.tenant) {
    return data
  }

  // Para usuarios normales, obtener su tenant activo
  const userTenants = Array.isArray(user.tenantId) ? user.tenantId : []

  if (userTenants.length === 0) {
    throw new Error('User must belong to at least one tenant')
  }

  // Usar el primer tenant o el tenant de la sesión actual
  // En futuro: obtener de header X-Tenant-ID o cookie
  const activeTenantId = typeof userTenants[0] === 'object'
    ? userTenants[0].id
    : userTenants[0]

  return {
    ...data,
    tenant: activeTenantId,
  }
}

/**
 * Hook RLS: Previene modificación del tenant_id en updates
 *
 * Este hook asegura que el tenant_id no pueda ser cambiado después de la creación
 */
export const preventTenantChange: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
  req
}) => {
  if (operation !== 'update' || !originalDoc) {
    return data
  }

  const user = req?.user
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: { role?: string } | string) => (typeof r === 'string' ? r : r.role))
    : []

  const isSuperadmin = userRoles.includes('superadmin')

  // Solo superadmins pueden cambiar el tenant
  if (!isSuperadmin && data?.tenant && data.tenant !== originalDoc.tenant) {
    // Silently preserve original tenant
    return {
      ...data,
      tenant: originalDoc.tenant,
    }
  }

  return data
}
