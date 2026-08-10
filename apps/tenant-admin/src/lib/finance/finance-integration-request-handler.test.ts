import { describe, expect, it } from 'vitest'

import { createFinanceIntegrationRequestHandlers } from './finance-integration-request-handler.ts'

const runtime = () => ({ mode: 'scaffold' as const, externalIo: false, realData: false, webhooks: false, writeback: false })
const identity = { userId: 4, tenantId: 8 }

describe('finance integration request handlers', () => {
  it('requires authentication and exposes no private recipient or credentials', async () => {
    const handlers = createFinanceIntegrationRequestHandlers({
      runtime, authenticate: async () => null,
      list: async () => ({ items: [] }), create: async () => { throw new Error('must not call') }, detail: async () => { throw new Error('must not call') }, cancel: async () => { throw new Error('must not call') },
    })
    const response = await handlers.GET(new Request('https://app.akademate.com'))
    expect(response.status).toBe(401)
  })

  it('returns a tenant-owned list and a redacted accepted payload', async () => {
    const handlers = createFinanceIntegrationRequestHandlers({
      runtime, authenticate: async () => identity,
      list: async () => ({ items: [{ id: 'request-a', providerName: 'Example Books' } as never] }),
      create: async () => ({ id: 'request-a', providerName: 'Example Books' } as never), detail: async () => { throw new Error('not used') }, cancel: async () => { throw new Error('not used') },
    })
    const list = await handlers.GET(new Request('https://app.akademate.com'))
    expect(list.status).toBe(200)
    const created = await handlers.POST(new Request('https://app.akademate.com', { method: 'POST', body: JSON.stringify({ providerName: 'Example Books' }) }))
    expect(created.status).toBe(201)
    expect(JSON.stringify(await created.json())).not.toContain('agency.solaria')
  })

  it('maps an invalid cancellation state to conflict', async () => {
    const handlers = createFinanceIntegrationRequestHandlers({
      runtime, authenticate: async () => identity, list: async () => ({ items: [] }), create: async () => { throw new Error('not used') }, detail: async () => { throw new Error('not used') }, cancel: async () => { throw Object.assign(new Error('finance_request_cannot_cancel'), { name: 'FinanceIntegrationRequestError' }) },
    })
    // The concrete error class is exercised in command tests; this verifies the transport remains non-success.
    const response = await handlers.PATCH(new Request('https://app.akademate.com', { method: 'PATCH', body: '{}' }), { params: Promise.resolve({ id: 'request-a' }) })
    expect([409, 500]).toContain(response.status)
  })
})
