import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { staffCanSeeRoster } from '../../domain/compliance-ops'

const staff = ({ req }: { req: { user?: { role?: string } | null } }) => {
  if (!req.user) return false
  return staffCanSeeRoster(req.user.role)
}

export const SelectionCandidacies: CollectionConfig = {
  slug: 'selection-candidacies',
  labels: { singular: 'Selection candidacy', plural: 'Selection candidacies' },
  admin: {
    useAsTitle: 'display_name',
    group: 'Compliance',
    description: 'Subsidy selection board. Synthetic or consented records only.',
  },
  access: {
    read: staff,
    create: staff,
    update: staff,
    delete: staff,
  },
  fields: [
    tenantField,
    { name: 'course_run', type: 'relationship', relationTo: 'course-runs', required: true, index: true },
    { name: 'display_name', type: 'text', required: true },
    { name: 'national_id', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'sex', type: 'text' },
    { name: 'stage', type: 'text', required: true, defaultValue: 'prospect' },
    { name: 'capture_channel', type: 'text' },
    { name: 'motivation_score', type: 'number' },
    { name: 'theory_score', type: 'number' },
    { name: 'has_employment_file', type: 'checkbox', defaultValue: false },
    { name: 'has_cv', type: 'checkbox', defaultValue: false },
    { name: 'notes', type: 'textarea' },
    { name: 'source_label', type: 'text' },
  ],
  timestamps: true,
}
