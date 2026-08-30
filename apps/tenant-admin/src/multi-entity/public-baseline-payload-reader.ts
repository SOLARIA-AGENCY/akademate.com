import type { PayloadRequest } from 'payload'
import type { CurrentPublicProjectionBaseline } from '../../../../packages/tenant/src/multi-entity-public-projection-runner'

export const WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS = Object.freeze({
  courses: 200,
  cycles: 50,
  campuses: 20,
  courseRuns: 50,
} as const)

export const WEBSITE_RENDERER_PUBLIC_COURSE_SELECT = Object.freeze({
  slug: true,
} as const)

export const WEBSITE_RENDERER_PUBLIC_CYCLE_SELECT = Object.freeze({
  slug: true,
} as const)

export const WEBSITE_RENDERER_PUBLIC_CAMPUS_SELECT = Object.freeze({
  slug: true,
} as const)

export const WEBSITE_RENDERER_PUBLIC_RUN_SELECT = Object.freeze({
  codigo: true,
} as const)

export interface WebsiteRendererPublicBaselineReaderOptions {
  readonly req: PayloadRequest
  readonly targetTenantId: string
}

export type WebsiteRendererPublicBaselineReaderErrorCode =
  | 'WEBSITE_RENDERER_BASELINE_INVALID_CONFIGURATION'
  | 'WEBSITE_RENDERER_BASELINE_READ_FAILED'
  | 'WEBSITE_RENDERER_BASELINE_INVALID_RESPONSE'
  | 'WEBSITE_RENDERER_BASELINE_RECORD_LIMIT_EXCEEDED'
  | 'WEBSITE_RENDERER_BASELINE_PUBLIC_FIELD_INVALID'
  | 'WEBSITE_RENDERER_BASELINE_DUPLICATE_PUBLIC_VALUE'

export class WebsiteRendererPublicBaselineReaderError extends Error {
  constructor(readonly code: WebsiteRendererPublicBaselineReaderErrorCode) {
    super('Website renderer public baseline reading failed.')
    this.name = 'WebsiteRendererPublicBaselineReaderError'
  }
}

type BaselineCollection = 'courses' | 'cycles' | 'campuses' | 'course-runs'

interface BaselineSurface {
  readonly collection: BaselineCollection
  readonly limit: number
  readonly sort: 'name' | 'start_date'
  readonly select: Readonly<Record<string, true>>
  readonly where: Readonly<Record<string, unknown>>
  readonly value: (doc: Readonly<Record<string, unknown>>) => string
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RUN_SLUG_PATTERN = /^[A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*$/

/**
 * Captures the four canonical public catalog surfaces used today by the CEP
 * website. This adapter is read-only, request-scoped and deliberately not
 * registered in any route, job or Payload hook.
 */
export function createWebsiteRendererPublicBaselineLoader(
  options: WebsiteRendererPublicBaselineReaderOptions
): () => Promise<CurrentPublicProjectionBaseline> {
  const tenantId = validateConfiguration(options)
  const tenantWhere = { tenant: { equals: tenantId } }
  const surfaces: readonly BaselineSurface[] = Object.freeze([
    {
      collection: 'courses',
      limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.courses,
      sort: 'name',
      select: WEBSITE_RENDERER_PUBLIC_COURSE_SELECT,
      where: {
        and: [
          tenantWhere,
          { active: { equals: true } },
          { course_type: { not_in: ['ciclo_medio', 'ciclo_superior'] } },
        ],
      },
      value: (doc) => publicSlug(doc.slug, SLUG_PATTERN, 500),
    },
    {
      collection: 'cycles',
      limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.cycles,
      sort: 'name',
      select: WEBSITE_RENDERER_PUBLIC_CYCLE_SELECT,
      where: { and: [tenantWhere, { active: { equals: true } }] },
      value: (doc) => publicSlug(doc.slug, SLUG_PATTERN, 500),
    },
    {
      collection: 'campuses',
      limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.campuses,
      sort: 'name',
      select: WEBSITE_RENDERER_PUBLIC_CAMPUS_SELECT,
      where: { and: [tenantWhere, { active: { equals: true } }] },
      value: (doc) => publicSlug(doc.slug, SLUG_PATTERN, 500),
    },
    {
      collection: 'course-runs',
      limit: WEBSITE_RENDERER_PUBLIC_BASELINE_LIMITS.courseRuns,
      sort: 'start_date',
      select: WEBSITE_RENDERER_PUBLIC_RUN_SELECT,
      where: {
        and: [tenantWhere, { status: { in: ['enrollment_open', 'published'] } }],
      },
      value: (doc) => publicSlug(doc.codigo ?? doc.id, RUN_SLUG_PATTERN, 255),
    },
  ])

  return async () => {
    const [courseSlugs, cycleSlugs, campusSlugs, runSlugs] = await readSequentially(
      options.req,
      surfaces
    )
    return Object.freeze({ courseSlugs, cycleSlugs, campusSlugs, runSlugs })
  }
}

async function readSequentially(
  req: PayloadRequest,
  surfaces: readonly BaselineSurface[]
): Promise<readonly (readonly string[])[]> {
  const result: (readonly string[])[] = []
  for (const surface of surfaces) result.push(await readSurface(req, surface))
  return Object.freeze(result)
}

async function readSurface(
  req: PayloadRequest,
  surface: BaselineSurface
): Promise<readonly string[]> {
  let response: unknown
  try {
    response = await req.payload.find({
      collection: surface.collection,
      where: surface.where,
      page: 1,
      limit: surface.limit,
      pagination: true,
      sort: surface.sort,
      depth: 0,
      overrideAccess: false,
      req,
      select: surface.select,
      showHiddenFields: false,
      trash: false,
    } as never)
  } catch {
    throw readerError('WEBSITE_RENDERER_BASELINE_READ_FAILED')
  }

  const docs = normalizeDocs(response, surface.limit)
  const seen = new Set<string>()
  const values = docs.map((doc) => {
    const value = surface.value(doc)
    if (seen.has(value)) {
      throw readerError('WEBSITE_RENDERER_BASELINE_DUPLICATE_PUBLIC_VALUE')
    }
    seen.add(value)
    return value
  })
  return Object.freeze(values)
}

function normalizeDocs(
  response: unknown,
  limit: number
): readonly Readonly<Record<string, unknown>>[] {
  if (!isRecord(response) || !Array.isArray(response.docs) || !response.docs.every(isRecord)) {
    throw readerError('WEBSITE_RENDERER_BASELINE_INVALID_RESPONSE')
  }
  if (response.docs.length > limit) {
    throw readerError('WEBSITE_RENDERER_BASELINE_RECORD_LIMIT_EXCEEDED')
  }
  return response.docs
}

function validateConfiguration(options: WebsiteRendererPublicBaselineReaderOptions): number {
  if (!validPayloadRequest(options?.req) || !/^[1-9]\d*$/.test(options.targetTenantId)) {
    throw readerError('WEBSITE_RENDERER_BASELINE_INVALID_CONFIGURATION')
  }
  const tenantId = Number(options.targetTenantId)
  if (!Number.isSafeInteger(tenantId)) {
    throw readerError('WEBSITE_RENDERER_BASELINE_INVALID_CONFIGURATION')
  }
  return tenantId
}

function publicSlug(value: unknown, pattern: RegExp, maxLength: number): string {
  const normalized =
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? String(value) : value
  if (
    typeof normalized !== 'string' ||
    normalized.length === 0 ||
    normalized.length > maxLength ||
    !pattern.test(normalized)
  ) {
    throw readerError('WEBSITE_RENDERER_BASELINE_PUBLIC_FIELD_INVALID')
  }
  return normalized
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  if (!isRecord(value) || !isRecord(value.payload)) return false
  return typeof value.payload.find === 'function'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readerError(
  code: WebsiteRendererPublicBaselineReaderErrorCode
): WebsiteRendererPublicBaselineReaderError {
  return new WebsiteRendererPublicBaselineReaderError(code)
}
