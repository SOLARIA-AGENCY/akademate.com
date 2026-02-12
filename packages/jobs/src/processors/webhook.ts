import type { TenantJob } from '../index'
import type { TenantJobHandler } from '../workers'

export type WebhookMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type WebhookPayload = {
  url: string
  payload: unknown
  headers?: Record<string, string>
  method?: WebhookMethod
}

/**
 * Processes outbound webhook delivery jobs.
 *
 * Makes an HTTP request to the configured URL and throws on
 * non-2xx responses so BullMQ can retry according to the
 * queue's backoff strategy.
 */
export const processWebhook: TenantJobHandler<WebhookPayload> = async (
  job: TenantJob<WebhookPayload>,
  _rawJob
) => {
  const { url, payload, headers, method } = job.payload
  const httpMethod = method ?? 'POST'

  if (!url) {
    throw new Error('Webhook job missing required field: url')
  }

  const hasBody = httpMethod !== 'GET' && payload !== undefined

  const response = await fetch(url, {
    method: httpMethod,
    headers: {
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    },
    body: hasBody ? JSON.stringify(payload) : undefined,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '<unreadable>')
    throw new Error(
      `Webhook delivery failed: ${String(response.status)} ${response.statusText} ` +
        `url=${url} body=${body}`
    )
  }

  console.log(
    `[webhook] tenant=${job.tenantId} url=${url} method=${httpMethod} ` +
      `status=${String(response.status)} traceId=${job.traceId ?? 'none'}`
  )
}
