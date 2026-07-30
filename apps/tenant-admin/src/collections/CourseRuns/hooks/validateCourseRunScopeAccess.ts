import type { CollectionBeforeValidateHook } from 'payload'
import { getActiveScopeBindings, matchesCourseRunScope } from '../../../access/scopedOrganizationAccess'
import { isSuperAdmin } from '../../../access/tenantAccess'

export const validateCourseRunScopeAccess: CollectionBeforeValidateHook = async ({ data, originalDoc, req, operation }) => {
  if (!data || !req.user || isSuperAdmin(req.user) || (operation !== 'create' && operation !== 'update')) return data
  const bindings = await getActiveScopeBindings(req)
  const candidate = { ...(originalDoc as Record<string, unknown> | undefined), ...data }
  if (!matchesCourseRunScope(candidate, bindings)) {
    throw new Error('La convocatoria queda fuera de los ambitos autorizados para este usuario')
  }
  return data
}
