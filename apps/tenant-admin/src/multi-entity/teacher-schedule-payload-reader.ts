import type { PayloadRequest } from 'payload'

export interface PayloadTeacherSchedulePageRequest {
  readonly tenantId: string
  readonly page: number
  readonly limit: number
  readonly depth: 0
  readonly overrideAccess: false
  readonly accessMode: 'current_effective_access'
}

export interface PayloadTeacherSchedulePage {
  readonly docs: readonly Readonly<Record<string, unknown>>[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly nextPage?: number | null
}

export interface PayloadTeacherSchedulePageReaderOptions {
  /**
   * The existing Payload request is mandatory so Local API access checks use
   * the current user and transaction. This adapter never creates or elevates a
   * service user.
   */
  readonly req: PayloadRequest
}

export type PayloadTeacherScheduleReaderErrorCode =
  | 'TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_CONFIGURATION'
  | 'TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_REQUEST'
  | 'TEACHER_SCHEDULE_PAYLOAD_READER_READ_FAILED'
  | 'TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_RESPONSE'

export class PayloadTeacherScheduleReaderError extends Error {
  constructor(readonly code: PayloadTeacherScheduleReaderErrorCode) {
    super('Teacher schedule Payload reading failed.')
    this.name = 'PayloadTeacherScheduleReaderError'
  }
}

const HARD_MAX_PAGE_SIZE = 1_000

/**
 * Current `course-runs` projection only. `id` is always returned by Payload.
 * `legalEntity` is intentionally absent because that field is not registered
 * in the current production schema; the snapshot loader can add it only from
 * an explicit reviewed resolution.
 */
export const PAYLOAD_TEACHER_SCHEDULE_SELECT = Object.freeze({
  tenant: true,
  campus: true,
  instructor: true,
  instructors: true,
  start_date: true,
  end_date: true,
  schedule_days: true,
  schedule_time_start: true,
  schedule_time_end: true,
  planning_status: true,
} as const)

const ALLOWED_DOCUMENT_FIELDS = Object.freeze([
  'id',
  ...Object.keys(PAYLOAD_TEACHER_SCHEDULE_SELECT),
] as const)

/**
 * Creates a read-only, unregistered Payload adapter for the staging snapshot
 * loader. The returned callback has no mutation methods and cannot bypass the
 * current request's access control.
 */
export function createPayloadTeacherSchedulePageReader(
  options: PayloadTeacherSchedulePageReaderOptions
): (request: PayloadTeacherSchedulePageRequest) => Promise<PayloadTeacherSchedulePage> {
  if (!validPayloadRequest(options?.req)) {
    throw readerError('TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_CONFIGURATION')
  }

  const req = options.req

  return async (request) => {
    validatePageRequest(request)

    let response: unknown
    try {
      response = await req.payload.find({
        collection: 'course-runs',
        where: {
          tenant: {
            equals: request.tenantId,
          },
        },
        page: request.page,
        limit: request.limit,
        pagination: true,
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req,
        select: PAYLOAD_TEACHER_SCHEDULE_SELECT,
        showHiddenFields: false,
        trash: false,
      })
    } catch {
      throw readerError('TEACHER_SCHEDULE_PAYLOAD_READER_READ_FAILED')
    }

    return normalizePage(response, request)
  }
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  if (!value || typeof value !== 'object') return false
  const payload = (value as { payload?: unknown }).payload
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    typeof (payload as { find?: unknown }).find === 'function'
  )
}

function validatePageRequest(request: PayloadTeacherSchedulePageRequest): void {
  if (
    !request ||
    !validIdentifier(request.tenantId) ||
    !positiveInteger(request.page) ||
    !positiveInteger(request.limit) ||
    request.limit > HARD_MAX_PAGE_SIZE ||
    request.depth !== 0 ||
    request.overrideAccess !== false ||
    request.accessMode !== 'current_effective_access'
  ) {
    throw readerError('TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_REQUEST')
  }
}

function normalizePage(
  value: unknown,
  request: PayloadTeacherSchedulePageRequest
): PayloadTeacherSchedulePage {
  if (!value || typeof value !== 'object') {
    throw readerError('TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_RESPONSE')
  }

  const page = value as Partial<{
    docs: unknown
    page: unknown
    totalDocs: unknown
    totalPages: unknown
    hasNextPage: unknown
    nextPage: unknown
  }>
  if (
    !Array.isArray(page.docs) ||
    !page.docs.every(isRecord) ||
    page.docs.length > request.limit ||
    !positiveInteger(page.page) ||
    page.page !== request.page ||
    !nonNegativeInteger(page.totalDocs) ||
    !nonNegativeInteger(page.totalPages) ||
    typeof page.hasNextPage !== 'boolean' ||
    !validNextPage(page.nextPage)
  ) {
    throw readerError('TEACHER_SCHEDULE_PAYLOAD_READER_INVALID_RESPONSE')
  }

  return Object.freeze({
    docs: Object.freeze(page.docs.map(projectDocument)),
    page: page.page,
    totalDocs: page.totalDocs,
    totalPages: page.totalPages,
    hasNextPage: page.hasNextPage,
    nextPage: page.nextPage,
  })
}

function projectDocument(
  source: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  const projected: Record<string, unknown> = {}
  for (const field of ALLOWED_DOCUMENT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      projected[field] = source[field]
    }
  }
  return Object.freeze(projected)
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 255 && value.trim() === value
  )
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

function readerError(
  code: PayloadTeacherScheduleReaderErrorCode
): PayloadTeacherScheduleReaderError {
  return new PayloadTeacherScheduleReaderError(code)
}
