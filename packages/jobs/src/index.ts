import type { TenantId } from '@akademate/types'

export type JobName = 'send-email' | 'sync-search' | 'webhook' | 'meta-analytics-sync'

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
  createMetaAnalyticsSyncWorker,
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
  createWebhookProcessor,
  type WebhookPayload,
  type WebhookMethod,
  type WebhookAuditEvent,
  type WebhookDestination,
  type WebhookDestinationResolver,
  type WebhookProcessorDependencies,
  processSearchSync,
  type SearchSyncPayload,
  type SearchSyncAction,
  processMetaAnalyticsSync,
  type MetaAnalyticsSyncPayload,
  type MetaAnalyticsRange,
} from './processors/index'

export {
  createSafeHttpClient,
  safeHttpClient,
  SafeHttpError,
  type SafeHttpAddress,
  type SafeHttpClient,
  type SafeHttpErrorCode,
  type SafeHttpFetch,
  type SafeHttpLookup,
  type SafeHttpNetworkContext,
  type SafeHttpRequestOptions,
} from './http/safeHttp'

export {
  createPostgresWebhookDestinationRegistry,
  type WebhookDestinationRegistry,
  type WebhookRegistrySql,
  type WebhookRegistryTransaction,
} from './webhooks/destinationRegistry'
