import type { TenantId } from '@akademate/types'

export type JobName = 'send-email' | 'sync-search' | 'webhook'

export interface TenantJob<TPayload = unknown> {
  tenantId: TenantId
  name: JobName
  payload: TPayload
  runAt?: Date
  traceId?: string
}

export const defaultQueueName = 'akademate-jobs'

export const buildTenantJob = <TPayload>(tenantId: TenantId, name: JobName, payload: TPayload): TenantJob<TPayload> => ({
  tenantId,
  name,
  payload,
})

export {
  type TenantJobHandler,
  createEmailWorker,
  createWebhookWorker,
  createSearchSyncWorker,
} from './workers'

export {
  type RetentionDataType,
  type RetentionPolicy,
  type GdprRetentionJobPayload,
  type RetentionDeletionResult,
  type RetentionJobDependencies,
  RetentionPolicies,
  runGdprRetentionJob,
} from './gdpr/retention'

export {
  processEmail,
  type EmailPayload,
  processWebhook,
  type WebhookPayload,
  type WebhookMethod,
  processSearchSync,
  type SearchSyncPayload,
  type SearchSyncAction,
} from './processors/index'
