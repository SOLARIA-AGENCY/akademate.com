import type { CollectionConfig } from 'payload'
import { internalOrganizationAccess, temporalFields, tenantField, validateAllocation, validateSameTenantRelationships } from './common'

export const ResourceAllocations: CollectionConfig = {
  slug: 'resource-allocations',
  labels: { singular: 'Asignacion de recurso', plural: 'Asignaciones de recursos' },
  admin: { useAsTitle: 'id', group: 'Organizacion interna', defaultColumns: ['classroom', 'campus', 'legal_entity', 'operating_scope', 'allocation_percentage'] },
  access: internalOrganizationAccess,
  fields: [
    { name: 'classroom', type: 'relationship', relationTo: 'classrooms', index: true },
    { name: 'campus', type: 'relationship', relationTo: 'campuses', required: true, index: true },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', required: true, index: true },
    { name: 'operating_scope', type: 'relationship', relationTo: 'operating-scopes', index: true },
    { name: 'allocation_percentage', type: 'number', required: true, defaultValue: 100, min: 1, max: 100 },
    { name: 'notes', type: 'textarea' },
    ...temporalFields,
    tenantField,
  ],
  hooks: { beforeValidate: [validateAllocation, validateSameTenantRelationships([
    { field: 'classroom', collection: 'classrooms' },
    { field: 'campus', collection: 'campuses' },
    { field: 'legal_entity', collection: 'legal-entities' },
    { field: 'operating_scope', collection: 'operating-scopes' },
  ])] },
  timestamps: true,
}
