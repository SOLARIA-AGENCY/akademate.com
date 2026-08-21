import type { Access, CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'

const WRITE_ROLES = ['superadmin', 'admin', 'gestor', 'marketing'] as const

const canWriteContent: Access = ({ req: { user } }) => {
  if (!user || typeof user.role !== 'string') return false
  return WRITE_ROLES.includes(user.role as (typeof WRITE_ROLES)[number])
}

const canReadTestimonials: Access = ({ req: { user } }) => {
  if (!user) return { status: { equals: 'published' } }
  return true
}

export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'role', 'status', 'updatedAt'],
  },
  access: {
    create: canWriteContent,
    read: canReadTestimonials,
    update: canWriteContent,
    delete: canWriteContent,
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      maxLength: 800,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      name: 'role',
      type: 'text',
      maxLength: 160,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
    },
    tenantField,
  ],
}
