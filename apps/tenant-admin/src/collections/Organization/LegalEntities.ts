import type { CollectionConfig } from 'payload'
import { internalOrganizationAccess, tenantField } from './common'

export const LegalEntities: CollectionConfig = {
  slug: 'legal-entities',
  labels: { singular: 'Entidad juridica', plural: 'Entidades juridicas' },
  admin: {
    useAsTitle: 'name',
    group: 'Organizacion interna',
    defaultColumns: ['name', 'kind', 'tax_id', 'active'],
    description: 'Entidades legales del tenant. Nunca se publican como sedes.',
  },
  access: internalOrganizationAccess,
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    { name: 'slug', type: 'text', required: true, index: true, admin: { description: 'Unico dentro del tenant.' } },
    { name: 'legal_name', type: 'text', admin: { description: 'Razon social completa. No inventar si esta pendiente.' } },
    { name: 'tax_id', type: 'text', index: true, admin: { description: 'NIF/CIF; puede quedar pendiente durante el backfill.' } },
    {
      name: 'kind', type: 'select', required: true, defaultValue: 'operator', index: true,
      options: [
        { label: 'Operadora/formadora', value: 'operator' },
        { label: 'Empleadora', value: 'employer' },
        { label: 'Financiadora', value: 'funder' },
        { label: 'Proveedora', value: 'vendor' },
        { label: 'Otra', value: 'other' },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
    { name: 'notes', type: 'textarea', admin: { description: 'Notas internas; no visibles en la web publica.' } },
    tenantField,
  ],
  timestamps: true,
}
