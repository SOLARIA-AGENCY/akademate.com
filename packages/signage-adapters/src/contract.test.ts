import assert from 'node:assert/strict'
import test from 'node:test'

import {
  publishWithSignageAdapter,
  revokeWithSignageAdapter,
  SignageAdapterContractError,
  validateAdapterReceipt,
  type SignageAdapter,
  type SignagePublishRequest,
} from './contract.ts'

const request: SignagePublishRequest = {
  tenantId: 'tenant-a',
  siteId: 'site-stockholm',
  displayId: 'display-reception',
  publicationId: 'publication-42',
  manifestUrl: 'https://assets.example.test/manifests/42.json',
  manifestDigest: `sha256:${'a'.repeat(64)}`,
  expiresAt: '2026-10-24T12:00:00.000Z',
}

test('accepts a provider receipt only for the exact request scope', () => {
  const receipt = validateAdapterReceipt(request, {
    status: 'accepted',
    tenantId: request.tenantId,
    siteId: request.siteId,
    displayId: request.displayId,
    publicationId: request.publicationId,
    providerReference: 'provider-123',
  })

  assert.equal(receipt.status, 'accepted')
  if (receipt.status === 'accepted') {
    assert.equal(receipt.providerReference, 'provider-123')
  }
})

test('rejects tenant, site, display and publication substitution', () => {
  for (const tampered of [
    { tenantId: 'tenant-b' },
    { siteId: 'site-other' },
    { displayId: 'display-other' },
    { publicationId: 'publication-other' },
  ]) {
    assert.throws(
      () =>
        validateAdapterReceipt(request, {
          status: 'accepted',
          tenantId: request.tenantId,
          siteId: request.siteId,
          displayId: request.displayId,
          publicationId: request.publicationId,
          providerReference: 'provider-123',
          ...tampered,
        }),
      (error: unknown) =>
        error instanceof SignageAdapterContractError && error.code === 'SCOPE_MISMATCH',
    )
  }
})

test('keeps provider unavailability explicit and retryable', () => {
  const receipt = validateAdapterReceipt(request, {
    status: 'unavailable',
    tenantId: request.tenantId,
    siteId: request.siteId,
    displayId: request.displayId,
    publicationId: request.publicationId,
    retryAfterSeconds: 30,
  })

  assert.equal(receipt.status, 'unavailable')
  assert.equal(receipt.retryAfterSeconds, 30)
})

test('rejects accepted responses without a provider reference and malformed retry delays', () => {
  assert.throws(
    () =>
      validateAdapterReceipt(request, {
        status: 'accepted',
        tenantId: request.tenantId,
        siteId: request.siteId,
        displayId: request.displayId,
        publicationId: request.publicationId,
      }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_RECEIPT',
  )

  assert.throws(
    () =>
      validateAdapterReceipt(request, {
        status: 'unavailable',
        tenantId: request.tenantId,
        siteId: request.siteId,
        displayId: request.displayId,
        publicationId: request.publicationId,
        retryAfterSeconds: -1,
      }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_RECEIPT',
  )
})

test('rejects unsafe or ambiguous manifest transport inputs before trusting a receipt', () => {
  const receipt = {
    status: 'accepted' as const,
    tenantId: request.tenantId,
    siteId: request.siteId,
    displayId: request.displayId,
    publicationId: request.publicationId,
    providerReference: 'provider-123',
  }

  for (const tampered of [
    { manifestUrl: 'http://assets.example.test/manifests/42.json' },
    { manifestUrl: 'https://user:secret@assets.example.test/manifests/42.json' },
    { manifestUrl: 'https://assets.example.test/manifests/42.json#stale' },
    { manifestDigest: 'sha256:not-a-digest' },
    { expiresAt: '24 October 2026' },
    { expiresAt: '2026-10-24T12:00:00Z' },
  ]) {
    assert.throws(
      () => validateAdapterReceipt({ ...request, ...tampered }, receipt),
      (error: unknown) =>
        error instanceof SignageAdapterContractError && error.code === 'INVALID_REQUEST',
    )
  }
})

test('requires rejected receipts to explain the failure and reserves retry delay for unavailable', () => {
  assert.throws(
    () =>
      validateAdapterReceipt(request, {
        status: 'rejected',
        tenantId: request.tenantId,
        siteId: request.siteId,
        displayId: request.displayId,
        publicationId: request.publicationId,
      }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_RECEIPT',
  )

  assert.throws(
    () =>
      validateAdapterReceipt(request, {
        status: 'accepted',
        tenantId: request.tenantId,
        siteId: request.siteId,
        displayId: request.displayId,
        publicationId: request.publicationId,
        providerReference: 'provider-123',
        retryAfterSeconds: 30,
      }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_RECEIPT',
  )
})

test('rejects invalid publish and revoke scope before dispatching to a provider', async () => {
  let calls = 0
  const adapter: SignageAdapter = {
    key: 'test',
    async publish() {
      calls += 1
      return null
    },
    async revoke() {
      calls += 1
      return null
    },
  }

  await assert.rejects(
    () => publishWithSignageAdapter(adapter, { ...request, tenantId: '../tenant-a' }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_REQUEST',
  )
  await assert.rejects(
    () =>
      revokeWithSignageAdapter(adapter, {
        tenantId: '',
        siteId: '',
        displayId: '',
        publicationId: '',
      }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_REQUEST',
  )
  await assert.rejects(
    () =>
      revokeWithSignageAdapter(adapter, {
        tenantId: undefined as unknown as string,
        siteId: 'site-stockholm',
        displayId: 'display-reception',
        publicationId: 'publication-42',
      }),
    (error: unknown) =>
      error instanceof SignageAdapterContractError && error.code === 'INVALID_REQUEST',
  )
  assert.equal(calls, 0)
})

test('decodes external receipts strictly and rejects contradictory fields', () => {
  const scope = {
    tenantId: request.tenantId,
    siteId: request.siteId,
    displayId: request.displayId,
    publicationId: request.publicationId,
  }

  for (const receipt of [
    { ...scope, status: 'accepted', providerReference: 'provider-123', reason: 'failed' },
    { ...scope, status: 'rejected', reason: 'failed', providerReference: 'provider-123' },
    { ...scope, status: 'unavailable', reason: 'failed' },
    { ...scope, status: 'accepted', providerReference: 42 },
    null,
  ]) {
    assert.throws(
      () => validateAdapterReceipt(request, receipt),
      (error: unknown) =>
        error instanceof SignageAdapterContractError && error.code === 'INVALID_RECEIPT',
    )
  }
})

test('dispatches an immutable scope snapshot and validates against the original scope', async () => {
  const adapter: SignageAdapter = {
    key: 'mutating-test',
    async publish(received) {
      assert.equal(Object.isFrozen(received), true)
      assert.throws(() => {
        ;(received as { tenantId: string }).tenantId = 'tenant-b'
      }, TypeError)
      return {
        status: 'accepted',
        tenantId: received.tenantId,
        siteId: received.siteId,
        displayId: received.displayId,
        publicationId: received.publicationId,
        providerReference: 'provider-immutable',
      }
    },
    async revoke(received) {
      assert.equal(Object.isFrozen(received), true)
      return {
        status: 'accepted',
        tenantId: received.tenantId,
        siteId: received.siteId,
        displayId: received.displayId,
        publicationId: received.publicationId,
        providerReference: 'provider-immutable',
      }
    },
  }

  const receipt = await publishWithSignageAdapter(adapter, request)
  assert.equal(receipt.status, 'accepted')
  assert.equal(request.tenantId, 'tenant-a')
})
