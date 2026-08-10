import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

import type { FinanceRuntime } from './finance-runtime.ts'

const MAX_BODY_BYTES = 8 * 1024
const MAX_CLOCK_SKEW_SECONDS = 30

export type FinanceSyncRunClaim = {
  runId: string
  tenantId: number
  connectionId: string
  providerResource: string
  attemptCount: number
}

export type FinanceSyncRunResult = {
  runId: string
  status: 'succeeded' | 'failed'
  nextAttemptAt?: Date
  errorCode?: string
  itemsProcessed: number
}

export type InternalFinanceRequestVerifier = {
  verify(request: Request): Promise<boolean>
}

function equalDigest(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'base64url')
  const actualBuffer = Buffer.from(actual, 'base64url')
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
}

export function signInternalFinanceRequest(input: {
  key: string
  method: string
  path: string
  timestamp: string
  nonce: string
  body: string
}): string {
  const bodyDigest = createHash('sha256').update(input.body, 'utf8').digest('base64url')
  return createHmac('sha256', input.key)
    .update([input.method.toUpperCase(), input.path, input.timestamp, input.nonce, bodyDigest].join('\n'), 'utf8')
    .digest('base64url')
}

export function createInternalFinanceRequestVerifier(input: {
  key: string
  now?: () => number
  maxClockSkewSeconds?: number
  nonceStore?: Map<string, number>
}): InternalFinanceRequestVerifier {
  const now = input.now ?? (() => Date.now())
  const maxClockSkewSeconds = input.maxClockSkewSeconds ?? MAX_CLOCK_SKEW_SECONDS
  const nonceStore = input.nonceStore ?? new Map<string, number>()

  return {
    async verify(request) {
      if (!input.key || request.method.toUpperCase() !== 'POST') return false
      const timestamp = request.headers.get('x-akademate-internal-timestamp')
      const nonce = request.headers.get('x-akademate-internal-nonce')
      const signature = request.headers.get('x-akademate-internal-signature')
      if (!timestamp || !nonce || !signature || !/^[0-9]+$/.test(timestamp) || nonce.length < 16 || nonce.length > 128) return false
      const timestampMs = Number(timestamp) * 1000
      if (!Number.isSafeInteger(timestampMs) || Math.abs(now() - timestampMs) > maxClockSkewSeconds * 1000) return false
      const usedUntil = nonceStore.get(nonce)
      if (usedUntil && usedUntil > now()) return false
      const body = await request.clone().text()
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) return false
      const expected = signInternalFinanceRequest({
        key: input.key,
        method: request.method,
        path: new URL(request.url).pathname,
        timestamp,
        nonce,
        body,
      })
      if (!equalDigest(expected, signature)) return false
      nonceStore.set(nonce, now() + maxClockSkewSeconds * 1000)
      for (const [storedNonce, expiry] of nonceStore) if (expiry <= now()) nonceStore.delete(storedNonce)
      return true
    },
  }
}

export function createFinanceDrainHandler(dependencies: {
  runtime: () => FinanceRuntime
  verifyInternalRequest: (request: Request) => Promise<boolean>
  claim: () => Promise<FinanceSyncRunClaim | null>
  execute: (claim: FinanceSyncRunClaim) => Promise<FinanceSyncRunResult>
  finish: (result: FinanceSyncRunResult) => Promise<void>
}) {
  return {
    async POST(request: Request): Promise<Response> {
      const runtime = dependencies.runtime()
      if (runtime.mode !== 'connected' || !runtime.externalIo || !runtime.realData) {
        return Response.json({ error: 'not_found' }, { status: 404 })
      }
      if (!(await dependencies.verifyInternalRequest(request))) {
        return Response.json({ error: 'unauthorized' }, { status: 401 })
      }
      const claim = await dependencies.claim()
      if (!claim) return new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } })
      try {
        const result = await dependencies.execute(claim)
        await dependencies.finish(result)
        return Response.json({ runId: result.runId, status: result.status, itemsProcessed: result.itemsProcessed }, { status: 202, headers: { 'Cache-Control': 'private, no-store' } })
      } catch (error) {
        console.error('[Akademate Next Finance] Drain execution failed', error)
        const result: FinanceSyncRunResult = { runId: claim.runId, status: 'failed', errorCode: 'finance_drain_failed', itemsProcessed: 0 }
        await dependencies.finish(result)
        return Response.json({ error: 'finance_drain_failed' }, { status: 503, headers: { 'Cache-Control': 'private, no-store' } })
      }
    },
  }
}
