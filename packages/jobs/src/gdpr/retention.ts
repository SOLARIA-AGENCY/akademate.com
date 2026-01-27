import type { TenantId } from '@akademate/types'

export type RetentionDataType =
  | 'quizResults'
  | 'enrollments'
  | 'courseAccessLogs'
  | 'paymentRecords'
  | 'consentLogs'

export interface RetentionPolicy {
  ttlMs: number
  label: string
}

export const RetentionPolicies: Record<RetentionDataType, RetentionPolicy> = {
  quizResults: { ttlMs: 1000 * 60 * 60 * 24 * 365 * 2, label: '2 years' },
  enrollments: { ttlMs: 1000 * 60 * 60 * 24 * 365 * 7, label: '7 years' },
  courseAccessLogs: { ttlMs: 1000 * 60 * 60 * 24 * 365, label: '1 year' },
  paymentRecords: { ttlMs: 1000 * 60 * 60 * 24 * 365 * 7, label: '7 years' },
  consentLogs: { ttlMs: 1000 * 60 * 60 * 24 * 365 * 5, label: '5 years' },
}

export interface GdprRetentionJobPayload {
  dataType: RetentionDataType
  tenantId?: TenantId
  userId?: string
}

export interface RetentionDeletionResult {
  deletedCount: number
  cutoffDate: Date
}

export interface RetentionJobDependencies {
  deleteExpired: (input: {
    dataType: RetentionDataType
    cutoffDate: Date
    tenantId?: TenantId
    userId?: string
  }) => Promise<number>
  logDeletion: (input: {
    dataType: RetentionDataType
    deletedCount: number
    cutoffDate: Date
    tenantId?: TenantId
    userId?: string
  }) => Promise<void>
  now?: () => Date
}

export async function runGdprRetentionJob(
  payload: GdprRetentionJobPayload,
  deps: RetentionJobDependencies
): Promise<RetentionDeletionResult> {
  const policy = RetentionPolicies[payload.dataType]
  const now = deps.now ? deps.now() : new Date()
  const cutoffDate = new Date(now.getTime() - policy.ttlMs)

  const deletedCount = await deps.deleteExpired({
    dataType: payload.dataType,
    cutoffDate,
    tenantId: payload.tenantId,
    userId: payload.userId,
  })

  await deps.logDeletion({
    dataType: payload.dataType,
    deletedCount,
    cutoffDate,
    tenantId: payload.tenantId,
    userId: payload.userId,
  })

  return { deletedCount, cutoffDate }
}
