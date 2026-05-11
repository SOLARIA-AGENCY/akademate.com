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
  modality?: string | null
  landing_enabled?: boolean | null
  landing_target_audience?: string | null
  landing_access_requirements?: string | null
  landing_outcomes?: string | null
  landing_objectives?: { text?: string | null }[] | null
  landing_program_blocks?: {
    title?: string | null
    body?: string | null
    items?: { text?: string | null }[] | null
  }[] | null
  landing_faqs?: { question?: string | null; answer?: string | null }[] | null
  active?: boolean | null
  featured?: boolean | null
  area_formativa?: { nombre?: string | null } | number | null
  featured_image?: { url?: string | null; filename?: string | null } | number | null
  image?: { url?: string | null; filename?: string | null } | number | null
  dossier_pdf?: { url?: string | null; filename?: string | null } | number | null
  createdAt?: string
  updatedAt?: string
}

type CourseRunDoc = {
  id: number | string
  status?: string | null
  start_date?: string | null
  end_date?: string | null
  enrollment_deadline?: string | null
  schedule_days?: string[] | null
  schedule_time_start?: string | null
  schedule_time_end?: string | null
  max_students?: number | null
  current_enrollments?: number | null
  campus?: { name?: string | null; city?: string | null } | number | null
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
  descripcionDetallada: string[]
  area: string
  modality: string
  duracionReferencia: number
  precioReferencia: number
  porcentajeSubvencion: number
  imagenPortada: string
  dossierUrl: string | null
  landingEnabled: boolean
  landingTargetAudience: string
  landingAccessRequirements: string
  landingOutcomes: string
  landingObjectives: string[]
  landingProgramBlocks: {
    title: string
    body: string
    items: string[]
  }[]
  landingFaqs: {
    question: string
    answer: string
  }[]
  enrollmentStatus: 'open' | 'published' | 'none'
  enrollmentLabel: string
  nextRun: {
    id: string
    status: string
    startDate: string | null
    endDate: string | null
    scheduleLabel: string
    campusLabel: string
    availableSeats: number | null
  } | null
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

function resolveMediaImageUrl(
  image: CourseDoc['featured_image'] | CourseDoc['image'] | CourseDoc['dossier_pdf']
): string | null {
  if (!image || typeof image !== 'object') return null
  if (image.url) return image.url
  if (image.filename) return `/media/${image.filename}`
  return null
}

function toTextArray(items: { text?: string | null }[] | null | undefined): string[] {
  return (items ?? [])
    .map((item) => String(item?.text ?? '').trim())
    .filter(Boolean)
}

function toProgramBlocks(course: CourseDoc): PublishedCourse['landingProgramBlocks'] {
  return (course.landing_program_blocks ?? [])
    .map((block) => ({
      title: String(block?.title ?? '').trim(),
      body: String(block?.body ?? '').trim(),
      items: toTextArray(block?.items),
    }))
    .filter((block) => block.title || block.body || block.items.length > 0)
}

function toFaqs(course: CourseDoc): PublishedCourse['landingFaqs'] {
  return (course.landing_faqs ?? [])
    .map((faq) => ({
      question: String(faq?.question ?? '').trim(),
      answer: String(faq?.answer ?? '').trim(),
    }))
    .filter((faq) => faq.question && faq.answer)
}

function toScheduleLabel(run: CourseRunDoc | null): string {
  if (!run) return ''
  const days = (run.schedule_days ?? []).join(', ')
  const start = String(run.schedule_time_start ?? '').replace(/:00$/, '')
  const end = String(run.schedule_time_end ?? '').replace(/:00$/, '')
  if (days && start && end) return `${days} · ${start}-${end}`
  if (start && end) return `${start}-${end}`
  return days
}

function toCampusLabel(campus: CourseRunDoc['campus']): string {
  if (!campus || typeof campus !== 'object') return ''
  return [campus.name, campus.city].filter(Boolean).join(' · ')
}

function toEnrollmentStatus(
  runs: CourseRunDoc[],
  studyType?: PublicStudyType | null
): Pick<
  PublishedCourse,
  'enrollmentStatus' | 'enrollmentLabel' | 'nextRun' | 'totalConvocatorias'
> {
  if (studyType === 'teleformacion') {
    return {
      enrollmentStatus: 'open',
      enrollmentLabel: 'Matrícula abierta permanente',
      nextRun: null,
      totalConvocatorias: 0,
    }
  }

  const visibleRuns = runs.filter((run) => ['enrollment_open', 'published'].includes(String(run.status ?? '')))
  const openRun = visibleRuns.find((run) => run.status === 'enrollment_open') ?? null
  const nextRun = openRun ?? visibleRuns[0] ?? null
  const enrollmentStatus = openRun ? 'open' : nextRun ? 'published' : 'none'
  const availableSeats =
    nextRun && typeof nextRun.max_students === 'number'
      ? Math.max(0, nextRun.max_students - Number(nextRun.current_enrollments ?? 0))
      : null

  return {
    enrollmentStatus,
    enrollmentLabel:
      enrollmentStatus === 'open'
        ? 'Matrícula abierta'
        : enrollmentStatus === 'published'
          ? 'Próximas fechas'
          : 'Avisarme de próximas fechas',
    nextRun: nextRun
      ? {
          id: String(nextRun.id),
          status: String(nextRun.status ?? ''),
          startDate: nextRun.start_date ?? null,
          endDate: nextRun.end_date ?? null,
          scheduleLabel: toScheduleLabel(nextRun),
          campusLabel: toCampusLabel(nextRun.campus),
          availableSeats,
        }
      : null,
    totalConvocatorias: visibleRuns.length,
  }
}

function extractTextFromRichText(value: unknown): string[] {
  const lines: string[] = []

  function visit(node: unknown) {
    if (!node) return
    if (typeof node === 'string') {
      const text = node.trim()
      if (text) lines.push(text)
      return
    }
    if (Array.isArray(node)) {
      for (const child of node) visit(child)
      return
    }
    if (typeof node !== 'object') return

    const record = node as Record<string, unknown>
    if (typeof record.text === 'string') {
      const text = record.text.trim()
      if (text) lines.push(text)
    }

    if (Array.isArray(record.children)) {
      const textChildren = record.children
        .map((child) => {
          if (child && typeof child === 'object' && typeof (child as { text?: unknown }).text === 'string') {
            return String((child as { text: string }).text)
          }
          return ''
        })
        .join('')
        .trim()

      if (textChildren) {
        lines.push(textChildren)
        return
      }

      visit(record.children)
    }

    if (record.root) visit(record.root)
  }

  visit(value)
  return Array.from(new Set(lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)))
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
  studyTypeMap: Record<PublicStudyType, StudyTypeVisualMeta>,
  runs: CourseRunDoc[] = []
): PublishedCourse {
  const normalizedStudyType = normalizePublicStudyType(String(course.course_type || ''))
  const visual = normalizedStudyType ? studyTypeMap[normalizedStudyType] : null
  const imageUrl =
    resolveMediaImageUrl(course.featured_image) ??
    resolveMediaImageUrl(course.image) ??
    getPublicStudyTypeFallbackImage(course.course_type)
  const runMeta = toEnrollmentStatus(runs, normalizedStudyType)

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
    descripcionDetallada: extractTextFromRichText(course.long_description),
    area: toAreaName(course.area_formativa),
    modality: String(course.modality || 'presencial'),
    duracionReferencia: Number(course.duration_hours || 0),
    precioReferencia: Number(course.base_price || 0),
    porcentajeSubvencion: Number(course.subsidy_percentage || 100),
    imagenPortada: imageUrl,
    dossierUrl: resolveMediaImageUrl(course.dossier_pdf),
    landingEnabled: Boolean(course.landing_enabled),
    landingTargetAudience: String(course.landing_target_audience || '').trim(),
    landingAccessRequirements: String(course.landing_access_requirements || '').trim(),
    landingOutcomes: String(course.landing_outcomes || '').trim(),
    landingObjectives: toTextArray(course.landing_objectives),
    landingProgramBlocks: toProgramBlocks(course),
    landingFaqs: toFaqs(course),
    ...runMeta,
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
  let payloadAny: any;
  try {
    const payload = payloadClient ?? (await getPayload({ config: configPromise }))
    payloadAny = payload as any
  } catch(e) {
    return { ...DEFAULT_STUDY_TYPE_VISUALS }
  }

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
  try {
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
  } catch (e) {
    console.error('Error fetching published courses:', e)
    return []
  }
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

  try {
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

    const docs = (result.docs ?? []) as CourseDoc[]
    if (docs.length === 0) return null

    const course = docs[0]
    let runs: CourseRunDoc[] = []
    try {
      const runResult = await payload.find({
        collection: 'course-runs',
        where: withTenantScope(
          {
            and: [
              { course: { equals: course.id } },
              { status: { in: ['enrollment_open', 'published'] } },
            ],
          } as Record<string, unknown>,
          options.tenantId
        ) as any,
        limit: 10,
        depth: 1,
        sort: 'start_date',
      })
      runs = (runResult.docs ?? []) as CourseRunDoc[]
    } catch {
      runs = []
    }

    const studyTypeMap = await getStudyTypeVisualMap(payload)
    return mapCourseDocToPublishedCourse(course, studyTypeMap, runs)
  } catch (e) {
    console.error('Error fetching course by slug:', e)
    return null
  }
}
