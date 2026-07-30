import type { CollectionConfig } from 'payload'
import { INTERNAL_SCOPE_KINDS } from '../../domain/organizationScopes'
import { internalOrganizationAccess, tenantField, validateSameTenantRelationships } from './common'

export const OperatingScopes: CollectionConfig = {
  slug: 'operating-scopes',
  labels: { singular: 'Ambito operativo', plural: 'Ambitos operativos' },
  admin: {
    useAsTitle: 'name', group: 'Organizacion interna',
    defaultColumns: ['name', 'kind', 'legal_entity', 'active'],
    description: 'Sedes virtuales, departamentos, proyectos y centros de coste internos.',
  },
  access: internalOrganizationAccess,
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    { name: 'slug', type: 'text', required: true, index: true, admin: { description: 'Unico dentro del tenant.' } },
    {
      name: 'kind', type: 'select', required: true, defaultValue: 'virtual_entity', index: true,
      options: INTERNAL_SCOPE_KINDS.map((value) => ({ label: value.replaceAll('_', ' '), value })),
    },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', required: true, index: true },
    { name: 'internal_only', type: 'checkbox', required: true, defaultValue: true, admin: { readOnly: true } },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
    { name: 'notes', type: 'textarea' },
    tenantField,
  ],
  hooks: { beforeValidate: [validateSameTenantRelationships([{ field: 'legal_entity', collection: 'legal-entities' }])] },
  timestamps: true,
}
