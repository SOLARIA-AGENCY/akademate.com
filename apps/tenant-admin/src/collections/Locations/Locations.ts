import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { organizationAccess } from '../Organization/access'

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: { singular: 'Location', plural: 'Locations' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['code', 'name', 'city', 'active'],
    group: 'Core',
    description: 'Sitios físicos reutilizables. Un campus apunta a uno o varios; no son entidades jurídicas.',
  },
  access: organizationAccess,
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Código estable único dentro del tenant' },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'address_line_1', type: 'text' },
    { name: 'address_line_2', type: 'text' },
    { name: 'postal_code', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'municipality', type: 'text' },
    { name: 'province', type: 'text' },
    { name: 'country', type: 'text', defaultValue: 'ES' },
    { name: 'timezone', type: 'text', defaultValue: 'Europe/Madrid' },
    { name: 'latitude', type: 'number' },
    { name: 'longitude', type: 'number' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    tenantField,
  ],
  timestamps: true,
}
