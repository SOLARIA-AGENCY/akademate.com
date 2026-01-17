import { Worker, type WorkerOptions, type Job } from 'bullmq'
import type { JobName, TenantJob } from './index'
import { defaultQueueName } from './index'

export type TenantJobHandler<TPayload> = (
  job: TenantJob<TPayload>,
  rawJob: Job<TenantJob<TPayload>>
) => Promise<void>

export type TenantWorkerOptions = WorkerOptions & {
  connection: NonNullable<WorkerOptions['connection']>
}

const defaultConcurrency = 5

const createTenantWorker = <TPayload>(
  jobName: JobName,
  handler: TenantJobHandler<TPayload>,
  options: TenantWorkerOptions
) => {
  return new Worker(
    defaultQueueName,
    async (rawJob: Job<TenantJob<TPayload>>) => {
      const data = rawJob.data

      if (!data || data.name !== jobName) {
        return
      }

      await handler(data, rawJob as Job<TenantJob<TPayload>>)
    },
    {
      ...options,
      concurrency: options.concurrency ?? defaultConcurrency,
    }
  )
}

export const createEmailWorker = <TPayload>(
  handler: TenantJobHandler<TPayload>,
  options: TenantWorkerOptions
) => createTenantWorker('send-email', handler, options)

export const createWebhookWorker = <TPayload>(
  handler: TenantJobHandler<TPayload>,
  options: TenantWorkerOptions
) => createTenantWorker('webhook', handler, options)

export const createSearchSyncWorker = <TPayload>(
  handler: TenantJobHandler<TPayload>,
  options: TenantWorkerOptions
) => createTenantWorker('sync-search', handler, options)
