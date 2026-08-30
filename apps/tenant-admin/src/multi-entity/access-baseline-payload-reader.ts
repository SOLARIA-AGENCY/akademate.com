import type { PayloadRequest } from 'payload'
import type {
  LegacyAccessRole,
  LegacyAccessUserSnapshot,
  MultiEntityAccessBaselineInput,
} from '../../../../packages/tenant/src/multi-entity-access-baseline'

export const PAYLOAD_ACCESS_BASELINE_USER_SELECT = Object.freeze({
  role: true,
  tenant: true,
  is_active: true,
} as const)

export interface PayloadAccessBaselineReaderOptions {
  readonly req: PayloadRequest
  readonly targetTenantId: string
  readonly policyDigest: string
  readonly auditReviewReference: string
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxUsers?: number
}

export type PayloadAccessBaselineReaderErrorCode =
  | 'ACCESS_BASELINE_PAYLOAD_INVALID_CONFIGURATION'
  | 'ACCESS_BASELINE_PAYLOAD_AUDIT_ROLE_REQUIRED'
  | 'ACCESS_BASELINE_PAYLOAD_READ_FAILED'
  | 'ACCESS_BASELINE_PAYLOAD_INVALID_RESPONSE'
  | 'ACCESS_BASELINE_PAYLOAD_PAGINATION_CHANGED'
  | 'ACCESS_BASELINE_PAYLOAD_PAGE_LIMIT_EXCEEDED'
  | 'ACCESS_BASELINE_PAYLOAD_USER_LIMIT_EXCEEDED'
  | 'ACCESS_BASELINE_PAYLOAD_DUPLICATE_USER'
  | 'ACCESS_BASELINE_PAYLOAD_USER_INVALID'

export class PayloadAccessBaselineReaderError extends Error {
  constructor(readonly code: PayloadAccessBaselineReaderErrorCode) {
    super('Access baseline Payload reading failed.')
    this.name = 'PayloadAccessBaselineReaderError'
  }
}

interface PayloadPage {
  readonly docs: readonly Readonly<Record<string, unknown>>[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly nextPage?: number | null
}

const ROLES = new Set<LegacyAccessRole>([
  'superadmin',
  'admin',
  'gestor',
  'marketing',
  'asesor',
  'lectura',
])
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_USERS = 10_000
const HARD_MAX_USERS = 100_000

/**
 * Captures the current user assignments through an explicitly reviewed
 * platform-audit request. Superadmin is required only to avoid a partial
 * snapshot; it is not converted into, or used as, a business finance role.
 */
export function createPayloadAccessBaselineInputLoader(
  options: PayloadAccessBaselineReaderOptions
): () => Promise<MultiEntityAccessBaselineInput> {
  const configuration = validateConfiguration(options)
  return async () => {
    const users: LegacyAccessUserSnapshot[] = []
    const ids = new Set<string>()
    let expectedTotalDocs: number | null = null
    let expectedTotalPages: number | null = null
    let pageNumber = 1

    while (true) {
      if (pageNumber > configuration.maxPages) {
        throw readerError('ACCESS_BASELINE_PAYLOAD_PAGE_LIMIT_EXCEEDED')
      }
      let response: unknown
      try {
        response = await options.req.payload.find({
          collection: 'users',
          where: {
            or: [
              { tenant: { equals: configuration.tenantId } },
              { role: { equals: 'superadmin' } },
            ],
          },
          page: pageNumber,
          limit: configuration.pageSize,
          pagination: true,
          sort: 'id',
          depth: 0,
          overrideAccess: false,
          req: options.req,
          select: PAYLOAD_ACCESS_BASELINE_USER_SELECT,
          showHiddenFields: false,
          trash: false,
        } as never)
      } catch {
        throw readerError('ACCESS_BASELINE_PAYLOAD_READ_FAILED')
      }

      const page = normalizePage(response, pageNumber, configuration.pageSize)
      if (page.totalPages > configuration.maxPages) {
        throw readerError('ACCESS_BASELINE_PAYLOAD_PAGE_LIMIT_EXCEEDED')
      }
      if (page.totalDocs > configuration.maxUsers) {
        throw readerError('ACCESS_BASELINE_PAYLOAD_USER_LIMIT_EXCEEDED')
      }
      if (expectedTotalDocs === null) {
        expectedTotalDocs = page.totalDocs
        expectedTotalPages = page.totalPages
      } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
        throw readerError('ACCESS_BASELINE_PAYLOAD_PAGINATION_CHANGED')
      }

      for (const doc of page.docs) {
        const user = projectUser(doc, options.targetTenantId)
        if (ids.has(user.id)) throw readerError('ACCESS_BASELINE_PAYLOAD_DUPLICATE_USER')
        ids.add(user.id)
        users.push(user)
        if (users.length > configuration.maxUsers) {
          throw readerError('ACCESS_BASELINE_PAYLOAD_USER_LIMIT_EXCEEDED')
        }
      }

      if (!page.hasNextPage) break
      pageNumber += 1
    }

    if (expectedTotalDocs === null || users.length !== expectedTotalDocs) {
      throw readerError('ACCESS_BASELINE_PAYLOAD_PAGINATION_CHANGED')
    }
    return Object.freeze({
      targetTenantId: options.targetTenantId,
      policyDigest: options.policyDigest,
      users: Object.freeze(users),
      maxUsers: configuration.maxUsers,
    })
  }
}

function projectUser(
  doc: Readonly<Record<string, unknown>>,
  targetTenantId: string
): LegacyAccessUserSnapshot {
  const id = relationshipId(doc.id)
  const role = doc.role
  const tenantId = nullableRelationshipId(doc.tenant)
  const isActive = doc.is_active
  if (
    id === null ||
    typeof role !== 'string' ||
    !ROLES.has(role as LegacyAccessRole) ||
    (isActive !== true && isActive !== false && isActive !== null) ||
    (role === 'superadmin' ? tenantId !== null : tenantId !== targetTenantId)
  ) {
    throw readerError('ACCESS_BASELINE_PAYLOAD_USER_INVALID')
  }
  return Object.freeze({
    id,
    role: role as LegacyAccessRole,
    tenantId,
    isActive: isActive as boolean | null,
  })
}

function validateConfiguration(options: PayloadAccessBaselineReaderOptions): {
  readonly tenantId: number
  readonly pageSize: number
  readonly maxPages: number
  readonly maxUsers: number
} {
  if (
    !validPayloadRequest(options?.req) ||
    options.req.user?.role !== 'superadmin' ||
    !/^[1-9]\d*$/.test(options.targetTenantId) ||
    !DIGEST_PATTERN.test(options.policyDigest) ||
    !REVIEW_REFERENCE_PATTERN.test(options.auditReviewReference)
  ) {
    if (validPayloadRequest(options?.req) && options.req.user?.role !== 'superadmin') {
      throw readerError('ACCESS_BASELINE_PAYLOAD_AUDIT_ROLE_REQUIRED')
    }
    throw readerError('ACCESS_BASELINE_PAYLOAD_INVALID_CONFIGURATION')
  }
  const tenantId = Number(options.targetTenantId)
  if (!Number.isSafeInteger(tenantId)) {
    throw readerError('ACCESS_BASELINE_PAYLOAD_INVALID_CONFIGURATION')
  }
  return {
    tenantId,
    pageSize: limit(options.pageSize, DEFAULT_PAGE_SIZE, HARD_MAX_PAGE_SIZE),
    maxPages: limit(options.maxPages, DEFAULT_MAX_PAGES, HARD_MAX_PAGES),
    maxUsers: limit(options.maxUsers, DEFAULT_MAX_USERS, HARD_MAX_USERS),
  }
}

function normalizePage(value: unknown, requestedPage: number, limit: number): PayloadPage {
  if (!isRecord(value)) throw readerError('ACCESS_BASELINE_PAYLOAD_INVALID_RESPONSE')
  const page = value as Partial<Record<keyof PayloadPage, unknown>>
  if (
    !Array.isArray(page.docs) ||
    !page.docs.every(isRecord) ||
    page.docs.length > limit ||
    !positiveInteger(page.page) ||
    page.page !== requestedPage ||
    !nonNegativeInteger(page.totalDocs) ||
    !nonNegativeInteger(page.totalPages) ||
    typeof page.hasNextPage !== 'boolean' ||
    !validNextPage(page.nextPage)
  ) {
    throw readerError('ACCESS_BASELINE_PAYLOAD_INVALID_RESPONSE')
  }
  const validEmpty = page.totalDocs === 0 && (page.totalPages === 0 || page.totalPages === 1)
  const validNonEmpty = page.totalDocs > 0 && page.totalPages === Math.ceil(page.totalDocs / limit)
  const expectedHasNext = page.totalDocs > 0 && requestedPage < page.totalPages
  if (
    (!validEmpty && !validNonEmpty) ||
    page.hasNextPage !== expectedHasNext ||
    (expectedHasNext && page.nextPage !== requestedPage + 1) ||
    (!expectedHasNext && page.nextPage !== null && page.nextPage !== undefined)
  ) {
    throw readerError('ACCESS_BASELINE_PAYLOAD_INVALID_RESPONSE')
  }
  return page as unknown as PayloadPage
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  return Boolean(
    isRecord(value) && isRecord(value.payload) && typeof value.payload.find === 'function'
  )
}

function relationshipId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && value.length > 0 && value.trim() === value) return value
  if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'id')) {
    return relationshipId(value.id)
  }
  return null
}

function nullableRelationshipId(value: unknown): string | null {
  return value === null || value === undefined ? null : relationshipId(value)
}

function limit(value: number | undefined, fallback: number, hardMax: number): number {
  const result = value ?? fallback
  if (!Number.isSafeInteger(result) || result < 1 || result > hardMax) {
    throw readerError('ACCESS_BASELINE_PAYLOAD_INVALID_CONFIGURATION')
  }
  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function validNextPage(value: unknown): value is number | null | undefined {
  return value === null || value === undefined || positiveInteger(value)
}

function readerError(code: PayloadAccessBaselineReaderErrorCode): PayloadAccessBaselineReaderError {
  return new PayloadAccessBaselineReaderError(code)
}
