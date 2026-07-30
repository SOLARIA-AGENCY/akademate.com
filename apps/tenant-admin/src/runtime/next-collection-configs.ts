import type { Access, CollectionConfig, Field } from 'payload'

const denyAll: Access = () => false

const lockedAccess: NonNullable<CollectionConfig['access']> = {
  read: denyAll,
  create: denyAll,
  update: denyAll,
  delete: denyAll,
}

const hiddenAdmin: NonNullable<CollectionConfig['admin']> = {
  hidden: true,
  group: 'Akademate Next',
}

function relation(name: string, relationTo: string, required = true): Field {
  return {
    name,
    type: 'relationship',
    relationTo,
    required,
    index: true,
  }
}

const timestamped = {
  access: lockedAccess,
  admin: hiddenAdmin,
  timestamps: true,
} satisfies Partial<CollectionConfig>

export const NextTenants: CollectionConfig = {
  ...timestamped,
  slug: 'tenants',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'domain', type: 'text', index: true },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

export const NextUsers: CollectionConfig = {
  ...timestamped,
  slug: 'users',
  auth: {
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 900_000,
    tokenExpiration: 7_200,
    useAPIKey: false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'lectura',
      options: ['superadmin', 'admin', 'gestor', 'marketing', 'asesor', 'lectura'],
    },
    relation('tenant', 'tenants', false),
    { name: 'is_active', type: 'checkbox', defaultValue: true },
  ],
}

export const NextCourses: CollectionConfig = {
  ...timestamped,
  slug: 'courses',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    relation('tenant', 'tenants', false),
  ],
}

export const NextCourseRuns: CollectionConfig = {
  ...timestamped,
  slug: 'course-runs',
  fields: [
    relation('course', 'courses'),
    relation('tenant', 'tenants'),
    { name: 'codigo', type: 'text', required: true, index: true },
    { name: 'start_date', type: 'date', required: true },
    { name: 'end_date', type: 'date', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: ['draft', 'published', 'enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'cancelled'],
    },
  ],
}

export const NextStudents: CollectionConfig = {
  ...timestamped,
  slug: 'students',
  fields: [
    { name: 'first_name', type: 'text', required: true },
    { name: 'last_name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'phone', type: 'text', required: true },
    relation('tenant', 'tenants'),
    relation('user_account', 'users', false),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ['active', 'inactive', 'suspended', 'graduated'],
    },
  ],
}

export const NextStaff: CollectionConfig = {
  ...timestamped,
  slug: 'staff',
  fields: [
    {
      name: 'staff_type',
      type: 'select',
      required: true,
      defaultValue: 'profesor',
      options: ['profesor', 'administrativo'],
    },
    { name: 'first_name', type: 'text', required: true },
    { name: 'last_name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true, index: true },
    { name: 'position', type: 'text', required: true },
    {
      name: 'contract_type',
      type: 'select',
      required: true,
      defaultValue: 'full_time',
      options: ['full_time', 'part_time', 'freelance'],
    },
    {
      name: 'employment_status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ['active', 'temporary_leave', 'inactive'],
    },
    { name: 'hire_date', type: 'date', required: true },
    { name: 'is_active', type: 'checkbox', defaultValue: true },
    relation('tenant', 'tenants'),
    relation('user_account', 'users', false),
  ],
}

export const LearningMemberships: CollectionConfig = {
  ...timestamped,
  slug: 'learning-memberships',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('user', 'users'),
    relation('staff_profile', 'staff', false),
    relation('student_profile', 'students', false),
    { name: 'role', type: 'select', required: true, options: ['instructor', 'student'] },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ['active', 'suspended', 'revoked', 'completed'],
    },
    { name: 'valid_from', type: 'date' },
    { name: 'valid_until', type: 'date' },
    { name: 'revoked_at', type: 'date' },
  ],
}

export const LearningConversations: CollectionConfig = {
  ...timestamped,
  slug: 'learning-conversations',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('created_by_user', 'users'),
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'discussion',
      options: ['announcement', 'discussion', 'support'],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: ['active', 'archived'],
    },
    { name: 'archived_at', type: 'date' },
  ],
}

export const LearningConversationParticipants: CollectionConfig = {
  ...timestamped,
  slug: 'learning-conversation-participants',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('conversation', 'learning-conversations'),
    relation('membership', 'learning-memberships'),
    relation('user', 'users'),
    { name: 'role', type: 'select', required: true, defaultValue: 'member', options: ['member', 'moderator'] },
    { name: 'status', type: 'select', required: true, defaultValue: 'active', options: ['active', 'muted', 'removed'] },
  ],
}

export const LearningMessages: CollectionConfig = {
  ...timestamped,
  slug: 'learning-messages',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('conversation', 'learning-conversations'),
    relation('sender_user', 'users'),
    { name: 'client_message_id', type: 'text', required: true, index: true, maxLength: 128 },
    { name: 'body', type: 'textarea', required: true, defaultValue: '', maxLength: 10_000 },
    { name: 'attachment_ids', type: 'json', required: true, defaultValue: [] },
    { name: 'status', type: 'select', required: true, defaultValue: 'sent', options: ['sent'] },
    { name: 'edited_at', type: 'date' },
    { name: 'deleted_at', type: 'date' },
  ],
}

export const LearningAssignments: CollectionConfig = {
  ...timestamped,
  slug: 'learning-assignments',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('created_by_user', 'users'),
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    { name: 'instructions', type: 'textarea', required: true, maxLength: 20_000 },
    { name: 'due_at', type: 'date' },
    { name: 'max_score', type: 'number', required: true, min: 0.01, max: 1_000 },
    { name: 'allow_late', type: 'checkbox', required: true, defaultValue: false },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: ['draft', 'published', 'closed'] },
    { name: 'published_at', type: 'date' },
  ],
}

export const LearningSubmissions: CollectionConfig = {
  ...timestamped,
  slug: 'learning-submissions',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('assignment', 'learning-assignments'),
    relation('student_user', 'users'),
    { name: 'client_submission_id', type: 'text', required: true, index: true, maxLength: 128 },
    { name: 'body', type: 'textarea', required: true, defaultValue: '', maxLength: 50_000 },
    { name: 'attachment_ids', type: 'json', required: true, defaultValue: [] },
    { name: 'status', type: 'select', required: true, defaultValue: 'submitted', options: ['submitted', 'returned', 'graded'] },
    { name: 'submitted_at', type: 'date', required: true },
    { name: 'attempt_number', type: 'number', required: true, defaultValue: 1, min: 1 },
  ],
}

export const LearningGrades: CollectionConfig = {
  ...timestamped,
  slug: 'learning-grades',
  fields: [
    relation('tenant', 'tenants'),
    relation('course_run', 'course-runs'),
    relation('assignment', 'learning-assignments'),
    relation('submission', 'learning-submissions'),
    relation('student_user', 'users'),
    relation('grader_user', 'users'),
    { name: 'score', type: 'number', required: true, min: 0, max: 1_000 },
    { name: 'max_score', type: 'number', required: true, min: 0.01, max: 1_000 },
    { name: 'feedback', type: 'textarea', required: true, defaultValue: '', maxLength: 20_000 },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: ['draft', 'published'] },
    { name: 'graded_at', type: 'date', required: true },
    { name: 'published_at', type: 'date' },
  ],
}

export const nextCollectionConfigs: CollectionConfig[] = [
  NextTenants,
  NextUsers,
  NextCourses,
  NextCourseRuns,
  NextStudents,
  NextStaff,
  LearningMemberships,
  LearningConversations,
  LearningConversationParticipants,
  LearningMessages,
  LearningAssignments,
  LearningSubmissions,
  LearningGrades,
]
