import type { TenantWorkerOptions } from './workers'
import {
  createEmailWorker,
  createWebhookWorker,
  createSearchSyncWorker,
} from './workers'
import { processEmail } from './processors/email'
import { processWebhook } from './processors/webhook'
import { processSearchSync } from './processors/searchSync'

const redisHost = process.env['REDIS_HOST'] ?? 'localhost'
const redisPort = Number(process.env['REDIS_PORT'] ?? '6379')

const workerOptions: TenantWorkerOptions = {
  connection: {
    host: redisHost,
    port: redisPort,
  },
}

console.log(`[jobs] Connecting to Redis at ${redisHost}:${String(redisPort)}`)

const workers = [
  createEmailWorker(processEmail, workerOptions),
  createWebhookWorker(processWebhook, workerOptions),
  createSearchSyncWorker(processSearchSync, workerOptions),
]

console.log(`[jobs] Started ${String(workers.length)} workers`)

const shutdown = async () => {
  console.log('[jobs] Shutting down workers…')
  await Promise.all(workers.map((w) => w.close()))
  console.log('[jobs] All workers stopped')
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
