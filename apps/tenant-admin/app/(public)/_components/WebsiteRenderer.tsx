import type React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import { getTenantHostBranding } from '@/app/lib/server/tenant-host-branding'
import type { WebsitePage, WebsiteSection } from '@/app/lib/website/types'
import { normalizeStudyType } from '@/app/lib/website/study-types'
import { HeroCarouselClient } from './HeroCarouselClient'

const BRAND_RED = '#f2014b'

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) {
    return String(image.url).replace(/^\/api\/media\/file\//, '/media/').replace(/^\/media\/file\//, '/media/')
  }
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Próximamente'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Próximamente'
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function getCourseArea(course: any): string {
  const area = course?.area_formativa
  if (typeof area === 'object' && area?.nombre) return String(area.nombre)
  if (typeof area === 'string') return area
  return 'Área por definir'
}

function getCourseTypeLabel(courseType: string | null | undefined): string {
  const normalized = normalizeStudyType(String(courseType || ''))
  const labels: Record<string, string> = {
    privados: 'Privado',
    desempleados: 'Desempleados',
    ocupados: 'Ocupados',
    teleformacion: 'Teleformación',
  }
  return normalized ? labels[normalized] || normalized : 'Curso'
}

function getCourseTypeColor(courseType: string | null | undefined): string {
  const normalized = normalizeStudyType(String(courseType || ''))
  const colors: Record<string, string> = {
    privados: '#f2014b',
    desempleados: '#2563eb',
    ocupados: '#16a34a',
    teleformacion: '#f97316',
  }
  return normalized ? colors[normalized] || BRAND_RED : BRAND_RED
}

function getCourseTitle(course: any): string {
  return String(course?.title || course?.name || 'Curso CEP')
}

function getCourseDescription(course: any): string {
  const value = course?.short_description || course?.description
  if (typeof value === 'string' && value.trim()) return value
  return 'Programa especializado con orientación práctica.'
}

function getRunCourseId(run: any): string | null {
  const course = run?.course
  if (typeof course === 'object' && course?.id) return String(course.id)
  if (course) return String(course)
  return null
}

function getTeacherHref(member: { name: string; href?: string; id?: string | number }): string {
  if (member.href) return member.href
  if (member.id) return `/p/profesores/${member.id}`
  return `/p/profesores/${slugify(member.name)}`
}

function getCategoryHref(item: { title: string; href?: string }): string {
  if (item.href && !['/cursos', '/p/cursos'].includes(item.href)) return item.href
  return `/p/areas/${slugify(item.title)}`
}

const CYCLE_LEVEL_META: Record<string, { label: string; bgColor: string; textColor: string }> = {
  grado_medio: { label: 'Grado Medio · CFGM', bgColor: '#2563EB', textColor: '#FFFFFF' },
  grado_superior: { label: 'Grado Superior · CFGS', bgColor: '#E3003A', textColor: '#FFFFFF' },
}

function getCycleLevelMeta(level: string | undefined) {
  if (!level) return null
  return CYCLE_LEVEL_META[level] ?? null
}

function getCycleSubtitle(cycle: any): string | null {
  const slug = String(cycle?.slug || '')
  const name = String(cycle?.name || '')
  if (slug.includes('farmacia') || name.toLowerCase().includes('farmacia')) {
    return 'Ciclo Formativo de Grado Medio (LOE) · Ref. SANMS · Semipresencial'
  }
  if (slug.includes('higiene-bucodental') || name.toLowerCase().includes('higiene')) {
    return 'Ciclo Formativo de Grado Superior (LOE) · Ref. SANSS · Semipresencial'
  }
  return null
}

function getCycleChips(cycle: any): string[] {
  const chips = [
    'Régimen LOE',
    'Titulación oficial reconocida por el Ministerio de Educación',
    'Modalidad semipresencial (1 día/semana presencial)',
  ]
  const practiceHours = cycle?.duration?.practiceHours
  chips.push(practiceHours && Number.isFinite(practiceHours) ? `${practiceHours}h de prácticas en empresa` : '500h de prácticas en empresa')
  const hasFSE = Array.isArray(cycle?.scholarships)
    && cycle.scholarships.some((s: any) => {
      const name = String(s?.name || '').toLowerCase()
      const description = String(s?.description || '').toLowerCase()
      return name.includes('fondo social europeo') || description.includes('fondo social europeo')
    })
  if (hasFSE) chips.push('Cofinanciado por el Fondo Social Europeo')
  return chips
}

async function HeroCarouselSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'heroCarousel' }>
  brandColor: string
}) {
  return <HeroCarouselClient section={section} brandColor={brandColor} />
}

function StatsStripSection({ section, brandColor }: { section: Extract<WebsiteSection, { kind: 'statsStrip' }>; brandColor: string }) {
  return (
    <section style={{ backgroundColor: brandColor }}>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 text-white sm:px-6 md:grid-cols-4 lg:px-8">
        {section.items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="text-3xl font-semibold">{item.value}</p>
            <p className="mt-1 text-sm text-white/80">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeatureStripSection({ section }: { section: Extract<WebsiteSection, { kind: 'featureStrip' }> }) {
  const title = section.title === 'Por qué CEP' ? 'Por qué elegir CEP' : section.title
  const subtitle = section.subtitle?.includes('Mismo tono de marca')
    ? 'Formación cercana, práctica y orientada a que avances con seguridad desde el primer contacto hasta el aula.'
    : section.subtitle
  const items = section.items.map((item) => item)

  return (
    <section className="bg-white" id={title === 'Por qué elegir CEP' ? 'por-que-cep' : undefined}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {title ? <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2> : null}
          {subtitle ? <p className="mt-4 text-lg leading-8 text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <article key={item.title} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-red-100 hover:shadow-xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-sm font-black text-[var(--cep-brand)] transition group-hover:bg-[var(--cep-brand)] group-hover:text-white">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 text-lg font-black leading-snug text-slate-950">{item.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBannerSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'ctaBanner' }>
  brandColor: string
}) {
  const isDark = section.theme === 'dark'
  const className = isDark ? 'bg-slate-950 text-white' : section.theme === 'brand' ? 'text-white' : 'bg-white text-slate-950'
  return (
    <section className={className} style={section.theme === 'brand' ? { backgroundColor: brandColor } : undefined}>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">{section.title}</h2>
          <p className={`mt-3 max-w-2xl ${isDark ? 'text-white/75' : 'text-slate-600'}`}>{section.body}</p>
        </div>
        {section.cta ? (
          <Link
            href={section.cta.href}
            className={`rounded-full px-6 py-3 text-sm font-semibold ${isDark ? 'bg-white text-slate-950' : 'text-white'}`}
            style={!isDark ? { backgroundColor: brandColor } : undefined}
          >
            {section.cta.label}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

async function CourseListSection({
  section,
  brandColor,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'courseList' }>
  brandColor: string
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'courses',
    where: withTenantScope({ active: { equals: true } }, tenantId) as any,
    depth: 1,
    limit: section.limit ?? 6,
    sort: section.title?.toLowerCase().includes('nuevas') ? '-createdAt' : 'name',
  })
  const runsResult = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['published', 'enrollment_open'] } }, tenantId) as any,
    depth: 2,
    limit: 200,
    sort: 'start_date',
  })
  const nextRunByCourse = new Map<string, any>()
  for (const run of runsResult.docs as any[]) {
    const courseId = getRunCourseId(run)
    if (!courseId || nextRunByCourse.has(courseId)) continue
    nextRunByCourse.set(courseId, run)
  }
  const requestedTypes = (section.courseTypes ?? [])
    .map((value) => normalizeStudyType(value))
    .filter((value): value is NonNullable<typeof value> => Boolean(value))

  const docs = result.docs.filter((course: any) => {
    const normalizedStudyType = normalizeStudyType(String(course.course_type || ''))
    if (!requestedTypes.length && (normalizedStudyType === 'ciclo_medio' || normalizedStudyType === 'ciclo_superior')) {
      return false
    }
    if (requestedTypes.length && (!normalizedStudyType || !requestedTypes.includes(normalizedStudyType))) {
      return false
    }
    if (section.featuredOnly && !course.featured) return false
    return true
  })

  return (
    <section id={section.title?.toLowerCase().includes('nuevas') ? 'nuevas-formaciones' : undefined} className="bg-[#fff7fa]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{section.subtitle}</p> : null}
        {docs.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">
            <p className="text-base text-slate-700">
              Próximamente nuevos cursos de especialización. Consulta nuestras convocatorias abiertas.
            </p>
            <Link
              href="/convocatorias"
              className="mt-5 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              Ver convocatorias
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((course: any) => {
              const title = getCourseTitle(course)
              const description = getCourseDescription(course)
              const imageUrl = resolveImageUrl(course.featured_image) || resolveImageUrl(course.image)
              const nextRun = nextRunByCourse.get(String(course.id))
              const campus = typeof nextRun?.campus === 'object' && nextRun.campus ? nextRun.campus : null
              const normalizedStudyType = normalizeStudyType(String(course.course_type || ''))
              const isTeleformacion = normalizedStudyType === 'teleformacion'
              const typeColor = getCourseTypeColor(course.course_type)
              return (
                <Link key={course.id} href={`/cursos/${course.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-56 overflow-hidden">
                    {imageUrl ? <img src={imageUrl} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                    <h3 className="absolute bottom-5 left-5 right-5 text-xl font-semibold text-white">{title}</h3>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white" style={{ backgroundColor: typeColor }}>
                        {getCourseTypeLabel(course.course_type)}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                        {getCourseArea(course)}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-7 text-slate-600">
                      {description || (isTeleformacion ? 'Formación online para avanzar a tu ritmo, con matrícula abierta permanente.' : 'Programa especializado con orientación práctica.')}
                    </p>
                    <div className="mt-5 grid gap-2 text-sm text-slate-700">
                      <p><span className="font-semibold text-slate-950">Fecha:</span> {isTeleformacion ? 'Inicio inmediato' : formatDate(nextRun?.start_date)}</p>
                      <p><span className="font-semibold text-slate-950">Sede:</span> {isTeleformacion ? '100% online · desde casa' : (campus?.name || 'Por confirmar')}</p>
                    </div>
                    <span className="mt-6 inline-flex w-fit items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--cep-brand)]">
                      {isTeleformacion ? 'Empezar ahora' : 'Ver curso'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

async function CycleListSection({
  section,
  brandColor,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'cycleList' }>
  brandColor: string
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'cycles',
    where: withTenantScope({ active: { equals: true } }, tenantId) as any,
    depth: 1,
    limit: section.limit ?? 6,
    sort: 'name',
  })

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-slate-600">{section.subtitle}</p> : null}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {result.docs.map((cycle: any) => {
            const imageUrl = resolveImageUrl(cycle.image)
            const levelMeta = getCycleLevelMeta(cycle.level)
            const subtitle = getCycleSubtitle(cycle)
            const chips = getCycleChips(cycle)
            return (
              <Link key={cycle.id} href={`/ciclos/${cycle.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-64">
                  {imageUrl ? <img src={imageUrl} alt={cycle.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p
                      className="mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                      style={levelMeta ? { backgroundColor: levelMeta.bgColor, color: levelMeta.textColor } : undefined}
                    >
                      {levelMeta?.label || cycle.level}
                    </p>
                    <h3 className="text-xl font-semibold text-white">{cycle.name}</h3>
                  </div>
                </div>
                <div className="flex flex-1 flex-col space-y-4 p-6">
                  {subtitle ? <p className="text-sm leading-6 text-slate-700">{subtitle}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <span key={`${cycle.id}-${chip}`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className="mt-auto inline-flex w-fit rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-[var(--cep-brand)]">
                    Ver ciclo
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

async function ConvocationListSection({
  section,
  brandColor,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'convocationList' }>
  brandColor: string
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'course-runs',
    where: withTenantScope({ status: { in: ['published', 'enrollment_open'] } }, tenantId) as any,
    depth: 2,
    limit: section.limit ?? 4,
    sort: '-start_date',
  })

  const grouped = new Map<string, { title: string; city?: string; docs: any[] }>()
  for (const conv of result.docs) {
    const campus = typeof conv.campus === 'object' && conv.campus ? conv.campus : null
    const key = campus?.id ? String(campus.id) : 'online'
    if (!grouped.has(key)) {
      grouped.set(key, {
        title: campus?.name || 'Modalidad Online / Sin sede fija',
        city: campus?.city || undefined,
        docs: [],
      })
    }
    grouped.get(key)!.docs.push(conv)
  }

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold">{section.title}</h2>
        {section.subtitle ? <p className="mt-3 max-w-2xl text-white/70">{section.subtitle}</p> : null}
        <div className="mt-10 space-y-10">
          {Array.from(grouped.entries()).map(([groupKey, group]) => (
            <div key={groupKey}>
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-white/90">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10Z" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
                <span>{group.title}{group.city ? ` — ${group.city}` : ''}</span>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {group.docs.map((conv: any) => {
            const course = typeof conv.course === 'object' ? conv.course : null
            const cycle = typeof conv.cycle === 'object' ? conv.cycle : null
            const displayName = cycle?.name || course?.name || course?.title || conv.codigo
            const imageUrl =
              resolveImageUrl(course?.featured_image) || resolveImageUrl(course?.image) || resolveImageUrl(cycle?.image)
            return (
              <Link key={conv.id} href={`/convocatorias/${conv.codigo || conv.id}`} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="relative h-52">
                  {imageUrl ? <img src={imageUrl} alt={displayName} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="h-full w-full" style={{ backgroundColor: brandColor }} />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase text-white" style={{ backgroundColor: brandColor }}>
                      Inscripción abierta
                    </span>
                    <h3 className="text-xl font-semibold">{displayName}</h3>
                  </div>
                </div>
              </Link>
            )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

async function CampusListSection({
  section,
  tenantId,
}: {
  section: Extract<WebsiteSection, { kind: 'campusList' }>
  tenantId: string
}) {
  const payload = await getPayload({ config: configPromise })
  const campusResult = await payload.find({
    collection: 'campuses',
    where: withTenantScope({ active: { equals: true } }, tenantId) as any,
    depth: 1,
    limit: section.limit ?? 3,
    sort: 'name',
  })

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{section.title}</h2>
        {section.subtitle ? (
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            Conoce nuestros centros en Tenerife, visita sus instalaciones y elige la sede que mejor encaja con tu formación.
          </p>
        ) : null}
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {campusResult.docs.map((campus: any) => {
            const imageUrl = resolveImageUrl(campus.image)
            const schedule = campus?.schedule?.weekdays || campus?.schedule?.saturday || 'Horario pendiente'
            return (
              <Link key={campus.id} href={`/sedes/${campus.slug}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-72 overflow-hidden">
                  {imageUrl ? <img src={imageUrl} alt={campus.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full w-full bg-slate-200" />}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
                </div>
                <div className="space-y-4 p-7">
                  <h3 className="text-2xl font-black text-slate-950">{campus.name}</h3>
                  <p className="text-base leading-7 text-slate-600">{campus.city}{campus.address ? ` · ${campus.address}` : ''}</p>
                  <div className="grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
                    {campus.phone ? <p><span className="font-bold text-slate-950">Teléfono:</span> {campus.phone}</p> : null}
                    <p><span className="font-bold text-slate-950">Horario:</span> {schedule}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition group-hover:bg-[var(--cep-brand)]">
                    Visitar sede
                    <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CategoryGridSection({ section }: { section: Extract<WebsiteSection, { kind: 'categoryGrid' }> }) {
  const subtitle = section.subtitle?.includes('Bloques visuales')
    ? 'Encuentra tu próxima formación por especialidad profesional.'
    : section.subtitle
  return (
    <section className="bg-[#fff7fa]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {subtitle ? <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p> : null}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => {
            const content = (
              <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative h-56 overflow-hidden">
                  <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--cep-brand)]">
                    Área
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black uppercase leading-tight text-slate-950">{item.title.replace(/^Área\s+/i, '')}</h3>
                  <span className="mt-5 inline-flex items-center text-sm font-bold text-[var(--cep-brand)]">
                    Ver formaciones
                    <svg className="ml-2 h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </article>
            )
            return item.href ? (
              <Link key={item.title} href={getCategoryHref(item)} aria-label={`Ver cursos de ${item.title}`}>
                {content}
              </Link>
            ) : (
              <Link key={item.title} href={getCategoryHref(item)} aria-label={`Ver cursos de ${item.title}`}>
                {content}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function TeamGridSection({ section }: { section: Extract<WebsiteSection, { kind: 'teamGrid' }> }) {
  const subtitle = section.subtitle?.includes('Presentación editorial')
    ? 'Conoce a nuestro equipo docente y su experiencia profesional por áreas.'
    : section.subtitle
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-slate-900">{section.title}</h2>
        {subtitle ? <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p> : null}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {section.members.map((member) => (
            <Link
              key={member.name}
              href={getTeacherHref(member)}
              className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex justify-center bg-white p-6">
                <img src={member.image} alt={member.name} loading="lazy" decoding="async" className="h-48 w-48 rounded-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="p-5">
                <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cep-brand)]">
                  Docente
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{member.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{member.role}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function LeadFormSection({
  section,
  brandColor,
}: {
  section: Extract<WebsiteSection, { kind: 'leadForm' }>
  brandColor: string
}) {
  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">{section.title}</h2>
          {section.subtitle ? <p className="mt-3 text-white/70">{section.subtitle}</p> : null}
        </div>
        <form className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Nombre" />
          <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Email" />
          <input className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Teléfono" />
          <textarea className="min-h-28 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/40" placeholder="Cuéntanos qué te interesa" />
          <button type="button" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: brandColor }}>
            Solicitar información
          </button>
        </form>
      </div>
    </section>
  )
}

async function renderSection(
  section: WebsiteSection,
  brandColor: string,
  tenantId: string
): Promise<React.ReactNode> {
  switch (section.kind) {
    case 'heroCarousel':
      return <HeroCarouselSection section={section} brandColor={brandColor} />
    case 'statsStrip':
      return <StatsStripSection section={section} brandColor={brandColor} />
    case 'featureStrip':
      return <FeatureStripSection section={section} />
    case 'ctaBanner':
      return <CtaBannerSection section={section} brandColor={brandColor} />
    case 'courseList':
      return <CourseListSection section={section} brandColor={brandColor} tenantId={tenantId} />
    case 'cycleList':
      return <CycleListSection section={section} brandColor={brandColor} tenantId={tenantId} />
    case 'convocationList':
      return <ConvocationListSection section={section} brandColor={brandColor} tenantId={tenantId} />
    case 'campusList':
      return <CampusListSection section={section} tenantId={tenantId} />
    case 'categoryGrid':
      return <CategoryGridSection section={section} />
    case 'teamGrid':
      return <TeamGridSection section={section} />
    case 'leadForm':
      return <LeadFormSection section={section} brandColor={brandColor} />
    default:
      return null
  }
}

function normalizeHomeSections(sections: WebsiteSection[]): WebsiteSection[] {
  const visible = sections.filter((section) => section.enabled !== false)
  const hasNewFormations = visible.some((section) => {
    const title = 'title' in section ? section.title : ''
    return section.id === 'nuevas-formaciones' || title?.toLowerCase().includes('nuevas formaciones')
  })
  if (hasNewFormations) return visible

  const newFormationsSection: WebsiteSection = {
    id: 'nuevas-formaciones',
    kind: 'courseList',
    title: 'Nuevas formaciones',
    subtitle: 'Programas que estamos preparando para ampliar la oferta formativa de CEP.',
    limit: 3,
  }

  const cycleIndex = visible.findIndex((section) => section.kind === 'cycleList')
  if (cycleIndex === -1) return [...visible, newFormationsSection]
  return [
    ...visible.slice(0, cycleIndex + 1),
    newFormationsSection,
    ...visible.slice(cycleIndex + 1),
  ]
}

export async function WebsiteRenderer({
  page,
  brandColor,
}: {
  page: WebsitePage
  brandColor: string
}) {
  const tenant = await getTenantHostBranding()
  const visibleSections = page.pageKind === 'home'
    ? normalizeHomeSections(page.sections)
    : page.sections.filter((section) => section.enabled !== false)
  const sections = await Promise.all(
    visibleSections.map(async (section, index) => (
      <div key={section.id || `${section.kind}-${index}`}>
        {await renderSection(section, brandColor, tenant.tenantId)}
      </div>
    ))
  )
  return <>{sections}</>
}
