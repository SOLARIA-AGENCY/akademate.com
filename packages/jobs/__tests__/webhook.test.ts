import { describe, expect, it, vi } from 'vitest'

import {
  createWebhookProcessor,
  type WebhookAuditEvent,
  type WebhookDestination,
} from '../src/processors/webhook'
import { createPostgresWebhookDestinationRegistry } from '../src/webhooks/destinationRegistry'

const job = (tenantId: string, destinationId: string) => ({
  tenantId,
  name: 'webhook' as const,
  payload: { destinationId, payload: { secret: 'payload-secret' } },
  traceId: 'trace-1',
})

describe('tenant-bound webhook delivery', () => {
  it('resolves a registered destination for the job tenant and delivers without arbitrary URL input', async () => {
    const destination: WebhookDestination = {
      id: 'dest-1',
      tenantId: 'tenant-a',
      url: 'https://hooks.example/events',
      headers: { Authorization: 'Bearer secret-token' },
    }
    const resolveDestination = vi.fn(async () => destination)
    const request = vi.fn(async () => new Response(null, { status: 204 }))
    const audit = vi.fn<(event: WebhookAuditEvent) => void>()
    const processor = createWebhookProcessor({ resolveDestination, httpClient: { request }, audit })

    await processor(job('tenant-a', 'dest-1'), {} as never)

    expect(resolveDestination).toHaveBeenCalledWith('tenant-a', 'dest-1')
    expect(request).toHaveBeenCalledWith(destination.url, expect.objectContaining({ method: 'POST' }))
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-a', destinationId: 'dest-1', status: 204, outcome: 'delivered' })
    )
    expect(JSON.stringify(audit.mock.calls)).not.toContain('secret-token')
    expect(JSON.stringify(audit.mock.calls)).not.toContain('payload-secret')
  })

  it('fails closed when registry returns a destination owned by another tenant', async () => {
    const processor = createWebhookProcessor({
      resolveDestination: async () => ({
        id: 'dest-1',
        tenantId: 'tenant-b',
        url: 'https://hooks.example/events',
      }),
      httpClient: { request: vi.fn() },
      audit: vi.fn(),
    })

    await expect(processor(job('tenant-a', 'dest-1'), {} as never)).rejects.toThrow(
      'Webhook destination tenant mismatch'
    )
  })

  it.each([
    ['registry error', async () => { throw new Error('database unavailable') }, 'RESOLUTION_ERROR'],
    ['missing destination', async () => null, 'DESTINATION_NOT_FOUND'],
    [
      'tenant mismatch',
      async () => ({ id: 'dest-1', tenantId: 'tenant-b', url: 'https://hooks.example' }),
      'TENANT_MISMATCH',
    ],
  ])('audits safe metadata when delivery fails during %s', async (_case, resolver, errorCode) => {
    const audit = vi.fn<(event: WebhookAuditEvent) => void>()
    const processor = createWebhookProcessor({
      resolveDestination: resolver,
      httpClient: { request: vi.fn() },
      audit,
    })

    await expect(processor(job('tenant-a', 'dest-1'), {} as never)).rejects.toThrow()
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant-a',
        destinationId: 'dest-1',
        outcome: 'failed',
        errorCode,
      })
    )
    expect(JSON.stringify(audit.mock.calls)).not.toContain('database unavailable')
    expect(JSON.stringify(audit.mock.calls)).not.toContain('hooks.example')
  })

  it('uses a parameterized tenant-bound persistent lookup and exposes startup readiness', async () => {
    const unsafe = vi.fn().mockResolvedValueOnce([])
    const transactionUnsafe = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'dest-1', tenant_id: 'tenant-a', url: 'https://hooks.example', status: 'active' },
      ])
    const registry = createPostgresWebhookDestinationRegistry({
      unsafe,
      begin: async (callback) => await callback({ unsafe: transactionUnsafe }),
    })

    await registry.assertReady()
    await expect(registry.resolve('tenant-a', 'dest-1')).resolves.toEqual({
      id: 'dest-1',
      tenantId: 'tenant-a',
      url: 'https://hooks.example',
    })
    expect(transactionUnsafe.mock.calls[0]?.[1]).toEqual(['tenant-a'])
    expect(transactionUnsafe.mock.calls[1]?.[1]).toEqual(['dest-1', 'tenant-a'])
  })
})
