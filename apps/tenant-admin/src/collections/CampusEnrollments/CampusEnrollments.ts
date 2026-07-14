import type { CollectionConfig } from 'payload'
import { tenantField, tenantFilteredAccess } from '../../access/tenantAccess'

export const CampusEnrollments: CollectionConfig = {
  slug: 'campus-enrollments',
  labels: { singular: 'Campus enrollment', plural: 'Campus enrollments' },
  admin: {
    useAsTitle: 'id',
    group: 'LMS',
    description: 'Explicit bridge between a student account and an academic enrollment.',
    defaultColumns: ['student', 'enrollment', 'status', 'access_start', 'access_end'],
  },
  access: {
    read: tenantFilteredAccess.read,
    create: tenantFilteredAccess.create,
    update: tenantFilteredAccess.update,
    delete: tenantFilteredAccess.delete,
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'students',
      required: true,
      index: true,
    },
    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Revoked', value: 'revoked' },
      ],
      index: true,
    },
    { name: 'access_start', type: 'date' },
    { name: 'access_end', type: 'date' },
    tenantField,
  ],
  timestamps: true,
}
