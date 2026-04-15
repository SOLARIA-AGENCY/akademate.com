import 'server-only'

import { getPayload, type Payload } from 'payload'
import configPromise from '@payload-config'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { normalizeStudyType, type NormalizedStudyType } from '@/app/lib/website/study-types'

type PublicStudyType = Exclude<NormalizedStudyType, 'ciclo_medio' | 'ciclo_superior'>

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
  privados: { code: 'PRIV', label: 'Privados', color: '#E3003A' },
  desempleados: { code: 'DES', label: 'Desempleados', color: '#2563EB' },
  ocupados: { code: 'OCU', label: 'Ocupados', color: '#22C55E' },
  teleformacion: { code: 'TEL', label: 'Teleformación', color: '#F97316' },
}

const STUDY_TYPE_TO_COURSE_TYPE_VALUES: Record<PublicStudyType, string[]> = {
  privados: ['privado', 'privados'],
  desempleados: ['desempleados', 'desempleado'],
  ocupados: ['ocupados', 'ocupado'],
  teleformacion: ['teleformacion', 'tele_formacion', 'tele'],
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

function isPublicStudyType(value: NormalizedStudyType | null): value is PublicStudyType {
  return Boolean(
    value &&
      value !== 'ciclo_medio' &&
      value !== 'ciclo_superior' &&
      value in DEFAULT_STUDY_TYPE_VISUALS
  )
}

function isValidHexColor(color: string | null | undefined): color is string {
  if (!color) return false
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

function resolveImageUrl(image: CourseDoc['featured_image'] | CourseDoc['image']): string | null {
  if (!image || typeof image === 'number') return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

function toAreaName(area: CourseDoc['area_formativa']): string {
  if (typeof area === 'object' && area && area.nombre) return area.nombre
  return 'Sin área'
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

  const normalizedStudyType = normalizeStudyType(studyType)
  if (isPublicStudyType(normalizedStudyType)) {
    filters.push({
      course_type: {
        in: STUDY_TYPE_TO_COURSE_TYPE_VALUES[normalizedStudyType],
      },
    })
  }

  const where = filters.length > 0 ? { and: filters } : {}
  return withTenantScope(where as Record<string, unknown>, tenantId)
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

  return docs.map((course) => {
    const normalizedStudyType = normalizeStudyType(String(course.course_type || ''))
    const publicStudyType = isPublicStudyType(normalizedStudyType) ? normalizedStudyType : null
    const visual = publicStudyType ? studyTypeMap[publicStudyType] : null
    const imageUrl =
      resolveImageUrl(course.featured_image) ||
      resolveImageUrl(course.image) ||
      '/placeholder-course.svg'

    return {
      id: String(course.id),
      codigo: String(course.codigo || ''),
      slug: String(course.slug || ''),
      nombre: String(course.name || course.title || 'Curso sin nombre'),
      tipo: String(course.course_type || ''),
      studyType: publicStudyType,
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
  })
}
