import { createHmac } from 'crypto'
import type { CollectionAfterChangeHook } from 'payload'

export type PublicCatalogPurgePayload = {
  event: 'catalog.changed'
  operation: string
  collection: string
  id: string | number | null
  updatedAt: string | null
  idempotencyKey: string
}

export function signPublicCatalogWebhook(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`
}

export function buildPublicCatalogPurgePayload(input: {
  operation: string
  collection: string
  id: string | number | null
  updatedAt: string | null
}): PublicCatalogPurgePayload {
  const idempotencyKey = `${input.collection}:${input.id ?? 'unknown'}:${input.updatedAt ?? input.operation}`
  return {
    event: 'catalog.changed',
    operation: input.operation,
    collection: input.collection,
    id: input.id,
    updatedAt: input.updatedAt,
    idempotencyKey,
  }
}

export const notifyPublicCatalog: CollectionAfterChangeHook = ({ doc, operation, collection, req }) => {
  const url = process.env.CEP_WORKER_PURGE_URL
  const secret = process.env.CEP_WORKER_PURGE_SECRET
  if (!url || !secret) return doc

  const payload = buildPublicCatalogPurgePayload({
    operation,
    collection: collection?.slug || 'unknown',
    id: (doc as { id?: string | number }).id ?? null,
    updatedAt: typeof (doc as { updatedAt?: string }).updatedAt === 'string' ? (doc as { updatedAt: string }).updatedAt : null,
  })
  const body = JSON.stringify(payload)
  const signature = signPublicCatalogWebhook(secret, body)

  void fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-signature': signature,
      'x-idempotency-key': payload.idempotencyKey,
    },
    body,
  }).catch((error) => {
    req.payload?.logger?.error?.('[public-catalog] purge delivery failed')
    console.error('[public-catalog] purge delivery failed', {
      collection: payload.collection,
      operation: payload.operation,
      failed: true,
      message: error instanceof Error ? error.message : 'unknown',
    })
  })

  return doc
}
