import { z } from 'zod'

import type {
  LearningSqlClient,
  NextLearningPrincipal,
} from '../learning/next-learning-transaction.ts'

const MANAGER_ROLES = new Set(['superadmin', 'admin', 'gestor', 'marketing'])
const REVIEWER_ROLES = new Set(['superadmin', 'admin', 'gestor'])
const STATUSES = [
  'all',
  'new',
  'pending_review',
  'pending_registration',
  'approved',
  'rejected',
  'archived',
] as const
const KINDS = ['all', 'interest', 'application', 'registration_request'] as const
const PAGE_SIZES = new Set([10, 25, 50])
const ALLOWED_QUERY_KEYS = new Set(['status', 'kind', 'page', 'pageSize', 'search'])

export type OfferSubmissionStatus = Exclude<(typeof STATUSES)[number], 'all'>
export type OfferSubmissionKind = Exclude<(typeof KINDS)[number], 'all'>

export type OfferSubmissionInboxQuery = {
  status: (typeof STATUSES)[number]
  kind: (typeof KINDS)[number]
  page: number
  pageSize: number
  search: string
}

export type OfferSubmissionInboxItem = {
  id: number
  courseRunId: number
  courseName: string
  courseRunCode: string
  kind: OfferSubmissionKind
  status: OfferSubmissionStatus
  firstName: string
  lastName: string
  email: string
  phone: string | null
  message: string | null
  privacyNoticeVersion: string
  marketingConsent: boolean
  sourceHost: string
  sourceSlug: string
  createdAt: string
  enrollmentId: number | null
  enrollmentStatus: 'pending' | 'confirmed' | 'waitlisted' | 'completed' | 'cancelled' | 'withdrawn' | null
}

export type OfferSubmissionInboxResult = {
  items: OfferSubmissionInboxItem[]
  canReview: boolean
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type SubmissionRow = {
  id: number | string
  course_run_id: number | string
  course_name: string
  course_run_code: string
  submission_kind: string
  status: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  message: string | null
  privacy_notice_version: string
  marketing_consent: boolean
  source_host: string
  source_slug: string
  created_at: string | Date
  enrollment_id: number | string | null
  enrollment_status: string | null
  total_count: number | string
}

const persistedRowSchema = z.object({
  id: z.coerce.number().int().positive(),
  course_run_id: z.coerce.number().int().positive(),
  course_name: z.string().min(1).max(240),
  course_run_code: z.string().min(1).max(120),
  submission_kind: z.enum(['interest', 'application', 'registration_request']),
  status: z.enum(['new', 'pending_review', 'pending_registration', 'approved', 'rejected', 'archived']),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(120),
  email: z.email().max(254),
  phone: z.string().min(4).max(32).nullable(),
  message: z.string().max(1000).nullable(),
  privacy_notice_version: z.string().min(3).max(64),
  marketing_consent: z.boolean(),
  source_host: z.string().min(1).max(253),
  source_slug: z.string().min(3).max(160),
  created_at: z.union([z.string(), z.date()]),
  enrollment_id: z.coerce.number().int().positive().nullable(),
  enrollment_status: z.enum(['pending', 'confirmed', 'waitlisted', 'completed', 'cancelled', 'withdrawn']).nullable(),
  total_count: z.coerce.number().int().nonnegative(),
}).strict()

const totalRowSchema = z.object({
  total_count: z.coerce.number().int().nonnegative(),
}).strict()

export class NextOfferSubmissionInboxError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextOfferSubmissionInboxError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextOfferSubmissionInboxError(code)
}

function parseCanonicalPositiveInteger(value: string, fallback: number): number {
  const normalized = value || String(fallback)
  if (!/^[1-9]\d{0,3}$/.test(normalized)) fail('submission_query_invalid')
  const parsed = Number(normalized)
  if (!Number.isSafeInteger(parsed)) fail('submission_query_invalid')
  return parsed
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

export function parseOfferSubmissionInboxQuery(params: URLSearchParams): OfferSubmissionInboxQuery {
  for (const key of params.keys()) {
    if (!ALLOWED_QUERY_KEYS.has(key) || params.getAll(key).length !== 1) {
      fail('submission_query_invalid')
    }
  }

  const status = params.get('status') || 'all'
  const kind = params.get('kind') || 'all'
  const page = parseCanonicalPositiveInteger(params.get('page') || '', 1)
  const pageSize = parseCanonicalPositiveInteger(params.get('pageSize') || '', 25)
  const search = (params.get('search') || '').trim()

  if (!STATUSES.includes(status as (typeof STATUSES)[number])) fail('submission_query_invalid')
  if (!KINDS.includes(kind as (typeof KINDS)[number])) fail('submission_query_invalid')
  if (!PAGE_SIZES.has(pageSize) || search.length > 80 || /[\u0000-\u001f\u007f]/.test(search)) {
    fail('submission_query_invalid')
  }

  return {
    status: status as OfferSubmissionInboxQuery['status'],
    kind: kind as OfferSubmissionInboxQuery['kind'],
    page,
    pageSize,
    search,
  }
}

function mapRow(raw: SubmissionRow): OfferSubmissionInboxItem & { total: number } {
  const parsed = persistedRowSchema.safeParse(raw)
  if (!parsed.success) fail('submission_persistence_invalid')
  const row = parsed.data
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at)
  if (!Number.isFinite(createdAt.getTime())) fail('submission_persistence_invalid')
  return {
    id: row.id,
    courseRunId: row.course_run_id,
    courseName: row.course_name,
    courseRunCode: row.course_run_code,
    kind: row.submission_kind,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    privacyNoticeVersion: row.privacy_notice_version,
    marketingConsent: row.marketing_consent,
    sourceHost: row.source_host,
    sourceSlug: row.source_slug,
    createdAt: createdAt.toISOString(),
    enrollmentId: row.enrollment_id,
    enrollmentStatus: row.enrollment_status,
    total: row.total_count,
  }
}

export async function listNextOfferSubmissions({
  tx,
  principal,
  query,
}: {
  tx: LearningSqlClient
  principal: NextLearningPrincipal
  query: OfferSubmissionInboxQuery
}): Promise<OfferSubmissionInboxResult> {
  if (!MANAGER_ROLES.has(principal.platformRole)) fail('submission_inbox_forbidden')

  const offset = (query.page - 1) * query.pageSize
  if (!Number.isSafeInteger(offset)) fail('submission_query_invalid')
  const searchPattern = query.search
    ? `%${escapeLikePattern(query.search.toLocaleLowerCase('en-US'))}%`
    : ''
  const rows = await tx.unsafe<SubmissionRow>(`
    SELECT
      os.id,
      os.course_run_id,
      c.name AS course_name,
      cr.codigo AS course_run_code,
      os.submission_kind,
      os.status,
      os.first_name,
      os.last_name,
      os.email,
      os.phone,
      os.message,
      os.privacy_notice_version,
      os.marketing_consent,
      os.source_host,
      os.source_slug,
      os.created_at,
      enrollment.id AS enrollment_id,
      enrollment.status::text AS enrollment_status,
      count(*) OVER() AS total_count
    FROM offer_submissions os
    INNER JOIN course_runs cr
      ON cr.id = os.course_run_id
      AND cr.tenant_id = os.tenant_id
    INNER JOIN courses c
      ON c.id = cr.course_id
      AND c.tenant_id = os.tenant_id
    LEFT JOIN enrollments enrollment
      ON enrollment.tenant_id = os.tenant_id
      AND enrollment.offer_submission_id = os.id
    WHERE os.tenant_id = $1
      AND ($2::varchar = 'all' OR os.status = $2)
      AND ($3::varchar = 'all' OR os.submission_kind = $3)
      AND (
        $4::varchar = ''
        OR lower(concat_ws(' ', os.first_name, os.last_name, os.email, c.name, cr.codigo)) LIKE $4 ESCAPE '\\'
      )
    ORDER BY os.created_at DESC, os.id DESC
    LIMIT $5 OFFSET $6
  `, [
    principal.tenantId,
    query.status,
    query.kind,
    searchPattern,
    query.pageSize,
    offset,
  ])

  const mapped = rows.map(mapRow)
  let total = mapped[0]?.total
  if (total === undefined) {
    const countRows = await tx.unsafe<{ total_count: number | string }>(`SELECT count(*)::integer AS total_count
    FROM offer_submissions os
    INNER JOIN course_runs cr
      ON cr.id = os.course_run_id
      AND cr.tenant_id = os.tenant_id
    INNER JOIN courses c
      ON c.id = cr.course_id
      AND c.tenant_id = os.tenant_id
    WHERE os.tenant_id = $1
      AND ($2::varchar = 'all' OR os.status = $2)
      AND ($3::varchar = 'all' OR os.submission_kind = $3)
      AND (
        $4::varchar = ''
        OR lower(concat_ws(' ', os.first_name, os.last_name, os.email, c.name, cr.codigo)) LIKE $4 ESCAPE '\\'
      )
  `, [principal.tenantId, query.status, query.kind, searchPattern])
    const parsedTotal = totalRowSchema.safeParse(countRows[0])
    if (!parsedTotal.success || countRows.length !== 1) fail('submission_persistence_invalid')
    total = parsedTotal.data.total_count
  }
  return {
    items: mapped.map(({ total: _total, ...item }) => item),
    canReview: REVIEWER_ROLES.has(principal.platformRole),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
  }
}
