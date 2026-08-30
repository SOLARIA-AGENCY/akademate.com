import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

/**
 * Additive academic tables keyed by live Payload integer ids.
 * Do not FK these to packages/db UUID tenants — that catalog is not the live store.
 */
const payloadTenantId = () => integer('tenant_id').notNull()

export const academicCourseRunPhases = pgTable('academic_course_run_phases', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  courseRunId: integer('course_run_id').notNull(),
  name: text('name').notNull(),
  phaseType: varchar('phase_type', { length: 40 }).notNull(),
  plannedStart: timestamp('planned_start', { withTimezone: true }),
  plannedEnd: timestamp('planned_end', { withTimezone: true }),
  venueId: integer('venue_id'),
  roomId: integer('room_id'),
  sortOrder: integer('sort_order').default(0).notNull(),
  confirmationStatus: varchar('confirmation_status', { length: 40 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const academicRecurrenceRules = pgTable('academic_recurrence_rules', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  courseRunId: integer('course_run_id').notNull(),
  phaseId: integer('phase_id'),
  weekdays: jsonb('weekdays').$type<string[]>().notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  startTime: varchar('start_time', { length: 8 }).notNull(),
  endTime: varchar('end_time', { length: 8 }).notNull(),
  sessionType: varchar('session_type', { length: 40 }),
  venueId: integer('venue_id'),
  roomId: integer('room_id'),
  instructorIds: jsonb('instructor_ids').$type<number[]>().default([]).notNull(),
})

export const academicInstructorAssignments = pgTable('academic_instructor_assignments', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  instructorId: integer('instructor_id').notNull(),
  courseRunId: integer('course_run_id').notNull(),
  phaseId: integer('phase_id'),
  sessionId: integer('session_id'),
  plannedMinutes: integer('planned_minutes').default(0).notNull(),
  deliveredMinutes: integer('delivered_minutes').default(0).notNull(),
  approvedMinutes: integer('approved_minutes').default(0).notNull(),
})

export const academicPartnerOrganizations = pgTable('academic_partner_organizations', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const academicVenues = pgTable('academic_venues', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  partnerId: integer('partner_id'),
  name: text('name').notNull(),
  venueType: varchar('venue_type', { length: 40 }).notNull(),
  address: text('address'),
})

export const academicPracticePlacements = pgTable('academic_practice_placements', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  studentId: integer('student_id').notNull(),
  courseRunId: integer('course_run_id').notNull(),
  phaseId: integer('phase_id'),
  partnerId: integer('partner_id'),
  venueId: integer('venue_id'),
  plannedStart: timestamp('planned_start', { withTimezone: true }),
  plannedEnd: timestamp('planned_end', { withTimezone: true }),
  plannedHours: integer('planned_hours'),
  deliveredHours: integer('delivered_hours'),
  tutorId: integer('tutor_id'),
  status: varchar('status', { length: 40 }).default('planned').notNull(),
})

export const academicInstructorAvailability = pgTable('academic_instructor_availability', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  instructorId: integer('instructor_id').notNull(),
  weekday: varchar('weekday', { length: 16 }),
  startTime: varchar('start_time', { length: 8 }),
  endTime: varchar('end_time', { length: 8 }),
  kind: varchar('kind', { length: 24 }).default('available').notNull(),
})

export const academicTeachingLedger = pgTable('academic_teaching_ledger', {
  id: serial('id').primaryKey(),
  tenantId: payloadTenantId(),
  instructorId: integer('instructor_id').notNull(),
  sessionId: integer('session_id'),
  courseRunId: integer('course_run_id').notNull(),
  plannedMinutes: integer('planned_minutes').default(0).notNull(),
  deliveredMinutes: integer('delivered_minutes').default(0).notNull(),
  approvedMinutes: integer('approved_minutes').default(0).notNull(),
  hourlyRate: integer('hourly_rate'),
  amount: integer('amount'),
  status: varchar('status', { length: 24 }).default('pending').notNull(),
})
