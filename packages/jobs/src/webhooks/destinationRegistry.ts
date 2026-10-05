import type { WebhookDestination, WebhookDestinationResolver } from '../processors/webhook'

interface WebhookRow {
  id: string
  tenant_id: string
  url: string
}

export interface WebhookRegistrySql {
  unsafe(query: string, parameters?: unknown[]): Promise<unknown[]>
  begin<T>(callback: (transaction: WebhookRegistryTransaction) => Promise<T>): Promise<T>
}

export interface WebhookRegistryTransaction {
  unsafe(query: string, parameters?: unknown[]): Promise<unknown[]>
}

export interface WebhookDestinationRegistry {
  assertReady(): Promise<void>
  resolve: WebhookDestinationResolver
}

export const createPostgresWebhookDestinationRegistry = (
  sql: WebhookRegistrySql
): WebhookDestinationRegistry => ({
  async assertReady() {
    await sql.unsafe('SELECT id, tenant_id, url, status FROM webhooks LIMIT 0')
  },

  async resolve(tenantId, destinationId): Promise<WebhookDestination | null> {
    const rows = await sql.begin(async (transaction) => {
      await transaction.unsafe("SELECT set_config('app.tenant_id', $1, true)", [tenantId])
      return (await transaction.unsafe(
        `SELECT id, tenant_id, url
         FROM webhooks
         WHERE id = $1 AND tenant_id = $2 AND status = 'active'
         LIMIT 1`,
        [destinationId, tenantId]
      )) as WebhookRow[]
    })
    const row = rows[0]
    return row ? { id: row.id, tenantId: row.tenant_id, url: row.url } : null
  },
})
