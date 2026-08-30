import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { learnerCanSeeRoster, staffCanSeeRoster } from '../../domain/compliance-ops'

const staffOnly = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  if (learnerCanSeeRoster(req.user.role)) return false
  return staffCanSeeRoster(req.user.role)
}

export const AttendanceEvents: CollectionConfig = {
  slug: 'attendance-events',
  labels: { singular: 'Attendance event', plural: 'Attendance events' },
  admin: {
    useAsTitle: 'event_type',
    group: 'Compliance',
    description: 'Idempotent threshold and absence alerts. Staff only.',
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
    {
      name: 'event_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Milestone', value: 'milestone_reached' },
        { label: 'Consecutive absences', value: 'consecutive_absences' },
        { label: 'Dropout eligible', value: 'dropout_eligible' },
      ],
    },
    { name: 'value', type: 'number', required: true },
    { name: 'at_date', type: 'date', required: true },
    { name: 'acknowledged', type: 'checkbox', defaultValue: false },
    { name: 'dedupe_key', type: 'text', required: true, unique: true, index: true },
  ],
  timestamps: true,
}
