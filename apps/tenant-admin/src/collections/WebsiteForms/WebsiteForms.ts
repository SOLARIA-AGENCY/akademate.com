import type { Access, CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'

const WRITE_ROLES = ['superadmin', 'admin', 'gestor', 'marketing'] as const

const canWriteContent: Access = ({ req: { user } }) => {
  if (!user || typeof user.role !== 'string') return false
  return WRITE_ROLES.includes(user.role as (typeof WRITE_ROLES)[number])
}

const canReadForms: Access = ({ req: { user } }) => {
  if (!user) return { status: { equals: 'published' } }
  return true
}

export const WebsiteForms: CollectionConfig = {
  slug: 'website_forms',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'source', 'status', 'updatedAt'],
  },
  access: {
    create: canWriteContent,
    read: canReadForms,
    update: canWriteContent,
    delete: canWriteContent,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 160,
    },
    {
      name: 'subtitle',
      type: 'textarea',
      maxLength: 400,
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      maxLength: 80,
      admin: {
        description: 'Origen que se guarda en el lead (source_form)',
      },
    },
    {
      name: 'page_slug',
      type: 'text',
      maxLength: 80,
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
    tenantField,
  ],
}
