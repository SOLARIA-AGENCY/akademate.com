import { describe, expect, it } from 'vitest'
import {
  // Core tables
  courses,
  memberships,
  apiKeys,
  auditLogs,
  subscriptions,
  webhooks,
  // Catalog tables
  cycles,
  centers,
  instructors,
  courseRuns,
  // LMS tables
  modules,
  lessons,
  materials,
  assignments,
  enrollments,
  lessonProgress,
  submissions,
  grades,
  // Marketing tables
  leads,
  campaigns,
} from '../src/schema'

/**
 * RLS (Row-Level Security) Tests
 *
 * These tests verify that all tenant-scoped tables have the required
 * tenantId column, which is essential for multitenancy security.
 */

const hasColumn = (table: Record<string, unknown>, column: string): boolean =>
  Boolean(table?.[column])

// All tables that should have tenant_id for RLS
const TENANT_SCOPED_TABLES = {
  // Core
  courses,
  memberships,
  apiKeys,
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
}

describe('RLS: All tenant-scoped tables have tenantId', () => {
  Object.entries(TENANT_SCOPED_TABLES).forEach(([tableName, table]) => {
    it(`${tableName} has tenantId column`, () => {
      expect(hasColumn(table, 'tenantId')).toBe(true)
    })
  })
})

describe('RLS: Catalog tables have required fields', () => {
  it('cycles has name, slug, and duration', () => {
    expect(hasColumn(cycles, 'name')).toBe(true)
    expect(hasColumn(cycles, 'slug')).toBe(true)
    expect(hasColumn(cycles, 'duration')).toBe(true)
  })

  it('centers has location fields', () => {
    expect(hasColumn(centers, 'name')).toBe(true)
    expect(hasColumn(centers, 'address')).toBe(true)
    expect(hasColumn(centers, 'city')).toBe(true)
    expect(hasColumn(centers, 'country')).toBe(true)
  })

  it('instructors has contact fields', () => {
    expect(hasColumn(instructors, 'name')).toBe(true)
    expect(hasColumn(instructors, 'email')).toBe(true)
    expect(hasColumn(instructors, 'specializations')).toBe(true)
  })

  it('courseRuns has scheduling fields', () => {
    expect(hasColumn(courseRuns, 'startDate')).toBe(true)
    expect(hasColumn(courseRuns, 'endDate')).toBe(true)
    expect(hasColumn(courseRuns, 'modality')).toBe(true)
    expect(hasColumn(courseRuns, 'price')).toBe(true)
  })
})

describe('RLS: LMS tables have required fields', () => {
  it('modules has course reference and ordering', () => {
    expect(hasColumn(modules, 'courseId')).toBe(true)
    expect(hasColumn(modules, 'title')).toBe(true)
    expect(hasColumn(modules, 'order')).toBe(true)
  })

  it('lessons has module reference and content fields', () => {
    expect(hasColumn(lessons, 'moduleId')).toBe(true)
    expect(hasColumn(lessons, 'title')).toBe(true)
    expect(hasColumn(lessons, 'type')).toBe(true)
    expect(hasColumn(lessons, 'content')).toBe(true)
  })

  it('assignments has grading fields', () => {
    expect(hasColumn(assignments, 'maxScore')).toBe(true)
    expect(hasColumn(assignments, 'passingScore')).toBe(true)
    expect(hasColumn(assignments, 'dueDate')).toBe(true)
  })

  it('enrollments has progress tracking', () => {
    expect(hasColumn(enrollments, 'userId')).toBe(true)
    expect(hasColumn(enrollments, 'courseRunId')).toBe(true)
    expect(hasColumn(enrollments, 'status')).toBe(true)
    expect(hasColumn(enrollments, 'progress')).toBe(true)
  })

  it('submissions has attempt tracking', () => {
    expect(hasColumn(submissions, 'enrollmentId')).toBe(true)
    expect(hasColumn(submissions, 'assignmentId')).toBe(true)
    expect(hasColumn(submissions, 'attemptNumber')).toBe(true)
  })

  it('grades has scoring fields', () => {
    expect(hasColumn(grades, 'submissionId')).toBe(true)
    expect(hasColumn(grades, 'score')).toBe(true)
    expect(hasColumn(grades, 'maxScore')).toBe(true)
    expect(hasColumn(grades, 'isPass')).toBe(true)
  })
})

describe('RLS: Marketing tables have required fields', () => {
  it('leads has contact and GDPR fields', () => {
    expect(hasColumn(leads, 'email')).toBe(true)
    expect(hasColumn(leads, 'source')).toBe(true)
    expect(hasColumn(leads, 'status')).toBe(true)
    expect(hasColumn(leads, 'gdprConsent')).toBe(true)
    expect(hasColumn(leads, 'gdprConsentAt')).toBe(true)
  })

  it('campaigns has budget and date fields', () => {
    expect(hasColumn(campaigns, 'name')).toBe(true)
    expect(hasColumn(campaigns, 'budget')).toBe(true)
    expect(hasColumn(campaigns, 'startDate')).toBe(true)
    expect(hasColumn(campaigns, 'endDate')).toBe(true)
  })
})

describe('RLS: Table count verification', () => {
  it('has 20 tenant-scoped tables', () => {
    // Count of tables that require tenant_id
    // Core: courses, memberships, apiKeys, auditLogs, subscriptions, webhooks (6)
    // Catalog: cycles, centers, instructors, courseRuns (4)
    // LMS: modules, lessons, materials, assignments, enrollments, lessonProgress, submissions, grades (8)
    // Marketing: leads, campaigns (2)
    // Total: 20
    expect(Object.keys(TENANT_SCOPED_TABLES).length).toBe(20)
  })
})
