import type { CollectionConfig } from 'payload'
import { tenantField } from '../../access/tenantAccess'
import { canManageCourses } from '../Courses/access'
import { generateSlug } from '../Courses/hooks/generateSlug'
import {
  CONTINUOUS_DELIVERY_MODES,
  CONTINUOUS_FUNDING_TYPES,
  CONTINUOUS_STATUSES,
  CONTINUOUS_TRAINING_COLLECTION,
  CONTINUOUS_VERTICALS,
} from '../../domain/continuous-training'

/**
 * Evergreen catalog items. Not a dated course-run.
 * Schema push is off by default (PAYLOAD_DB_PUSH). Listing API stays empty until the table exists.
 */
export const ContinuousTrainings: CollectionConfig = {
  slug: CONTINUOUS_TRAINING_COLLECTION,
  lockDocuments: false,
  labels: {
    singular: 'Formación continua',
    plural: 'Formaciones continuas',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'funding_type', 'delivery_mode', 'status', 'updatedAt'],
    group: 'Courses',
    description: 'On-demand catalog with immediate enrollment. Not bound to a course-run calendar.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'active' } }
    },
    create: canManageCourses,
    update: canManageCourses,
    delete: ({ req: { user } }) => Boolean(user && ['admin', 'gestor'].includes(user.role)),
  },
  hooks: {
    beforeValidate: [generateSlug],
  },
  fields: [
    tenantField,
    { name: 'name', type: 'text', required: true, maxLength: 500 },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'area',
      type: 'relationship',
      relationTo: 'areas-formativas',
    },
    {
      name: 'funding_type',
      type: 'select',
      defaultValue: 'unspecified',
      options: CONTINUOUS_FUNDING_TYPES.map((value) => ({ label: value, value })),
      index: true,
    },
    {
      name: 'delivery_mode',
      type: 'select',
      required: true,
      defaultValue: 'on_demand',
      options: CONTINUOUS_DELIVERY_MODES.map((value) => ({ label: value, value })),
    },
    { name: 'duration_hours', type: 'number', min: 0 },
    { name: 'unlimited_access', type: 'checkbox', defaultValue: true },
    { name: 'price', type: 'number', min: 0 },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: CONTINUOUS_STATUSES.map((value) => ({ label: value, value })),
      index: true,
    },
    {
      name: 'campuses',
      type: 'relationship',
      relationTo: 'campuses',
      hasMany: true,
    },
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
    },
    { name: 'virtual_campus_url', type: 'text' },
    { name: 'capacity', type: 'number', min: 0, defaultValue: 0 },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    {
      name: 'vertical',
      type: 'select',
      defaultValue: 'academy',
      options: CONTINUOUS_VERTICALS.map((value) => ({ label: value, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'enrollment_opens_immediately',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
