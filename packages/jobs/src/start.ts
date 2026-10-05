import type { TenantWorkerOptions } from './workers'
import postgres from 'postgres'
import {
  createEmailWorker,
  createWebhookWorker,
  createSearchSyncWorker,
  createMetaAnalyticsSyncWorker,
} from './workers'
import { processEmail } from './processors/email'
import { createWebhookProcessor } from './processors/webhook'
import { processSearchSync } from './processors/searchSync'
import { processMetaAnalyticsSync } from './processors/metaAnalyticsSync'
import { createPostgresWebhookDestinationRegistry } from './webhooks/destinationRegistry'

const redisHost = process.env['REDIS_HOST'] ?? 'localhost'
const redisPort = Number(process.env['REDIS_PORT'] ?? '6379')

const workerOptions: TenantWorkerOptions = {
  connection: {
    host: redisHost,
    port: redisPort,
  },
}

const databaseUrl = process.env['DATABASE_URL'] ?? process.env['DATABASE_URI']
if (!databaseUrl) {
  throw new Error('Jobs startup requires DATABASE_URL or DATABASE_URI for webhook registry readiness')
}
const sql = postgres(databaseUrl, { max: 2 })
const webhookRegistry = createPostgresWebhookDestinationRegistry(sql)
try {
  await webhookRegistry.assertReady()
} catch (error) {
  await sql.end()
  throw error
}
const processWebhook = createWebhookProcessor({ resolveDestination: webhookRegistry.resolve })

console.log(`[jobs] Connecting to Redis at ${redisHost}:${String(redisPort)}`)

const workers = [
  createEmailWorker(processEmail, workerOptions),
  createWebhookWorker(processWebhook, workerOptions),
  createSearchSyncWorker(processSearchSync, workerOptions),
  createMetaAnalyticsSyncWorker(processMetaAnalyticsSync, workerOptions),
]

console.log(`[jobs] Started ${String(workers.length)} workers`)

const shutdown = async () => {
  console.log('[jobs] Shutting down workers…')
  await Promise.all(workers.map((w) => w.close()))
  await sql.end()
  console.log('[jobs] All workers stopped')
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
