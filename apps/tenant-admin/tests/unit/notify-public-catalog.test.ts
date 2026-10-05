import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildPublicCatalogPurgePayload,
  notifyPublicCatalog,
  signPublicCatalogWebhook,
} from '@/src/collections/_hooks/notifyPublicCatalog'

describe('notifyPublicCatalog', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.CEP_WORKER_PURGE_URL
    delete process.env.CEP_WORKER_PURGE_SECRET
  })

  it('signs the body with HMAC SHA-256', () => {
    const body = '{"event":"catalog.changed"}'
    expect(signPublicCatalogWebhook('secret', body)).toMatch(/^sha256=[a-f0-9]{64}$/)
  })

  it('builds a stable idempotency key', () => {
    const payload = buildPublicCatalogPurgePayload({
      operation: 'update',
      collection: 'courses',
      id: 12,
      updatedAt: '2026-09-02T10:00:00.000Z',
    })
    expect(payload.idempotencyKey).toBe('courses:12:2026-09-02T10:00:00.000Z')
  })

  it('does not throw when the Worker is down', async () => {
    process.env.CEP_WORKER_PURGE_URL = 'https://cepformacion.com/internal/purge'
    process.env.CEP_WORKER_PURGE_SECRET = 'secret'
    const fetchMock = vi.fn().mockRejectedValue(new Error('origin down'))
    vi.stubGlobal('fetch', fetchMock)

    const doc = notifyPublicCatalog({
      doc: { id: 9, updatedAt: '2026-09-02T10:00:00.000Z' },
      operation: 'update',
      collection: { slug: 'courses' },
      req: { payload: { logger: { error: vi.fn() } } },
    } as never)

    expect(doc).toEqual({ id: 9, updatedAt: '2026-09-02T10:00:00.000Z' })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('skips delivery when env is missing', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    notifyPublicCatalog({
      doc: { id: 1 },
      operation: 'create',
      collection: { slug: 'courses' },
      req: {},
    } as never)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
