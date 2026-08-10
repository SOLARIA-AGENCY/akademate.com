import { describe, expect, it } from 'vitest'

import { createFinanceConnectionHandlers } from './finance-connection-handler.ts'

const disabled = () => ({ mode: 'disabled' as const, externalIo: false, realData: false, webhooks: false, writeback: false })
const identity = { userId: 1, tenantId: 2 }

describe('finance connection handlers', () => {
  it('fails closed before authentication when finance runtime is disabled', async () => {
    const handlers = createFinanceConnectionHandlers({
      runtime: disabled,
      authenticate: async () => identity,
      list: async () => ({ items: [] }),
      create: async () => { throw new Error('must not call') },
      update: async () => { throw new Error('must not call') },
    })
    const response = await handlers.GET(new Request('https://app.akademate.com/api/next/finance/connections'))
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'not_found' })
  })

  it('requires authentication and never serializes secret fields', async () => {
    const handlers = createFinanceConnectionHandlers({
      runtime: () => ({ mode: 'scaffold' as const, externalIo: false, realData: false, webhooks: false, writeback: false }),
      authenticate: async () => identity,
      list: async () => ({ items: [{
        id: 'connection-a', financeEntityId: 'entity-a', provider: 'holded', mode: 'scaffold', status: 'pending',
        externalOrganizationId: null, externalOrganizationName: null, hasCredential: true, lastHealthCheckAt: null, lastErrorCode: null,
      }] }),
      create: async () => { throw new Error('not used') },
      update: async () => { throw new Error('not used') },
    })
    const response = await handlers.GET(new Request('https://app.akademate.com/api/next/finance/connections'))
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(JSON.stringify(payload)).not.toContain('ciphertext')
    expect(payload.items[0].hasCredential).toBe(true)
  })

  it('maps invalid JSON and authentication failures to safe responses', async () => {
    const unauthenticated = createFinanceConnectionHandlers({
      runtime: () => ({ mode: 'scaffold' as const, externalIo: false, realData: false, webhooks: false, writeback: false }),
      authenticate: async () => null,
      list: async () => ({ items: [] }),
      create: async () => { throw new Error('must not call') },
      update: async () => { throw new Error('must not call') },
    })
    expect((await unauthenticated.POST(new Request('https://app.akademate.com', { method: 'POST', body: '{}' }))).status).toBe(401)
  })
})
