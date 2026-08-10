import { describe, expect, it } from 'vitest'

import {
  createFinanceDrainHandler,
  createInternalFinanceRequestVerifier,
  signInternalFinanceRequest,
} from './finance-drain-handler.ts'

const connected = () => ({ mode: 'connected' as const, externalIo: true, realData: true, webhooks: false, writeback: false })
const now = 1_700_000_000_000

function signedRequest(body = '', nonce = 'nonce-1234567890123456') {
  const timestamp = String(Math.floor(now / 1000))
  const path = '/api/internal/next/finance/drain'
  const key = 'internal-secret'
  return new Request(`https://tenant-admin:3000${path}`, {
    method: 'POST',
    body,
    headers: {
      'x-akademate-internal-timestamp': timestamp,
      'x-akademate-internal-nonce': nonce,
      'x-akademate-internal-signature': signInternalFinanceRequest({ key, method: 'POST', path, timestamp, nonce, body }),
    },
  })
}

describe('finance internal drain', () => {
  it('accepts one valid signed request and rejects replay', async () => {
    const verifier = createInternalFinanceRequestVerifier({ key: 'internal-secret', now: () => now })
    expect(await verifier.verify(signedRequest())).toBe(true)
    expect(await verifier.verify(signedRequest())).toBe(false)
  })

  it('rejects a changed body and stale timestamp', async () => {
    const verifier = createInternalFinanceRequestVerifier({ key: 'internal-secret', now: () => now })
    const request = signedRequest('{"run":1}')
    const changed = new Request(request.url, { method: 'POST', body: '{"run":2}', headers: request.headers })
    expect(await verifier.verify(changed)).toBe(false)
    const stale = new Request(request.url, { method: 'POST', body: '', headers: {
      ...Object.fromEntries(request.headers),
      'x-akademate-internal-timestamp': String(Math.floor((now - 31_000) / 1000)),
    } })
    expect(await verifier.verify(stale)).toBe(false)
  })

  it('does not claim or execute in disabled/scaffold mode', async () => {
    let calls = 0
    const handler = createFinanceDrainHandler({
      runtime: () => ({ mode: 'scaffold' as const, externalIo: false, realData: false, webhooks: false, writeback: false }),
      verifyInternalRequest: async () => { calls += 1; return true },
      claim: async () => { calls += 1; return null },
      execute: async () => { calls += 1; throw new Error('must not execute') },
      finish: async () => { calls += 1 },
    })
    expect((await handler.POST(new Request('https://tenant-admin/drain', { method: 'POST' }))).status).toBe(404)
    expect(calls).toBe(0)
  })

  it('returns 204 when no queue item is available and 202 after execution', async () => {
    const verifier = createInternalFinanceRequestVerifier({ key: 'internal-secret', now: () => now })
    let claimAvailable = false
    const finished: string[] = []
    const handler = createFinanceDrainHandler({
      runtime: connected,
      verifyInternalRequest: (request) => verifier.verify(request),
      claim: async () => claimAvailable ? { runId: 'run-1', tenantId: 7, connectionId: 'connection-1', providerResource: 'invoices', attemptCount: 1 } : null,
      execute: async (claim) => ({ runId: claim.runId, status: 'succeeded' as const, itemsProcessed: 4 }),
      finish: async (result) => { finished.push(result.status) },
    })
    expect((await handler.POST(signedRequest())).status).toBe(204)
    claimAvailable = true
    const response = await handler.POST(signedRequest('{"wake":true}', 'nonce-2234567890123456'))
    expect(response.status).toBe(202)
    expect(finished).toEqual(['succeeded'])
  })
})
