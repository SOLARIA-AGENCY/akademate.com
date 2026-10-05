import type { TenantJob } from '../index'
import { safeHttpClient, type SafeHttpClient } from '../http/safeHttp'
import type { TenantJobHandler } from '../workers'

export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface WebhookPayload {
  destinationId: string
  payload: unknown
  method?: WebhookMethod
}

export interface WebhookDestination {
  id: string
  tenantId: string
  url: string
  headers?: Record<string, string>
  method?: WebhookMethod
}

export type WebhookDestinationResolver = (
  tenantId: string,
  destinationId: string
) => Promise<WebhookDestination | null>

export interface WebhookAuditEvent {
  tenantId: string
  destinationId: string
  traceId?: string
  method: WebhookMethod
  outcome: 'delivered' | 'failed'
  status?: number
  errorCode?: string
}

export interface WebhookProcessorDependencies {
  resolveDestination: WebhookDestinationResolver
  httpClient?: SafeHttpClient
  audit?: (event: WebhookAuditEvent) => void | Promise<void>
}

const codedError = (message: string, code: string, status?: number) =>
  Object.assign(new Error(message), { code, status })

export const createWebhookProcessor = (
  dependencies: WebhookProcessorDependencies
): TenantJobHandler<WebhookPayload> => {
  const httpClient = dependencies.httpClient ?? safeHttpClient
  const audit = dependencies.audit ?? ((event) => console.info('[webhook]', event))

  return async (job: TenantJob<WebhookPayload>) => {
    const { destinationId, payload } = job.payload
    let method = job.payload.method ?? 'POST'
    const metadata = () => ({
      tenantId: job.tenantId,
      destinationId,
      traceId: job.traceId,
      method,
    })

    try {
      let destination: WebhookDestination | null
      try {
        destination = await dependencies.resolveDestination(job.tenantId, destinationId)
      } catch {
        throw codedError('Webhook destination resolution failed', 'RESOLUTION_ERROR')
      }
      if (!destination) throw codedError('Webhook destination not found', 'DESTINATION_NOT_FOUND')
      if (destination.tenantId !== job.tenantId) {
        throw codedError('Webhook destination tenant mismatch', 'TENANT_MISMATCH')
      }

      method = job.payload.method ?? destination.method ?? 'POST'
      const response = await httpClient.request(destination.url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(destination.headers ?? {}) },
        body: method !== 'GET' && payload !== undefined ? JSON.stringify(payload) : undefined,
      })
      if (!response.ok) {
        throw codedError(
          `Webhook delivery returned HTTP ${String(response.status)}`,
          'HTTP_ERROR',
          response.status
        )
      }
      await audit({ ...metadata(), outcome: 'delivered', status: response.status })
    } catch (error) {
      const safeError = error as { code?: string; status?: number }
      await audit({
        ...metadata(),
        outcome: 'failed',
        status: safeError.status,
        errorCode: safeError.code ?? 'DELIVERY_ERROR',
      })
      throw error
    }
  }
}
