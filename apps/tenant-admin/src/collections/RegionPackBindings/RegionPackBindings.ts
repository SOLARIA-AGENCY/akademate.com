import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'

const staff = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  return ['admin', 'gestor', 'superadmin'].includes(req.user.role ?? '')
}

export const RegionPackBindings: CollectionConfig = {
  slug: 'region-pack-bindings',
  labels: { singular: 'Region pack binding', plural: 'Region pack bindings' },
  admin: {
    useAsTitle: 'pack_id',
    group: 'Compliance',
    description: 'Binds a worldwide region pack to a tenant, campus or course run. Default-off until assigned.',
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: staff,
  },
  fields: [
    tenantField,
    { name: 'pack_id', type: 'text', required: true, index: true },
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'tenant',
      options: [
        { label: 'Tenant', value: 'tenant' },
        { label: 'Campus', value: 'campus' },
        { label: 'Course run', value: 'course_run' },
      ],
    },
    { name: 'scope_id', type: 'text', required: true },
    { name: 'override_json', type: 'json' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
  timestamps: true,
}
