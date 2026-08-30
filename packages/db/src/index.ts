import type { TenantId } from '@akademate/types'
import {
  // Core tables
  apiKeys,
  auditLogs,
  courses,
  featureFlags,
  memberships,
  organizationGroups,
  organizationGroupMemberships,
  legalEntities,
  campuses,
  blueprints,
  capabilities,
  tenantCapabilities,
  policies,
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
  // Better Auth tables
  sessions,
  accounts,
  verifications,
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
  deploymentModeEnum,
  organizationModelEnum,
  actorTypeEnum,
  locationKindEnum,
  campusKindEnum,
  policyKindEnum,
  capabilitySourceEnum,
} from './schema'

export const schemaVersion = '0.2.0'

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

export * from './foundation'

export {
  // Schema object
  schema,
  // Core tables
  organizationGroups,
  organizationGroupMemberships,
  tenants,
  users,
  memberships,
  legalEntities,
  campuses,
  blueprints,
  capabilities,
  tenantCapabilities,
  policies,
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
  // Better Auth tables
  sessions,
  accounts,
  verifications,
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
  deploymentModeEnum,
  organizationModelEnum,
  actorTypeEnum,
  locationKindEnum,
  campusKindEnum,
  policyKindEnum,
  capabilitySourceEnum,
}
