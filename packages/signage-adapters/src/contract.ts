export type SignageAdapterContractErrorCode =
  | 'INVALID_RECEIPT'
  | 'INVALID_REQUEST'
  | 'SCOPE_MISMATCH'

export interface SignagePublishRequest {
  readonly tenantId: string
  readonly siteId: string
  readonly displayId: string
  readonly publicationId: string
  readonly manifestUrl: string
  readonly manifestDigest: string
  readonly expiresAt: string
}

export interface SignageRevokeRequest {
  readonly tenantId: string
  readonly siteId: string
  readonly displayId: string
  readonly publicationId: string
}

interface SignageAdapterReceiptScope {
  readonly tenantId: string
  readonly siteId: string
  readonly displayId: string
  readonly publicationId: string
}

export type SignageAdapterReceipt =
  | (SignageAdapterReceiptScope & {
      readonly status: 'accepted'
      readonly providerReference: string
    })
  | (SignageAdapterReceiptScope & {
      readonly status: 'rejected'
      readonly reason: string
    })
  | (SignageAdapterReceiptScope & {
      readonly status: 'unavailable'
      readonly retryAfterSeconds?: number
    })

export type SignageAdapterReceiptInput = SignageAdapterReceipt

export interface SignageAdapter {
  readonly key: string
  publish(request: SignagePublishRequest): Promise<unknown>
  revoke(request: SignageRevokeRequest): Promise<unknown>
}

export class SignageAdapterContractError extends Error {
  readonly code: SignageAdapterContractErrorCode

  constructor(code: SignageAdapterContractErrorCode, message: string) {
    super(message)
    this.name = 'SignageAdapterContractError'
    this.code = code
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireNonEmpty(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new SignageAdapterContractError('INVALID_RECEIPT', `${field} must not be empty`)
  }
  return value
}

function validateScopeRequest(request: SignageRevokeRequest): void {
  for (const [field, value] of [
    ['tenantId', request.tenantId],
    ['siteId', request.siteId],
    ['displayId', request.displayId],
    ['publicationId', request.publicationId],
  ] as const) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value)) {
      throw new SignageAdapterContractError(
        'INVALID_REQUEST',
        `${field} must be a canonical ASCII identifier`,
      )
    }
  }
}

export function validateRevokeRequest(request: SignageRevokeRequest): SignageRevokeRequest {
  validateScopeRequest(request)
  return request
}

export function validatePublishRequest(request: SignagePublishRequest): SignagePublishRequest {
  validateScopeRequest(request)

  let manifestUrl: URL
  try {
    manifestUrl = new URL(request.manifestUrl)
  } catch {
    throw new SignageAdapterContractError('INVALID_REQUEST', 'manifestUrl must be an absolute URL')
  }
  if (
    manifestUrl.protocol !== 'https:' ||
    manifestUrl.hostname === '' ||
    manifestUrl.username !== '' ||
    manifestUrl.password !== '' ||
    manifestUrl.hash !== ''
  ) {
    throw new SignageAdapterContractError(
      'INVALID_REQUEST',
      'manifestUrl must use HTTPS without embedded credentials or fragments',
    )
  }
  if (!/^sha256:[a-f0-9]{64}$/u.test(request.manifestDigest)) {
    throw new SignageAdapterContractError(
      'INVALID_REQUEST',
      'manifestDigest must contain a lowercase SHA-256 digest',
    )
  }
  const expiresAt = new Date(request.expiresAt)
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.toISOString() !== request.expiresAt) {
    throw new SignageAdapterContractError(
      'INVALID_REQUEST',
      'expiresAt must be a canonical ISO-8601 instant',
    )
  }
  return request
}

export function validateAdapterReceipt(
  request: SignagePublishRequest | SignageRevokeRequest,
  receiptInput: unknown,
): SignageAdapterReceipt {
  if ('manifestUrl' in request) validatePublishRequest(request)
  else validateRevokeRequest(request)

  if (!isRecord(receiptInput)) {
    throw new SignageAdapterContractError('INVALID_RECEIPT', 'Receipt must be an object')
  }
  const receipt = receiptInput

  const tenantId = requireNonEmpty(receipt.tenantId, 'tenantId')
  const siteId = requireNonEmpty(receipt.siteId, 'siteId')
  const displayId = requireNonEmpty(receipt.displayId, 'displayId')
  const publicationId = requireNonEmpty(receipt.publicationId, 'publicationId')

  if (
    tenantId !== request.tenantId ||
    siteId !== request.siteId ||
    displayId !== request.displayId ||
    publicationId !== request.publicationId
  ) {
    throw new SignageAdapterContractError(
      'SCOPE_MISMATCH',
      'Adapter receipt does not match the exact publication scope',
    )
  }
  if (receipt.status !== 'unavailable' && receipt.retryAfterSeconds !== undefined) {
    throw new SignageAdapterContractError(
      'INVALID_RECEIPT',
      'retryAfterSeconds is only valid for unavailable receipts',
    )
  }

  const retryAfterSeconds = receipt.retryAfterSeconds
  if (
    retryAfterSeconds !== undefined &&
    (typeof retryAfterSeconds !== 'number' ||
      !Number.isSafeInteger(retryAfterSeconds) ||
      Object.is(retryAfterSeconds, -0) ||
      retryAfterSeconds < 0)
  ) {
    throw new SignageAdapterContractError(
      'INVALID_RECEIPT',
      'retryAfterSeconds must be a non-negative integer',
    )
  }

  if (receipt.status === 'accepted') {
    if (receipt.reason !== undefined) {
      throw new SignageAdapterContractError(
        'INVALID_RECEIPT',
        'accepted receipts must not include a rejection reason',
      )
    }
    return {
      status: 'accepted',
      tenantId,
      siteId,
      displayId,
      publicationId,
      providerReference: requireNonEmpty(receipt.providerReference, 'providerReference'),
    }
  }
  if (receipt.status === 'rejected') {
    if (receipt.providerReference !== undefined) {
      throw new SignageAdapterContractError(
        'INVALID_RECEIPT',
        'rejected receipts must not include a provider reference',
      )
    }
    return {
      status: 'rejected',
      tenantId,
      siteId,
      displayId,
      publicationId,
      reason: requireNonEmpty(receipt.reason, 'reason'),
    }
  }
  if (receipt.status === 'unavailable') {
    if (receipt.providerReference !== undefined || receipt.reason !== undefined) {
      throw new SignageAdapterContractError(
        'INVALID_RECEIPT',
        'unavailable receipts must not include providerReference or reason',
      )
    }
    return {
      status: 'unavailable',
      tenantId,
      siteId,
      displayId,
      publicationId,
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    }
  }

  throw new SignageAdapterContractError('INVALID_RECEIPT', 'Unknown adapter receipt status')
}

export async function publishWithSignageAdapter(
  adapter: SignageAdapter,
  request: SignagePublishRequest,
): Promise<SignageAdapterReceipt> {
  const snapshot = Object.freeze({
    tenantId: request.tenantId,
    siteId: request.siteId,
    displayId: request.displayId,
    publicationId: request.publicationId,
    manifestUrl: request.manifestUrl,
    manifestDigest: request.manifestDigest,
    expiresAt: request.expiresAt,
  })
  validatePublishRequest(snapshot)
  const receipt = await adapter.publish(snapshot)
  return validateAdapterReceipt(snapshot, receipt)
}

export async function revokeWithSignageAdapter(
  adapter: SignageAdapter,
  request: SignageRevokeRequest,
): Promise<SignageAdapterReceipt> {
  const snapshot = Object.freeze({
    tenantId: request.tenantId,
    siteId: request.siteId,
    displayId: request.displayId,
    publicationId: request.publicationId,
  })
  validateRevokeRequest(snapshot)
  const receipt = await adapter.revoke(snapshot)
  return validateAdapterReceipt(snapshot, receipt)
}
