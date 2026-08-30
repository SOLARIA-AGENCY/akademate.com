import type { PayloadRequest } from 'payload'

import {
  COURSE_RUN_ENROLLMENT_TIME_ZONE,
  type CourseRunEnrollmentClosureCampaign,
  type CourseRunEnrollmentClosureInput,
  type CourseRunEnrollmentClosureScope,
  type CourseRunEnrollmentClosureSession,
} from '../../../../packages/tenant/src/course-run-enrollment-closure'
import {
  runCourseRunEnrollmentClosureShadow,
  type CourseRunEnrollmentClosureRunnerResult,
} from '../../../../packages/tenant/src/course-run-enrollment-closure-runner'

export interface ReviewedEnrollmentClosureScope extends CourseRunEnrollmentClosureScope {
  readonly reviewReference: string
}

export type EnrollmentClosureCampaignReader = (
  scope: ReviewedEnrollmentClosureScope
) => Promise<readonly CourseRunEnrollmentClosureCampaign[]>

export interface PayloadEnrollmentClosureSnapshotLoaderOptions {
  readonly req: PayloadRequest
  readonly scope: ReviewedEnrollmentClosureScope
  readonly now: string
  readonly readCampaigns: EnrollmentClosureCampaignReader
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxSessions?: number
}

export interface MetaAdDraftCampaignReaderOptions {
  readonly execute: (query: string) => Promise<unknown>
  readonly reviewReference: string
  readonly maxCampaigns?: number
}

export interface PayloadEnrollmentClosureShadowRunOptions {
  readonly req: PayloadRequest
  readonly scope: ReviewedEnrollmentClosureScope
  readonly now: string
  readonly executeMetaRead: (query: string) => Promise<unknown>
  readonly environment?: Readonly<Record<string, string | undefined>>
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxSessions?: number
  readonly maxCampaigns?: number
}

export type EnrollmentClosurePayloadReaderErrorCode =
  | 'ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION'
  | 'ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_READ_FAILED'
  | 'ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_INVALID'
  | 'ENROLLMENT_CLOSURE_PAYLOAD_SESSIONS_READ_FAILED'
  | 'ENROLLMENT_CLOSURE_PAYLOAD_SESSION_INVALID'
  | 'ENROLLMENT_CLOSURE_PAYLOAD_PAGINATION_CHANGED'
  | 'ENROLLMENT_CLOSURE_PAYLOAD_LIMIT_EXCEEDED'
  | 'ENROLLMENT_CLOSURE_CAMPAIGNS_READ_FAILED'
  | 'ENROLLMENT_CLOSURE_CAMPAIGN_INVALID'

export class EnrollmentClosurePayloadReaderError extends Error {
  constructor(readonly code: EnrollmentClosurePayloadReaderErrorCode) {
    super('Enrollment closure snapshot reading failed.')
    this.name = 'EnrollmentClosurePayloadReaderError'
  }
}

const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const OFFSET_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
const COURSE_RUN_STATUSES = new Set([
  'draft',
  'published',
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'cancelled',
])
const ENROLLMENT_STATUSES = new Set(['open', 'closed', 'scheduled', 'always_open'])
const TRAINING_TYPES = new Set(['private', 'fped', 'cycle', 'other'])
const SESSION_STATUSES = new Set(['scheduled', 'completed', 'cancelled', 'rescheduled'])
const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_SESSIONS = 10_000
const HARD_MAX_SESSIONS = 100_000
const DEFAULT_MAX_CAMPAIGNS = 1_000
const HARD_MAX_CAMPAIGNS = 10_000

export const PAYLOAD_ENROLLMENT_CLOSURE_COURSE_RUN_SELECT = Object.freeze({
  tenant: true,
  training_type: true,
  status: true,
  enrollment_status: true,
  start_date: true,
  enrollment_deadline: true,
  max_students: true,
  current_enrollments: true,
} as const)

export const PAYLOAD_ENROLLMENT_CLOSURE_SESSION_SELECT = Object.freeze({
  tenant: true,
  course_run: true,
  session_date: true,
  time_start: true,
  status: true,
} as const)

/**
 * Reads a single reviewed course-run scope with the current Payload request.
 * It never creates a service user and cannot bypass existing access control.
 * `legalEntityId` comes from the reviewed scope because the legacy schema does
 * not register that field yet.
 */
export function createPayloadEnrollmentClosureSnapshotLoader(
  options: PayloadEnrollmentClosureSnapshotLoaderOptions
): () => Promise<CourseRunEnrollmentClosureInput> {
  const configuration = validatePayloadConfiguration(options)
  return async () => {
    const courseRun = await readCourseRun(options.req, configuration.scope)
    const sessions = await readSessions(options.req, configuration)
    let campaigns: readonly CourseRunEnrollmentClosureCampaign[]
    try {
      campaigns = await options.readCampaigns(configuration.scope)
    } catch {
      throw readerError('ENROLLMENT_CLOSURE_CAMPAIGNS_READ_FAILED')
    }
    validateCampaigns(campaigns, configuration.scope, configuration.maxCampaigns)

    return Object.freeze({
      scope: freezeScope(configuration.scope),
      now: options.now,
      courseRun,
      sessions,
      campaigns: Object.freeze(campaigns.map((campaign) => Object.freeze({ ...campaign }))),
    })
  }
}

/**
 * Reads only campaign identifiers and lifecycle status from the existing Meta
 * draft table. It deliberately does not call `ensureWorkflowTables`, does not
 * read budgets/copy/assets and emits a SELECT-only callback.
 */
export function createMetaAdDraftCampaignReader(
  options: MetaAdDraftCampaignReaderOptions
): EnrollmentClosureCampaignReader {
  if (
    !options ||
    typeof options.execute !== 'function' ||
    !validReviewReference(options.reviewReference)
  ) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION')
  }
  const maxCampaigns = limit(options.maxCampaigns, DEFAULT_MAX_CAMPAIGNS, HARD_MAX_CAMPAIGNS)

  return async (scope) => {
    validateReviewedScope(scope)
    if (scope.reviewReference !== options.reviewReference) {
      throw readerError('ENROLLMENT_CLOSURE_CAMPAIGN_INVALID')
    }
    const tenantId = numericId(scope.tenantId)
    const courseRunId = numericId(scope.courseRunId)
    let result: unknown
    try {
      result = await options.execute(`
        SELECT
          COALESCE(NULLIF(meta_campaign_id, ''), NULLIF(campaign_id, '')) AS campaign_id,
          status,
          updated_at,
          id
        FROM meta_ad_drafts
        WHERE tenant_id = ${tenantId}
          AND convocatoria_id = ${courseRunId}
          AND COALESCE(NULLIF(meta_campaign_id, ''), NULLIF(campaign_id, '')) IS NOT NULL
        ORDER BY updated_at DESC, id DESC
        LIMIT ${maxCampaigns + 1}
      `)
    } catch {
      throw readerError('ENROLLMENT_CLOSURE_CAMPAIGNS_READ_FAILED')
    }
    const rows = asRows(result)
    if (rows.length > maxCampaigns) {
      throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_LIMIT_EXCEEDED')
    }
    const campaigns = new Map<string, CourseRunEnrollmentClosureCampaign>()
    for (const row of rows) {
      const id = validCampaignId(row.campaign_id)
      const status = metaDraftStatus(row.status)
      if (id === null || status === null) {
        throw readerError('ENROLLMENT_CLOSURE_CAMPAIGN_INVALID')
      }
      if (!campaigns.has(id)) {
        campaigns.set(
          id,
          Object.freeze({
            tenantId: scope.tenantId,
            legalEntityId: scope.legalEntityId,
            courseRunId: scope.courseRunId,
            id,
            status,
          })
        )
      }
    }
    return Object.freeze([...campaigns.values()].sort((a, b) => a.id.localeCompare(b.id)))
  }
}

/**
 * Lazily composes the current Payload request and the existing Meta draft
 * reader with the staging-only runner. A closed gate returns before either
 * reader is invoked. This function exposes no write or ad-pause callback.
 */
export function runPayloadEnrollmentClosureShadowObservation(
  options: PayloadEnrollmentClosureShadowRunOptions
): Promise<CourseRunEnrollmentClosureRunnerResult> {
  return runCourseRunEnrollmentClosureShadow({
    environment: options.environment,
    loadSnapshot: async () => {
      const readCampaigns = createMetaAdDraftCampaignReader({
        execute: options.executeMetaRead,
        reviewReference: options.scope.reviewReference,
        maxCampaigns: options.maxCampaigns,
      })
      return createPayloadEnrollmentClosureSnapshotLoader({
        req: options.req,
        scope: options.scope,
        now: options.now,
        readCampaigns,
        pageSize: options.pageSize,
        maxPages: options.maxPages,
        maxSessions: options.maxSessions,
      })()
    },
  })
}

interface ValidatedPayloadConfiguration {
  readonly scope: ReviewedEnrollmentClosureScope
  readonly pageSize: number
  readonly maxPages: number
  readonly maxSessions: number
  readonly maxCampaigns: number
}

async function readCourseRun(
  req: PayloadRequest,
  scope: ReviewedEnrollmentClosureScope
): Promise<CourseRunEnrollmentClosureInput['courseRun']> {
  let response: unknown
  try {
    response = await req.payload.find({
      collection: 'course-runs',
      where: {
        and: [
          { id: { equals: numericId(scope.courseRunId) } },
          { tenant: { equals: numericId(scope.tenantId) } },
        ],
      },
      limit: 2,
      pagination: false,
      sort: 'id',
      depth: 0,
      overrideAccess: false,
      req,
      select: PAYLOAD_ENROLLMENT_CLOSURE_COURSE_RUN_SELECT,
      showHiddenFields: false,
      trash: false,
    } as never)
  } catch {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_READ_FAILED')
  }
  const docs = responseDocs(response)
  if (docs.length !== 1) throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_INVALID')
  const doc = docs[0]!
  const id = relationshipId(doc.id)
  const tenantId = relationshipId(doc.tenant)
  const trainingType = doc.training_type
  const operationalStatus = doc.status
  const enrollmentStatus = doc.enrollment_status
  const startDate = normalizeDateTime(doc.start_date)
  const maxStudents = doc.max_students
  const currentEnrollments = doc.current_enrollments
  const deadline = nullableDateOnly(doc.enrollment_deadline)
  if (
    id !== scope.courseRunId ||
    tenantId !== scope.tenantId ||
    typeof trainingType !== 'string' ||
    !TRAINING_TYPES.has(trainingType) ||
    typeof operationalStatus !== 'string' ||
    !COURSE_RUN_STATUSES.has(operationalStatus) ||
    typeof enrollmentStatus !== 'string' ||
    !ENROLLMENT_STATUSES.has(enrollmentStatus) ||
    startDate === null ||
    !Number.isSafeInteger(maxStudents) ||
    !Number.isSafeInteger(currentEnrollments) ||
    deadline === false
  ) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_INVALID')
  }
  return Object.freeze({
    tenantId: scope.tenantId,
    legalEntityId: scope.legalEntityId,
    courseRunId: scope.courseRunId,
    trainingType: trainingType as CourseRunEnrollmentClosureInput['courseRun']['trainingType'],
    operationalStatus:
      operationalStatus as CourseRunEnrollmentClosureInput['courseRun']['operationalStatus'],
    enrollmentStatus:
      enrollmentStatus as CourseRunEnrollmentClosureInput['courseRun']['enrollmentStatus'],
    startDate,
    maxStudents: Number(maxStudents),
    currentEnrollments: Number(currentEnrollments),
    ...(typeof deadline === 'string' ? { officialEnrollmentDeadline: deadline } : {}),
  })
}

async function readSessions(
  req: PayloadRequest,
  configuration: ValidatedPayloadConfiguration
): Promise<readonly CourseRunEnrollmentClosureSession[]> {
  const sessions: CourseRunEnrollmentClosureSession[] = []
  const ids = new Set<string>()
  let expectedTotalDocs: number | null = null
  let expectedTotalPages: number | null = null
  let pageNumber = 1
  while (true) {
    if (pageNumber > configuration.maxPages) {
      throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_LIMIT_EXCEEDED')
    }
    let response: unknown
    try {
      response = await req.payload.find({
        collection: 'course-run-sessions',
        where: {
          and: [
            { course_run: { equals: numericId(configuration.scope.courseRunId) } },
            { tenant: { equals: numericId(configuration.scope.tenantId) } },
          ],
        },
        page: pageNumber,
        limit: configuration.pageSize,
        pagination: true,
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req,
        select: PAYLOAD_ENROLLMENT_CLOSURE_SESSION_SELECT,
        showHiddenFields: false,
        trash: false,
      } as never)
    } catch {
      throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_SESSIONS_READ_FAILED')
    }
    const page = normalizePage(response, pageNumber, configuration.pageSize)
    if (page.totalDocs > configuration.maxSessions || page.totalPages > configuration.maxPages) {
      throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_LIMIT_EXCEEDED')
    }
    if (expectedTotalDocs === null) {
      expectedTotalDocs = page.totalDocs
      expectedTotalPages = page.totalPages
    } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
      throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_PAGINATION_CHANGED')
    }
    for (const doc of page.docs) {
      const session = projectSession(doc, configuration.scope)
      if (ids.has(session.id)) throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_SESSION_INVALID')
      ids.add(session.id)
      sessions.push(session)
    }
    if (!page.hasNextPage) break
    pageNumber += 1
  }
  if (expectedTotalDocs === null || sessions.length !== expectedTotalDocs) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_PAGINATION_CHANGED')
  }
  return Object.freeze(sessions.sort((a, b) => a.id.localeCompare(b.id)))
}

function projectSession(
  doc: Readonly<Record<string, unknown>>,
  scope: ReviewedEnrollmentClosureScope
): CourseRunEnrollmentClosureSession {
  const id = relationshipId(doc.id)
  const tenantId = relationshipId(doc.tenant)
  const courseRunId = relationshipId(doc.course_run)
  const date = dateOnly(doc.session_date)
  const time = doc.time_start
  const status = doc.status
  const startsAt =
    date && typeof time === 'string' && TIME_PATTERN.test(time) ? madridDateTime(date, time) : null
  if (
    id === null ||
    tenantId !== scope.tenantId ||
    courseRunId !== scope.courseRunId ||
    startsAt === null ||
    typeof status !== 'string' ||
    !SESSION_STATUSES.has(status)
  ) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_SESSION_INVALID')
  }
  return Object.freeze({
    tenantId: scope.tenantId,
    legalEntityId: scope.legalEntityId,
    courseRunId: scope.courseRunId,
    id,
    startsAt,
    status: status as CourseRunEnrollmentClosureSession['status'],
  })
}

function validatePayloadConfiguration(
  options: PayloadEnrollmentClosureSnapshotLoaderOptions
): ValidatedPayloadConfiguration {
  if (
    !validPayloadRequest(options?.req) ||
    !options.req.user ||
    !validReviewedScope(options.scope) ||
    !validOffsetDateTime(options.now) ||
    typeof options.readCampaigns !== 'function'
  ) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION')
  }
  return Object.freeze({
    scope: Object.freeze({ ...options.scope }),
    pageSize: limit(options.pageSize, DEFAULT_PAGE_SIZE, HARD_MAX_PAGE_SIZE),
    maxPages: limit(options.maxPages, DEFAULT_MAX_PAGES, HARD_MAX_PAGES),
    maxSessions: limit(options.maxSessions, DEFAULT_MAX_SESSIONS, HARD_MAX_SESSIONS),
    maxCampaigns: DEFAULT_MAX_CAMPAIGNS,
  })
}

function validateCampaigns(
  campaigns: readonly CourseRunEnrollmentClosureCampaign[],
  scope: ReviewedEnrollmentClosureScope,
  maxCampaigns: number
): void {
  if (
    !Array.isArray(campaigns) ||
    campaigns.length > maxCampaigns ||
    new Set(campaigns.map((campaign) => campaign.id)).size !== campaigns.length ||
    campaigns.some(
      (campaign) =>
        !campaign ||
        !validCampaignId(campaign.id) ||
        campaign.tenantId !== scope.tenantId ||
        campaign.legalEntityId !== scope.legalEntityId ||
        campaign.courseRunId !== scope.courseRunId ||
        !['draft', 'active', 'paused', 'completed', 'archived'].includes(campaign.status)
    )
  ) {
    throw readerError('ENROLLMENT_CLOSURE_CAMPAIGN_INVALID')
  }
}

interface PayloadPage {
  readonly docs: readonly Readonly<Record<string, unknown>>[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
}

function normalizePage(value: unknown, requestedPage: number, pageSize: number): PayloadPage {
  if (!isRecord(value)) throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_SESSION_INVALID')
  const page = value as Partial<Record<keyof PayloadPage, unknown>>
  if (
    !Array.isArray(page.docs) ||
    !page.docs.every(isRecord) ||
    page.docs.length > pageSize ||
    !positiveInteger(page.page) ||
    page.page !== requestedPage ||
    !nonNegativeInteger(page.totalDocs) ||
    !nonNegativeInteger(page.totalPages) ||
    typeof page.hasNextPage !== 'boolean'
  ) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_SESSION_INVALID')
  }
  return page as unknown as PayloadPage
}

function responseDocs(value: unknown): readonly Readonly<Record<string, unknown>>[] {
  if (!isRecord(value) || !Array.isArray(value.docs) || !value.docs.every(isRecord)) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_COURSE_RUN_INVALID')
  }
  return value.docs
}

function madridDateTime(date: string, time: string): string | null {
  const anchor = new Date(`${date}T12:00:00Z`)
  if (!Number.isFinite(anchor.getTime())) return null
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: COURSE_RUN_ENROLLMENT_TIME_ZONE,
    timeZoneName: 'longOffset',
    hour: '2-digit',
  })
    .formatToParts(anchor)
    .find((part) => part.type === 'timeZoneName')?.value
  const match = name?.match(/^GMT([+-])(\d{2}):(\d{2})$/)
  if (!match) return null
  const value = `${date}T${time}${match[1]}${match[2]}:${match[3]}`
  return validOffsetDateTime(value) ? value : null
}

function normalizeDateTime(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (validOffsetDateTime(value)) return value
  const date = dateOnly(value)
  return date ? madridDateTime(date, '00:00:00') : null
}

function nullableDateOnly(value: unknown): string | null | false {
  if (value === null || value === undefined || value === '') return null
  return dateOnly(value) ?? false
}

function dateOnly(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const candidate = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null
  const parsed = new Date(`${candidate}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate
    ? candidate
    : null
}

function metaDraftStatus(value: unknown): CourseRunEnrollmentClosureCampaign['status'] | null {
  if (value === 'active') return 'active'
  if (value === 'meta_paused') return 'paused'
  if (value === 'ended') return 'completed'
  if (value === 'draft' || value === 'review' || value === 'error') return 'draft'
  return null
}

function asRows(value: unknown): readonly Readonly<Record<string, unknown>>[] {
  if (Array.isArray(value) && value.every(isRecord)) return value
  if (isRecord(value) && Array.isArray(value.rows) && value.rows.every(isRecord)) return value.rows
  throw readerError('ENROLLMENT_CLOSURE_CAMPAIGNS_READ_FAILED')
}

function relationshipId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value)
  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) return value
  if (isRecord(value)) return relationshipId(value.id)
  return null
}

function numericId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION')
  }
  const id = Number(value)
  if (!Number.isSafeInteger(id)) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION')
  }
  return id
}

function validReviewedScope(value: ReviewedEnrollmentClosureScope): boolean {
  return (
    !!value &&
    /^[1-9]\d*$/.test(value.tenantId) &&
    /^[1-9]\d*$/.test(value.courseRunId) &&
    validIdentifier(value.legalEntityId) &&
    validReviewReference(value.reviewReference)
  )
}

function validateReviewedScope(value: ReviewedEnrollmentClosureScope): void {
  if (!validReviewedScope(value)) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION')
  }
}

function freezeScope(scope: ReviewedEnrollmentClosureScope): CourseRunEnrollmentClosureScope {
  return Object.freeze({
    tenantId: scope.tenantId,
    legalEntityId: scope.legalEntityId,
    courseRunId: scope.courseRunId,
  })
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  if (!isRecord(value) || !isRecord(value.payload)) return false
  return typeof value.payload.find === 'function'
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function validOffsetDateTime(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    OFFSET_DATE_TIME_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validCampaignId(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null
}

function limit(value: number | undefined, fallback: number, hardMax: number): number {
  const result = value ?? fallback
  if (!Number.isSafeInteger(result) || result <= 0 || result > hardMax) {
    throw readerError('ENROLLMENT_CLOSURE_PAYLOAD_INVALID_CONFIGURATION')
  }
  return result
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function isRecord(value: unknown): value is Readonly<Record<string, any>> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readerError(
  code: EnrollmentClosurePayloadReaderErrorCode
): EnrollmentClosurePayloadReaderError {
  return new EnrollmentClosurePayloadReaderError(code)
}
