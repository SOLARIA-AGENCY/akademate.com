import type { CollectionConfig } from 'payload'
import { ENTITY_SITE_ROLES } from '../../domain/organizationScopes'
import { internalOrganizationAccess, temporalFields, tenantField, validateSameTenantRelationships, validateTemporalRange } from './common'

export const SiteEntityRelationships: CollectionConfig = {
  slug: 'site-entity-relationships',
  labels: { singular: 'Relacion entidad-sede', plural: 'Relaciones entidad-sede' },
  admin: {
    useAsTitle: 'id', group: 'Organizacion interna',
    defaultColumns: ['campus', 'legal_entity', 'role', 'is_primary', 'valid_from', 'valid_to'],
    description: 'Relacion temporal y con rol entre una entidad juridica y una sede fisica.',
  },
  access: internalOrganizationAccess,
  fields: [
    { name: 'campus', type: 'relationship', relationTo: 'campuses', required: true, index: true },
    { name: 'legal_entity', type: 'relationship', relationTo: 'legal-entities', required: true, index: true },
    {
      name: 'role', type: 'select', required: true, index: true,
      options: ENTITY_SITE_ROLES.map((value) => ({ label: value.replaceAll('_', ' '), value })),
    },
    { name: 'is_primary', type: 'checkbox', defaultValue: false, index: true },
    ...temporalFields,
    tenantField,
  ],
  hooks: { beforeValidate: [
    validateTemporalRange,
    validateSameTenantRelationships([
      { field: 'campus', collection: 'campuses' },
      { field: 'legal_entity', collection: 'legal-entities' },
    ]),
  ] },
  timestamps: true,
}
