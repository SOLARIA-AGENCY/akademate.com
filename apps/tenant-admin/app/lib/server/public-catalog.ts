import 'server-only'

import { getPayload } from 'payload'
import { queryRows } from '@/@payload-config/lib/db'
import configPromise from '@payload-config'
import { canonicalizePayloadMediaUrl, toRelativePublicMediaUrl } from '@/app/lib/payload-media-url'
import { enrollmentFromRun, enrollmentLabelFor, getPublishedCourses, type PublishedCourse, type PublicEnrollmentStatus } from '@/app/lib/server/published-courses'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantWebsiteById } from '@/app/lib/website/server'
import {
  PUBLIC_CATALOG_FORBIDDEN_KEYS,
  PUBLIC_CATALOG_TTL_SECONDS,
  PUBLIC_CATALOG_VERSION,
  assertPublicCatalogHasNoPii,
  hashCatalogVersion,
  PublicCatalogError,
} from '@/app/lib/server/public-catalog-shared'

export {
  PUBLIC_CATALOG_FORBIDDEN_KEYS,
  PUBLIC_CATALOG_TTL_SECONDS,
  PUBLIC_CATALOG_VERSION,
  assertPublicCatalogHasNoPii,
  hashCatalogVersion,
  PublicCatalogError,
  resolvePublicCatalogHost,
} from '@/app/lib/server/public-catalog-shared'

export type PublicCatalogMeta = {
  tenant: string
  host: string
  generatedAt: string
  version: string
  cacheTtlSeconds: number
}

export type PublicCatalogSnapshot = {
  meta: PublicCatalogMeta
  data: {
    branding: Record<string, unknown>
    navigation: Record<string, unknown>
    seo: Record<string, unknown>
    courses: PublishedCourse[]
    cycles: Array<Record<string, unknown>>
    convocatorias: Array<Record<string, unknown>>
    campuses: Array<Record<string, unknown>>
    teachers: Array<Record<string, unknown>>
    pages: Array<Record<string, unknown>>
    website: Record<string, unknown> | null
    sitemap: Array<{ path: string; changefreq: string; lastmod: string | null }>
  }
}

function mediaUrl(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') {
    return toRelativePublicMediaUrl(canonicalizePayloadMediaUrl(value) || value)
  }
  if (typeof value === 'object') {
    const record = value as { url?: string | null; filename?: string | null }
    if (record.url) {
      return toRelativePublicMediaUrl(canonicalizePayloadMediaUrl(record.url) || record.url)
    }
    if (record.filename) return toRelativePublicMediaUrl(`/api/media/file/${record.filename}`)
  }
  return null
}

function relationId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object' && value && 'id' in value) return String((value as { id: unknown }).id)
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  return null
}

function omitForbiddenKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(omitForbiddenKeys)
  if (!value || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if ((PUBLIC_CATALOG_FORBIDDEN_KEYS as readonly string[]).includes(key.toLowerCase())) continue
    out[key] = omitForbiddenKeys(nested)
  }
  return out
}

function rewritePublicMediaTree(value: unknown): unknown {
  if (typeof value === 'string') {
    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('/api/media') ||
      value.startsWith('/media/')
    ) {
      return toRelativePublicMediaUrl(value) || value
    }
    return value
  }
  if (Array.isArray(value)) return value.map(rewritePublicMediaTree)
  if (!value || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = rewritePublicMediaTree(nested)
  }
  return out
}

function publicWebsiteSnapshot(website: unknown): Record<string, unknown> | null {
  if (!website || typeof website !== 'object') return null
  const record = website as {
    visualIdentity?: unknown
    navigation?: unknown
    footer?: unknown
    pages?: unknown
  }
  const slim = {
    visualIdentity: record.visualIdentity ?? null,
    navigation: record.navigation ?? null,
    footer: record.footer ?? null,
    pages: record.pages ?? [],
  }
  return omitForbiddenKeys(rewritePublicMediaTree(slim)) as Record<string, unknown>
}

function withRelativeCourseMedia(course: PublishedCourse): PublishedCourse {
  return {
    ...course,
    imagenPortada: toRelativePublicMediaUrl(course.imagenPortada) || course.imagenPortada,
    dossierUrl: course.dossierUrl ? toRelativePublicMediaUrl(course.dossierUrl) : null,
  }
}

function relationSlug(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'object') {
    const record = value as { slug?: string | null; name?: string | null }
    return record.slug || record.name || null
  }
  return String(value)
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function loadSqlCycles(tenantId: string | number) {
  const rows = await queryRows<{
    id: number
    name: string | null
    slug: string | null
    level: string | null
    description: string | null
    updated_at: string | Date | null
    image_filename: string | null
    image_url: string | null
  }>(
    `SELECT c.id, c.name, c.slug, c.level, c.description, c.updated_at,
            m.filename AS image_filename, m.url AS image_url
     FROM cycles c
     LEFT JOIN media m ON m.id = c.image_id
     WHERE c.tenant_id = $1 AND COALESCE(c.active, true) = true
     ORDER BY c.name
     LIMIT 100`,
    [Number(tenantId)],
  )
  return rows.map((row) => ({
    id: String(row.id),
    slug: row.slug || slugify(String(row.name || row.id)),
    name: row.name || 'Ciclo',
    level: row.level,
    family: null as string | null,
    description: row.description || '',
    imageUrl:
      toRelativePublicMediaUrl(row.image_url) ||
      (row.image_filename ? `/api/media/file/${row.image_filename}` : null),
    officialTitle: null as string | null,
    duration: null as unknown,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }))
}

async function resolveCepTenant(host: string) {
  const payload = await getPayload({ config: configPromise })
  const byDomain = await payload.find({
    collection: 'tenants',
    where: { domain: { equals: host } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (byDomain.docs[0]) {
    return byDomain.docs[0] as {
      id: number | string
      name?: string | null
      slug?: string | null
      domain?: string | null
      branding?: Record<string, unknown> | null
    }
  }

  const slugCandidates =
    host.includes('cepformacion') || host.includes('cep-formacion')
      ? ['cep-formacion', 'cepformacion']
      : [host.split('.')[0]]

  for (const slug of slugCandidates) {
    const bySlug = await payload.find({
      collection: 'tenants',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (bySlug.docs[0]) {
      return bySlug.docs[0] as {
        id: number | string
        name?: string | null
        slug?: string | null
        domain?: string | null
        branding?: Record<string, unknown> | null
      }
    }
  }

  return null
}

function mapCycle(doc: Record<string, unknown>) {
  return {
    id: String(doc.id ?? ''),
    slug: String(doc.slug || slugify(String(doc.name || doc.id || 'ciclo'))),
    name: String(doc.name || ''),
    level: doc.level ?? null,
    family: doc.family ?? null,
    description: typeof doc.description === 'string' ? doc.description : '',
    imageUrl: mediaUrl(doc.image),
    officialTitle: doc.official_title ?? null,
    duration: doc.duration ?? null,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
  }
}

function mapCampus(doc: Record<string, unknown>) {
  const photos = Array.isArray(doc.photos)
    ? doc.photos.map((photo) => mediaUrl(photo)).filter((url): url is string => Boolean(url))
    : []
  return {
    id: String(doc.id ?? ''),
    slug: String(doc.slug || slugify(String(doc.name || doc.id || 'sede'))),
    name: String(doc.name || ''),
    description: typeof doc.description === 'string' ? doc.description : '',
    city: doc.city ?? null,
    address: doc.address ?? null,
    postalCode: doc.postal_code ?? null,
    phone: doc.phone ?? null,
    mapsUrl: doc.google_maps_url ?? doc.maps_url ?? null,
    imageUrl: mediaUrl(doc.image),
    photos,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
  }
}

function mapTeacher(doc: Record<string, unknown>) {
  const name =
    (typeof doc.full_name === 'string' && doc.full_name) ||
    [doc.first_name, doc.last_name].filter(Boolean).join(' ').trim() ||
    'Docente'
  return {
    id: String(doc.id ?? ''),
    slug: slugify(name) || String(doc.id ?? ''),
    name,
    photoUrl: mediaUrl(doc.photo),
    bio: typeof doc.bio === 'string' ? doc.bio : '',
    specialties: Array.isArray(doc.specialties) ? doc.specialties : [],
  }
}

function asPositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

function mapLandingFaqs(value: unknown): Array<{ question: string; answer: string }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const record = item && typeof item === 'object' ? (item as { question?: string; answer?: string }) : null
      const question = String(record?.question || '').trim()
      const answer = String(record?.answer || '').trim()
      return { question, answer }
    })
    .filter((faq) => faq.question && faq.answer)
}

function mapLandingObjectives(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return item.trim()
      if (item && typeof item === 'object' && 'text' in item) return String((item as { text?: string }).text || '').trim()
      return ''
    })
    .filter(Boolean)
}

function mapLandingBlocks(value: unknown): Array<{ title: string; body: string; items: string[] }> {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : null
      const items = Array.isArray(record?.items)
        ? record.items
            .map((entry) => {
              if (typeof entry === 'string') return entry.trim()
              if (entry && typeof entry === 'object' && 'text' in entry) {
                return String((entry as { text?: string }).text || '').trim()
              }
              return ''
            })
            .filter(Boolean)
        : []
      return {
        title: String(record?.title || '').trim(),
        body: String(record?.body || '').trim(),
        items,
      }
    })
    .filter((block) => block.title || block.body || block.items.length > 0)
}

function mapConvocatoriaCourse(course: Record<string, unknown> | null) {
  if (!course) return null
  return {
    id: String(course.id ?? ''),
    slug: course.slug ?? null,
    nombre: course.name ?? course.title ?? null,
    imageUrl: mediaUrl(course.featured_image) || mediaUrl(course.image),
    durationHours: asPositiveInt(course.duration_hours),
    landingObjectives: mapLandingObjectives(course.landing_objectives ?? course.landingObjectives),
    landingProgramBlocks: mapLandingBlocks(course.landing_program_blocks ?? course.landingProgramBlocks),
    landingOutcomes:
      typeof course.landing_outcomes === 'string'
        ? course.landing_outcomes
        : typeof course.landingOutcomes === 'string'
          ? course.landingOutcomes
          : null,
    landingFaqs: mapLandingFaqs(course.landing_faqs ?? course.landingFaqs),
    landingAccessRequirements:
      typeof course.landing_access_requirements === 'string'
        ? course.landing_access_requirements
        : typeof course.landingAccessRequirements === 'string'
          ? course.landingAccessRequirements
          : null,
    landingTargetAudience:
      typeof course.landing_target_audience === 'string'
        ? course.landing_target_audience
        : typeof course.landingTargetAudience === 'string'
          ? course.landingTargetAudience
          : null,
  }
}

function usableConvocatoriaCycle(doc: Record<string, unknown>): Record<string, unknown> | null {
  if (String(doc.training_type || 'private') === 'private') return null
  const cycle = typeof doc.cycle === 'object' && doc.cycle ? (doc.cycle as Record<string, unknown>) : null
  if (!cycle || (!cycle.id && !cycle.slug)) return null
  return cycle
}

function priceLabel(doc: Record<string, unknown>, course: Record<string, unknown> | null): { label: string } {
  const amount = [doc.price_override, doc.price_snapshot, course?.base_price].find(
    (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
  )
  if (typeof amount !== 'number') return { label: 'Consultar' }
  return {
    label: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount),
  }
}

function mapConvocatoria(doc: Record<string, unknown>) {
  const course = typeof doc.course === 'object' && doc.course ? (doc.course as Record<string, unknown>) : null
  const campus = typeof doc.campus === 'object' && doc.campus ? (doc.campus as Record<string, unknown>) : null
  const instructor = typeof doc.instructor === 'object' && doc.instructor ? (doc.instructor as Record<string, unknown>) : null
  const cycle = usableConvocatoriaCycle(doc)
  const cycleDuration =
    cycle && typeof cycle.duration === 'object' && cycle.duration ? (cycle.duration as Record<string, unknown>) : null
  const days = Array.isArray(doc.schedule_days) ? doc.schedule_days.map((day) => String(day)) : []
  const mappedCourse = mapConvocatoriaCourse(course)
  return {
    id: String(doc.id ?? ''),
    codigo: String(doc.codigo || doc.code || doc.id || ''),
    status: doc.status ?? null,
    startDate: doc.start_date ?? null,
    endDate: doc.end_date ?? null,
    enrollmentDeadline: doc.enrollment_deadline ?? null,
    schedule: {
      days,
      start: doc.schedule_time_start ?? null,
      end: doc.schedule_time_end ?? null,
    },
    classFrequency: days.length > 0 ? days.length : null,
    classroomHours: asPositiveInt(mappedCourse?.durationHours) ?? asPositiveInt(doc.classroom_hours),
    companyHours: cycle ? asPositiveInt(cycleDuration?.practiceHours) : null,
    certificationType: cycle && typeof cycle.officialTitle === 'string' ? cycle.officialTitle : null,
    deliveryMode: typeof course?.modality === 'string' ? course.modality : null,
    financialAidAvailable: Boolean(doc.financial_aid_available),
    price: priceLabel(doc, course),
    trainingLine: typeof course?.course_type === 'string' ? course.course_type : null,
    availableSeats:
      typeof doc.max_students === 'number' && typeof doc.current_enrollments === 'number'
        ? Math.max(doc.max_students - doc.current_enrollments, 0)
        : null,
    course: mappedCourse,
    campus: campus
      ? { slug: campus.slug ?? null, name: campus.name ?? null, city: campus.city ?? null }
      : { slug: relationSlug(doc.campus), name: relationSlug(doc.campus), city: null },
    instructor: instructor
      ? {
          id: String(instructor.id ?? ''),
          name: instructor.full_name ?? instructor.name ?? null,
          photoUrl: mediaUrl(instructor.photo),
        }
      : null,
    cycle: cycle
      ? { slug: cycle.slug ?? null, name: cycle.name ?? null, level: cycle.level ?? null }
      : null,
    imageUrl: mediaUrl(doc.image) || mappedCourse?.imageUrl || null,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
  }
}

export async function getPublicContentVersion(host: string): Promise<{
  version: string
  generatedAt: string
  tenant: string | null
}> {
  const tenant = await resolveCepTenant(host)
  const generatedAt = new Date().toISOString()
  if (!tenant) {
    return { version: hashCatalogVersion([host, 'missing-tenant']), generatedAt, tenant: null }
  }

  const payload = await getPayload({ config: configPromise })
  const tenantId = tenant.id
  const [courses, cycles, campuses, runs, posts] = await Promise.all([
    payload.find({
      collection: 'courses',
      where: withTenantScope({}, tenantId) as never,
      limit: 1,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'cycles',
      where: withTenantScope({}, tenantId) as never,
      limit: 1,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'campuses',
      where: withTenantScope({}, tenantId) as never,
      limit: 1,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'course-runs',
      where: withTenantScope({}, tenantId) as never,
      limit: 1,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload
      .find({
        collection: 'blog_posts',
        where: withTenantScope({}, tenantId) as never,
        limit: 1,
        sort: '-updatedAt',
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => ({ docs: [] as Array<{ updatedAt?: string }> })),
  ])

  const stamps = [courses, cycles, campuses, runs, posts].map((result) => {
    const doc = result.docs[0] as { updatedAt?: string } | undefined
    return doc?.updatedAt ?? ''
  })
  return {
    version: hashCatalogVersion([String(tenantId), PUBLIC_CATALOG_VERSION, ...stamps]),
    generatedAt,
    tenant: String(tenant.slug || tenant.id),
  }
}

export async function getPublicCatalog(host: string): Promise<PublicCatalogSnapshot> {
  const tenant = await resolveCepTenant(host)
  if (!tenant) {
    throw new PublicCatalogError('TENANT_NOT_FOUND', `No tenant for host ${host}`)
  }

  const payload = await getPayload({ config: configPromise })
  const tenantId = tenant.id
  const generatedAt = new Date().toISOString()
  const versionInfo = await getPublicContentVersion(host)

  const [courses, cycles, campuses, teachers, convocatorias, cycleCourses, website] = await Promise.all([
    getPublishedCourses({ tenantId, includeCycles: false, limit: 500 }),
    payload.find({
      collection: 'cycles',
      where: withTenantScope({ active: { equals: true } }, tenantId) as never,
      limit: 100,
      depth: 1,
      sort: 'name',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'campuses',
      where: withTenantScope({}, tenantId) as never,
      limit: 50,
      depth: 1,
      sort: 'name',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'staff',
      where: { and: [{ staff_type: { equals: 'profesor' } }, { is_active: { equals: true } }] } as never,
      limit: 100,
      depth: 1,
      sort: 'last_name',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'course-runs',
      where: withTenantScope({ status: { in: ['enrollment_open', 'published', 'enrollment_closed', 'in_progress'] } }, tenantId) as never,
      limit: 200,
      depth: 1,
      sort: '-start_date',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'courses',
      where: withTenantScope(
        {
          active: { equals: true },
          course_type: { in: ['ciclo_medio', 'ciclo_superior'] },
        },
        tenantId,
      ) as never,
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
    getTenantWebsiteById(String(tenantId)).catch(() => null),
  ])

  const cycleImageById = new Map<string, string>()
  for (const course of cycleCourses.docs as Array<Record<string, unknown>>) {
    const cycleId = relationId(course.cycle)
    if (!cycleId || cycleImageById.has(cycleId)) continue
    const url = mediaUrl(course.featured_image) || mediaUrl(course.image)
    if (url) cycleImageById.set(cycleId, url)
  }

  let mappedCycles = cycles.docs.map((doc) => {
    const mapped = mapCycle(doc as Record<string, unknown>)
    return {
      ...mapped,
      imageUrl: mapped.imageUrl || cycleImageById.get(mapped.id) || null,
    }
  })
  const sqlCycles = await loadSqlCycles(tenantId).catch(() => [])
  if (!mappedCycles.length && sqlCycles.length) {
    mappedCycles = sqlCycles
  } else if (sqlCycles.length) {
    const byId = new Map(sqlCycles.map((cycle) => [cycle.id, cycle]))
    const bySlug = new Map(sqlCycles.map((cycle) => [cycle.slug, cycle]))
    mappedCycles = mappedCycles.map((cycle) => {
      const extra = byId.get(cycle.id) || bySlug.get(cycle.slug)
      return extra?.imageUrl && !cycle.imageUrl ? { ...cycle, imageUrl: extra.imageUrl } : cycle
    })
  }
  const publicCourses = courses.map(withRelativeCourseMedia)
  const publicWebsite = publicWebsiteSnapshot(website)
  const mappedCampuses = campuses.docs.map((doc) => mapCampus(doc as Record<string, unknown>))
  const mappedTeachers = teachers.docs.map((doc) => mapTeacher(doc as Record<string, unknown>))
  const mappedConvocatorias = convocatorias.docs.map((doc) => mapConvocatoria(doc as Record<string, unknown>))

  const sitemap = [
    { path: '/', changefreq: 'daily', lastmod: generatedAt },
    { path: '/cursos', changefreq: 'daily', lastmod: generatedAt },
    { path: '/ciclos', changefreq: 'weekly', lastmod: generatedAt },
    { path: '/convocatorias', changefreq: 'daily', lastmod: generatedAt },
    { path: '/contacto', changefreq: 'monthly', lastmod: generatedAt },
    { path: '/quienes-somos', changefreq: 'monthly', lastmod: generatedAt },
    ...publicCourses.map((course) => ({ path: `/cursos/${course.slug}`, changefreq: 'weekly', lastmod: course.updated_at })),
    ...mappedCycles.map((cycle) => ({ path: `/ciclos/${cycle.slug}`, changefreq: 'weekly', lastmod: cycle.updatedAt })),
    ...mappedConvocatorias.map((item) => ({
      path: `/convocatorias/${item.codigo}`,
      changefreq: 'daily',
      lastmod: item.updatedAt as string | null,
    })),
    ...mappedCampuses.map((campus) => ({ path: `/sedes/${campus.slug}`, changefreq: 'monthly', lastmod: campus.updatedAt })),
    ...mappedTeachers.map((teacher) => ({ path: `/profesores/${teacher.slug}`, changefreq: 'monthly', lastmod: generatedAt })),
  ]

  const snapshot: PublicCatalogSnapshot = {
    meta: {
      tenant: String(tenant.slug || 'cepformacion'),
      host,
      generatedAt,
      version: versionInfo.version,
      cacheTtlSeconds: PUBLIC_CATALOG_TTL_SECONDS,
    },
    data: {
      branding: {
        academyName: tenant.name || 'CEP Formación',
        slug: tenant.slug || 'cepformacion',
        primaryColor: '#f2014b',
        logoUrl: toRelativePublicMediaUrl(website?.visualIdentity?.logoPrimary) || '/logos/cep-formacion-logo.svg',
        faviconUrl: toRelativePublicMediaUrl(website?.visualIdentity?.favicon) || '/website/cep/logos/cep-circle-icon.svg',
        contact: {
          phone: ['922 21 92 57'],
        },
      },
      navigation:
        (publicWebsite?.navigation as Record<string, unknown> | undefined) || {
          items: [
            { kind: 'link', label: 'Quiénes somos', href: '/quienes-somos' },
            { kind: 'link', label: 'Cursos', href: '/cursos' },
            { kind: 'link', label: 'Ciclos', href: '/ciclos' },
            { kind: 'link', label: 'Convocatorias', href: '/convocatorias' },
          ],
          cta: { label: 'Contacto', href: '/contacto' },
        },
      seo: {
        defaultTitle: `${tenant.name || 'CEP Formación'} | Formación profesional en Tenerife`,
        defaultDescription:
          'Cursos, ciclos y convocatorias de CEP Formación. Nueva web en Cloudflare, catálogo servido desde el dashboard OVH.',
        canonicalOrigin: 'https://cepformacion.com',
        locale: 'es_ES',
        robots: { allow: ['/'], disallow: ['/preview', '/internal', '/dashboard', '/admin'] },
      },
      courses: publicCourses,
      cycles: mappedCycles,
      convocatorias: mappedConvocatorias,
      campuses: mappedCampuses,
      teachers: mappedTeachers,
      pages: [
        { path: '/', title: 'Inicio', pageKind: 'home' },
        { path: '/cursos', title: 'Cursos', pageKind: 'catalog' },
        { path: '/ciclos', title: 'Ciclos', pageKind: 'catalog' },
        { path: '/convocatorias', title: 'Convocatorias', pageKind: 'catalog' },
      ],
      website: publicWebsite,
      sitemap,
    },
  }

  try {
    assertPublicCatalogHasNoPii(snapshot)
  } catch (error) {
    if (!(error instanceof PublicCatalogError) || error.code !== 'PII_LEAK') throw error
    snapshot.data.website = null
    snapshot.data.teachers = (snapshot.data.teachers || []).map((teacher) => {
      const record = { ...(teacher as Record<string, unknown>) }
      delete record.email
      return record
    })
    assertPublicCatalogHasNoPii(snapshot)
  }
  return snapshot
}

function sqlStudyTypeLabel(courseType: string | null | undefined): string {
  const key = String(courseType || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  if (key.includes('desemple')) return 'Desempleados'
  if (key.includes('ocupad')) return 'Ocupados'
  if (key.includes('teleform')) return 'Teleformación'
  if (key.includes('privad')) return 'Privados'
  return 'Privados'
}

export async function getPublicCatalogSqlFallback(host: string): Promise<PublicCatalogSnapshot> {
  const tenant = await queryRows<{ id: number; name: string | null; slug: string | null }>(
    `SELECT id, name, slug FROM tenants
     WHERE slug IN ('cep-formacion', 'cepformacion')
        OR domain ILIKE $1
        OR $1 LIKE '%' || slug || '%'
     ORDER BY id ASC
     LIMIT 1`,
    [`%${host.replace(/^www\./, '')}%`],
  )
  const tenantRow = tenant[0]
  if (!tenantRow) throw new PublicCatalogError('TENANT_NOT_FOUND', `No tenant for host ${host}`)
  const tenantId = tenantRow.id
  const generatedAt = new Date().toISOString()

  const [courseRows, runRows, campusRows, cycleRows] = await Promise.all([
    queryRows<{
      id: number
      name: string | null
      slug: string | null
      course_type: string | null
      descripcion: string | null
      updated_at: string | Date | null
    }>(
      `SELECT id, name, slug, course_type, COALESCE(short_description, '') AS descripcion, updated_at
       FROM courses
       WHERE tenant_id = $1
         AND COALESCE(active, true) = true
         AND (course_type IS NULL OR course_type::text NOT IN ('ciclo_medio', 'ciclo_superior'))
       ORDER BY name
       LIMIT 500`,
      [tenantId],
    ),
    queryRows<{ course_id: number; status: string; enrollment_deadline: string | Date | null }>(
      `SELECT course_id, status, enrollment_deadline FROM course_runs
       WHERE tenant_id = $1 AND status IN ('enrollment_open', 'published', 'enrollment_closed', 'in_progress')`,
      [tenantId],
    ),
    queryRows<{ id: number; name: string | null; slug: string | null; city: string | null }>(
      `SELECT id, name, slug, city FROM campuses WHERE tenant_id = $1 ORDER BY name LIMIT 50`,
      [tenantId],
    ),
    queryRows<{
      id: number
      name: string | null
      slug: string | null
      level: string | null
      description: string | null
      updated_at: string | Date | null
      image_filename: string | null
      image_url: string | null
    }>(
      `SELECT c.id, c.name, c.slug, c.level, c.description, c.updated_at,
              m.filename AS image_filename, m.url AS image_url
       FROM cycles c
       LEFT JOIN media m ON m.id = c.image_id
       WHERE c.tenant_id = $1 AND COALESCE(c.active, true) = true
       ORDER BY c.name
       LIMIT 100`,
      [tenantId],
    ),
  ])

  const courses = courseRows.map((row) => {
    const id = String(row.id)
    const states = runRows
      .filter((run) => String(run.course_id) === id)
      .map((run) =>
        enrollmentFromRun({
          status: run.status,
          enrollment_deadline: run.enrollment_deadline ? String(run.enrollment_deadline) : null,
        }),
      )
    const enrollmentStatus: PublicEnrollmentStatus = states.includes('open')
      ? 'open'
      : states.includes('published')
        ? 'published'
        : states.includes('closed')
          ? 'closed'
          : 'none'
    const label = sqlStudyTypeLabel(row.course_type)
    return {
      id,
      codigo: '',
      slug: row.slug || id,
      nombre: row.name || 'Curso',
      tipo: row.course_type || '',
      studyType: null,
      studyTypeLabel: label,
      studyTypeColor: '#64748B',
      descripcion: row.descripcion || '',
      descripcionDetallada: [],
      area: '',
      areaColor: null,
      modality: 'presencial',
      duracionReferencia: 0,
      precioReferencia: 0,
      porcentajeSubvencion: 100,
      imagenPortada: '',
      dossierUrl: null,
      landingEnabled: false,
      landingTargetAudience: '',
      landingAccessRequirements: '',
      landingOutcomes: '',
      landingObjectives: [],
      landingProgramBlocks: [],
      landingFaqs: [],
      enrollmentStatus,
      enrollmentLabel: enrollmentLabelFor(enrollmentStatus),
      nextRun: null,
      totalConvocatorias: 0,
      active: true,
      featured: false,
      created_at: null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    }
  })

  const mappedCycles = cycleRows.map((row) => ({
    id: String(row.id),
    slug: row.slug || slugify(String(row.name || row.id)),
    name: row.name || 'Ciclo',
    level: row.level,
    family: null,
    description: row.description || '',
    imageUrl:
      toRelativePublicMediaUrl(row.image_url) ||
      (row.image_filename ? `/api/media/file/${row.image_filename}` : null),
    officialTitle: null,
    duration: null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  }))

  const mappedCampuses = campusRows.map((row) => ({
    id: String(row.id),
    slug: row.slug || slugify(String(row.name || row.id)),
    name: row.name || 'Sede',
    city: row.city,
  }))

  const snapshot: PublicCatalogSnapshot = {
    meta: {
      tenant: String(tenantRow.slug || 'cepformacion'),
      host,
      generatedAt,
      version: hashCatalogVersion([String(tenantId), 'sql', String(courses.length), generatedAt]),
      cacheTtlSeconds: PUBLIC_CATALOG_TTL_SECONDS,
    },
    data: {
      branding: {
        academyName: tenantRow.name || 'CEP Formación',
        slug: tenantRow.slug || 'cepformacion',
        primaryColor: '#f2014b',
        logoUrl: '/logos/cep-formacion-logo.svg',
        faviconUrl: '/website/cep/logos/cep-circle-icon.svg',
      },
      navigation: {
        items: [
          { kind: 'link', label: 'Cursos', href: '/cursos' },
          { kind: 'link', label: 'Ciclos', href: '/ciclos' },
        ],
        cta: { label: 'Contacto', href: '/contacto' },
      },
      seo: {
        defaultTitle: `${tenantRow.name || 'CEP Formación'} | Formación profesional en Tenerife`,
        defaultDescription: 'Cursos, ciclos y convocatorias de CEP Formación.',
        canonicalOrigin: 'https://cepformacion.com',
      },
      courses,
      cycles: mappedCycles,
      convocatorias: [],
      campuses: mappedCampuses,
      teachers: [],
      pages: [
        { path: '/', title: 'Inicio', pageKind: 'home' },
        { path: '/cursos', title: 'Cursos', pageKind: 'catalog' },
        { path: '/ciclos', title: 'Ciclos', pageKind: 'catalog' },
      ],
      website: null,
      sitemap: [
        { path: '/', changefreq: 'daily', lastmod: generatedAt },
        { path: '/cursos', changefreq: 'daily', lastmod: generatedAt },
        { path: '/ciclos', changefreq: 'weekly', lastmod: generatedAt },
        ...courses.map((course) => ({
          path: `/cursos/${course.slug}`,
          changefreq: 'weekly',
          lastmod: course.updated_at,
        })),
      ],
    },
  }

  assertPublicCatalogHasNoPii(snapshot)
  return snapshot
}
