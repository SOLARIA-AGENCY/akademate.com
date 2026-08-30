import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { learnerCanSeeRoster, staffCanSeeRoster } from '../../domain/compliance-ops'

const staffOnly = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  if (learnerCanSeeRoster(req.user.role)) return false
  return staffCanSeeRoster(req.user.role)
}

export const AttendanceRosterEntries: CollectionConfig = {
  slug: 'attendance-roster-entries',
  labels: { singular: 'Roster entry', plural: 'Roster entries' },
  admin: {
    useAsTitle: 'session_date',
    group: 'Compliance',
    description: 'Internal daily attendance roster. Never visible to learners.',
  },
  access: {
    read: staffOnly,
    create: staffOnly,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    tenantField,
    { name: 'course_run', type: 'relationship', relationTo: 'course-runs', required: true, index: true },
    { name: 'enrollment', type: 'relationship', relationTo: 'enrollments', required: true, index: true },
    { name: 'session_date', type: 'date', required: true, index: true },
    { name: 'code', type: 'text', required: true },
    { name: 'scheduled_hours', type: 'number', min: 0, defaultValue: 0 },
    { name: 'recorded_by', type: 'relationship', relationTo: 'users' },
  ],
  timestamps: true,
}
