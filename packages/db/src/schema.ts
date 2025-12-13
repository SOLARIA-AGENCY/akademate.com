import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const planEnum = pgEnum('plan', ['starter', 'pro', 'enterprise'])
export const tenantStatusEnum = pgEnum('tenant_status', ['trial', 'active', 'suspended', 'cancelled'])
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trialing', 'active', 'past_due', 'canceled'])

// Catalog enums
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived'])
export const publicationStatusEnum = pgEnum('publication_status', ['draft', 'review', 'published', 'archived'])
export const modalityEnum = pgEnum('modality', ['presential', 'online', 'hybrid'])
export const courseRunStatusEnum = pgEnum('course_run_status', ['scheduled', 'enrolling', 'in_progress', 'completed', 'cancelled'])

// LMS enums
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['pending', 'active', 'completed', 'withdrawn', 'failed'])
export const lessonTypeEnum = pgEnum('lesson_type', ['video', 'text', 'quiz', 'assignment', 'live_session'])
export const materialTypeEnum = pgEnum('material_type', ['pdf', 'video', 'audio', 'document', 'link', 'other'])
export const assignmentTypeEnum = pgEnum('assignment_type', ['quiz', 'essay', 'project', 'exam', 'practice'])
export const submissionStatusEnum = pgEnum('submission_status', ['draft', 'submitted', 'grading', 'graded', 'returned'])

// Marketing enums
export const leadStatusEnum = pgEnum('lead_status', ['new', 'contacted', 'qualified', 'converted', 'lost'])
export const leadSourceEnum = pgEnum('lead_source', ['website', 'referral', 'social', 'ads', 'event', 'other'])

// Gamification enums
export const badgeTypeEnum = pgEnum('badge_type', [
  'course_complete',
  'module_complete',
  'streak',
  'first_lesson',
  'perfect_score',
  'early_bird',
  'night_owl',
  'speed_learner',
  'dedicated',
  'custom',
])
export const pointsSourceTypeEnum = pgEnum('points_source_type', [
  'lesson',
  'resource',
  'badge',
  'streak',
  'bonus',
  'manual',
])

// Operations enums
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'excused'])
export const calendarEventTypeEnum = pgEnum('calendar_event_type', ['class', 'exam', 'holiday', 'meeting', 'deadline', 'other'])

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').default('starter').notNull(),
  status: tenantStatusEnum('status').default('trial').notNull(),
  mrr: integer('mrr').default(0).notNull(),
  domains: jsonb('domains').$type<string[]>().default([]).notNull(),
  branding: jsonb('branding').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash'),
  mfaEnabled: boolean('mfa_enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  roles: jsonb('roles').$type<string[]>().default([]).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  status: publicationStatusEnum('status').default('draft').notNull(),
  featuredImage: text('featured_image'),
  duration: integer('duration'), // total hours
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: text('currency').default('EUR').notNull(),
  objectives: jsonb('objectives').$type<string[]>().default([]).notNull(),
  requirements: jsonb('requirements').$type<string[]>().default([]).notNull(),
  targetAudience: text('target_audience'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  seoKeywords: jsonb('seo_keywords').$type<string[]>().default([]).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: uuid('published_by').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  scopes: jsonb('scopes').$type<string[]>().default([]).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
})

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  type: text('type').notNull(), // boolean, percentage, variant
  defaultValue: jsonb('default_value').$type<unknown>().notNull(),
  overrides: jsonb('overrides')
    .$type<{ tenantId: string; value: unknown }[]>()
    .default([] as { tenantId: string; value: unknown }[])
    .notNull(),
  planRequirement: text('plan_requirement'),
})

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: text('user_email'),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').notNull(),
  status: subscriptionStatusEnum('status').default('trialing').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  usageMeter: jsonb('usage_meter')
    .$type<{ metric: string; value: number }[]>()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: jsonb('events').$type<string[]>().default([]).notNull(),
  status: text('status').default('active').notNull(),
  secret: text('secret').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// CATALOG TABLES
// ============================================================================

export const cycles = pgTable('cycles', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  level: text('level'), // e.g., "Grado Superior", "Grado Medio"
  duration: integer('duration'), // in hours
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const centers = pgTable('centers', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country').default('ES').notNull(),
  phone: text('phone'),
  email: text('email'),
  coordinates: jsonb('coordinates').$type<{ lat: number; lng: number }>(),
  capacity: integer('capacity'),
  facilities: jsonb('facilities').$type<string[]>().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const instructors = pgTable('instructors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  bio: text('bio'),
  specializations: jsonb('specializations').$type<string[]>().default([]).notNull(),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const courseRuns = pgTable('course_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  cycleId: uuid('cycle_id').references(() => cycles.id, { onDelete: 'set null' }),
  centerId: uuid('center_id').references(() => centers.id, { onDelete: 'set null' }),
  instructorId: uuid('instructor_id').references(() => instructors.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  modality: modalityEnum('modality').default('presential').notNull(),
  status: courseRunStatusEnum('status').default('scheduled').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  enrollmentDeadline: timestamp('enrollment_deadline', { withTimezone: true }),
  maxStudents: integer('max_students'),
  minStudents: integer('min_students'),
  price: decimal('price', { precision: 10, scale: 2 }),
  currency: text('currency').default('EUR').notNull(),
  schedule: jsonb('schedule').$type<Record<string, unknown>>().default({}).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// LMS / CAMPUS TABLES
// ============================================================================

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  order: integer('order').default(0).notNull(),
  duration: integer('duration'), // estimated minutes
  isPublished: boolean('is_published').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id')
    .notNull()
    .references(() => modules.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  type: lessonTypeEnum('type').default('text').notNull(),
  content: text('content'),
  videoUrl: text('video_url'),
  duration: integer('duration'), // minutes
  order: integer('order').default(0).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  isFree: boolean('is_free').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const materials = pgTable('materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: materialTypeEnum('type').default('document').notNull(),
  fileUrl: text('file_url'),
  fileSize: integer('file_size'), // bytes
  mimeType: text('mime_type'),
  description: text('description'),
  downloadCount: integer('download_count').default(0).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: assignmentTypeEnum('type').default('practice').notNull(),
  instructions: text('instructions'),
  maxScore: decimal('max_score', { precision: 5, scale: 2 }).default('100').notNull(),
  passingScore: decimal('passing_score', { precision: 5, scale: 2 }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  allowLateSubmission: boolean('allow_late_submission').default(false).notNull(),
  maxAttempts: integer('max_attempts').default(1).notNull(),
  timeLimit: integer('time_limit'), // minutes
  isPublished: boolean('is_published').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseRunId: uuid('course_run_id')
    .notNull()
    .references(() => courseRuns.id, { onDelete: 'cascade' }),
  status: enrollmentStatusEnum('status').default('pending').notNull(),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  progress: decimal('progress', { precision: 5, scale: 2 }).default('0').notNull(),
  lastAccessAt: timestamp('last_access_at', { withTimezone: true }),
  certificateUrl: text('certificate_url'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  enrollmentId: uuid('enrollment_id')
    .notNull()
    .references(() => enrollments.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeSpent: integer('time_spent').default(0).notNull(), // seconds
  lastPosition: integer('last_position'), // video position in seconds
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  enrollmentId: uuid('enrollment_id')
    .notNull()
    .references(() => enrollments.id, { onDelete: 'cascade' }),
  assignmentId: uuid('assignment_id')
    .notNull()
    .references(() => assignments.id, { onDelete: 'cascade' }),
  status: submissionStatusEnum('status').default('draft').notNull(),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  content: text('content'),
  fileUrl: text('file_url'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const grades = pgTable('grades', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  submissionId: uuid('submission_id')
    .notNull()
    .references(() => submissions.id, { onDelete: 'cascade' }),
  graderId: uuid('grader_id').references(() => users.id, { onDelete: 'set null' }),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal('max_score', { precision: 5, scale: 2 }).notNull(),
  feedback: text('feedback'),
  isPass: boolean('is_pass').default(false).notNull(),
  gradedAt: timestamp('graded_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// MARKETING TABLES
// ============================================================================

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  source: leadSourceEnum('source').default('website').notNull(),
  status: leadStatusEnum('status').default('new').notNull(),
  courseRunId: uuid('course_run_id').references(() => courseRuns.id, { onDelete: 'set null' }),
  campaignId: uuid('campaign_id'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  score: integer('score').default(0).notNull(),
  convertedAt: timestamp('converted_at', { withTimezone: true }),
  convertedUserId: uuid('converted_user_id').references(() => users.id, { onDelete: 'set null' }),
  gdprConsent: boolean('gdpr_consent').default(false).notNull(),
  gdprConsentAt: timestamp('gdpr_consent_at', { withTimezone: true }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  type: text('type').notNull(), // email, social, ads, event
  status: text('status').default('draft').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  budget: decimal('budget', { precision: 10, scale: 2 }),
  targetAudience: jsonb('target_audience').$type<Record<string, unknown>>().default({}).notNull(),
  metrics: jsonb('metrics').$type<Record<string, unknown>>().default({}).notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// GAMIFICATION TABLES
// ============================================================================

export const badgeDefinitions = pgTable('badge_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null = global
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: badgeTypeEnum('type').notNull(),
  iconUrl: text('icon_url'),
  pointsValue: integer('points_value').default(0).notNull(),
  criteria: jsonb('criteria').$type<Record<string, unknown>>().default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id')
    .notNull()
    .references(() => badgeDefinitions.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
})

export const pointsTransactions = pgTable('points_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  points: integer('points').notNull(),
  reason: text('reason').notNull(),
  sourceType: pointsSourceTypeEnum('source_type').notNull(),
  sourceId: uuid('source_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userStreaks = pgTable('user_streaks', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// ============================================================================
// OPERATIONS TABLES
// ============================================================================

export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  enrollmentId: uuid('enrollment_id')
    .notNull()
    .references(() => enrollments.id, { onDelete: 'cascade' }),
  sessionDate: timestamp('session_date', { withTimezone: true }).notNull(),
  status: attendanceStatusEnum('status').default('present').notNull(),
  checkInAt: timestamp('check_in_at', { withTimezone: true }),
  checkOutAt: timestamp('check_out_at', { withTimezone: true }),
  notes: text('notes'),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  courseRunId: uuid('course_run_id').references(() => courseRuns.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: calendarEventTypeEnum('type').default('class').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  location: text('location'),
  isAllDay: boolean('is_all_day').default(false).notNull(),
  isRecurring: boolean('is_recurring').default(false).notNull(),
  recurrenceRule: text('recurrence_rule'),
  color: text('color'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const liveSessions = pgTable('live_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  courseRunId: uuid('course_run_id')
    .notNull()
    .references(() => courseRuns.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  provider: text('provider').notNull(), // zoom, google_meet, teams, custom
  joinUrl: text('join_url').notNull(),
  hostUrl: text('host_url'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  recordingUrl: text('recording_url'),
  recordingAvailableAt: timestamp('recording_available_at', { withTimezone: true }),
  maxParticipants: integer('max_participants'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  enrollmentId: uuid('enrollment_id')
    .notNull()
    .references(() => enrollments.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseRunId: uuid('course_run_id')
    .notNull()
    .references(() => courseRuns.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id'),
  verificationHash: text('verification_hash').notNull().unique(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const schema = {
  // Core
  tenants,
  users,
  memberships,
  courses,
  apiKeys,
  featureFlags,
  auditLogs,
  subscriptions,
  webhooks,
  // Catalog
  cycles,
  centers,
  instructors,
  courseRuns,
  // LMS
  modules,
  lessons,
  materials,
  assignments,
  enrollments,
  lessonProgress,
  submissions,
  grades,
  // Marketing
  leads,
  campaigns,
  // Gamification
  badgeDefinitions,
  userBadges,
  pointsTransactions,
  userStreaks,
  // Operations
  attendance,
  calendarEvents,
  liveSessions,
  certificates,
}
