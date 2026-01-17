
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig, type CollectionConfig } from 'payload'
import { injectTenantId, preventTenantChange } from './hooks/injectTenantId'
import {
  readOwnTenant,
  createWithTenant,
  updateOwnTenant,
  deleteOwnTenant,
  superadminOnly,
  authenticated,
  publicRead,
} from './access/tenantAccess'

// Import new collections
import {
  Modules,
  Lessons,
  Materials,
  Assignments,
  Submissions,
  Grades,
  LessonProgress,
  Enrollments,
} from './collections/lms'

import {
  BadgeDefinitions,
  UserBadges,
  PointsTransactions,
  UserStreaks,
} from './collections/gamification'

import {
  Attendance,
  CalendarEvents,
  LiveSessions,
  Certificates,
} from './collections/operations'

// ============================================================================
// ENUMS / OPTIONS
// ============================================================================

const plans = [
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

const tenantStatus = [
  { label: 'Trial', value: 'trial' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Cancelled', value: 'cancelled' },
]

const courseStatus = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

const modality = [
  { label: 'Presencial', value: 'presential' },
  { label: 'Online', value: 'online' },
  { label: 'Híbrido', value: 'hybrid' },
]

const courseRunStatus = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Enrolling', value: 'enrolling' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const leadStatus = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Lost', value: 'lost' },
]

const leadSource = [
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Social', value: 'social' },
  { label: 'Ads', value: 'ads' },
  { label: 'Event', value: 'event' },
  { label: 'Other', value: 'other' },
]

// ============================================================================
// SHARED FIELD DEFINITIONS
// ============================================================================

const tenantField = {
  name: 'tenant',
  type: 'relationship' as const,
  relationTo: 'tenants',
  required: true,
  admin: {
    position: 'sidebar' as const,
    description: 'Tenant al que pertenece este recurso',
  },
}

const timestampFields = [
  {
    name: 'createdAt',
    type: 'date' as const,
    admin: { readOnly: true, position: 'sidebar' as const },
  },
  {
    name: 'updatedAt',
    type: 'date' as const,
    admin: { readOnly: true, position: 'sidebar' as const },
  },
]

// ============================================================================
// CORE COLLECTIONS
// ============================================================================

const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'name',
    group: 'Core',
  },
  access: {
    read: authenticated,
    create: superadminOnly,
    update: superadminOnly,
    delete: superadminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    {
      name: 'plan',
      type: 'select',
      required: true,
      defaultValue: 'starter',
      options: plans,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'trial',
      options: tenantStatus,
    },
    { name: 'mrr', type: 'number', defaultValue: 0 },
    {
      name: 'domains',
      type: 'array',
      labels: { singular: 'Dominio', plural: 'Dominios' },
      fields: [{ name: 'host', type: 'text' }],
    },
    { name: 'branding', type: 'json', defaultValue: {} },
  ],
}

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Core',
  },
  access: {
    read: authenticated,
    create: superadminOnly,
    update: authenticated, // Users can update own profile
    delete: superadminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'roles',
      type: 'array',
      defaultValue: [],
      fields: [{ name: 'role', type: 'text' }],
      admin: { description: 'Roles: superadmin, admin, instructor, student' },
    },
    {
      name: 'tenantId',
      type: 'relationship',
      relationTo: 'tenants',
      hasMany: true,
      admin: { description: 'Tenants a los que pertenece el usuario' },
    },
  ],
}

const Memberships: CollectionConfig = {
  slug: 'memberships',
  admin: {
    group: 'Core',
  },
  access: {
    read: readOwnTenant,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'user', type: 'relationship', relationTo: 'users', required: true },
    {
      name: 'roles',
      type: 'array',
      fields: [{ name: 'role', type: 'text' }],
      defaultValue: [],
    },
    { name: 'status', type: 'text', defaultValue: 'active' },
  ],
}

// ============================================================================
// CATALOG COLLECTIONS
// ============================================================================

const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    group: 'Catalog',
  },
  access: {
    read: publicRead,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: courseStatus,
    },
    { name: 'description', type: 'textarea' },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

const Cycles: CollectionConfig = {
  slug: 'cycles',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
  },
  access: {
    read: publicRead,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'level', type: 'text', admin: { description: 'e.g., Grado Superior, Grado Medio' } },
    { name: 'duration', type: 'number', admin: { description: 'Duration in hours' } },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

const Centers: CollectionConfig = {
  slug: 'centers',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
  },
  access: {
    read: publicRead,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'address', type: 'text' },
    { name: 'city', type: 'text' },
    { name: 'postalCode', type: 'text' },
    { name: 'country', type: 'text', defaultValue: 'ES' },
    { name: 'phone', type: 'text' },
    { name: 'email', type: 'email' },
    {
      name: 'coordinates',
      type: 'group',
      fields: [
        { name: 'lat', type: 'number' },
        { name: 'lng', type: 'number' },
      ],
    },
    { name: 'capacity', type: 'number' },
    {
      name: 'facilities',
      type: 'array',
      fields: [{ name: 'facility', type: 'text' }],
    },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

const Instructors: CollectionConfig = {
  slug: 'instructors',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
  },
  access: {
    read: readOwnTenant,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'phone', type: 'text' },
    { name: 'bio', type: 'textarea' },
    {
      name: 'specializations',
      type: 'array',
      fields: [{ name: 'specialization', type: 'text' }],
    },
    { name: 'avatar', type: 'upload', relationTo: 'media' },
    { name: 'isActive', type: 'checkbox', defaultValue: true },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

const CourseRuns: CollectionConfig = {
  slug: 'course-runs',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
  },
  access: {
    read: publicRead,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true },
    { name: 'cycle', type: 'relationship', relationTo: 'cycles' },
    { name: 'center', type: 'relationship', relationTo: 'centers' },
    { name: 'instructor', type: 'relationship', relationTo: 'instructors' },
    { name: 'name', type: 'text', required: true },
    {
      name: 'modality',
      type: 'select',
      defaultValue: 'presential',
      options: modality,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'scheduled',
      options: courseRunStatus,
    },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'enrollmentDeadline', type: 'date' },
    { name: 'maxStudents', type: 'number' },
    { name: 'minStudents', type: 'number' },
    { name: 'price', type: 'number' },
    { name: 'currency', type: 'text', defaultValue: 'EUR' },
    { name: 'schedule', type: 'json', defaultValue: {} },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

// ============================================================================
// MARKETING COLLECTIONS
// ============================================================================

const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'email',
    group: 'Marketing',
  },
  access: {
    read: readOwnTenant,
    create: publicRead, // Allow public lead capture
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'email', type: 'email', required: true },
    { name: 'name', type: 'text' },
    { name: 'phone', type: 'text' },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'website',
      options: leadSource,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: leadStatus,
    },
    { name: 'courseRun', type: 'relationship', relationTo: 'course-runs' },
    { name: 'campaign', type: 'relationship', relationTo: 'campaigns' },
    { name: 'notes', type: 'textarea' },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    { name: 'score', type: 'number', defaultValue: 0 },
    { name: 'convertedAt', type: 'date' },
    { name: 'convertedUser', type: 'relationship', relationTo: 'users' },
    { name: 'gdprConsent', type: 'checkbox', defaultValue: false },
    { name: 'gdprConsentAt', type: 'date' },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'name',
    group: 'Marketing',
  },
  access: {
    read: readOwnTenant,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Social', value: 'social' },
        { label: 'Ads', value: 'ads' },
        { label: 'Event', value: 'event' },
      ],
    },
    { name: 'status', type: 'text', defaultValue: 'draft' },
    { name: 'startDate', type: 'date' },
    { name: 'endDate', type: 'date' },
    { name: 'budget', type: 'number' },
    { name: 'targetAudience', type: 'json', defaultValue: {} },
    { name: 'metrics', type: 'json', defaultValue: {} },
    { name: 'metadata', type: 'json', defaultValue: {} },
    ...timestampFields,
  ],
}

// ============================================================================
// SYSTEM COLLECTIONS
// ============================================================================

const ApiKeys: CollectionConfig = {
  slug: 'api-keys',
  admin: {
    group: 'System',
  },
  access: {
    read: readOwnTenant,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  fields: [
    tenantField,
    { name: 'name', type: 'text', required: true },
    { name: 'key', type: 'text', required: true, unique: true },
    {
      name: 'scopes',
      type: 'array',
      fields: [{ name: 'scope', type: 'text' }],
      defaultValue: [],
    },
    { name: 'status', type: 'text', defaultValue: 'active' },
    { name: 'lastUsedAt', type: 'date' },
  ],
}

const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    useAsTitle: 'action',
    group: 'System',
  },
  access: {
    read: readOwnTenant,
    create: createWithTenant,
    update: () => false, // Audit logs are immutable
    delete: superadminOnly,
  },
  hooks: {
    beforeValidate: [injectTenantId],
  },
  fields: [
    tenantField,
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'userEmail', type: 'text' },
    { name: 'action', type: 'text', required: true },
    { name: 'resource', type: 'text', required: true },
    { name: 'resourceId', type: 'text', required: true },
    { name: 'oldValue', type: 'json' },
    { name: 'newValue', type: 'json' },
    { name: 'ipAddress', type: 'text' },
    { name: 'userAgent', type: 'text' },
  ],
}

const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'System',
  },
  access: {
    read: publicRead,
    create: createWithTenant,
    update: updateOwnTenant,
    delete: deleteOwnTenant,
  },
  hooks: {
    beforeValidate: [injectTenantId, preventTenantChange],
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf', 'video/*', 'audio/*'],
  },
  fields: [
    tenantField,
    { name: 'alt', type: 'text' },
    { name: 'caption', type: 'text' },
  ],
}

// ============================================================================
// CONFIG
// ============================================================================

const config = buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL ?? 'http://localhost:3003',
  secret: process.env.PAYLOAD_SECRET ?? 'development-secret-change-me',
  admin: {
    user: 'users',
    meta: {
      titleSuffix: '- Akademate',
    },
  },
  editor: lexicalEditor({}),
  typescript: {
    outputFile: './payload-types.ts',
  },
  endpoints: [],
  plugins: [],
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/akademate',
    },
  }),
  collections: [
    // Core
    Tenants,
    Users,
    Memberships,
    // Catalog
    Courses,
    Cycles,
    Centers,
    Instructors,
    CourseRuns,
    // LMS
    Modules,
    Lessons,
    Materials,
    Assignments,
    Submissions,
    Grades,
    LessonProgress,
    Enrollments,
    // Gamification
    BadgeDefinitions,
    UserBadges,
    PointsTransactions,
    UserStreaks,
    // Operations
    Attendance,
    CalendarEvents,
    LiveSessions,
    Certificates,
    // Marketing
    Leads,
    Campaigns,
    // System
    ApiKeys,
    AuditLogs,
    Media,
  ],
})

export default config
