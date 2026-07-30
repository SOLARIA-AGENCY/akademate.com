import type { CollectionConfig } from 'payload'
import { getUserTenantId, isAdminOrHigher, isSuperAdmin, tenantReadAccess } from '../../access/tenantAccess'
import { temporalFields, tenantField, validateRoleBindingScope, validateSameTenantRelationships } from './common'

export const ScopedRoleBindings: CollectionConfig = {
  slug: 'scoped-role-bindings',
  labels: { singular: 'Permiso por ambito', plural: 'Permisos por ambito' },
  admin: {
    useAsTitle: 'id', group: 'Organizacion interna',
    defaultColumns: ['user', 'role', 'legal_entity', 'campus', 'operating_scope', 'course_run'],
    description: 'RBAC interno. Un binding puede limitarse a una entidad, sede, ambito virtual o convocatoria.',
  },
  access: {
    read: tenantReadAccess,
    create: ({ req }) => isAdminOrHigher(req.user) && (isSuperAdmin(req.user) || getUserTenantId(req.user) !== null),
    update: ({ req }) => {
      if (!isAdminOrHigher(req.user)) return false
      if (isSuperAdmin(req.user)) return true
      const tenantId = getUserTenantId(req.user)
      return tenantId === null ? false : { tenant: { equals: tenantId } }
    },
    delete: ({ req }) => {
      if (!isAdminOrHigher(req.user)) return false
      if (isSuperAdmin(req.user)) return true
      const tenantId = getUserTenantId(req.user)
      return tenantId === null ? false : { tenant: { equals: tenantId } }
    },
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'role', type: 'select', required: true, index: true,
      options: ['admin', 'gestor', 'marketing', 'asesor', 'lectura'].map((value) => ({ label: value, value })),
    },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', index: true },
    { name: 'campus', type: 'relationship', relationTo: 'campuses', index: true },
    { name: 'operating_scope', type: 'relationship', relationTo: 'operating-scopes', index: true },
    { name: 'course_run', type: 'relationship', relationTo: 'course-runs', index: true },
    { name: 'permissions', type: 'text', hasMany: true, admin: { description: 'Permisos adicionales; vacio usa los permisos del rol.' } },
    ...temporalFields,
    tenantField,
  ],
  hooks: { beforeValidate: [validateRoleBindingScope, validateSameTenantRelationships([
    { field: 'user', collection: 'users' },
    { field: 'legal_entity', collection: 'legal-entities' },
    { field: 'campus', collection: 'campuses' },
    { field: 'operating_scope', collection: 'operating-scopes' },
    { field: 'course_run', collection: 'course-runs' },
  ])] },
  timestamps: true,
}
