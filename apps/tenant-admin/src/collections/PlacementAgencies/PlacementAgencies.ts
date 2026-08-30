import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'

const staffWrite = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  return ['admin', 'gestor', 'superadmin', 'marketing'].includes(req.user.role ?? '')
}

export const PlacementAgencies: CollectionConfig = {
  slug: 'placement-agencies',
  labels: { singular: 'Placement agency', plural: 'Placement agencies' },
  admin: {
    useAsTitle: 'title',
    group: 'Compliance',
    description: 'Public employment-agency pages, one per campus. Content comes from a region pack or tenant overlay.',
  },
  access: {
    read: () => true,
    create: staffWrite,
    update: staffWrite,
    delete: staffWrite,
  },
  fields: [
    tenantField,
    { name: 'title', type: 'text', required: true },
    { name: 'public_slug', type: 'text', required: true, index: true },
    { name: 'email', type: 'email', required: true },
    { name: 'hours_label', type: 'text' },
    { name: 'authorization_code', type: 'text' },
    { name: 'campus_label', type: 'text' },
    { name: 'legal_blocks', type: 'json' },
    { name: 'published', type: 'checkbox', defaultValue: false },
  ],
  timestamps: true,
}
