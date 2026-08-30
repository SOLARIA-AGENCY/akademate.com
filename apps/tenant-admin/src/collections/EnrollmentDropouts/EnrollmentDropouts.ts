import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { learnerCanSeeRoster, staffCanSeeRoster } from '../../domain/compliance-ops'

const staffOnly = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  if (learnerCanSeeRoster(req.user.role)) return false
  return staffCanSeeRoster(req.user.role)
}

export const EnrollmentDropouts: CollectionConfig = {
  slug: 'enrollment-dropouts',
  labels: { singular: 'Enrollment dropout', plural: 'Enrollment dropouts' },
  admin: {
    useAsTitle: 'reason_code',
    group: 'Compliance',
    description: 'Structured withdrawal reasons from the active region pack.',
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    tenantField,
    { name: 'enrollment', type: 'relationship', relationTo: 'enrollments', required: true, index: true },
    { name: 'reason_code', type: 'text', required: true },
    { name: 'effective_date', type: 'date', required: true },
    { name: 'notes', type: 'textarea' },
  ],
  timestamps: true,
}
