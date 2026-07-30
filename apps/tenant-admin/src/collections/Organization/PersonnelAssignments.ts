import type { CollectionConfig } from 'payload'
import { internalOrganizationAccess, temporalFields, tenantField, validateAllocation, validateSameTenantRelationships, validateTemporalRange } from './common'

export const StaffEmploymentRelationships: CollectionConfig = {
  slug: 'staff-employment-relationships',
  labels: { singular: 'Relacion laboral', plural: 'Relaciones laborales' },
  admin: { useAsTitle: 'id', group: 'Organizacion interna', defaultColumns: ['staff', 'legal_entity', 'position', 'is_primary', 'valid_from', 'valid_to'] },
  access: internalOrganizationAccess,
  fields: [
    { name: 'staff', type: 'relationship', relationTo: 'staff', required: true, index: true },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', required: true, index: true },
    { name: 'position', type: 'text', required: true },
    { name: 'contract_reference', type: 'text', admin: { description: 'Referencia interna; no incluir datos bancarios.' } },
    { name: 'is_primary', type: 'checkbox', defaultValue: true, index: true },
    ...temporalFields,
    tenantField,
  ],
  hooks: { beforeValidate: [validateTemporalRange, validateSameTenantRelationships([
    { field: 'staff', collection: 'staff' },
    { field: 'legal_entity', collection: 'legal-entities' },
  ])] },
  timestamps: true,
}

export const StaffSiteAssignments: CollectionConfig = {
  slug: 'staff-site-assignments',
  labels: { singular: 'Asignacion de personal', plural: 'Asignaciones de personal' },
  admin: { useAsTitle: 'id', group: 'Organizacion interna', defaultColumns: ['staff', 'campus', 'legal_entity', 'allocation_percentage', 'valid_from', 'valid_to'] },
  access: internalOrganizationAccess,
  fields: [
    { name: 'staff', type: 'relationship', relationTo: 'staff', required: true, index: true },
    { name: 'campus', type: 'relationship', relationTo: 'campuses', required: true, index: true },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', index: true, admin: { description: 'Entidad bajo la que se realiza esta asignacion.' } },
    { name: 'operating_scope', type: 'relationship', relationTo: 'operating-scopes', index: true },
    { name: 'allocation_percentage', type: 'number', required: true, defaultValue: 100, min: 1, max: 100 },
    ...temporalFields,
    tenantField,
  ],
  hooks: { beforeValidate: [validateAllocation, validateSameTenantRelationships([
    { field: 'staff', collection: 'staff' },
    { field: 'campus', collection: 'campuses' },
    { field: 'legal_entity', collection: 'legal-entities' },
    { field: 'operating_scope', collection: 'operating-scopes' },
  ])] },
  timestamps: true,
}
