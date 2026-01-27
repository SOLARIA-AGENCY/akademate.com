import type { TenantId } from '@akademate/types'
import {
  // Core tables
  apiKeys,
  auditLogs,
  courses,
  featureFlags,
  memberships,
  schema,
  subscriptions,
  tenants,
  users,
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
  // Gamification tables
  badgeDefinitions,
  userBadges,
  pointsTransactions,
  userStreaks,
  // Operations tables
  attendance,
  calendarEvents,
  liveSessions,
  certificates,
  // Enums
  planEnum,
  tenantStatusEnum,
  subscriptionStatusEnum,
  courseStatusEnum,
  modalityEnum,
  courseRunStatusEnum,
  enrollmentStatusEnum,
  lessonTypeEnum,
  materialTypeEnum,
  assignmentTypeEnum,
  submissionStatusEnum,
  leadStatusEnum,
  leadSourceEnum,
  badgeTypeEnum,
  pointsSourceTypeEnum,
  attendanceStatusEnum,
  calendarEventTypeEnum,
} from './schema'

export const schemaVersion = '0.1.0' // Bumped for new tables

export interface TenantScopedRecord {
  tenant_id: TenantId
  created_at?: Date
  updated_at?: Date
}

export interface TenantFilter {
  tenantId: TenantId
  status?: 'active' | 'archived'
}

export const withTenantScope = <T extends Record<string, unknown>>(tenantId: TenantId, payload: T) => ({
  ...payload,
  tenant_id: tenantId,
})

export const defaultAuditColumns = {
  created_at: 'created_at',
  updated_at: 'updated_at',
}

// RLS utilities for multi-tenant data isolation
export {
  withTenantContext,
  withTenantRead,
  getCurrentTenantId,
  assertTenantContext,
  type TenantContext,
  type TenantScopedResult,
} from './rls'

export {
  // Schema object
  schema,
  // Core tables
  tenants,
  users,
  memberships,
  courses,
  apiKeys,
  featureFlags,
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
  // Gamification tables
  badgeDefinitions,
  userBadges,
  pointsTransactions,
  userStreaks,
  // Operations tables
  attendance,
  calendarEvents,
  liveSessions,
  certificates,
  // Enums
  planEnum,
  tenantStatusEnum,
  subscriptionStatusEnum,
  courseStatusEnum,
  modalityEnum,
  courseRunStatusEnum,
  enrollmentStatusEnum,
  lessonTypeEnum,
  materialTypeEnum,
  assignmentTypeEnum,
  submissionStatusEnum,
  leadStatusEnum,
  leadSourceEnum,
  badgeTypeEnum,
  pointsSourceTypeEnum,
  attendanceStatusEnum,
  calendarEventTypeEnum,
}
