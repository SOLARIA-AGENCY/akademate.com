
import type { Field } from 'payload'

export const tenantField: Field = {
  name: 'tenant',
  type: 'relationship',
  relationTo: 'tenants',
  required: true,
  admin: {
    position: 'sidebar',
    description: 'Tenant al que pertenece este recurso',
  },
}

export const timestampFields: Field[] = [
  {
    name: 'createdAt',
    type: 'date',
    admin: { readOnly: true, position: 'sidebar' },
  },
  {
    name: 'updatedAt',
    type: 'date',
    admin: { readOnly: true, position: 'sidebar' },
  },
]
