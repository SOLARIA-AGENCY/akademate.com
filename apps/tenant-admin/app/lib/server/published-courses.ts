import 'server-only'

import { getPayload, type Payload } from 'payload'
import configPromise from '@payload-config'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import {
  getPublicStudyTypeFallbackImage,
  isPublicStudyType,
  normalizePublicStudyType,
  normalizeStudyType,
  PUBLIC_STUDY_TYPE_CODES,
  PUBLIC_STUDY_TYPE_COURSE_TYPE_VALUES,
  type PublicStudyType,
} from '@/app/lib/website/study-types'

type CourseDoc = {
  id: number | string
  codigo?: string | null
  slug?: string | null
  name?: string | null
  title?: string | null
  course_type?: string | null
  short_description?: string | null
  description?: string | null
  long_description?: unknown
  duration_hours?: number | null
  base_price?: number | null
  subsidy_percentage?: number | null
  active?: boolean | null
  featured?: boolean | null
  area_formativa?: { nombre?: string | null } | number | null
  featured_image?: { url?: string | null; filename?: string | null } | number | null
  image?: { url?: string | null; filename?: string | null } | number | null
  createdAt?: string
  updatedAt?: string
}

type CourseTypeDoc = {
  id: number | string
  name?: string | null
  code?: string | null
  color?: string | null
  active?: boolean | null
}

export type StudyTypeVisualMeta = {
  code: string
  label: string
  color: string
}

export type PublishedCourse = {
  id: string
  codigo: string
  slug: string
  nombre: string
  tipo: string
  studyType: PublicStudyType | null
  studyTypeLabel: string
  studyTypeColor: string
  descripcion: string
  area: string
  duracionReferencia: number
  precioReferencia: number
  porcentajeSubvencion: number
  imagenPortada: string
  totalConvocatorias: number
  active: boolean
  featured: boolean
  created_at: string | null
  updated_at: string | null
}

export const DEFAULT_STUDY_TYPE_VISUALS: Record<PublicStudyType, StudyTypeVisualMeta> = {
  privados: { code: PUBLIC_STUDY_TYPE_CODES.privados, label: 'Privados', color: '#E3003A' },
  desempleados: { code: PUBLIC_STUDY_TYPE_CODES.desempleados, label: 'Desempleados', color: '#2563EB' },
  ocupados: { code: PUBLIC_STUDY_TYPE_CODES.ocupados, label: 'Ocupados', color: '#22C55E' },
  teleformacion: { code: PUBLIC_STUDY_TYPE_CODES.teleformacion, label: 'Teleformación', color: '#F97316' },
}

type GetPublishedCoursesOptions = {
  payload?: Payload
  tenantId?: string | number | null
  studyType?: string | null
  includeInactive?: boolean
  includeCycles?: boolean
  limit?: number
  sort?: string
}

function isValidHexColor(color: string | null | undefined): color is string {
  if (!color) return false
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

function toAreaName(area: CourseDoc['area_formativa']): string {
  if (typeof area === 'object' && area && area.nombre) return area.nombre
  return 'Sin área'
}

function resolveMediaImageUrl(image: CourseDoc['featured_image'] | CourseDoc['image']): string | null {
  if (!image || typeof image !== 'object') return null
  if (image.url) return image.url
  if (image.filename) return `/media/${image.filename}`
  return null
}

function buildPublicFilters({
  includeInactive,
  includeCycles,
  studyType,
}: {
  includeInactive: boolean
  includeCycles: boolean
  studyType?: string | null
}): Record<string, unknown>[] {
  const filters: Record<string, unknown>[] = []

  if (!includeInactive) {
    filters.push({ active: { equals: true } })
  }

  if (!includeCycles) {
    filters.push({
      course_type: {
        not_in: ['ciclo_medio', 'ciclo_superior'],
      },
    })
  }

  const normalizedStudyType = normalizePublicStudyType(studyType)
  if (normalizedStudyType) {
    filters.push({
      course_type: {
        in: PUBLIC_STUDY_TYPE_COURSE_TYPE_VALUES[normalizedStudyType],
      },
    })
  }

  return filters
}

function toPublicWhere({
  tenantId,
  includeInactive,
  includeCycles,
  studyType,
}: {
  tenantId?: string | number | null
  includeInactive: boolean
  includeCycles: boolean
  studyType?: string | null
}) {
  const filters = buildPublicFilters({
    includeInactive,
    includeCycles,
    studyType,
  })
  const where = filters.length > 0 ? { and: filters } : {}
  return withTenantScope(where as Record<string, unknown>, tenantId)
}

function mapCourseDocToPublishedCourse(
  course: CourseDoc,
  studyTypeMap: Record<PublicStudyType, StudyTypeVisualMeta>
): PublishedCourse {
  const normalizedStudyType = normalizePublicStudyType(String(course.course_type || ''))
  const visual = normalizedStudyType ? studyTypeMap[normalizedStudyType] : null
  const imageUrl =
    resolveMediaImageUrl(course.featured_image) ??
    resolveMediaImageUrl(course.image) ??
    getPublicStudyTypeFallbackImage(course.course_type)

  return {
    id: String(course.id),
    codigo: String(course.codigo || ''),
    slug: String(course.slug || ''),
    nombre: String(course.name || course.title || 'Curso sin nombre'),
    tipo: String(course.course_type || ''),
    studyType: normalizedStudyType,
    studyTypeLabel: visual?.label || 'Sin tipo',
    studyTypeColor: visual?.color || '#64748B',
    descripcion:
      String(course.short_description || course.description || '').trim() ||
      'Curso de formación profesional',
    area: toAreaName(course.area_formativa),
    duracionReferencia: Number(course.duration_hours || 0),
    precioReferencia: Number(course.base_price || 0),
    porcentajeSubvencion: Number(course.subsidy_percentage || 100),
    imagenPortada: imageUrl,
    totalConvocatorias: 0,
    active: Boolean(course.active),
    featured: Boolean(course.featured),
    created_at: course.createdAt ?? null,
    updated_at: course.updatedAt ?? null,
  }
}

export function getStudyTypeColor(
  studyType: PublicStudyType | null | undefined,
  visualMap: Record<PublicStudyType, StudyTypeVisualMeta> = DEFAULT_STUDY_TYPE_VISUALS
): string {
  if (!studyType) return '#64748B'
  return visualMap[studyType]?.color || '#64748B'
}

export async function getStudyTypeVisualMap(payloadClient?: Payload): Promise<Record<PublicStudyType, StudyTypeVisualMeta>> {
  const payload = payloadClient ?? (await getPayload({ config: configPromise }))
  const payloadAny = payload as any

  let docs: CourseTypeDoc[] = []
  try {
    const response = await payloadAny.find({
      collection: 'course-types',
      where: { active: { equals: true } },
      limit: 100,
      sort: 'name',
      depth: 0,
    })
    docs = (response.docs ?? []) as CourseTypeDoc[]
  } catch {
    return { ...DEFAULT_STUDY_TYPE_VISUALS }
  }

  const map: Record<PublicStudyType, StudyTypeVisualMeta> = { ...DEFAULT_STUDY_TYPE_VISUALS }

  for (const doc of docs) {
    const rawCode = String(doc.code ?? '').trim()
    const rawName = String(doc.name ?? '').trim()
    const normalized = normalizeStudyType(rawCode) ?? normalizeStudyType(rawName)
    if (!isPublicStudyType(normalized)) continue

    map[normalized] = {
      code: rawCode || map[normalized].code,
      label: rawName || map[normalized].label,
      color: isValidHexColor(doc.color) ? doc.color : map[normalized].color,
    }
  }

  return map
}

export async function getPublishedCourses(options: GetPublishedCoursesOptions = {}): Promise<PublishedCourse[]> {
  const payload = options.payload ?? (await getPayload({ config: configPromise }))
  const includeInactive = options.includeInactive ?? false
  const includeCycles = options.includeCycles ?? false
  const maxRecords = Math.max(1, options.limit ?? 1000)
  const sort = options.sort ?? '-createdAt'
  const where = toPublicWhere({
    tenantId: options.tenantId,
    includeInactive,
    includeCycles,
    studyType: options.studyType,
  })

  const docs: CourseDoc[] = []
  let hasNextPage = true
  let page = 1
  const pageSize = 100

  while (hasNextPage && docs.length < maxRecords && page < 50) {
    const result = await payload.find({
      collection: 'courses',
      where: where as any,
      page,
      limit: Math.min(pageSize, maxRecords - docs.length),
      depth: 1,
      sort,
    })

    docs.push(...((result.docs ?? []) as CourseDoc[]))
    hasNextPage = Boolean(result.hasNextPage)
    page += 1
  }

  const studyTypeMap = await getStudyTypeVisualMap(payload)
  return docs.map((course) => mapCourseDocToPublishedCourse(course, studyTypeMap))
}

type GetPublishedCourseBySlugOptions = {
  slug: string
  payload?: Payload
  tenantId?: string | number | null
  includeInactive?: boolean
  includeCycles?: boolean
}

export async function getPublishedCourseBySlug(
  options: GetPublishedCourseBySlugOptions
): Promise<PublishedCourse | null> {
  const slug = String(options.slug || '').trim()
  if (!slug) return null

  const payload = options.payload ?? (await getPayload({ config: configPromise }))
  const includeInactive = options.includeInactive ?? false
  const includeCycles = options.includeCycles ?? false
  const filters = buildPublicFilters({
    includeInactive,
    includeCycles,
  })
  filters.push({ slug: { equals: slug } })

  const where = withTenantScope(
    { and: filters } as Record<string, unknown>,
    options.tenantId
  )

  const result = await payload.find({
    collection: 'courses',
    where: where as any,
    limit: 1,
    depth: 1,
    sort: '-createdAt',
  })

  const course = (result.docs?.[0] ?? null) as CourseDoc | null
  if (!course) return null

  const studyTypeMap = await getStudyTypeVisualMap(payload)
  return mapCourseDocToPublishedCourse(course, studyTypeMap)
}
